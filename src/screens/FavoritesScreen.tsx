import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CardView } from '../components/CardView';
import { Header } from '../components/Header';
import type { RootStackParamList } from '../navigation/types';
import { useFavoritesStore } from '../state/favoritesStore';
import { getDeckForMood } from '../data/decks';
import { MOODS } from '../utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

const allCards = MOODS.flatMap((mood) => getDeckForMood(mood));

export function FavoritesScreen({}: Props) {
  const { t } = useTranslation();
  const ids = useFavoritesStore((state) => state.favoriteIds);

  const items = allCards.filter((card) => ids.includes(card.id));

  return (
    <View style={styles.container}>
      <Header title={t('favorites.title')} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CardView text={t(item.textKey)} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('common.noFavorites')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20 },
  empty: { color: '#A9B0C3' },
});
