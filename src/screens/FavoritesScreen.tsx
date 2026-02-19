import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { decksByMood } from '../data/decks';
import { useFavoritesStore } from '../state/favoritesStore';
import { usePrefsStore } from '../state/prefsStore';
import { Mood, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export const FavoritesScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const lang = usePrefsStore((s) => s.language);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);

  const moods: Mood[] = ['FUN', 'DEEP', 'INTIMATE'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('favoritesTitle')}</Text>
      {favoriteIds.length === 0 ? <Text style={styles.empty}>{t('noFavorites')}</Text> : null}
      {moods.map((mood) => {
        const items = decksByMood[mood].filter((q) => favoriteIds.includes(q.id));
        if (items.length === 0) return null;
        return (
          <View key={mood} style={styles.group}>
            <Text style={styles.groupTitle}>{t(`mood.${mood}`)}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.question}>{item.text[lang]}</Text>
                <AppButton label={t('remove')} variant="secondary" onPress={() => removeFavorite(item.id)} />
              </View>
            ))}
          </View>
        );
      })}
      <AppButton label={t('end.home')} onPress={() => navigation.navigate('Home')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#F9FAFB', fontSize: 30, fontWeight: '700', marginBottom: 12 },
  empty: { color: '#9CA3AF' },
  group: { marginTop: 16 },
  groupTitle: { color: '#A5B4FC', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  item: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14, marginBottom: 10 },
  question: { color: '#E5E7EB', fontSize: 16, marginBottom: 8 }
});
