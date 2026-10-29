// Reads assets from the Far Far West game archives (read-only) and writes them to an output directory.
//
// Usage: Extract <paks_dir> <out_dir> <request>...
//   raw:<asset path>    the asset's raw bytes, as <name>.uasset
//   names:<asset path>  the package name map, as <name>.names.txt (one name per line, by index)
//   json:<asset path>   the deserialized exports, as <name>.json
//   imports:<asset path>  the package import map, as <name>.imports.txt: line n is the path of the object that the
//                       package index -n refers to (empty if it cannot be resolved)
//   texture:<asset path>  a Texture2D, as textures/<name>.png
//   locres:<file path>  localization files as <culture>.locres.json:
//                       {namespace: {key: translated string}}
//   file:<file path>    a file that is not an asset (config, text…), as is, under its own name
//
// The game's assets use unversioned properties and no mappings file is available, so CUE4Parse can only
// deserialize classes described in Mappings() below. DataTables with Blueprint row structs are decoded
// from their raw bytes by scripts/build_game_data.py instead.
//
// Every path may contain * wildcards (any characters but /). In texture mode, a texture that cannot be decoded is
// reported and skipped: build_game_data.py fails if it needs it.
using System.Text.RegularExpressions;
using CUE4Parse.Compression;
using CUE4Parse.FileProvider;
using CUE4Parse.MappingsProvider;
using CUE4Parse.UE4.Assets;
using CUE4Parse.UE4.Assets.Exports.Texture;
using CUE4Parse.UE4.Localization;
using CUE4Parse.UE4.Objects.UObject;
using CUE4Parse.UE4.Readers;
using CUE4Parse.UE4.Versions;
using CUE4Parse_Conversion.Textures;
using Newtonsoft.Json;
using Serilog;
using SkiaSharp;

Log.Logger = new LoggerConfiguration().MinimumLevel.Error().WriteTo.Console().CreateLogger();

var (paksDir, outDir) = (args[0], args[1]);
Directory.CreateDirectory(outDir);

// Oodle is downloaded once into the cache volume.
await OodleHelper.InitializeAsync(Path.Combine("/cache", OodleHelper.OODLE_NAME_LINUX));

// Far Far West 0.2.x is built with Unreal Engine 5.6.
var provider = new DefaultFileProvider(paksDir, SearchOption.TopDirectoryOnly, new VersionContainer(EGame.GAME_UE5_6));
provider.Initialize();
provider.Mount();
provider.MappingsContainer = new StaticMappings(Mappings());

Directory.CreateDirectory(Path.Combine(outDir, "textures"));

foreach (var request in args.Skip(2))
{
    var (mode, pattern) = (request[..request.IndexOf(':')], request[(request.IndexOf(':') + 1)..]);
    foreach (var path in mode is "locres" or "file" ? [pattern] : Matching(provider, pattern, ".uasset"))
        Extract(provider, mode, path);
}

void Extract(DefaultFileProvider provider, string mode, string path)
{
    var name = Path.GetFileName(path);
    switch (mode)
    {
        case "raw":
            var bytes = provider.SaveAsset(provider.Files[path + ".uasset"]);
            File.WriteAllBytes(Path.Combine(outDir, name + ".uasset"), bytes);
            break;
        case "names":
            var package = (AbstractUePackage)provider.LoadPackage(path);
            File.WriteAllLines(Path.Combine(outDir, name + ".names.txt"), package.NameMap.Select(n => n.Name ?? ""));
            break;
        case "json":
            var exports = provider.LoadPackage(path).GetExports();
            File.WriteAllText(Path.Combine(outDir, name + ".json"), JsonConvert.SerializeObject(exports, Formatting.Indented));
            break;
        case "imports":
            var importer = (IoPackage)provider.LoadPackage(path);
            var imports = Enumerable.Range(1, importer.ImportMap.Length).Select(n =>
            {
                try { return importer.ResolvePackageIndex(new FPackageIndex(importer, -n))?.GetPathName() ?? ""; }
                catch (Exception) { return ""; }
            });
            File.WriteAllLines(Path.Combine(outDir, name + ".imports.txt"), imports);
            break;
        case "texture":
            try
            {
                var texture = provider.LoadPackage(path).GetExports().OfType<UTexture2D>().Single();
                using var bitmap = texture.Decode()?.ToSkBitmap() ?? throw new InvalidDataException($"cannot decode {texture.Format}");
                using var png = SKImage.FromBitmap(bitmap).Encode(SKEncodedImageFormat.Png, 100);
                File.WriteAllBytes(Path.Combine(outDir, "textures", name + ".png"), png.ToArray());
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"texture: {path} skipped: {e.Message}");
                return;
            }
            break;
        case "locres":
            // e.g. FarFarWest/Content/Localization/Game/*/Game.locres
            foreach (var file in Matching(provider, path, ""))
            {
                // .../Localization/Game/fr-FR/Game.locres → fr-FR.locres.json
                var culture = Path.GetFileName(Path.GetDirectoryName(file))!;
                var locres = new FTextLocalizationResource(new FByteArchive(file, provider.SaveAsset(provider.Files[file])));
                var table = locres.Entries.ToDictionary(
                    ns => ns.Key.Str,
                    ns => ns.Value.ToDictionary(e => e.Key.Str, e => e.Value.LocalizedString));
                File.WriteAllText(Path.Combine(outDir, culture + ".locres.json"), JsonConvert.SerializeObject(table, Formatting.Indented));
            }
            break;
        case "file":
            foreach (var file in Matching(provider, path, ""))
                File.WriteAllBytes(Path.Combine(outDir, Path.GetFileName(file)), provider.SaveAsset(provider.Files[file]));
            break;
        default:
            throw new ArgumentException($"unknown request mode '{mode}'");
    }
    Console.WriteLine($"{mode}: {path}");
}

// Paths of the files that match a path with * wildcards (any characters but /), without the given extension.
static List<string> Matching(DefaultFileProvider provider, string path, string extension)
{
    var pattern = new Regex("^" + Regex.Escape(path + extension).Replace("\\*", "[^/]+") + "$", RegexOptions.IgnoreCase);
    var files = provider.Files.Keys.Where(k => pattern.IsMatch(k)).Select(k => k[..^extension.Length]).Order().ToList();
    return files.Count > 0 ? files : throw new FileNotFoundException($"no file matches {path}{extension}");
}

// Engine classes whose serialized properties we need to read. StringTable has no non-default tagged properties in
// the assets we load, so an empty layout is enough. Texture2D needs the properties the game's icons serialize: their
// index is read from the unversioned header (indexes count the properties of the parent classes too), their type
// and name are deduced from their bytes (a 128×128 size, a GUID, LODGroup = 16 = TEXTUREGROUP_UI...). If a game
// update serializes another one, the texture is skipped with "Unknown property with value <index>".
static TypeMappings Mappings()
{
    var mappings = new TypeMappings();
    foreach (var (name, super) in new[] { ("Object", (string?)null), ("StringTable", "Object"), ("Texture", "Object") })
        mappings.Types[name] = new Struct(mappings, name, super, new Dictionary<int, PropertyInfo>(), 0);
    mappings.Types["Texture2D"] = new Struct(mappings, "Texture2D", "Texture", new Dictionary<int, PropertyInfo>
    {
        [4] = new(4, "ImportedSize", new PropertyType("StructProperty", "IntPoint")),
        [5] = new(5, "LightingGuid", new PropertyType("StructProperty", "Guid")),
        [8] = new(8, "CompressionSettings", new PropertyType("ByteProperty")),
        [15] = new(15, "LODGroup", new PropertyType("ByteProperty")),
        [31] = new(31, "UnknownBool31", new PropertyType("BoolProperty")),
    }, 32);
    return mappings;
}

class StaticMappings(TypeMappings mappings) : ITypeMappingsProvider
{
    public TypeMappings MappingsForGame => mappings;
    public void Load(string path, StringComparer? comparer = null) { }
    public void Load(byte[] bytes, StringComparer? comparer = null) { }
    public void Reload() { }
}
