import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { QuestionCard } from '../components/QuestionCard';
import { getNormalizedQuestionsForMood } from '../engine/normalizeQuestions';
import { SessionEngine } from '../engine/sessionEngine';
import { useFavoritesStore } from '../state/favoritesStore';
import { usePrefsStore } from '../state/prefsStore';
import { useSessionStore } from '../state/sessionStore';
import { RootStackParamList } from '../types';
import { formatCountdown } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export const GameScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const language = usePrefsStore((s) => s.language);
  const {
    mood,
    currentQuestionId,
    questionsShown,
    currentPhase,
    targetIntensity,
    relationshipStage,
    isPremium,
    timerSecondsLeft,
    stats,
    nextCard,
    skipCard,
    tick,
    endSession,
    registerFavoriteAdded,
  } = useSessionStore();

  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const normalizedDeck = useMemo(
    () => (mood ? getNormalizedQuestionsForMood(mood) : []),
    [mood]
  );

  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null;
    return normalizedDeck.find((q) => q.id === currentQuestionId) ?? null;
  }, [currentQuestionId, normalizedDeck]);

  const nextQuestion = useMemo(() => {
    if (!mood) return null;
    const engine = new SessionEngine(normalizedDeck, { mood, relationshipStage, isPremium });
    return (
      engine.getNextQuestion({
        currentPhase,
        targetIntensity,
        questionsShown,
      }) ?? null
    );
  }, [currentPhase, isPremium, mood, normalizedDeck, questionsShown, relationshipStage, targetIntensity]);

  useEffect(() => {
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (timerSecondsLeft <= 0) {
      endSession();
      navigation.replace('End');
    }
  }, [timerSecondsLeft, navigation, endSession]);

  const favorite = currentQuestion ? isFavorite(currentQuestion.id) : false;
  const [debugVisible, setDebugVisible] = useState(false);

  // ---- Swipe animation (RN core) ----
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const H_THRESHOLD = Math.max(90, width * 0.22);
  const UP_THRESHOLD = 90;

  // overlays
  const likeOpacity = translate.x.interpolate({
    inputRange: [0, H_THRESHOLD * 0.6, H_THRESHOLD],
    outputRange: [0, 0.25, 1],
    extrapolate: 'clamp',
  });
  const nextOpacity = translate.x.interpolate({
    inputRange: [-H_THRESHOLD, -H_THRESHOLD * 0.6, 0],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp',
  });
  const skipOpacity = translate.y.interpolate({
    inputRange: [-UP_THRESHOLD, -UP_THRESHOLD * 0.6, 0],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp',
  });

  // deck effect for next card
  const backScale = translate.x.interpolate({
    inputRange: [-width * 0.4, 0, width * 0.4],
    outputRange: [0.97, 0.95, 0.97],
    extrapolate: 'clamp',
  });
  const backTranslateY = translate.y.interpolate({
    inputRange: [-height * 0.3, 0, height * 0.3],
    outputRange: [6, 12, 18],
    extrapolate: 'clamp',
  });
  const backOpacity = translate.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  const rotate = translate.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const resetCard = useCallback(() => {
    translate.setValue({ x: 0, y: 0 });
  }, [translate]);

  const animateOffAndThen = useCallback(
    (toX: number, toY: number, after: () => void) => {
      Animated.timing(translate, {
        toValue: { x: toX, y: toY },
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        resetCard();
        after();
      });
    },
    [translate, resetCard]
  );

  const onSwipeLeftNext = useCallback(() => {
    animateOffAndThen(-width * 1.1, 0, () => nextCard());
  }, [animateOffAndThen, nextCard, width]);

  const onSwipeRightFavNext = useCallback(() => {
    if (!currentQuestion) return;

    if (!favorite) registerFavoriteAdded();
    if (!favorite) toggleFavorite(currentQuestion.id);

    animateOffAndThen(width * 1.1, 0, () => nextCard());
  }, [animateOffAndThen, currentQuestion, favorite, nextCard, registerFavoriteAdded, toggleFavorite, width]);

  const onSwipeUpSkip = useCallback(() => {
    animateOffAndThen(0, -height * 0.6, () => skipCard());
  }, [animateOffAndThen, skipCard, height]);

  // ---- Haptics (trigger once when crossing threshold) ----
  const hapticState = useRef({ left: false, right: false, up: false });

  const maybeHaptic = useCallback(async (dx: number, dy: number) => {
    const up = dy < -UP_THRESHOLD && Math.abs(dx) < H_THRESHOLD;
    const left = dx < -H_THRESHOLD;
    const right = dx > H_THRESHOLD;

    // reset flags when back inside safe zone
    if (!left) hapticState.current.left = false;
    if (!right) hapticState.current.right = false;
    if (!up) hapticState.current.up = false;

    // trigger only once per direction
    if (left && !hapticState.current.left) {
      hapticState.current.left = true;
      await Haptics.selectionAsync();
    } else if (right && !hapticState.current.right) {
      hapticState.current.right = true;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (up && !hapticState.current.up) {
      hapticState.current.up = true;
      await Haptics.selectionAsync();
    }
  }, [H_THRESHOLD, UP_THRESHOLD]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: async (_, gesture) => {
        translate.setValue({ x: gesture.dx, y: gesture.dy });
        // best-effort haptics (don’t block UI)
        void maybeHaptic(gesture.dx, gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const dx = gesture.dx;
        const dy = gesture.dy;

        // Up: Skip (only if clearly up)
        if (dy < -UP_THRESHOLD && Math.abs(dx) < H_THRESHOLD) {
          onSwipeUpSkip();
          return;
        }

        // Left: Next
        if (dx < -H_THRESHOLD) {
          onSwipeLeftNext();
          return;
        }

        // Right: Favorite + Next
        if (dx > H_THRESHOLD) {
          onSwipeRightFavNext();
          return;
        }

        // Not enough → snap back
        Animated.spring(translate, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          friction: 7,
          tension: 80,
        }).start();
      },
    })
  ).current;

  const cardAnimatedStyle = {
    transform: [
      { translateX: translate.x },
      { translateY: translate.y },
      { rotate },
    ],
  } as const;

  const backCardStyle = {
    opacity: backOpacity,
    transform: [{ translateY: backTranslateY }, { scale: backScale }],
  } as const;

  // reset when card changes
  useEffect(() => {
    resetCard();
    hapticState.current = { left: false, right: false, up: false };
  }, [currentQuestionId, resetCard]);

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.cardArea}>
        {/* Back card (deck) */}
        {nextQuestion ? (
          <Animated.View style={[styles.backCardWrap, backCardStyle]} pointerEvents="none">
            <QuestionCard
              label={questionsShown.length % 2 === 0 ? t('game.youFirst') : t('game.partnerFirst')}
              question={nextQuestion.text[language]}
            />
          </Animated.View>
        ) : null}

        {/* Front card (draggable) */}
        <Animated.View style={[styles.frontCardWrap, cardAnimatedStyle]} {...panResponder.panHandlers}>
          {/* Overlays */}
          <Animated.View style={[styles.badge, styles.badgeLeft, { opacity: nextOpacity }]}>
            <Text style={styles.badgeText}>NEXT</Text>
          </Animated.View>

          <Animated.View style={[styles.badge, styles.badgeRight, { opacity: likeOpacity }]}>
            <Text style={styles.badgeText}>LIKE</Text>
          </Animated.View>

          <Animated.View style={[styles.badge, styles.badgeTop, { opacity: skipOpacity }]}>
            <Text style={styles.badgeText}>SKIP</Text>
          </Animated.View>

          <QuestionCard
            label={questionsShown.length % 2 === 1 ? t('game.youFirst') : t('game.partnerFirst')}
            question={currentQuestion.text[language]}
          />
        </Animated.View>
      </View>

      {__DEV__ && debugVisible ? (
        <View style={[styles.devOverlay, { bottom: insets.bottom + 82 }]}>
          <Text style={styles.devText}>Phase: {`${currentPhase.charAt(0).toUpperCase()}${currentPhase.slice(1)}`}</Text>
          <Text style={styles.devText}>Intensity: {targetIntensity.toFixed(1)}</Text>
          <Text style={styles.devText}>Shown: {questionsShown.length}</Text>
          <Text style={styles.devText}>Skipped: {stats.skipped}</Text>
          <Text style={styles.devText}>Time Left: {formatCountdown(timerSecondsLeft)}</Text>
        </View>
      ) : null}

      <View style={[styles.sessionBar, { bottom: insets.bottom + 16 }]}>
        <Pressable
          onLongPress={__DEV__ ? () => setDebugVisible((prev) => !prev) : undefined}
          delayLongPress={280}
        >
          <Text style={styles.sessionTimer}>{formatCountdown(timerSecondsLeft)}</Text>
        </Pressable>

        <Text style={styles.sessionStatus}>{`${stats.viewed} seen · ${stats.skipped} skipped`}</Text>

        <Pressable
          style={styles.sessionHeartButton}
          onPress={() => {
            if (!favorite) registerFavoriteAdded();
            toggleFavorite(currentQuestion.id);
          }}
        >
          <Text style={styles.sessionHeartText}>{favorite ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 20 },
  title: { color: '#FFF' },

  cardArea: { flex: 1, justifyContent: 'center', paddingBottom: 96 },

  backCardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  frontCardWrap: {
    // sits above back card
  },

  badge: {
    position: 'absolute',
    zIndex: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(17,24,39,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: { color: '#F9FAFB', fontWeight: '800', letterSpacing: 1 },
  badgeLeft: { top: 16, left: 16 },
  badgeRight: { top: 16, right: 16 },
  badgeTop: { top: 16, alignSelf: 'center' },

  sessionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(20,24,34,0.88)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTimer: {
    color: '#F3F4F6',
    fontSize: 19,
    fontWeight: '700',
    minWidth: 64,
  },
  sessionStatus: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  sessionHeartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sessionHeartText: { color: '#F472B6', fontSize: 24 },
  devOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(10,12,18,0.75)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  devText: { color: '#93C5FD', fontSize: 12, lineHeight: 18 },
});
