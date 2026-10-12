import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function Pill({ active = true, children, style }) {
  return (
    <View style={[styles.pill, active ? styles.active : styles.inactive, style]}>
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  active: {
    borderWidth: 1,
    borderColor: colors.mintBorder,
    backgroundColor: colors.mintBg,
  },
  inactive: {
    borderWidth: 1,
    borderColor: colors.dangerBorderStrong,
    backgroundColor: colors.dangerBg,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
  },
  activeText: {
    color: colors.mint,
  },
  inactiveText: {
    color: colors.inactiveText,
  },
});
