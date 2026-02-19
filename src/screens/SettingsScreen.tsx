import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/AppButton';
import i18n from '../i18n';
import { usePrefsStore } from '../state/prefsStore';

export const SettingsScreen = () => {
  const { t } = useTranslation();
  const language = usePrefsStore((s) => s.language);
  const setLanguage = usePrefsStore((s) => s.setLanguage);

  const updateLanguage = (next: 'en' | 'el') => {
    setLanguage(next);
    void i18n.changeLanguage(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settingsTitle')}</Text>
      <Text style={styles.label}>{t('language')}</Text>
      <AppButton
        label={`${t('english')}${language === 'en' ? ' ✓' : ''}`}
        onPress={() => updateLanguage('en')}
        variant={language === 'en' ? 'primary' : 'secondary'}
      />
      <AppButton
        label={`${t('greek')}${language === 'el' ? ' ✓' : ''}`}
        onPress={() => updateLanguage('el')}
        variant={language === 'el' ? 'primary' : 'secondary'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  title: { color: '#F9FAFB', fontSize: 30, fontWeight: '700', marginBottom: 12 },
  label: { color: '#D1D5DB', fontSize: 16, marginBottom: 10 }
});
