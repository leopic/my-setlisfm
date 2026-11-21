import { databaseManager } from '@/database/database';
import { dbOperations } from '@/database/operations';
import { getTestDatabase, openDatabaseAsync } from '../../../test/expoSqliteNode';

const PHOTO = 'https://cdn.example/artist/a/250x250-000000-80-0-0.jpg';
const NEW_PHOTO = 'https://cdn.example/artist/b/250x250-000000-80-0-0.jpg';

const colorOf = (mbid: string) =>
  (
    getTestDatabase().prepare(`SELECT imageColor FROM artists WHERE mbid = ?`).get(mbid) as {
      imageColor: string | null;
    }
  ).imageColor;

// An install from before the column: the artists table has no imageColor yet.
beforeAll(async () => {
  const db = await openDatabaseAsync();
  await db.execAsync(`
    CREATE TABLE artists (mbid TEXT PRIMARY KEY, tmid INTEGER, name TEXT, sortName TEXT,
      disambiguation TEXT, url TEXT, imageUrl TEXT);
    INSERT INTO artists (mbid, name, imageUrl) VALUES ('old', 'Old Install', '${PHOTO}');
  `);
  await databaseManager.initialize();
});

beforeEach(() => {
  getTestDatabase().exec(`
    INSERT OR REPLACE INTO artists (mbid, name, imageUrl, imageColor)
    VALUES ('a', 'Artist', '${PHOTO}', '#c83232');
  `);
});

it('adds the color column to an existing install and keeps its artists', () => {
  const columns = getTestDatabase().prepare(`PRAGMA table_info(artists)`).all() as {
    name: string;
  }[];
  expect(columns.map((c) => c.name)).toContain('imageColor');
  expect(colorOf('old')).toBeNull();
});

it('forgets the color when the artist gets a new photo', async () => {
  await dbOperations.updateArtistImageUrl('a', NEW_PHOTO);

  expect(colorOf('a')).toBeNull();
});

it('forgets every color when the photos are cleared', async () => {
  await dbOperations.clearAllArtistImages();

  expect(colorOf('a')).toBeNull();
});

it("skips a color found for the artist's previous photo", async () => {
  await dbOperations.updateArtistImageUrl('a', NEW_PHOTO);

  await dbOperations.updateArtistImageColor('a', PHOTO, '#123456');
  expect(colorOf('a')).toBeNull();

  await dbOperations.updateArtistImageColor('a', NEW_PHOTO, '#123456');
  expect(colorOf('a')).toBe('#123456');
});
