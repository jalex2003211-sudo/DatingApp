import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useSessionStore } from '../state/sessionStore';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'End'>;

export const EndScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { mood, duration, stats, summary, startSession, resetSession } = useSessionStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('end.title')}</Text>
      <Text style={styles.message}>{t('end.message')}</Text>
      <Text style={styles.stat}>{`${t('end.viewed')}: ${stats.viewed}`}</Text>
      <Text style={styles.stat}>{`${t('end.skipped')}: ${stats.skipped}`}</Text>
      <Text style={styles.stat}>{`${t('end.favorites')}: ${stats.favoritesAdded}`}</Text>

      <Text style={styles.stat}>{`Peak phase: ${summary?.peakPhase ?? stats.peakPhase}`}</Text>
      <Text style={styles.stat}>{`Avg intensity: ${summary?.averageIntensity ?? stats.averageIntensity}`}</Text>
      <Text style={styles.stat}>{`Safety level: ${summary?.safetyLevel ?? stats.safetyLevel}`}</Text>
      {summary?.reflectionMessage ? <Text style={styles.reflection}>{summary.reflectionMessage}</Text> : null}

      <AppButton
        label={t('end.playAgain')}
        onPress={() => {
          if (mood) {
            startSession(mood, duration);
            navigation.replace('Game');
          }
        }}
      />
      <AppButton
        label={t('end.home')}
        variant="secondary"
        onPress={() => {
          resetSession();
          navigation.navigate('Home');
        }}
      />
      <AppButton label={t('end.favorites')} variant="secondary" onPress={() => navigation.navigate('Favorites')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 32, fontWeight: '700', marginBottom: 8 },
  message: { color: '#D1D5DB', fontSize: 16, marginBottom: 18 },
  stat: { color: '#E5E7EB', fontSize: 16, marginBottom: 4 },
  reflection: { color: '#C7D2FE', fontSize: 15, marginTop: 12, marginBottom: 14, lineHeight: 22 }
});
