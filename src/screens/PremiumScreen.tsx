import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;

export const PremiumScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('premium.requiredTitle')}</Text>
      <Text style={styles.body}>{t('premium.requiredBody')}</Text>
      <AppButton label={t('end.home')} onPress={() => navigation.navigate('Home')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  body: { color: '#D1D5DB', fontSize: 16, marginBottom: 20 }
});
