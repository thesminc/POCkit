# GCP Repo Analyzer POC Framework

## Overview

This document provides a comprehensive framework for building Proof of Concepts (POCs) based on the GCP Repo Analyzer architecture. Use this as a reference to understand the full scope of functionality available and how to leverage or extend these capabilities for dynamic POC creation.

**Target Audience**: AI agents and applications that need to understand GCP Repo Analyzer's architecture to dynamically generate POCs, extend functionality, or integrate with existing capabilities.

---

## Table of Contents

1. [Framework Capabilities](#framework-capabilities)
2. [Agent Catalog](#agent-catalog)
3. [Architecture Patterns](#architecture-patterns)
4. [Extension Guide](#extension-guide)
5. [POC Templates](#poc-templates)
6. [Integration Patterns](#integration-patterns)

---

## Framework Capabilities

### 🧠 AI-Powered Analysis

**Purpose**: Intelligent code understanding using Google's Gemini AI

**Core Components**:

- **GenAI Provider Interface** (`gcp_repo_analyzer/genai/interface.py`)
  - Abstraction layer for AI model interactions
  - Supports context caching for efficient token usage
  - Configurable generation parameters (temperature, max_tokens)
  - Built-in retry logic and error handling

**Use Cases**:

- Natural language querying of codebases
- Automated code comprehension and documentation
- Pattern recognition across large repositories
- Intelligent code summarization

**When to Use in POCs**:

- Any POC requiring code analysis or understanding
- Projects needing to extract insights from unfamiliar codebases
- Automated documentation generation systems
- Code quality assessment tools

---

### 📊 Multi-Perspective Reports

**Purpose**: Generate specialized analysis reports from three distinct professional perspectives

**Available Perspectives**:

#### 1. **Product Perspective** (`prompts/personas/product/`)

Available Reports:

- **application-overview.md**: High-level business functionality overview
- **feature-catalog.md**: Comprehensive feature inventory with business value
- **business-data-model.md**: Data entities and their business relationships
- **business-rules-workflows.md**: Business logic and process flows
- **integration-requirements.md**: External system dependencies
- **non-functional-business-requirements.md**: Performance, security, scalability needs
- **user-personas-journeys.md**: User types and their interaction patterns

**Output**: Business-focused documentation suitable for executives, product managers, and stakeholders

#### 2. **Development Perspective** (`prompts/personas/dev/`)

Available Reports:

- **technical-architecture-analysis.md**: System design patterns and component structure
- **implementation-details-analysis.md**: Code-level technical decisions
- **build-configure-run.md**: Setup and deployment procedures
- **code-quality-assessment.md**: Code health and maintainability metrics
- **codebase-organization-setup.md**: Project structure and conventions
- **debugging-analysis.md**: Debugging strategies and common issues
- **integration-dependencies-analysis.md**: Technical integration points
- **logical-dependencies-diagram.md**: Component dependency mapping
- **performance-analysis.md**: Performance characteristics and bottlenecks
- **security-analysis.md**: Security vulnerabilities and best practices
- **unit-test-recommendations.md**: Testing strategy and coverage gaps

**Output**: Technical documentation for developers and architects

#### 3. **Quality Engineering Perspective** (`prompts/personas/qe/`)

Available Reports:

- **functional-test-recommendations.md**: Feature-level test scenarios
- **integration-test-recommendations.md**: Cross-component test strategies
- **boundary-test-recommendations.md**: Edge case and error condition testing
- **test-coverage-analysis.md**: Current test coverage assessment
- **test-data-strategy-analysis.md**: Test data requirements and management
- **quality-risk-assessment.md**: Quality risks and mitigation strategies
- **risk-based-testing-matrix.md**: Prioritized testing approach
- **mfda_testing_master_prompt.md**: Comprehensive testing strategy
- **mfda_test_case_generator.md**: Automated test case generation
- **mfda_test_data_strategy.md**: Test data architecture

**Output**: Testing documentation for QA engineers and test automation

**When to Use in POCs**:

- Creating documentation generators
- Building code analysis dashboards
- Automated assessment tools for legacy systems
- Multi-stakeholder reporting systems

---

### 🎯 Smart File Selection

**Purpose**: AI-driven identification of the most important files for analysis

**Core Components**:

- **SmartFileSelector** (`gcp_repo_analyzer/smart_selector/selector.py`)
- **DirectoryAnalyzer** (`gcp_repo_analyzer/smart_selector/analyzer.py`)

**How It Works**:

1. **Two-Pass Analysis**:
   - First pass: Analyze directory structure and file metadata
   - Second pass: AI selects most relevant files based on analysis goals
2. **Cost Optimization**: Avoids caching entire large repositories
3. **Intelligent Filtering**: Respects .gitignore patterns automatically

**Configuration Options**:

- File extension filters
- Directory exclusions
- Minimum/maximum file counts
- Cacheability assessment

**When to Use in POCs**:

- Large repository analysis where full caching is impractical
- Focused analysis on specific subsystems
- Cost-sensitive AI operations
- Rapid prototype scanning

---

### ⚡ Intelligent Caching

**Purpose**: Fast, efficient codebase caching with token optimization

**Core Components**:

- **CacheManager** (via GenAI Provider interface)
- **Session-based caching** (`gcp_repo_analyzer/mcp/session_cache.py`)

**Features**:

- **Context Caching**: Reusable AI context for multiple queries
- **TTL Management**: Configurable cache expiration (default: 1 hour)
- **Mixed Content Support**: Combine files, directories, and custom instructions
- **Persona Integration**: Include persona prompts in cache context
- **Gitignore Support**: Automatic exclusion of build artifacts and dependencies

**Cache Types**:

1. **Directory Caches**: Full or filtered directory content
2. **File-based Caches**: Specific file selections
3. **Mixed Caches**: Combination of files and metadata

**When to Use in POCs**:

- Interactive code exploration tools
- Chatbots for codebase Q&A
- Iterative analysis workflows
- Multi-query analysis scenarios

---

### 🔄 End-to-End Workflows

**Purpose**: Automated repository analysis from clone to reports

**Workflow Stages**:

1. **Repository Acquisition**:

   - Git clone from remote URLs
   - Local directory loading
   - Branch-specific checkouts

2. **Content Processing**:

   - Smart file selection
   - Cache creation with personas
   - Context optimization

3. **Analysis Execution**:

   - Multi-perspective report generation
   - Custom report execution
   - Parallel report processing

4. **Output Management**:
   - Structured output directories
   - Timestamped reports
   - Markdown formatting
   - Optional Confluence upload

**CLI Tool**: `rp-scripts analyze`

**When to Use in POCs**:

- Automated CI/CD analysis pipelines
- Scheduled repository assessments
- Batch processing multiple repositories
- One-command analysis tools

---

### 💬 Interactive Querying

**Purpose**: Conversational interface for iterative analysis

**Core Components**:

- **query_cache** MCP tool
- **GenAI Provider** with conversation support

**Features**:

- Natural language queries against cached content
- Multi-turn conversations with context retention
- Adjustable temperature and token limits
- Model selection per query

**Example Use Cases**:

- "What design patterns are used in this codebase?"
- "Show me all database connection code"
- "Explain the authentication flow"
- "What are the main security risks?"

**When to Use in POCs**:

- Interactive code exploration tools
- AI-powered code search engines
- Developer assistance chatbots
- Learning and onboarding platforms

---

### 📈 Observability

**Purpose**: Built-in tracing and monitoring for all AI operations

**Observability Modes**:

1. **Logfire Integration** (when token present):

   - Real-time tracing
   - Performance metrics
   - Token usage tracking
   - Error monitoring

2. **File-based Logging** (fallback):
   - Structured logs to `logs/repo.log`
   - Error logs to `logs/error.log`
   - Observability logs to `logs/observability.log`

**Instrumentation**: `gcp_repo_analyzer/utils/gemini_instrumentator.py`

**Tracked Metrics**:

- AI model invocations
- Token consumption (input/output/cached)
- Response latencies
- Cache hit rates
- Error rates and types

**When to Use in POCs**:

- Production-ready analysis systems
- Cost tracking and optimization
- Performance tuning
- Debugging AI interactions

---

### 🎨 Custom Prompt Paths

**Purpose**: Override default prompts with custom analysis templates

**How It Works**:

- Specify custom prompt directories via `--prompt-paths`
- Organize prompts in any directory structure
- Combine multiple prompt sources
- Override default personas with custom perspectives

**Configuration**:

```yaml
directories:
  prompt_paths:
    - "prompts/personas"
    - "prompts/additional_reports"
    - "custom_prompts/my_reports"
```

**When to Use in POCs**:

- Domain-specific analysis (e.g., fintech, healthcare)
- Custom compliance reporting
- Specialized security assessments
- Company-specific documentation standards

---

## Agent Catalog

### MCP Server Tools

The GCP Repo Analyzer exposes 13 core tools via Model Context Protocol (MCP) for AI agent integration.

#### Repository Management Tools

##### 1. `add_repository`

**Purpose**: Add a repository to the analysis session

**Parameters**:

- `repository_path_or_url` (required): Local path or Git URL
- `repository_name` (required): Short identifier for this repo
- `set_as_active` (optional, default: true): Make this the active repo
- `branch` (optional): Specific Git branch to checkout

**Returns**:

```json
{
  "success": true,
  "repository_name": "my-project",
  "repository_path": "/workdir/repos/my-project",
  "is_active": true,
  "total_repositories": 1,
  "is_cloned": true
}
```

**Use Cases**:

- Multi-repository analysis sessions
- Automated repository loading from URLs
- Branch-specific analysis

---

##### 2. `list_repositories`

**Purpose**: List all repositories in the current session

**Parameters**: None

**Returns**:

```json
{
  "success": true,
  "repositories": [
    { "name": "repo1", "path": "/path/to/repo1", "is_active": true },
    { "name": "repo2", "path": "/path/to/repo2", "is_active": false }
  ],
  "active_repository": "repo1",
  "total": 2
}
```

---

##### 3. `set_active_repository`

**Purpose**: Switch the active repository for operations

**Parameters**:

- `repository_name` (required): Name of repo to activate

**Returns**:

```json
{
  "success": true,
  "active_repository": "my-project",
  "repository_path": "/path/to/my-project"
}
```

---

#### Caching Tools

##### 4. `cache_directory`

**Purpose**: Cache a directory's contents for AI analysis

**Parameters**:

- `dir_path` (required): Directory to cache
- `name` (optional): Human-readable cache name
- `extensions` (optional): File extensions to include (e.g., [".py", ".js"])
- `use_gitignore` (optional, default: true): Respect .gitignore patterns
- `include_personas` (optional, default: true): Include persona prompts in cache
- `system_instruction` (optional): Custom system instruction for AI
- `ttl` (optional, default: "3600s"): Cache time-to-live
- `model` (optional): Specific AI model to use
- `use_smart_selection` (optional, default: true): Use AI-powered file selection

**Returns**:

```json
{
  "success": true,
  "cache_id": "cachedContent/abc123",
  "cache_name": "my-project",
  "message": "Directory cached successfully"
}
```

**Key Feature**: When `use_smart_selection=true`, uses two-pass AI analysis to select only the most relevant files, optimizing cost and performance.

---

##### 5. `cache_files`

**Purpose**: Cache specific files for analysis

**Parameters**:

- `file_paths` (required): List of file paths to cache
- `name` (optional): Cache identifier
- `include_path_metadata` (optional, default: true): Include file path context
- `system_instruction` (optional): Custom AI instruction
- `ttl` (optional, default: "3600s"): Cache lifetime
- `model` (optional): AI model selection
- `base_path` (optional): Base directory for relative paths
- `include_personas` (optional, default: true): Include persona prompts

**Returns**:

```json
{
  "success": true,
  "cache_id": "cachedContent/xyz789",
  "cache_name": "selected-files"
}
```

---

##### 6. `query_cache`

**Purpose**: Query a cached context with natural language

**Parameters**:

- `prompt` (required): Natural language query or instruction
- `cache_id` (required): ID of cache to query
- `model` (optional): Specific AI model
- `temperature` (optional, default: 0.2): Response randomness (0.0-1.0)
- `max_tokens` (optional): Maximum response length

**Returns**:

```json
{
  "success": true,
  "response": "The codebase uses a layered architecture with...",
  "model": "gemini-2.5-pro",
  "usage": {
    "prompt_tokens": 50000,
    "completion_tokens": 1500,
    "cached_tokens": 48000
  }
}
```

---

##### 7. `list_caches`

**Purpose**: List all available caches

**Returns**:

```json
{
  "success": true,
  "caches": [
    {
      "id": "cachedContent/abc123",
      "display_name": "my-project",
      "create_time": "2025-10-10T12:00:00Z",
      "expire_time": "2025-10-10T13:00:00Z"
    }
  ],
  "total": 1
}
```

---

##### 8. `delete_cache`

**Purpose**: Delete a cache by ID

**Parameters**:

- `cache_id` (required): Cache identifier to delete

**Returns**:

```json
{
  "success": true,
  "cache_id": "cachedContent/abc123",
  "message": "Cache deleted successfully"
}
```

---

#### Report Generation Tools

##### 9. `list_reports`

**Purpose**: List all available report types

**Parameters**:

- `category` (optional): Filter by category ("personas", "additional_reports", etc.)

**Returns**:

```json
{
  "success": true,
  "reports": [
    {
      "name": "technical-architecture-analysis",
      "category": "personas/dev",
      "file_id": "technical-architecture-analysis",
      "file_path": "/prompts/personas/dev/technical-architecture-analysis.md"
    }
  ],
  "total": 40
}
```

---

##### 10. `generate_reports`

**Purpose**: Generate one or more reports using a cached context

**Parameters**:

- `cache_id` (required): Cache to analyze
- `report_names` (required): List of report names or ["all"]
- `output_dir` (optional, default: "reports"): Output directory
- `project_name` (optional): Project name for organization
- `timeout_seconds` (optional, default: 300): Per-report timeout
- `max_retries` (optional, default: 3): Retry count on failure

**Returns**:

```json
{
  "success": true,
  "total": 5,
  "successful": 5,
  "failed": 0,
  "results": [
    {
      "name": "technical-architecture-analysis",
      "success": true,
      "file_path": "/reports/my-project/dev/technical-architecture-analysis.md",
      "duration_seconds": 45.2
    }
  ]
}
```

---

##### 11. `add_custom_report_directory`

**Purpose**: Add a directory containing custom report templates

**Parameters**:

- `report_directory` (required): Path to custom report markdown files
- `category_name` (required): Category name for organization

**Returns**:

```json
{
  "success": true,
  "directory": "/path/to/custom/reports",
  "category": "custom_security",
  "markdown_files_found": 8,
  "total_custom_directories": 1
}
```

---

##### 12. `generate_custom_report`

**Purpose**: Generate a one-off report from markdown instructions

**Parameters**:

- `cache_id` (required): Cache to analyze
- `report_markdown` (required): Full markdown report template content
- `report_name` (required): Report name for output file
- `output_dir` (optional, default: "reports"): Output directory
- `project_name` (optional): Project name
- `timeout_seconds` (optional, default: 300): Timeout

**Returns**:

```json
{
  "success": true,
  "report_name": "custom-security-audit",
  "file_path": "/reports/my-project/custom/custom-security-audit.md",
  "model": "gemini-2.5-pro",
  "usage": { "prompt_tokens": 45000, "completion_tokens": 2000 }
}
```

---

##### 13. `list_custom_report_directories`

**Purpose**: List all registered custom report directories

**Returns**:

```json
{
  "success": true,
  "directories": [
    {
      "path": "/custom/security/reports",
      "markdown_files": 5,
      "exists": true
    }
  ],
  "total": 1
}
```

---

#### Confluence Integration Tools

##### 14. `upload_reports`

**Purpose**: Upload generated reports to Confluence

**Parameters**:

- `report_dir` (required): Directory containing reports to upload
- `parent_page_id` (optional): Parent Confluence page
- `space_key` (optional): Confluence space

---

##### 15. `find_page`

**Purpose**: Find a Confluence page by title

---

##### 16. `test_connection`

**Purpose**: Test Confluence API connection

---

### Specialized Report Agents

#### Migration Analysis Agents

Located in `prompts/additional_reports/`, these agents provide specialized migration analysis:

##### 1. **DB2 Migration Agent** (`db2.md`)

**Purpose**: Analyze DB2 database dependencies and create AlloyDB migration strategy

**Output**:

- SQL syntax migration requirements
- Stored procedure conversions
- Application code updates
- Data type and function mappings
- Performance optimization strategies
- Risk assessment
- Security considerations

**When to Use**: POCs involving legacy DB2 database migrations to Google Cloud

---

##### 2. **MFT Migration Agent** (`mft.md`, `mft_qe.md`)

**Purpose**: Managed File Transfer system analysis and migration planning

**Outputs**:

- Dev perspective: Architecture and integration patterns
- QE perspective: Testing strategies for file transfer workflows

---

##### 3. **MQ to Kafka Migration Agent** (`mq_to_kafka.md`, `mq_to_kafka_qe.md`)

**Purpose**: Analyze IBM MQ usage and plan Kafka migration

**Outputs**:

- Message flow analysis
- Kafka architecture recommendations
- Producer/consumer migration patterns
- Testing strategies

---

##### 4. **SOAP Service Analysis Agent** (`soap.md`, `soap_to_soap.md`, `soap_qe.md`)

**Purpose**: Analyze SOAP web service implementations

**Outputs**:

- WSDL and service contract analysis
- Modernization strategies
- Testing recommendations

---

##### 5. **TIBCO Migration Agent** (`tibco.md`, `tibco_qe.md`)

**Purpose**: TIBCO BusinessWorks integration analysis

**Outputs**:

- Integration pattern identification
- Cloud-native alternatives
- Testing strategies

---

##### 6. **Mainframe/Oracle Migration Agent** (`mainframe_oracle_to_cloud.md`)

**Purpose**: Legacy mainframe and Oracle application cloud migration

**Outputs**:

- COBOL/PL-SQL analysis
- Cloud architecture recommendations
- Modernization roadmap

---

## Architecture Patterns

### Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server Layer                        │
│  (FastMCP - Model Context Protocol for AI Agent Integration)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Repos     │  │   Caching   │  │   Reports   │
│   Tools     │  │   Tools     │  │   Tools     │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────────────────────────────────────┐
│          Server State Management            │
│  - Repository roots (multi-repo support)    │
│  - Active repository tracking               │
│  - Cache manager instance                   │
│  - GenAI provider instance                  │
│  - Smart selector instance                  │
│  - Report discovery engine                  │
│  - Custom report paths                      │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│  GenAI  │  │  Smart  │  │ Report  │
│Provider │  │Selector │  │Discovery│
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     ▼            ▼            ▼
┌──────────────────────────────────┐
│      Google Gemini AI API        │
│  - Context Caching               │
│  - Token Management              │
│  - Generation with Cache         │
└──────────────────────────────────┘
```

### Key Architectural Patterns

#### 1. **Stateful Session Management**

```python
# Each MCP session maintains state
class ServerState:
    repository_roots: dict[str, str]  # Multi-repo support
    active_repository: str | None
    cache_manager: CacheManager
    provider: GenAIProvider
    smart_selector: SmartFileSelector
    report_discovery: ReportDiscovery
    custom_report_paths: list[Path]
```

**Pattern**: Session-scoped state allows multiple repositories and caches per analysis session.

**Use in POCs**: Build multi-repo comparison tools, portfolio analysis systems, or batch processing pipelines.

---

#### 2. **Provider Abstraction Pattern**

```python
# Generic AI provider interface
class GenAIProvider(ABC):
    @abstractmethod
    def generate_with_cache(self, content, cache_id, model, config): ...

    @abstractmethod
    def create_cache(self, contents, system_instruction, ttl, model): ...

    @abstractmethod
    def list_caches(self): ...
```

**Pattern**: Abstract provider interface allows swapping AI backends.

**Use in POCs**: Support multiple AI providers (Gemini, Claude, OpenAI) with the same interface.

---

#### 3. **Two-Pass Smart Selection Pattern**

```python
# Pass 1: Directory structure analysis
analysis = smart_selector.analyze_directory_structure(dir_path)

# Pass 2: AI selects most important files
important_paths = analysis.important_paths

# Cache only selected files
cache = cache_manager.create_cache_with_mixed_content(
    file_paths=important_paths,
    ...
)
```

**Pattern**: Reduce AI costs by intelligently selecting files before caching.

**Use in POCs**: Large-scale repository analysis, cost-optimized AI systems.

---

#### 4. **Persona-Driven Analysis Pattern**

```python
# Include persona prompts in cache
cache = cache_manager.create_cache_from_directory(
    dir_path=dir_path,
    include_personas=True,  # Adds prompts/personas/*.md to cache
    ...
)

# Generate perspective-specific reports
reports = ["technical-architecture-analysis",  # Dev perspective
           "feature-catalog",                   # Product perspective
           "functional-test-recommendations"]   # QE perspective
```

**Pattern**: Single cache, multiple analytical perspectives.

**Use in POCs**: Multi-stakeholder documentation systems, automated assessment tools.

---

#### 5. **Report Execution Pattern**

```python
# Parallel report generation with retry logic
executor = ReportExecutor(provider)
results = executor.execute_reports(
    cache_id=cache_id,
    reports=selected_reports,
    execution_config=ReportExecutionConfig(
        timeout_seconds=300,
        max_retries=3,
        retry_on_timeout=True
    )
)
```

**Pattern**: Parallel execution with automatic retry for transient failures.

**Use in POCs**: Robust batch processing, CI/CD integration, automated analysis pipelines.

---

#### 6. **Repository Management Pattern**

```python
# Multi-repository session
add_repository(ctx, "https://github.com/user/repo1.git", "repo1")
add_repository(ctx, "/local/path/repo2", "repo2", set_as_active=False)

# Switch between repositories
set_active_repository(ctx, "repo2")

# All operations use active repository
cache_directory(ctx, ".", name="repo2-cache")
```

**Pattern**: Session-based multi-repo management with active repository switching.

**Use in POCs**: Comparative analysis tools, microservice portfolio analysis, monorepo analysis.

---

#### 7. **Custom Report Extension Pattern**

```python
# Option 1: Add custom report directory
add_custom_report_directory(ctx, "./my_reports", "security")

# Option 2: Generate one-off custom report
generate_custom_report(
    ctx,
    cache_id=cache_id,
    report_markdown="# Custom Analysis\n\nAnalyze X, Y, Z...",
    report_name="custom-security-audit"
)
```

**Pattern**: Extensible report system supporting both persistent and ephemeral custom reports.

**Use in POCs**: Domain-specific analysis tools, custom compliance reporting, specialized assessments.

---

## Extension Guide

### Creating New Analysis Agents

#### Step 1: Understand the Prompt Structure

All analysis agents are markdown files with specific instructions. Here's the anatomy:

```markdown
# [Persona/Category]: [Report Name]

You are a **[Role]** analyzing this codebase to [purpose].

## Your Mission

[Clear objective statement]

## Analysis Framework

[Structured analysis approach]

### Discovery Process

- What to examine
- What to extract
- How to classify

## Output Requirements

[Expected output structure]

### Section 1: [Name]

- Required elements
- Evidence standards
- Quality criteria

### Section 2: [Name]

- Required elements
- Evidence standards
- Quality criteria

## Evidence Standards

**Strong Evidence (Use These):**

- Specific file references
- Code examples
- Configuration evidence

**Weak Evidence (Avoid These):**

- Generic statements
- Assumptions
- Unverified claims

## Analysis Guidelines

- Focus areas
- Quality standards
- Common pitfalls to avoid

## Success Criteria

Your analysis succeeds when:

- [Measurable outcome 1]
- [Measurable outcome 2]
```

---

#### Step 2: Choose Your Agent Type

**Persona-Based Agent** (for general analysis):

- Location: `prompts/personas/{dev|product|qe}/`
- Naming: `{analysis-type}.md`
- Example: `prompts/personas/dev/api-design-analysis.md`

**Specialized Agent** (for specific technologies/migrations):

- Location: `prompts/additional_reports/`
- Naming: `{technology-or-migration}.md`
- Example: `prompts/additional_reports/kubernetes_migration.md`

---

#### Step 3: Define Analysis Scope

**Questions to answer**:

1. **Who is the audience?**

   - Developers → Technical depth, code examples
   - Product managers → Business value, user impact
   - QE → Test scenarios, risk assessment

2. **What evidence is needed?**

   - File structure patterns
   - Code patterns
   - Configuration patterns
   - Dependency patterns

3. **What output format?**
   - Narrative report
   - Structured tables
   - Diagrams (mermaid)
   - Checklists

---

#### Step 4: Write the Prompt

**Template for New Dev-Perspective Agent**:

```markdown
# Dev Analysis: [Analysis Name]

You are a **[Specific Role]** analyzing this codebase to understand [specific aspect]. Focus on [key concerns from technical perspective].

## Your Mission

Conduct a comprehensive analysis that answers: "[Key question]". Provide specific, code-based insights into [focus areas].

## Analysis Framework

### Discovery Process

**Examine these code elements:**

- [Specific file patterns to look for]
- [Configuration files to analyze]
- [Code patterns to identify]
- [Dependencies to trace]

**Extract insights about:**

- [Key insight category 1]
- [Key insight category 2]
- [Key insight category 3]

### Classification System

Analyze across these dimensions:

#### Dimension 1: [Name]

- [Classification criteria 1]
- [Classification criteria 2]

#### Dimension 2: [Name]

- [Classification criteria 1]
- [Classification criteria 2]

## Output Requirements

### Section 1: [Overview Section]

Provide high-level assessment:

**[Subsection 1]**: [Description]

- Evidence from [source]
- Analysis of [aspect]
- Implications for [concern]

**[Subsection 2]**: [Description]

- Evidence from [source]
- Analysis of [aspect]
- Implications for [concern]

### Section 2: [Detailed Analysis]

For each [element], document:

**[Element Name]**: [Identifier]

**[Aspect 1]**: [What to analyze]

- [Detail 1]
- [Detail 2]

**[Aspect 2]**: [What to analyze]

- [Detail 1]
- [Detail 2]

## Evidence Standards

**Strong Evidence (Use These):**

- [Type of evidence 1 with example]
- [Type of evidence 2 with example]
- [Type of evidence 3 with example]

**Weak Evidence (Avoid These):**

- [Anti-pattern 1 with example]
- [Anti-pattern 2 with example]

## Analysis Guidelines

### Focus Area 1

- [Guideline 1]
- [Guideline 2]

### Focus Area 2

- [Guideline 1]
- [Guideline 2]

## Success Criteria

Your analysis succeeds when:

- [Measurable outcome 1]
- [Measurable outcome 2]
- [Measurable outcome 3]

## Example Evidence Citations

**Good**: "[Specific example with file references and code details]"

**Bad**: "[Generic statement without evidence]"
```

---

#### Step 5: Test Your Agent

1. **Create the markdown file**:

```bash
# For persona-based
touch prompts/personas/dev/my-new-analysis.md

# For specialized
touch prompts/additional_reports/my-technology.md
```

2. **Test with a known repository**:

```bash
# Cache a test repository
rp-cache create ./test-repo --name test-cache

# Generate your custom report
rp-reports generate-custom test-cache \
  --report-markdown "$(cat prompts/personas/dev/my-new-analysis.md)" \
  --report-name my-new-analysis
```

3. **Validate output**:

- Does it answer the key questions?
- Is evidence specific and code-based?
- Is the structure clear and logical?
- Does it avoid generic statements?

---

#### Step 6: Integrate with MCP

Once validated, your agent is automatically available via MCP:

```python
# List reports (includes your new agent)
reports = list_reports(ctx)

# Generate using your agent
results = generate_reports(
    ctx,
    cache_id=cache_id,
    report_names=["my-new-analysis"],
    output_dir="./reports"
)
```

---

### Creating New MCP Tools

#### Step 1: Define Tool Function

Create a new file in `gcp_repo_analyzer/mcp/tool_impls/`:

```python
# gcp_repo_analyzer/mcp/tool_impls/my_new_tool.py

from typing import Any
from pydantic import Field
from fastmcp import Context
from gcp_repo_analyzer.mcp.dependencies import get_server_state

async def my_new_tool(
    ctx: Context,
    param1: str = Field(
        ...,
        description="Detailed description for AI agents"
    ),
    param2: int = Field(
        42,
        description="Optional parameter with default"
    ),
) -> dict[str, Any]:
    """
    Tool description for AI agents.
    Explain what this tool does and when to use it.
    """
    server_state = get_server_state(ctx)

    try:
        # Tool implementation
        if ctx:
            await ctx.info(f"Processing {param1}")

        # Your logic here
        result = do_something(param1, param2)

        if ctx:
            await ctx.info("Operation completed successfully")

        return {
            "success": True,
            "result": result,
            "message": "Tool executed successfully"
        }

    except Exception as e:
        if ctx:
            await ctx.error(f"Tool failed: {str(e)}")
        raise
```

---

#### Step 2: Register Tool in MCP Server

Edit `gcp_repo_analyzer/mcp_server.py`:

```python
from gcp_repo_analyzer.mcp.tool_impls import my_new_tool

tools = [
    repos.add_repository,
    # ... existing tools ...
    my_new_tool.my_new_tool,  # Add your tool
]

for tool_fn in tools:
    mcp.tool(name_or_fn=tool_fn)
```

---

#### Step 3: Test Your Tool

```python
# Via MCP client
response = await mcp_client.call_tool(
    "my_new_tool",
    {
        "param1": "test-value",
        "param2": 100
    }
)
```

---

### Extending Smart Selection

#### Custom File Selection Logic

```python
# gcp_repo_analyzer/smart_selector/custom_selector.py

from gcp_repo_analyzer.smart_selector.analyzer import DirectoryAnalyzer

class CustomFileSelector:
    def __init__(self, provider):
        self.analyzer = DirectoryAnalyzer(provider)

    def select_files_by_custom_criteria(self, directory: str):
        # Custom selection logic
        analysis = self.analyzer.analyze_directory_structure(directory)

        # Apply custom filtering
        important_files = self.custom_filter(analysis)

        return important_files

    def custom_filter(self, analysis):
        # Your custom filtering logic
        # Example: Select files by size, complexity, change frequency
        pass
```

---

## POC Templates

### Template 1: Automated Code Documentation Generator

**Use Case**: Generate comprehensive documentation for undocumented codebases

**Architecture**:

```
Repository Input → Smart Selection → Cache Creation → Multi-Perspective Reports → Documentation Output
```

**Implementation**:

```python
# 1. Add repository
add_repository(ctx, repo_url, "target-repo")

# 2. Cache with smart selection
cache_result = cache_directory(
    ctx,
    dir_path=".",
    name="docs-cache",
    use_smart_selection=True,
    include_personas=True
)

# 3. Generate all perspective reports
reports_result = generate_reports(
    ctx,
    cache_id=cache_result["cache_id"],
    report_names=["all"],  # Generate all available reports
    output_dir="./documentation",
    project_name="target-repo"
)

# 4. Optional: Upload to Confluence
upload_reports(
    ctx,
    report_dir="./documentation",
    space_key="DOCS"
)
```

**Customization Points**:

- Custom report prompts for domain-specific documentation
- Filtered file selection (e.g., only API-related files)
- Output format customization (PDF, HTML, Confluence)

---

### Template 2: Legacy System Migration Analyzer

**Use Case**: Assess legacy systems for cloud migration readiness

**Architecture**:

```
Legacy Repo → Technology Detection → Specialized Migration Agents → Migration Strategy Reports
```

**Implementation**:

```python
# 1. Load legacy system
add_repository(ctx, legacy_repo_path, "legacy-system")

# 2. Cache entire system (no smart selection for complete analysis)
cache_result = cache_directory(
    ctx,
    dir_path=".",
    name="legacy-cache",
    use_smart_selection=False,  # Need full analysis for migration
    include_personas=True
)

# 3. Generate technology-specific migration reports
migration_reports = [
    "db2",                    # DB2 → AlloyDB
    "mq_to_kafka",           # MQ → Kafka
    "soap",                  # SOAP services analysis
    "tibco"                  # TIBCO integration analysis
]

reports_result = generate_reports(
    ctx,
    cache_id=cache_result["cache_id"],
    report_names=migration_reports,
    output_dir="./migration-analysis"
)

# 4. Generate QE perspective for each technology
qe_reports = [name + "_qe" for name in migration_reports]
generate_reports(
    ctx,
    cache_id=cache_result["cache_id"],
    report_names=qe_reports,
    output_dir="./migration-analysis"
)
```

**Customization Points**:

- Add custom migration agents for your specific tech stack
- Custom risk assessment criteria
- Integration with migration planning tools

---

### Template 3: Security Audit System

**Use Case**: Automated security analysis and vulnerability assessment

**Architecture**:

```
Repository → Smart Selection (Security-focused) → Custom Security Agents → Security Report + Risk Matrix
```

**Implementation**:

```python
# 1. Add custom security report directory
add_custom_report_directory(
    ctx,
    report_directory="./security_prompts",
    category_name="security"
)

# 2. Cache with security-focused selection
cache_result = cache_directory(
    ctx,
    dir_path=".",
    name="security-cache",
    extensions=[".py", ".js", ".java", ".go", ".tf"],  # Focus on code & IaC
    use_smart_selection=True,
    system_instruction="Focus on security-relevant code: authentication, authorization, data handling, API endpoints, secrets management"
)

# 3. Generate security reports
security_reports = [
    "security-analysis",           # Standard security analysis
    "quality-risk-assessment",     # Risk assessment
    "custom-vulnerability-scan",   # Custom report
    "custom-compliance-check"      # Custom report
]

reports_result = generate_reports(
    ctx,
    cache_id=cache_result["cache_id"],
    report_names=security_reports,
    output_dir="./security-audit"
)

# 4. Generate custom OWASP Top 10 analysis
owasp_prompt = """
# OWASP Top 10 Security Analysis

Analyze this codebase for OWASP Top 10 vulnerabilities:
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable and Outdated Components
7. Identification and Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging and Monitoring Failures
10. Server-Side Request Forgery

For each category, provide:
- Risk assessment (High/Medium/Low)
- Evidence from codebase
- Specific vulnerable code locations
- Remediation recommendations
"""

generate_custom_report(
    ctx,
    cache_id=cache_result["cache_id"],
    report_markdown=owasp_prompt,
    report_name="owasp-top-10-analysis",
    output_dir="./security-audit"
)
```

**Customization Points**:

- Custom security scanning rules
- Integration with SAST/DAST tools
- Compliance-specific checks (GDPR, HIPAA, PCI-DSS)

---

### Template 4: Multi-Repository Portfolio Analysis

**Use Case**: Analyze and compare multiple repositories in an organization

**Architecture**:

```
Multiple Repos → Individual Caches → Parallel Analysis → Comparative Report
```

**Implementation**:

```python
# 1. Add multiple repositories
repos = [
    ("https://github.com/org/service1.git", "service1"),
    ("https://github.com/org/service2.git", "service2"),
    ("https://github.com/org/service3.git", "service3"),
]

cache_ids = {}

for repo_url, repo_name in repos:
    # Add repository
    add_repository(ctx, repo_url, repo_name, set_as_active=True)

    # Cache each repository
    cache_result = cache_directory(
        ctx,
        dir_path=".",
        name=f"{repo_name}-cache",
        use_smart_selection=True
    )

    cache_ids[repo_name] = cache_result["cache_id"]

    # Generate standard reports for each
    generate_reports(
        ctx,
        cache_id=cache_result["cache_id"],
        report_names=["technical-architecture-analysis", "code-quality-assessment"],
        output_dir=f"./portfolio-analysis/{repo_name}"
    )

# 2. Generate comparative analysis
comparative_prompt = """
# Multi-Repository Comparative Analysis

Compare the following aspects across all repositories in the portfolio:

1. **Architectural Consistency**
   - Design patterns used
   - Technology stack choices
   - Consistency across services

2. **Code Quality Comparison**
   - Test coverage comparison
   - Code complexity metrics
   - Documentation quality

3. **Technology Debt Assessment**
   - Outdated dependencies
   - Security vulnerabilities
   - Modernization opportunities

4. **Best Practices Adherence**
   - Which services follow best practices?
   - Which need improvement?
   - Common patterns to standardize

Provide a comparative matrix and recommendations for portfolio-wide improvements.
"""

# Query each cache with the comparative prompt
for repo_name, cache_id in cache_ids.items():
    query_cache(
        ctx,
        prompt=f"Analyze {repo_name}: {comparative_prompt}",
        cache_id=cache_id
    )
```

**Customization Points**:

- Custom comparison metrics
- Portfolio-wide dashboards
- Automated dependency analysis

---

### Template 5: CI/CD Integration for PR Analysis

**Use Case**: Automated code review and analysis for pull requests

**Architecture**:

```
PR Trigger → Clone Branch → Smart Selection → Targeted Analysis → PR Comment
```

**Implementation**:

```python
# GitHub Action / GitLab CI integration

# 1. Add the PR branch
add_repository(
    ctx,
    repository_path_or_url=os.getenv("PR_REPO_URL"),
    repository_name="pr-analysis",
    branch=os.getenv("PR_BRANCH")
)

# 2. Cache only changed files (for efficiency)
changed_files = os.getenv("PR_CHANGED_FILES").split(",")

cache_result = cache_files(
    ctx,
    file_paths=changed_files,
    name="pr-cache",
    include_personas=True
)

# 3. Generate focused analysis reports
pr_reports = [
    "code-quality-assessment",
    "security-analysis",
    "unit-test-recommendations"
]

reports_result = generate_reports(
    ctx,
    cache_id=cache_result["cache_id"],
    report_names=pr_reports,
    output_dir="./pr-analysis"
)

# 4. Custom PR review prompt
pr_review_prompt = """
# Pull Request Review

Analyze the changed code for:
1. **Code Quality Issues**
   - Potential bugs
   - Code smells
   - Performance concerns

2. **Security Vulnerabilities**
   - Injection risks
   - Authentication/authorization issues
   - Data exposure risks

3. **Testing Recommendations**
   - Test cases that should be added
   - Edge cases to consider

4. **Documentation Needs**
   - Code comments needed
   - README updates required

Provide actionable feedback for the developer.
"""

review_result = generate_custom_report(
    ctx,
    cache_id=cache_result["cache_id"],
    report_markdown=pr_review_prompt,
    report_name="pr-review",
    output_dir="./pr-analysis"
)

# 5. Post results to PR (via GitHub API or GitLab API)
# post_pr_comment(review_result["file_path"])
```

**Customization Points**:

- Custom review criteria
- Integration with code review platforms
- Automated blocking for critical issues

---

### Template 6: Interactive Code Explorer Chatbot

**Use Case**: Conversational interface for exploring a codebase

**Architecture**:

```
User Query → Query Cache → AI Response → Context Retention → Next Query
```

**Implementation**:

```python
class CodeExplorerChatbot:
    def __init__(self, mcp_client):
        self.mcp = mcp_client
        self.cache_id = None
        self.conversation_history = []

    async def initialize(self, repo_url: str):
        """Initialize chatbot with a repository"""
        # Add and cache repository
        await self.mcp.call_tool("add_repository", {
            "repository_path_or_url": repo_url,
            "repository_name": "explorer-repo"
        })

        cache_result = await self.mcp.call_tool("cache_directory", {
            "dir_path": ".",
            "name": "explorer-cache",
            "use_smart_selection": True,
            "include_personas": True
        })

        self.cache_id = cache_result["cache_id"]

    async def query(self, user_message: str) -> str:
        """Query the codebase with natural language"""
        # Build context from conversation history
        context = "\n".join([
            f"User: {msg['user']}\nAssistant: {msg['assistant']}"
            for msg in self.conversation_history[-3:]  # Last 3 exchanges
        ])

        full_prompt = f"""
Previous conversation:
{context}

Current question: {user_message}

Provide a comprehensive answer based on the cached codebase.
"""

        response = await self.mcp.call_tool("query_cache", {
            "prompt": full_prompt,
            "cache_id": self.cache_id,
            "temperature": 0.3
        })

        # Store in conversation history
        self.conversation_history.append({
            "user": user_message,
            "assistant": response["response"]
        })

        return response["response"]

    async def get_report(self, report_type: str):
        """Generate a formal report"""
        return await self.mcp.call_tool("generate_reports", {
            "cache_id": self.cache_id,
            "report_names": [report_type],
            "output_dir": "./chat-reports"
        })

# Usage
chatbot = CodeExplorerChatbot(mcp_client)
await chatbot.initialize("https://github.com/user/repo.git")

# Interactive queries
response1 = await chatbot.query("What does this application do?")
response2 = await chatbot.query("How is authentication implemented?")
response3 = await chatbot.query("Show me the database schema")

# Generate formal documentation
await chatbot.get_report("technical-architecture-analysis")
```

**Customization Points**:

- Multi-turn conversation support
- Voice interface integration
- IDE plugin integration

---

## Integration Patterns

### Pattern 1: MCP Client Integration

**For AI agents using MCP protocol**:

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Connect to GCP Repo Analyzer MCP server
server_params = StdioServerParameters(
    command="rp-mcp",
    args=["--transport", "stdio"]
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize session
        await session.initialize()

        # List available tools
        tools = await session.list_tools()

        # Call tools
        result = await session.call_tool(
            "add_repository",
            {
                "repository_path_or_url": "https://github.com/user/repo.git",
                "repository_name": "my-repo"
            }
        )
```

---

### Pattern 2: Python API Integration

**For Python applications**:

```python
from gcp_repo_analyzer.genai.interface import GenAIProvider
from gcp_repo_analyzer.cache.manager import CacheManager
from gcp_repo_analyzer.reports.report_executor import ReportExecutor
from gcp_repo_analyzer.smart_selector import SmartFileSelector

# Initialize components
provider = get_default_provider()
cache_manager = CacheManager(provider)
smart_selector = SmartFileSelector(provider)
report_executor = ReportExecutor(provider)

# Use directly
analysis = smart_selector.analyze_directory_structure("./my-project")
cache = cache_manager.create_cache_from_directory(
    dir_path="./my-project",
    name="my-cache"
)
```

---

### Pattern 3: CLI Integration

**For shell scripts and automation**:

```bash
#!/bin/bash

# Full analysis pipeline
rp-scripts analyze https://github.com/user/repo.git \
  --output ./analysis \
  --categories dev,product,qe

# Custom report generation
rp-cache create ./my-project --name my-cache
rp-reports generate my-cache --names security-analysis,performance-analysis
```

---

### Pattern 4: HTTP/SSE Integration

**For web applications**:

```python
# Start MCP server in HTTP mode
# $ rp-mcp --transport http

import requests

# Call tools via HTTP
response = requests.post(
    "http://localhost:8080/tools/add_repository",
    json={
        "repository_path_or_url": "https://github.com/user/repo.git",
        "repository_name": "my-repo"
    }
)
```

---

## Configuration Reference

### Core Configuration (`config.yaml`)

```yaml
# AI Provider Configuration
ai_provider:
  default_model: "gemini-2.5-pro"
  temperature: 0.2
  max_tokens: 1000000
  token_usage_percentage: 0.90
  conservative_prompt_tokens: 200000

# Cache Configuration
cache:
  default_ttl: "3600s"
  extended_ttl: "7200s"
  cache_directory: null # System default

# Report Generation Configuration
reports:
  timeout_seconds: 300
  max_retries: 3
  retry_delay_seconds: 5.0
  retry_backoff_multiplier: 2.0
  retry_on_timeout: true
  retry_on_error: true

# Analysis Workflow Configuration
analysis:
  output_directory: "workdir/analysis"
  cleanup_temp_files: true
  include_personas: true

# File Processing Configuration
file_processing:
  max_file_size_mb: 10
  use_gitignore: true
  binary_file_handling: "skip"

# Directory Configuration
directories:
  prompt_paths:
    - "prompts/personas"
    - "prompts/additional_reports"
    - "prompts/output-expectations.md"
  temp_directory: null

# Logging Configuration
logging:
  logfire_console: False
  log_level: "INFO"
  log_to_file: true
  log_file_path: logs/repo.log
  error_log_file_path: logs/error.log
  observability_log: logs/observability.log

# Repository Configuration
repo_target_dir: "workdir/repos"

# Confluence Configuration
confluence:
  url: "https://your-instance.atlassian.net"
  space_key: "YOUR_SPACE"
```

---

## Best Practices

### 1. Cache Management

- **Use smart selection** for large repositories (>1000 files)
- **Set appropriate TTLs**: Short (1h) for iterative work, longer (6-12h) for batch processing
- **Clean up expired caches** regularly to avoid quota issues
- **Include personas** when generating perspective-based reports

### 2. Report Generation

- **Generate reports in parallel** when possible (reports are independent)
- **Use retry logic** for production systems (transient failures are common)
- **Set reasonable timeouts** (5min default is usually sufficient)
- **Organize output** by project name and category

### 3. Performance Optimization

- **Smart selection** reduces tokens by 70-90% on average
- **Cache reuse** across multiple queries saves API calls
- **Persona inclusion** adds ~10-20K tokens but enables all perspectives
- **Batch operations** when analyzing multiple repositories

### 4. Security

- **Never cache sensitive data** (.env files, credentials, keys)
- **Use gitignore** to automatically exclude sensitive files
- **Validate inputs** when accepting repository URLs
- **Set file size limits** to prevent DoS

### 5. Error Handling

- **Implement retries** for transient AI API failures
- **Log all operations** for debugging and auditing
- **Graceful degradation** when smart selection fails (fall back to directory crawl)
- **Validate cache existence** before querying

---

## FAQ

### Q: How do I analyze a private repository?

**A**: Use SSH authentication or personal access tokens:

```python
add_repository(
    ctx,
    "git@github.com:org/private-repo.git",
    "private-repo"
)
```

### Q: Can I use multiple AI models simultaneously?

**A**: Yes, specify the model per cache or query:

```python
cache_directory(ctx, ".", model="gemini-2.5-pro")
query_cache(ctx, "question", cache_id, model="gemini-1.5-flash")
```

### Q: How do I reduce AI costs?

**A**: Use smart selection, cache reuse, and lower-cost models:

```python
cache_directory(
    ctx,
    ".",
    use_smart_selection=True,  # Reduce files cached
    model="gemini-1.5-flash"   # Lower-cost model
)
```

### Q: Can I analyze non-code files?

**A**: Yes, any text-based files work (markdown, YAML, JSON, etc.)

### Q: How do I create a custom migration agent?

**A**: Follow the extension guide, using existing migration agents as templates (see `prompts/additional_reports/`).

---

## Summary

This framework provides a comprehensive foundation for building POCs that leverage repository analysis, AI-powered insights, and multi-perspective reporting. Key takeaways:

1. **13+ MCP tools** provide programmatic access to all functionality
2. **40+ built-in analysis agents** cover dev, product, QE, and migration perspectives
3. **Extensible architecture** supports custom agents, tools, and workflows
4. **Production-ready patterns** for caching, error handling, and performance optimization
5. **Multiple integration options** (MCP, Python API, CLI, HTTP)

**Next Steps**:

1. Review the [Agent Catalog](#agent-catalog) to understand available capabilities
2. Choose a [POC Template](#poc-templates) that matches your use case
3. Follow the [Extension Guide](#extension-guide) to create custom agents
4. Refer to [Architecture Patterns](#architecture-patterns) for implementation guidance

For questions or contributions, see the main [README.md](README.md) and [documentation](docs/).
