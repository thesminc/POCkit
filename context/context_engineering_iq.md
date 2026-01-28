# Engineering IQ: POC Agent Catalog & Framework Guide

## 🎯 Purpose

This document serves as a comprehensive reference for dynamically creating Proof of Concept (POC) applications that leverage the Engineering IQ agent framework. Use this catalog to:

1. **Understand available agents** - Know what capabilities exist before creating new ones
2. **Select appropriate agents** - Match POC requirements to existing agent capabilities
3. **Create new agents efficiently** - Use the framework to build custom agents when needed
4. **Architect POC solutions** - Design multi-agent workflows for complex POCs

## 📖 Document Structure

- [Quick Reference](#quick-reference) - Fast lookup for POC planning
- [Agent Categories](#agent-categories) - How agents are organized
- [Available Agents](#available-agents) - Detailed agent catalog
- [Framework Components](#framework-components) - Tools, configurations, and architecture
- [Creating Custom Agents](#creating-custom-agents) - How to extend the framework
- [POC Development Patterns](#poc-development-patterns) - Common patterns and workflows
- [Integration Guide](#integration-guide) - External system integration

---

## 🔍 Quick Reference

### When Building a POC, Ask:

**Question 1: What type of analysis do I need?**
- **Business/Product Requirements** → Product Analysis Planner + Analyzer
- **Technical Architecture** → Dev Analysis Planner + Analyzer
- **Testing Strategy** → QE Analysis Planner + Analyzer
- **Security/Compliance** → DevSecOps Analysis Planner + Analyzer
- **Feature Impact** → Feature Analysis Planner + Analyzer

**Question 2: What supporting capabilities do I need?**
- **File Operations** → File Helper Agent
- **Git Operations** → Git Helper Agent
- **Code Understanding** → Dev/QE/Product/DevSecOps Analyst Agents
- **Diagrams** → Diagramer Agent
- **Web Search** → Simple Search Agent
- **Task Management** → Jira Helper + Task Loader Agents
- **Requirement Clarification** → Idea Iterator Agent

**Question 3: Do I need custom logic?**
- **Simple POC Agent** → Use Generic Agent with custom settings
- **Complex POC Agent** → Extend BaseAnalystAgent or create custom class

### Agent Selection Matrix

| POC Type | Primary Agents | Supporting Agents | Custom Agent Needed? |
|----------|---------------|-------------------|---------------------|
| **Codebase Documentation** | Dev Analyzer, Product Analyzer | File Helper, Diagramer | No |
| **Technical Due Diligence** | Dev Analyzer, DevSecOps Analyzer | File Helper, Git Helper | No |
| **Test Strategy Creation** | QE Analyzer | Dev Analyst, File Helper | No |
| **Feature Planning** | Feature Analyzer, Idea Iterator | Dev Analyst, QE Analyst | No |
| **Security Audit** | DevSecOps Analyzer | File Helper, DevSecOps Analyst | No |
| **Custom Domain Analysis** | Generic Agent | File Helper, Search | Maybe |
| **Multi-Source Data Aggregation** | Generic Agent | File Helper, Excel Tools | Yes (likely) |
| **Interactive Requirements** | Idea Iterator, Product Analyzer | Product Analyst | No |

---

## 🏗️ Agent Categories

The Engineering IQ framework organizes agents into four primary categories:

### 1. 📋 Analysis Planners
**Purpose:** Create structured task plans for comprehensive analysis

**Agents:**
- Product Analysis Planner
- Dev Analysis Planner
- QE Analysis Planner
- Feature Analysis Planner
- DevSecOps Analysis Planner

**When to Use in POC:** When you need systematic, multi-step analysis with trackable progress

### 2. 📊 Report Generators (Analyzers)
**Purpose:** Execute analysis plans and generate comprehensive reports

**Agents:**
- Product Analyzer
- Dev Analyzer
- QE Analyzer
- Feature Analyzer
- DevSecOps Analyzer

**When to Use in POC:** When you need detailed documentation and insights from codebases

### 3. 💬 Interactive Agents
**Purpose:** Iterative refinement through structured conversations

**Agents:**
- Idea Iterator

**When to Use in POC:** When requirements are vague or need stakeholder clarification

### 4. 🛠️ Utility Agents
**Purpose:** Specialized support functions for other agents

**Agents:**
- File Helper, Git Helper, Jira Helper
- Simple Search, Task Adherence, Final Reviewer
- Diagramer, Planner, Team Lead, Task Loader
- Dev Analyst, QE Analyst, DevSecOps Analyst, Product Analyst
- Generic Agent (for custom agent creation)

**When to Use in POC:** As building blocks for custom workflows

---

## 📚 Available Agents

### Analysis Planner Agents

#### 1. Product Analysis Planner
**Agent ID:** `product_analysis_planner`

**Purpose:** Creates task plans for business and functional requirements analysis

**Key Capabilities:**
- User persona and journey identification
- Feature catalog creation
- Business rule extraction
- Data model documentation
- Integration point identification

**Input Requirements:**
- Repository path (local or to be cloned)
- Optional: `IMPORTANT_ANALYSIS_NOTES.txt` for custom guidance

**Output:**
- `<REPO_PATH>/agent_reports/product/ANALYSIS_TASKS.md`

**POC Use Cases:**
- Understanding business logic in legacy systems
- Documenting feature sets for migration
- Business requirements for new systems
- Product roadmap planning

**Configuration Example:**
```yaml
product_analysis_planner_agent:
  model: gemini-2.0-flash-exp
  additional_report_sections:
    - |
      ### Domain-Specific Business Rules
      - **Task:** Extract industry-specific business rules
      - **Output:** Categorized business rule documentation
```

---

#### 2. Dev Analysis Planner
**Agent ID:** `dev_analysis_planner`

**Purpose:** Creates task plans for technical architecture and implementation analysis

**Key Capabilities:**
- Technology stack identification
- Architecture pattern analysis
- Code quality assessment planning
- Performance analysis strategy
- Security implementation review planning

**Input Requirements:**
- Repository path
- Optional: `IMPORTANT_ANALYSIS_NOTES.txt`

**Output:**
- `<REPO_PATH>/agent_reports/dev/ANALYSIS_TASKS.md`

**POC Use Cases:**
- Technical due diligence
- Migration planning
- Architecture modernization
- Code quality baseline establishment
- Technical debt assessment

**Configuration Example:**
```yaml
dev_analysis_planner_agent:
  model: gemini-2.5-pro
  additional_report_sections:
    - |
      ### Cloud Migration Assessment
      - **Task:** Analyze cloud-readiness
      - **Output:** Migration complexity and recommendations
```

---

#### 3. QE Analysis Planner
**Agent ID:** `qe_analysis_planner`

**Purpose:** Creates task plans for testing strategy and quality engineering

**Key Capabilities:**
- Test coverage analysis planning
- Testing framework identification
- Quality engineering approach documentation
- Risk assessment planning
- Automation opportunity identification

**Input Requirements:**
- Repository path
- Optional: `IMPORTANT_ANALYSIS_NOTES.txt`

**Output:**
- `<REPO_PATH>/agent_reports/test/TEST_STRATEGY_TASKS.md`

**POC Use Cases:**
- Test strategy development
- QA process improvement
- Test automation planning
- Quality gate definition
- Risk-based testing planning

**Configuration Example:**
```yaml
qe_analysis_planner_agent:
  model: gemini-2.0-flash-exp
  additional_report_sections:
    - |
      ### Performance Testing Strategy
      - **Task:** Define performance testing approach
      - **Output:** Performance test plan and metrics
```

---

#### 4. Feature Analysis Planner
**Agent ID:** `feature_analysis_planner`

**Purpose:** Creates task plans for comprehensive feature impact analysis

**Key Capabilities:**
- Requirement analysis and clarification
- Impact assessment on existing code
- Design recommendation planning
- Complexity estimation strategy
- Alternative approach evaluation

**Input Requirements:**
- Repository path
- Feature requirements description
- Optional: Repository URL

**Output:**
- `<REPO_PATH>/agent_reports/feature/FEATURE_ANALYSIS_TASKS.md`

**POC Use Cases:**
- Major feature planning
- Impact analysis for enhancements
- Technical feasibility studies
- Effort estimation
- Implementation approach comparison

**Configuration Example:**
```yaml
feature_analysis_planner_agent:
  model: gemini-2.0-flash-exp
  additional_report_sections:
    - |
      ### Scalability Impact
      - **Task:** Assess feature's impact on scalability
      - **Output:** Scalability analysis and recommendations
```

---

#### 5. DevSecOps Analysis Planner
**Agent ID:** `devsecops_analysis_planner`

**Purpose:** Creates task plans for security, compliance, and DevOps analysis

**Key Capabilities:**
- Security architecture assessment planning
- Compliance requirement identification
- DevOps pipeline analysis planning
- Infrastructure as code review planning
- Vulnerability scanning strategy
- Deployment security assessment

**Input Requirements:**
- Repository path
- Optional: `IMPORTANT_ANALYSIS_NOTES.txt`

**Output:**
- `<REPO_PATH>/agent_reports/devsecops/ANALYSIS_TASKS.md`

**POC Use Cases:**
- Security audits
- Compliance assessments (GDPR, HIPAA, SOX, etc.)
- DevOps maturity evaluation
- Infrastructure security review
- CI/CD security hardening

**Configuration Example:**
```yaml
devsecops_analysis_planner_agent:
  model: gemini-2.0-flash-exp
  additional_report_sections:
    - |
      ### Compliance Gap Analysis
      - **Task:** Assess HIPAA compliance gaps
      - **Output:** Detailed compliance report with remediation
```

---

### Report Generator (Analyzer) Agents

#### 6. Product Analyzer
**Agent ID:** `product_analyzer`

**Purpose:** Executes business/functional analysis plans and generates reports

**Key Capabilities:**
- Task plan execution
- Utility agent coordination (File Helper, Product Analyst)
- Business requirements documentation generation
- Feature catalog creation
- User journey documentation

**Dependencies:**
- Task file from Product Analysis Planner
- File Helper Agent
- Product Analyst Agent
- Task Adherence Agent

**Output:**
- `<REPO_PATH>/agent_reports/product/APPLICATION_REPORT.md`
- Individual task result files

**POC Use Cases:**
- Complete business documentation
- Product requirements documentation
- Business logic extraction
- Feature inventory creation

---

#### 7. Dev Analyzer
**Agent ID:** `dev_analyzer`

**Purpose:** Executes technical analysis plans and generates comprehensive technical documentation

**Key Capabilities:**
- Technical task execution
- Architecture diagram generation
- Code quality assessment
- Technology stack documentation
- Performance analysis

**Dependencies:**
- Task file from Dev Analysis Planner
- File Helper Agent
- Dev Analyst Agent
- Diagramer Agent
- LSP Tools (for code intelligence)

**Output:**
- `<REPO_PATH>/agent_reports/dev/APPLICATION_REPORT.md`
- Architecture diagrams
- Technical supplementary documentation

**POC Use Cases:**
- Technical documentation generation
- Architecture assessment
- Code quality reports
- Technology inventory
- Migration readiness assessment

---

#### 8. QE Analyzer
**Agent ID:** `qe_analyzer`

**Purpose:** Executes test strategy analysis and generates QE reports

**Key Capabilities:**
- Test coverage analysis execution
- Test strategy development
- Risk assessment
- Test automation recommendations
- Quality gate definition

**Dependencies:**
- Task file from QE Analysis Planner
- File Helper Agent
- QE Analyst Agent
- Dev Analyst Agent
- Planner Agent

**Output:**
- `<REPO_PATH>/agent_reports/test/TEST_STRATEGY_REPORT.md`
- Test matrices
- Strategy documents

**POC Use Cases:**
- Complete test strategy creation
- QA process documentation
- Test automation roadmap
- Quality metrics definition

---

#### 9. Feature Analyzer
**Agent ID:** `feature_analyzer`

**Purpose:** Executes comprehensive feature impact analysis with both dev and QE perspectives

**Key Capabilities:**
- Sequential orchestration of Dev and QE Analysts
- Multi-perspective impact analysis
- Design alternatives evaluation
- Complexity assessment
- Future scalability consideration

**Dependencies:**
- Task file from Feature Analysis Planner
- Dev Analyst Agent
- QE Analyst Agent
- Team Lead Agent
- Task Adherence Agent
- Final Reviewer Agent

**Output:**
- `<REPO_PATH>/agent_reports/feature/FEATURE_ANALYSIS_REPORT.md`
- Impact assessments
- Design documents
- Complexity evaluations

**POC Use Cases:**
- New feature planning
- Enhancement impact analysis
- Technical feasibility validation
- Implementation approach comparison
- Long-term maintenance planning

---

#### 10. DevSecOps Analyzer
**Agent ID:** `devsecops_analyzer`

**Purpose:** Executes security, compliance, and DevOps analysis plans

**Key Capabilities:**
- Security vulnerability assessment
- Compliance gap analysis
- DevOps pipeline evaluation
- Infrastructure as code security review
- Security monitoring assessment

**Dependencies:**
- Task file from DevSecOps Analysis Planner
- File Helper Agent
- DevSecOps Analyst Agent
- Dev Analyst Agent
- Task Adherence Agent
- Final Reviewer Agent

**Output:**
- `<REPO_PATH>/agent_reports/devsecops/README.md`
- Individual task reports: `TASK_<num>_<name>.md`
- Security assessments
- Compliance documentation

**POC Use Cases:**
- Security audits
- Compliance validation
- DevOps security assessment
- Infrastructure security review
- Regulatory compliance reporting

---

### Interactive Agents

#### 11. Idea Iterator Agent
**Agent ID:** `idea_iterator`

**Purpose:** Iteratively clarifies requirements through structured conversation

**Unique Architecture:**
- First agent designed for iterative interaction
- Returns structured markdown documents
- Maintains conversation context via memory/session services
- Does NOT handle human interaction directly (implementing class handles this)

**Key Capabilities:**
- Requirement analysis in repository context
- Generates specific, actionable clarifying questions
- Identifies business outcomes with confidence levels
- Drafts acceptance criteria (SMART/INVEST principles)
- Tracks iteration progress until ready for implementation

**Output Format:**
Structured markdown with:
- Executive summary
- Prioritized clarifying questions (Priority 1, 2, 3)
- Identified business outcomes (with confidence levels)
- Draft acceptance criteria with status indicators
- Repository context analysis
- Analysis status and next steps

**Integration Pattern:**
```python
# Implementing class handles iteration loop
agent = IdeaIteratorAgent()
agent_instance = agent.get_agent()

# Process iterations until ready_for_implementation
# Present questions to users, collect responses
# Feed responses back for next iteration
```

**POC Use Cases:**
- Clarifying vague POC requirements
- Defining business outcomes from high-level ideas
- Creating acceptance criteria before development
- Bridging stakeholder communication gaps
- Requirement refinement workshops

**Key Differentiators:**
- Stateless iterations (each call produces complete analysis)
- Context retention via memory service
- Structured, well-formatted output
- Designed for implementing class to manage UI

---

### Utility Agents

#### 12. Generic Agent
**Usage:** `from engineering_iq.shared.agents.base import GenericAgent`

**Purpose:** Create simple agents on-the-fly using configuration objects

**Key Features:**
- Takes AgentSettings object for configuration
- Accepts list of tools
- Supports all standard agent features (tools, memory, sessions)
- Perfect for dynamic sub-agent creation

**Usage Example:**
```python
from engineering_iq.shared.agents.base import GenericAgent
from engineering_iq.shared.agents.agent_settings import AgentSettings
from engineering_iq.shared.tools.file_tool import read_file, write_file

# Create settings
settings = AgentSettings(
    name="custom_poc_agent",
    description="Custom POC-specific agent",
    instruction="You are a specialized agent for analyzing X...",
    model="gemini-2.0-flash-exp"
)

# Create agent with tools
generic_agent = GenericAgent(
    agent_settings=settings,
    tools=[read_file, write_file]
)
agent_instance = generic_agent.get_agent()
```

**POC Use Cases:**
- Quick POC agent prototyping
- Dynamic sub-agent creation within orchestrators
- Simplifying agent creation when custom logic isn't needed
- Testing agent concepts rapidly

---

#### 13. Base Analyst Agent
**Location:** `engineering_iq/shared/agents/base/base_analyst_agent.py`

**Purpose:** Foundational class for analyst agents

**Features:**
- Pre-configured with common analysis tools (file tools, LSP tools)
- Standardized structure for analyst agent development
- Common input/output patterns for analysis tasks

**POC Use Cases:**
- Extend this for custom domain-specific analyst agents
- Base class for specialized analysis capabilities

---

#### 14. File Helper Agent
**Agent ID:** `file_helper`

**Purpose:** Memory-safe file and directory operations

**Key Capabilities:**
- Smart file reading with automatic truncation (8000 token default)
- Directory listing with result limits
- Safe file writing with overwrite protection
- Efficient text search across multiple files
- File validation and property checking (existence, size, permissions)
- Batch validation for multiple files

**Memory Management Features:**
- Automatic token counting
- Truncation warnings
- Result limits to prevent memory overload
- Built-in usage guidance

**POC Use Cases:**
- File operations in any POC requiring file I/O
- Batch file validation before processing
- Safe file writing with backups
- Memory-efficient file content reading

---

#### 15. Git Helper Agent
**Agent ID:** `git_helper`

**Purpose:** Git repository operations

**Primary Functions:**
- Clone repositories from various sources
- Return local repository paths
- Git status, commit history, branch information

**POC Use Cases:**
- Repository cloning for analysis
- Git metadata extraction
- Version control integration
- Code history analysis

---

#### 16. Jira Helper Agent
**Agent ID:** `jira_helper`

**Purpose:** Jira integration and project management

**Key Capabilities:**
- Create and manage Jira issues
- Link related work items
- Set Epic Parent fields
- Apply SMART/INVEST principles to work items
- Project validation and selection
- Markdown support for descriptions/comments

**POC Use Cases:**
- Automated task creation from analysis
- Work item management
- Epic and story creation
- Project planning automation

---

#### 17. Code Understanding Agents
**Agent IDs:** `dev_analyst`, `qe_analyst`, `devsecops_analyst`, `product_analyst`

**Purpose:** Provide code analysis and understanding capabilities

**Common Features:**
- Find symbols and definitions
- Search files with regex patterns
- Analyze code structure
- Code navigation
- Build upon BaseAnalystAgent

**Specific Capabilities:**
- **Dev Analyst:** Technical code analysis, architecture understanding
- **QE Analyst:** Test analysis, quality assessment
- **DevSecOps Analyst:** Security vulnerability assessment, compliance analysis
- **Product Analyst:** Business logic extraction, functional analysis, user journeys

**POC Use Cases:**
- Deep code understanding in analysis workflows
- Symbol and reference finding
- Code structure analysis
- Domain-specific code interpretation

---

#### 18. Simple Search Agent
**Agent ID:** `simple_search`

**Purpose:** Web search capabilities

**POC Use Cases:**
- Research best practices during analysis
- Find documentation and references
- Answer technical questions
- Gather external information

---

#### 19. Task Adherence Agent
**Agent ID:** `task_adherence`

**Purpose:** Keeps agents focused on assigned tasks

**Function:**
- Monitors agent responses
- Ensures task completion
- Prevents scope creep
- Maintains workflow efficiency

**POC Use Cases:**
- Quality control in multi-agent workflows
- Ensuring agents complete assigned tasks
- Preventing off-topic responses

---

#### 20. Final Reviewer Agent
**Agent ID:** `final_reviewer`

**Purpose:** Quality assurance for agent outputs

**Responsibilities:**
- Review generated content
- Check completeness
- Verify accuracy
- Suggest improvements

**POC Use Cases:**
- Quality assurance layer for POC outputs
- Validation of analysis reports
- Content improvement suggestions

---

#### 21. Diagramer Agent
**Agent ID:** `diagramer`

**Purpose:** Create visual diagrams

**Capabilities:**
- Generate mermaid diagrams
- Create architecture visualizations
- Build network graphs
- Illustrate data flows

**POC Use Cases:**
- Visual documentation generation
- Architecture diagram creation
- Process flow visualization
- System interaction diagrams

---

#### 22. Planner Agent
**Agent ID:** `planner`

**Purpose:** Create structured work plans

**Function:**
- Takes requirements as input
- Generates actionable task lists
- Provides clear deliverables
- Estimates effort when possible

**POC Use Cases:**
- Work breakdown structure creation
- Task list generation
- Project planning support

---

#### 23. Team Lead Agent
**Agent ID:** `team_lead`

**Purpose:** Coordinate multi-agent workflows

**Responsibilities:**
- Task distribution
- Workflow orchestration
- Progress monitoring
- Result aggregation

**POC Use Cases:**
- Multi-agent orchestration
- Complex workflow coordination
- Parallel task execution management

---

#### 24. Task Loader Agent
**Agent ID:** `task_loader`

**Purpose:** Load analysis tasks from files into Jira

**Architecture:**
- Loop agent pattern for iterative processing
- Coordinates sub-agents (potentially GenericAgent instances)
- Orchestrator manages overall process
- Jira integration via MCP server or direct API tools

**Workflow:**
1. Orchestrator manages task loading
2. Task loader reads and parses tasks file
3. Jira integration creates tasks with proper fields
4. Loop continues until all tasks processed

**POC Use Cases:**
- Automated Jira task creation from analysis outputs
- Backlog population from analysis reports
- Work item bulk creation

**Requirements:**
- Valid tasks file path
- Jira configuration in config.yaml
- MCP server setup for Jira integration

---

## 🧰 Framework Components

### Tools Available to Agents

#### File Tools
Located in `engineering_iq/shared/tools/file_tool/`

**Core Functions:**
- `smart_file_read_tool` - Memory-safe file reading (8000 token default)
- `smart_file_list_tool` - Directory listing with limits
- `smart_file_write_tool` - Safe file writing with backup
- `smart_file_search_tool` - Pattern search across files
- `regex_replace_tool` - Regex find and replace
- `file_validation_tool` - Validate file existence and properties
- `multiple_file_validation_tool` - Batch file validation

**Key Features:**
- Automatic token management
- Truncation with clear indicators
- Memory safety
- Pattern matching support (*.py, *.{ts,tsx})

---

#### LSP (Language Server Protocol) Tools
Located in `engineering_iq/shared/tools/lsp_tool/`

**Purpose:** IDE-like code intelligence

**Core Capabilities:**
- Symbol resolution (definitions, references, implementations)
- Code navigation (go-to-definition, find-references)
- Semantic analysis (type info, documentation)
- Multi-language support

**Key Functions:**
- `find_symbols()` - Locate symbols in code
- `get_definition()` - Get symbol definitions
- `find_references()` - Find all references
- `get_hover_info()` - Documentation and type info
- `workspace_symbols()` - Search across workspace

**Why Important for POCs:**
- Accurate impact analysis across files
- Understanding complex inheritance
- Detection of subtle dependencies
- Comprehensive refactoring recommendations

---

#### Structured Data Tools
Located in `engineering_iq/shared/tools/structured_data_tool/`

**JSON Tools** (`json_tool/`):
- `read_json()` - Parse JSON files
- `validate_json()` - Check syntax/structure
- `get_json_stats()` - Generate statistics
- `get_json_structure()` - Schema analysis
- `query_json_path()` - JSONPath querying
- `filter_json()` - Filter by key-value
- `extract_values_by_key()` - Extract values
- `compare_json_files()` - Deep comparison

**Excel Tools** (`excel_tool/`):
- `read_excel()` - Read Excel files (single/multiple sheets)
- `list_sheets()` - Get sheet names
- `get_excel_summary()` - File overview
- `get_excel_stats()` - File statistics
- `query_excel()` - Pandas query syntax
- `filter_excel()` - Column-value filtering
- `analyze_column_data()` - Statistical analysis
- `search_excel_content()` - Full-text search
- `find_duplicates()` - Duplicate detection
- `compare_excel_sheets()` - Sheet comparison

**XML Tools** (`xml_tool/`):
- `read_xml()` - Parse XML with namespace support
- `query_xml_xpath()` - XPath querying
- `get_xml_structure()` - Schema analysis
- `validate_xml()` - Well-formedness validation
- `find_elements_by_tag()` - Tag-based search
- `filter_xml_by_attribute()` - Attribute filtering

---

#### Git Tools
Located in `engineering_iq/shared/tools/git_tool/`

**Functions:**
- `get_git_status()` - Repository status
- `get_commit_history()` - Commit logs with filtering
- `analyze_file_changes()` - Detailed diff analysis
- `get_branch_info()` - Branch structure

---

#### Document Tools
Located in `engineering_iq/shared/tools/document_tool/`

**Potential Capabilities** (verify in source):
- `read_document_text()` - Extract text from documents
- `get_document_metadata()` - Retrieve metadata
- `search_in_document()` - Find patterns
- `convert_document_format()` - Format conversion

---

#### Exit Loop Tool
Located in `engineering_iq/shared/tools/exit_loop.py`

**Function:**
- `exit_loop()` - Signal completion and exit from agent loops

**POC Use Cases:**
- Control flow in loop agents
- Termination conditions for iterative processes

---

### Configuration System

#### Configuration Hierarchy (Highest to Lowest Priority)
1. **Environment Variables** - Override any setting
2. **Local config.yaml** - Project-specific overrides
3. **Agent Config Files** - Default agent configurations
4. **Base Settings** - Built-in defaults

#### Key Configuration Locations
```
engineering_iq/
├── static/config/          # Default configurations
│   ├── app.yaml           # Global app settings
│   ├── logger.yaml        # Logging configuration
│   ├── jira.yaml          # Jira agent defaults
│   ├── product_analysis_planner.yaml
│   ├── dev_analysis_planner.yaml
│   └── ...                # Other agent configs
└── config.yaml            # Your local overrides (working directory)
```

#### Essential Configuration Options

**Global App Settings (`app.yaml`):**
```yaml
app:
  git_dir: workdir/repos                    # Git operations directory
  default_model: gemini-2.0-flash-exp       # Default LLM model
  default_max_tokens: 200000                # Context window size
  trace_lsp_communication: false            # LSP debugging (performance impact)
```

**Using Different Models:**
```yaml
app:
  # Google model (no prefix)
  default_model: gemini-2.5-pro

  # Anthropic Claude
  default_model: LiteLlm:anthropic/claude-3-5-sonnet-20241022

  # OpenAI GPT
  default_model: LiteLlm:gpt-4-turbo-preview

  # Azure OpenAI
  default_model: LiteLlm:azure/my-deployment
```

**Agent-Specific Configuration:**
```yaml
# Override model for specific agents
my_custom_poc_agent:
  model: gemini-2.0-flash-exp
  description: "Custom POC agent for domain X"
  instruction: "Custom instructions..."
  additional_report_sections:
    - |
      ### Custom Analysis Section
      - **Task:** Specific analysis task
      - **Output:** Expected output format
```

**IMPORTANT_ANALYSIS_NOTES.txt:**
All analysis planners automatically detect and use `IMPORTANT_ANALYSIS_NOTES.txt` in repository root for custom guidance without modifying agent prompts.

**Example:**
```text
IMPORTANT ANALYSIS NOTES

## Focus Areas
- Pay special attention to microservices patterns
- Legacy system migration - identify modernization opportunities
- GDPR and SOX compliance critical

## Constraints
- Maintain backward compatibility with v1.2 API
- Performance cannot degrade >5% during migration

## Business Context
- Peak: 10,000 concurrent users during market hours
- 99.9% uptime SLA
```

#### Environment Variables

**Global Settings:**
```bash
export APP_GIT_DIR="/custom/repos"
export APP_DEFAULT_MODEL="LiteLlm:anthropic/claude-3-5-sonnet-20241022"
export APP_DEFAULT_MAX_TOKENS="100000"
export APP_TRACE_LSP_COMMUNICATION="false"
```

**Agent-Specific:**
```bash
export DEV_ANALYZER_AGENT_MODEL="LiteLlm:gpt-4-turbo-preview"
export PRODUCT_ANALYZER_AGENT_MODEL="gemini-2.5-pro"
```

**Model Provider Credentials:**
```bash
# Anthropic
export ANTHROPIC_API_KEY="your-key"

# OpenAI
export OPENAI_API_KEY="your-key"

# Azure
export AZURE_API_KEY="your-key"
export AZURE_API_BASE="https://your-resource.openai.azure.com/"
export AZURE_API_VERSION="2024-02-15-preview"

# AWS Bedrock
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION_NAME="us-east-1"
```

---

## 🔧 Creating Custom Agents

### Option 1: Using Generic Agent (Simplest)

**When to Use:**
- Simple POC agents without complex logic
- Quick prototyping
- Dynamic sub-agent creation
- Testing concepts

**Example:**
```python
from engineering_iq.shared.agents.base import GenericAgent
from engineering_iq.shared.agents.agent_settings import AgentSettings
from engineering_iq.shared.tools.file_tool import smart_file_tools

settings = AgentSettings(
    name="poc_domain_analyzer",
    description="Analyzes codebases for domain-specific patterns",
    instruction="""
    You are a specialized agent for analyzing healthcare domain code.
    Focus on:
    - HIPAA compliance patterns
    - PHI data handling
    - Audit trail implementation
    - Security controls
    """,
    model="gemini-2.0-flash-exp"
)

agent = GenericAgent(
    agent_settings=settings,
    tools=smart_file_tools
)
agent_instance = agent.get_agent()
```

---

### Option 2: Extending Base Analyst Agent

**When to Use:**
- Need standard analyst capabilities
- Want pre-configured tools (file tools, LSP tools)
- Building specialized analyst agent

**Example:**
```python
from engineering_iq.shared.agents.base.base_analyst_agent import BaseAnalystAgent
from engineering_iq.shared.agents.agent_settings import AgentSettings

class CustomDomainAnalyst(BaseAnalystAgent):
    def __init__(self):
        settings = AgentSettings(
            name="custom_domain_analyst",
            description="Custom domain analysis agent",
            instruction="Custom instructions...",
            model="gemini-2.0-flash-exp"
        )
        super().__init__(agent_settings=settings)

    def _init_tools(self):
        # BaseAnalystAgent already provides file and LSP tools
        super()._init_tools()
        # Add custom tools if needed
        self.add_tools([custom_tool_1, custom_tool_2])
```

---

### Option 3: Creating Custom Agent Class

**When to Use:**
- Complex custom logic required
- Need specialized initialization
- Custom tool management
- Unique workflow patterns

**Example:**
```python
from engineering_iq.shared.agents.engineeringiq_agent import EngineeringIQAgent
from engineering_iq.shared.agents.agent_settings import AgentSettings
from engineering_iq.shared.tools.file_tool import smart_file_tools
from engineering_iq.shared.tools.lsp_tool import all_lsp_tools

class CustomPOCAgent(EngineeringIQAgent):
    def __init__(self):
        settings = AgentSettings(
            name="custom_poc_agent",
            short_name="cpa",
            model="gemini-2.0-flash-exp",
            description="Custom POC agent with specialized capabilities",
            instruction="""
            You are a specialized agent for [specific domain].
            Your responsibilities include:
            1. [Task 1]
            2. [Task 2]
            3. [Task 3]

            Focus on: [specific areas]
            Output format: [expected format]
            """
        )
        super().__init__(agent_settings=settings)

    def _init_tools(self):
        """Initialize agent-specific tools"""
        self.add_tools(smart_file_tools)
        self.add_tools(all_lsp_tools)
        # Add custom tools
        self.add_tools([custom_domain_tool])

    def custom_method(self):
        """Custom agent logic"""
        pass
```

---

### Custom Agent Configuration

**In config.yaml:**
```yaml
custom_poc_agent:
  model: gemini-2.0-flash-exp
  description: "Custom POC agent"
  instruction: |
    Override instructions here...
  additional_report_sections:
    - |
      ### Custom Analysis Section
      - **Task:** Custom task description
      - **Output:** Expected output
  prompt_variables:
    domain: "healthcare"
    compliance: "HIPAA"
```

---

## 📐 POC Development Patterns

### Pattern 1: Simple Single-Agent POC

**Use Case:** Quick analysis or report generation

```python
from engineering_iq.shared.agents.dev_analyzer.agent import DevAnalyzerAgent

# Initialize agent
analyzer = DevAnalyzerAgent()
agent_instance = analyzer.get_agent()

# Run analysis
response = agent_instance.run(
    "Analyze the codebase at /path/to/repo"
)
```

---

### Pattern 2: Planner → Analyzer Workflow

**Use Case:** Comprehensive, structured analysis

```python
# Step 1: Create analysis plan
planner = DevAnalysisPlannerAgent()
planner_instance = planner.get_agent()

planner_response = planner_instance.run(
    "Create an analysis plan for /path/to/repo"
)

# Step 2: Execute analysis plan
analyzer = DevAnalyzerAgent()
analyzer_instance = analyzer.get_agent()

analyzer_response = analyzer_instance.run(
    "Execute analysis using tasks in /path/to/repo/agent_reports/dev/ANALYSIS_TASKS.md"
)
```

---

### Pattern 3: Interactive Requirements Refinement

**Use Case:** Unclear or vague requirements

```python
from engineering_iq.shared.agents.idea_iterator.agent import IdeaIteratorAgent

iterator = IdeaIteratorAgent()
agent_instance = iterator.get_agent()

iteration = 1
ready = False

while not ready:
    response = agent_instance.run(
        f"Iteration {iteration}: [user responses to previous questions]"
    )

    # Parse response for questions and ready_for_implementation status
    questions = extract_questions(response)
    ready = check_if_ready(response)

    if not ready:
        user_responses = present_questions_to_user(questions)
        iteration += 1

# Proceed to planning/analysis once requirements are clear
```

---

### Pattern 4: Multi-Agent Orchestration

**Use Case:** Complex POC requiring multiple perspectives

```python
from engineering_iq.shared.agents.team_lead.agent import TeamLeadAgent
from engineering_iq.shared.agents.base import GenericAgent

# Orchestrator
team_lead = TeamLeadAgent()
orchestrator = team_lead.get_agent()

# Create sub-agents
agent_1_settings = AgentSettings(...)
agent_1 = GenericAgent(agent_settings=agent_1_settings, tools=[...])

agent_2_settings = AgentSettings(...)
agent_2 = GenericAgent(agent_settings=agent_2_settings, tools=[...])

# Coordinate workflow
response = orchestrator.run(
    "Coordinate analysis using agent_1 for X and agent_2 for Y"
)
```

---

### Pattern 5: Loop Agent Pattern

**Use Case:** Iterative processing until completion

```python
from engineering_iq.shared.tools.exit_loop import exit_loop

class CustomLoopAgent(EngineeringIQAgent):
    def __init__(self):
        # ... initialization ...
        # Add exit_loop tool
        self.add_tools([exit_loop])

    def run_loop(self, initial_input):
        agent_instance = self.get_agent()

        result = agent_instance.run(
            f"""
            Process items iteratively.
            Use exit_loop() tool when all items are processed.

            Initial input: {initial_input}
            """
        )
        return result
```

---

### Pattern 6: Custom Analysis Pipeline

**Use Case:** Domain-specific POC with custom workflow

```python
# Define custom pipeline
def custom_poc_pipeline(repo_path):
    # Step 1: Clone repository
    git_helper = GitHelperAgent()
    local_path = git_helper.run(f"Clone {repo_path}")

    # Step 2: Custom analysis
    custom_agent = CustomPOCAgent()
    analysis = custom_agent.run(f"Analyze {local_path}")

    # Step 3: Generate report
    final_reviewer = FinalReviewerAgent()
    reviewed = final_reviewer.run(f"Review: {analysis}")

    # Step 4: Load to Jira (optional)
    if load_to_jira:
        task_loader = TaskLoaderAgent()
        task_loader.run(f"Load tasks from {local_path}/analysis.md")

    return reviewed
```

---

### Pattern 7: Parallel Analysis

**Use Case:** Multiple independent analyses

```python
import concurrent.futures

def parallel_analysis_poc(repo_path):
    # Define analysis tasks
    tasks = [
        (DevAnalyzerAgent, "Technical analysis"),
        (ProductAnalyzerAgent, "Business analysis"),
        (DevSecOpsAnalyzerAgent, "Security analysis"),
    ]

    results = {}

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = {}
        for agent_class, task_type in tasks:
            agent = agent_class()
            future = executor.submit(
                agent.get_agent().run,
                f"{task_type} of {repo_path}"
            )
            futures[future] = task_type

        for future in concurrent.futures.as_completed(futures):
            task_type = futures[future]
            results[task_type] = future.result()

    return results
```

---

## 🔗 Integration Guide

### Jira Integration

**Configuration:**
```yaml
jira_agent:
  mcp_servers:
    - name: MyJiraServer
      sse_url: http://localhost:8082/sse
```

**Usage in POC:**
```python
from engineering_iq.shared.agents.jira_helper.agent import JiraHelperAgent
from engineering_iq.shared.agents.task_loader.agent import TaskLoaderAgent

# Create Jira issues manually
jira_helper = JiraHelperAgent()
jira_helper.run("Create task: [description]")

# Load tasks from analysis
task_loader = TaskLoaderAgent()
task_loader.run("Load tasks from /path/to/ANALYSIS_TASKS.md")
```

---

### Web Interface

**Start Web Interface:**
```bash
eiq web --port 8085
# or
engineering_iq web --port 8085
```

**Access:** `http://localhost:8085`

---

### MCP Server

**Start MCP Server:**
```bash
eiq server --port 8000
# or
eiq dev_server --port 8000
```

**Use Case:** External tool integration, extensibility

---

### API Integration

**Use agents programmatically:**
```python
from engineering_iq.shared.agents.dev_analyzer.agent import DevAnalyzerAgent

def api_endpoint_handler(repo_path):
    analyzer = DevAnalyzerAgent()
    agent = analyzer.get_agent()
    result = agent.run(f"Analyze {repo_path}")
    return {"status": "success", "result": result}
```

---

## 💡 POC Best Practices

### 1. Start with Existing Agents
- Always check available agents before building custom ones
- Use Generic Agent for quick prototyping
- Extend only when necessary

### 2. Leverage Configuration
- Use `config.yaml` for agent customization
- Use `IMPORTANT_ANALYSIS_NOTES.txt` for analysis guidance
- Use environment variables for secrets and environment-specific settings

### 3. Tool Selection
- File operations → File Helper
- Code understanding → LSP Tools + Dev/QE/Product Analyst
- Structured data → JSON/Excel/XML Tools
- Git operations → Git Helper
- Visual diagrams → Diagramer

### 4. Memory Management
- Use smart file tools (automatic token management)
- Set appropriate token limits
- Check for truncation in responses

### 5. Model Selection
- Simple tasks → `gemini-2.0-flash-exp` (fast, cost-effective)
- Complex analysis → `gemini-2.5-pro` or `claude-3-5-sonnet` (powerful)
- Balance cost, speed, and capability

### 6. Error Handling
- Validate inputs before processing
- Handle agent failures gracefully
- Use Final Reviewer for quality assurance

### 7. Workflow Design
- Sequential: Planner → Analyzer → Reviewer
- Parallel: Multiple independent analyses
- Iterative: Idea Iterator → Refinement → Analysis
- Loop: Continuous processing until exit condition

### 8. Testing and Validation
- Start with small codebases
- Validate outputs before scaling
- Use Task Adherence to ensure focused results

---

## 📊 POC Decision Tree

```
START: I need to create a POC using Engineering IQ
│
├─ Is it a standard codebase analysis?
│  ├─ YES → Use existing analyzer agents (Dev/Product/QE/DevSecOps)
│  └─ NO → Continue
│
├─ Do I need to clarify requirements first?
│  ├─ YES → Use Idea Iterator Agent → Then proceed
│  └─ NO → Continue
│
├─ Is there an existing agent that's close?
│  ├─ YES → Configure existing agent via config.yaml
│  └─ NO → Continue
│
├─ Is the logic simple or complex?
│  ├─ SIMPLE → Use Generic Agent with custom settings
│  └─ COMPLEX → Continue
│
├─ Do I need standard analyst capabilities (LSP, file tools)?
│  ├─ YES → Extend BaseAnalystAgent
│  └─ NO → Create custom EngineeringIQAgent subclass
│
END: Choose appropriate tools and workflow pattern
```

---

## 🚀 Quick Start for POC Development

### Scenario 1: "I need to analyze a codebase for [specific domain]"

```python
# 1. Use existing Dev Analyzer with custom configuration
# config.yaml
dev_analyzer_agent:
  model: gemini-2.0-flash-exp
  additional_report_sections:
    - |
      ### Domain-Specific Analysis
      - **Task:** Analyze for [domain] patterns
      - **Output:** Domain-specific findings

# 2. Add IMPORTANT_ANALYSIS_NOTES.txt to repo
# 3. Run Dev Analysis Planner + Analyzer
```

---

### Scenario 2: "I need a custom agent for [specific task]"

```python
# Quick prototype with Generic Agent
from engineering_iq.shared.agents.base import GenericAgent
from engineering_iq.shared.agents.agent_settings import AgentSettings

settings = AgentSettings(
    name="my_poc_agent",
    description="POC agent for X",
    instruction="Do X, Y, Z...",
    model="gemini-2.0-flash-exp"
)

agent = GenericAgent(agent_settings=settings, tools=[...])
```

---

### Scenario 3: "I need to orchestrate multiple agents"

```python
# Use Team Lead or create custom orchestrator
from engineering_iq.shared.agents.team_lead.agent import TeamLeadAgent
from engineering_iq.shared.agents.base import GenericAgent

# Define sub-agents
agent_1 = GenericAgent(...)
agent_2 = GenericAgent(...)

# Orchestrate
team_lead = TeamLeadAgent()
result = team_lead.run("Coordinate agent_1 and agent_2 to...")
```

---

### Scenario 4: "I have vague requirements"

```python
# Use Idea Iterator first
from engineering_iq.shared.agents.idea_iterator.agent import IdeaIteratorAgent

iterator = IdeaIteratorAgent()
# Iteratively refine requirements
# Then proceed with analysis agents once clear
```

---

## 🎓 Learning Path for POC Developers

### Step 1: Understand Available Agents
- Read through [Available Agents](#available-agents) section
- Review [Agent Categories](#agent-categories)
- Check [Quick Reference](#quick-reference) for mapping

### Step 2: Explore Framework Components
- Understand [Tools](#framework-components) available
- Learn [Configuration](#configuration-system) system
- Review [Environment Variables](#environment-variables)

### Step 3: Study POC Patterns
- Review [POC Development Patterns](#poc-development-patterns)
- Understand workflow patterns (sequential, parallel, iterative, loop)
- Study [Pattern Examples](#pattern-1-simple-single-agent-poc)

### Step 4: Create Your First POC
- Start with [Generic Agent](#option-1-using-generic-agent-simplest)
- Use existing agents with custom configuration
- Extend when necessary

### Step 5: Advanced POC Development
- Build [Custom Agent Classes](#option-3-creating-custom-agent-class)
- Implement [Multi-Agent Orchestration](#pattern-4-multi-agent-orchestration)
- Integrate [External Systems](#integration-guide)

---

## 📚 Additional Resources

### Documentation Files
- [AGENTS.md](AGENTS.md) - Detailed agent reference
- [WORKFLOWS.md](WORKFLOWS.md) - Analysis workflow diagrams
- [CONFIGURATION.md](CONFIGURATION.md) - Complete configuration guide
- [TOOLS.md](TOOLS.md) - Comprehensive tools reference
- [LSP_TOOLS.md](LSP_TOOLS.md) - LSP capabilities deep dive
- [BEST_PRACTICES.md](BEST_PRACTICES.md) - Best practices guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Troubleshooting guide

### Code Locations
- Agents: `engineering_iq/shared/agents/`
- Tools: `engineering_iq/shared/tools/`
- Configuration: `engineering_iq/static/config/`
- Base Classes: `engineering_iq/shared/agents/base/`

### CLI Commands
```bash
# Web interface
eiq web --port 8085
engineering_iq web --port 8085

# MCP server
eiq server --port 8000
eiq dev_server --port 8000

# Help
eiq --help
engineering_iq --help
```

---

## 🎯 Summary: POC Development Workflow

1. **Define POC Requirements**
   - Clarify what needs to be analyzed/built
   - Use Idea Iterator if requirements are vague

2. **Check Existing Agents**
   - Review [Quick Reference](#quick-reference)
   - Check [Agent Selection Matrix](#agent-selection-matrix)

3. **Choose Approach**
   - **Existing Agent + Config** → Fastest (90% of cases)
   - **Generic Agent** → Quick custom agent
   - **Extend BaseAnalystAgent** → Need analyst capabilities
   - **Custom Agent Class** → Complex custom logic

4. **Select Tools**
   - File operations → File Helper + file tools
   - Code understanding → LSP tools + Analyst agents
   - Data analysis → JSON/Excel/XML tools
   - Git operations → Git Helper

5. **Design Workflow**
   - Sequential (planner → analyzer → reviewer)
   - Parallel (multiple independent analyses)
   - Iterative (idea iterator → refinement)
   - Loop (continuous processing)

6. **Configure**
   - Set up `config.yaml`
   - Configure environment variables
   - Add `IMPORTANT_ANALYSIS_NOTES.txt` if needed

7. **Implement**
   - Build custom agents if needed
   - Set up orchestration
   - Implement workflow logic

8. **Test and Refine**
   - Start with small examples
   - Use Final Reviewer for QA
   - Iterate based on results

9. **Integrate**
   - Web interface for demos
   - API for automation
   - Jira for task management
   - MCP for extensibility

---

## 🏁 Conclusion

The Engineering IQ framework provides a comprehensive set of agents, tools, and patterns for building POCs that analyze and understand codebases. By understanding:

- **What agents are available** - Avoid reinventing the wheel
- **How to configure them** - Customize without coding
- **When to create custom agents** - Extend only when needed
- **Common patterns** - Use proven workflows

You can rapidly prototype POC applications that leverage the full power of AI-driven code analysis.

**Key Takeaway:** Start with existing agents, configure via YAML, and only build custom agents when absolutely necessary. The framework is designed for maximum flexibility with minimum code.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-07
**Maintained By:** Engineering IQ Team
