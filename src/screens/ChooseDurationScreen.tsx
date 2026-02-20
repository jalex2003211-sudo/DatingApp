import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useSessionStore } from '../state/sessionStore';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseDuration'>;

export const ChooseDurationScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const startSession = useSessionStore((s) => s.startSession);
  const relationshipStage = useSessionStore((s) => s.relationshipStage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('chooseDurationTitle')}</Text>
      {[10, 20, 30].map((minutes) => (
        <AppButton
          key={minutes}
          label={t('minutes', { count: minutes })}
          onPress={() => {
            if (!relationshipStage) {
              Alert.alert(t('errors.relationshipStageRequiredTitle'), t('errors.relationshipStageRequiredBody'));
              return;
            }

            const result = startSession(route.params.mood, minutes);

            if (!result.ok && result.reason === 'PREMIUM_REQUIRED') {
              Alert.alert(t('premium.requiredTitle'), t('premium.requiredBody'), [{ text: t('premium.cta') }]);
              return;
            }

            if (!result.ok) {
              Alert.alert(t('errors.relationshipStageRequiredTitle'), t('errors.relationshipStageRequiredBody'));
              return;
            }

            if (result.ok) {
              navigation.replace('Game');
            }
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 28, fontWeight: '700', marginBottom: 20 }
});
