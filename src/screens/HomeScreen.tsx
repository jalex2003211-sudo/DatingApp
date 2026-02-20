import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('homeTitle')}</Text>
      <Text style={styles.subtitle}>{t('homeSubtitle')}</Text>
      <AppButton label={t('startGame')} onPress={() => navigation.navigate('ChooseRelationshipStage')} />
      <AppButton label={t('favoritesTitle')} variant="secondary" onPress={() => navigation.navigate('Favorites')} />
      <AppButton label={t('settingsTitle')} variant="secondary" onPress={() => navigation.navigate('Settings')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', padding: 24 },
  title: { color: '#F9FAFB', fontSize: 34, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#D1D5DB', fontSize: 16, marginBottom: 24 }
});
