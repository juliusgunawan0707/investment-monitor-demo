# Investment Monitor (demo)

A dashboard for tracking private investment in a fictional integrated area: companies and
their stage in the onboarding pipeline, cooperation agreements (PKS), permits and construction
progress, contribution payments, meeting updates and a land allocation map.

**All data in this repository is synthetic.** Every company, person, number, date and map is
invented from a fixed random seed. The setting ("Integrated Area Management Agency", Zones A/B/C)
is fictional and does not describe any real organisation or place.

Work in progress: this README is a placeholder and will be expanded.

## Run it

The page loads its data with `fetch()`, so serve the folder over http (opening `index.html`
from disk will not work):

```
python -m http.server 8140
# then open http://localhost:8140/
```

## Features

- Progress monitoring table with filters, sorting, per-company checklist and 34-step pipeline
- Analytics charts, contribution payments with due-date schedule, meeting updates
- Fictional SVG land map (external view without names, internal view with names)
- Language switcher **EN | ID** in the header (English by default, choice remembered in the browser)
- Light and dark theme

## How the demo works

The page code talks to a backend through a `google.script.run`-style call chain. In this repo
`shim.js` recreates that call shape and answers from the JSON files in `data/`. Reading works as
usual; editing, adding and deleting only change an in-memory copy and show
"Demo mode - changes are not saved". Reload the page to reset.

```
index.html          the dashboard (single page)
i18n.js             EN | ID translation layer (applied at display time)
shim.js             static stand-in for the backend calls
data/*.json         synthetic payloads the page reads
assets/*.svg        fictional land maps (EN and ID labels)
tools/make_demo_data.py   generates the synthetic source sheets (seed 20261012)
```

`tools/make_demo_data.py` writes the synthetic sheets to `tools/_work/` (git-ignored). The
backend that turns sheets into the payloads in `data/` is not part of this repository.

## License

MIT - see `LICENSE`.
