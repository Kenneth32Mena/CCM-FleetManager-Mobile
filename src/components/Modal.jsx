import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

export default function AppModal({
  visible,
  onClose,
  eyebrow,
  title,
  children,
  maxWidth = 480,
  dismissable = true,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={dismissable ? onClose : undefined}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.center}
        >
          <Pressable style={[styles.panel, { maxWidth }]} onPress={() => {}}>
            <View style={styles.heading}>
              <View style={styles.headingText}>
                {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
                {title && <Text style={styles.title}>{title}</Text>}
              </View>
              <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Cerrar">
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    padding: 18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 35,
    elevation: 14,
  },
  heading: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  headingText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.arctic,
  },
  title: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.frost,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.muted,
    fontWeight: '400',
  },
});
