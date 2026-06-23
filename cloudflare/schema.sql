CREATE TABLE IF NOT EXISTS player_snapshots (
  version TEXT PRIMARY KEY,
  snapshot_hash TEXT NOT NULL,
  formula_version TEXT NOT NULL,
  source_attribution TEXT NOT NULL,
  player_count INTEGER NOT NULL,
  zero_g_storage_uri TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  snapshot_version TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  squad TEXT NOT NULL,
  shirt_number INTEGER NOT NULL,
  position TEXT NOT NULL,
  detailed_position TEXT NOT NULL,
  age INTEGER,
  height INTEGER,
  club TEXT,
  stats_source TEXT NOT NULL,
  rating_source TEXT NOT NULL,
  world_rating INTEGER NOT NULL,
  attributes_json TEXT NOT NULL,
  provider_ids_json TEXT NOT NULL,
  source_attribution TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_snapshot_country
ON players(snapshot_version, country_code);

CREATE INDEX IF NOT EXISTS idx_players_snapshot_position
ON players(snapshot_version, position);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  snapshot_version TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL,
  lineup_hash TEXT,
  result_hash TEXT,
  zero_g_storage_uri TEXT,
  created_at TEXT NOT NULL
);
