import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CardView } from '../components/CardView';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/types';
import { useSessionStore } from '../state/sessionStore';
import { useFavoritesStore } from '../state/favoritesStore';
import { DURATION_SECONDS } from '../utils/constants';
import { useCountdownTimer } from '../utils/useCountdownTimer';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export function GameScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { mood, duration } = route.params;
  const session = useSessionStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const [showPausedBanner, setShowPausedBanner] = useState(false);
  const anim = useRef(new Animated.Value(1)).current;

  const timer = useCountdownTimer({
    totalSeconds: DURATION_SECONDS[duration],
    onFinish: () => {
      navigation.replace('End', { stats: session.buildStats(0) });
      session.resetSession();
    },
  });

  useEffect(() => {
    session.startSession(mood, duration);
    timer.reset(DURATION_SECONDS[duration]);
    timer.start();
    return () => {
      timer.reset(0);
    };
  }, [duration, mood]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && timer.isRunning) {
        timer.pause();
        setShowPausedBanner(true);
      }
    });
    return () => sub.remove();
  }, [timer]);

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      timer.pause();
      Alert.alert(t('game.exitTitle'), t('game.exitBody'), [
        { text: t('common.cancel'), style: 'cancel', onPress: () => timer.start() },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            session.resetSession();
            navigation.replace('Home');
          },
        },
      ]);
      return true;
    });

    return () => backSub.remove();
  }, [navigation, session, t, timer]);

  const currentCard = session.cards[session.currentIndex];

  const whoFirst = useMemo(() => {
    const isEven = session.currentIndex % 2 === 0;
    return isEven ? t('game.you') : t('game.partner');
  }, [session.currentIndex, t]);

  useEffect(() => {
    if (!currentCard) {
      navigation.replace('End', { stats: session.buildStats(timer.remainingSeconds) });
      session.resetSession();
    }
  }, [currentCard, navigation, session, timer.remainingSeconds]);

  if (!currentCard) return null;

  const onNext = async () => {
    try {
      const haptics = await import('expo-haptics');
      await haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
    } catch {
      // optional dependency
    }
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
    session.nextCard();
  };

  const onToggleFavorite = async () => {
    const currentlyFavorite = isFavorite(currentCard.id);
    toggleFavorite(currentCard.id);
    if (!currentlyFavorite) {
      session.registerFavoriteAdded();
    }

    try {
      const haptics = await import('expo-haptics');
      await haptics.selectionAsync();
    } catch {
      // optional dependency
    }
  };

  const minutes = Math.floor(timer.remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (timer.remainingSeconds % 60).toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <Header title={`${minutes}:${seconds}`} subtitle={t('game.whoFirst', { person: whoFirst })} />
      {showPausedBanner ? <Text style={styles.pausedBanner}>{t('game.paused')}</Text> : null}
      <Animated.View style={{ transform: [{ scale: anim }] }}>
        <CardView text={t(currentCard.textKey)} />
      </Animated.View>
      <View style={styles.actions}>
        <PrimaryButton
          label={timer.isRunning ? t('common.pause') : t('common.resume')}
          onPress={() => {
            if (timer.isRunning) {
              timer.pause();
            } else {
              timer.start();
              setShowPausedBanner(false);
            }
          }}
        />
        <PrimaryButton
          label={isFavorite(currentCard.id) ? t('common.removeFavorite') : t('common.favorite')}
          onPress={() => void onToggleFavorite()}
        />
        <PrimaryButton label={t('common.next')} onPress={() => void onNext()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20 },
  pausedBanner: { color: '#F8C471', marginBottom: 12, fontWeight: '600' },
  actions: { marginTop: 16 },
});
