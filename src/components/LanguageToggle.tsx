import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../state/settingsStore';

export function LanguageToggle() {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <View style={styles.row}>
      <Pressable style={[styles.chip, language === 'en' && styles.active]} onPress={() => void setLanguage('en')}>
        <Text style={styles.label}>{t('common.english')}</Text>
      </Pressable>
      <Pressable style={[styles.chip, language === 'el' && styles.active]} onPress={() => void setLanguage('el')}>
        <Text style={styles.label}>{t('common.greek')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B4252',
    backgroundColor: '#171A21',
  },
  active: {
    borderColor: '#7C5CFF',
    backgroundColor: '#272042',
  },
  label: { color: '#F5F7FF', fontWeight: '600' },
});
