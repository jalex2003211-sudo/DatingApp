import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useSessionStore } from '../state/sessionStore';
import { Mood, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseMood'>;

export const ChooseMoodScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const isPremium = useSessionStore((state) => state.isPremium);
  const moods: Mood[] = ['FUN', 'DEEP', 'INTIMATE'];

  const showPremiumAlert = () => {
    Alert.alert(t('premium.requiredTitle'), t('premium.requiredBody'), [{ text: t('premium.cta') }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('chooseMoodTitle')}</Text>
      {moods.map((mood) => {
        const isIntimateLocked = mood === 'INTIMATE' && !isPremium;
        const label = isIntimateLocked ? `🔒 ${t(`mood.${mood}`)} · Premium` : t(`mood.${mood}`);

        return (
          <AppButton
            key={mood}
            label={label}
            variant={isIntimateLocked ? 'secondary' : 'primary'}
            onPress={() => {
              if (isIntimateLocked) {
                showPremiumAlert();
                return;
              }

              navigation.navigate('ChooseDuration', { mood });
            }}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 28, fontWeight: '700', marginBottom: 20 }
});
