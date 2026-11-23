import { dbOperations } from '@/database/operations';
import { seedDatabase } from '../../../test/database';

beforeAll(seedDatabase);
afterEach(() => jest.useRealTimers());

// The long-press menu opens a dashboard row's artist and venue, so the queries behind those
// rows return both ids. These run the real SQL on the seed; the UI tests can't reach these two
// rows (on this day depends on today; the seed has no 50th show).
// Seed: set-1 is Radiohead (artist-1) at Madison Square Garden (venue-1) on 15-03-2024.

it('gives the milestones their artist and venue', async () => {
  const { milestones } = await dbOperations.getInsightStats();
  expect(milestones[0]).toMatchObject({
    number: 1,
    setlistId: 'set-1',
    artistMbid: 'artist-1',
    venueId: 'venue-1',
  });
});

it('gives the concert on this day its artist and venue', async () => {
  // Only Date is faked: the database calls still need real timers.
  jest.useFakeTimers({
    now: new Date(2026, 2, 15),
    doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval', 'queueMicrotask'],
  });
  const expected = { setlistId: 'set-1', artistMbid: 'artist-1', venueId: 'venue-1' };
  expect(await dbOperations.getOnThisDayConcert()).toMatchObject(expected);
  expect(await dbOperations.getOnThisDayConcertForYear('2024')).toMatchObject(expected);
});
