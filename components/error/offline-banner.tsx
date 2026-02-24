import React from 'react';
import { View, Animated } from 'react-native';
import { Text } from '@/components/ui/text';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const [slideAnim] = React.useState(new Animated.Value(-100));

  React.useEffect(() => {
    if (!isConnected) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [isConnected, slideAnim]);

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <View className="bg-red-500 px-4 py-3 items-center">
        <Text className="text-white font-semibold" size="sm">
          📡 No Internet Connection
        </Text>
        <Text className="text-white/90" size="xs" style={{ marginTop: 2 }}>
          Please check your network settings
        </Text>
      </View>
    </Animated.View>
  );
}
