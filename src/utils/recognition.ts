import type { ConcertRecognitionFacts } from '@/database/factQueries';

/** Every 5th show for an artist (5th, 10th, 15th, ...) is a milestone worth calling out. */
const MILESTONE_INTERVAL = 5;

/**
 * A visit is a "landmark" when it's a round-number milestone for that artist, or the
 * first time the artist has been seen in a new country — worth a gold, celebratory
 * treatment rather than the routine recognition banner.
 */
export function isLandmarkVisit(facts: ConcertRecognitionFacts): boolean {
  const isMilestoneCount =
    facts.ordinalForArtist >= MILESTONE_INTERVAL && facts.ordinalForArtist % MILESTONE_INTERVAL === 0;
  return isMilestoneCount || facts.isNewCountryForArtist;
}
