# React Doctor — false positives

Each entry below is suppressed inline with
`// react-doctor-disable-next-line <rule> -- <reason>` on the line above the
reported line. Keep a suppression only while its predicate still holds.

## react-doctor/async-await-in-loop

All 4 instances are in `src/services/dataProcessor.ts`. Predicate: each loop
body writes to SQLite in a fixed order, and a later iteration or step depends
on rows from an earlier one.

- `importSetlistsFromResponse` (`await this.processSetlist`) — each setlist
  upserts country → city → venue → artist → setlist in dependency order;
  concurrent upserts could violate foreign-key constraints.

- `importSetlistsFromPages` (`await this.importSetlistsFromResponse`) — pages
  write in order; same foreign-key concern as above.

- `processSets` (`await dbOperations.insertSet`) — inserts a set, then queries
  it back to get the auto-generated ID before inserting its songs.

- `processSongs` (`await this.processArtist(song.cover)`) — sequential DB
  upserts per song; no safe parallelism without an explicit transaction.

Not reported any more, so no suppression: the retry and pagination loops in
`src/services/setlistApi.ts` and `src/services/syncService.ts`, and the batch
loop in `src/services/artistImageService.ts`. If React Doctor reports them
again, they are sequential on purpose (rate limit, back-off,
page counter read from the previous response).

## react-doctor/exhaustive-deps

4 instances, one per list screen: `app/(tabs)/(artists)/index.tsx`,
`app/(tabs)/(concerts)/index.tsx`, `app/(tabs)/(stats)/index.tsx`,
`app/(tabs)/(venues)/index.tsx`.

Predicate: `lastSyncTimestamp` (from `useSyncContext()`) is in the deps of the
`useCallback` passed to `useFocusEffect`, and the callback body never reads it.
It is there on purpose, so the screen reloads after a sync finishes while the
screen is open. Removing it stops the reload. If the callback starts reading
`lastSyncTimestamp`, the warning is correct and the suppression is
not needed.

## react-doctor/js-index-maps

Not reported any more; entry removed. (It was the `insertedSets.find(…)` in
`processSets`: the array is re-queried on every iteration, so a pre-built Map
would be stale.)

## react-doctor/no-set-state-after-await-in-effect

- `app/(tabs)/(home)/index.tsx`, the `[lastSyncTimestamp]` effect: it calls
  `loadDashboard(() => cancelled)`, and `loadDashboard` checks `isCancelled()`
  before each state update (after `Promise.all` and in the catch path). The
  rule does not follow the callback. If `loadDashboard` gains a state update
  without that check, the warning is correct.
