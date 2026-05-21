# Notion Place Picker

Local web app for filling and fixing the **Place** property in your Notion databases.

Notion's Place property (used for the Map view) doesn't accept manual coordinates through the GUI, and its built-in geocoder misses or wrongly places many real-world locations. This app talks to Notion via API version `2025-09-03`, which fully supports reading and writing the Place property, so you can click a spot on a map (or geocode a free-text address) and save it back to your database.

## Setup

1. **Create a Notion integration**
   - Go to <https://www.notion.so/profile/integrations> and create a new internal integration.
   - Copy the integration secret (starts with `ntn_` or `secret_`).
   - Open the database you want to edit in Notion → `...` menu → **Connections** → add your new integration.

2. **Install & run**

   ```sh
   npm install
   npm run dev
   ```

   Open the printed local URL (defaults to <http://localhost:5173>). Paste your integration token in the setup screen — it gets written to a gitignored `.env` file at the project root (mode 0600) and is never sent anywhere except to Notion. You can also pre-fill `.env` yourself (see `.env.example`) or set the `NOTION_TOKEN` environment variable to skip the setup screen entirely.

## How it works

- **Backend** (`server/`) — Node + Express acts as a thin authenticated proxy in front of the Notion API and Nominatim. The Notion token never reaches the browser.
- **Frontend** (`web/`) — React + Vite. The map is Leaflet + OpenStreetMap tiles (no map API key needed).
- **Notion API** — pinned to `Notion-Version: 2025-09-03`. Uses the data-source-aware endpoints (`/v1/data_sources/{id}/query`) and writes Place values via `PATCH /v1/pages/{id}` with `{ "properties": { "<PlaceProperty>": { "place": { "lat": ..., "lon": ..., "name": ..., "address": ... } } } }`.

## Scripts

- `npm run dev` — start backend and frontend concurrently.
- `npm run build` — build both for production.
- `npm run typecheck` — type-check both.

## Credit

The Place-via-API trick was documented in [this Reddit post](https://www.reddit.com/r/Notion/comments/1sap8n5/notions_place_property_is_fully_writable_via_api/).
