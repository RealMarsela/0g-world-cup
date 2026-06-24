# Data Sources

## Adapter Order

1. BALLDONTLIE FIFA World Cup API, when `BALLDONTLIE_API_KEY` exists.
2. API-Football, when `API_FOOTBALL_KEY` exists.
3. Sportmonks, when `SPORTMONKS_API_KEY` exists.
4. `jfjelstul/worldcup` as the historical/open fallback reference.
5. Local JSON demo snapshot at `data/snapshots/local-demo-source.json`.

The current app runtime uses the canonical historical Fjelstul snapshot generated into `src/worldcup/worldcupHistory.json`: `8,379` players across `368` men’s World Cup team-year squads from 1970 through 2022. The older local demo snapshot remains only as a tiny fallback fixture for the adapter pipeline.

## Adapter Environment

- BALLDONTLIE: `BALLDONTLIE_API_KEY` plus `BALLDONTLIE_WORLD_CUP_URL`.
- API-Football: `API_FOOTBALL_KEY` plus `API_FOOTBALL_PLAYERS_URL`.
- Sportmonks: `SPORTMONKS_API_KEY` plus `SPORTMONKS_PLAYERS_URL`.
- Fjelstul open fallback: set `USE_JFJELSTUL_FALLBACK=1`; the adapter imports 2022 squad rows from `data-csv/squads.csv` and `data-csv/players.csv`.

The live-provider adapters require explicit endpoint URLs because provider product paths and competition IDs vary by plan. They are key-gated and do not silently pretend live data exists.

Run `pnpm data:adapters` to inspect adapter status without mutating `data/work/`.

## Canonical Schema

Each rated player includes id, provider ids, name, shortName, country, countryCode, squad, shirtNumber, position, detailedPosition, age, height, club, stats source, rating source, 0G World Rating, seven attributes, snapshotVersion, and sourceAttribution.

## 0G World Rating

Formula version: `ogr-v1`.

The rating is original and does not copy EA/FIFA game ratings. It combines:

- position baseline,
- national-team strength uplift,
- deterministic player-name seed for stable variance,
- role modifiers for forwards, midfielders, defenders, and keepers,
- clutch boost for shirt `10` and keepers.

The scripts store the formula version and rating explanation in `data/work/rated.json` and the published snapshot.

## Snapshot Publishing

`pnpm data:publish` writes:

- `data/published/<snapshotVersion>.json`
- `data/published/<snapshotVersion>.receipt.json`
- `data/published/<snapshotVersion>.d1.sql`
- `data/published/<snapshotVersion>.cloudflare-manifest.json`

The historical snapshot is mirrored through `pnpm data:publish-history-storage`, which writes `proof-artifacts/player-snapshot-latest.json` and the matching public artifact. Current status: the 4.35 MB historical snapshot is live on 0G Storage with root `0x536d977d3ccda6855efe75441df32fd3961259477750b80c7b1ab41dd68b4fee` and tx `0x6e572975026660140b36ee0135dc486b5b07204d953a3add8b89d5a27ee7d283`.

`pnpm proof:data-pipeline` verifies the adapter attempts, local import/normalize/rate/publish pipeline, generated D1/R2/KV manifest files, and the historical 0G Storage mirror as one proof artifact.
