# Context File Generator

## Instructions

You are creating a comprehensive context documentation file for the codebase
provided below. This context file will be used by a POC (Proof of Concept)
generation system to recommend and integrate tools/agents from this codebase
WITHOUT needing to re-analyze the source code each time.

Analyze the provided codebase and generate a complete .md knowledge base.

---

## Your Task

### 1. Identify the Framework
From the source code, extract:
- Framework/project name (from package.json, setup.py, README, or repo name)
- Version (if available)
- Core purpose and philosophy
- Technology stack

### 2. Discover All Agents/Tools
Scan the codebase for:
- Agent classes, tool functions, CLI commands, MCP tools, API endpoints
- Look in directories like: `/agents/`, `/tools/`, `/src/`, `/lib/`, `/commands/`
- Check for patterns: `*Agent`, `*Tool`, `*Service`, `*Handler`, `@tool`, `@command`

### 3. Document Each Agent/Tool Found
For EVERY agent/tool discovered, document using this EXACT format:

```
#### [N]. [Agent/Tool Name]
**Agent ID:** `[exact_id_from_source]`

**Purpose:** [One sentence from docstring or comments]

**Key Capabilities:**
- [Capability from source]
- [Capability from source]

**Input Requirements:**
- `[param_name]` ([type]): [description] - Required/Optional
- `[param_name]` ([type], default: [value]): [description]

**Output:**
- Returns: [return type and structure]
- Files: [any output files generated]

**Integration:**
```python
# From actual source code usage
[real code example]
```

**CLI Usage:** (if applicable)
```bash
[actual CLI command from source]
```

**POC Use Cases:**
- [Inferred use case based on functionality]
- [Inferred use case based on functionality]

**Configuration Example:**
```yaml
[from actual config files in source]
```
```

### 4. Categorize Agents
Group discovered agents under these headers (use whichever apply):
- `### Analysis Planner Agents` - Agents that create analysis plans
- `### Report Generator (Analyzer) Agents` - Agents that execute analysis and generate reports
- `### Interactive Agents` - Agents designed for conversational/iterative use
- `### Utility Agents` - Helper agents, file operations, integrations

If the codebase uses different categories, map them to these OR create appropriate headers.

### 5. Document Architecture Patterns
Identify 3-6 common usage patterns from:
- Example files in `/examples/`, `/tests/`, `/docs/`
- README usage sections
- Integration tests showing multi-agent workflows

For each pattern:
```
### Pattern: [Name]
**Use Case:** [When to use this]
**Agents Involved:** [List]
**Flow:**
1. [Step with agent]
2. [Step with agent]

**Code Example:**
```python
[From actual examples in source]
```
```

### 6. Extract Configuration Reference
From config files, schemas, or code defaults, document:
- All configuration options
- Environment variables (from .env.example, code that reads process.env/os.environ)
- Default values

### 7. Create Quick Reference
Generate tables summarizing:
- Agent selection by use case
- All agent IDs in one list
- Common commands

---

## Output Format

Structure your output EXACTLY as:

```markdown
# [Discovered Framework Name]: [Tagline from README or inferred]

**Purpose:** [From README or inferred]

---

## Overview
[2-3 paragraphs about the framework]

## POC Categories & Capabilities
[Map framework features to POC use cases]

---

## Available Agents

### [Category] Agents

#### 1. [First Agent]
**Agent ID:** `[id]`
[Full documentation as specified above]

#### 2. [Second Agent]
...

---

## Architecture Patterns
[Documented patterns]

---

## Configuration Reference
[All config options]

---

## Quick Reference
[Summary tables]

---

## Extension Guide
[How to create custom agents - from source if available]
```

---

## Anti-Hallucination Rules

1. ONLY document what exists in the provided source code
2. Use EXACT names, IDs, parameters, and types from the source
3. Quote docstrings and comments directly
4. If functionality is unclear, mark as `[INFERRED]` or `[NEEDS VERIFICATION]`
5. Do not invent agents, parameters, or capabilities
6. Include file paths where you found each agent: `Source: path/to/file.py:L42`

---

## How to Use This Template

1. Copy this entire file content
2. Paste your codebase content after the "Source Code" section below
3. Send to Claude or another AI
4. Save the output as `/context/context_[repo_name].md`
5. Run `npm run load-framework` to load into AICT database

No editing of this template is needed - the AI extracts everything from the source.

---

## Source Code

[PASTE COMPLETE CODEBASE OR KEY FILES BELOW THIS LINE]

