# POCkit - AI-Powered POC Generation System

A clean, production-ready Proof-of-Concept generation system using Claude AI with intelligent codebase awareness and technical feasibility analysis.

## 🎯 Project Goal

Generate comprehensive Proof-of-Concept (POC) documents for infrastructure modernization and AI migration projects through an automated 3-phase workflow:

1. **Quick Questions** (< 30 seconds) - Generate clarifying questions
2. **File Analysis** (2-4 minutes) - Analyze uploaded files and discover AI solutions via web search
3. **POC Generation** (2-3 minutes) - Create comprehensive 2000+ word POC documents

**Total workflow time: < 8 minutes**

## ✅ Success Criteria Met

- ✅ Server compiles and runs without errors
- ✅ Can create session, upload files, generate questions (<30s)
- ✅ File analysis finds 8+ results and 3-5 AI solutions (2-4 min)
- ✅ POC generation produces 2000+ word documents (2-3 min)
- ✅ Total flow: <8 minutes

## 🏗️ Architecture

### System Overview

POCkit is a full-stack application with three main components:

1. **Frontend** (React + TypeScript + Vite) - Port 5173
2. **Backend** (Express + TypeScript + Prisma) - Port 3000
3. **Database** (PostgreSQL) - ai_consultation_v2

### Directory Structure

```
POCkit/
├── server/                         # Backend API Server
│   ├── src/
│   │   ├── agents/                 # AI Agents (Claude)
│   │   │   ├── prompts/           # Agent system prompts
│   │   │   │   ├── quick-question.ts
│   │   │   │   ├── file-analysis.ts
│   │   │   │   └── poc-generation.ts
│   │   │   ├── tools/             # Agent tools
│   │   │   │   ├── database-tools.ts    # Prisma operations
│   │   │   │   ├── file-tools.ts        # File parsing (DOCX, PDF)
│   │   │   │   ├── context-tools.ts     # Smart context detection & loading
│   │   │   │   ├── recommendation-tools.ts  # Tech stack recommendations
│   │   │   │   ├── feasibility-tools.ts # Automatic feasibility analysis
│   │   │   │   ├── validation-tools.ts  # Input validation
│   │   │   │   └── index.ts
│   │   │   ├── types/             # TypeScript interfaces
│   │   │   │   └── index.ts
│   │   │   ├── quick-question-agent.ts  # Question generation
│   │   │   ├── file-analysis-agent.ts   # File analysis + AI discovery
│   │   │   ├── poc-generation-agent.ts  # POC generation
│   │   │   └── code-context-agent.ts    # Generate context from uploaded code
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── poc.ts         # RESTful API endpoints
│   │   ├── config/
│   │   │   └── logger.ts          # Winston logger
│   │   └── index.ts               # Express server entry point
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (@@map directives)
│   │   └── migrations/            # Database migrations
│   ├── uploads/                   # Uploaded files storage
│   ├── outputs/                   # Generated POC outputs
│   ├── logs/                      # Application logs
│   │   ├── combined.log           # All logs
│   │   └── error.log              # Error logs only
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                       # Environment variables
│
├── client/                        # Frontend React Application
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── AnalysisSummary.tsx
│   │   │   ├── BranchComparison.tsx
│   │   │   ├── BranchSelector.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── ConversationInterface.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── POCHistory.tsx
│   │   │   ├── POCViewer.tsx
│   │   │   └── WorkflowDiagram.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── ProjectsPage.tsx
│   │   │   └── ProjectDetailPage.tsx
│   │   ├── services/             # API service layer
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useTranslation.ts
│   │   ├── locales/              # i18n translations
│   │   │   └── en/               # English translations
│   │   ├── constants/            # App constants
│   │   │   ├── apiEndpoints.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   └── i18n.ts           # i18n configuration
│   │   ├── App.tsx               # Root component
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── package.json
│   ├── vite.config.ts            # Vite configuration (proxy)
│   ├── tsconfig.json
│   ├── tailwind.config.js        # Tailwind CSS config
│   └── index.html
│
├── test-workflow.sh              # Integration test script
├── BUILD_PLAN.md             # Build plan document
└── README.md                     # This file
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Browser                                           │
│  http://localhost:5173                                  │
│  (React App + Vite Dev Server)                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTP/API Calls
                   │ (Proxied via Vite)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Express API Server                                     │
│  http://localhost:3000/api                             │
│  ┌────────────────────────────────────────────────┐   │
│  │  Routes Layer (poc.ts)                         │   │
│  │  - Session management                          │   │
│  │  - File upload                                 │   │
│  │  - Question/Answer                             │   │
│  │  - Analysis & POC generation                   │   │
│  └────────────────┬───────────────────────────────┘   │
│                   ▼                                     │
│  ┌────────────────────────────────────────────────┐   │
│  │  Agents Layer                                   │   │
│  │  ┌──────────────────────────────────────────┐ │   │
│  │  │ Quick Question Agent (Claude)            │ │   │
│  │  │ - Generates 5-8 questions (<30s)         │ │   │
│  │  │ - No tools, single API call              │ │   │
│  │  └──────────────────────────────────────────┘ │   │
│  │  ┌──────────────────────────────────────────┐ │   │
│  │  │ File Analysis Agent (Claude)             │ │   │
│  │  │ - Analyzes uploaded files                │ │   │
│  │  │ - Web search for AI solutions            │ │   │
│  │  │ - Multi-turn with tools (2-4 min)        │ │   │
│  │  └──────────────────────────────────────────┘ │   │
│  │  ┌──────────────────────────────────────────┐ │   │
│  │  │ POC Generation Agent (Claude)            │ │   │
│  │  │ - Generates 2000+ word POC               │ │   │
│  │  │ - max_tokens: 16384                      │ │   │
│  │  │ - Multi-turn with tools (2-3 min)        │ │   │
│  │  └──────────────────────────────────────────┘ │   │
│  └────────────────┬───────────────────────────────┘   │
│                   ▼                                     │
│  ┌────────────────────────────────────────────────┐   │
│  │  Tools Layer                                    │   │
│  │  - Database Tools (Prisma operations)          │   │
│  │  - File Tools (DOCX/PDF parsing)               │   │
│  │  - Web Search (Brave Search API)               │   │
│  │  - Context Tools (smart context detection)     │   │
│  │  - Recommendation Tools (tech stack scoring)   │   │
│  └────────────────┬───────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                    │
│  ai_consultation_v2                                     │
│  ┌────────────────────────────────────────────────┐   │
│  │ Tables (with @@map for snake_case)             │   │
│  │ - projects                                      │   │
│  │ - branches                                      │   │
│  │ - analysis_sessions                             │   │
│  │ - uploaded_files                                │   │
│  │ - question_responses                            │   │
│  │ - analysis_results                              │   │
│  │ - ai_solution_recommendations                   │   │
│  │ - generated_pocs                                │   │
│  │ - agent_executions (monitoring)                 │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.0+
- **AI Model**: Claude Sonnet 4 (via Anthropic SDK 0.30+)
- **Database**: PostgreSQL with Prisma ORM
- **Framework**: Express.js
- **File Processing**: Mammoth (DOCX), pdf-parse (PDF)
- **Web Search**: Brave Search API (2,000 queries/month free tier)
- **Testing**: Jest with ts-jest (42 tests)
- **Logging**: Winston

### Database Schema

All tables use `@@map` directives for proper camelCase TypeScript ↔ snake_case PostgreSQL mapping:

- **Projects** - Business projects/initiatives
- **Branches** - Project versions/variants
- **AnalysisSessions** - Complete POC generation workflows
- **UploadedFiles** - File uploads with extracted content
- **AnalysisResults** - Structured findings from file analysis
- **QuestionResponses** - Q&A pairs from quick questions
- **AISolutionRecommendations** - AI solutions discovered via web search
- **GeneratedPocs** - Final POC documents
- **AgentExecutions** - Agent run logs for monitoring

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Node.js 20+
- PostgreSQL 14+
- Anthropic API key
- Brave Search API key (optional, for AI solution discovery - 2,000 free queries/month)
```

### Installation

Follow these steps to set up the complete POCkit system:

#### 1. Database Setup

```bash
# Ensure PostgreSQL is running
pg_isready -h 127.0.0.1 -p 5432

# If not running (macOS with Homebrew):
brew services start postgresql@14

# Create PostgreSQL database
createdb ai_consultation_v2

# Or connect to existing PostgreSQL and create database
psql -h 127.0.0.1 -U postgres
CREATE DATABASE ai_consultation_v2;
\q
```

#### 2. Server Setup

```bash
# Clone the repository (if not already done)
git clone https://github.com/thesminc/POCkit.git
cd POCkit

# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment variables
# Copy the example and edit:
cp .env.example .env  # If .env.example exists
# Or create .env with these values:
# - DATABASE_URL="postgresql://postgres:changeme@127.0.0.1:5432/ai_consultation_v2"
# - ANTHROPIC_API_KEY="sk-ant-..."
# - BRAVE_SEARCH_API_KEY="..." (optional, get free key at https://brave.com/search/api/)

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev

# Server will start on http://localhost:3000
# Health check: curl http://localhost:3000/health
```

#### 3. Client Setup

```bash
# Open a new terminal
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install

# Start development server
npm run dev

# Client will start on http://localhost:5173
# Open http://localhost:5173 in your browser
```

### Starting the Full System

#### Pre-flight Checks

```bash
# 1. Kill any existing processes on required ports
lsof -ti:3000 | xargs kill -9 2>/dev/null  # Backend
lsof -ti:5173 | xargs kill -9 2>/dev/null  # Frontend
lsof -ti:5555 | xargs kill -9 2>/dev/null  # Prisma Studio

# 2. Check PostgreSQL is running
pg_isready -h 127.0.0.1 -p 5432
# Should output: "127.0.0.1:5432 - accepting connections"

# If PostgreSQL is not running:
brew services start postgresql@14  # macOS with Homebrew
# Or: sudo systemctl start postgresql  # Linux
```

#### Start Services (use separate terminals)

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
# Wait for: "POCkit API running on port 3000"
# Health check: curl http://localhost:3000/health
```

**Terminal 2 - Frontend Client:**
```bash
cd client
npm run dev
# Wait for: "Local: http://localhost:5173/"
# Open http://localhost:5173 in your browser
```

**Terminal 3 - Prisma Studio (Optional):**
```bash
cd server
npm run prisma:studio
# Opens at: http://localhost:5555
```

### Production Build

```bash
# Build server TypeScript
cd server
npm run build

# Build client for production
cd ../client
npm run build

# Start production server
cd ../server
npm start
# Serve client build from server or use nginx/apache
```

## 📡 API Endpoints

### Session Management

#### Create Session
```bash
POST /api/sessions/create
Content-Type: application/json

{
  "projectName": "My Project",
  "branchName": "main",
  "problemStatement": "Migrate BizTalk to cloud with AI"
}

Response: {
  "success": true,
  "sessionId": "uuid",
  "projectId": "uuid",
  "branchId": "uuid"
}
```

#### Upload Files
```bash
POST /api/sessions/:sessionId/upload
Content-Type: multipart/form-data

files: [file1.docx, file2.pdf, file3.txt]

Response: {
  "success": true,
  "files": [...]
}
```

### Question Generation

#### Generate Questions
```bash
POST /api/sessions/:sessionId/questions

Response: {
  "success": true,
  "questions": ["Question 1?", "Question 2?", ...]
}
```

#### Get Questions
```bash
GET /api/sessions/:sessionId/questions

Response: {
  "success": true,
  "questions": [
    {
      "id": "uuid",
      "question": "...",
      "answer": null,
      "order": 1
    }
  ]
}
```

#### Answer Question
```bash
POST /api/sessions/:sessionId/questions/:questionId/answer
Content-Type: application/json

{
  "answer": "My answer here"
}

Response: {
  "success": true,
  "question": {...}
}
```

### Analysis & POC Generation

#### Run File Analysis
```bash
POST /api/sessions/:sessionId/analyze

Response: {
  "success": true,
  "analysis": {
    "resultsCount": 12,
    "aiSolutionsCount": 5
  }
}
```

#### Generate POC
```bash
POST /api/sessions/:sessionId/generate-poc

Response: {
  "success": true,
  "poc": {
    "content": "# POC Document...",
    "wordCount": 2500,
    "citations": 15
  }
}
```

#### Get Generated POC
```bash
GET /api/sessions/:sessionId/poc

Response: {
  "success": true,
  "poc": {
    "id": "uuid",
    "content": "# POC Document...",
    "wordCount": 2500,
    "createdAt": "2025-10-13T..."
  }
}
```

## 🧪 Testing

### Run Unit Tests

```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:** 42 tests across:
- AI Validator Service (anti-hallucination defense)
- Question Deduplication Service
- Context Tools (smart context detection)
- Recommendation Tools (tech stack scoring)

### Run Integration Test

```bash
# From POCkit directory
./test-workflow.sh
```

This tests:
- Session creation
- File upload
- Question generation (< 30s)
- Question answering
- Session status retrieval

### Manual Testing

```bash
# 1. Create session
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"projectName":"Test","branchName":"main","problemStatement":"Migrate legacy system"}' \
  | jq -r '.sessionId')

# 2. Upload file
curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/upload \
  -F "files=@your-file.docx"

# 3. Generate questions
curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/questions

# 4. Run analysis
curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/analyze

# 5. Generate POC
curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/generate-poc

# 6. Get POC
curl http://localhost:3000/api/sessions/$SESSION_ID/poc
```

## 🚀 Advanced Features

### Smart Context Detection
Automatically detects relevant context files based on problem statement keywords:
```typescript
// Detects Engineering IQ, CognitiveIQ, GCP Repo Analyzer contexts
const contexts = detectRelevantContexts("Migrate BizTalk to Azure with AI");
```

### Tech Stack Recommendation Engine
Scores and recommends technologies based on:
- Technical Fit: 30%
- Migration Complexity (inverse): 25%
- AI/ML Capabilities: 25%
- Cost Efficiency: 10%
- Ecosystem Maturity: 10%

### Automatic Feasibility Analysis
Gap analysis between requirements and capabilities:
- Parses requirements from problem statement
- Searches context files for capabilities
- Returns coverage score and verdict (YES/PARTIAL/NO)

### Code Context Generation
Generate context files from uploaded codebases:
- Analyzes code structure (classes, functions, patterns)
- Extracts agents, tools, services, utilities
- Creates formatted context file for future POCs

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Anthropic AI
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-sonnet-4-20250514"

# Brave Search API (optional, for AI solution discovery)
# Free tier: 2,000 queries/month, 1 query/second
# Get your API key at: https://brave.com/search/api/
BRAVE_SEARCH_API_KEY="..."

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# File Storage
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
```

## 🎯 Critical Features

### 1. Prisma Schema with @@map
All models use `@@map` for proper TypeScript ↔ PostgreSQL mapping:
```prisma
model AnalysisSession {
  id               String   @id @default(uuid())
  problemStatement String?  @map("problem_statement")
  createdAt        DateTime @default(now()) @map("created_at")

  @@map("analysis_sessions")
}
```

### 2. POC Generation Agent Fixes
- **max_tokens: 16384** (NOT 8192) for full POC generation
- **Simple parsing**: Extracts markdown starting at first `#` header
- **Full content saved**: No aggressive stripping or truncation

### 3. Performance Targets
- Quick Questions: **< 30 seconds** ✅
- File Analysis: **2-4 minutes** (with web search)
- POC Generation: **2-3 minutes**
- **Total: < 8 minutes**

### 4. Quality Targets
- POC: **2000+ words**
- Citations: All tech claims cite files
- AI Solutions: **3-5 discovered** via web search
- Tools Recommended: 5-10 from database

## 📊 Monitoring & Logging

### Application Logs

Located in `server/logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

### Agent Execution Tracking

All agent runs are logged to `agent_executions` table with:
- Duration (ms)
- Token usage (input/output)
- Status (running/completed/failed)
- Error messages (if failed)
- Custom metadata

### Database Monitoring

```bash
# View Prisma Studio
npm run prisma:studio
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill all POCkit-related ports at once
lsof -ti:3000 | xargs kill -9 2>/dev/null  # Backend API
lsof -ti:5173 | xargs kill -9 2>/dev/null  # Frontend
lsof -ti:5555 | xargs kill -9 2>/dev/null  # Prisma Studio

# Or kill a specific port
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -h 127.0.0.1 -p 5432

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Test connection
psql -h 127.0.0.1 -U postgres -d ai_consultation_v2

# Reset database (WARNING: deletes all data)
cd server
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

### File Upload Errors

```bash
# Ensure upload directory exists
cd server
mkdir -p uploads outputs

# Check permissions
chmod 755 uploads outputs
```

### Server Won't Start

```bash
# Check TypeScript compilation
cd server
npx tsc --noEmit

# Check for missing dependencies
npm install

# Verify environment variables
cat .env | grep -E "DATABASE_URL|ANTHROPIC_API_KEY"
```

## 📝 Development

### Adding New Endpoints

1. Add route handler in `src/api/routes/poc.ts`
2. Update Prisma schema if needed
3. Run migration: `npx prisma migrate dev`
4. Update tests

### Adding New Agents

1. Create prompt in `src/agents/prompts/`
2. Create agent class in `src/agents/`
3. Add tools as needed in `src/agents/tools/`
4. Export agent instance

### Code Quality

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# TypeScript type check
npx tsc --noEmit
```

## 📄 License

MIT

## 👥 Support

For issues or questions, please refer to the build plan: `BUILD_PLAN.md`

---

**Built with Claude AI** 🤖
