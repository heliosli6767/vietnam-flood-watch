# Vietnam Flood Watch

An English student research prototype with five regional study areas, a map, source-backed screening dashboard, and local scenario layers for Hue and Hoi An.

## Run locally

Requires Node.js 20+. No package installation or build step is required.

```sh
npm start
npm test
npm run refresh-data
```

Open http://127.0.0.1:4173. The refresh command requests NASA POWER and Open-Meteo and saves original JSON plus request URLs and retrieval times. The page's Refresh data button refreshes the current browser session; exported records include those responses. It does not change the bundled snapshots or run while the page is closed.

## Actual data use

- NASA POWER Daily Point API: PRECTOTCORR, mm/day. Latest three consecutive complete UTC days. The response identifies GEOSIT as its source. This is not GPM IMERG.
- Open-Meteo Forecast API: hourly precipitation, 0–1 cm model soil moisture, and elevation metadata. This is not NASA satellite soil moisture.
- johan/world.geo.json: bundled geographic country outlines. Five study polygons are approximate project-defined envelopes, not official administrative boundaries.
- OpenStreetMap Standard: optional online street basemap. Default is the bundled outline map, so core map interactions work without tiles.
- OSRM: bundled original driving-route geometries for example endpoints. Hue has two returned alternatives; Hoi An has one. Road closures and pedestrian evacuation suitability are not available.
- Local facility points, storm inputs and flood circles: clearly labelled illustrative project data.

The website's Data sources section links documentation, exact API requests and original snapshot JSON. The source records are in dist/data/manifest.json and the corresponding JSON files. No API keys or user location are collected.

## Index and limits

The index is an uncalibrated heuristic with weights 35% future rainfall, 25% past rainfall, 20% soil moisture, 10% low-elevation proxy and 10% river-rise rate. An unavailable factor contributes a range of zero to its full weight. It is never silently replaced by zero or reweighted. The missing river feed produces a 10-point interval in the source view.

No claim of flood probability, official warning, observed flood extent, verified facility, or safe route is made. Mountain flash floods require a different terrain/hydrology model. NASA POWER is delayed and the weather forecast has a different time window. Scenario route overlap measures synthetic circle intersections along actual road geometry; it is not observed hazard exposure.

NISAR, SMAP, IMERG, GEOS-FP, NASADEM and river gauge feeds are listed as future research sources only. No NISAR challenge compliance is claimed. This is AI-assisted code and interface; it is not endorsed by NASA.

## Hosting

Static output is dist/. Sites identity is tracked in .openai/hosting.json. The initial hosted site is owner-private. Use the Sites source workflow to publish future changes, preserving the existing audience unless explicitly changed.
