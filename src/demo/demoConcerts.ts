// Demo concerts for the self-healing talk: the hidden Demo screen (long-press the
// version in Settings) adds them one at a time. Each has one odd value that a
// setlist.fm sync never writes, so only these rows can reach the code paths the
// talk's seeded bugs live in. Every id starts with "demo-", which is how
// removeDemoConcerts() finds them.

export type DemoScreen = 'setlist' | 'artistConcerts' | 'venueConcerts' | 'city' | 'country';

export interface DemoConcert {
  number: number;
  artist: string;
  // Where the odd value shows: the screen to open after adding the concert, and the
  // name to tap there (as the app shows it).
  screen: DemoScreen;
  target: string;
  sql: string;
}

interface Place {
  cityId: string;
  city: string;
  state: string | null;
  stateCode: string | null;
  countryCode: string;
  country: string;
  lat: number | null;
  long: number | null;
}

interface Song {
  name: string;
  tape?: 1 | 2 | null;
  withArtistMbid?: string | null;
  order?: number | null;
}

interface DemoConcertSpec {
  number: number;
  artist: string | null;
  label: string;
  screen: DemoScreen;
  target: string;
  venue?: string | null;
  venueUrl?: string | null;
  place?: Place;
  eventDate: string;
  lastUpdated?: string;
  songs: Song[];
}

const LISBON: Place = {
  cityId: 'demo-city-lisbon',
  city: 'Lisbon',
  state: 'Lisboa',
  stateCode: '11',
  countryCode: 'PT',
  country: 'Portugal',
  lat: 38.7223,
  long: -9.1393,
};

const SONGS: Song[] = [{ name: 'Intro' }, { name: 'Hello World' }, { name: 'Goodbye World' }];

const sqlValue = (value: string | number | null | undefined) =>
  value === null || value === undefined
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${value.replace(/'/g, "''")}'`;

function toSql(spec: DemoConcertSpec): string {
  const id = `demo-${spec.number}`;
  const place = spec.place ?? LISBON;
  const venueUrl =
    spec.venueUrl === undefined ? `https://www.setlist.fm/venue/${id}.html` : spec.venueUrl;
  const songs = spec.songs
    .map(
      (song, index) =>
        `INSERT OR REPLACE INTO songs (setId, name, tape, withArtistMbid, songOrder)
         VALUES ((SELECT id FROM sets WHERE setlistId = '${id}'), ${sqlValue(song.name)},
                 ${sqlValue(song.tape)}, ${sqlValue(song.withArtistMbid)},
                 ${sqlValue(song.order === undefined ? index : song.order)});`,
    )
    .join('\n');

  return `
    INSERT OR IGNORE INTO countries (code, name)
    VALUES (${sqlValue(place.countryCode)}, ${sqlValue(place.country)});
    INSERT OR REPLACE INTO cities (id, name, state, stateCode, countryCode, coordsLat, coordsLong)
    VALUES (${sqlValue(place.cityId)}, ${sqlValue(place.city)}, ${sqlValue(place.state)},
            ${sqlValue(place.stateCode)}, ${sqlValue(place.countryCode)},
            ${sqlValue(place.lat)}, ${sqlValue(place.long)});
    INSERT OR REPLACE INTO venues (id, name, cityId, url)
    VALUES ('${id}', ${sqlValue(spec.venue === undefined ? `${spec.label} Hall` : spec.venue)},
            ${sqlValue(place.cityId)}, ${sqlValue(venueUrl)});
    INSERT OR REPLACE INTO artists (mbid, name, sortName, url)
    VALUES ('${id}', ${sqlValue(spec.artist)}, ${sqlValue(spec.artist)},
            'https://www.setlist.fm/setlists/${id}.html');
    INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, lastUpdated, url)
    VALUES ('${id}', '${id}', '${id}', ${sqlValue(spec.eventDate)},
            ${sqlValue(spec.lastUpdated ?? '2024-01-15T10:00:00.000+0000')},
            'https://www.setlist.fm/setlist/${id}.html');
    DELETE FROM songs WHERE setId IN (SELECT id FROM sets WHERE setlistId = '${id}');
    DELETE FROM sets WHERE setlistId = '${id}';
    INSERT INTO sets (setlistId, name, songOrder) VALUES ('${id}', 'Main Set', 0);
    ${songs}
  `;
}

const SPECS: DemoConcertSpec[] = [
  {
    // A tape intro stored as 2: a sync writes tape as 1 or NULL.
    number: 1,
    artist: 'Off By One',
    label: 'Off By One',
    screen: 'setlist',
    target: 'Off By One',
    eventDate: '03-02-2023',
    songs: [{ name: 'Intro', tape: 2 }, { name: 'Fencepost' }, { name: 'Last Index' }],
  },
  {
    // A day that does not exist: setlist.fm only sends real dates. Today's app shows it
    // as 3 March. (A date that is not DD-MM-YYYY, such as 'TBA', would sort and show
    // wrongly on the dashboard, which reads the date by position.)
    number: 2,
    artist: 'The Null Pointers',
    label: 'The Null Pointers',
    screen: 'setlist',
    target: 'The Null Pointers',
    eventDate: '31-02-2023',
    songs: SONGS,
  },
  {
    // A guest who is not in the artists table: a sync stores every guest.
    number: 3,
    artist: 'Heisenbug',
    label: 'Heisenbug',
    screen: 'setlist',
    target: 'Heisenbug',
    eventDate: '17-03-2023',
    songs: [
      { name: 'Now You See It' },
      { name: 'Observer Effect', withArtistMbid: 'demo-guest-missing' },
      { name: 'Gone Again' },
    ],
  },
  {
    // A song without a position: a sync numbers every song.
    number: 4,
    artist: 'Race Condition',
    label: 'Race Condition',
    screen: 'setlist',
    target: 'Race Condition',
    eventDate: '21-04-2023',
    songs: [{ name: 'First' }, { name: 'Second', order: null }, { name: 'Third' }],
  },
  {
    // An artist without a name: setlist.fm always sends one.
    number: 5,
    artist: null,
    label: 'Unnamed artist',
    screen: 'artistConcerts',
    target: 'Unknown Artist',
    eventDate: '12-05-2023',
    songs: SONGS,
  },
  {
    // A last-updated stamp that is not a timestamp: setlist.fm always sends ISO 8601.
    // No screen shows it today.
    number: 6,
    artist: 'Stack Overflow',
    label: 'Stack Overflow',
    screen: 'artistConcerts',
    target: 'Stack Overflow',
    eventDate: '21-06-2023',
    lastUpdated: 'unknown',
    songs: SONGS,
  },
  {
    // A venue without a setlist.fm link: setlist.fm always sends one.
    number: 7,
    artist: 'Segfault Sisters',
    label: 'Segfault Sisters',
    screen: 'venueConcerts',
    target: 'Segfault Sisters Hall',
    venueUrl: null,
    eventDate: '07-07-2023',
    songs: SONGS,
  },
  {
    // A city without coordinates.
    number: 8,
    artist: 'Infinite Loop',
    label: 'Infinite Loop',
    screen: 'city',
    target: 'Reykjavík',
    place: {
      cityId: 'demo-city-reykjavik',
      city: 'Reykjavík',
      state: 'Capital Region',
      stateCode: '1',
      countryCode: 'IS',
      country: 'Iceland',
      lat: null,
      long: null,
    },
    eventDate: '18-08-2023',
    songs: SONGS,
  },
  {
    // A three-letter country code: setlist.fm uses two letters.
    number: 9,
    artist: 'The Edge Cases',
    label: 'The Edge Cases',
    screen: 'country',
    target: 'Kosovo',
    place: {
      cityId: 'demo-city-pristina',
      city: 'Pristina',
      state: 'Pristina',
      stateCode: 'PR',
      countryCode: 'XKX',
      country: 'Kosovo',
      lat: 42.6629,
      long: 21.1655,
    },
    eventDate: '09-09-2023',
    songs: SONGS,
  },
  {
    // A venue without a name: setlist.fm always sends one.
    number: 10,
    artist: 'Undefined Behavior',
    label: 'Undefined Behavior',
    screen: 'venueConcerts',
    target: 'Unknown Venue',
    venue: null,
    eventDate: '14-10-2023',
    songs: SONGS,
  },
];

export const DEMO_CONCERTS: DemoConcert[] = SPECS.map((spec) => ({
  number: spec.number,
  artist: spec.label,
  screen: spec.screen,
  target: spec.target,
  sql: toSql(spec),
}));

// Removes every demo concert, and the demo cities and countries no real concert uses.
export const REMOVE_DEMO_CONCERTS_SQL = `
  DELETE FROM songs WHERE setId IN (SELECT id FROM sets WHERE setlistId LIKE 'demo-%');
  DELETE FROM sets WHERE setlistId LIKE 'demo-%';
  DELETE FROM setlists WHERE id LIKE 'demo-%';
  DELETE FROM venues WHERE id LIKE 'demo-%';
  DELETE FROM artists WHERE mbid LIKE 'demo-%';
  DELETE FROM cities WHERE id LIKE 'demo-%'
    AND id NOT IN (SELECT cityId FROM venues WHERE cityId IS NOT NULL);
  DELETE FROM countries WHERE code IN ('PT', 'IS', 'XKX')
    AND code NOT IN (SELECT countryCode FROM cities WHERE countryCode IS NOT NULL);
`;
