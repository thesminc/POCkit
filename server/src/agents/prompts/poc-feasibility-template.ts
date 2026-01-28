/**
 * POC Feasibility Analysis Templates
 *
 * This file contains easily modifiable prompt templates for POC generation.
 * Edit these templates to customize the output format and content.
 *
 * Templates available:
 * - BUSINESS_POC_TEMPLATE: Executive-focused, ROI, timelines, risks
 * - DEVELOPER_POC_TEMPLATE: Technical details, code examples, architecture
 * - COMBINED_POC_TEMPLATE: Both perspectives in one document
 */

// =============================================================================
// SHARED FEASIBILITY ANALYSIS SECTION
// This section is included in all POC formats
// =============================================================================

export const FEASIBILITY_ANALYSIS_INSTRUCTIONS = `
## Your Role: Feasibility Analyst

You are analyzing whether the user's request can be implemented using the EXISTING
codebase/frameworks described in the context files provided below.

### Analysis Requirements:

1. **THOROUGHLY READ** the context files - they describe existing code, agents,
   frameworks, and capabilities that are ALREADY BUILT.

2. **DETERMINE FEASIBILITY**:
   - **YES**: The request can be fully implemented using existing components
   - **PARTIAL**: Some parts can use existing code, some need new development
   - **NO**: The request requires mostly new development

3. **BE SPECIFIC**: Reference actual components, agents, tools, and patterns
   from the context files. Don't be generic.

4. **CITE SOURCES**: When mentioning existing capabilities, reference which
   context file and section they come from.

### Critical Rules:
- Do NOT invent capabilities that don't exist in the context files
- Do NOT be vague - provide specific component names and integration points
- Do NOT skip sections - fill in ALL sections with detailed analysis
- Minimum 2500 words for comprehensive analysis
`;

// =============================================================================
// BUSINESS POC TEMPLATE
// For executives, stakeholders, and business decision makers
// =============================================================================

export const BUSINESS_POC_TEMPLATE = `
${FEASIBILITY_ANALYSIS_INSTRUCTIONS}

## Output Format: BUSINESS POC

Generate a detailed business-focused feasibility analysis following this EXACT structure:

---

# Feasibility Analysis: [Request Title]

## Executive Summary

| Aspect | Assessment |
|--------|------------|
| **Feasibility Verdict** | ✅ YES / ⚠️ PARTIAL / ❌ NO |
| **Confidence Level** | High (90%+) / Medium (70-89%) / Low (<70%) |
| **Estimated Timeline** | X weeks/months |
| **Resource Requirements** | X developers for Y weeks |
| **Risk Level** | Low / Medium / High |

### One-Paragraph Summary
[2-3 sentence summary of what can be done with existing code vs what needs to be built]

---

## Business Context

### The Request
[Restate the user's request in clear business terms]

### Business Value
[Why this request matters - potential ROI, efficiency gains, competitive advantage]

### Success Criteria
- [ ] [Measurable success criterion 1]
- [ ] [Measurable success criterion 2]
- [ ] [Measurable success criterion 3]

---

## Existing Capabilities Assessment

### What We Already Have

| Capability | Source | Status | How It Helps |
|------------|--------|--------|--------------|
| [Capability 1] | [Context file name] | ✅ Ready | [Explanation] |
| [Capability 2] | [Context file name] | ⚠️ Needs Adaptation | [Explanation] |
| [Capability 3] | [Context file name] | ✅ Ready | [Explanation] |

### Detailed Capability Analysis

#### [Capability 1 Name] (from [Context File])
**What it does:** [Description]
**How it applies to this request:** [Specific application]
**Readiness level:** Ready to use / Needs minor changes / Needs significant adaptation

#### [Capability 2 Name] (from [Context File])
**What it does:** [Description]
**How it applies to this request:** [Specific application]
**Readiness level:** Ready to use / Needs minor changes / Needs significant adaptation

[Continue for all relevant capabilities...]

---

## Gap Analysis

### What We Need to Build

| Gap | Priority | Effort | Build vs Buy |
|-----|----------|--------|--------------|
| [Gap 1] | High/Medium/Low | X days/weeks | Build / Buy / Hybrid |
| [Gap 2] | High/Medium/Low | X days/weeks | Build / Buy / Hybrid |

### Gap Details

#### Gap 1: [Gap Name]
**Why we need it:** [Business justification]
**Impact if not addressed:** [Consequences]
**Recommended approach:** [Build internally / Use existing tool / Hybrid]
**Estimated effort:** [Time and resources]

#### Gap 2: [Gap Name]
[Same structure as above]

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** [Phase goal]
**Activities:**
- [ ] [Activity 1 - using existing component X]
- [ ] [Activity 2 - using existing component Y]

**Deliverables:**
- [Deliverable 1]
- [Deliverable 2]

### Phase 2: Core Development (Week 3-4)
**Goal:** [Phase goal]
**Activities:**
- [ ] [Activity 1]
- [ ] [Activity 2]

**Deliverables:**
- [Deliverable 1]
- [Deliverable 2]

### Phase 3: Integration & Testing (Week 5-6)
**Goal:** [Phase goal]
**Activities:**
- [ ] [Activity 1]
- [ ] [Activity 2]

**Deliverables:**
- [Deliverable 1]
- [Deliverable 2]

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Strategy] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Strategy] |
| [Risk 3] | High/Med/Low | High/Med/Low | [Strategy] |

---

## Resource Requirements

### Team Composition
| Role | Count | Duration | Responsibilities |
|------|-------|----------|------------------|
| [Role 1] | X | Y weeks | [Key tasks] |
| [Role 2] | X | Y weeks | [Key tasks] |

### Infrastructure
- [Infrastructure requirement 1]
- [Infrastructure requirement 2]

### External Dependencies
- [Dependency 1]
- [Dependency 2]

---

## Cost-Benefit Analysis

### Estimated Costs
| Category | One-Time | Recurring (Monthly) |
|----------|----------|---------------------|
| Development | $X | - |
| Infrastructure | $X | $X |
| Maintenance | - | $X |
| **Total** | **$X** | **$X** |

### Expected Benefits
- [Quantifiable benefit 1]
- [Quantifiable benefit 2]
- [Quantifiable benefit 3]

### ROI Timeline
[When the investment is expected to pay off]

---

## Recommendation

### Final Verdict: [YES / PARTIAL / NO]

[2-3 paragraph detailed recommendation explaining:]
- Whether to proceed and why
- Recommended approach (which option if multiple)
- Critical success factors
- First steps to take

### Immediate Next Steps
1. [Concrete next step 1]
2. [Concrete next step 2]
3. [Concrete next step 3]

---
`;

// =============================================================================
// DEVELOPER POC TEMPLATE
// For technical teams, architects, and developers
// =============================================================================

export const DEVELOPER_POC_TEMPLATE = `
${FEASIBILITY_ANALYSIS_INSTRUCTIONS}

## Output Format: DEVELOPER POC

Generate a detailed technical feasibility analysis following this EXACT structure:

---

# Technical Feasibility Analysis: [Request Title]

## TL;DR

| Metric | Value |
|--------|-------|
| **Feasibility** | ✅ YES / ⚠️ PARTIAL / ❌ NO |
| **Existing Code Coverage** | X% of requirements |
| **New Code Required** | ~X lines / X components |
| **Complexity** | Low / Medium / High |
| **Estimated Dev Time** | X developer-days |

---

## Technical Context

### Request Analysis
[Technical breakdown of what the request requires]

### System Requirements
- **Performance:** [Requirements]
- **Scalability:** [Requirements]
- **Security:** [Requirements]
- **Integration Points:** [List of systems to integrate with]

---

## Architecture Analysis

### Current System Architecture (from Context Files)

\`\`\`
[ASCII diagram of current architecture from context files]
\`\`\`

### Proposed Architecture

\`\`\`
[ASCII diagram showing how the request fits into existing architecture]
\`\`\`

### Integration Points

| Component | Integration Type | Complexity | Notes |
|-----------|-----------------|------------|-------|
| [Component 1] | API / Event / Direct | Low/Med/High | [Notes] |
| [Component 2] | API / Event / Direct | Low/Med/High | [Notes] |

---

## Existing Components Deep Dive

### Component 1: [Name] (from [Context File])

**Source:** \`[file path or module reference from context]\`

**Description:** [What this component does]

**Relevant Capabilities:**
- [Capability 1]
- [Capability 2]

**How to Use for This Request:**
\`\`\`typescript
// Example integration code
import { ComponentName } from '[path]';

// Usage example
const result = await ComponentName.method({
  param1: value1,
  param2: value2
});
\`\`\`

**Modifications Needed:**
- [ ] [Modification 1]
- [ ] [Modification 2]

---

### Component 2: [Name] (from [Context File])

[Same structure as Component 1]

---

## Gap Analysis - Technical Details

### Gap 1: [Missing Component Name]

**What it needs to do:**
[Detailed technical description]

**Why it's needed:**
[Technical justification]

**Implementation Options:**

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| Option A: [Approach] | [Pros] | [Cons] | X days |
| Option B: [Approach] | [Pros] | [Cons] | X days |

**Recommended:** Option [X] because [reason]

**Proposed Implementation:**
\`\`\`typescript
// Pseudo-code or skeleton implementation
interface GapComponent {
  // Interface definition
}

class GapComponentImpl implements GapComponent {
  // Implementation outline
}
\`\`\`

---

### Gap 2: [Missing Component Name]

[Same structure as Gap 1]

---

## Implementation Plan

### Phase 1: Setup & Configuration

**Files to Create:**
| File Path | Purpose |
|-----------|---------|
| \`[path/to/file.ts]\` | [Purpose] |
| \`[path/to/file.ts]\` | [Purpose] |

**Files to Modify:**
| File Path | Changes |
|-----------|---------|
| \`[path/to/existing.ts]\` | [What to change] |
| \`[path/to/existing.ts]\` | [What to change] |

**Code Changes:**
\`\`\`typescript
// In [filename]
// Add/modify this code:

[code snippet]
\`\`\`

---

### Phase 2: Core Implementation

**Step 1: [Task Name]**

\`\`\`typescript
// Implementation details
[code]
\`\`\`

**Step 2: [Task Name]**

\`\`\`typescript
// Implementation details
[code]
\`\`\`

---

### Phase 3: Integration

**API Changes:**
| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| \`/api/...\` | POST/GET | \`{...}\` | \`{...}\` | [Notes] |

**Database Changes:**
\`\`\`sql
-- Migration: [description]
ALTER TABLE ...
-- or
CREATE TABLE ...
\`\`\`

**Environment Variables:**
\`\`\`env
NEW_VAR_1=value
NEW_VAR_2=value
\`\`\`

---

## Testing Strategy

### Unit Tests
\`\`\`typescript
describe('[Component]', () => {
  it('should [behavior]', () => {
    // Test outline
  });
});
\`\`\`

### Integration Tests
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]

### E2E Tests
- [ ] [User flow 1]
- [ ] [User flow 2]

---

## Dependencies

### NPM Packages
| Package | Version | Purpose |
|---------|---------|---------|
| [package] | ^X.Y.Z | [Purpose] |

### External Services
| Service | Purpose | Setup Required |
|---------|---------|----------------|
| [Service] | [Purpose] | [Setup steps] |

---

## Performance Considerations

### Expected Load
- [Metric 1]: [Expected value]
- [Metric 2]: [Expected value]

### Optimization Opportunities
- [Optimization 1]
- [Optimization 2]

### Bottleneck Risks
- [Risk 1] → [Mitigation]
- [Risk 2] → [Mitigation]

---

## Security Considerations

### Authentication/Authorization
[How auth is handled]

### Data Protection
[How sensitive data is protected]

### Vulnerabilities to Address
- [ ] [Vulnerability 1]
- [ ] [Vulnerability 2]

---

## Deployment

### Prerequisites
- [ ] [Prerequisite 1]
- [ ] [Prerequisite 2]

### Deployment Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Rollback Plan
[How to rollback if issues occur]

---

## Summary

### Feasibility: [YES / PARTIAL / NO]

**What can be built with existing code:**
- [Item 1]
- [Item 2]

**What needs new development:**
- [Item 1]
- [Item 2]

### Recommended First Steps
1. [Technical step 1]
2. [Technical step 2]
3. [Technical step 3]

---
`;

// =============================================================================
// COMBINED POC TEMPLATE
// Both business and developer perspectives in one document
// =============================================================================

export const COMBINED_POC_TEMPLATE = `
${FEASIBILITY_ANALYSIS_INSTRUCTIONS}

## Output Format: COMBINED POC (Business + Developer)

Generate BOTH a business-focused AND technical analysis in one comprehensive document.
The document should be suitable for both executives AND developers.

---

# Comprehensive Feasibility Analysis: [Request Title]

---

# Part 1: Executive Summary & Business Analysis

[Include full BUSINESS POC content here - all sections from Executive Summary through Recommendation]

---

# Part 2: Technical Deep Dive

[Include full DEVELOPER POC content here - all sections from TL;DR through Summary]

---
`;

// =============================================================================
// TEMPLATE SELECTOR FUNCTION
// =============================================================================

export type POCFormat = 'business' | 'developer' | 'both';

/**
 * Get the appropriate POC template based on format selection
 */
export function getPOCTemplate(format: POCFormat): string {
  switch (format) {
    case 'business':
      return BUSINESS_POC_TEMPLATE;
    case 'developer':
      return DEVELOPER_POC_TEMPLATE;
    case 'both':
      return COMBINED_POC_TEMPLATE;
    default:
      return BUSINESS_POC_TEMPLATE;
  }
}

/**
 * Build the complete POC generation prompt with context
 */
export function buildPOCPrompt(
  format: POCFormat,
  problemStatement: string,
  contextContent: string,
  qaResponses: string,
  additionalContext?: string
): string {
  const template = getPOCTemplate(format);

  return `
${template}

---

# INPUT DATA FOR ANALYSIS

## User's Request (Problem Statement)
${problemStatement}

## Selected Context Files (Existing Codebase/Frameworks)
${contextContent || 'No context files selected'}

## Q&A Responses (Additional Information Gathered)
${qaResponses || 'No Q&A responses available'}

${additionalContext ? `## Additional Context\n${additionalContext}` : ''}

---

# GENERATE THE POC NOW

IMPORTANT: Generate markdown directly. Do NOT wrap output in code blocks.
Start your response IMMEDIATELY with: # Feasibility Analysis: [Title based on problem statement]

Based on the template structure above and the input data provided, generate a comprehensive
feasibility analysis. Be detailed, specific, and reference actual components from the context files.

REQUIREMENTS:
- Start with "# Feasibility Analysis:" title immediately
- Minimum 2500 words - this is a comprehensive document
- Fill in ALL sections from the template - do not skip any
- Be specific - use actual names, paths, and code from context files
- Cite which context file each capability comes from
- Provide concrete feasibility verdict: YES (fully possible with existing code), PARTIAL (some parts exist, some need building), or NO (mostly new development needed)
- Include specific code examples and integration points where applicable

Begin your response now with the title:
`;
}
