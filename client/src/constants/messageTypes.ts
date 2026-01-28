/**
 * Toast and message type constants
 * Used for user notifications and feedback messages
 */

export type ToastType = "success" | "error" | "info";

export const TOAST_TYPES = {
  SUCCESS: "success" as ToastType,
  ERROR: "error" as ToastType,
  INFO: "info" as ToastType,
} as const;

export const TOAST_ICONS = {
  [TOAST_TYPES.SUCCESS]: "✓",
  [TOAST_TYPES.ERROR]: "✗",
  [TOAST_TYPES.INFO]: "ℹ",
} as const;

export const TOAST_COLORS = {
  [TOAST_TYPES.SUCCESS]: {
    bg: "bg-green-500",
    text: "text-white",
    border: "border-green-600",
  },
  [TOAST_TYPES.ERROR]: {
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-600",
  },
  [TOAST_TYPES.INFO]: {
    bg: "bg-blue-500",
    text: "text-white",
    border: "border-blue-600",
  },
} as const;

/**
 * Duration constants for toast messages (in milliseconds)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;
