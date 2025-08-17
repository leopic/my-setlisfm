// TypeScript interfaces for database entities
// These match the database schema exactly

export interface DBCountry {
  code: string;
  name?: string;
}

export interface DBCity {
  id: string;
  name?: string;
  state?: string;
  stateCode?: string;
  countryCode?: string;
  coordsLat?: number;
  coordsLong?: number;
}

export interface DBArtist {
  mbid: string;
  tmid?: number;
  name?: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
}

export interface DBVenue {
  id: string;
  name?: string;
  cityId?: string;
  url?: string;
}

export interface DBTour {
  name: string;
}

export interface DBSetlist {
  id: string;
  versionId?: string;
  artistMbid?: string;
  venueId?: string;
  tourName?: string;
  eventDate?: string;
  lastUpdated?: string;
  lastFmEventId?: number;
  info?: string;
  url?: string;
}

export interface DBSet {
  id: number;
  setlistId: string;
  name?: string;
  encore?: number;
  songOrder: number;
}

export interface DBSong {
  id: number;
  setId: number;
  name?: string;
  tape?: boolean;
  info?: string;
  withArtistMbid?: string;
  coverArtistMbid?: string;
  songOrder: number;
}

// Extended interfaces for joins and complete data
export interface SetlistWithDetails extends DBSetlist {
  artist?: DBArtist;
  venue?: DBVenue;
  city?: DBCity;
  country?: DBCountry;
  tour?: DBTour;
  sets?: SetWithSongs[];
}

export interface SetWithSongs extends DBSet {
  songs?: SongWithDetails[];
}

export interface SongWithDetails extends DBSong {
  withArtist?: DBArtist;
  coverArtist?: DBArtist;
}
