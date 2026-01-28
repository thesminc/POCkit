/**
 * Engineering task type definitions
 * Used for categorizing and routing different types of engineering work
 */

export interface EngineeringTaskType {
  id: string;
  label: string;
  description: string;
}

export const ENGINEERING_TASK_TYPES: EngineeringTaskType[] = [
  {
    id: "software_analysis",
    label: "Software codebase analysis",
    description:
      "Analyze existing codebases to understand architecture, dependencies, and technical debt",
  },
  {
    id: "test_strategy",
    label: "Test strategy development",
    description:
      "Design comprehensive testing approaches including unit, integration, and E2E testing",
  },
  {
    id: "security_audit",
    label: "Security/compliance audit",
    description:
      "Evaluate systems for security vulnerabilities and regulatory compliance requirements",
  },
  {
    id: "feature_impact",
    label: "Feature impact analysis",
    description:
      "Assess how new features will affect existing systems, performance, and user experience",
  },
  {
    id: "requirement_clarification",
    label: "Requirement clarification",
    description:
      "Refine and clarify ambiguous or incomplete technical requirements",
  },
  {
    id: "custom_engineering",
    label: "Custom engineering task",
    description:
      "Specialized engineering work that doesn't fit standard categories",
  },
  {
    id: "general_ai",
    label: "General AI solution (not Engineering IQ specific)",
    description:
      "General AI-powered solutions not specifically tied to Engineering IQ framework",
  },
];
