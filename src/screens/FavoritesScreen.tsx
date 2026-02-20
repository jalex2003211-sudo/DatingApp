import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { FavoriteEntry, FavoriteLikedBy, useFavoritesStore } from '../state/favoritesStore';
import { usePrefsStore } from '../state/prefsStore';
import { useSessionStore } from '../state/sessionStore';
import { Question, RootStackParamList } from '../types';
import { getAllNormalizedQuestions } from '../engine/normalizeQuestions';
import { shuffle } from '../utils/shuffle';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;
type FilterOption = 'all' | 'male' | 'female';

const likedByAccent: Record<FavoriteLikedBy, { stripe: string; chipBg: string; text: string }> = {
  male: { stripe: 'rgba(56, 139, 253, 0.85)', chipBg: 'rgba(56, 139, 253, 0.16)', text: '#BFD8FF' },
  female: { stripe: 'rgba(244, 114, 182, 0.9)', chipBg: 'rgba(244, 114, 182, 0.18)', text: '#FFD2E8' },
  neutral: { stripe: 'rgba(160, 149, 255, 0.78)', chipBg: 'rgba(160, 149, 255, 0.2)', text: '#DCD7FF' }
};

const moodChipColor: Record<Question['mood'], string> = {
  FUN: '#93C5FD',
  DEEP: '#A5B4FC',
  INTIMATE: '#F9A8D4'
};

export const FavoritesScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const lang = usePrefsStore((s) => s.language);
  const favorites = useFavoritesStore((s) => Object.values(s.favoritesById).sort((a, b) => b.createdAt - a.createdAt));
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const startFavoritesSession = useSessionStore((s) => s.startFavoritesSession);

  const [filter, setFilter] = useState<FilterOption>('all');

  const questionsById = useMemo(() => {
    const map = new Map<string, Question>();
    getAllNormalizedQuestions().forEach((question) => map.set(question.id, question));
    return map;
  }, []);


  const filteredEntries = useMemo(() => {
    if (filter === 'all') return favorites;
    return favorites.filter((entry) => entry.likedBy === filter);
  }, [favorites, filter]);

  const favoriteItems = useMemo(
    () =>
      filteredEntries
        .map((entry) => ({ entry, question: questionsById.get(entry.id) ?? null }))
        .filter((item): item is { entry: FavoriteEntry; question: Question } => Boolean(item.question)),
    [filteredEntries, questionsById]
  );

  const onPressPlayFavorites = () => {
    const favoriteDeck = shuffle(favoriteItems.map((item) => item.question));
    const result = startFavoritesSession(favoriteDeck);
    if (result.ok) {
      navigation.replace('Game');
    }
  };

  const noFavorites = favoriteItems.length === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('favoritesTitle')}</Text>

      <View style={styles.filterRow}>
        {(['all', 'male', 'female'] as FilterOption[]).map((option) => (
          <Pressable
            key={option}
            onPress={() => setFilter(option)}
            style={[styles.filterButton, filter === option ? styles.filterButtonActive : null]}
          >
            <Text style={[styles.filterText, filter === option ? styles.filterTextActive : null]}>
              {t(`favorites.filter.${option}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {noFavorites ? <Text style={styles.empty}>{t('noFavorites')}</Text> : null}

      {favoriteItems.map(({ entry, question }) => {
        const likedByStyle = likedByAccent[entry.likedBy];

        return (
          <View key={entry.id} style={styles.itemShell}>
            <View style={[styles.likedByStripe, { backgroundColor: likedByStyle.stripe }]} />
            <View style={styles.itemBody}>
              <View style={styles.topRow}>
                <View style={[styles.likedByPill, { backgroundColor: likedByStyle.chipBg }]}>
                  <Text style={[styles.likedByText, { color: likedByStyle.text }]}>{t(`favorites.likedBy.${entry.likedBy}`)}</Text>
                </View>
                <View style={[styles.moodPill, { borderColor: moodChipColor[question.mood] }]}>
                  <Text style={[styles.moodText, { color: moodChipColor[question.mood] }]}>{t(`mood.${question.mood}`)}</Text>
                </View>
              </View>

              <Text style={styles.question}>{question.text[lang]}</Text>
              <AppButton label={t('remove')} variant="secondary" onPress={() => removeFavorite(entry.id)} />
            </View>
          </View>
        );
      })}

      <View style={styles.playButtonWrap}>
        <AppButton label={t('favorites.playFavorites')} onPress={onPressPlayFavorites} disabled={noFavorites} />
      </View>

      <AppButton label={t('end.home')} onPress={() => navigation.navigate('Home')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#F9FAFB', fontSize: 30, fontWeight: '700', marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  filterButtonActive: { borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.15)' },
  filterText: { color: '#B7BFCC', fontWeight: '600' },
  filterTextActive: { color: '#DCEBFF' },
  empty: { color: '#9CA3AF' },
  itemShell: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  likedByStripe: { height: 4 },
  itemBody: { padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  likedByPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  likedByText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  moodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(17,24,39,0.4)'
  },
  moodText: { fontSize: 11, fontWeight: '700' },
  question: { color: '#E5E7EB', fontSize: 16, marginBottom: 10 },
  playButtonWrap: { marginTop: 8, marginBottom: 10 }
});
