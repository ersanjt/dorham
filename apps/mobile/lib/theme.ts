/**
 * One visual language for iOS and Android.
 * Copper / pomegranate: tea paper, cream panels, clay action.
 * Cafe in Karaköy — calligraphy + quiet geometry, not neon dating chrome.
 */
export const color = {
  ink: "#120C09",
  paper: "#E8D9C0",
  paperDeep: "#DFC9A8",
  cream: "#FFF6EC",
  clay: "#B12E28",
  clayPressed: "#8F241F",
  claySoft: "rgba(177, 46, 40, 0.10)",
  copper: "#8B4A32",
  saffron: "#8A6A12",
  saffronSoft: "#F3E4B3",
  muted: "#6A564C",
  line: "#CDB89A",
  lineStrong: "#B89A78",
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
  xl: 36,
  screen: 22,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 18,
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
  title: 26,
  display: 40,
} as const;
