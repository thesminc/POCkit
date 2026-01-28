# POCkit - Build Plan

## Project Overview
AI-powered Proof-of-Concept generation system using Claude Agent SDK with intelligent codebase awareness and technical feasibility analysis.

**Workflow:** Conversational Q&A → File Analysis → POC Generation → Export

**NEW: Conversational Q&A Flow**
- Questions are asked ONE AT A TIME
- AI evaluates answers and generates follow-ups dynamically
- Redundant questions are automatically skipped
- Conversation continues until core POC requirements are gathered

---

## Completed Features ✓

### Core Infrastructure
- [x] Express server with health check, CORS, error handling
- [x] Winston logging
- [x] Prisma database schema with proper @@map directives
- [x] TypeScript configuration

### Agents
- [x] QuickQuestionAgent - Fast question generation (<30s) - Legacy batch mode
- [x] FileAnalysisAgent - Tech stack extraction + AI solution discovery
- [x] POCGenerationAgent - Comprehensive POC document generation
- [x] ConversationAgent - Conversational Q&A flow (one question at a time)

### Tools
- [x] Database tools (save/get session data, analysis results, etc.)
- [x] File tools (DOCX, PDF, TXT extraction)
- [x] Validation tools (schema validation, citation checking)
- [x] Framework tools (agent recommendations)

### Services
- [x] SSE Manager - Real-time progress updates
- [x] AI Validator - Anti-hallucination defense
- [x] Question Deduplication - Semantic matching
- [x] PDF Converter - Markdown to PDF
- [x] Exporter - Multi-format export (MD, PDF, PPTX)

### API Endpoints
- [x] Session management (create, get, upload files)
- [x] Question generation and answering
- [x] File analysis
- [x] POC generation
- [x] SSE events (`/api/events`)
- [x] Export (`/api/export`)
- [x] Conversational Q&A (`/api/sessions/:id/ask` with ConversationAgent)

### Conversational Q&A Flow (NEW)
- [x] QuestionQueue database model for tracking questions
- [x] ConversationAgent with LLM-based answer evaluation
- [x] One-at-a-time question delivery
- [x] Dynamic follow-up question generation
- [x] Answer quality assessment (complete/partial/off_topic)
- [x] Automatic redundant question skipping
- [x] Frontend optimistic updates for instant feedback
- [x] Legacy batch mode still available via `/api/agents/sessions/:id/quick-questions`

---

## Remaining Tasks

### Backend Enhancements

#[ ] Integrate SSE into agents for real-time progress
  - Add progress events to FileAnalysisAgent
  - Add progress events to POCGenerationAgent
  - Frontend SSE listener integration

#[x] Add question deduplication to ConversationAgent
  - Check new questions against previous answers
  - Automatically skip redundant questions based on LLM evaluation

#[ ] Integrate AI Validator into analysis results
  - Validate findings before saving
  - Add confidence-based formatting

#[ ] Add branch comparison endpoint
  - Compare POCs between branches
  - Show diff/changes

#[ ] Add POC versioning
  - Track POC history per session
  - Allow rollback to previous versions

### Testing

#[ ] Unit tests for services
  - SSE Manager tests
  - Exporter tests
  - AI Validator tests

#[ ] Integration tests
  - Full workflow test (upload → questions → analyze → POC)
  - Export format tests (PDF, PPTX)

#[ ] Performance benchmarks
  - Questions: <30 seconds
  - Analysis: 2-4 minutes
  - POC Generation: 2-3 minutes

---

## UI Refactor Plan

### Goals
- Make the UI more user-friendly and intuitive
- Improve visual feedback during long-running operations
- Streamline the POC generation workflow

### Phase 1: Layout & Navigation

#[ ] Redesign main navigation
  - Simplify menu structure
  - Add breadcrumb navigation
  - Improve mobile responsiveness

#[ ] Create dashboard landing page
  - Recent projects list
  - Quick actions (new POC, continue session)
  - Status overview

#[ ] Improve project/branch selector
  - Better visual hierarchy
  - Quick switch between branches
  - Branch status indicators

### Phase 2: Workflow UX

#[ ] Redesign session creation flow
  - Step-by-step wizard
  - Clear progress indicators
  - Input validation with helpful messages

#[ ] Improve file upload experience
  - Drag-and-drop zone
  - File type icons
  - Upload progress bars
  - Preview extracted content

#[ ] Enhance question interface
  - Card-based question display
  - Skip/answer controls
  - Progress indicator (X of Y questions)
  - Auto-save answers

#[ ] Add real-time progress UI
  - SSE-powered progress bars
  - Step-by-step status updates
  - Estimated time remaining
  - Cancel operation option

### Phase 3: POC Display & Export

#[ ] Redesign POC viewer
  - Table of contents sidebar
  - Section navigation
  - Expandable/collapsible sections
  - Citation highlighting

#[ ] Improve export experience
  - Format preview thumbnails
  - One-click export buttons
  - Download progress indicator
  - Share link generation

#[ ] Add POC editing capabilities
  - Inline editing for sections
  - Regenerate specific sections
  - Add custom notes/annotations

### Phase 4: Visual Polish

#[ ] Design system cleanup
  - Consistent color palette
  - Typography hierarchy
  - Spacing/padding standardization
  - Component library

#[ ] Loading states
  - Skeleton loaders
  - Animated progress indicators
  - Helpful loading messages

#[ ] Error states
  - User-friendly error messages
  - Recovery suggestions
  - Retry options

#[ ] Success states
  - Celebration animations
  - Clear next-step guidance
  - Share/export prompts

### Phase 5: Accessibility & Performance

#[ ] Accessibility audit
  - Keyboard navigation
  - Screen reader support
  - Color contrast compliance
  - Focus indicators

#[ ] Performance optimization
  - Code splitting
  - Lazy loading
  - Image optimization
  - Caching strategy

---

## API Reference

### Core Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/create` | Create new session |
| POST | `/api/sessions/:id/upload` | Upload files |
| POST | `/api/agents/sessions/:id/analyze` | Start conversational Q&A (NEW) |
| POST | `/api/sessions/:id/ask` | Send answer, receive next question (NEW) |
| POST | `/api/agents/sessions/:id/generate-poc` | Generate POC |
| GET | `/api/sessions/:id/poc` | Get generated POC |

### Conversational Q&A Endpoints (NEW)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/sessions/:id/analyze` | Initialize conversation, get first question |
| POST | `/api/sessions/:id/ask` | Process answer, get next question or completion |
| POST | `/api/agents/sessions/:id/quick-questions` | Legacy batch mode (all questions at once) |

### Export & Events Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/sessions/:id` | SSE connection |
| POST | `/api/export` | Export POC to format |
| GET | `/api/export/download/:file` | Download export |
| GET | `/api/export/formats` | List export formats |

---

## Tech Stack
- **Backend:** Express.js, Prisma, PostgreSQL
- **AI:** Anthropic Claude SDK (v0.30.1)
- **Frontend:** React, TypeScript, Tailwind CSS
- **Export:** PptxGenJS, Puppeteer, Marked

---

## Notes
- Mark tasks with `x` when completed: `#[x]`
- Priority: UI Refactor Phase 1-2 first, then Phase 3-5
- Keep old versions as reference for additional features if needed
