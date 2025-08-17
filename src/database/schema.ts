// SQLite database schema for Setlist.fm data
// Matches official API schema exactly

export const CREATE_TABLES_SQL = `
  -- Artists table
  CREATE TABLE IF NOT EXISTS artists (
    mbid TEXT PRIMARY KEY,
    tmid INTEGER,
    name TEXT,
    sortName TEXT,
    disambiguation TEXT,
    url TEXT
  );

  -- Countries table
  CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY,
    name TEXT
  );

  -- Cities table
  CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT,
    state TEXT,
    stateCode TEXT,
    countryCode TEXT,
    coordsLat REAL,
    coordsLong REAL,
    FOREIGN KEY (countryCode) REFERENCES countries(code)
  );

  -- Venues table
  CREATE TABLE IF NOT EXISTS venues (
    id TEXT PRIMARY KEY,
    name TEXT,
    cityId TEXT,
    url TEXT,
    FOREIGN KEY (cityId) REFERENCES cities(id)
  );

  -- Tours table
  CREATE TABLE IF NOT EXISTS tours (
    name TEXT PRIMARY KEY
  );

  -- Setlists table
  CREATE TABLE IF NOT EXISTS setlists (
    id TEXT PRIMARY KEY,
    versionId TEXT,
    artistMbid TEXT,
    venueId TEXT,
    tourName TEXT,
    eventDate TEXT,
    lastUpdated TEXT,
    lastFmEventId INTEGER,
    info TEXT,
    url TEXT,
    FOREIGN KEY (artistMbid) REFERENCES artists(mbid),
    FOREIGN KEY (venueId) REFERENCES venues(id),
    FOREIGN KEY (tourName) REFERENCES tours(name)
  );

  -- Sets table
  CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setlistId TEXT NOT NULL,
    name TEXT,
    encore INTEGER,
    songOrder INTEGER,
    FOREIGN KEY (setlistId) REFERENCES setlists(id)
  );

  -- Songs table
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setId INTEGER NOT NULL,
    name TEXT,
    tape BOOLEAN,
    info TEXT,
    withArtistMbid TEXT,
    coverArtistMbid TEXT,
    songOrder INTEGER,
    FOREIGN KEY (setId) REFERENCES sets(id),
    FOREIGN KEY (withArtistMbid) REFERENCES artists(mbid),
    FOREIGN KEY (coverArtistMbid) REFERENCES artists(mbid),
    UNIQUE(setId, name, songOrder)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_setlists_artist ON setlists(artistMbid);
  CREATE INDEX IF NOT EXISTS idx_setlists_venue ON setlists(venueId);
  CREATE INDEX IF NOT EXISTS idx_setlists_date ON setlists(eventDate);
  CREATE INDEX IF NOT EXISTS idx_sets_setlist ON sets(setlistId);
  CREATE INDEX IF NOT EXISTS idx_songs_set ON songs(setId);
`;
