export default {
  // Common
  common: {
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    close: 'Close',
    refresh: 'Refresh',
    back: '← Back',
    loading: 'Loading...',
    show_one: '{{count}} show',
    show_other: '{{count}} shows',
    visit_one: '{{count}} visit',
    visit_other: '{{count}} visits',
    concert_one: '{{count}} concert',
    concert_other: '{{count}} concerts',
    artist_one: '{{count}} artist',
    artist_other: '{{count}} artists',
    venue_one: '{{count}} venue',
    venue_other: '{{count}} venues',
    country_one: '{{count}} country',
    country_other: '{{count}} countries',
    city_one: '{{count}} city',
    city_other: '{{count}} cities',
    continent_one: '{{count}} continent',
    continent_other: '{{count}} continents',
    year_one: '{{count}} year',
    year_other: '{{count}} years',
    lastShow: 'Last show: {{date}}',
    lastSeen: 'Last seen: {{date}}',
    all: 'All',
    noMatchesFound: 'No matches found',
    tryDifferentSearch: 'Try a different search term',
    moreCount: '+{{count}} more',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    concerts: 'Concerts',
    artists: 'Artists',
    venues: 'Venues',
    countries: 'Countries',
    highlights: 'Highlights',
    mostSeenArtist: 'Most seen artist',
    mostVisitedVenue: 'Most visited venue — {{city}}',
    timeline: 'Timeline',
    firstConcert: 'First concert',
    mostRecent: 'Most recent',
    yearsAgo: '{{count}} year ago',
    yearsAgo_other: '{{count}} years ago',
    concertsPerYear: 'Concerts per Year',
    lastSynced: 'Last synced: {{date}}',
    emptyTitle: 'Your chronicle starts here',
    emptyBody: 'Sync your setlist.fm history to begin.',
    usernamePlaceholder: 'setlist.fm username',
    syncing: 'Syncing...',
    fetchData: 'Fetch Concert Data',
    usernameRequired: 'Username Required',
    usernameRequiredMessage: 'Enter your setlist.fm username to sync.',
    syncComplete: 'Sync Complete',
    syncCompleteMessage: 'Added {{count}} new concert.',
    syncCompleteMessage_other: 'Added {{count}} new concerts.',
    upToDate: 'Up to Date',
    upToDateMessage: 'No new concerts found.',
    syncFailed: 'Sync Failed',
  },

  // Artists
  artists: {
    title: 'Artists',
    subtitle: '{{count}} artist',
    subtitle_other: '{{count}} artists',
    subtitleSorted: '{{count}} artist (sorted by concert count)',
    subtitleSorted_other: '{{count}} artists (sorted by concert count)',
    searchPlaceholder: 'Search artists...',
    noMatch: 'No artists match your search',
    empty: 'No artists yet',
    emptyBody: "Everyone you've seen live will be listed here.",
    failedToLoad: 'Failed to load artists',
    shows: 'shows',
    failedToLoadConcerts: 'Failed to load artist concerts',
    noConcertsFound: 'No concerts found',
    viewConcertsHint: 'View concerts for this artist',
  },

  // Concerts
  concerts: {
    title: 'My Concerts',
    subtitleByYear: '{{count}} concert grouped by year',
    subtitleByYear_other: '{{count}} concerts grouped by year',
    subtitleAlphabetical: '{{count}} concert (alphabetical by artist)',
    subtitleAlphabetical_other: '{{count}} concerts (alphabetical by artist)',
    sortBy: 'Sort by:',
    mostRecent: 'Most Recent',
    alphabetical: 'By Name',
    yearFilter: 'Year',
    searchPlaceholder: 'Search by artist, venue, city...',
    empty: 'No shows yet',
    emptyBody: 'Your concert timeline builds here as you sync.',
    failedToLoad: 'Failed to load concerts',
    sortByMostRecent: 'Sort by most recent',
    sortByAlphabetical: 'Sort by name',
    viewConcertDetails: 'View concert details',
  },

  // Venues
  venues: {
    title: 'Venues',
    subtitle: '{{count}} venue',
    subtitle_other: '{{count}} venues',
    subtitleSorted: '{{count}} venue (sorted by visit count)',
    subtitleSorted_other: '{{count}} venues (sorted by visit count)',
    subtitleRecent: '{{count}} venue (sorted by most recent)',
    subtitleRecent_other: '{{count}} venues (sorted by most recent)',
    searchPlaceholder: 'Search venues, cities, countries...',
    noMatch: 'No venues match your search',
    empty: 'No venues yet',
    emptyBody: "Every room you've seen live music in will appear here.",
    failedToLoad: 'Failed to load venues',
    failedToLoadConcerts: 'Failed to load venue concerts',
    noConcertsFound: 'No concerts found',
    map: 'Map',
    continents: 'Continents',
    cities: 'Cities',
    visits: 'visits',
  },

  // Map
  map: {
    title: 'Venues Map',
    subtitle: 'View all venue locations',
    loading: 'Loading venue locations...',
    noData: 'No venues with location data found',
    noDataSubtitle: 'Venues need coordinate information to appear on the map',
    venuesWithLocation: '{{count}} venue with location data',
    venuesWithLocation_other: '{{count}} venues with location data',
    legendTitle: 'Visit Count Legend:',
    legend1: '1 visit',
    legend2: '2 visits',
    legend3: '3-4 visits',
    legend5: '5+ visits',
  },

  // Geographic
  geo: {
    continentsTitle: 'Continents',
    continentsSubtitle: '{{count}} continent',
    continentsSubtitle_other: '{{count}} continents',
    continentsSubtitleSorted: '{{count}} continent (sorted by venue count)',
    continentsSubtitleSorted_other: '{{count}} continents (sorted by venue count)',
    countriesTitle: 'Countries',
    countriesSubtitle: '{{count}} country',
    countriesSubtitle_other: '{{count}} countries',
    countriesSubtitleSorted: '{{count}} country (sorted by venue count)',
    countriesSubtitleSorted_other: '{{count}} countries (sorted by venue count)',
    citiesTitle: 'Cities',
    citiesSubtitle: '{{count}} city',
    citiesSubtitle_other: '{{count}} cities',
    citiesSubtitleSorted: '{{count}} city (sorted by venue count)',
    citiesSubtitleSorted_other: '{{count}} cities (sorted by venue count)',
    noContinentsFound: 'No continents found',
    noCountriesFound: 'No countries found',
    noCitiesFound: 'No cities found',
    noVenuesInCity: 'No venues found in this city',
    noCountriesInContinent: 'No countries found in this continent',
    noCitiesInCountry: 'No cities found in this country',
    failedToLoadContinents: 'Failed to load continents',
    failedToLoadCountries: 'Failed to load countries',
    failedToLoadCities: 'Failed to load cities',
    failedToLoadVenues: 'Failed to load venues',
  },

  // Setlist
  setlist: {
    notFound: 'Setlist not found',
    noInfo: 'No setlist information available',
    mainSet: 'Main Set',
    encore: 'Encore',
    encoreNumber: 'Encore {{number}}',
    setNumber: 'Set {{number}}',
    withArtist: 'with {{name}}',
    coverOf: 'cover of {{name}}',
  },

  // Sort
  sort: {
    sortBy: 'Sort by:',
    byName: 'By Name',
    mostRecent: 'Most Recent',
    top: 'Top',
  },

  // Concert list modal
  concertListModal: {
    loading: 'Loading concerts...',
    empty: 'No concerts found',
  },

  // Debug
  debug: {
    title: 'Debug & Admin',
    subtitle: 'Database management and testing tools',
    songs: 'Songs',
    fetchAll: 'Fetch All Concert Data',
    fetching: 'Fetching All Data...',
    debugArtists: 'Debug Artists',
    clearDatabase: 'Clear Database',
    clearConfirmTitle: 'Clear Database',
    clearConfirmMessage: 'This will delete ALL data. Are you sure?',
    clearAll: 'Clear All',
    clearSuccess: 'Database cleared successfully',
    clearFailed: 'Failed to clear database',
    routeTesting: 'Route Testing',
    routeTestingSubtitle: 'Test navigation to different screens',
    showAllRoutes: 'Show All Routes',
    logCurrentRoute: 'Log Current Route',
    showRouteStructure: 'Show Route Structure',
    artistsTab: 'Artists Tab',
    venuesTab: 'Venues Tab',
    artistConcerts: 'Artist Concerts',
    venueConcerts: 'Venue Concerts',
    aboutTitle: 'About This App',
  },

  // Onboarding
  onboarding: {
    title: 'Welcome to Chronicles',
    subtitle: 'Track every concert you attend',
    usernamePlaceholder: 'Your setlist.fm username',
    getStarted: 'Get Started',
    fetchingConcerts: 'Fetching your concerts...',
    fetchingPage: 'Page {{current}} of {{total}}',
    concertsFound: '{{count}} concert found so far',
    concertsFound_other: '{{count}} concerts found so far',
    totalConcerts: '{{count}} concert on your profile',
    totalConcerts_other: '{{count}} concerts on your profile',
    syncComplete: 'All set!',
    syncCompleteMessage: 'Found {{count}} concert. Let\u2019s explore!',
    syncCompleteMessage_other: 'Found {{count}} concerts. Let\u2019s explore!',
    letsGo: 'Let\u2019s Go',
    error: 'Something went wrong',
    userNotFound: 'Username not found on setlist.fm. Please check your username and try again.',
    retry: 'Try Again',
    usernameRequired: 'Please enter your setlist.fm username',
  },

  // Chat / ask
  chat: {
    title: 'Ask',
    placeholder: 'Ask about your concerts…',
    send: 'Send',
    examplesLabel: 'Try asking:',
    notUnderstood: "I'm not sure how to answer that yet — try one of the examples below.",
    noMatch: {
      artist: 'I couldn’t find an artist matching "{{query}}" in your collection.',
      city: 'I couldn’t find a city matching "{{query}}" in your collection.',
      country: 'I couldn’t find a country matching "{{query}}" in your collection.',
    },
    clarify: {
      artist: 'Which one did you mean?',
      city: 'Which city did you mean?',
      country: 'Which country did you mean?',
    },

    answers: {
      noData: "I don't have enough data to answer that yet.",
      neverSeen: "Looks like you haven't seen {{artist}} yet.",

      firstTimeSeen: 'You first saw {{artist}} on {{date}} at {{venue}}.',
      firstTimeSeenNoVenue: 'You first saw {{artist}} on {{date}}.',
      lastTimeSeen: 'You last saw {{artist}} on {{date}} at {{venue}}.',
      lastTimeSeenNoVenue: 'You last saw {{artist}} on {{date}}.',
      countTimesSeen_one: "You've seen {{artist}} {{count}} time.",
      countTimesSeen_other: "You've seen {{artist}} {{count}} times.",

      listTimesSeenIntro_one: "Here's the {{count}} time you've seen {{artist}}:",
      listTimesSeenIntro_other: "Here are the {{count}} times you've seen {{artist}}:",
      listTimesSeenEntry: '{{date}} — {{venue}}',

      venuesSeenAt_one: "You've seen {{artist}} at {{count}} venue: {{venues}}.",
      venuesSeenAt_other: "You've seen {{artist}} at {{count}} venues: {{venues}}.",

      toursSeenOn: "You've seen {{artist}} on: {{tours}}.",
      toursSeenOnNone: "I don't have tour info for the {{artist}} shows you've seen.",

      compareArtists:
        "You've seen {{artistA}} {{countA}} time(s), and {{artistB}} {{countB}} time(s).",

      longestGap:
        'Your longest gap between {{artist}} shows was {{days}} days, between {{from}} and {{to}}.',
      longestGapNone: "You've only seen {{artist}} once, so there's no gap to measure.",

      artistSeenInYear_one: 'Yes — you saw {{artist}} {{count}} time in {{year}}:',
      artistSeenInYear_other: 'Yes — you saw {{artist}} {{count}} times in {{year}}:',
      artistSeenInYearNone: "No, you didn't see {{artist}} in {{year}}.",

      totalConcertsLogged_one: "You've logged {{count}} concert.",
      totalConcertsLogged_other: "You've logged {{count}} concerts.",

      topArtist_one: "{{artist}} is the artist you've seen the most, with {{count}} show.",
      topArtist_other: "{{artist}} is the artist you've seen the most, with {{count}} shows.",

      topArtistInASingleYear_one:
        "{{artist}} is the artist you've seen the most in a single year — {{count}} time in {{year}}.",
      topArtistInASingleYear_other:
        "{{artist}} is the artist you've seen the most in a single year — {{count}} times in {{year}}.",

      top5Artists: 'Your top 5 most-seen artists: {{list}}.',

      uniqueArtistsCount_one: "You've seen {{count}} unique artist overall.",
      uniqueArtistsCount_other: "You've seen {{count}} unique artists overall.",

      artistsSeenMoreThanOnce_one: "{{count}} artist you've seen more than once.",
      artistsSeenMoreThanOnce_other: "{{count}} artists you've seen more than once.",

      artistsSeenOnlyOnce_one: "{{count}} artist you've only seen once.",
      artistsSeenOnlyOnce_other: "{{count}} artists you've only seen once.",

      artistsSeenAtLeastN_one: "{{count}} artist you've seen {{n}}+ times: {{list}}.",
      artistsSeenAtLeastN_other: "{{count}} artists you've seen {{n}}+ times: {{list}}.",
      artistsSeenAtLeastNNone: "You haven't seen any artist {{n}}+ times yet.",

      concertsInYear_one: 'You went to {{count}} concert in {{year}}.',
      concertsInYear_other: 'You went to {{count}} concerts in {{year}}.',

      concertsInMonthYear_one: 'You went to {{count}} concert in {{month}} {{year}}.',
      concertsInMonthYear_other: 'You went to {{count}} concerts in {{month}} {{year}}.',

      artistsSeenInMonthYear_one: 'You saw {{count}} artist in {{month}} {{year}}: {{list}}.',
      artistsSeenInMonthYear_other: 'You saw {{count}} artists in {{month}} {{year}}: {{list}}.',
      artistsSeenInMonthYearNone: "You didn't see any concerts in {{month}} {{year}}.",

      averageConcertsPerYear: "You've averaged {{count}} concerts per year.",

      daysSinceLastConcert_one: "It's been {{count}} day since your last concert.",
      daysSinceLastConcert_other: "It's been {{count}} days since your last concert.",

      yearWithMostConcerts_one: '{{year}} was your busiest year, with {{count}} concert.',
      yearWithMostConcerts_other: '{{year}} was your busiest year, with {{count}} concerts.',

      firstConcertEver: 'Your very first concert was {{artist}}, on {{date}}.',
      mostRecentConcert: 'Your most recent concert was {{artist}}, on {{date}}.',

      countriesSeenCount_one: "You've seen live music in {{count}} country.",
      countriesSeenCount_other: "You've seen live music in {{count}} countries.",

      citiesSeenList_one: "You've seen concerts in {{count}} city: {{list}}.",
      citiesSeenList_other: "You've seen concerts in {{count}} cities: {{list}}.",

      showsInCountry_one: "You've seen {{count}} concert in {{country}}.",
      showsInCountry_other: "You've seen {{count}} concerts in {{country}}.",
      showsInCountryNone: "Looks like you haven't seen any concerts in {{country}} yet.",

      mostVisitedCountry_one:
        '{{country}} is the country you’ve visited most, with {{count}} concert.',
      mostVisitedCountry_other:
        '{{country}} is the country you’ve visited most, with {{count}} concerts.',

      mostVisitedCity_one: '{{city}} is the city you’ve visited most, with {{count}} concert.',
      mostVisitedCity_other: '{{city}} is the city you’ve visited most, with {{count}} concerts.',

      bandsSeenInCountry: "Bands you've seen in {{country}}: {{list}}.",
      bandsSeenInCountryNone: "You haven't seen any concerts in {{country}} yet.",

      bandsSeenInCityYear_one: 'You saw {{count}} artist in {{city}} in {{year}}: {{list}}.',
      bandsSeenInCityYear_other: 'You saw {{count}} artists in {{city}} in {{year}}: {{list}}.',
      bandsSeenInCityYearNone: "You didn't see any concerts in {{city}} in {{year}}.",

      countriesSeenInYear: 'Countries you saw concerts in during {{year}}: {{list}}.',
      countriesSeenInYearNone: "You didn't log any concerts in {{year}}.",
    },

    examples: [
      'When was the first time I saw Bad Religion?',
      'How many times have I seen NOFX?',
      'What was my most recent concert?',
      'Which artists have I seen 5 or more times?',
      'How many countries have I seen live music in?',
      'What was my very first concert ever?',
    ],
  },
};
