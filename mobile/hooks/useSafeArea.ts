import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useSafeArea() {
  const insets = useSafeAreaInsets();
  
  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    paddingTop: insets.top + 16, // 16px de padding adicional
  };
}
