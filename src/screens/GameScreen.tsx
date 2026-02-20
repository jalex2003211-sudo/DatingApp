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
import { getAllNormalizedQuestions, getSessionQuestionsForMood } from '../engine/normalizeQuestions';
import { usePrefsStore } from '../state/prefsStore';
import { FavoriteLikedBy, useFavoritesStore, useFavoriteMeta, useIsFavorite } from '../state/favoritesStore';
import { useProfileStore } from '../state/profileStore';
import { buildAccentTokens, getAccentForPartner } from '../utils/accent';
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
    relationshipStage,
    customDeckIds,
    currentQuestionId,
    questionsShown,
    currentPhase,
    targetIntensity,
    nextQuestionId,
    timerSecondsLeft,
    stats,
    activeSpeakerRole,
    completed,
    endReason,
    nextCard,
    skipCard,
    tick,
    endSession,
    registerFavoriteAdded
  } = useSessionStore();

  const profile = useProfileStore((s) => s.profile);

  const activeTheme = useMemo(() => {
    if (!profile) return { accent: "#A78BFA", heart: "#A78BFA", chipBg: "rgba(167,139,250,0.14)", borderGlow: "rgba(167,139,250,0.30)" };
    const activePartner = activeSpeakerRole === 'A' ? profile.partnerA : profile.partnerB;
    return buildAccentTokens(getAccentForPartner(activePartner));
  }, [activeSpeakerRole, profile]);

  const getCurrentPlayerLabel = useCallback(
    (shownCount: number) => {
      const fallbackA = 'Partner A';
      const fallbackB = 'Partner B';

      if (shownCount % 2 === 0) {
        return profile?.partnerA.name?.trim() || fallbackA;
      }

      return profile?.partnerB.name?.trim() || fallbackB;
    },
    [profile]
  );

  const ensureFavorite = useFavoritesStore((s) => s.ensureFavorite);

  const normalizedDeck = useMemo(() => {
    if (customDeckIds?.length) {
      const allQuestions = getAllNormalizedQuestions();
      const customDeckSet = new Set(customDeckIds);
      return allQuestions.filter((question) => customDeckSet.has(question.id));
    }

    if (!mood || !relationshipStage) return [];
    return getSessionQuestionsForMood(mood, relationshipStage);
  }, [customDeckIds, mood, relationshipStage]);

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

  const favorite = useIsFavorite(currentQuestion?.id);
  const favoriteMeta = useFavoriteMeta(currentQuestion?.id);
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

  const actionLock = useRef(false);

  const isPartnerATurn = questionsShown.length % 2 === 0;
  const actorGender: FavoriteLikedBy = isPartnerATurn ? 'A' : 'B';

  const onSwipeLeftNext = useCallback(() => {
    if (actionLock.current) return;
    actionLock.current = true;
    animateOffAndThen(-width * 1.1, 0, () => {
      nextCard();
      actionLock.current = false;
    });
  }, [animateOffAndThen, nextCard, width]);

  const onLikeAndNext = useCallback(() => {
    if (!currentQuestion) return;
    if (actionLock.current) return;

    actionLock.current = true;

    const existsBefore = Boolean(favoriteMeta);

    if (__DEV__) {
      console.log('[fav] ensure', { id: currentQuestion.id, language, existsBefore, likedBy: actorGender });
    }

    ensureFavorite(currentQuestion.id, actorGender);

    if (!existsBefore) {
      registerFavoriteAdded();
    }

    animateOffAndThen(width * 1.1, 0, () => {
      nextCard();
      actionLock.current = false;
    });
  }, [actorGender, animateOffAndThen, currentQuestion, ensureFavorite, favoriteMeta, language, nextCard, registerFavoriteAdded, width]);

  const onSwipeUpSkip = useCallback(() => {
    if (actionLock.current) return;
    actionLock.current = true;
    animateOffAndThen(0, -height * 0.6, () => {
      skipCard();
      actionLock.current = false;
    });
  }, [animateOffAndThen, skipCard, height]);

  const hapticState = useRef({ left: false, right: false, up: false });

  const onLeftRef = useRef<() => void>(() => {});
  const onRightRef = useRef<() => void>(() => {});
  const onUpRef = useRef<() => void>(() => {});
  const maybeHapticRef = useRef<(dx: number, dy: number) => void>(() => {});

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

  useEffect(() => {
    onLeftRef.current = onSwipeLeftNext;
  }, [onSwipeLeftNext]);

  useEffect(() => {
    onRightRef.current = onLikeAndNext;
  }, [onLikeAndNext]);

  useEffect(() => {
    onUpRef.current = onSwipeUpSkip;
  }, [onSwipeUpSkip]);

  useEffect(() => {
    maybeHapticRef.current = (dx: number, dy: number) => {
      void maybeHaptic(dx, dy);
    };
  }, [maybeHaptic]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        translate.setValue({ x: gesture.dx, y: gesture.dy });
        maybeHapticRef.current(gesture.dx, gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const dx = gesture.dx;
        const dy = gesture.dy;

        if (__DEV__) {
          console.log('[swipe]', { dx, dy, currentId: currentQuestion?.id });
        }

        if (dy < -UP_THRESHOLD && Math.abs(dx) < H_THRESHOLD) {
          onUpRef.current();
          return;
        }

        if (dx < -H_THRESHOLD) {
          onLeftRef.current();
          return;
        }

        if (dx > H_THRESHOLD) {
          onRightRef.current();
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
    actionLock.current = false;
    hapticState.current = { left: false, right: false, up: false };
  }, [currentQuestionId, resetCard]);

  const activeLabel = getCurrentPlayerLabel(questionsShown.length);
  const nextLabel = getCurrentPlayerLabel(questionsShown.length + 1);

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
            onRightRef.current();
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
