import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useSessionStore } from '../state/sessionStore';
import { Gender, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseRoles'>;

const genders: Gender[] = ['MALE', 'FEMALE', 'NEUTRAL'];

export const ChooseRolesScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { partnerA, partnerB, setPartnerProfiles } = useSessionStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('roles.title')}</Text>

      <Text style={styles.sectionTitle}>{t('roles.partnerA')}</Text>
      <View style={styles.row}>
        {genders.map((gender) => (
          <AppButton
            key={`A-${gender}`}
            label={t(`gender.${gender.toLowerCase()}`)}
            variant={partnerA.gender === gender ? 'primary' : 'secondary'}
            onPress={() => setPartnerProfiles({ partnerA: { ...partnerA, gender }, partnerB })}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('roles.partnerB')}</Text>
      <View style={styles.row}>
        {genders.map((gender) => (
          <AppButton
            key={`B-${gender}`}
            label={t(`gender.${gender.toLowerCase()}`)}
            variant={partnerB.gender === gender ? 'primary' : 'secondary'}
            onPress={() => setPartnerProfiles({ partnerA, partnerB: { ...partnerB, gender } })}
          />
        ))}
      </View>

      <AppButton label={t('continue')} onPress={() => navigation.navigate('ChooseMood')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 28, fontWeight: '700', marginBottom: 20 },
  sectionTitle: { color: '#E5E7EB', fontSize: 17, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  row: { marginBottom: 8 }
});
