import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
      <View style={[styles.headerWrap, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <Text style={styles.timer}>{formatCountdown(timerSecondsLeft)}</Text>

          <Pressable
            style={styles.heart}
            onPress={() => {
              if (!favorite) registerFavoriteAdded();
              toggleFavorite(currentQuestion.id);
            }}
          >
            <Text style={styles.heartText}>{favorite ? '♥' : '♡'}</Text>
          </Pressable>
        </View>

        {__DEV__ ? (
          <View style={styles.devOverlay}>
            <Text style={styles.devText}>Phase: {`${currentPhase.charAt(0).toUpperCase()}${currentPhase.slice(1)}`}</Text>
            <Text style={styles.devText}>Intensity: {targetIntensity.toFixed(1)}</Text>
            <Text style={styles.devText}>Shown: {questionsShown.length}</Text>
            <Text style={styles.devText}>Skipped: {stats.skipped}</Text>
            <Text style={styles.devText}>Time Left: {formatCountdown(timerSecondsLeft)}</Text>
          </View>
        ) : null}
      </View>

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

      {!__DEV__ && questionsShown.length < 5 ? (
        <Text style={styles.hint}>Swipe ← next · Swipe → favorite · Swipe ↑ skip</Text>
      ) : null}

      <Text style={styles.stats}>
        {`${t('end.viewed')}: ${stats.viewed} • ${t('end.skipped')}: ${stats.skipped}`}
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 20 },
  title: { color: '#FFF' },

  headerWrap: { alignItems: 'stretch' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  timer: {
    color: '#A5B4FC',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0.8,
    marginLeft: 16,
  },
  heart: {
    width: 44,
    height: 44,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 22,
  },
  heartText: { color: '#F472B6', fontSize: 24 },

  cardArea: { flex: 1, justifyContent: 'center', marginTop: 8 },

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

  hint: { color: '#9CA3AF', textAlign: 'center', marginBottom: 8, opacity: 0.82 },

  stats: { color: '#D1D5DB', textAlign: 'center', marginBottom: 8 },
  devOverlay: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 16,
    backgroundColor: 'rgba(10,15,28,0.7)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  devText: { color: '#93C5FD', fontSize: 12, lineHeight: 18 },
});
