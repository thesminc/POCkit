# POCkit Test Flow Example

This document provides a complete example flow to test POC generation through the UI.

---

## UI Workflow Overview

POCkit uses a step-by-step workflow to gather information and generate POCs:

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Problem Statement (Required)                           │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│  │ Problem Statement *          │ │ Support Files (Optional)    ││
│  │ [textarea]                   │ │ [drag & drop / browse]      ││
│  │ [Save Problem Statement]     │ │                             ││
│  └─────────────────────────────┘ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Select Context Files * (Required - at least one)       │
│  ☐ Engineering IQ - Code analysis, migration, integration       │
│  ☐ CognitiveIQ - AI/ML, NLP, knowledge graphs                   │
│  ☐ GCP Repo Analyzer - GCP infrastructure, repository analysis  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Engineering Task Types (Optional - select all that apply)│
│  ☐ Software codebase analysis    ☐ Test strategy development    │
│  ☐ Security/compliance audit     ☐ Feature impact analysis      │
│  ☐ Requirement clarification     ☐ Custom engineering task      │
│  ☐ General AI solution                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Start Analysis                                         │
│                    [🚀 Start Analysis]                          │
│  (Takes 2-4 minutes - analyzes files, generates questions)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: Conversation                                           │
│  Answer AI-generated questions in the conversation panel        │
│  [Skip to POC →] available if you want to skip remaining Qs     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: Generate POC                                           │
│  Select format: [👔 Business] [💻 Developer] [📚 Both]          │
│  [Add Final Context] [🚀 Generate POC]                          │
│  (Takes 2-3 minutes)                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Input Sources

### 1. Pre-built Context Files (Manual Selection - Required)
Located in `/context/` - select the relevant context files for your POC:

| Context File | Use When | Capabilities |
|--------------|----------|--------------|
| `context_engineering_iq.md` | BizTalk migration, code analysis, integration work | Code analysis agents, migration tools, workflow automation |
| `context_cognitive_iq.md` | AI/ML projects, NLP, knowledge graphs | AI/ML pipelines, NLP processing, model deployment |
| `context_gcp_repo_analyzer.md` | GCP infrastructure, repository analysis | Repo analysis, caching, report generation |

### 2. User File Uploads (Optional)
Upload your own files (DOCX, PDF, TXT) with:
- System inventories
- Technical requirements
- Architecture documents
- Trading partner lists

### 3. Problem Statement (Required)
Describe your migration/modernization needs in plain text.

### 4. Engineering Task Types (Optional)
| Task Type | Description | Use When |
|-----------|-------------|----------|
| **Software codebase analysis** | Analyze architecture, dependencies, technical debt | Migrating existing systems |
| **Test strategy development** | Design unit, integration, E2E testing approaches | Need testing recommendations |
| **Security/compliance audit** | Evaluate vulnerabilities and compliance | SOC2, PCI-DSS, HIPAA requirements |
| **Feature impact analysis** | Assess how changes affect existing systems | Adding new capabilities |
| **Requirement clarification** | Refine ambiguous requirements | Unclear specifications |
| **Custom engineering task** | Specialized work outside standard categories | Unique projects |
| **General AI solution** | AI solutions not tied to Engineering IQ | Broader AI recommendations |

### What's NOT Supported Yet (Phase 7 - Future)
- External Git repo URLs
- GitHub API integration
- Repository cloning/indexing

---

## Example Scenario: BizTalk to Azure Migration

### Step 1: Enter Problem Statement

**Problem Statement:** (paste in the textarea)
```
We need to migrate our legacy BizTalk Server 2016 integration platform to Azure.
The current system handles:
- 50+ trading partners via EDI (X12, EDIFACT)
- 200+ orchestrations for business process automation
- SQL Server databases for message tracking
- File-based integrations (FTP, SFTP)
- REST/SOAP API integrations

Requirements:
- Maintain EDI trading partner relationships
- Zero downtime migration strategy
- Cost optimization (current licensing is $150K/year)
- Improved monitoring and observability
- Support for hybrid cloud during transition

Constraints:
- Must complete migration within 12 months
- Team has limited Azure experience
- Some trading partners cannot change connection methods
```

Click **"Save Problem Statement"** - wait for the green "✓ Saved" confirmation.

### Step 2: Upload Test Files (Optional)

Create these sample files and drag/drop or click browse:

#### File 1: `biztalk-inventory.txt`
```
BizTalk Server 2016 Enterprise Edition
Host: BIZTALK-PROD-01, BIZTALK-PROD-02 (clustered)
Database: SQL Server 2016 on SQLCLUSTER-01

Orchestrations (200 total):
- Order Processing: 45 orchestrations
- Invoice Processing: 32 orchestrations
- Shipping Notifications: 28 orchestrations
- Inventory Sync: 35 orchestrations
- Partner Onboarding: 20 orchestrations
- Error Handling: 40 orchestrations

Adapters in Use:
- FILE adapter: 85 receive/send ports
- FTP adapter: 45 receive/send ports
- SFTP adapter: 30 receive/send ports
- SQL adapter: 60 receive/send ports
- WCF-SQL adapter: 25 receive/send ports
- WCF-WebHttp adapter: 40 receive/send ports
- EDI adapter: 50 trading partners

Message Volume:
- Daily messages: 150,000
- Peak hour: 25,000 messages
- Average message size: 50KB
- Largest message: 15MB (batch files)

Current Issues:
- High licensing costs
- Limited scalability
- Complex deployment process
- Difficult to monitor end-to-end
- Skills gap in team
```

#### File 2: `trading-partners.txt`
```
Trading Partner Summary (50 partners)

Tier 1 Partners (High Volume - 15 partners):
- Walmart: EDI X12 850/855/856/810, AS2 transport
- Amazon: EDI X12 + REST API hybrid
- Target: EDI X12, VAN connection (Sterling)
- Home Depot: EDI EDIFACT, SFTP transport
- Costco: EDI X12, AS2 transport

Tier 2 Partners (Medium Volume - 20 partners):
- Regional distributors using SFTP
- Smaller retailers using EDI X12

Tier 3 Partners (Low Volume - 15 partners):
- Small vendors using email/CSV
- New partners in onboarding

Connection Methods:
- AS2: 25 partners
- SFTP: 15 partners
- VAN (Sterling): 8 partners
- Direct Connect: 2 partners

EDI Standards:
- X12 (4010, 5010): 40 partners
- EDIFACT: 10 partners

Document Types:
- 850 Purchase Order: 45 partners
- 855 PO Acknowledgment: 40 partners
- 856 ASN: 42 partners
- 810 Invoice: 38 partners
- 997 Functional Ack: All partners
```

### Step 3: Select Context Files

After saving the problem statement, the context selection appears:

- ✅ **Engineering IQ** (check this for BizTalk migration and code analysis)

You must select at least one context file to continue.

### Step 4: Select Engineering Task Types

Check the relevant task types:

- ✅ Software codebase analysis
- ✅ Security/compliance audit
- ✅ Feature impact analysis

### Step 5: Start Analysis

Click the green **"🚀 Start Analysis"** button.

This will:
- Parse all uploaded files
- Execute web searches for AI solutions
- Discover Azure Integration Services, MuleSoft, Dell Boomi, etc.
- Generate context-aware questions

**Expected time: 2-4 minutes**

### Step 6: Answer Questions

The AI will generate questions in the Conversation panel. Example questions:

1. **"What is your target cloud platform preference?"**
   Answer: `We prefer Azure due to existing Microsoft EA agreement, but open to hybrid solutions.`

2. **"What is your team's current cloud experience level?"**
   Answer: `Limited Azure experience. 2 developers have AZ-204 certification. Most team is BizTalk-focused.`

3. **"What is your budget for the migration project?"**
   Answer: `$500K for migration project, targeting 30% cost reduction in ongoing operations.`

4. **"Are there any compliance requirements?"**
   Answer: `Yes, SOC 2 Type II and PCI-DSS for payment processing integrations.`

5. **"What is the acceptable downtime during migration?"**
   Answer: `Maximum 2 hours per migration phase, prefer zero-downtime cutover for critical trading partners.`

**Tip:** You can click "Skip to POC →" at any time to proceed with current answers.

### Step 7: Generate POC

After answering questions (or skipping), you'll see the POC generation options:

1. **Select POC Format:**
   - 👔 **Business** - Executive summary, workflows, visual diagrams
   - 💻 **Developer** - Technical implementation, code, YAML configs
   - 📚 **Both** - Combined business and developer documents

2. Optionally click **"Add Final Context"** to add any last-minute constraints

3. Click **"🚀 Generate POC"**

**Expected time: 2-3 minutes**

The POC will include:
- Executive Summary
- Current State Analysis
- Recommended Solution (Azure Integration Services)
- Migration Strategy (phased approach)
- Tool Recommendations with code examples
- Timeline and milestones
- Risk assessment

### Step 8: Download POC

After generation:
- Download button appears in the conversation
- Or go to **"📄 POC History"** tab to view/download previous POCs
- Click **"🔄 Regenerate POC"** to create a new version

---

## Quick Test (Minimal Input)

For a faster test, use this minimal setup:

**Problem Statement:**
```
Modernize legacy SOAP web services to REST APIs with AI-powered documentation generation.
```

**Context Files:** ✅ Engineering IQ

**Upload:** A simple text file with:
```
Current System:
- 15 SOAP web services (.NET Framework 4.5)
- WCF-based implementation
- SQL Server backend
- No API documentation
- Manual testing only
```

This simpler test should complete the full workflow in under 5 minutes.

---

## API Testing (curl)

```bash
# 1. Create session
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "BizTalk Migration",
    "branchName": "main",
    "problemStatement": "Migrate BizTalk Server 2016 to Azure Integration Services with AI capabilities"
  }' | jq -r '.sessionId')

echo "Session ID: $SESSION_ID"

# 2. Upload a test file
echo "BizTalk inventory: 200 orchestrations, 50 trading partners, 150K messages/day" > /tmp/test-inventory.txt
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/upload" \
  -F "files=@/tmp/test-inventory.txt"

# 3. Start analysis (with context)
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/agent/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedContexts": ["context_engineering_iq"],
    "engineeringTaskTypes": ["software_analysis", "security_audit"]
  }'

# 4. Get questions (poll until ready)
curl "http://localhost:3000/api/sessions/$SESSION_ID/messages"

# 5. Answer a question
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/ask" \
  -H "Content-Type: application/json" \
  -d '{"message": "We prefer Azure due to existing Microsoft EA agreement"}'

# 6. Generate POC (after answering questions)
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/agent/generate-poc" \
  -H "Content-Type: application/json" \
  -d '{"pocFormat": "business"}'

# 7. Get POCs
curl "http://localhost:3000/api/sessions/$SESSION_ID/pocs"
```
