export interface ArtistWithStats {
  mbid: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
  imageUrl?: string;
  concertCount: number;
  lastConcertDate?: string;
  venues: string[];
}
