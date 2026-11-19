import type { TFunction } from 'i18next';
import type { SyncProgress } from '@/services/syncService';
import type { Phase, StepStatus } from './types';

export type StepContent = {
  title: string;
  detail: string | undefined;
  progressPct: number | undefined;
};

// ── Step status derivation ──

export function concertsStepStatus(phase: Phase, progress: SyncProgress | null): StepStatus {
  if (phase === 'input') return 'waiting';
  if (phase === 'error') return 'error';
  if (phase === 'done') return 'done';
  return progress?.phase === 'fetching' ? 'active' : 'done';
}

export function photosStepStatus(phase: Phase, progress: SyncProgress | null): StepStatus {
  if (phase === 'input' || phase === 'error') return 'waiting';
  if (phase === 'done') return 'done';
  if (progress?.phase === 'images') return 'active';
  return progress?.phase === 'done' ? 'done' : 'waiting';
}

// Content derived from DISPLAY states so the crossfade carries the right text.
// Live progress values (page numbers, counts) still read from `progress` directly
// since those only matter when the display status is 'active' anyway.

// Step 1: Concerts
function concertsTitle(
  display: StepStatus,
  t: TFunction,
  progress: SyncProgress | null,
  totalFound: number,
) {
  if (display === 'waiting') return t('onboarding.concertsStep');
  if (display === 'error') return t('onboarding.error');
  if (display === 'done')
    return t('common.concert', { count: progress?.totalConcerts ?? totalFound });
  return t('onboarding.findingConcerts');
}

function fetchingPageDetail(t: TFunction, progress: SyncProgress) {
  if (progress.totalConcerts > 0) {
    return t('onboarding.fetchingPageWithTotal', {
      current: progress.currentPage,
      total: progress.totalPages,
      concerts: progress.totalConcerts,
    });
  }
  return t('onboarding.fetchingPage', {
    current: progress.currentPage,
    total: progress.totalPages,
  });
}

function concertsDetail(
  display: StepStatus,
  t: TFunction,
  progress: SyncProgress | null,
  errorMessage: string,
) {
  if (display === 'waiting') return t('onboarding.concertsStepDetail');
  if (display === 'active' && progress) return fetchingPageDetail(t, progress);
  if (display === 'done') return t('onboarding.allSaved');
  if (display === 'error') return errorMessage;
  return undefined;
}

export function concertsStepContent(
  display: StepStatus,
  t: TFunction,
  progress: SyncProgress | null,
  totalFound: number,
  errorMessage: string,
): StepContent {
  return {
    title: concertsTitle(display, t, progress, totalFound),
    detail: concertsDetail(display, t, progress, errorMessage),
    progressPct:
      display === 'active' && progress && progress.totalPages > 0
        ? Math.round((progress.currentPage / progress.totalPages) * 100)
        : undefined,
  };
}

// Step 2: Photos
function photosTitle(display: StepStatus, t: TFunction) {
  if (display === 'waiting') return t('onboarding.photosStep');
  if (display === 'active') return t('onboarding.fetchingPhotos');
  return t('onboarding.photosReady');
}

function photosDetail(display: StepStatus, t: TFunction, progress: SyncProgress | null) {
  if (display === 'waiting') return t('onboarding.photosStepDetail');
  if (display === 'active' && progress?.imagesTotal) {
    return t('onboarding.photosProgress', {
      done: progress.imagesDone ?? 0,
      total: progress.imagesTotal,
    });
  }
  return display === 'done' ? t('onboarding.allMatched') : undefined;
}

export function photosStepContent(
  display: StepStatus,
  t: TFunction,
  progress: SyncProgress | null,
): StepContent {
  return {
    title: photosTitle(display, t),
    detail: photosDetail(display, t, progress),
    progressPct:
      display === 'active' && progress?.imagesTotal
        ? Math.round(((progress.imagesDone ?? 0) / progress.imagesTotal) * 100)
        : undefined,
  };
}
