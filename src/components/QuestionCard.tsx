import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  question: string;
  accentColor?: string;
  chipBg?: string;
  borderGlow?: string;
};

export const QuestionCard = ({ label, question, accentColor = '#A5B4FC', chipBg = 'rgba(165,180,252,0.14)', borderGlow = 'rgba(165,180,252,0.3)' }: Props) => (
  <View style={[styles.card, { borderColor: borderGlow }]}> 
    <View style={[styles.labelChip, { backgroundColor: chipBg }]}>
      <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
    </View>
    <Text style={styles.question}>{question}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#243142',
    borderRadius: 20,
    padding: 24,
    minHeight: 300,
    justifyContent: 'center',
    borderWidth: 1.2
  },
  labelChip: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center'
  },
  question: {
    color: '#F9FAFB',
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
    fontWeight: '600'
  }
});
