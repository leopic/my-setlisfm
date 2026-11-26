import * as Haptics from 'expo-haptics';

// Haptic feedback, used sparingly, as iOS does: a tick when a choice changes, and a success or
// error pattern when a sync ends. Native controls (menus, long press, pull to refresh) bring
// their own. A device without a haptic engine rejects the call; that is not an error here.
const play = (feedback: Promise<void>) => {
  feedback.catch(() => {});
};

export const Haptic = {
  selection: () => play(Haptics.selectionAsync()),
  success: () => play(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  failure: () => play(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
