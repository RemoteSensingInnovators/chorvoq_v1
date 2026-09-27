# Chorvoq Reservoir Observatory

An interactive 3D Earth-observation observatory for Chorvoq Reservoir. It combines Copernicus GLO-30 elevation, cloud-filled monthly Sentinel-2 True Color imagery, MODIS vegetation, and ERA5-Land climate signals.

## Features

- Chorvoq-only interactive reservoir workspace
- WebGL 2 terrain with orbit, zoom and a soil-style solid base
- Fixed `0.8x` terrain exaggeration
- Monthly Sentinel-2 Level-2A True Color imagery from May through October, with cloud gaps filled from the nearest clear observations
- Loading and error feedback while Google Earth Engine refreshes a raster
- Monthly MODIS NDVI, EVI, NDWI, evapotranspiration, and daytime land-surface-temperature charts
- Monthly ERA5-Land 2 m air temperature, precipitation, surface soil moisture, and solar-radiation charts
- Multi-photo preview, Wikipedia information, and direct Google Images/Yandex Images searches
- On-demand WebGL rendering to keep CPU/GPU usage low while the map is idle
- Responsive English interface and local raster cache

## Technology and data

- React 19, TypeScript and WebGL 2
- Google Earth Engine Node.js API (DEM, cloud-filled Sentinel-2 True Color and climate series)
- Copernicus DEM GLO-30 and Sentinel-2 SR Harmonized
- Reservoir boundaries from the supplied GeoJSON

## Local setup

Requires Node.js 22+, an Earth Engine-enabled Cloud project and an Earth Engine service-account JSON key.

### One-click Windows launch

Double-click `START-CHORVOQ.cmd`. It starts both the web application and the Copernicus/GEE raster service outside Codex, then opens `http://localhost:3001/` automatically. Keep the terminal window open while using the atlas.

```bash
npm install
```

Place the key at `.secrets/gee-service-account.json` or set `GEE_SERVICE_ACCOUNT_JSON` to its absolute path. The secret directory is ignored by Git.

```bash
node work/gee-tile-server.mjs
```

In a second terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The raster API starts automatically with the site on port `3460`. On-demand rasters require this backend; a static-only host cannot generate new imagery.

## Author

**Abdullajon Davlatov** — Satellite-based environmental monitoring and interactive terrain visualizations.

- Email: [abdulladavlatov777@gmail.com](mailto:abdulladavlatov777@gmail.com)
- LinkedIn: [Abdullajon Davlatov](https://www.linkedin.com/in/abdullajon-davlatov-10399a267/)
- Telegram: [Remote Sensing Innovators](https://t.me/RemoteSensing_Innovators)
