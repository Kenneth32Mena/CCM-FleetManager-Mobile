import { StyleSheet } from 'react-native';

export const colors = {
  ink: '#070c12',
  abyss: '#0a1119',
  card: '#0b131c',
  surface: '#101923',
  elevated: '#18232f',
  frost: '#edf8ff',
  steel: '#c7d5e2',
  muted: '#91a3b5',
  label: '#b3c2cf',
  spec: '#c4d1dc',
  faint: '#75899d',
  arctic: '#7dd3fc',
  onArctic: '#03121b',
  mint: '#5eead4',
  dangerSoft: '#fee2e2',
  dangerDeep: '#7f1d1d',
  dangerText: '#fca5a5',

  cardBg: 'rgba(15,24,34,0.88)',
  authCardBg: 'rgba(15,24,34,0.94)',
  menuBg: 'rgba(15,24,34,0.98)',
  backdrop: 'rgba(2,6,10,0.8)',
  border: 'rgba(148,190,215,0.16)',
  borderSoft: 'rgba(148,190,215,0.12)',
  borderField: 'rgba(148,190,215,0.2)',
  borderMenu: 'rgba(148,190,215,0.18)',
  borderDivider: 'rgba(148,190,215,0.14)',
  arcticSoft: 'rgba(125,211,252,0.1)',
  arcticRing: 'rgba(125,211,252,0.12)',
  arcticBorder: 'rgba(125,211,252,0.22)',
  arcticHover: 'rgba(125,211,252,0.4)',
  arcticHoverStrong: 'rgba(125,211,252,0.5)',
  arcticShadow: 'rgba(56,189,248,0.18)',
  arcticTint: 'rgba(56,189,248,0.1)',
  arcticTintStrong: 'rgba(56,189,248,0.12)',
  arcticMenu: 'rgba(56,189,248,0.12)',
  mintBorder: 'rgba(94,234,212,0.3)',
  mintBg: 'rgba(45,212,191,0.1)',
  dangerBorder: 'rgba(248,113,113,0.25)',
  dangerBorderStrong: 'rgba(248,113,113,0.32)',
  dangerBg: 'rgba(239,68,68,0.1)',
  dangerBgStrong: 'rgba(239,68,68,0.12)',
  dangerMint: '#fecaca',
  warnBorder: 'rgba(251,191,36,0.35)',
  warnBg: 'rgba(120,53,15,0.25)',
  warnText: '#fde68a',
  shadow: 'rgba(0,0,0,0.45)',
  shadowStrong: 'rgba(0,0,0,0.4)',
  inactiveText: '#fca5a5',
};

export const typography = StyleSheet.create({
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.arctic,
  },
  h1: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.8,
    color: colors.frost,
  },
  h2: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.frost,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.label,
  },
  body: {
    fontSize: 14,
    color: colors.frost,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
  },
  spec: {
    fontSize: 15,
    color: colors.spec,
  },
  stat: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1.9,
    color: colors.frost,
  },
  statSmall: {
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -1.25,
    color: colors.frost,
  },
});

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 18,
  },
  cardPadding: {
    padding: 24,
  },
  cardCompact: {
    borderRadius: 18,
    padding: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPanel: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 35,
    elevation: 12,
  },
  modalHeading: {
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
  },
  field: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderField,
    backgroundColor: colors.abyss,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.frost,
  },
  fieldFocused: {
    borderColor: colors.arctic,
  },
  fieldBlock: {
    marginBottom: 10,
  },
  select: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderField,
    backgroundColor: colors.abyss,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alert: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  alertError: {
    backgroundColor: colors.dangerBgStrong,
    borderColor: colors.dangerBorderStrong,
    color: colors.dangerMint,
  },
  alertSuccess: {
    backgroundColor: colors.mintBg,
    borderColor: colors.mintBorder,
    color: colors.mint,
  },
  alertWarn: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
    color: colors.warnText,
  },
  warningCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    backgroundColor: colors.warnBg,
    padding: 16,
  },
  warningText: {
    fontSize: 14,
    color: colors.warnText,
    lineHeight: 20,
  },
  statCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    padding: 22,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 18,
    marginTop: 18,
  },
});

export function shadowPrimary() {
  return {
    shadowColor: colors.arctic,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  };
}

export function shadowModal() {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 35,
    elevation: 12,
  };
}

export function formatMileage(value) {
  return new Intl.NumberFormat('es-NI').format(Number(value) || 0);
}
