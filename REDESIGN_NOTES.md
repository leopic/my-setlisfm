# Chronicle Redesign — Work in Progress

Branch: `feature/chronicle-redesign`

## What's done

### Design system
- **Font**: Space Grotesk (`@expo-google-fonts/space-grotesk`, 300–700 weights)
  loaded in `app/_layout.tsx` alongside DB init, falls back to system font gracefully
- **Type scale** (`src/utils/typography.ts`): 6 presets — `display`, `heading`, `title`,
  `body`, `label`, `count`
- **Chronicle palette** (`src/utils/colors.ts`): `useChronicleColors()` hook, separate
  from the legacy `useColors()` so existing code is unaffected
  - Dark: `#08090f` bg · `#00e8ff` electric cyan accent
  - Light: `#f2f6fc` bg · `#0077cc` electric cobalt accent
  - All secondary/muted values are WCAG AA-compliant (≥4.5:1)

### Screens migrated (all on `useChronicleColors` + Space Grotesk)
- Dashboard — timeline river, ghosted year headings, monthly dot grid per year
- Concerts — same river pattern with search + filter pills
- Artists — almanac ranking with left accent bar on top 2
- Venues — borderless rows, geo nav strip, sort pills
- Concert/setlist detail — back bar + hero block + numbered song rows
- Artist concerts list — year-grouped timeline river
- Venue concerts list — year-grouped timeline river
- Continents / Countries / Cities — Chronicle row pattern, inline headers
- Continent detail / Country detail / City detail — inline Chronicle headers
- Onboarding — Chronicle palette + Space Grotesk, thin progress bar
- Map — Chronicle inline header
- Debug — stats strip, row-style action buttons

### Shared components migrated
- `src/components/Setlist.tsx`
- `src/components/CountryList.tsx`
- `src/components/CityList.tsx`

## What's next

- [ ] Dark mode smoke test — flip simulator to dark, do a full screenshot sweep
- [ ] Onboarding on screen — haven't seen the progress/done states on device yet
- [ ] Artist sort smoke test — verify all three sort modes (Recent / Top / By Name) render correctly
- [ ] PR + review

## Known non-issues
- Gear icon visible in dev builds = Expo Dev Client's debug button, not our code.
  Will not appear in production.
