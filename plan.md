# Insights Feature Plan

Inspired by backup-setlistfm.onrender.com — same dataset (leopic), so every insight below is achievable from our existing SQLite data.

---

## Feature List

### 1. Artist Images
Fetch and cache artist photos from an external image API (TheAudioDB or Fanart.tv) keyed on the MusicBrainz `mbid` we already store. Display on artist cards, the dashboard hero, and anywhere artists are listed. Biggest single visual-impact change in the whole app.

**Data needed:** `artists.mbid` (already stored) → external API call, cache URL in a new `artistImageUrl` column.  
**Complexity:** Medium — needs one-time fetch per artist at sync time, cache invalidation strategy.

---

### 2. Concert Volume Bar Chart
Replace the current text-based year-by-year breakdown on the dashboard with a proper bar chart. Toggle between "Concerts" and "Concert Days" like the reference site does.

**Data needed:** `getYearSummaries()` already exists.  
**Complexity:** Low-Medium — needs a chart library (Victory Native or react-native-skia).

---

### 3. Weekday Distribution
Show which days of the week you go to concerts most often, with a ranked list and a bar chart. Friday/Saturday/Sunday will dominate for most people — interesting to confirm.

**Data needed:** New query: `GROUP BY strftime('%w', eventDate)`.  
**Complexity:** Low.

---

### 4. Concert Milestones
Cards marking your 1st, 50th, 100th, and 200th concert day — artist, venue, city, and date. Shown overlaid on a cumulative count curve. Very personal and scroll-stopping.

**Data needed:** New query: `ORDER BY eventDate ASC` with `OFFSET` for each milestone.  
**Complexity:** Low — mostly a display problem.

---

### 5. Repeat Depth Breakdown
One-off artists (seen once, 77% for leopic) vs. repeat artists (23%), broken into seen 2×, 3×, 4×, 5+ buckets with percentages. Answers "am I a loyalty fan or an explorer?"

**Data needed:** New query: `GROUP BY artistMbid HAVING COUNT(*) = N`.  
**Complexity:** Low.

---

### 6. Dry Streaks (Longest Gaps Between Concerts)
The longest stretch you went without seeing any live music, with the two concerts that bookended it. Top 3. Pairs with the active streak card for contrast.

**Data needed:** New query: self-join or `LAG()` window function on `setlists.eventDate ORDER BY date`.  
**Complexity:** Low-Medium (window function in SQLite needs careful expression).

---

### 7. Artist Reunion Gaps
Fastest and slowest returns per artist — days between consecutive shows. "Sum 41: 0 days" vs "Millencolin: 2952 days". Shows which artists you binge and which you rediscover after years.

**Data needed:** New query: per-artist `LAG(eventDate)` ordered by date.  
**Complexity:** Medium — need per-artist ordered window.

---

### 8. Active Streaks (Consecutive Concert Days)
Longest run of back-to-back calendar days where you attended at least one concert. Festival runs and tour clusters will dominate.

**Data needed:** New query on distinct `eventDate` values, detect consecutive-day runs.  
**Complexity:** Medium — consecutive-day detection is a gaps-and-islands problem in SQL.

---

### 9. Busiest Single Concert Day
The one calendar date when you attended the most events (most artists on the same day). Shows festival days and multi-stage days.

**Data needed:** New query: `GROUP BY eventDate ORDER BY COUNT(*) DESC LIMIT 1` with artist name aggregation.  
**Complexity:** Low.

---

### 10. Dominant Weekday by Time Period
Split the archive into 4–5 year buckets and show the leading concert weekday in each era. Shows how your schedule changed over time (e.g., weeknight shows early career → weekend shows later).

**Data needed:** Extension of feature #3, bucketed by year range.  
**Complexity:** Low (once #3 is done).

---

### 11. Country Timeline
"First country in the archive" and "latest new country unlocked" — a simple two-stat card that makes geographic exploration feel like an achievement system.

**Data needed:** New query: first `eventDate` per `countryCode`, ordered by date.  
**Complexity:** Low.

---

### 12. Longest Venue Relationship
Which venue have you returned to over the longest span of years? `MAX(eventDate) - MIN(eventDate)` per venue, expressed in years. Rewards loyalty to a local room.

**Data needed:** New query: `GROUP BY venueId` with date range.  
**Complexity:** Low.

---

### 13. Busiest 7-Day Stretch
The 7-calendar-day window with the most concert days. Identifies festival weeks and tour-heavy runs more precisely than the busiest month stat.

**Data needed:** New query: sliding 7-day window over distinct `eventDate` values.  
**Complexity:** Medium — sliding window aggregation.

---

### 14. Favorite City-Month Combo
City + calendar month pairing with the most concert days (e.g., "Berlin in June: 17 days"). Captures seasonal patterns and residency-style city habits.

**Data needed:** New query: `GROUP BY cityId, strftime('%m', eventDate)`.  
**Complexity:** Low.

---

### 15. Most Cities per Artist
Which artist have you seen in the most distinct cities? Shows who you follow on tour vs. who you only see at home.

**Data needed:** New query: `GROUP BY artistMbid` counting `DISTINCT venueId` or `DISTINCT cityId`.  
**Complexity:** Low.

---

## Rough Priority Order

| # | Feature | New DB query | External API | Chart needed |
|---|---------|:---:|:---:|:---:|
| 1 | Artist images | — | ✓ | — |
| 2 | Concert volume bar chart | — | — | ✓ |
| 3 | Weekday distribution | ✓ | — | ✓ |
| 4 | Concert milestones | ✓ | — | — |
| 5 | Repeat depth | ✓ | — | — |
| 6 | Dry streaks | ✓ | — | — |
| 7 | Artist reunion gaps | ✓ | — | — |
| 8 | Active streaks | ✓ | — | — |
| 9 | Busiest single day | ✓ | — | — |
| 10 | Dominant weekday by period | ✓ | — | — |
| 11 | Country timeline | ✓ | — | — |
| 12 | Longest venue relationship | ✓ | — | — |
| 13 | Busiest 7-day stretch | ✓ | — | — |
| 14 | Favorite city-month combo | ✓ | — | — |
| 15 | Most cities per artist | ✓ | — | — |

Features 3–15 are all pure SQLite — no network needed once the initial sync is done. The chart library (feature 2) is a one-time dependency that also unblocks feature 3. Artist images (feature 1) is the only ongoing external dependency.
