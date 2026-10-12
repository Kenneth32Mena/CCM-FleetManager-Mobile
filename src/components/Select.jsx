import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

export default function Select({ label, value, onChange, options = [], placeholder = 'Seleccionar', style }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => String(option.value) === String(value));

  function choose(option) {
    setOpen(false);
    onChange?.(option.value);
  }

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity activeOpacity={0.8} style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <Text style={styles.panelTitle} numberOfLines={1}>{label || placeholder}</Text>
            <FlatList
              data={[{ value: '', label: placeholder }, ...options]}
              keyExtractor={(item) => String(item.value)}
              style={styles.list}
              renderItem={({ item }) => {
                const active = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => choose(item)}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.label,
    marginBottom: 7,
  },
  trigger: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderField,
    backgroundColor: colors.abyss,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: colors.frost,
  },
  placeholder: {
    color: colors.muted,
  },
  chevron: {
    marginLeft: 10,
    fontSize: 12,
    color: colors.muted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.arctic,
    marginBottom: 12,
  },
  list: {
    maxHeight: 360,
  },
  option: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: colors.arcticTint,
    borderWidth: 1,
    borderColor: colors.arcticHoverStrong,
  },
  optionText: {
    fontSize: 15,
    color: colors.steel,
  },
  optionTextActive: {
    color: colors.arctic,
    fontWeight: '800',
  },
});
