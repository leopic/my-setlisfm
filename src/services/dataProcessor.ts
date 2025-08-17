// Data processor for extracting and normalizing API data
import type { SetlistsResponse, Setlist, Artist, Venue, City, Country, Tour, Set, Song } from '../types/api';
import type { 
  DBArtist, DBCity, DBCountry, DBVenue, DBTour, 
  DBSetlist, DBSet, DBSong 
} from '../types/database';
import { dbOperations } from '../database/operations';

export class DataProcessor {
  
  async processSetlistsResponse(response: SetlistsResponse): Promise<void> {
    console.log(`Processing ${response.setlist.length} setlists from page ${response.page}`);
    
    for (const setlist of response.setlist) {
      await this.processSetlist(setlist);
    }
    
    console.log('Finished processing all setlists');
  }

  async processMultipleSetlistsResponses(responses: SetlistsResponse[]): Promise<void> {
    console.log(`Processing ${responses.length} pages of setlist data`);
    
    let totalSetlists = 0;
    for (const response of responses) {
      console.log(`\n--- Processing Page ${response.page} ---`);
      await this.processSetlistsResponse(response);
      totalSetlists += response.setlist.length;
    }
    
    console.log(`\n🎉 Finished processing all pages! Total setlists processed: ${totalSetlists}`);
  }

  private async processSetlist(setlist: Setlist): Promise<void> {
    try {
      console.log(`\n=== Processing Setlist ${setlist.id} ===`);
      console.log(`Artist: ${setlist.artist?.name || 'Unknown'}`);
      console.log(`Venue: ${setlist.venue?.name || 'Unknown'}`);
      console.log(`Sets count: ${setlist.sets?.set?.length || 0}`);
      
      // Check if setlist already exists
      if (!setlist.id) return;
      const existingSetlist = await dbOperations.getSetlistById(setlist.id);
      if (existingSetlist) {
        console.log(`Setlist ${setlist.id} already exists, skipping...`);
        return;
      }
      
      // Extract and store country first (if exists)
      if (setlist.venue?.city?.country) {
        await this.processCountry(setlist.venue.city.country);
      }

      // Extract and store city (if exists)
      if (setlist.venue?.city) {
        await this.processCity(setlist.venue.city);
      }

      // Extract and store venue (if exists)
      if (setlist.venue) {
        await this.processVenue(setlist.venue);
      }

      // Extract and store tour (if exists)
      if (setlist.tour) {
        await this.processTour(setlist.tour);
      }

      // Check if setlist has actual concert data before storing anything else
      if (!setlist.sets?.set || setlist.sets.set.length === 0) {
        console.log(`⚠️  Setlist ${setlist.id} has NO sets - skipping to avoid orphaned data`);
        return;
      }

      // Extract and store artist (if exists) - only after confirming we have concert data
      if (setlist.artist) {
        await this.processArtist(setlist.artist);
      }

      // Extract and store setlist
      await this.processSetlistEntity(setlist);

      // Extract and store sets and songs
      console.log(`Processing ${setlist.sets.set.length} sets for setlist ${setlist.id}`);
      await this.processSets(setlist.sets.set, setlist.id!);

    } catch (error) {
      console.error(`Error processing setlist ${setlist.id}:`, error);
    }
  }

  private async processCountry(country: Country): Promise<void> {
    if (!country.code) return;
    
    const dbCountry: DBCountry = {
      code: country.code,
      name: country.name,
    };
    
    await dbOperations.insertCountry(dbCountry);
  }

  private async processCity(city: City): Promise<void> {
    if (!city.id) return;
    
    const dbCity: DBCity = {
      id: city.id,
      name: city.name,
      state: city.state,
      stateCode: city.stateCode,
      countryCode: city.country?.code,
      coordsLat: city.coords?.lat,
      coordsLong: city.coords?.long,
    };
    
    await dbOperations.insertCity(dbCity);
  }

  private async processArtist(artist: Artist): Promise<void> {
    if (!artist.mbid) return;
    
    const dbArtist: DBArtist = {
      mbid: artist.mbid,
      tmid: artist.tmid,
      name: artist.name,
      sortName: artist.sortName,
      disambiguation: artist.disambiguation,
      url: artist.url,
    };
    
    await dbOperations.insertArtist(dbArtist);
  }

  private async processVenue(venue: Venue): Promise<void> {
    if (!venue.id) return;
    
    const dbVenue: DBVenue = {
      id: venue.id,
      name: venue.name,
      cityId: venue.city?.id,
      url: venue.url,
    };
    
    await dbOperations.insertVenue(dbVenue);
  }

  private async processTour(tour: Tour): Promise<void> {
    if (!tour.name) return;
    
    const dbTour: DBTour = {
      name: tour.name,
    };
    
    await dbOperations.insertTour(dbTour);
  }

  private async processSetlistEntity(setlist: Setlist): Promise<void> {
    if (!setlist.id) return;
    
    const dbSetlist: DBSetlist = {
      id: setlist.id,
      versionId: setlist.versionId,
      artistMbid: setlist.artist?.mbid,
      venueId: setlist.venue?.id,
      tourName: setlist.tour?.name,
      eventDate: setlist.eventDate,
      lastUpdated: setlist.lastUpdated,
      lastFmEventId: setlist.lastFmEventId,
      info: setlist.info,
      url: setlist.url,
    };
    
    await dbOperations.insertSetlist(dbSetlist);
  }

  private async processSets(sets: Set[], setlistId: string): Promise<void> {
    console.log(`Processing ${sets.length} sets for setlist ${setlistId}`);
    
    for (let setIndex = 0; setIndex < sets.length; setIndex++) {
      const set = sets[setIndex];
      
      // Create set record
      const dbSet: DBSet = {
        id: 0, // Will be auto-generated
        setlistId: setlistId,
        name: set.name,
        encore: set.encore,
        songOrder: setIndex,
      };
      
      await dbOperations.insertSet(dbSet);
      console.log(`Inserted set ${setIndex} for setlist ${setlistId}`);
      
      // Get the inserted set ID for songs
      // We need to query for the set we just inserted to get its ID
      const insertedSets = await dbOperations.getSetsForSetlist(setlistId);
      const insertedSet = insertedSets.find(s => s.songOrder === setIndex);
      
      if (insertedSet && set.song) {
        console.log(`Processing ${set.song.length} songs for set ${insertedSet.id}`);
        await this.processSongs(set.song, insertedSet.id);
      } else {
        console.log(`No songs found for set ${setIndex} or set not found`);
      }
    }
  }

  private async processSongs(songs: Song[], setId: number): Promise<void> {
    console.log(`Processing ${songs.length} songs for set ${setId}`);
    
    for (let songIndex = 0; songIndex < songs.length; songIndex++) {
      const song = songs[songIndex];
      
      // Process cover artist if exists
      if (song.cover?.mbid) {
        await this.processArtist(song.cover);
      }
      
      // Process "with" artist if exists
      if (song.with?.mbid) {
        await this.processArtist(song.with);
      }
      
      const dbSong: DBSong = {
        id: 0, // Will be auto-generated
        setId: setId,
        name: song.name,
        tape: song.tape,
        info: song.info,
        withArtistMbid: song.with?.mbid,
        coverArtistMbid: song.cover?.mbid,
        songOrder: songIndex,
      };
      
      await dbOperations.insertSong(dbSong);
      console.log(`Inserted song: ${song.name} for set ${setId}`);
    }
  }
}

export const dataProcessor = new DataProcessor();
