import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export const AppButton = ({ label, onPress, variant = 'primary' }: Props) => (
  <Pressable
    style={[styles.button, variant === 'secondary' ? styles.secondary : styles.primary]}
    onPress={onPress}
  >
    <Text style={styles.text}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 6,
    alignItems: 'center'
  },
  primary: { backgroundColor: '#6366F1' },
  secondary: { backgroundColor: '#374151' },
  text: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});
