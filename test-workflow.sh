#!/bin/bash
# Integration test for AICT POC generation workflow

API_BASE="http://localhost:3000/api"

echo "=== AICT Integration Test ==="
echo ""

# Step 1: Create session
echo "Step 1: Creating session..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/poc/sessions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Project",
    "branchName": "main",
    "problemStatement": "Migrate BizTalk integration platform to cloud with AI automation"
  }')

echo "Create response: $CREATE_RESPONSE"
SESSION_ID=$(echo "$CREATE_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "Session ID: $SESSION_ID"
echo ""

if [ -z "$SESSION_ID" ]; then
  echo "ERROR: Failed to create session"
  exit 1
fi

# Step 2: Upload a test file
echo "Step 2: Uploading test file..."
echo "BizTalk Architecture

Our current BizTalk environment includes:
- 48 orchestrations for EDI processing
- SQL Server 2016 databases
- Message volumes: 10,000 messages/day peak
- HIPAA compliance required
- Integration with SAP, Salesforce, legacy mainframe

Current challenges:
- High maintenance costs
- Difficulty finding BizTalk developers
- Scalability concerns

Target: Cloud-native solution with AI capabilities for intelligent routing and transformation." > /tmp/test_context.txt

UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/poc/sessions/$SESSION_ID/upload" \
  -F "files=@/tmp/test_context.txt")

echo "Upload response: $UPLOAD_RESPONSE"
echo ""

# Step 3: Generate questions
echo "Step 3: Generating questions..."
START_TIME=$(date +%s)
QUESTIONS_RESPONSE=$(curl -s -X POST "$API_BASE/poc/sessions/$SESSION_ID/questions")
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Questions generated in $DURATION seconds"
echo "Response: $QUESTIONS_RESPONSE"
echo ""

if [ $DURATION -gt 30 ]; then
  echo "WARNING: Question generation took longer than 30 seconds!"
fi

# Step 4: Get questions
echo "Step 4: Getting questions..."
GET_QUESTIONS_RESPONSE=$(curl -s "$API_BASE/poc/sessions/$SESSION_ID/questions")
echo "Questions: $GET_QUESTIONS_RESPONSE"
echo ""

# Extract first question ID
QUESTION_ID=$(echo "$GET_QUESTIONS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "First question ID: $QUESTION_ID"

# Step 5: Answer a question
if [ -n "$QUESTION_ID" ]; then
  echo "Step 5: Answering first question..."
  ANSWER_RESPONSE=$(curl -s -X POST "$API_BASE/poc/sessions/$SESSION_ID/questions/$QUESTION_ID/answer" \
    -H "Content-Type: application/json" \
    -d '{"answer": "We prefer a phased migration approach with parallel running for 3 months"}')

  echo "Answer response: $ANSWER_RESPONSE"
  echo ""
fi

# Step 6: Get session status
echo "Step 6: Checking session status..."
SESSION_STATUS=$(curl -s "$API_BASE/poc/sessions/$SESSION_ID")
echo "Session status: $SESSION_STATUS"
echo ""

echo "=== Integration Test Complete ==="
echo ""
echo "Summary:"
echo "- Session created: $SESSION_ID"
echo "- File uploaded: test_context.txt"
echo "- Questions generated in: ${DURATION}s (target: <30s)"
echo ""
echo "Next steps to test manually:"
echo "- Run file analysis: curl -X POST $API_BASE/poc/sessions/$SESSION_ID/analyze"
echo "- Generate POC: curl -X POST $API_BASE/poc/sessions/$SESSION_ID/generate-poc"
echo "- Get POC: curl $API_BASE/poc/sessions/$SESSION_ID/poc"
