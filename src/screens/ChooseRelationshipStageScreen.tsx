import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import { useSessionStore } from '../state/sessionStore';
import { RelationshipStage, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseRelationshipStage'>;

const stageOptions: { key: string; stage: RelationshipStage }[] = [
  { key: 'breakIce', stage: 'new' },
  { key: 'newDating', stage: 'dating' },
  { key: 'longTerm', stage: 'longTerm' },
  { key: 'married', stage: 'married' },
  { key: 'reconnecting', stage: 'reconnecting' }
];

export const ChooseRelationshipStageScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const setRelationshipStage = useSessionStore((s) => s.setRelationshipStage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('relationshipStage.title')}</Text>
      {stageOptions.map((option) => (
        <AppButton
          key={option.key}
          label={t(`relationshipStage.option.${option.key}`)}
          onPress={() => {
            setRelationshipStage(option.stage);
            navigation.navigate('ChooseRoles');
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
