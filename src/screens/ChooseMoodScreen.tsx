import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/types';
import { MOODS } from '../utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseMood'>;

export function ChooseMoodScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Header title={t('mood.title')} />
      {MOODS.map((mood) => (
        <PrimaryButton key={mood} label={t(`mood.${mood}`)} onPress={() => navigation.navigate('ChooseDuration', { mood })} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20 },
});
