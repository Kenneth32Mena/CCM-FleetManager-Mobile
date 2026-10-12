import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';

export default function Field({
  label,
  hint,
  error,
  style,
  required = false,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.input, focused && styles.inputFocused, inputProps.multiline && styles.multiline]}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
      />
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.label,
    marginBottom: 7,
  },
  input: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderField,
    backgroundColor: colors.abyss,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.frost,
    minHeight: 46,
  },
  inputFocused: {
    borderColor: colors.arctic,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.muted,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: colors.dangerText,
  },
});
