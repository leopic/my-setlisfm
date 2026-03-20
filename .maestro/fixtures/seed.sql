-- Seed data for E2E tests
-- 3 countries, 3 cities, 4 venues, 5 artists, 2 tours, 8 setlists with sets and songs

-- Countries
INSERT OR REPLACE INTO countries (code, name) VALUES ('US', 'United States');
INSERT OR REPLACE INTO countries (code, name) VALUES ('DE', 'Germany');
INSERT OR REPLACE INTO countries (code, name) VALUES ('GB', 'United Kingdom');

-- Cities
INSERT OR REPLACE INTO cities (id, name, state, stateCode, countryCode, coordsLat, coordsLong)
VALUES ('city-1', 'New York', 'New York', 'NY', 'US', 40.7128, -74.0060);
INSERT OR REPLACE INTO cities (id, name, state, stateCode, countryCode, coordsLat, coordsLong)
VALUES ('city-2', 'Berlin', 'Berlin', 'BE', 'DE', 52.5200, 13.4050);
INSERT OR REPLACE INTO cities (id, name, state, stateCode, countryCode, coordsLat, coordsLong)
VALUES ('city-3', 'London', 'England', 'EN', 'GB', 51.5074, -0.1278);

-- Venues
INSERT OR REPLACE INTO venues (id, name, cityId, url)
VALUES ('venue-1', 'Madison Square Garden', 'city-1', 'https://www.setlist.fm/venue/madison-square-garden.html');
INSERT OR REPLACE INTO venues (id, name, cityId, url)
VALUES ('venue-2', 'Columbiahalle', 'city-2', 'https://www.setlist.fm/venue/columbiahalle.html');
INSERT OR REPLACE INTO venues (id, name, cityId, url)
VALUES ('venue-3', 'O2 Arena', 'city-3', 'https://www.setlist.fm/venue/o2-arena.html');
INSERT OR REPLACE INTO venues (id, name, cityId, url)
VALUES ('venue-4', 'Astra', 'city-2', 'https://www.setlist.fm/venue/astra.html');

-- Artists
INSERT OR REPLACE INTO artists (mbid, name, sortName, url)
VALUES ('artist-1', 'Radiohead', 'Radiohead', 'https://www.setlist.fm/setlists/radiohead.html');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url)
VALUES ('artist-2', 'The Strokes', 'Strokes, The', 'https://www.setlist.fm/setlists/the-strokes.html');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url)
VALUES ('artist-3', 'Daft Punk', 'Daft Punk', 'https://www.setlist.fm/setlists/daft-punk.html');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url)
VALUES ('artist-4', 'Arctic Monkeys', 'Arctic Monkeys', 'https://www.setlist.fm/setlists/arctic-monkeys.html');
INSERT OR REPLACE INTO artists (mbid, name, sortName, url)
VALUES ('artist-5', 'Kraftwerk', 'Kraftwerk', 'https://www.setlist.fm/setlists/kraftwerk.html');

-- Tours
INSERT OR REPLACE INTO tours (name) VALUES ('In Rainbows Tour');
INSERT OR REPLACE INTO tours (name) VALUES ('The New Abnormal Tour');

-- Setlists (8 concerts across 2024-2025, different artists/venues)
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, tourName, eventDate, url)
VALUES ('set-1', 'artist-1', 'venue-1', 'In Rainbows Tour', '15-03-2024', 'https://www.setlist.fm/setlist/set-1.html');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, tourName, eventDate, url)
VALUES ('set-2', 'artist-2', 'venue-2', 'The New Abnormal Tour', '22-06-2024', 'https://www.setlist.fm/setlist/set-2.html');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url)
VALUES ('set-3', 'artist-3', 'venue-3', '10-09-2024', 'https://www.setlist.fm/setlist/set-3.html');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url)
VALUES ('set-4', 'artist-4', 'venue-4', '05-11-2024', 'https://www.setlist.fm/setlist/set-4.html');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url)
VALUES ('set-5', 'artist-1', 'venue-2', '20-01-2025', 'https://www.setlist.fm/setlist/set-5.html');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url)
VALUES ('set-6', 'artist-5', 'venue-2', '14-02-2025', 'https://www.setlist.fm/setlist/set-6.html');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url)
VALUES ('set-7', 'artist-4', 'venue-3', '28-03-2025', 'https://www.setlist.fm/setlist/set-7.html');
INSERT OR REPLACE INTO setlists (id, artistMbid, venueId, eventDate, url)
VALUES ('set-8', 'artist-2', 'venue-1', '10-05-2025', 'https://www.setlist.fm/setlist/set-8.html');

-- Sets
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (1, 'set-1', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, encore, songOrder) VALUES (2, 'set-1', 1, 1);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (3, 'set-2', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (4, 'set-3', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (5, 'set-4', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (6, 'set-5', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (7, 'set-6', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (8, 'set-7', 'Main Set', 0);
INSERT OR REPLACE INTO sets (id, setlistId, name, songOrder) VALUES (9, 'set-8', 'Main Set', 0);

-- Songs (3-4 songs per set)
-- set-1 main set (Radiohead)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (1, '15 Step', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (1, 'Bodysnatchers', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (1, 'Nude', 2);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (1, 'Weird Fishes/Arpeggi', 3);
-- set-1 encore (Radiohead)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (2, 'Karma Police', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (2, 'Everything in Its Right Place', 1);
-- set-2 (The Strokes)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (3, 'Is This It', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (3, 'Reptilia', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (3, 'Last Nite', 2);
-- set-3 (Daft Punk)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (4, 'Around the World', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (4, 'Harder Better Faster Stronger', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (4, 'One More Time', 2);
-- set-4 (Arctic Monkeys)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (5, 'Do I Wanna Know?', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (5, 'R U Mine?', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (5, '505', 2);
-- set-5 (Radiohead)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (6, 'Paranoid Android', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (6, 'Lucky', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (6, 'No Surprises', 2);
-- set-6 (Kraftwerk)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (7, 'Autobahn', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (7, 'The Model', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (7, 'Computer Love', 2);
-- set-7 (Arctic Monkeys)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (8, 'Fluorescent Adolescent', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (8, 'When the Sun Goes Down', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (8, 'I Bet You Look Good on the Dancefloor', 2);
-- set-8 (The Strokes)
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (9, 'Someday', 0);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (9, 'Hard to Explain', 1);
INSERT OR REPLACE INTO songs (setId, name, songOrder) VALUES (9, 'Juicebox', 2);

-- Metadata
INSERT OR REPLACE INTO metadata (key, value) VALUES ('lastFetchedAt', '2025-03-20T12:00:00.000Z');
