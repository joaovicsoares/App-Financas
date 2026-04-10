import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useSafeSpacing() {
  const insets = useSafeAreaInsets();

  return {
    insets,
    headerPaddingTop: insets.top + 24,
    screenPaddingBottom: insets.bottom + 24,
    scrollPaddingBottom: insets.bottom + 40,
    tabListPaddingBottom: insets.bottom + 100,
    floatingBottom: insets.bottom + 90,
  };
}
