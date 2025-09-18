import tokensJson from "./tokens.json";

type Tokens = typeof tokensJson;

// Typed exports so design tokens can be consumed in TS modules without `as const` noise.
export const TOKENS: Tokens = tokensJson;

export const BRAND_COLORS = tokensJson.colors.brand;
export const SURFACE_COLORS = tokensJson.colors.surface;
export const BORDER_COLORS = tokensJson.colors.border;
export const RADII = tokensJson.radius;
export const SHADOWS = tokensJson.shadows;
export const LAYOUT = tokensJson.layout;
export const TYPOGRAPHY = tokensJson.typography;
