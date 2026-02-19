import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Header title={t('common.appName')} subtitle={t('home.title')} />
      <PrimaryButton label={t('home.chooseMood')} onPress={() => navigation.navigate('ChooseMood')} />
      <PrimaryButton label={t('home.favorites')} onPress={() => navigation.navigate('Favorites')} />
      <PrimaryButton label={t('home.settings')} onPress={() => navigation.navigate('Settings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', padding: 20, justifyContent: 'center' },
});
