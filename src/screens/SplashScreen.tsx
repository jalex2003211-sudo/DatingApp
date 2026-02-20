import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useProfileStore } from '../state/profileStore';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);

  const hasProfile = hydrated && Boolean(profile);
  const ctaLabel = hydrated ? (hasProfile ? t('continue') : t('start')) : t('loading');

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.subtitle}>{t('splashTagline')}</Text>
      </View>

      <AppButton
        label={ctaLabel}
        disabled={!hydrated}
        onPress={() => navigation.replace(hasProfile ? 'ChooseRelationshipStage' : 'ProfileSetup')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 84
  },
  hero: {
    gap: 14
  },
  title: { color: '#F9FAFB', fontSize: 44, fontWeight: '700', textAlign: 'left' },
  subtitle: { color: '#D1D5DB', fontSize: 17, lineHeight: 24, maxWidth: 300 }
});
