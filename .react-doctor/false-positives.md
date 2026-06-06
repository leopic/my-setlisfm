# React Doctor — false positives

## react-doctor/async-await-in-loop

All 8 instances are intentionally sequential:

- `src/services/artistImageService.ts:67` — outer loop processes batches with a
  mandatory 150 ms inter-batch rate-limit delay; parallelising batches would
  break the Deezer API rate limit.

- `src/services/setlistApi.ts:40` — retry loop; each attempt reads
  `lastRequestTime` written by the previous attempt and applies exponential
  back-off, so iterations are explicitly order-dependent.

- `src/services/setlistApi.ts:114` — pagination loop; `currentPage` is
  incremented based on `pageData.total / pageData.itemsPerPage` returned by
  the previous response — cumulative state, must stay sequential.

- `src/services/syncService.ts:90` — same pagination pattern as above.

- `src/services/dataProcessor.ts:29` — iterates over setlists and inserts
  country → city → venue → artist → setlist in dependency order; concurrent
  upserts could violate foreign-key constraints.

- `src/services/dataProcessor.ts:37` — iterates over pages of setlists;
  same DB ordering concern as above.

- `src/services/dataProcessor.ts:187` — loop over sets within a single setlist;
  inserts each set then queries it back to obtain the auto-generated ID before
  inserting child songs.

- `src/services/dataProcessor.ts:206` — loop over songs within a set;
  sequential DB inserts, no safe parallelism without explicit transactions.

## react-doctor/js-index-maps

- `src/services/dataProcessor.ts:192` — `insertedSets.find(…)` is called after
  a fresh `getSetsForSetlist` query inside the loop.  The searched array grows
  on every iteration (each loop pass inserts a new row), so a Map built before
  the loop would be stale by the next iteration — a pre-built index cannot be
  reused.
