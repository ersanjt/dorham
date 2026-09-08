/**
 * One visual language for iOS and Android. No Platform.select on color,
 * type, radius, or chrome — those are what make the two apps look different.
 *
 * Copper / pomegranate lock: tea-stained paper, cream cards, clay action,
 * Type: Markazi Text for titles, Vazirmatn for body/UI. Same copper lock as web.
 */
export const color = {
  ink: "#120C09",
  paper: "#EFE3CF",
  cream: "#FFF8F0",
  clay: "#B12E28",
  clayPressed: "#8F241F",
  saffron: "#8A6A12",
  saffronSoft: "#F3E4B3",
  muted: "#6A564C",
  line: "#D4C0A8",
  ok: "#2A6B4A",
  okSoft: "#D5EEE3",
  danger: "#8F1F24",
  white: "#FFF8F0",
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  screen: 20,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  pill: 999,
} as const;

export const type = {
  display: "MarkaziText",
  regular: "Vazirmatn",
  medium: "VazirmatnMedium",
  semibold: "VazirmatnSemiBold",
  bold: "VazirmatnBold",
} as const;

export const fontSize = {
  caption: 13,
  body: 17,
  title: 23,
  display: 36,
} as const;
