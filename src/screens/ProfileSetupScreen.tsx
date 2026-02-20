import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { createDefaultProfile, useProfileStore } from '../state/profileStore';
import { Gender, PartnerProfile } from '../types/profile';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const genders: Gender[] = ['male', 'female', 'custom'];

export const ProfileSetupScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const persistedProfile = useProfileStore((s) => s.profile);
  const save = useProfileStore((s) => s.save);

  const base = useMemo(() => persistedProfile ?? createDefaultProfile(), [persistedProfile]);
  const [partnerA, setPartnerA] = useState<PartnerProfile>(base.partnerA);
  const [partnerB, setPartnerB] = useState<PartnerProfile>(base.partnerB);

  const isEdit = Boolean(persistedProfile);

  const pickImage = async (id: 'A' | 'B') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1]
    });

    if (result.canceled || !result.assets.length) return;

    const uri = result.assets[0]?.uri ?? null;
    if (id === 'A') setPartnerA((prev) => ({ ...prev, photoUri: uri }));
    if (id === 'B') setPartnerB((prev) => ({ ...prev, photoUri: uri }));
  };

  const saveAndContinue = async () => {
    await save({
      partnerA: { ...partnerA, name: partnerA.name.trim() || t('profile.partnerA') },
      partnerB: { ...partnerB, name: partnerB.name.trim() || t('profile.partnerB') },
      updatedAt: Date.now()
    });

    navigation.replace('Home');
  };

  const renderPartnerCard = (partner: PartnerProfile, setPartner: (next: PartnerProfile) => void, title: string) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.label}>{t('profile.name')}</Text>
      <TextInput
        value={partner.name}
        onChangeText={(name) => setPartner({ ...partner, name })}
        placeholder={title}
        placeholderTextColor="#6B7280"
        style={styles.input}
      />

      <Text style={styles.label}>{t('profile.gender')}</Text>
      <View style={styles.segmentRow}>
        {genders.map((gender) => (
          <Pressable
            key={`${partner.id}-${gender}`}
            style={[styles.segmentButton, partner.gender === gender ? styles.segmentButtonActive : null]}
            onPress={() => setPartner({ ...partner, gender })}
          >
            <Text style={[styles.segmentLabel, partner.gender === gender ? styles.segmentLabelActive : null]}>
              {t(`profile.${gender}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.photoRow}>
        <AppButton label={t('profile.addPhoto')} variant="secondary" onPress={() => pickImage(partner.id)} />
        {partner.photoUri ? <Image source={{ uri: partner.photoUri }} style={styles.avatar} /> : null}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('profile.title')}</Text>
      {renderPartnerCard(partnerA, setPartnerA, t('profile.partnerA'))}
      {renderPartnerCard(partnerB, setPartnerB, t('profile.partnerB'))}
      <AppButton label={isEdit ? t('profile.save') : t('profile.continue')} onPress={saveAndContinue} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 20, gap: 12 },
  title: { color: '#F9FAFB', fontSize: 30, fontWeight: '700', marginBottom: 8 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#374151', gap: 8 },
  cardTitle: { color: '#F3F4F6', fontSize: 20, fontWeight: '700' },
  label: { color: '#D1D5DB', fontSize: 14 },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    color: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8
  },
  segmentButtonActive: { backgroundColor: '#4F46E5', borderColor: '#6366F1' },
  segmentLabel: { color: '#D1D5DB', fontWeight: '600' },
  segmentLabelActive: { color: '#FFFFFF' },
  photoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 999 }
});
