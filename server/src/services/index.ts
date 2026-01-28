/**
 * Central export for all services
 */

// SSE Manager - Real-time updates
export { sseManager, SSEManager, type SSEEvent } from './sse-manager';

// AI Validator - Anti-hallucination defense
export {
  aiValidator,
  AIValidator,
  CONFIDENCE_THRESHOLDS,
  type Finding,
  type ValidationResult,
} from './ai-validator';

// Question Deduplication - Semantic matching
export {
  deduplicateQuestion,
  handleDeduplicationResult,
  isSkipResponse,
  isAffirmativeResponse,
  isNegativeResponse,
  filterDuplicateQuestions,
  type DeduplicationResult,
  type QuestionAnswer,
} from './question-deduplication';

// PDF Converter - Markdown to PDF
export { pdfConverter, PDFConverter, type PDFOptions } from './pdf-converter';

// Exporter - Multi-format export (MD, PDF, PPTX)
export {
  exporter,
  Exporter,
  type ExportRequest,
  type ExportResult,
} from './exporter';
