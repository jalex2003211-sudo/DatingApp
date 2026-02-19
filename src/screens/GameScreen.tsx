import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { QuestionCard } from '../components/QuestionCard';
import { decksByMood } from '../data/decks';
import { useFavoritesStore } from '../state/favoritesStore';
import { usePrefsStore } from '../state/prefsStore';
import { useSessionStore } from '../state/sessionStore';
import { RootStackParamList } from '../types';
import { formatCountdown } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export const GameScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const language = usePrefsStore((s) => s.language);
  const {
    mood,
    currentIndex,
    shuffledIds,
    timerSecondsLeft,
    paused,
    stats,
    nextCard,
    skipCard,
    tick,
    togglePause,
    endSession,
    registerFavoriteAdded
  } = useSessionStore();
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const currentQuestion = useMemo(() => {
    if (!mood || shuffledIds.length === 0) return null;
    const id = shuffledIds[currentIndex];
    return decksByMood[mood].find((q) => q.id === id) ?? null;
  }, [mood, shuffledIds, currentIndex]);

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

  const handleNext = useCallback(() => nextCard(), [nextCard]);

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('loading')}</Text>
      </View>
    );
  }

  const favorite = isFavorite(currentQuestion.id);

  return (
    <View style={styles.container}>
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

      <PanGestureHandler
        onHandlerStateChange={(e) => {
          if (e.nativeEvent.state === State.END && e.nativeEvent.translationX < -45) {
            handleNext();
          }
        }}
      >
        <View>
          <QuestionCard
            label={currentIndex % 2 === 0 ? t('game.youFirst') : t('game.partnerFirst')}
            question={currentQuestion.text[language]}
          />
        </View>
      </PanGestureHandler>

      <Text style={styles.hint}>{t('game.swipeHint')}</Text>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleNext}>
          <Text style={styles.actionText}>{t('game.next')}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={skipCard}>
          <Text style={styles.actionText}>{t('game.skip')}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={togglePause}>
          <Text style={styles.actionText}>{paused ? t('game.resume') : t('game.pause')}</Text>
        </Pressable>
      </View>

      <Text style={styles.stats}>{`${t('end.viewed')}: ${stats.viewed} • ${t('end.skipped')}: ${stats.skipped}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 20, justifyContent: 'space-between' },
  title: { color: '#FFF' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  timer: { color: '#A5B4FC', fontSize: 28, fontWeight: '700' },
  heart: { padding: 10, backgroundColor: '#1F2937', borderRadius: 20 },
  heartText: { color: '#F472B6', fontSize: 24 },
  hint: { color: '#9CA3AF', textAlign: 'center', marginTop: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionButton: { flex: 1, backgroundColor: '#374151', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#F9FAFB', fontWeight: '600' },
  stats: { color: '#D1D5DB', textAlign: 'center', marginBottom: 8 }
});
