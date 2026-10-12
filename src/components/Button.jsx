import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { colors, shadowPrimary } from '../theme';

export default function Button({
  children,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        variant === 'primary' && shadowPrimary(),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading && <ActivityIndicator size="small" color={variant === 'primary' ? colors.onArctic : colors.steel} style={styles.spinner} />}
        <Text style={[styles.text, styles[`${variant}Text`]]}>
          {loading ? 'Procesando...' : children}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  primary: {
    backgroundColor: colors.arctic,
  },
  primaryText: {
    color: colors.onArctic,
  },
  secondary: {
    backgroundColor: colors.elevated,
  },
  secondaryText: {
    color: colors.steel,
  },
  danger: {
    backgroundColor: colors.dangerDeep,
  },
  dangerText: {
    color: colors.dangerSoft,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: colors.arctic,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
});
