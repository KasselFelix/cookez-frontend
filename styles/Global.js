import { Platform, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─────────────────────────────────────────────
// BRAND PALETTE
// Mood target: soothing · energetic · trustworthy
// ─────────────────────────────────────────────

const palette = {
  // Primary — Deep Forest Teal: authority, freshness, trust
  primary900: "#002a29",
  primary800: "#004643",   // ← legacy inactiveButtonColor, now the anchor
  primary700: "#005f5b",
  primary600: "#007a74",
  primary500: "#009e97",
  primary400: "#33b5af",

  // Secondary — Sage Mist: soothing, organic, breathable
  secondary500: "#abd1c6",  // ← legacy backgroundColorTwo
  secondary400: "#c3dfd9",
  secondary300: "#d9ece8",
  secondary200: "#edf6f4",
  secondary100: "#f5faf9",

  // Accent — Amber Zest: warmth, appetite, energy
  accent500: "#f9bc60",    // ← legacy gradientColor start / backgroundColorOne approx
  accent400: "#fbcf84",
  accent300: "#fde3b0",
  accent200: "#fef3db",

  // Surface & Background
  surface:    "#faf7f2",   // warm cream — photography-friendly
  surfaceCard:"#ffffff",
  background: "#f2ede7",   // slightly deeper cream for screens
  overlay:    "rgba(0,70,67,0.55)",  // primary800 at 55% for modals/glassmorphism
  overlayLight: "rgba(255,255,255,0.4)",   // semi-transparent white (KickoffScreen borders/text)
  overlayDark:  "rgba(0,0,0,0.5)",         // semi-transparent black (key backgrounds)
  flashActive:  "#e8be4b",                 // camera flash-on icon color

  // Neutrals
  neutral900: "#1c1c1e",
  neutral700: "#3a3a3c",
  neutral500: "#6b7280",
  neutral300: "#d1d5db",
  neutral200: "#e5e7eb",
  neutral100: "#f9fafb",

  // Semantic
  success:    "#22c55e",
  successBg:  "#dcfce7",
  error:      "#ef4444",
  errorBg:    "#fee2e2",
  warning:    "#f59e0b",
  warningBg:  "#fef3c7",
  favorite:   "#c0392b",      // saved/loved semantic — distinct from error red

  // Always
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
};

// ─────────────────────────────────────────────
// TYPOGRAPHY
// Fira Sans: headings (structured, confident)
// Varela Round: body / UI (friendly, approachable)
// ─────────────────────────────────────────────

// Font family names must match keys used in useFonts() in App.js exactly.
const _fira  = "FiraSans_400Regular";
const _firaB = "FiraSans_700Bold";
const _firaS = "FiraSans_600SemiBold";
const _varela  = "Varela_400Regular";
const _varelaR = "VarelaRound_400Regular";

const typography = {
  // Font families
  fontDisplay:  _firaB,    // Hero / splash text
  fontHeading:  _firaS,    // H1–H3 section titles
  fontBody:     _varelaR,  // Paragraphs, descriptions
  fontUI:       _varela,   // Labels, buttons, nav

  // Scale — optimised for 375px viewport (scales well to 430px)
  // H1 — Screen hero titles  (e.g., app name, welcome header)
  h1Size:   32,
  h1Line:   40,
  h1Weight: "700",
  h1Family: _firaB,

  // H2 — Section headers  (e.g., "Trending Recipes")
  h2Size:   24,
  h2Line:   32,
  h2Weight: "600",
  h2Family: _firaS,

  // H3 — Card / panel titles  (e.g., recipe name in ResultScreen)
  h3Size:   20,
  h3Line:   28,
  h3Weight: "600",
  h3Family: _firaS,

  // H4 — Subtitles / emphasized labels
  h4Size:   17,
  h4Line:   24,
  h4Weight: "500",
  h4Family: _fira,

  // H5 — Metadata / timestamps / tags
  h5Size:   14,
  h5Line:   20,
  h5Weight: "500",
  h5Family: _fira,

  // Body — Primary readable text
  bodySize:   16,
  bodyLine:   24,
  bodyFamily: _varelaR,

  // Body Small — Secondary descriptions
  bodySmSize: 14,
  bodySmLine: 20,

  // Caption — Helper text, placeholders
  captionSize: 12,
  captionLine: 16,

  // Overline — Tags, category pills (uppercase)
  overlineSize:    11,
  overlineSpacing: 1.2,
  metadataSize:   12,
  metadataColor:  "#6b7280",           // neutral500
  metadataFamily: "VarelaRound_400Regular",

  // H6 — Micro labels (badge captions, stat labels, tab pills, tag captions)
  // Officializes the 9-12 px tier that was previously orphaned across the
  // profile screens. Use for uppercase mini-labels and dense metadata rows.
  h6Size:   12,
  h6Line:   16,
  h6Weight: "500",
  h6Family: _varelaR,
};

// ─────────────────────────────────────────────
// SPACING  (4-pt grid)
// ─────────────────────────────────────────────

const spacing = {
  xs:   4,
  sm:   8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl:64,
  cardGap: 12,
};

// ─────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────

const radius = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  24,
  pill:99,   // fully rounded buttons / tags
  card:20,   // recipe cards
};

// ─────────────────────────────────────────────
// ELEVATION / SHADOW
// ─────────────────────────────────────────────

const shadow = {
  none: {
    shadowColor: "transparent",
    elevation: 0,
  },
  sm: {
    shadowColor: palette.primary800,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: palette.primary800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: palette.primary800,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: palette.primary800,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─────────────────────────────────────────────
// COMPONENT TOKENS
// ─────────────────────────────────────────────

// --- BUTTONS ---
const button = {
  // Primary — filled, high emphasis
  primaryBg:          palette.primary800,
  primaryText:        palette.white,
  primaryBorderColor: palette.primary800,
  primaryBorderRadius:radius.pill,
  primaryPaddingV:    14,
  primaryPaddingH:    32,
  primaryFontSize:    typography.bodySize,
  primaryFontFamily:  typography.fontUI,
  primaryFontWeight:  "600",

  // Ghost — outlined, medium emphasis
  ghostBg:            palette.transparent,
  ghostText:          palette.primary800,
  ghostBorderColor:   palette.primary800,
  ghostBorderWidth:   1.5,

  // Accent — warm CTA (e.g. "Find Recipes")
  accentBg:           palette.accent500,
  accentText:         palette.primary800,
  accentBorderColor:  palette.accent500,

  // Disabled
  disabledBg:         palette.neutral200,
  disabledText:       palette.neutral500,
  disabledBorderColor:palette.neutral200,

  // Destructive
  destructiveBg:      palette.error,
  destructiveText:    palette.white,

  // Size — small variant
  smPaddingV:   8,
  smPaddingH:   20,
  smFontSize:   13,
  smBorderRadius:radius.pill,
};

// --- CARDS (Recipe cards in ResultScreen) ---
const card = {
  bg:           palette.surfaceCard,
  borderRadius: radius.card,
  padding:      spacing.md,
  ...shadow.card,

  // Image area
  imageRadius:  radius.lg,
  imageHeight:  200,

  // Tag pill on card
  tagBg:        palette.secondary200,
  tagText:      palette.primary800,
  tagRadius:    radius.pill,
  tagPaddingV:  4,
  tagPaddingH:  10,
  tagFontSize:  typography.overlineSize,
};

// --- INPUTS (AddRecipeScreen, LoginScreen) ---
const input = {
  bg:              palette.surface,
  borderColor:     palette.neutral300,
  borderColorFocus:palette.primary500,
  borderWidth:     1.5,
  borderRadius:    radius.md,
  paddingV:        14,
  paddingH:        16,
  fontSize:        typography.bodySize,
  fontFamily:      typography.fontBody,
  textColor:       palette.neutral900,
  placeholderColor:palette.neutral500,

  // Label above input
  labelColor:      palette.neutral700,
  labelFontSize:   typography.h5Size,
  labelFontFamily: typography.fontUI,
  labelFontWeight: "500",

  // Error state
  borderColorError:palette.error,
  errorTextColor:  palette.error,
  errorFontSize:   typography.captionSize,
};

// --- TAB BAR (semi-transparent glassmorphism) ---
const tabBar = {
  // Height & layout
  height:          64,
  paddingBottom:   Platform.OS === "ios" ? 12 : 8,
  paddingTop:      8,

  // Glass effect — pair with BlurView if available, else fallback
  backgroundColor: "rgba(250,247,242,0.88)",   // surface at 88%
  borderTopWidth:  0,
  elevation:       0,

  // Tint colors
  activeTintColor:   palette.primary800,
  inactiveTintColor: palette.neutral500,

  // Active indicator pill behind icon
  indicatorBg:     palette.secondary200,
  indicatorRadius: radius.sm,
  indicatorPaddingV:  4,
  indicatorPaddingH:  16,

  showLabel: false,
};

// ─────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────

const layout = {
  screenWidth:    SCREEN_WIDTH,
  screenHeight:   SCREEN_HEIGHT,
  paddingTop:     "15%",
  screenPaddingH: spacing.md,
  // `legacyMaxContentWidth` preserves the 428-px cap that older screens
  // depend on for narrow centering. New profile/settings screens should
  // use `maxContentWidth` (720 px) so tablet layouts breathe.
  legacyMaxContentWidth: 428,
  maxContentWidth:       720,
};

// ─────────────────────────────────────────────
// ANIMATION TIMING
// ─────────────────────────────────────────────

const animation = {
  fast:   150,
  normal: 250,
  slow:   400,
  spring: { damping: 18, stiffness: 200 },
};

// ─────────────────────────────────────────────
// GRADIENTS (for expo-linear-gradient)
// ─────────────────────────────────────────────

const gradient = {
  staffPicks: { colors: ["transparent", "rgba(0,0,0,0.72)"], locations: [0.4, 1] },
  hero:       { colors: ["#004643", "#009e97"],               locations: [0, 1] },
  accent:     { colors: ["rgba(249,188,96,0)", "rgba(249,188,96,0.9)"], locations: [0.3, 1] },
};

// ─────────────────────────────────────────────
// GLASSMORPHISM (bottom sheets, floating panels)
// ─────────────────────────────────────────────

const glassmorphism = {
  backgroundColor: "rgba(250,247,242,0.88)",   // surface at 88%
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.3)",
};

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

const css = {
  palette,
  typography,
  spacing,
  radius,
  shadow,
  button,
  card,
  input,
  tabBar,
  layout,
  animation,
  gradient,
  glassmorphism,
};

export default css;
