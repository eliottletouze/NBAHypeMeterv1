// Palette partagée — évite la dérive de gris/noirs quasi-identiques dispersés par fichier.
export const COLORS = {
  bg: '#08080f',
  surface: '#0d0d1b',
  surfaceAlt: '#131325',
  surfaceSunken: '#0a0a18',
  border: '#1e1e35',
  borderStrong: '#2e2e50',

  textPrimary: '#F0F0F5',
  textSecondary: '#D0D0D8',
  textMuted: '#6060A0',
  textFaint: '#404060',
  textDim: '#8080A0',

  accent: '#9B7FFF',
  warning: '#F5C842',
  danger: '#E84040',
  dangerBg: '#1a1010',
  dangerBorder: '#3a1a1a',
} as const;
