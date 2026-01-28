# CognitiveIQ: AI agents from stateless tools into learning experts

**Purpose**: This document provides a blueprint for creating Proof-of-Concept (POC) architectures using CognitiveIQ as the knowledge foundation. It maps POC categories to existing CognitiveIQ capabilities and provides patterns for building new agents when needed.

**Audience**: AI agents and human developers designing POC architectures for agent-based systems.

---

## Table of Contents

1. [Overview](#overview)
2. [POC Categories & CognitiveIQ Capabilities](#poc-categories--cognitiveiq-capabilities)
3. [CognitiveIQ Feature Matrix](#cognitiveiq-feature-matrix)
4. [Agent Architecture Patterns](#agent-architecture-patterns)
5. [MCP Integration & Multi-Agent Collaboration](#mcp-integration--multi-agent-collaboration)
6. [Building New Agents](#building-new-agents)
7. [Quick Reference](#quick-reference)

---

## Overview

### What is CognitiveIQ?

CognitiveIQ is a **local-first, lightweight knowledge infrastructure** for AI agents that provides:

- **36+ MCP tools** across 14 categories for code understanding, navigation, and memory
- **Unified search** with hybrid vector + full-text search (LanceDB)
- **Knowledge graph** navigation with GPS-like pathfinding (CozoDB)
- **Three-tier memory** system (working/episodic/semantic)
- **Multi-language code parsing** (33 languages via tree-sitter)
- **Cognitive workflow** with 90-95% token reduction

### Core Philosophy

- **Async-first**: Non-blocking I/O for fast, parallel operations
- **Local-first**: No cloud dependencies, runs entirely on localhost
- **Lightweight**: Underengineered for dev tools, not production systems
- **Separation of Concerns**: Clean MCP API → Handler → Service → Storage layers

---

## POC Categories & CognitiveIQ Capabilities

### 1. AI Coding Assistants

**Goal**: Agents that understand and modify codebases intelligently.

#### CognitiveIQ Tools to Use

| Tool              | Purpose                                 | Example Use Case                       |
| ----------------- | --------------------------------------- | -------------------------------------- |
| `unified_context` | Get adaptive context for files/symbols  | "Show me everything about AuthService" |
| `symbol_search`   | Find functions, classes, methods        | "Where is validate_token defined?"     |
| `graph_neighbors` | Discover related code entities          | "What calls this function?"            |
| `graph_path`      | Find navigation paths between code      | "How does main.py reach DatabasePool?" |
| `cognitive_next`  | Iterative exploration with refinement   | "Help me understand the auth flow"     |
| `smart_index`     | Auto-index codebase with type detection | Initialize project for fast search     |
| `memory_store`    | Remember user preferences/patterns      | "Remember: tests go in tests/"         |

#### Architecture Pattern

```
User Query → cognitive_next (initial exploration)
          → symbol_search (find entry points)
          → graph_neighbors (discover dependencies)
          → unified_context (get full details)
          → cognitive_refine (narrow down based on feedback)
          → memory_store (remember findings for future)
```

#### Example POC Flow

1. **Initialize**: `smart_index(path="./src", type="code")`
2. **Explore**: `cognitive_next(query="authentication system", mode="balanced")`
3. **Navigate**: `graph_path(src_id="login", dst_id="database")`
4. **Refine**: `cognitive_refine(session_id="...", positive=["doc_1"], negative=["doc_5"])`
5. **Remember**: `memory_store(content="Auth uses JWT tokens", tier="semantic")`

---

### 2. Automated Software Engineering

**Goal**: Tools that autonomously fix bugs and implement features.

#### CognitiveIQ Tools to Use

| Tool              | Purpose                          | Example Use Case                     |
| ----------------- | -------------------------------- | ------------------------------------ |
| `where_used`      | Find all references to a symbol  | "Before refactoring, see all usages" |
| `graph_impact`    | Analyze blast radius of changes  | "What breaks if I change this?"      |
| `deep_analyze`    | Extract detailed code structure  | "Get AST and relationships for file" |
| `symbol_search`   | Locate implementation targets    | "Find all error handlers"            |
| `memory_search`   | Recall previous fixes/patterns   | "Have we fixed similar bugs before?" |
| `log_interaction` | Track agent actions for auditing | Record fix attempts and outcomes     |

#### Architecture Pattern

```
Bug Report → symbol_search (locate bug)
          → graph_impact (assess change scope)
          → where_used (find all call sites)
          → memory_search (recall similar fixes)
          → [APPLY FIX]
          → log_interaction (record fix)
          → memory_store (remember solution)
```

#### Example POC Flow

1. **Locate**: `symbol_search(query="calculate_total", scope="functions")`
2. **Assess**: `graph_impact(node_ids=["calculate_total"], depth=2)`
3. **Find Usages**: `where_used(symbol_id="calculate_total")`
4. **Recall**: `memory_search(query="calculation bug", memory_tiers="episodic,semantic")`
5. **Fix & Log**: Apply fix → `log_interaction(source="agent:fixer", action="fix_bug")`

---

### 3. Knowledge Management Systems

**Goal**: Capture and query institutional knowledge across code and docs.

#### CognitiveIQ Tools to Use

| Tool                 | Purpose                            | Example Use Case                       |
| -------------------- | ---------------------------------- | -------------------------------------- |
| `memory_store`       | Store knowledge in tiered memory   | "Remember: API keys in .env.local"     |
| `memory_search`      | Unified search across memory tiers | "How do we deploy to production?"      |
| `memory_associate`   | Build knowledge graphs             | Link "deployment" to "CI/CD"           |
| `memory_consolidate` | Promote knowledge to long-term     | Move frequent queries to semantic tier |
| `unified_context`    | Get structured docs/code context   | "Summarize the deployment guide"       |
| `smart_index`        | Index documentation and wikis      | Index docs/ folder for fast search     |

#### Architecture Pattern

```
Knowledge Entry → memory_store (with tags, importance)
               → memory_associate (link related concepts)
               ↓
Query → memory_search (across tiers)
     → unified_context (enrich with code/docs)
     → cognitive_refine (narrow results)
     ↓
Consolidation Loop → memory_consolidate (promote frequently accessed)
```

#### Example POC Flow

1. **Capture**: `memory_store(content="Deploy: npm run build && pm2 restart", tags="deploy,prod", importance=0.9)`
2. **Link**: `memory_associate(memory_id_1="deploy_mem", memory_id_2="ci_cd_mem", relationship="related_to")`
3. **Query**: `memory_search(query="production deployment", tags="deploy,prod")`
4. **Enrich**: `unified_context(query="deployment process", collections=["docs"])`
5. **Maintain**: `memory_consolidate(source_tier="episodic", strategy="importance")`

---

### 4. Code Analysis Tools

**Goal**: Deep understanding of architecture, patterns, and code quality.

#### CognitiveIQ Tools to Use

| Tool                    | Purpose                             | Example Use Case                          |
| ----------------------- | ----------------------------------- | ----------------------------------------- |
| `deep_analyze`          | Extract AST, symbols, relationships | "Get full structure of service layer"     |
| `graph_stats`           | Understand graph structure/metrics  | "How many modules? What's connected?"     |
| `graph_context`         | Expand context around entities      | "Show everything related to UserService"  |
| `symbol_search`         | Find patterns across codebase       | "Find all classes extending BaseModel"    |
| `cognitive_next`        | Explore code patterns iteratively   | "Understand dependency injection pattern" |
| `analyze_collaboration` | Understand team code patterns       | "Which modules are modified together?"    |

#### Architecture Pattern

```
Analysis Target → smart_index (ensure indexed)
               → deep_analyze (get structure)
               → symbol_search (find patterns)
               → graph_stats (quantify complexity)
               → cognitive_next (iterative exploration)
               → memory_store (cache analysis results)
```

#### Example POC Flow

1. **Index**: `smart_index(path="./src", operation="auto")`
2. **Analyze**: `deep_analyze(file_paths=["src/services/*.py"], include_relationships=true)`
3. **Find Patterns**: `symbol_search(query="class.*Service", scope="classes")`
4. **Metrics**: `graph_stats()` → Get entity counts, relationship distribution
5. **Cache**: `memory_store(content="Services follow DI pattern", tier="semantic")`

---

### 5. Developer Onboarding

**Goal**: Agents that guide new team members through codebases.

#### CognitiveIQ Tools to Use

| Tool              | Purpose                            | Example Use Case                        |
| ----------------- | ---------------------------------- | --------------------------------------- |
| `graph_path`      | Show navigation routes             | "How do requests flow from API to DB?"  |
| `cognitive_next`  | Guided exploration sessions        | "Learn the authentication system"       |
| `unified_context` | Get beginner-friendly explanations | "Explain what main.py does"             |
| `memory_store`    | Remember learner's progress        | "User learned auth, next: database"     |
| `memory_search`   | Recall previous onboarding Q&A     | "How did last developer learn this?"    |
| `log_interaction` | Track learning journey             | Record questions and areas of confusion |

#### Architecture Pattern

```
Learning Goal → cognitive_next (session="onboarding_auth")
             → graph_path (show flow: "entry → core logic")
             → unified_context (detailed explanations)
             → cognitive_refine (based on learner feedback)
             → memory_store (track progress)
             → log_interaction (record questions)
```

#### Example POC Flow

1. **Start Session**: `cognitive_next(session_id="onboarding_day1", query="authentication system")`
2. **Show Flow**: `graph_path(src_id="login_route", dst_id="verify_token")`
3. **Explain**: `unified_context(query="JWT authentication", mode="exploratory")`
4. **Adapt**: `cognitive_refine(session_id="...", positive=[relevant], negative=[too_complex])`
5. **Track**: `log_interaction(source="learner:alice", action="learned", target="auth")`

---

### 6. Technical Documentation Systems

**Goal**: Systems that learn from and generate documentation about code.

#### CognitiveIQ Tools to Use

| Tool              | Purpose                            | Example Use Case                       |
| ----------------- | ---------------------------------- | -------------------------------------- |
| `unified_context` | Extract documentation structure    | "Get API documentation outline"        |
| `symbol_search`   | Find undocumented symbols          | "Find functions without docstrings"    |
| `graph_neighbors` | Discover related docs/code         | "What docs relate to AuthService?"     |
| `memory_store`    | Store generated documentation      | "Remember: API uses OAuth2 flow"       |
| `smart_index`     | Index docs + code together         | Index src/ and docs/ for cross-linking |
| `cognitive_next`  | Generate documentation iteratively | "Document the payment module"          |

#### Architecture Pattern

```
Doc Target → smart_index (index code + docs)
          → symbol_search (find undocumented)
          → unified_context (extract existing docs)
          → cognitive_next (generate new docs)
          → memory_store (cache generated content)
          → graph_neighbors (link code ↔ docs)
```

#### Example POC Flow

1. **Index Both**: `smart_index(targets=[{"path":"./src", "type":"code"}, {"path":"./docs", "type":"docs"}])`
2. **Find Gaps**: `symbol_search(query=".*", scope="functions")` → filter undocumented
3. **Extract**: `unified_context(query="existing API docs", collections=["docs"])`
4. **Generate**: `cognitive_next(query="document payment module", mode="focused")`
5. **Store**: `memory_store(content="Payment uses Stripe API", tags="docs,api", tier="semantic")`

---

### 7. Code Review Automation (BONUS)

**Goal**: Agents that provide intelligent code review feedback.

#### CognitiveIQ Tools to Use

| Tool              | Purpose                      | Example Use Case                       |
| ----------------- | ---------------------------- | -------------------------------------- |
| `graph_impact`    | Analyze change impact        | "What's affected by this PR?"          |
| `where_used`      | Find affected call sites     | "What calls the modified function?"    |
| `memory_search`   | Recall coding standards      | "What's our error handling pattern?"   |
| `deep_analyze`    | Check code structure quality | "Are there circular dependencies?"     |
| `log_interaction` | Track review history         | Record review comments and resolutions |

#### Architecture Pattern

```
PR Diff → graph_impact (assess scope)
       → where_used (find dependents)
       → memory_search (recall standards)
       → deep_analyze (check quality)
       → [GENERATE REVIEW]
       → log_interaction (record review)
```

---

### 8. Semantic Code Search (BONUS)

**Goal**: Natural language queries over codebases.

#### CognitiveIQ Tools to Use

| Tool               | Purpose                        | Example Use Case                             |
| ------------------ | ------------------------------ | -------------------------------------------- |
| `cognitive_next`   | Iterative semantic exploration | "Find where we validate email addresses"     |
| `unified_context`  | Context-aware results          | "authentication with database"               |
| `symbol_search`    | Precise symbol matching        | "find validate_email function"               |
| `cognitive_refine` | Improve results with feedback  | Positive: actual validators, Negative: tests |

---

## CognitiveIQ Feature Matrix

### Tool Categories (14 total, 36+ tools)

| Category               | Tool Count | Key Tools                                                     | Primary Use Cases                      |
| ---------------------- | ---------- | ------------------------------------------------------------- | -------------------------------------- |
| **Cognitive Workflow** | 5          | `cognitive_next`, `cognitive_refine`, `cognitive_summarize`   | Iterative exploration, token reduction |
| **Knowledge Graph**    | 6          | `graph_neighbors`, `graph_path`, `graph_impact`, `where_used` | Code navigation, dependency analysis   |
| **Memory System**      | 5          | `memory_store`, `memory_search`, `memory_consolidate`         | Knowledge retention, recall            |
| **Search**             | 1          | `unified_search`                                              | Hybrid vector + FTS search             |
| **Symbol Search**      | 1          | `symbol_search`                                               | Find functions, classes, variables     |
| **Context**            | 1          | `unified_context`                                             | Adaptive context building              |
| **Indexing**           | 1          | `smart_index`                                                 | Auto-index with type detection         |
| **Deep Analysis**      | 1          | `deep_analyze`                                                | AST, relationships, structure          |
| **Extraction**         | 1          | `extract`                                                     | Structured data extraction             |
| **Interactions**       | 4          | `log_interaction`, `analyze_collaboration`                    | Track agent collaboration              |
| **Navigation**         | 2          | `navigate`, file ops                                          | File system navigation                 |
| **Workspace**          | 6          | `workspace_init`, collection ops                              | Workspace management                   |
| **Symbols**            | 2          | Symbol listing, filtering                                     | Symbol discovery                       |
| **Operations**         | 1          | Batch operations                                              | Bulk processing                        |

### Core Services

| Service                   | Purpose                                   | Location                                   |
| ------------------------- | ----------------------------------------- | ------------------------------------------ |
| **Unified Search Engine** | Hybrid search with auto-strategy          | `services/search/unified_search_engine.py` |
| **Knowledge Graph**       | CozoDB-based graph navigation             | `services/kb/cozo_service.py`              |
| **Memory System**         | 3-tier memory (working/episodic/semantic) | `services/memory/`                         |
| **Embedding Service**     | Local embeddings (3 tiers: HIGH/MED/LOW)  | `services/embeddings/service.py`           |
| **Document Indexer**      | Multi-format parsing and indexing         | `services/indexing/document_indexer.py`    |
| **Parser System**         | 33 languages via tree-sitter              | `parsers/`                                 |

### Search Capabilities

| Feature              | Implementation                      | Notes                                      |
| -------------------- | ----------------------------------- | ------------------------------------------ |
| **Vector Search**    | LanceDB native ANN                  | 3-tier embeddings (384d/582d/1024d)        |
| **Full-Text Search** | LanceDB FTS                         | Tantivy-based                              |
| **Hybrid Search**    | Auto-weighted fusion                | Strategy: vector_heavy/fts_heavy/balanced  |
| **Multi-Collection** | Parallel `asyncio.gather`           | Search multiple collections simultaneously |
| **Auto-Strategy**    | Query analysis → strategy selection | Adapts to query characteristics            |

### Memory System

| Tier         | Capacity  | TTL       | Embedding Dims | Use Case                     |
| ------------ | --------- | --------- | -------------- | ---------------------------- |
| **Working**  | 200 items | 1 hour    | 384d (LOW)     | Immediate context, attention |
| **Episodic** | 15K items | 45 days   | 582d (MED)     | Experiences, sessions        |
| **Semantic** | Unlimited | Permanent | 1024d (HIGH)   | Long-term knowledge          |

**Consolidation**: Auto-promotes based on importance, access count, temporal coherence.

### Parser Support

| Category       | Languages                                            | Parser                            |
| -------------- | ---------------------------------------------------- | --------------------------------- |
| **Code**       | 33 languages (Python, JS, Go, Rust, Java, C++, etc.) | Tree-sitter (100% coverage)       |
| **Documents**  | PDF, DOCX, PPTX, Markdown, Text                      | Unstructured + MarkdownTextParser |
| **Structured** | JSON, YAML, XML, HTML                                | StructuredParser                  |

---

## Agent Architecture Patterns

### Pattern 1: Exploration → Refinement → Storage

**Use Case**: Discovery tasks where the agent learns iteratively.

```python
# 1. Start exploration
result = await cognitive_next(
    session_id="new",
    query="payment processing flow",
    mode="balanced"
)

# 2. Refine based on relevance
refined = await cognitive_refine(
    session_id=result["session_id"],
    positive=["doc_5", "doc_12"],  # Relevant
    negative=["doc_3"],             # Off-topic
    prefer_code=True
)

# 3. Store findings
await memory_store(
    content="Payment flow: API → Stripe → DB",
    tier="semantic",
    importance=0.9,
    tags="payment,architecture"
)
```

---

### Pattern 2: Graph Navigation → Impact Analysis

**Use Case**: Understanding code changes and dependencies.

```python
# 1. Find the target entity
symbol = await symbol_search(query="UserService", scope="classes")

# 2. Get neighbors
neighbors = await graph_neighbors(
    node_id="UserService",
    edge_types=["calls", "imports"]
)

# 3. Analyze impact of changes
impact = await graph_impact(
    node_ids=["UserService"],
    depth=2,
    limit=50
)

# Result: List of affected files, critical paths, confidence scores
```

---

### Pattern 3: Multi-Tier Memory with Consolidation

**Use Case**: Knowledge systems that evolve over time.

```python
# 1. Store immediate findings (working memory)
await memory_store(
    content="Database connection pool size = 20",
    tier="working",
    importance=0.5
)

# 2. Frequently accessed → episodic tier (auto or manual)
await memory_consolidate(
    source_tier="working",
    strategy="importance",
    min_importance=0.6
)

# 3. Critical knowledge → semantic tier
await memory_store(
    content="Production DB: db.prod.company.com",
    tier="semantic",
    importance=0.95,
    tags="production,database,critical"
)

# 4. Query across all tiers
results = await memory_search(
    query="database configuration",
    memory_tiers="working,episodic,semantic"
)
```

---

### Pattern 4: Context-Aware Documentation Generation

**Use Case**: Generating or maintaining technical documentation.

```python
# 1. Index both code and existing docs
await smart_index(
    targets=[
        {"path": "./src", "type": "code"},
        {"path": "./docs", "type": "docs"}
    ],
    operation="auto"
)

# 2. Get context for documentation target
context = await unified_context(
    query="authentication module",
    collections=["code", "docs"],
    mode="focused"
)

# 3. Find undocumented symbols
symbols = await symbol_search(query=".*", scope="functions")
# Filter: symbols without docstrings

# 4. Generate and store documentation
# [Your LLM generates docs based on context]
await memory_store(
    content=generated_doc,
    tier="semantic",
    tags="documentation,auth",
    content_source="agent://doc_generator"
)
```

---

## MCP Integration & Multi-Agent Collaboration

### MCP Server Architecture

CognitiveIQ runs as a **FastMCP server** exposing all tools via the Model Context Protocol (MCP).

```
┌─────────────────────────────────────────┐
│         Your Agent/Application          │
│  (Claude, GPT-4, Custom Agent, etc.)    │
└──────────────┬──────────────────────────┘
               │ MCP Protocol
               │
┌──────────────▼──────────────────────────┐
│       CognitiveIQ MCP Server            │
│  (FastAPI + MCP, Port 8000 default)     │
│                                          │
│  36+ Tools across 14 categories          │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴──────────┐
      │                   │
┌─────▼──────┐   ┌────────▼────────┐
│  LanceDB   │   │    CozoDB       │
│  (Vectors) │   │    (Graph)      │
└────────────┘   └─────────────────┘
```

### Connecting External Agents

#### 1. MCP Client Integration

```python
# Python MCP client example
from mcp import Client

client = Client("http://localhost:8000")

# Call CognitiveIQ tools
result = await client.call_tool("cognitive_next", {
    "query": "authentication flow",
    "mode": "balanced"
})
```

#### 2. Multi-Agent Collaboration Patterns

**Pattern: Specialist Agents with Shared Knowledge**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Codex      │      │   Gemini     │      │   Serena     │
│ (Code Review)│      │  (Analysis)  │      │ (Navigator)  │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │  CognitiveIQ Server │
                  │  (Shared Knowledge) │
                  └─────────────────────┘
```

**Collaboration Flow**:

1. **Codex** analyzes code structure → logs to `log_interaction`
2. **Gemini** queries graph → `graph_impact` for analysis
3. **Serena** navigates → `graph_path` for user guidance
4. All agents share findings via `memory_store` with `agent_id`

#### 3. Session Management

CognitiveIQ automatically manages agent sessions:

```python
# Agent session is injected automatically
await memory_store(
    content="Found auth bug in line 42",
    # agent_id injected from workspace_init
    # session_id injected from workspace_init
)

# Search filters to your session automatically
results = await memory_search(query="auth bug")
# Returns only memories from your session
```

#### 4. Interaction Tracking

Track multi-agent collaboration:

```python
# Log agent actions
await log_interaction(
    source="agent:codex",
    action="review",
    target="auth_service.py",
    session_id="collab_session_1"
)

# Analyze collaboration
analysis = await analyze_collaboration(
    session_id="collab_session_1",
    hours_back=1
)
# Returns: agent participation, interaction patterns, effectiveness scores
```

### Combining with Other MCP Servers

**Example: CognitiveIQ + GitHub MCP + Filesystem MCP**

```python
# Your orchestration agent uses multiple MCP servers

# 1. Use CognitiveIQ for code understanding
context = await cognitive_client.call_tool("unified_context", {
    "query": "authentication module"
})

# 2. Use GitHub MCP for PR operations
pr_diff = await github_client.call_tool("get_pr_diff", {
    "pr_number": 123
})

# 3. Use Filesystem MCP for file ops
file_content = await fs_client.call_tool("read_file", {
    "path": "/src/auth.py"
})

# 4. Combine and store in CognitiveIQ
await cognitive_client.call_tool("memory_store", {
    "content": f"PR #123 modifies auth: {context['summary']}",
    "importance": 0.8,
    "tags": "pr,auth,review"
})
```

---

## Building New Agents

When CognitiveIQ doesn't have an existing tool for your POC, follow these patterns to build new agents that integrate with the framework.

### When to Build a New Agent

**Use existing tools if**:

- Your POC fits the 8 categories above
- You can compose existing tools to achieve the goal
- You need standard search, memory, or graph operations

**Build a new agent if**:

- You need domain-specific operations (e.g., vulnerability scanning)
- You require custom parsing or analysis logic
- You want to extend CognitiveIQ's capabilities permanently

### Development Pattern (from AGENTS.md)

**1. Add Business Logic in Services**

```python
# cognitive_iq/services/my_service/my_analyzer.py
from cognitive_iq.services.embeddings.service import EmbeddingService

class MyAnalyzer:
    def __init__(self, embedding_service: EmbeddingService):
        self.embeddings = embedding_service

    async def analyze(self, content: str) -> dict:
        # Business logic here
        embeddings = await self.embeddings.embed([content])
        # ... analysis logic ...
        return {"result": "analyzed"}
```

**2. Create Handler for Orchestration**

```python
# cognitive_iq/mcp/handlers/my_handler.py
from cognitive_iq.services.container import ServiceContainer

class MyHandler:
    def __init__(self, container: ServiceContainer):
        self.container = container

    async def handle_analysis(self, content: str) -> dict:
        analyzer = self.container.get_service("my_analyzer")
        result = await analyzer.analyze(content)
        return result
```

**3. Create MCP Tool**

```python
# cognitive_iq/mcp/tools/my_tools.py
from fastmcp import FastMCP
from cognitive_iq.mcp.handlers.my_handler import MyHandler
from cognitive_iq.services.container import get_container

def register_my_tools(mcp: FastMCP) -> None:
    @mcp.tool
    async def my_analyze(content: str) -> dict:
        """Analyze content using my custom logic."""
        container = await get_container()
        handler = container.get_service("my_handler")
        if not handler:
            handler = MyHandler(container)
            container.register_service("my_handler", handler)

        return await handler.handle_analysis(content)
```

**4. Register in Server**

```python
# cognitive_iq/mcp/server.py
from cognitive_iq.mcp.tools.my_tools import register_my_tools

# In create_mcp_server():
register_my_tools(mcp)
```

### Key Patterns to Follow

**Separation of Concerns (SoC)**:

- **MCP Tool**: Parse/validate params → call handler → shape response
- **Handler**: Orchestration only → call services via container
- **Service**: Business logic + side effects → reusable
- **Never**: Call LanceDB/CozoDB directly from tools/handlers

**Caching**:

- Use `LRUCache` for Python objects (results, navigation state)
- Use `QueryCache` for JSON-serializable search results
- Always specify `max_size` and `ttl`

**Async-First**:

- Use `async/await` consistently
- Parallelize with `asyncio.gather` when independent
- Always `import asyncio` when using gather

**Configuration**:

- Use `get_config()` for all settings
- Support environment variable overrides
- Never hardcode thresholds, weights, or limits

**Error Handling**:

- Use collections guard for tools requiring indexed data
- Validate paths with `PathValidationService`
- Return structured errors, not exceptions to MCP clients

### Testing New Agents

```python
# tests/mcp/tools/test_my_tools.py
import pytest
from cognitive_iq.services.container import get_container

@pytest.mark.asyncio
async def test_my_analyze():
    container = await get_container()
    handler = container.get_service("my_handler")

    result = await handler.handle_analysis("test content")

    assert result["result"] == "analyzed"
```

---

## Quick Reference

### Starting CognitiveIQ Server

```bash
# Install dependencies
uv venv venv
uv pip install -e .

# Start server (FastAPI + MCP)
uv run -m cognitive_iq

# Server runs on http://localhost:8000
# MCP endpoint: http://localhost:8000/mcp
```

### Essential Tools by Use Case

| Use Case                | Primary Tools                      | Secondary Tools                      |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| **Code Search**         | `cognitive_next`, `symbol_search`  | `unified_context`, `graph_neighbors` |
| **Navigation**          | `graph_path`, `graph_neighbors`    | `where_used`, `graph_impact`         |
| **Knowledge Capture**   | `memory_store`, `memory_associate` | `memory_consolidate`                 |
| **Knowledge Retrieval** | `memory_search`, `unified_context` | `cognitive_next`                     |
| **Impact Analysis**     | `graph_impact`, `where_used`       | `graph_neighbors`, `deep_analyze`    |
| **Documentation**       | `unified_context`, `smart_index`   | `symbol_search`, `extract`           |
| **Onboarding**          | `cognitive_next`, `graph_path`     | `unified_context`, `memory_store`    |

### Configuration Tuning

Key config parameters for fine-tuning (in `config.py`):

```python
# Memory tier thresholds (importance score routing)
semantic_tier_threshold = 0.8  # >= 0.8 → semantic tier
episodic_tier_threshold = 0.5  # >= 0.5 → episodic, < 0.5 → working

# Consolidation (promotion between tiers)
working_to_episodic_threshold = 0.6  # Importance for promotion
episodic_to_semantic_threshold = 0.7
access_count_threshold = 3           # Accesses before promotion

# Recall weights (search ranking)
recall_similarity_weight = 0.4  # 40% similarity
recall_recency_weight = 0.3     # 30% recency
recall_importance_weight = 0.3  # 30% importance

# Token limits
mcp_max_response_tokens = 20000       # Max tokens per response
mcp_max_content_preview_length = 200  # Content preview length
```

### Common Commands

```bash
# Download embedding models
uv run -m cognitive_iq models --download

# List available models
uv run -m cognitive_iq models --list

# Clear workspace (except embeddings)
scripts/clean_workspace.sh --confirm

# Kill server
scripts/kill_ciq.sh

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=cognitive_iq --cov-report=term-missing
```

### External Resources

- **CognitiveIQ Repo**: [Your repo URL]
- **AGENTS.md**: Detailed developer guide
- **MCP Specification**: https://modelcontextprotocol.io/
- **FastMCP**: https://github.com/jlowin/fastmcp
- **LanceDB**: https://lancedb.com/
- **CozoDB**: https://github.com/cozodb/cozo

---

## Summary

CognitiveIQ provides a **production-ready knowledge infrastructure** for building cognitive agents across 8+ POC categories:

1. **AI Coding Assistants**: Explore, navigate, and understand code
2. **Automated Software Engineering**: Fix bugs, analyze impact
3. **Knowledge Management**: Capture and retrieve institutional knowledge
4. **Code Analysis**: Deep structural and architectural analysis
5. **Developer Onboarding**: Guide learning journeys
6. **Technical Documentation**: Learn from and generate docs
7. **Code Review Automation**: Intelligent review feedback
8. **Semantic Code Search**: Natural language code queries

**Key Strengths**:

- 36+ MCP tools across 14 categories
- Local-first, no cloud dependencies
- Hybrid search (vector + FTS)
- 3-tier memory system
- Knowledge graph navigation
- 33-language code parsing
- 90-95% token reduction
- Async-first, lightweight architecture

**When to Use CognitiveIQ**:

- Building POCs that need code understanding
- Multi-agent collaboration with shared knowledge
- Local-first development tools
- Rapid prototyping without cloud setup

**When to Build Custom**:

- Domain-specific analysis (security, compliance)
- Cloud-native requirements
- Production-grade auth/monitoring
- Specialized parsing needs

**Next Steps**:

1. Start server: `uv run -m cognitive_iq`
2. Index your project: `smart_index(path="./src", type="auto")`
3. Try a tool: `cognitive_next(query="your query")`
4. Refer to [AGENTS.md](AGENTS.md) for detailed development patterns

---

**Built for agents, by developers who use agents.**
