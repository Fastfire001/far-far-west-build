"""Downloads the raw data build_data.py needs from farfarwest.wiki.gg.

Writes <out_dir>/cargo/*.json (Cargo table rows) and <out_dir>/pages/*.wiki (wikitext of the
equipment and spell pages, whose infoboxes hold stats missing from Cargo).

Usage: python3 scripts/fetch_wiki.py <out_dir>
"""
import json, os, sys, time, urllib.error, urllib.parse, urllib.request

API = "https://farfarwest.wiki.gg/api.php"
HEADERS = {"User-Agent": "far-far-west-build/0.1 (build planner data sync)"}
# Pause between requests: wiki.gg blocks clients that query too fast.
DELAY = 1.5

CARGO_TABLES = {
    # Some fields declared in Template:Cargo Equipment (fire intervals, charging speed...) do not exist
    # in the live table and make the query fail; those come from the page infoboxes instead.
    "equipment.json": ("Equipment", "_pageName=page,title,type,accuracy,total_ammo,bend_speed,clip_size,"
                       "primary_damage,primary_count,secondary_damage,secondary_count,weakspot_mult,"
                       "draw_speed,lifesteal,lingering_time,pickup_range,attack_range,reload_speed,"
                       "gold_cost,fragment_cost,xp_mult"),
    "spells.json": ("Spells", "_pageName=page,title,type,element,level_requirement,description,duration,"
                    "cooldown,damage_instant,damage_per_tick,tick_rate,radius_min,radius_max,"
                    "xp_multiplier,creates_puddles"),
    "combos.json": ("Spell_Combos", "title,description,archetype,target_type,damage_type,duration"),
    "combo_options.json": ("Spell_Combo_Options", "combo_title,spell_1,spell_2,ordered"),
}


def api(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    for attempt in range(5):
        time.sleep(DELAY)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as r:
                body = r.read()
            data = json.loads(body)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            # A rate-limited client gets an HTML "Blocked" page instead of JSON.
            wait = 15 * (attempt + 1)
            print(f"  request failed ({e.__class__.__name__}), retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
            continue
        if "error" in data:
            raise SystemExit(f"API error for {params}: {data['error']}")
        return data
    raise SystemExit(f"giving up on {url}")


def fetch_cargo(table, fields):
    rows, offset = [], 0
    while True:
        data = api({"action": "cargoquery", "tables": table, "fields": fields, "limit": 500, "offset": offset})
        batch = [row["title"] for row in data.get("cargoquery", [])]
        rows += batch
        if len(batch) < 500:
            return rows
        offset += 500


def fetch_pages(titles, out_dir):
    for i in range(0, len(titles), 50):
        data = api({"action": "query", "prop": "revisions", "rvprop": "content", "rvslots": "main",
                    "titles": "|".join(titles[i:i + 50])})
        for page in data["query"]["pages"].values():
            if "revisions" in page:
                with open(os.path.join(out_dir, page["title"].replace("/", "__") + ".wiki"), "w") as f:
                    f.write(page["revisions"][0]["slots"]["main"]["*"])


def main(out_dir):
    cargo_dir, pages_dir = os.path.join(out_dir, "cargo"), os.path.join(out_dir, "pages")
    os.makedirs(cargo_dir, exist_ok=True)
    os.makedirs(pages_dir, exist_ok=True)

    for filename, (table, fields) in CARGO_TABLES.items():
        rows = fetch_cargo(table, fields)
        with open(os.path.join(cargo_dir, filename), "w") as f:
            json.dump(rows, f, indent=1, ensure_ascii=False)
        print(f"{table}: {len(rows)} rows")

    pages = []
    for filename in ("equipment.json", "spells.json"):
        pages += [row["page"] for row in json.load(open(os.path.join(cargo_dir, filename)))]
    fetch_pages(sorted(set(pages)), pages_dir)
    print(f"pages: {len(os.listdir(pages_dir))}")


if __name__ == "__main__":
    main(sys.argv[1])
