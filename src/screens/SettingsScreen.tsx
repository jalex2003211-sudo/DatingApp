import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { LanguageToggle } from '../components/LanguageToggle';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Header title={t('settings.title')} subtitle={t('common.language')} />
      <LanguageToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20 },
});
