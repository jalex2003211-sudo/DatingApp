import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/types';
import type { DurationKey } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseDuration'>;

const DURATIONS: DurationKey[] = ['short', 'medium', 'long'];

export function ChooseDurationScreen({ navigation, route }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Header title={t('duration.title')} subtitle={t(`mood.${route.params.mood}`)} />
      {DURATIONS.map((duration) => (
        <PrimaryButton
          key={duration}
          label={t(`duration.${duration}`)}
          onPress={() => navigation.replace('Game', { mood: route.params.mood, duration })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20 },
});
