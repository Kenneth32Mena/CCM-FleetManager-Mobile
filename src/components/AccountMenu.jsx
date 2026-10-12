import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

function initial(email) {
  return (email || '?').trim().charAt(0).toUpperCase() || '?';
}

export default function AccountMenu({ email, onOpenAccount, onSignOut }) {
  const [open, setOpen] = useState(false);

  function run(action) {
    setOpen(false);
    action?.();
  }

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={() => setOpen(true)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial(email)}</Text>
        </View>
        <Text style={styles.email} numberOfLines={1}>{email}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <Text style={styles.header} numberOfLines={1}>{email}</Text>
            <TouchableOpacity style={styles.item} onPress={() => run(onOpenAccount)}>
              <Text style={styles.itemText}>Cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => run(onSignOut)}>
              <Text style={styles.itemText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderField,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.arctic,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.onArctic,
  },
  email: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.steel,
  },
  chevron: {
    fontSize: 11,
    color: colors.muted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
  },
  panel: {
    position: 'absolute',
    top: 64,
    right: 16,
    width: 260,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMenu,
    backgroundColor: colors.menuBg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 12,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDivider,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '700',
    color: colors.frost,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.steel,
  },
});
