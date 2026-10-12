import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export default function Card({ children, style, compact = false }) {
  return <View style={[styles.card, compact && styles.compact, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 24,
  },
  compact: {
    borderRadius: 18,
    padding: 16,
  },
});
