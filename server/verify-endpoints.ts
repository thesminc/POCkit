/**
 * Endpoint Verification Script
 * Tests all 34 API endpoints identified from client analysis
 */

interface EndpointTest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requiresData?: boolean;
  setupRequired?: boolean;
}

const BASE_URL = 'http://localhost:3000';

// Test data to be created
let testProjectId = '';
let testBranchId = '';
let testSessionId = '';
let testPocId = '';
let testExecutionId = '';

const endpoints: EndpointTest[] = [
  // ===== PROJECTS (4 endpoints) =====
  { method: 'GET', path: '/api/projects', description: 'List all projects' },
  { method: 'POST', path: '/api/projects', description: 'Create new project', requiresData: true },
  { method: 'PATCH', path: '/api/projects/:projectId', description: 'Update project', setupRequired: true },
  { method: 'DELETE', path: '/api/projects/:projectId', description: 'Delete project', setupRequired: true },

  // ===== BRANCHES (6 endpoints) =====
  { method: 'GET', path: '/api/projects/:projectId/branches', description: 'List branches for project', setupRequired: true },
  { method: 'POST', path: '/api/projects/:projectId/branches', description: 'Create new branch', setupRequired: true, requiresData: true },
  { method: 'GET', path: '/api/branches/:branchId', description: 'Get branch details', setupRequired: true },
  { method: 'PATCH', path: '/api/branches/:branchId', description: 'Update branch', setupRequired: true },
  { method: 'GET', path: '/api/branches/:branchId/compare', description: 'Compare branch with default', setupRequired: true },
  { method: 'POST', path: '/api/branches/:branchId/generate-poc', description: 'Generate POC for branch', setupRequired: true },

  // ===== SESSIONS (11 endpoints) =====
  { method: 'POST', path: '/api/sessions', description: 'Create/get session for branch', requiresData: true, setupRequired: true },
  { method: 'GET', path: '/api/sessions/:id', description: 'Get session details', setupRequired: true },
  { method: 'PATCH', path: '/api/sessions/:id', description: 'Update session', setupRequired: true },
  { method: 'PATCH', path: '/api/sessions/:id/problem-statement', description: 'Update problem statement', setupRequired: true },
  { method: 'POST', path: '/api/sessions/:id/upload', description: 'Upload files to session', setupRequired: true },
  { method: 'GET', path: '/api/sessions/:id/questions', description: 'Get session questions', setupRequired: true },
  { method: 'GET', path: '/api/sessions/:id/analysis', description: 'Get analysis results', setupRequired: true },
  { method: 'GET', path: '/api/sessions/:id/ai-solutions', description: 'Get AI solution recommendations', setupRequired: true },
  { method: 'GET', path: '/api/sessions/:id/agents', description: 'Get agent executions', setupRequired: true },
  { method: 'GET', path: '/api/sessions/:id/messages', description: 'Get conversation messages', setupRequired: true },
  { method: 'DELETE', path: '/api/sessions/:id', description: 'Delete session', setupRequired: true },

  // ===== AGENT ORCHESTRATION (5 endpoints) =====
  { method: 'POST', path: '/api/agents/sessions/:sessionId/analyze', description: 'Trigger file analysis', setupRequired: true },
  { method: 'POST', path: '/api/agents/sessions/:sessionId/generate-poc', description: 'Trigger POC generation', setupRequired: true },
  { method: 'GET', path: '/api/agents/sessions/:sessionId/status', description: 'Get agent status', setupRequired: true },
  { method: 'GET', path: '/api/agents/sessions/:sessionId/stats', description: 'Get agent execution stats', setupRequired: true },
  { method: 'GET', path: '/api/agents/sessions/:sessionId', description: 'Get agent executions', setupRequired: true },

  // ===== POCS (5 endpoints) =====
  { method: 'GET', path: '/api/sessions/:sessionId/pocs', description: 'Get POCs for session', setupRequired: true },
  { method: 'GET', path: '/api/pocs/:pocId', description: 'Get POC details', setupRequired: true },
  { method: 'PATCH', path: '/api/pocs/:pocId', description: 'Update POC', setupRequired: true },
  { method: 'GET', path: '/api/pocs/:pocId/download', description: 'Download POC as markdown', setupRequired: true },
  { method: 'POST', path: '/api/pocs/:pocId/export', description: 'Export POC (PPTX/PDF)', setupRequired: true },

  // ===== CONTEXTS (1 endpoint) =====
  { method: 'GET', path: '/api/contexts', description: 'List available context files' },
];

async function testEndpoint(endpoint: EndpointTest): Promise<{ success: boolean; status: number; message: string }> {
  try {
    // Replace path parameters with test IDs
    let path = endpoint.path
      .replace(':projectId', testProjectId)
      .replace(':branchId', testBranchId)
      .replace(':sessionId', testSessionId)
      .replace(':id', testSessionId)
      .replace(':pocId', testPocId)
      .replace(':executionId', testExecutionId);

    const url = `${BASE_URL}${path}`;
    const options: RequestInit = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
    };

    // Add minimal test data for POST/PATCH requests
    if (endpoint.requiresData) {
      if (endpoint.path.includes('/projects') && endpoint.method === 'POST') {
        options.body = JSON.stringify({ name: 'Test Project', description: 'Verification test' });
      } else if (endpoint.path.includes('/branches') && endpoint.method === 'POST') {
        options.body = JSON.stringify({ name: 'test-branch', description: 'Test branch' });
      } else if (endpoint.path.includes('/sessions') && endpoint.method === 'POST') {
        options.body = JSON.stringify({ branchId: testBranchId });
      }
    }

    const response = await fetch(url, options);
    const data: any = await response.json();

    if (response.ok) {
      return { success: true, status: response.status, message: 'OK' };
    } else {
      return { success: false, status: response.status, message: data.message || data.error || 'Unknown error' };
    }
  } catch (error: any) {
    return { success: false, status: 0, message: error.message };
  }
}

async function setupTestData() {
  console.log('\n🔧 Setting up test data...\n');

  // Create test project
  const projectRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Verification Test Project', description: 'Auto-generated for endpoint testing' }),
  });
  const projectData: any = await projectRes.json();
  testProjectId = projectData.project?.id;
  console.log(`✓ Created test project: ${testProjectId}`);

  // Create test branch
  const branchRes = await fetch(`${BASE_URL}/api/projects/${testProjectId}/branches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test-verification-branch', description: 'Test branch' }),
  });
  const branchData: any = await branchRes.json();
  testBranchId = branchData.branch?.id;
  console.log(`✓ Created test branch: ${testBranchId}`);

  // Create test session
  const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branchId: testBranchId }),
  });
  const sessionData: any = await sessionRes.json();
  testSessionId = sessionData.session?.id;
  console.log(`✓ Created test session: ${testSessionId}`);

  console.log();
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...\n');

  // Delete test session
  if (testSessionId) {
    await fetch(`${BASE_URL}/api/sessions/${testSessionId}`, { method: 'DELETE' });
    console.log(`✓ Deleted test session`);
  }

  // Delete test project (cascades to branches)
  if (testProjectId) {
    await fetch(`${BASE_URL}/api/projects/${testProjectId}`, { method: 'DELETE' });
    console.log(`✓ Deleted test project`);
  }

  console.log();
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  AICT API Endpoint Verification');
  console.log('  Testing 34 endpoints identified from client analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await setupTestData();

  const results: { endpoint: string; status: string; message: string }[] = [];
  let successCount = 0;
  let failCount = 0;

  console.log('🧪 Testing endpoints...\n');

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    const statusIcon = result.success ? '✅' : '❌';
    const statusText = result.success ? 'OK' : 'FAIL';

    results.push({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status: statusText,
      message: result.message,
    });

    console.log(`${statusIcon} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(50)} [${result.status}] ${result.message}`);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await cleanupTestData();

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Endpoints:    ${endpoints.length}`);
  console.log(`   ✅ Working:         ${successCount}`);
  console.log(`   ❌ Failed:          ${failCount}`);
  console.log(`   Success Rate:       ${((successCount / endpoints.length) * 100).toFixed(1)}%\n`);

  // Group failures by type
  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log('❌ FAILED ENDPOINTS:\n');
    failures.forEach(f => {
      console.log(`   ${f.endpoint}`);
      console.log(`      → ${f.message}\n`);
    });
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
