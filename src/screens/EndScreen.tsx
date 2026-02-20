import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useSessionStore } from '../state/sessionStore';
import { RootStackParamList, StageType } from '../types';
import { formatCountdown } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'End'>;

export const EndScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { mood, duration, relationshipStage, isPremium, summary, sessionSummary, stats, lastSessionSummary, startSession, resetSession } =
    useSessionStore();

  const reason = route.params?.reason ?? sessionSummary?.endReason ?? lastSessionSummary?.reason ?? 'USER_ENDED';
  const viewed = sessionSummary?.viewed ?? lastSessionSummary?.viewed ?? stats.viewed;
  const skipped = sessionSummary?.skipped ?? lastSessionSummary?.skipped ?? stats.skipped;
  const favoritesAdded = sessionSummary?.favorites ?? lastSessionSummary?.favoritesAdded ?? stats.favoritesAdded;
  const durationPlayed = lastSessionSummary?.durationPlayed ?? 0;
  const resolvedMood = sessionSummary?.mood ?? lastSessionSummary?.mood ?? mood;
  const resolvedStage = lastSessionSummary?.relationshipStage ?? relationshipStage;
  const avgIntensity =
    sessionSummary?.avgIntensityExperienced ?? lastSessionSummary?.avgIntensity ?? summary?.averageIntensity ?? stats.averageIntensity;
  const peakPhaseReached = sessionSummary?.peakPhaseReached ?? lastSessionSummary?.peakPhase ?? summary?.peakPhase ?? stats.peakPhase;
  const reflectionMessage = lastSessionSummary?.reflectionMessage ?? summary?.reflectionMessage;

  const getHeadline = () => {
    if (reason === 'TIME_UP') return t('end.timeUpTitle');
    if (reason === 'DECK_EXHAUSTED') return t('end.deckExhaustedTitle');
    return t('end.userEndedTitle');
  };

  const getSubtitle = () => {
    if (reason === 'TIME_UP') return t('end.timeUpSubtitle');
    if (reason === 'DECK_EXHAUSTED') return t('end.deckExhaustedSubtitle');
    return t('end.userEndedSubtitle');
  };

  const toPhaseLabel = (phase: StageType) => `${phase.charAt(0).toUpperCase()}${phase.slice(1)}`;

  const getAdaptiveReflection = () => {
    if (peakPhaseReached === 'intimate') {
      return t('end.reflectionIntimate');
    }
    if (peakPhaseReached === 'vulnerable') {
      return t('end.reflectionVulnerable');
    }
    if (avgIntensity > 3.5) {
      return t('end.reflectionHighIntensity');
    }
    if (skipped > viewed * 0.35) {
      return t('end.reflectionGentlePace');
    }
    return t('end.reflectionSteady');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getHeadline()}</Text>
      <Text style={styles.message}>{getSubtitle()}</Text>

      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>{t('end.viewed')}</Text>
          <Text style={styles.chipValue}>{viewed}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>{t('end.skipped')}</Text>
          <Text style={styles.chipValue}>{skipped}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>{t('end.favorites')}</Text>
          <Text style={styles.chipValue}>{favoritesAdded}</Text>
        </View>
      </View>

      <Text style={styles.stat}>{`${t('end.durationPlayed')}: ${formatCountdown(durationPlayed)}`}</Text>
      <Text style={styles.stat}>{`${t('end.mood')}: ${resolvedMood ? t(`mood.${resolvedMood}`) : '-'}`}</Text>
      <Text style={styles.stat}>{`${t('end.relationshipStage')}: ${resolvedStage}`}</Text>
      <Text style={styles.stat}>{`${t('end.peakPhase')}: ${toPhaseLabel(peakPhaseReached)}`}</Text>
      <Text style={styles.stat}>{`${t('end.avgIntensity')}: ${avgIntensity.toFixed(1)}`}</Text>
      <Text style={styles.reflection}>{reflectionMessage ?? getAdaptiveReflection()}</Text>

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
        <Pressable onPress={() => navigation.navigate('Premium')}>
          <Text style={styles.premiumCta}>{t('end.unlockMoreDecks')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 34, fontWeight: '800', marginBottom: 8 },
  message: { color: '#D1D5DB', fontSize: 16, marginBottom: 22 },
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  chip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(30,41,59,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center'
  },
  chipLabel: { color: '#9CA3AF', fontSize: 12 },
  chipValue: { color: '#F9FAFB', fontSize: 20, fontWeight: '700', marginTop: 4 },
  stat: { color: '#E5E7EB', fontSize: 16, marginBottom: 5 },
  reflection: { color: '#C7D2FE', fontSize: 15, marginTop: 12, marginBottom: 16, lineHeight: 22 },
  premiumCta: {
    color: '#FCD34D',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    textDecorationLine: 'underline'
  }
});
