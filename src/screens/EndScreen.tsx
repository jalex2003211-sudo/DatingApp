import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'End'>;

export function EndScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { stats } = route.params;

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.replace('Home');
      return true;
    });
    return () => backSub.remove();
  }, [navigation]);

  const minutes = Math.floor(stats.elapsedSeconds / 60);
  const seconds = stats.elapsedSeconds % 60;

  return (
    <View style={styles.container}>
      <Header title={t('end.title')} />
      <Text style={styles.row}>{t('end.answered', { count: stats.answeredCards })}</Text>
      <Text style={styles.row}>{t('end.favorites', { count: stats.favoritesAdded })}</Text>
      <Text style={styles.row}>{t('end.elapsed', { minutes, seconds })}</Text>
      <PrimaryButton label={t('common.backHome')} onPress={() => navigation.replace('Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20, justifyContent: 'center' },
  row: { color: '#F5F7FF', fontSize: 18, marginBottom: 10 },
});
