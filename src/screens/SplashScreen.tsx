import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    const timeout = setTimeout(() => navigation.replace('Home'), 900);
    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Header title={t('common.appName')} subtitle="♥" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115', justifyContent: 'center', alignItems: 'center' },
});
