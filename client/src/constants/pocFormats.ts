/**
 * POC (Proof of Concept) format types
 * Defines the available output formats for generated POCs
 */

export type PocFormatType = "business" | "developer" | "both";

export const POC_FORMATS = {
  BUSINESS: "business" as PocFormatType,
  DEVELOPER: "developer" as PocFormatType,
  BOTH: "both" as PocFormatType,
} as const;

export const POC_FORMAT_LABELS = {
  [POC_FORMATS.BUSINESS]: "Business POC",
  [POC_FORMATS.DEVELOPER]: "Developer POC",
  [POC_FORMATS.BOTH]: "Both Formats",
} as const;

export const POC_FORMAT_DESCRIPTIONS = {
  [POC_FORMATS.BUSINESS]: "Executive summary focused on business value and ROI",
  [POC_FORMATS.DEVELOPER]: "Technical implementation details and code examples",
  [POC_FORMATS.BOTH]: "Comprehensive document with both business and technical sections",
} as const;
