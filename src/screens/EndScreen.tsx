import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useSessionStore } from '../state/sessionStore';
import { RootStackParamList } from '../types';
import { formatCountdown } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'End'>;

export const EndScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { mood, duration, relationshipStage, isPremium, summary, stats, lastSessionSummary, startSession, resetSession } = useSessionStore();

  const reason = route.params?.reason ?? lastSessionSummary?.reason ?? 'USER_ENDED';
  const viewed = lastSessionSummary?.viewed ?? stats.viewed;
  const skipped = lastSessionSummary?.skipped ?? stats.skipped;
  const favoritesAdded = lastSessionSummary?.favoritesAdded ?? stats.favoritesAdded;
  const durationPlayed = lastSessionSummary?.durationPlayed ?? 0;
  const resolvedMood = lastSessionSummary?.mood ?? mood;
  const resolvedStage = lastSessionSummary?.relationshipStage ?? relationshipStage;
  const avgIntensity = lastSessionSummary?.avgIntensity ?? summary?.averageIntensity ?? stats.averageIntensity;
  const reflectionMessage = lastSessionSummary?.reflectionMessage ?? summary?.reflectionMessage;

  const title = reason === 'DECK_EXHAUSTED' ? t('end.deckExhaustedTitle') : t('end.title');
  const subtitle = reason === 'DECK_EXHAUSTED' ? t('end.deckExhaustedSubtitle') : t('end.message');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{subtitle}</Text>

      <Text style={styles.stat}>{`${t('end.viewed')}: ${viewed}`}</Text>
      <Text style={styles.stat}>{`${t('end.skipped')}: ${skipped}`}</Text>
      <Text style={styles.stat}>{`${t('end.favorites')}: ${favoritesAdded}`}</Text>
      <Text style={styles.stat}>{`${t('end.durationPlayed')}: ${formatCountdown(durationPlayed)}`}</Text>
      <Text style={styles.stat}>{`${t('end.mood')}: ${resolvedMood ? t(`mood.${resolvedMood}`) : '-'}`}</Text>
      <Text style={styles.stat}>{`${t('end.relationshipStage')}: ${resolvedStage}`}</Text>
      <Text style={styles.stat}>{`${t('end.avgIntensity')}: ${avgIntensity.toFixed(2)}`}</Text>
      {reflectionMessage ? <Text style={styles.reflection}>{reflectionMessage}</Text> : null}

      <AppButton
        label={t('end.replaySameSettings')}
        onPress={() => {
          if (resolvedMood) {
            const result = startSession(resolvedMood, duration);

            if (!result.ok && result.reason === 'PREMIUM_REQUIRED') {
              Alert.alert(t('premium.requiredTitle'), t('premium.requiredBody'), [{ text: t('premium.cta') }]);
              return;
            }

            if (result.ok) {
              navigation.replace('Game');
            }
          }
        }}
      />
      <AppButton label={t('end.changeMood')} variant="secondary" onPress={() => navigation.replace('ChooseMood')} />
      <AppButton
        label={t('end.home')}
        variant="secondary"
        onPress={() => {
          resetSession();
          navigation.navigate('Home');
        }}
      />
      {!isPremium ? (
        <AppButton label={t('end.unlockMoreDecks')} variant="secondary" onPress={() => navigation.navigate('Premium')} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 30, fontWeight: '700', marginBottom: 8 },
  message: { color: '#D1D5DB', fontSize: 16, marginBottom: 18 },
  stat: { color: '#E5E7EB', fontSize: 16, marginBottom: 4 },
  reflection: { color: '#C7D2FE', fontSize: 15, marginTop: 12, marginBottom: 14, lineHeight: 22 }
});
