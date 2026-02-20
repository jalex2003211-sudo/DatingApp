import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { QuestionCard } from '../components/QuestionCard';
import { getSessionQuestionsForMood } from '../engine/normalizeQuestions';
import { usePrefsStore } from '../state/prefsStore';
import { FavoriteLikedBy, useFavoritesStore } from '../state/favoritesStore';
import { useSessionStore } from '../state/sessionStore';
import { RootStackParamList } from '../types';
import { getActiveSpeakerGender } from '../utils/getActiveSpeakerGender';
import { formatCountdown } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export const GameScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const language = usePrefsStore((s) => s.language);
  const {
    mood,
    relationshipStage,
    currentQuestionId,
    questionsShown,
    currentPhase,
    targetIntensity,
    nextQuestionId,
    timerSecondsLeft,
    stats,
    activeSpeakerRole,
    partnerA,
    partnerB,
    completed,
    endReason,
    nextCard,
    skipCard,
    tick,
    endSession,
    registerFavoriteAdded,
    getActiveThemeTokens
  } = useSessionStore();

  const activeTheme = getActiveThemeTokens();

  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const normalizedDeck = useMemo(() => {
    if (!mood || !relationshipStage) return [];
    return getSessionQuestionsForMood(mood, relationshipStage);
  }, [mood, relationshipStage]);

  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null;
    return normalizedDeck.find((q) => q.id === currentQuestionId) ?? null;
  }, [currentQuestionId, normalizedDeck]);

  const nextQuestion = useMemo(() => {
    if (!nextQuestionId) return null;
    return normalizedDeck.find((q) => q.id === nextQuestionId) ?? null;
  }, [nextQuestionId, normalizedDeck]);

  useEffect(() => {
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (timerSecondsLeft <= 0 && !endReason) {
      endSession({ reason: 'TIME_UP' });
      navigation.replace('End', { reason: 'TIME_UP' });
    }
  }, [timerSecondsLeft, navigation, endReason, endSession]);

  const previousQuestionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const previousQuestionId = previousQuestionIdRef.current;
    previousQuestionIdRef.current = currentQuestionId;

    if (previousQuestionId && currentQuestionId === null && completed) {
      navigation.replace('End', { reason: endReason ?? 'DECK_EXHAUSTED' });
    }
  }, [completed, currentQuestionId, endReason, navigation]);

  const favorite = currentQuestion ? isFavorite(currentQuestion.id) : false;
  const [debugVisible, setDebugVisible] = useState(false);

  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const H_THRESHOLD = Math.max(90, width * 0.22);
  const UP_THRESHOLD = 90;

  const likeOpacity = translate.x.interpolate({
    inputRange: [0, H_THRESHOLD * 0.6, H_THRESHOLD],
    outputRange: [0, 0.25, 1],
    extrapolate: 'clamp'
  });
  const nextOpacity = translate.x.interpolate({
    inputRange: [-H_THRESHOLD, -H_THRESHOLD * 0.6, 0],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp'
  });
  const skipOpacity = translate.y.interpolate({
    inputRange: [-UP_THRESHOLD, -UP_THRESHOLD * 0.6, 0],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp'
  });

  const backScale = translate.x.interpolate({
    inputRange: [-width * 0.4, 0, width * 0.4],
    outputRange: [0.97, 0.95, 0.97],
    extrapolate: 'clamp'
  });
  const backTranslateY = translate.y.interpolate({
    inputRange: [-height * 0.3, 0, height * 0.3],
    outputRange: [6, 12, 18],
    extrapolate: 'clamp'
  });
  const backOpacity = translate.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp'
  });

  const rotate = translate.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  const resetCard = useCallback(() => {
    translate.setValue({ x: 0, y: 0 });
  }, [translate]);

  const animateOffAndThen = useCallback(
    (toX: number, toY: number, after: () => void) => {
      Animated.timing(translate, {
        toValue: { x: toX, y: toY },
        duration: 180,
        useNativeDriver: true
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

  const toggleCurrentQuestionFavorite = useCallback((questionId: string, alreadyFavorite: boolean) => {
    if (__DEV__) {
      console.log('[fav] toggle', { id: questionId, language, alreadyFavorite });
    }

    if (!questionId) {
      if (__DEV__) {
        console.warn('[fav] toggle skipped: missing question id');
      }
      return;
    }

    if (!alreadyFavorite) {
      const likedBy: FavoriteLikedBy = getActiveSpeakerGender(activeSpeakerRole, partnerA, partnerB);
      registerFavoriteAdded();
      toggleFavorite(questionId, likedBy);
      return;
    }

    toggleFavorite(questionId);
  }, [activeSpeakerRole, language, partnerA, partnerB, registerFavoriteAdded, toggleFavorite]);

  const onSwipeRightFavNext = useCallback(() => {
    if (!currentQuestion) return;

    toggleCurrentQuestionFavorite(currentQuestion.id, favorite);
    animateOffAndThen(width * 1.1, 0, () => nextCard());
  }, [animateOffAndThen, currentQuestion, favorite, nextCard, toggleCurrentQuestionFavorite, width]);

  const onSwipeUpSkip = useCallback(() => {
    animateOffAndThen(0, -height * 0.6, () => skipCard());
  }, [animateOffAndThen, skipCard, height]);

  const hapticState = useRef({ left: false, right: false, up: false });

  const maybeHaptic = useCallback(
    async (dx: number, dy: number) => {
      const up = dy < -UP_THRESHOLD && Math.abs(dx) < H_THRESHOLD;
      const left = dx < -H_THRESHOLD;
      const right = dx > H_THRESHOLD;

      if (!left) hapticState.current.left = false;
      if (!right) hapticState.current.right = false;
      if (!up) hapticState.current.up = false;

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
    },
    [H_THRESHOLD, UP_THRESHOLD]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        translate.setValue({ x: gesture.dx, y: gesture.dy });
        void maybeHaptic(gesture.dx, gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const dx = gesture.dx;
        const dy = gesture.dy;

        if (dy < -UP_THRESHOLD && Math.abs(dx) < H_THRESHOLD) {
          onSwipeUpSkip();
          return;
        }

        if (dx < -H_THRESHOLD) {
          onSwipeLeftNext();
          return;
        }

        if (dx > H_THRESHOLD) {
          onSwipeRightFavNext();
          return;
        }

        Animated.spring(translate, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          friction: 7,
          tension: 80
        }).start();
      }
    })
  ).current;

  const cardAnimatedStyle = {
    transform: [{ translateX: translate.x }, { translateY: translate.y }, { rotate }]
  } as const;

  const backCardStyle = {
    opacity: backOpacity,
    transform: [{ translateY: backTranslateY }, { scale: backScale }]
  } as const;

  useEffect(() => {
    resetCard();
    hapticState.current = { left: false, right: false, up: false };
  }, [currentQuestionId, resetCard]);

  const resolveGenderLabel = useCallback(
    (role: 'A' | 'B') => {
      const gender = role === 'A' ? partnerA.gender : partnerB.gender;
      if (gender === 'MALE') return t('genderLabel.male');
      if (gender === 'FEMALE') return t('genderLabel.female');
      return t('genderLabel.neutral');
    },
    [partnerA.gender, partnerB.gender, t]
  );

  const activeLabel = resolveGenderLabel(activeSpeakerRole);
  const nextLabel = resolveGenderLabel(activeSpeakerRole === 'A' ? 'B' : 'A');

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
        {nextQuestion ? (
          <Animated.View style={[styles.backCardWrap, backCardStyle]} pointerEvents="none">
            <QuestionCard
              label={nextLabel}
              question={nextQuestion.text[language]}
              accentColor={activeTheme.accent}
              chipBg={activeTheme.chipBg}
              borderGlow={activeTheme.borderGlow}
            />
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.frontCardWrap, cardAnimatedStyle]} {...panResponder.panHandlers}>
          <Animated.View style={[styles.badge, styles.badgeCenterLeft, { opacity: nextOpacity }]}> 
            <Text style={styles.badgeText}>{t('game.next').toUpperCase()}</Text>
          </Animated.View>

          <Animated.View style={[styles.badge, styles.badgeCenterRight, { opacity: likeOpacity }]}> 
            <Text style={styles.badgeText}>{t('game.like').toUpperCase()}</Text>
          </Animated.View>

          <Animated.View style={[styles.badge, styles.badgeTop, { opacity: skipOpacity }]}> 
            <Text style={styles.badgeText}>{t('game.skip').toUpperCase()}</Text>
          </Animated.View>

          <QuestionCard
            label={activeLabel}
            question={currentQuestion.text[language]}
            accentColor={activeTheme.accent}
            chipBg={activeTheme.chipBg}
            borderGlow={activeTheme.borderGlow}
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
        <Pressable onLongPress={__DEV__ ? () => setDebugVisible((prev) => !prev) : undefined} delayLongPress={280}>
          <Text style={styles.sessionTimer}>{formatCountdown(timerSecondsLeft)}</Text>
        </Pressable>

        <Text style={styles.sessionStatus}>{t('game.sessionStatus', { seen: stats.viewed, skipped: stats.skipped })}</Text>

        <Pressable
          style={styles.sessionHeartButton}
          onPress={() => {
            if (__DEV__) {
              console.log('[fav] press', { id: currentQuestion?.id, lang: language });
            }
            toggleCurrentQuestionFavorite(currentQuestion.id, favorite);
          }}
        >
          <Text style={[styles.sessionHeartText, { color: activeTheme.heart }]}>{favorite ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 20 },
  title: { color: '#FFF' },
  cardArea: { flex: 1, justifyContent: 'center', paddingBottom: 96 },
  backCardWrap: { position: 'absolute', left: 0, right: 0 },
  frontCardWrap: { overflow: 'visible', zIndex: 10 },
  badge: {
    position: 'absolute',
    zIndex: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(17,24,39,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)'
  },
  badgeText: { color: '#F9FAFB', fontWeight: '800', letterSpacing: 1 },
  badgeCenterLeft: { top: 16, left: '50%', transform: [{ translateX: -92 }] },
  badgeCenterRight: { top: 16, left: '50%', transform: [{ translateX: 12 }] },
  badgeTop: { top: 16, alignSelf: 'center' },
  sessionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(20,24,34,0.92)',
    borderColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10
  },
  sessionTimer: { color: '#F3F4F6', fontSize: 19, fontWeight: '700', minWidth: 64 },
  sessionStatus: { color: '#B6BDC8', fontSize: 13, fontWeight: '500' },
  sessionHeartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  sessionHeartText: { fontSize: 24 },
  devOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(10,12,18,0.75)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  devText: { color: '#93C5FD', fontSize: 12, lineHeight: 18 }
});
