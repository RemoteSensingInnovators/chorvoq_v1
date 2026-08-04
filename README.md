# chorvoq_v1

Interactive 3D Earth-observation viewer for the Chorvoq Reservoir, Uzbekistan.
The project combines a Copernicus GLO-30 elevation model with Google Earth
Engine imagery in a WebGL terrain scene.

## Features

- Interactive orbit, zoom, and a solid soil-style terrain base
- Fixed `0.8x` terrain exaggeration
- Monthly Sentinel-2 True Color imagery
- Annual Dynamic World land-cover / land-use imagery and legend
- Year selection from 2020 through July 2026
- Month timeline limited to months with available imagery
- Local raster cache for faster repeat viewing
- English user interface

## Technology

- React 19 and TypeScript
- Vite
- WebGL 2 terrain renderer
- Google Earth Engine Node.js API
- Copernicus DEM GLO-30
- Sentinel-2 SR Harmonized
- Google Dynamic World V1

## Local setup

Requirements:

- Node.js 22 or newer
- A Google Earth Engine-enabled Google Cloud project
- An Earth Engine service-account JSON key

Install dependencies:

```bash
npm install
```

Create a local secret directory and place the service-account file at:

```text
.secrets/gee-service-account.json
```

The `.secrets` directory is ignored by Git. Never commit the JSON key.
Alternatively, set `GEE_SERVICE_ACCOUNT_JSON` to an absolute credential path.

Start the Earth Engine raster service:

```bash
node work/gee-tile-server.mjs
```

In a second terminal, start the web application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
```

The application requires the Earth Engine raster service. A static-only host
such as GitHub Pages cannot provide on-demand GEE rasters without a separate
backend deployment.

## Data and attribution

- Elevation: Copernicus DEM GLO-30
- Optical imagery: Copernicus Sentinel-2 SR Harmonized
- Land cover: Google Dynamic World V1
- Processing: Google Earth Engine

## Author

**Abdullajon Davlatov**

- Email: [abdulladavlatov777@gmail.com](mailto:abdulladavlatov777@gmail.com)
- LinkedIn: [Abdullajon Davlatov](https://www.linkedin.com/in/abdullajon-davlatov-10399a267/)
- Telegram: [Remote Sensing Innovators](https://t.me/RemoteSensing_Innovators)

