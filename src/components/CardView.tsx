import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  text: string;
}

export function CardView({ text }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#171A21',
    borderWidth: 1,
    borderColor: '#262B36',
    padding: 20,
    minHeight: 220,
    justifyContent: 'center',
  },
  text: {
    color: '#F5F7FF',
    fontSize: 22,
    lineHeight: 31,
    fontWeight: '600',
  },
});
