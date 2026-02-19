import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  question: string;
};

export const QuestionCard = ({ label, question }: Props) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.question}>{question}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    minHeight: 300,
    justifyContent: 'center'
  },
  label: {
    color: '#A5B4FC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
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
