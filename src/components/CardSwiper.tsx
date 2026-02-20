import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { hapticLight, hapticMedium } from '../utils/haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25;
const ROTATE_MAX_DEG = 12;

type Props = {
  /** Render της κάρτας (content) */
  renderCard: (index: number) => React.ReactNode;
  /** Πόσες κάρτες έχεις */
  count: number;
  /** current index από parent */
  index: number;
  /** όταν γίνεται swipe left (π.χ. skip) */
  onSwipeLeft?: (index: number) => void;
  /** όταν γίνεται swipe right (π.χ. favorite/like) */
  onSwipeRight?: (index: number) => void;
  /** όταν τελειώσουν */
  onEnd?: () => void;
};

export function CardSwiper({
  renderCard,
  count,
  index,
  onSwipeLeft,
  onSwipeRight,
  onEnd,
}: Props) {
  // Only render top and next for performance
  const nextIndex = index + 1;

  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const rotation = useAnimatedStyle(() => {
    const rotate = interpolate(x.value, [-SCREEN_W, 0, SCREEN_W], [-ROTATE_MAX_DEG, 0, ROTATE_MAX_DEG]);
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const overlay = useAnimatedStyle(() => {
    const likeOpacity = interpolate(x.value, [0, SWIPE_THRESHOLD], [0, 1]);
    const nopeOpacity = interpolate(x.value, [-SWIPE_THRESHOLD, 0], [1, 0]);
    return {
      opacity: Math.max(likeOpacity, nopeOpacity),
    };
  });

  const nextCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(Math.abs(x.value), [0, SWIPE_THRESHOLD], [0.98, 1]);
    const translateY = interpolate(Math.abs(x.value), [0, SWIPE_THRESHOLD], [10, 0]);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const doSwipe = (dir: 'left' | 'right') => {
    // animate out
    const toX = dir === 'right' ? SCREEN_W * 1.2 : -SCREEN_W * 1.2;
    x.value = withTiming(toX, { duration: 180 }, (finished) => {
      if (!finished) return;
      // reset for next
      x.value = 0;
      y.value = 0;

      const newIndex = index + 1;
      if (newIndex >= count) {
        onEnd && runOnJS(onEnd)();
        return;
      }

      if (dir === 'right') onSwipeRight && runOnJS(onSwipeRight)(index);
      if (dir === 'left') onSwipeLeft && runOnJS(onSwipeLeft)(index);
    });
  };

  const pan = useMemo(() => {
    return Gesture.Pan()
      .onUpdate((e) => {
        x.value = e.translationX;
        y.value = e.translationY * 0.35;

        // small haptic when crossing threshold
        if (Math.abs(x.value) > SWIPE_THRESHOLD) {
          runOnJS(hapticLight)();
        }
      })
      .onEnd(() => {
        if (x.value > SWIPE_THRESHOLD) {
          runOnJS(hapticMedium)();
          doSwipe('right');
          return;
        }
        if (x.value < -SWIPE_THRESHOLD) {
          runOnJS(hapticMedium)();
          doSwipe('left');
          return;
        }

        // spring back
        x.value = withSpring(0, { damping: 18, stiffness: 200 });
        y.value = withSpring(0, { damping: 18, stiffness: 200 });
      });
  }, [count, doSwipe, index]);

  return (
    <View style={styles.container}>
      {/* Next card (behind) */}
      {nextIndex < count ? (
        <Animated.View style={[styles.card, styles.cardBehind, nextCardStyle]}>
          {renderCard(nextIndex)}
        </Animated.View>
      ) : null}

      {/* Top card (draggable) */}
      {index < count ? (
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.card, rotation]}>
            {/* Optional overlay badges (you can style later) */}
            <Animated.View pointerEvents="none" style={[styles.overlay, overlay]} />
            {renderCard(index)}
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '92%',
    maxWidth: 520,
    minHeight: 320,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBehind: {
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    height: 6,
    borderRadius: 999,
    // opacity animated; color later if θες
  },
});