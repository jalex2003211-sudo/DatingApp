import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '../state/profileStore';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const hydrated = useProfileStore((s) => s.hydrated);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    if (!hydrated) return;
    navigation.replace(profile ? 'Home' : 'ProfileSetup');
  }, [hydrated, navigation, profile]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('appName')}</Text>
      <Text style={styles.subtitle}>{t('splashTagline')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827', padding: 24 },
  title: { color: '#F9FAFB', fontSize: 42, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  subtitle: { color: '#9CA3AF', fontSize: 16, textAlign: 'center' }
});
