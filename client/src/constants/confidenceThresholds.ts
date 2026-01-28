/**
 * Confidence threshold constants
 * Used for evaluating AI analysis confidence levels
 */

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,      // 90%+
  MEDIUM: 0.7,    // 70-89%
  LOW: 0.5,       // 50-69%
} as const;

export type ConfidenceLevel = "high" | "medium" | "low" | "unacceptable";

/**
 * Get the confidence level based on a numeric confidence score
 * @param confidence - Numeric confidence score (0-1)
 * @returns Confidence level category
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "high";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "medium";
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return "low";
  return "unacceptable";
}

export const CONFIDENCE_COLORS = {
  high: "text-green-600",
  medium: "text-yellow-600",
  low: "text-orange-600",
  unacceptable: "text-red-600",
} as const;

export const CONFIDENCE_LABELS = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
  unacceptable: "Unacceptable",
} as const;

export const CONFIDENCE_DESCRIPTIONS = {
  high: "High confidence (≥90%)",
  medium: "Medium confidence (70-89%)",
  low: "Low confidence (50-69%)",
  unacceptable: "Below acceptable threshold (<50%)",
} as const;
