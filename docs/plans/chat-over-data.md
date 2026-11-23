# Chat over my concert data: research

Research from 2026-11-21. No code yet. The next step is the question set (see [Plan](#plan)).

## Goal

Ask the app questions in plain language and get correct answers from the local SQLite data, on the device:

- "When was the last time I saw Bad Religion?"
- "Did I see NOFX in 2023?"
- "When was the last time Turnstile played in Berlin?"

Follow-ups must work too: "When did I first see them?", "What about 2019?", "What did they play?".

## Summary

- Git holds **one** chat feature with **one** design, built on 2026-07-17 and removed on 2026-08-23. Regex patterns understood the question. The Apple model only filled in names for follow-ups.
- No attempt before Claude, and no text-to-SQL attempt in git.
- A run of the old code against the seed data shows why it failed. The worst problem is not "no answer". It is **wrong answers that look right**: it drops words it does not understand ("in Berlin") and answers the rest.
- Follow-ups worked only in the form "what about X?".
- Other apps solve this by letting the model fill **typed filters** or **tool calls**. Normal code runs the search. Nobody lets a small model write SQL.
- Plan: turn the old design around. The on-device model (Apple Foundation Models) picks one of 2–3 typed tools and fills its fields. Our code does fuzzy name matching and runs SQL we wrote. Follow-ups change the saved search, not the sentence. Write the question set first and run it on the Mac before any UI.
- My estimate: 70–80% that this works well for questions like the examples. That is a judgement, not a measurement. The question set gives the real number.

## History in git

| Commit    | Date       | What                                                                                                         |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `5efa243` | 2026-07-17 | First chat code on `feature/chat-nlu-query` (unreachable now; the branch was cleaned up)                     |
| `3eb2eba` | 2026-07-17 | "resolve follow-up references via on-device model fallback". Unmerged copy, before the branch was squashed   |
| `4bc66dd` | 2026-07-17 | Merged: "add on-device natural-language chat interface" (regex, fuzzy match, SQL and the model fallback)     |
| `850f07f` | 2026-07-17 | Month filters, strips lead-in words                                                                          |
| `737aa5b` | 2026-07-17 | Busiest year/month/week intents                                                                              |
| `75b9bbb` | 2026-07-17 | Ranking exclusion and "next one" follow-ups                                                                  |
| `fed0ce2` | 2026-07-17 | Venue and song/setlist intents. Last version before the removal                                              |
| `16e26a8` | 2026-08-23 | Removed: "rigid intent matching instead of real language understanding"                                      |
| `796ec97` | 2026-10-11 | #76 removed the leftover queries. Only `factQueries.ts` (concert recognition) stays, and it is not chat code |

What I searched:

- The 11 commits before Claude (2025-08-17 to 2025-08-25), the unmerged `feat/design-system` WIP (`68b261a`) and the 402 unreachable commits that `git fsck --unreachable --no-reflogs` listed on 2026-11-21 (the count grows as branches are cleaned up).
- The words chat, LLM, OpenAI, GPT, Claude, "natural language", NLP and text-to-SQL, as whole words, in every file of those commits. No matches. `tasks.md` from 2025 has no chat idea.
- Claude first appears as co-author on 2026-03-19 (`2fd9178`).
- The July work ran in a claude.ai cloud session (`https://claude.ai/code/session_01C3ni5UvB5F4ezAJi9NcatU`), so no local transcripts exist. That transcript may show what was tried before the first commit, for example the `fm_test` model tests that the comments in `coreferenceResolver.ts` mention.

Leo remembers 2–3 attempts. If another one existed, it was not committed.

## How the old design worked

The code lives in `src/services/chat/` and `src/database/chatQueries.ts` (read it with `git show fed0ce2:<path>`).

1. 46 regex intents in `intents.ts`. Each pattern must match the whole sentence (`^…$`) and has named slots (`artist`, `city`, `year`, …).
2. `entityResolver.ts` fuzzy-matches each slot against the DB: Levenshtein similarity, `MIN_SCORE = 0.5`, a 0.85 bonus when one string contains the other, a 0.9 bonus for a prefix, `AMBIGUITY_MARGIN = 0.08` (closer than that → ask "which one?").
3. Each intent runs its own parameterized SQL (`chatQueries.ts`).
4. Follow-ups: a `ChatContext` (`artist`, `year`, `city`, `country`, `venue`, `lastRanking`) is kept between turns. Unmatched follow-ups go through `canonicalFallbacks`, which rewrite the sentence into a known shape.
5. Model fallback (`coreferenceResolver.ts`, `@react-native-ai/apple` with the Vercel AI SDK's `generateObject`). When no pattern matches **and** context exists, the model gets `Known context: artist=X, year=Y` plus the new message, and returns names. The code puts them back into the sentence and runs the regex again.
   - Three narrow schemas: `{intent, artist, year}`, `{intent, city, year}`, `{intent, country}`. The `intent` value is thrown away. The `3eb2eba` commit message says that one combined schema made the model invent values and trip guardrails more often, also on fields that did not change.
   - The schema is chosen from the context that exists. A field the model leaves out keeps its old value. If the model call throws, the fallback returns nothing.

## What the old design got wrong

I ran `fed0ce2` under Jest against the seed fixture plus a few punk bands with invented dates (see [Appendix](#appendix-how-the-old-code-was-run)). The model fallback was off, as on the simulator and on phones without Apple Intelligence.

### Single questions

| Question                                                 | Old app said                                      | Correct?                                              |
| -------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| When was the last time I saw Bad Religion?               | Aug 20, 2023, O2 Arena                            | ✅                                                    |
| When did I see Bad Religion last?                        | "Not sure how to answer"                          | ❌                                                    |
| Last time I saw Bad Religion?                            | "Not sure how to answer"                          | ❌                                                    |
| Hey, when was the last time I saw Bad Religion?          | "Not sure how to answer"                          | ❌                                                    |
| Did I see NOFX in 2023?                                  | Yes, Jul 15, 2023, Astra                          | ✅                                                    |
| Have I seen NOFX in 2023?                                | "Not sure how to answer"                          | ❌ ("did" works, "have" does not)                     |
| Did I see NOFX last year?                                | "Not sure how to answer"                          | ❌                                                    |
| Did I see NOFX in Berlin?                                | "Not sure how to answer"                          | ❌                                                    |
| Did I see No FX in 2023?                                 | Yes, NOFX                                         | ✅ (fuzzy match works)                                |
| When was the last time I saw Bad Religion **in Berlin**? | Aug 20, 2023, O2 Arena (London)                   | ❌ **wrong**: Jun 12, 2019, Columbiahalle             |
| How many times have I seen Bad Religion **in Berlin**?   | 2                                                 | ❌ **wrong**: 1                                       |
| Has Bad Religion played in Berlin?                       | "You haven't heard Bad Religion play _in Berlin_" | ❌ **wrong**: it read the city as a song              |
| Did Radiohead play It?                                   | 1 time                                            | ❌ **wrong**: matched "Everything in Its Right Place" |
| How many shows did I go to in 2023?                      | "Not sure how to answer" ("concerts" works)       | ❌                                                    |
| What was my last concert?                                | "Not sure how to answer"                          | ❌                                                    |
| Who did I see at Columbiahalle?                          | "Not sure how to answer" ("Which bands" works)    | ❌                                                    |
| When was the last time Turnstile played in Berlin?       | "Not sure how to answer"                          | Out of scope (see [Scope](#scope))                    |

### Follow-ups

| Conversation                                                     | Old app said                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Bad Religion → "When did I first see them?"                      | "No artist matching 'them'" ❌                                    |
| …same, with a band called **Hum** in the data                    | "You first saw **Hum** on Oct 1, 2022" ❌                         |
| Most-seen band (Bad Religion) → "When did I first see them?"     | "No artist matching 'them'" ❌                                    |
| NOFX in 2023 → "Is it on Spotify?"                               | "Yes — you saw NOFX 1 time in 2023" ❌                            |
| NOFX in 2023 → "Were there any covers?"                          | the same NOFX answer ❌                                           |
| NOFX in 2023 → "Who else did I see that year?"                   | the same NOFX answer ❌                                           |
| Bad Religion → "Where was that?" / "What did they play?"         | "Not sure how to answer" ❌                                       |
| NOFX in 2023 → "What about Berlin?"                              | "Not sure how to answer" ❌                                       |
| Bad Religion → "And NOFX?"                                       | "Not sure how to answer" ❌ ("What about NOFX?" also failed here) |
| NOFX in 2023 → "What about 2019?" → "What about Pennywise?"      | correct ✅ ("And Pennywise?" failed)                              |
| Berlin bands in 2023 → "What about London?" → "What about 2019?" | correct ✅                                                        |
| Shows in Germany → "How many shows have I seen there?"           | correct ✅                                                        |

### The holes, worst first

1. **It answers a different question.** The artist slot is `(?<artist>.+?)` to the end of the sentence, so "Bad Religion in Berlin" goes into it. The fuzzy match gives it the 0.9 prefix bonus (`entityResolver.ts:61-63`) and drops "in Berlin" without a word.
2. **The regex runs before follow-up handling.** `parser.ts:335` is `matchIntent(text) ?? (await resolveFollowUp(text, context))`. In "When did I first see them?", "them" goes into the artist slot, so the follow-up code never sees it.
3. **One pattern per question shape.** 46 intents, and "Did I see NOFX in Berlin?" still has none. The only lead-in it removes is "tell me", with an optional "please" or "can you" before it (`parser.ts:47`), so "Hey, …" fails. Each new pair of filters needs new code.
4. **The name match is too loose.** `MIN_SCORE = 0.5` (`entityResolver.ts:12`). "them" against "hum" has edit distance 2 of 4, so the score is exactly 0.5 and it matches.
5. **Canned answers.** `canonicalFallbacks` (`parser.ts:79-91`) turns any unmatched follow-up with "it", "them" or "there" (`PRONOUN_PATTERN`, `parser.ts:93`) into "did I see {artist} in {year}". So "Is it on Spotify?" gets the NOFX 2023 answer.
6. **Song match is a substring.** `s.name LIKE %query%` (`chatQueries.ts:595`).
7. **Rankings hide ties.** "Bad Religion is the artist you've seen the most, with 2 shows", but 3 other bands also have 2. The SQL sorts only by count.
8. **Old context stays.** A ranking answer does not set the focused artist (`parser.ts:349-356`), and nothing clears old values, so "them" can point to an artist from three questions earlier. Found by reading the code, not run.
9. **No test ran a real question on real data.** Every chat test that touched the DB mocked `@/database/database`. The others tested only the regexes or a mocked model. Each fix added only the one phrase someone reported (`30860a7`).

### The model fallback does not close them

The run above had the model off. With the model on, these holes stay. From reading the code only; the Apple model cannot run under Jest.

- The model runs only after a regex failure and only with context. First questions never use it, and "them" inside a matching sentence never reaches it (hole 2).
- It sees only `Known context: artist=X, year=Y`, not the previous answer. "What did they play?" or "the one before that" have nothing to point at.
- After an artist question it can only return `{artist, year}`, so "what about Berlin?" cannot become a city.
- A perfect model still gives the NOFX answer to "Who else did I see that year?", because no pattern exists for that question.
- It works only on Apple Intelligence devices, and CI cannot test it.

## How other apps solve this

| Approach                                                                                  | Who                                                                                                                              | Fits us?                                                                  |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Model → typed filters → normal search.** The model returns filters, a sort and a limit. | Spotify search (an agentic router adds time, genre and type filters, then calls search tools). Typesense, Google Vertex, Elastic | **Yes.** This is `searchConcerts`                                         |
| **Model calls the app's tools.** The app describes its tools; the model picks and fills.  | Apple Foundation Models tool calling                                                                                             | **Yes.** How we build the first approach on iOS                           |
| **Text-to-SQL with a large cloud model**                                                  | Data tools (Snowflake, Databricks, Metabase). They need a written schema description and checked example queries                 | **No.** Needs a large cloud model. On a phone it is what failed           |
| **Similarity search** ("find things like this")                                           | Apple Photos ("dog on a beach")                                                                                                  | **No.** Good for "looks like", bad for "when was the last time" or counts |

What the good ones have in common:

- The model never touches the database. It fills a form that code checks.
- The app shows what it understood (filters, chips), and the user can correct it.
- Counts, dates and sorting come from normal code, never from the model.

Notes:

- Spotify describes an LLM router that reads the query, picks a route (search or recommendations) and adds filters. "New indie rock releases" becomes a call with time, genre and type filters. Deezer's Text2Playlist extracts tags from the prompt.
- Typesense's natural-language search turns a question into `filter_by`, `sort_by` and a text query. Very close to `searchConcerts`.
- Apple puts each tool's name, description and argument schema into the prompt. `GenerationOptions` controls how the model uses tools. Apple says the same Swift API now also works with server models (Claude, Gemini), which gives a cloud fallback with the same code.
- The Snowflake/Databricks point is from general knowledge, not from this search.
- Apple Photos matches mostly on the device; Enhanced Visual Search sends an encrypted fingerprint to Apple. How it reads the question is not public.
- Nothing found on how Strava's AI features work.

## Options compared

| Option                                                               | On device | Chance        | Notes                                                                                       |
| -------------------------------------------------------------------- | --------- | ------------- | ------------------------------------------------------------------------------------------- |
| Apple model picks a tool, our code runs SQL                          | Yes       | Good          | iOS only, Apple Intelligence devices (iPhone 15 Pro or newer). ~3B model, ~4k token context |
| Apple model writes SQL                                               | Yes       | Low           | Small models invent columns, make wrong joins, misspell names                               |
| Bundled open model (Qwen or Llama 1–3B via `llama.rn` or ExecuTorch) | Yes       | Same or lower | 1–2 GB download, memory pressure, new native module. Only gain: Android                     |
| Cloud model (e.g. Claude Haiku) with the same tools                  | No        | High          | Sends only the question and small tool results. Benchmark, or an opt-in fallback            |
| No model: search bar with chips (artist, city, year)                 | Yes       | Very high     | Not "chat", but always correct                                                              |

## Proposed design

**The model picks a tool. Code does everything else.**

- 2–3 coarse typed tools, with guided generation (`@Generable`) so the model cannot invent fields:
  - `searchConcerts({ artist?, venue?, city?, country?, from?, to?, sort, limit })`
  - `countConcerts` with the same filters
  - `rankings` (top artists, cities, venues)
- Our three example questions are the same tool with different filters. A small model can fill that. It cannot write joins over 9 tables.
- Code resolves names by fuzzy match (bring back `entityResolver.ts` from `16e26a8^`, with a stricter threshold and no prefix bonus for long inputs) and runs parameterized SQL.
- **Never answer a question that was only partly understood.** Show the filters as chips. If a word is left over, say so.
- Rankings show ties.

**Follow-ups change the saved search, not the sentence.**

- After each answer, keep the last tool call (the filters) and the ids of the concerts it returned. That is a short JSON object, far below the ~4k token limit even in a long chat.
- For a follow-up, the model gets the new question plus that saved search and returns `{ mode: "new" | "change", fields }`. Code applies the change.
- "them", "it", "there" are never looked up as names. They resolve from the saved search or the shown result.
- Rule for "What about Pennywise?" after "NOFX in 2023": keep the other filters (2023 stays) and show the chips, so one tap removes a filter.

| You ask                             | Saved search      | Model returns                           |
| ----------------------------------- | ----------------- | --------------------------------------- |
| "When did I last see Bad Religion?" | none              | new: artist = Bad Religion, newest, 1   |
| "And in 2023?"                      | that search       | change: year = 2023                     |
| "What about Pennywise?"             | that search       | change: artist = Pennywise (2023 stays) |
| "What did they play?"               | the shown concert | setlist for that concert id             |
| "And the one before that?"          | that search       | change: skip 1 more                     |

**Risks**

- The model picks the wrong tool or drops a filter. The question set measures how often.
- CI cannot run the Apple model. Unit tests cover tools, resolution and SQL; the question set runs by hand on the Mac (Foundation Models runs on macOS 26).
- Android and older iPhones get no model. Fallback: the chip search without free text.

## Scope

"When was the last time Turnstile played in Berlin?" asks about **every** Turnstile show. The local DB has only the shows Leo went to. The app can answer "when did **I** last see Turnstile in Berlin?". The other question needs a live Setlist.fm API call: a separate feature.

## Plan

1. **Question set first.** 50–100 real questions with correct answers, built from the seed data: single questions plus 2–3-question follow-up chains, scored separately so good single answers cannot hide bad follow-ups. Include every question from the tables above.
2. Run it against the real seeded DB in Jest for the code half (tools, resolution, SQL) and on the Mac with Foundation Models for the model half.
3. Build the chat screen only if the score is good.

Rules from the old attempt: no regex intents, no model-written SQL, no tests that mock the database.

## Sources

- [Apple: Expanding generation with tool calling](https://developer.apple.com/documentation/foundationmodels/expanding-generation-with-tool-calling)
- [Apple: Tool protocol](https://developer.apple.com/documentation/foundationmodels/tool)
- [Apple: Foundation Models framework](https://developer.apple.com/foundation-models-framework/)
- [Apple: WWDC25 session 286](https://developer.apple.com/videos/play/wwdc2025/286/)
- [Spotify Research: "You say search, I say recs"](https://research.atspotify.com/2025/9/you-say-search-i-say-recs-a-scalable-agentic-approach-to-query-understanding)
- [Spotify: Text2Tracks (arXiv 2503.24193)](https://arxiv.org/abs/2503.24193)
- [Deezer: Text2Playlist (arXiv 2501.05894)](https://arxiv.org/abs/2501.05894)
- [Typesense: Natural Language Search](https://typesense.org/docs/30.0/api/natural-language-search.html)
- [Google Cloud: Filter with natural-language understanding](https://docs.cloud.google.com/generative-ai-app-builder/docs/natural-language-queries)
- [Elastic: Automating search with LLMs and Query DSL](https://www.elastic.co/search-labs/en/blog/elastic-query-dsl-structured-datasets)
- [Apple Support: Enhanced Visual Search in Photos](https://support.apple.com/en-gb/122033)
- [9to5Mac: Photos search in iOS 18.1](https://9to5mac.com/2024/09/25/photos-search-in-ios-181-actually-works-thanks-to-apple-intelligence/)

## Appendix: how the old code was run

- Check out `fed0ce2` into a separate folder, `yarn install`, then `nvm use` from the main repo.
- Copy `test/expoSqliteNode.ts` from `main`: it did not exist at `fed0ce2` (added in `bae5242`).
- The seed is `.maestro/fixtures/seed.sql` as it was at `fed0ce2`. The one on `main` has more rows, so counts differ with it.
- Jest config (`jest.probe.config.js`): `babel-jest` with `babel-preset-expo`; `^@/(.*)$` → `src/$1`; `^expo-sqlite$` → `test/expoSqliteNode.ts`.
- The probe test mocks `expo-constants` and `@/services/chat/coreferenceResolver` (returns `null`: no Apple model), loads `.maestro/fixtures/seed.sql` plus the SQL below (plus Hum when `WITH_HUM` is set), asks each question with `answerQuestion(q, ctx)`, carries `ctx` through each conversation and writes the answers to a file.
- Run: `node node_modules/.bin/jest --config jest.probe.config.js`.

Extra fixture (dates invented; venue-2 Columbiahalle and venue-4 Astra are in Berlin, venue-3 O2 Arena is in London):

```sql
INSERT OR REPLACE INTO venues (id, name, cityId, url) VALUES ('venue-5', 'SO36', 'city-2', 'x');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url) VALUES ('ar-br', 'Bad Religion', 'Bad Religion', 'x');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url) VALUES ('ar-nofx', 'NOFX', 'NOFX', 'x');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url) VALUES ('ar-pw', 'Pennywise', 'Pennywise', 'x');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url) VALUES ('ar-ts', 'Turnstile', 'Turnstile', 'x');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES ('br-1', 'ar-br', 'venue-2', '12-06-2019', 'x');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES ('br-2', 'ar-br', 'venue-3', '20-08-2023', 'x');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES ('nofx-1', 'ar-nofx', 'venue-4', '15-07-2023', 'x');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES ('pw-1', 'ar-pw', 'venue-5', '15-07-2023', 'x');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES ('ts-1', 'ar-ts', 'venue-3', '03-03-2024', 'x');
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (100, 'br-1', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (101, 'br-2', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (102, 'nofx-1', 'Main Set', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (100, '21st Century (Digital Boy)', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (101, 'Punk Rock Song', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (101, 'American Jesus', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (102, 'Linoleum', 0);
-- WITH_HUM only
INSERT OR REPLACE INTO artists (mbid, name, sortName, url) VALUES ('ar-hum', 'Hum', 'Hum', 'x');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES ('hum-1', 'ar-hum', 'venue-5', '01-10-2022', 'x');
```
