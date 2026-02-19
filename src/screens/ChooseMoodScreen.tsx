import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { Mood, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseMood'>;

export const ChooseMoodScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const moods: Mood[] = ['FUN', 'DEEP', 'INTIMATE'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('chooseMoodTitle')}</Text>
      {moods.map((mood) => (
        <AppButton key={mood} label={t(`mood.${mood}`)} onPress={() => navigation.navigate('ChooseDuration', { mood })} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 28, fontWeight: '700', marginBottom: 20 }
});
