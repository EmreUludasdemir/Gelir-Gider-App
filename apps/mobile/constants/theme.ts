// Modern, clean color palette
export const Colors = {
  // Primary - Purple
  primary: "#8B5CF6",
  primaryLight: "#A78BFA",
  primaryDark: "#7C3AED",

  // Secondary
  secondary: "#06B6D4",
  secondaryLight: "#22D3EE",

  // Success - Green
  success: "#10B981",
  successLight: "#D1FAE5",
  successDark: "#059669",

  // Danger - Red
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  dangerDark: "#DC2626",

  // Warning - Yellow/Orange
  warning: "#F59E0B",
  warningLight: "#FEF3C7",

  // Neutral
  white: "#FFFFFF",
  black: "#000000",

  // Gray scale
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Background
  background: "#F9FAFB",
  backgroundDark: "#111827",

  // Card
  card: "#FFFFFF",
  cardDark: "#1F2937",

  // Text
  text: "#111827",
  textSecondary: "#6B7280",
  textDark: "#F9FAFB",
  textSecondaryDark: "#9CA3AF",
};

// Typography
export const Typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,

  // Font weights
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

// Border Radius
export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Category colors for charts
export const CategoryColors: Record<string, string> = {
  food: "#F59E0B",
  transport: "#3B82F6",
  shopping: "#EC4899",
  entertainment: "#8B5CF6",
  bills: "#EF4444",
  health: "#10B981",
  education: "#06B6D4",
  salary: "#22C55E",
  investment: "#6366F1",
  other: "#6B7280",
};

// Category icons (Ionicons names)
export const CategoryIcons: Record<string, string> = {
  food: "fast-food",
  transport: "car",
  shopping: "cart",
  entertainment: "game-controller",
  bills: "receipt",
  health: "medical",
  education: "school",
  salary: "wallet",
  investment: "trending-up",
  other: "ellipsis-horizontal",
};
