# Contributing to POCkit

Thank you for your interest in contributing to POCkit! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Anthropic API key
- Brave Search API key (optional, for AI solution discovery)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/thesminc/POCkit.git
   cd POCkit
   ```

2. Set up the server:
   ```bash
   cd server
   npm install
   cp .env.example .env  # Configure your environment variables
   npx prisma migrate dev
   npx prisma generate
   npm run dev
   ```

3. Set up the client:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Project Structure

```
POCkit/
├── server/           # Backend (Express + TypeScript + Prisma)
│   ├── src/
│   │   ├── agents/   # AI Agents (Claude)
│   │   ├── api/      # REST API routes
│   │   ├── config/   # Configuration
│   │   └── services/ # Business logic
│   └── prisma/       # Database schema
├── client/           # Frontend (React + TypeScript + Vite)
└── context/          # Framework knowledge files
```

## How to Contribute

### Reporting Bugs

- Check if the issue already exists
- Include steps to reproduce
- Include expected vs actual behavior
- Include environment details (OS, Node version, etc.)

### Suggesting Features

- Open an issue with the "enhancement" label
- Describe the use case and expected behavior
- Be specific about the implementation if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test` (when available)
5. Commit with clear messages
6. Push and create a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Add comments for complex logic
- Keep functions focused and small

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Architecture Guidelines

### Agents

POCkit uses Claude AI agents for different phases:
- **Quick Question Agent**: Generates clarifying questions
- **File Analysis Agent**: Analyzes uploaded files and discovers AI solutions
- **POC Generation Agent**: Creates comprehensive POC documents

### Context Files

Framework knowledge is stored in `/context/` as markdown files:
- `context_engineering_iq.md` - Engineering IQ agent catalog
- `context_cognitive_iq.md` - CognitiveIQ agents
- `context_gcp_repo_analyzer.md` - GCP tools

### Database

- Use Prisma for all database operations
- Follow the existing schema patterns
- Use `@@map` for snake_case table names

## Questions?

Open an issue or reach out to the maintainers.

Thank you for contributing!
