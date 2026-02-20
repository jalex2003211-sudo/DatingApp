import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  photoUri?: string | null;
  accentColor: string;
  size?: number;
};

const getInitial = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed.length) return '?';
  return trimmed.charAt(0).toUpperCase();
};

export const ProfileAvatar = ({ name, photoUri, accentColor, size = 40 }: Props) => {
  const ringSize = size + 4;
  const initial = getInitial(name);

  return (
    <View style={[styles.ring, { width: ringSize, height: ringSize, borderColor: `${accentColor}99` }]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#1F2937' }]}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.6)'
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  initial: {
    color: '#F9FAFB',
    fontWeight: '700',
    fontSize: 14
  }
});
