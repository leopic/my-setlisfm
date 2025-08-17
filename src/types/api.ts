// TypeScript interfaces for Setlist.fm API responses
// These match the official API schema exactly

export interface SetlistsResponse {
  type: string;
  itemsPerPage: number;
  page: number;
  total: number;
  setlist: Setlist[];
}

export interface Setlist {
  artist?: Artist;
  venue?: Venue;
  tour?: Tour;
  sets?: {
    set: Set[];
  };
  info?: string;
  url?: string;
  id?: string;
  versionId?: string;
  lastFmEventId?: number;
  eventDate?: string;
  lastUpdated?: string;
}

export interface Artist {
  mbid?: string;
  tmid?: number;
  name?: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
}

export interface Venue {
  city?: City;
  url?: string;
  id?: string;
  name?: string;
}

export interface City {
  id?: string;
  name?: string;
  state?: string;
  stateCode?: string;
  coords?: Coords;
  country?: Country;
}

export interface Coords {
  long?: number;
  lat?: number;
}

export interface Country {
  code?: string;
  name?: string;
}

export interface Tour {
  name?: string;
}

export interface Set {
  name?: string;
  encore?: number;
  song?: Song[];
}

export interface Song {
  name?: string;
  with?: Artist;
  cover?: Artist;
  info?: string;
  tape?: boolean;
}
