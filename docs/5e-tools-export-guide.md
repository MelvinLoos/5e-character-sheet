# Guide: Exporting Spells and Feats from 5e.tools

This guide explains how to obtain and export Spells and Feats data from **5e.tools** in the JSON format expected by this application's import utility (`fiveToolsAdapter.ts`).

---

## Method 1: Downloading Raw JSON from the Official Data Repository (Recommended)

The most reliable and complete way to get the raw JSON files is directly from the official 5e.tools data repository on GitHub. This ensures you get the exact schema structure that the adapter expects.

### For Spells:
1. Open your browser and navigate to the official 5e.tools data repository or a mirror (e.g., `https://github.com/TheGiddyLimit/5etools-data`).
2. Navigate to the `data/spells/` directory.
3. Locate the file for the source book you want to import:
   - `spells-phb.json` (Player's Handbook)
   - `spells-xge.json` (Xanathar's Guide to Everything)
   - `spells-tce.json` (Tasha's Cauldron of Everything)
4. Click on the file, then click the **Raw** button in the top-right of the file view to view the raw JSON.
5. Right-click anywhere on the page and select **Save As...** (or press `Ctrl + S` / `Cmd + S`) to save the file as `.json`.

### For Feats:
1. Navigate to the `data/` directory in the same repository.
2. Locate the `feats.json` file.
3. Click on the file, click **Raw**, and save it to your computer as `feats.json`.

---

## Method 2: Exporting directly from the 5e.tools Website

If you want to export a custom list or filtered selection of spells/feats, you can do so directly from the website interface.

### Steps:
1. Go to [5e.tools](https://5e.tools/) and navigate to the **Spells** or **Feats** page.
2. (Optional) Use the sidebar filters to select specific sources, levels, or classes.
3. Click on the **Utilities** or **Settings** gear icon (usually located in the top-right or top-left of the list controls).
4. Look for the **Export List** or **Download** option:
   - On the Spells page, you can click the **"Download JSON"** or **"Export"** button.
   - Ensure the export format is set to **JSON**.
5. Save the generated file to your local machine.

---

## How the Import Works in this App

Once you have the JSON file, the application processes it using the `fiveToolsAdapter.ts` utility.

### Expected JSON Structure

#### Spells:
The adapter expects a JSON object containing a `spell` array:
```json
{
  "spell": [
    {
      "name": "Fireball",
      "level": 3,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 150 } },
      "components": { "v": true, "s": true, "m": "a tiny ball of bat guano and sulfur" },
      "duration": [{ "type": "instant" }],
      "entries": [
        "A bright streak flashes from your pointing finger..."
      ],
      "source": "PHB"
    }
  ]
}
```

#### Feats:
The adapter expects a JSON object containing a `feat` array:
```json
{
  "feat": [
    {
      "name": "Actor",
      "source": "PHB",
      "ability": [
        { "cha": 1 }
      ],
      "entries": [
        "Skilled at mimicry and dramatics, you gain the following benefits:",
        {
          "type": "list",
          "items": [
            "Increase your Charisma score by 1, to a maximum of 20.",
            "You have advantage on Charisma (Deception) and Charisma (Performance) checks..."
          ]
        }
      ]
    }
  ]
}
```

### Sanitization and Mapping
The `fiveToolsAdapter.ts` automatically:
- Converts 5e.tools inline tags (like `{@spell Fireball}`, `{@damage 8d6}`, `{@dc 15}`) into clean Markdown.
- Maps abbreviated sources (e.g., `PHB` -> `Player's Handbook`).
- Maps abbreviated schools (e.g., `E` -> `Evocation`).
- Parses complex duration, range, and casting time objects into human-readable strings.