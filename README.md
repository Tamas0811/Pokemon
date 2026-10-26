# Should I Evolve This Pokémon?

Live site: https://tamas0811.github.io/Pokemon/

A small static website that helps answer *"Should I evolve this Pokémon?"*. Pick a Pokémon and the site compares it with every Pokémon it can evolve into. It shows the change in each base stat, the base stat total, type changes and ability changes, and gives a verdict:

- **Yes**: every stat goes up and the type stays the same.
- **Yes, with trade-offs**: the total goes up, but some stats drop or the type changes.
- **It depends**: the base stat total stays the same and the stats are only redistributed (e.g. Scyther → Scizor).
- **Probably not**: the base stat total goes down (e.g. Nincada → Shedinja).
- **Choose**: the Pokémon has several possible evolutions (e.g. Eevee), each one assessed separately.

## Data

All data comes from `pokemon.csv` (Generations 1–6, default forms of 721 species). Evolutions are linked through the `evolves_from_species_id` column. Images come from the `url_image` column and are stored in `images/`. Diancie, Hoopa and Volcanion have no image in the data and show a placeholder. Alternate forms (megas, Deoxys forms, etc.) are not listed.

## Files

- `index.html`: page structure
- `style.css`: styling
- `app.js`: loads the CSV and computes the comparison and verdict
- `pokemon.csv`: dataset
- `images/`: Pokémon sprites, named as in the CSV

To run locally, serve the folder (e.g. `python -m http.server`) rather than opening `index.html` directly, because browsers block loading the CSV from a `file://` page.
