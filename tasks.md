# Setlist.fm Expo App - Development Tasks

## Project Overview
Building an Expo application that connects to the Setlist.fm API to fetch and store concert data locally using SQLite. The app will focus on a specific user's attended concerts and related data.

## **🔑 API Configuration:**
- **API Key**: Use environment variable `SETLISTFM_API_KEY`
- **Test Username**: `leopic`

## Core Features
- Fetch user's attended concerts
- Store all API entities 1:1 in local SQLite database: concerts, artists, venues, cities, tours, sets, songs
- Display data with preference for local storage over API calls
- Handle API rate limiting gracefully

## Development Tasks

### 1. Project Setup & Configuration
- [x] Initialize new Expo project with TypeScript
- [x] Set up project structure with proper folders:
  - `app/` - Expo router screens (file-based routing)
  - `src/components/` - Reusable components
  - `src/services/` - API and database services
  - `src/database/` - Database schema and operations
  - `src/types/` - TypeScript interfaces
  - `src/utils/` - Helper functions
- [x] Install and configure dependencies:
  - `expo-sqlite` for local database
  - `expo-router` for file-based routing and navigation
  - Rate limiting utilities
  - Using Yarn 4.9.2 with node_modules linker

### 2. Database Setup
- [x] Configure SQLite database with expo-sqlite
- [x] Create database schema matching API schema exactly:
  - **Artists**: mbid (PK), tmid, name, sortName, disambiguation, url
  - **Countries**: code (PK), name
  - **Cities**: id (PK), name, state, stateCode, countryCode (FK), coordsLat, coordsLong
  - **Venues**: id (PK), name, cityId (FK), url
  - **Tours**: name (PK) - since API only has name field
  - **Setlists**: id (PK), versionId, artistMbid (FK), venueId (FK), tourName (FK), eventDate, lastUpdated, lastFmEventId, info, url
  - **Sets**: id (PK, auto), setlistId (FK), name, encore (number), songOrder (for array position)
  - **Songs**: id (PK, auto), setId (FK), name, tape (boolean), info, withArtistMbid (FK), coverArtistMbid (FK), songOrder (for array position)
- [x] Implement database initialization and migrations

### 3. API Integration
- [x] Create API service for Setlist.fm with:
  - Authentication headers (x-api-key)
  - Rate limiting implementation (2/second, 1440/day)
  - Error handling and retry logic
  - Request/response logging
- [x] Define TypeScript interfaces for API responses
- [x] Implement specific endpoints:
  - `/user/{userId}/attended` - Get user's attended concerts
  - `/setlist/{setlistId}` - Get detailed setlist data
  - `/artist/{mbid}` - Get artist details
  - `/venue/{venueId}` - Get venue details

### 4. Data Processing & Storage
- [x] Implement data extraction and normalization:
  - Parse API responses maintaining 1:1 field mapping
  - Extract and link: artists → setlists → venues → cities, tours, sets → songs
  - Handle nested structures (sets.set array, cover artist info)
  - Preserve all API fields including optional ones (tape, info, cover, etc.)
- [x] Create database operations:
  - Insert/update all entities: artists, cities, venues, tours, setlists, sets, songs
  - Handle foreign key relationships and constraints
  - Batch operations for efficiency
  - Upsert operations to handle updates
- [x] Implement sync strategy:
  - Check local data first
  - Fetch from API only when necessary
  - Update local cache with new/modified data
  - Track sync timestamps per entity

### 5. User Interface
- [ ] Create main screens:
  - **Home/Dashboard**: Overview of stored data
  - **Concerts List**: List of attended concerts
  - **Concert Detail**: Detailed view with setlist
  - **Artists List**: All artists with concert counts
  - **Venues List**: All venues visited
- [x] Set up expo-router file-based navigation structure
- [ ] Add search and filtering capabilities
- [ ] Create loading states and error handling UI

### 6. Data Management Features
- [ ] Initial data sync for user "leopic"
- [ ] Manual refresh functionality
- [ ] Data export/backup options
- [ ] Cache management and cleanup

### 7. Performance & Optimization
- [ ] Implement efficient pagination for large datasets
- [ ] Add offline-first functionality

### 8. Testing & Quality
- [ ] Unit tests for API services
- [ ] Database operation tests
- [ ] Integration tests for data sync
- [ ] Error handling verification
- [ ] Rate limiting compliance testing

## Technical Considerations

### Rate Limiting Strategy
- Queue API requests to respect 2/second limit
- Track daily usage to stay under 1440/day limit
- Implement exponential backoff for rate limit errors
- Start with single page fetching, expand to full pagination later

### Data Strategy
- **Primary Data Source**: `/user/{userId}/attended` endpoint provides complete nested data
- **Single API Call Strategy**: Each response contains full setlist + artist + venue + city + country + tour + sets + songs
- **No Additional Fetching**: All required data comes from the attended concerts response
- **Development Approach**: 
  - **Phase 1**: Fetch only first page (`p=1`) for ~20 concerts to build and test the system
  - **Phase 2**: Once working, implement full pagination to fetch all 253 concerts

### Error Handling
- Network connectivity issues
- API rate limit exceeded
- Invalid API responses
- Database constraints violations
- Data corruption recovery
