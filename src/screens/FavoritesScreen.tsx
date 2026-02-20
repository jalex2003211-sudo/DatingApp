import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { getAllNormalizedQuestions } from '../engine/normalizeQuestions';
import { FavoriteEntry, useFavoritesStore } from '../state/favoritesStore';
import { usePrefsStore } from '../state/prefsStore';
import { useProfileStore } from '../state/profileStore';
import { useSessionStore } from '../state/sessionStore';
import { Question, RootStackParamList } from '../types';
import { getAccentForPartner } from '../utils/accent';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;
type FilterOption = 'all' | 'A' | 'B';

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
  const profile = useProfileStore((s) => s.profile);

  const [filter, setFilter] = useState<FilterOption>('all');

  const questionsById = useMemo(() => {
    const map = new Map<string, Question>();
    getAllNormalizedQuestions().forEach((question) => map.set(question.id, question));
    return map;
  }, []);

  const resolveLikedBy = (entry: FavoriteEntry): 'A' | 'B' => {
    if (entry.likedBy === 'A' || entry.likedBy === 'B') return entry.likedBy;
    if (!profile) return 'A';
    if (entry.likedBy === 'male') {
      if (profile.partnerA.gender === 'male') return 'A';
      if (profile.partnerB.gender === 'male') return 'B';
    }
    if (entry.likedBy === 'female') {
      if (profile.partnerA.gender === 'female') return 'A';
      if (profile.partnerB.gender === 'female') return 'B';
    }
    return 'A';
  };

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return favorites;
    return favorites.filter((entry) => resolveLikedBy(entry) === filter);
  }, [favorites, filter, profile]);

  const favoriteItems = useMemo(
    () =>
      filteredEntries
        .map((entry) => ({ entry, question: questionsById.get(entry.id) ?? null }))
        .filter((item): item is { entry: FavoriteEntry; question: Question } => Boolean(item.question)),
    [filteredEntries, questionsById]
  );

  const onPressPlayFavorites = () => {
    const favoriteIds = favoriteItems.map((item) => item.question.id);
    if (favoriteIds.length === 0) {
      Alert.alert(t('favoritesTitle'), t('noFavorites'));
      return;
    }
    const result = startFavoritesSession(favoriteIds);
    if (result.ok) navigation.navigate('Game');
  };

  const noFavorites = favoriteItems.length === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('favoritesTitle')}</Text>

      <View style={styles.filterRow}>
        {(['all', 'A', 'B'] as FilterOption[]).map((option) => (
          <Pressable
            key={option}
            onPress={() => setFilter(option)}
            style={[styles.filterButton, filter === option ? styles.filterButtonActive : null]}
          >
            <Text style={[styles.filterText, filter === option ? styles.filterTextActive : null]}>
              {option === 'all' ? t('favorites.filter.all') : t(`favorites.filter.${option}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {noFavorites ? <Text style={styles.empty}>{t('noFavorites')}</Text> : null}

      {favoriteItems.map(({ entry, question }) => {
        const likedBy = resolveLikedBy(entry);
        const partner = likedBy === 'A' ? profile?.partnerA : profile?.partnerB;
        const accent = partner ? getAccentForPartner(partner) : '#A78BFA';

        return (
          <View key={entry.id} style={styles.itemShell}>
            <View style={[styles.likedByStripe, { backgroundColor: accent }]} />
            <View style={styles.itemBody}>
              <View style={styles.topRow}>
                <View style={styles.likedByPill}>
                  <View style={[styles.badgeDot, { backgroundColor: accent }]} />
                  <Text style={styles.likedByText}>{t(`favorites.likedBy.${likedBy}`)}</Text>
                </View>
                <View style={[styles.moodPill, { borderColor: moodChipColor[question.mood] }]}>
                  <Text style={[styles.moodText, { color: moodChipColor[question.mood] }]}>{t(`mood.${question.mood}`)}</Text>
                </View>
              </View>

              <Text style={styles.questionText}>{question.text[lang]}</Text>

              <View style={styles.actionsRow}>
                <AppButton label={t('remove')} variant="secondary" onPress={() => removeFavorite(entry.id)} />
              </View>
            </View>
          </View>
        );
      })}

      <AppButton label={t('favorites.playFavorites')} onPress={onPressPlayFavorites} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingBottom: 36 },
  title: { color: '#F9FAFB', fontSize: 30, fontWeight: '700', marginBottom: 16 },
  filterRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  filterButton: { borderRadius: 999, borderWidth: 1, borderColor: '#374151', paddingHorizontal: 14, paddingVertical: 7 },
  filterButtonActive: { backgroundColor: '#4F46E5', borderColor: '#6366F1' },
  filterText: { color: '#D1D5DB', fontWeight: '600' },
  filterTextActive: { color: '#F9FAFB' },
  empty: { color: '#9CA3AF', marginBottom: 24 },
  itemShell: { borderRadius: 14, overflow: 'hidden', marginBottom: 12, backgroundColor: '#1F2937' },
  likedByStripe: { height: 4 },
  itemBody: { padding: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  likedByPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeDot: { width: 10, height: 10, borderRadius: 999 },
  likedByText: { color: '#E5E7EB', fontSize: 12, fontWeight: '700' },
  moodPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  moodText: { fontWeight: '700', fontSize: 12 },
  questionText: { color: '#F3F4F6', fontSize: 16, lineHeight: 22 },
  actionsRow: { marginTop: 12 }
});
