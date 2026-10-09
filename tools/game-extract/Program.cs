// Reads assets from the Far Far West game archives (read-only) and writes them to an output directory.
//
// Usage: Extract <paks_dir> <out_dir> <request>...
//   raw:<asset path>    the asset's raw bytes, as <name>.uasset
//   names:<asset path>  the package name map, as <name>.names.txt (one name per line, by index)
//   json:<asset path>   the deserialized exports, as <name>.json
//   locres:<file path>  localization files (the path may contain a * wildcard), as <culture>.locres.json:
//                       {namespace: {key: translated string}}
//
// The game's assets use unversioned properties and no mappings file is available, so CUE4Parse can only
// deserialize classes described in Mappings() below. DataTables with Blueprint row structs are decoded
// from their raw bytes by scripts/build_game_data.py instead.
using System.Text.RegularExpressions;
using CUE4Parse.Compression;
using CUE4Parse.FileProvider;
using CUE4Parse.MappingsProvider;
using CUE4Parse.UE4.Assets;
using CUE4Parse.UE4.Localization;
using CUE4Parse.UE4.Readers;
using CUE4Parse.UE4.Versions;
using Newtonsoft.Json;
using Serilog;

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

foreach (var request in args.Skip(2))
{
    var (mode, path) = (request[..request.IndexOf(':')], request[(request.IndexOf(':') + 1)..]);
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
        case "locres":
            // The path may contain a * wildcard, e.g. FarFarWest/Content/Localization/Game/*/Game.locres.
            var pattern = new Regex("^" + Regex.Escape(path).Replace("\\*", "[^/]+") + "$", RegexOptions.IgnoreCase);
            var files = provider.Files.Keys.Where(k => pattern.IsMatch(k)).ToList();
            if (files.Count == 0)
                throw new FileNotFoundException($"no localization file matches {path}");
            foreach (var file in files)
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
        default:
            throw new ArgumentException($"unknown request mode '{mode}'");
    }
    Console.WriteLine($"{mode}: {path}");
}

// Engine classes whose serialized properties we need to read. They have no non-default tagged properties in
// the assets we load, so an empty layout is enough.
static TypeMappings Mappings()
{
    var mappings = new TypeMappings();
    foreach (var (name, super) in new[] { ("Object", (string?)null), ("StringTable", "Object") })
        mappings.Types[name] = new Struct(mappings, name, super, new Dictionary<int, PropertyInfo>(), 0);
    return mappings;
}

class StaticMappings(TypeMappings mappings) : ITypeMappingsProvider
{
    public TypeMappings MappingsForGame => mappings;
    public void Load(string path, StringComparer? comparer = null) { }
    public void Load(byte[] bytes, StringComparer? comparer = null) { }
    public void Reload() { }
}
