/**
 * Purpose: Centralized navigation helpers for clean stack resets and safe navigation.
 *          Prevents duplicate screens, eliminates zombie game routes from history,
 *          and ensures back navigation always behaves deterministically:
 *          Game / Report -> GameCatalog -> Back -> ChildDashboard
 * Module: Navigation
 * Folder: frontend/src/navigation
 */

/**
 * Traverses upwards to find the top-level RootNavigator.
 */
export const getRootNavigator = (navigation: any): any => {
  let nav = navigation;
  while (nav && typeof nav.getParent === 'function' && nav.getParent()) {
    nav = nav.getParent();
  }
  return nav || navigation;
};

/**
 * Cleanly navigates to GameCatalog by resetting the RootNavigator stack
 * to [ChildDashboard, GameCatalog].
 *
 * This guarantees:
 * 1. The previous game and completion screens are completely unmounted and removed from back history.
 * 2. Pressing Back on GameCatalog will ALWAYS return directly to ChildDashboard.
 * 3. Prevents circular navigation loops and stale game states.
 */
export const navigateToGameCatalog = (navigation: any): void => {
  const rootNav = getRootNavigator(navigation);
  try {
    if (typeof rootNav.reset === 'function') {
      rootNav.reset({
        index: 1,
        routes: [{ name: 'ChildDashboard' }, { name: 'GameCatalog' }],
      });
      return;
    }
  } catch (err) {
    console.warn('[navigationHelpers] Root reset to GameCatalog failed, falling back to navigate:', err);
  }

  // Fallback to direct navigate if reset is unavailable
  try {
    rootNav.navigate('GameCatalog');
  } catch (err) {
    navigation.navigate('GameCatalog');
  }
};

/**
 * Cleanly navigates to ChildDashboard by resetting the RootNavigator stack to [ChildDashboard].
 *
 * This guarantees:
 * 1. All game screens and catalog instances are purged from history.
 * 2. The user lands safely on ChildDashboard without previous game remnants.
 */
export const navigateToChildDashboard = (navigation: any): void => {
  const rootNav = getRootNavigator(navigation);
  try {
    if (typeof rootNav.reset === 'function') {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'ChildDashboard' }],
      });
      return;
    }
  } catch (err) {
    console.warn('[navigationHelpers] Root reset to ChildDashboard failed, falling back to navigate:', err);
  }

  // Fallback to direct navigate
  try {
    rootNav.navigate('ChildDashboard');
  } catch (err) {
    navigation.navigate('ChildDashboard');
  }
};
