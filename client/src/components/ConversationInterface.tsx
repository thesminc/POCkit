import { useState, useEffect, useRef } from "react";
import axios from "axios";
import POCHistory from "./POCHistory";
import ConfirmModal from "./ConfirmModal";
import {
  ENGINEERING_TASK_TYPES,
  API_ENDPOINTS,
  POC_FORMATS,
  PocFormatType,
  SSE_EVENTS,
  ToastType,
} from "../constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ConversationInterfaceProps {
  sessionId: string;
}

export default function ConversationInterface({
  sessionId,
}: ConversationInterfaceProps) {
  const [activeTab, setActiveTab] = useState<"conversation" | "history">(
    "conversation"
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [agentActivity, setAgentActivity] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [problemStatement, setProblemStatement] = useState("");
  const [savingProblem, setSavingProblem] = useState(false);
  const [problemStatementSaved, setProblemStatementSaved] = useState(false);
  const [smartFollowupsGenerated, setSmartFollowupsGenerated] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [generatingPOC, setGeneratingPOC] = useState(false);
  const [filesAnalyzed, setFilesAnalyzed] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [progressInfo, setProgressInfo] = useState<{
    answered: number;
    total: number;
  } | null>(null);
  const [generatedPOCId, setGeneratedPOCId] = useState<string | null>(null);
  const [pocFormat, setPocFormat] = useState<PocFormatType>(
    POC_FORMATS.BUSINESS
  );
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [engineeringTaskTypes, setEngineeringTaskTypes] = useState<string[]>(
    []
  );
  const [showTaskTypeSelector, setShowTaskTypeSelector] = useState(false);
  const [showFinalContextModal, setShowFinalContextModal] = useState(false);
  const [finalContext, setFinalContext] = useState("");
  const [availableContexts, setAvailableContexts] = useState<any[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load messages (only once on mount or when sessionId changes)
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) {
        await loadMessages();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource(API_ENDPOINTS.SESSION_EVENTS(sessionId));
    eventSourceRef.current = eventSource;

    // Handle connection established
    eventSource.addEventListener(SSE_EVENTS.CONNECTED, (event) => {
      console.log("SSE connected:", event.data);
    });

    // Handle agents_ready event
    eventSource.addEventListener(SSE_EVENTS.AGENTS_READY, (event) => {
      console.log("Agents ready event received:", event.data);
      const data = JSON.parse(event.data);
      loadMessages(); // Reload messages to show agent suggestions

      // If phase is complete, mark conversation as ready for POC
      if (data.phase === "complete") {
        setAllQuestionsAnswered(true);
        showToast(
          "Agent selection complete! Ready to generate POC.",
          "success"
        );
      }
    });

    // Handle questions_ready event
    eventSource.addEventListener(SSE_EVENTS.QUESTIONS_READY, (event) => {
      console.log("Questions ready event received:", event.data);
      loadMessages(); // Reload messages to show new questions
    });

    // Handle poc_ready event
    eventSource.addEventListener(SSE_EVENTS.POC_READY, (event) => {
      console.log("POC ready event received:", event.data);
      const data = JSON.parse(event.data);
      setGeneratingPOC(false);
      setGeneratedPOCId(data.pocId);
      loadMessages(); // Reload messages to show POC document
      showToast("POC document generated successfully!", "success");
    });

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      // EventSource will automatically try to reconnect
    };

    // Cleanup on unmount
    return () => {
      console.log("Closing SSE connection");
      eventSource.close();
    };
  }, [sessionId]);

  // Load available context files on mount
  useEffect(() => {
    const loadContexts = async () => {
      setLoadingContexts(true);
      try {
        const response = await axios.get(API_ENDPOINTS.CONTEXTS);
        setAvailableContexts(response.data.contexts || []);
      } catch (error) {
        console.error("Failed to load contexts:", error);
        showToast("Failed to load context files", "error");
      } finally {
        setLoadingContexts(false);
      }
    };
    loadContexts();
  }, []);

  // Load existing problem statement and uploaded files
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await axios.get(`/api/sessions/${sessionId}`);
        const session = response.data.session || response.data;

        // Load problem statement
        if (session.problemStatement) {
          setProblemStatement(session.problemStatement);
          setProblemStatementSaved(true);
        }

        // Load selected contexts
        if (session.selectedContexts && session.selectedContexts.length > 0) {
          setSelectedContexts(session.selectedContexts);
        }

        // Load engineering task types
        if (
          session.engineeringTaskTypes &&
          session.engineeringTaskTypes.length > 0
        ) {
          setEngineeringTaskTypes(session.engineeringTaskTypes);
        }

        // Load final context
        if (session.finalContext) {
          setFinalContext(session.finalContext);
        }

        // Load uploaded files from session
        if (session.uploadedFiles && session.uploadedFiles.length > 0) {
          setUploadedFiles(session.uploadedFiles);
        }

        // Check if files have been analyzed (check for analysis results)
        if (session.analysisResults && session.analysisResults.length > 0) {
          setFilesAnalyzed(true);
        }

        // Check if agents have been selected (to restore "ready for POC" state)
        const agentsResponse = await axios.get(`/api/sessions/${sessionId}/agents`);
        if (agentsResponse.data.agents && agentsResponse.data.agents.length > 0) {
          setAllQuestionsAnswered(true);
        }

        // Check if POC has already been generated
        const pocsResponse = await axios.get(`/api/sessions/${sessionId}/pocs`);
        if (pocsResponse.data.pocs && pocsResponse.data.pocs.length > 0) {
          // Get the most recent POC
          setGeneratedPOCId(pocsResponse.data.pocs[0].id);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      }
    };
    loadSession();
  }, [sessionId]);

  // NOTE: Contexts and task types are stored in UI state only
  // They are NOT persisted to the database as the agents don't currently use them
  // If needed in the future, add columns to AnalysisSession schema

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-hide toast after 3 seconds (but keep error messages until manually dismissed)
  useEffect(() => {
    if (toast && toast.type !== "error") {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auto-trigger smart follow-ups after 7 answers
  useEffect(() => {
    // Count user messages (answers)
    const userMessageCount = messages.filter((m) => m.role === "user").length;

    // If user answered 7 questions and haven't generated smart follow-ups yet
    if (
      userMessageCount === 7 &&
      !smartFollowupsGenerated &&
      problemStatementSaved
    ) {
      generateSmartFollowups();
      setSmartFollowupsGenerated(true);
    }
  }, [messages, smartFollowupsGenerated, problemStatementSaved]);

  // Poll agent status while analyzing or generating POC
  // NOTE: SSE provides real-time updates, this is backup polling
  useEffect(() => {
    if (!analyzing && !generatingPOC) {
      setAgentActivity("");
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.AGENT_STATUS(sessionId));
        const { status, agentName } = response.data;

        // Show activity if agent is running
        if (status === 'running' && agentName) {
          const activityMap: Record<string, string> = {
            'file_analysis': '🔍 Analyzing files...',
            'file-analysis-agent': '🔍 Analyzing files...',
            'quick_question': '❓ Generating questions...',
            'poc_generation': '📝 Generating POC...',
            'poc-generation-agent': '📝 Generating POC...',
            'complete-flow-agent': '⚙️ Running complete workflow...'
          };
          setAgentActivity(activityMap[agentName] || `⚙️ ${agentName} running...`);
        } else {
          setAgentActivity("");
        }
      } catch (error) {
        console.error("Failed to poll agent status:", error);
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 5 seconds (reduced from 2s since SSE provides real-time updates)
    const interval = setInterval(pollStatus, 5000);

    return () => clearInterval(interval);
  }, [analyzing, generatingPOC, sessionId]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
  };

  const loadMessages = async () => {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}/messages`);
      // API returns messages array directly (not wrapped in object)
      setMessages(response.data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!currentInput.trim()) return;

    const userMessage = currentInput.trim();
    setCurrentInput("");
    setLoading(true);

    try {
      // Optimistically add user message to UI
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempUserMsg]);

      // Send to backend
      const response = await axios.post(`/api/sessions/${sessionId}/ask`, {
        message: userMessage,
      });

      console.log("Response from backend:", response.data);

      // Update progress if available
      if (response.data.progress) {
        setProgressInfo(response.data.progress);
      }

      // Check if conversation is complete
      if (response.data.isComplete || response.data.allComplete) {
        setAllQuestionsAnswered(true);
        showToast("All questions answered! Ready to generate POC.", "success");
      }

      // If there's a next question, add it to the messages
      if (response.data.nextQuestion) {
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.nextQuestion,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);

        // Show toast if it's a follow-up question
        if (response.data.isFollowUp) {
          showToast("Follow-up question generated based on your answer", "info");
        }
      }

      // Reload messages to ensure sync with database
      // (the optimistic updates above provide instant feedback)
      setTimeout(() => {
        loadMessages();
      }, 500);

      // If backend is processing async work, show toast
      if (
        response.data.nextPhase === "architectural" ||
        response.data.nextPhase === "agent_suggestion"
      ) {
        const phaseMessage =
          response.data.nextPhase === "architectural"
            ? "Generating architectural questions..."
            : "Analyzing your task and suggesting agents...";
        showToast(phaseMessage, "info");
      }

      // Auto-focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
      showToast("Failed to send message", "error");
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    } finally {
      setLoading(false);
    }
  };

  const generatePOC = async () => {
    setGeneratingPOC(true);
    try {
      showToast(
        `Generating ${pocFormat === "business" ? "Business" : "Developer"} POC document using AI agents...`,
        "info"
      );

      // Wait a moment then reload messages to show the "🔨 Generating..." status
      setTimeout(() => {
        loadMessages();
      }, 500);

      // Use agent-based POC generation endpoint with format selection
      const response = await axios.post(API_ENDPOINTS.AGENT_GENERATE_POC(sessionId), {
        pocFormat, // 'business', 'developer', or 'both'
      });

      console.log("POC generation started with format:", pocFormat);

      if (response.data.success) {
        console.log("POC generation started!", response.data);

        // POC generation runs in background - poll for completion
        showToast("POC generation started... This may take 2-3 minutes.", "info");

        // Poll for POC completion
        const pollForPOC = async () => {
          const maxAttempts = 60; // 5 minutes max (5 sec intervals)
          for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            try {
              const pocsResponse = await axios.get(`/api/sessions/${sessionId}/pocs`);
              if (pocsResponse.data.pocs && pocsResponse.data.pocs.length > 0) {
                const latestPoc = pocsResponse.data.pocs[0];
                setGeneratedPOCId(latestPoc.id);
                showToast("POC document generated successfully!", "success");
                await loadMessages();
                setGeneratingPOC(false);
                return;
              }
            } catch (e) {
              console.log("Still waiting for POC...", i + 1);
            }
          }

          // Timeout
          showToast("POC generation timed out. Please try again.", "error");
          setGeneratingPOC(false);
        };

        // Start polling (don't await - let it run in background)
        pollForPOC();
        return; // Exit early, polling will handle the rest
      } else {
        throw new Error(response.data.message || "Failed to generate POC");
      }
    } catch (error: any) {
      console.error("Failed to generate POC:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to generate POC";
      showToast(errorMessage, "error");
      setGeneratingPOC(false); // Only set false on error, polling handles success
    }
  };

  const downloadPOC = async (pocId: string) => {
    try {
      const response = await axios.get(`/api/pocs/${pocId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `POC-${new Date().toISOString().split("T")[0]}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("POC downloaded successfully!", "success");
    } catch (error: any) {
      console.error("Failed to download POC:", error);
      showToast("Failed to download POC", "error");
    }
  };

  const saveProblemStatement = async () => {
    if (!problemStatement.trim()) {
      showToast("Please enter a problem statement", "error");
      return;
    }

    setSavingProblem(true);
    try {
      const response = await axios.patch(
        `/api/sessions/${sessionId}/problem-statement`,
        { problemStatement }
      );

      if (response.data.success) {
        setProblemStatementSaved(true);
        showToast("Problem statement saved successfully!", "success");
      }
    } catch (error) {
      console.error("Failed to save problem statement:", error);
      showToast("Failed to save problem statement", "error");
    } finally {
      setSavingProblem(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await axios.post(
        `/api/sessions/${sessionId}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      showToast(
        `${response.data.files.length} file(s) uploaded successfully`,
        "success"
      );
      setUploadedFiles([...uploadedFiles, ...response.data.files]);
    } catch (error) {
      console.error("Failed to upload files:", error);
      showToast("Failed to upload files", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const analyzeFiles = async () => {
    if (!problemStatementSaved) {
      showToast("Please save your problem statement first", "error");
      return;
    }

    setAnalyzing(true);
    setLoading(true); // Show "Reviewing problem..." indicator
    try {
      // Use agent-based file analysis endpoint with context
      const response = await axios.post(API_ENDPOINTS.AGENT_ANALYZE(sessionId), {
        selectedContexts,
        engineeringTaskTypes,
      });

      console.log("Analysis started with context:", {
        selectedContexts,
        engineeringTaskTypes,
        response: response.data,
      });

      setFilesAnalyzed(true); // Mark files as analyzed
      setLoading(false); // Hide initial loading, but keep analyzing=true

      showToast(
        "Analysis started! This may take 2-4 minutes. You'll see questions when ready.",
        "info"
      );

      // Keep analyzing=true so status polling continues
      // The SSE event handler will set analyzing=false when questions are ready
      // Reload messages periodically to check for new questions
      const checkInterval = setInterval(async () => {
        await loadMessages();
        const hasMessages = messages.length > 0;
        if (hasMessages) {
          clearInterval(checkInterval);
          setAnalyzing(false);
          showToast("Questions are ready!", "success");
        }
      }, 3000); // Check every 3 seconds

      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (analyzing) {
          setAnalyzing(false);
          showToast("Analysis completed. Check for questions above.", "info");
        }
      }, 300000);

    } catch (error: any) {
      console.error("Failed to analyze:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to start analysis";
      showToast(errorMessage, "error");
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const skipToPOC = async () => {
    try {
      showToast("Skipping remaining questions...", "info");

      // Call API to skip remaining questions
      const response = await axios.post(`/api/sessions/${sessionId}/skip-questions`);

      if (response.data.success) {
        setAllQuestionsAnswered(true);
        setProgressInfo(null);
        showToast("Ready to generate POC with current answers!", "success");
      }
    } catch (error: any) {
      console.error("Failed to skip questions:", error);
      showToast("Failed to skip questions", "error");
    }
  };

  const generateSmartFollowups = async () => {
    setLoading(true);
    try {
      showToast("Generating smart follow-up questions...", "info");
      const response = await axios.post(
        `/api/sessions/${sessionId}/generate-followups`
      );

      if (response.data.count > 0) {
        showToast(
          `${response.data.count} smart follow-up questions generated!`,
          "success"
        );
      } else {
        showToast("No follow-up questions needed - great answers!", "success");
      }

      // Reload messages to show the smart questions
      await loadMessages();
    } catch (error: any) {
      console.error("Failed to generate follow-ups:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to generate smart follow-ups";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-protocol-card border border-protocol-border rounded-lg">
        <div className="flex border-b border-protocol-border justify-between items-center">
          <div className="flex">
            <button
              onClick={() => setActiveTab("conversation")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "conversation"
                  ? "border-b-2 border-protocol-primary text-protocol-primary"
                  : "text-protocol-text-secondary hover:text-protocol-text-primary"
              }`}
            >
              💬 Conversation
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-b-2 border-protocol-primary text-protocol-primary"
                  : "text-protocol-text-secondary hover:text-protocol-text-primary"
              }`}
            >
              📄 POC History
            </button>
          </div>
          {activeTab === "conversation" &&
            (messages.length > 0 || filesAnalyzed) && (
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="mr-4 px-4 py-2 text-sm bg-protocol-darker text-protocol-primary rounded-lg hover:bg-protocol-border transition-colors"
              >
                + New Conversation
              </button>
            )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "history" ? (
        <POCHistory sessionId={sessionId} />
      ) : (
        <>
          {/* Row 1: Problem Statement + File Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Problem Statement Section */}
            <div className="p-4 bg-protocol-card border border-protocol-border rounded-lg">
              <h3 className="font-semibold mb-2 text-protocol-text-primary flex items-center">
                Problem Statement{" "}
                <span className="text-protocol-error ml-1">*</span>
              </h3>
              <p className="text-sm text-protocol-text-secondary mb-3">
                Describe what you're trying to accomplish. This helps the AI ask
                relevant questions.
              </p>

              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full px-3 py-2 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-protocol-primary"
                rows={4}
                placeholder="Example: Need to migrate legacy system from on-prem to AWS cloud..."
                disabled={savingProblem}
              />

              <div className="mt-2 flex gap-2">
                <button
                  onClick={saveProblemStatement}
                  disabled={!problemStatement.trim() || savingProblem}
                  className="px-4 py-2 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {savingProblem ? "Saving..." : "Save Problem Statement"}
                </button>
                {problemStatementSaved && (
                  <span className="text-sm text-protocol-success flex items-center">
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="p-4 bg-protocol-card border border-protocol-border rounded-lg">
              <h3 className="font-semibold mb-3 text-protocol-text-primary flex items-center justify-between">
                <span>Problem Statement Support Files (Optional)</span>
                <span className="text-sm font-normal text-protocol-text-muted">
                  You can proceed without files
                </span>
              </h3>

              {/* Drag and Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver
                    ? "border-protocol-primary bg-protocol-darker"
                    : "border-protocol-border bg-protocol-darker"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                <p className="text-protocol-text-secondary mb-2">
                  Drag and drop files here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-protocol-primary hover:underline font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-protocol-text-muted">
                  Supports PDF, DOCX, TXT, and code files
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-protocol-text-primary mb-2">
                    Uploaded Files ({uploadedFiles.length}):
                  </p>
                  <div className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="text-sm text-protocol-text-secondary flex items-center"
                      >
                        <span className="mr-2">📄</span>
                        {file.filename}
                        <span className="ml-2 text-protocol-text-muted">
                          ({(file.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Status */}
              <div className="mt-4 flex gap-2 items-center">
                {uploading && (
                  <span className="text-sm text-protocol-text-secondary flex items-center">
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading files...
                  </span>
                )}
                {uploadedFiles.length > 0 && !uploading && (
                  <span className="text-sm text-protocol-success flex items-center">
                    ✓ {uploadedFiles.length} file(s) uploaded
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Saved Problem Statement Display */}
          {problemStatementSaved && problemStatement && (
            <div className="p-4 bg-protocol-darker border border-protocol-border rounded-lg">
              <h3 className="font-semibold mb-2 text-protocol-text-primary text-sm">
                Your Goal:
              </h3>
              <p className="text-sm text-protocol-text-secondary italic">
                "{problemStatement}"
              </p>
            </div>
          )}

          {/* Context Selection (Step 2 - REQUIRED) */}
          {problemStatementSaved && !filesAnalyzed && (
            <div className="p-4 bg-protocol-card border border-protocol-border rounded-lg">
              <h3 className="font-semibold mb-2 text-protocol-text-primary">
                Select Context Files{" "}
                <span className="text-protocol-error">*</span>
                <span className="text-sm font-normal text-protocol-text-muted ml-2">
                  (Required - Select at least one)
                </span>
              </h3>
              <p className="text-sm text-protocol-text-secondary mb-4">
                Context files provide specialized knowledge and frameworks for
                different types of projects. These guide how the AI analyzes
                your problem and generates questions.
              </p>

              {loadingContexts ? (
                <div className="flex items-center gap-2 text-protocol-text-secondary">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading available contexts...
                </div>
              ) : availableContexts.length === 0 ? (
                <div className="p-4 bg-protocol-darker border border-protocol-border rounded text-protocol-text-secondary text-sm">
                  No context files found in /context folder. Please add .md
                  context files.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableContexts.map((context) => (
                    <label
                      key={context.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedContexts.includes(context.id)
                          ? "bg-protocol-darker border-protocol-primary"
                          : "border-protocol-border hover:bg-protocol-darker"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContexts.includes(context.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContexts([
                              ...selectedContexts,
                              context.id,
                            ]);
                          } else {
                            setSelectedContexts(
                              selectedContexts.filter((id) => id !== context.id)
                            );
                          }
                        }}
                        className="mt-1 w-4 h-4 rounded border-protocol-border text-protocol-primary focus:ring-protocol-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-protocol-text-primary mb-1">
                          {context.title}
                        </div>
                        <div className="text-sm text-protocol-text-secondary">
                          {context.description}
                        </div>
                        <div className="text-xs text-protocol-text-muted mt-1">
                          {context.filename} •{" "}
                          {(context.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedContexts.length > 0 && (
                <div className="mt-3 p-2 bg-protocol-darker rounded border border-protocol-success">
                  <p className="text-sm text-protocol-success flex items-center">
                    ✓ {selectedContexts.length} context file(s) selected
                  </p>
                </div>
              )}

              {selectedContexts.length === 0 &&
                !loadingContexts &&
                availableContexts.length > 0 && (
                  <div className="mt-3 p-2 bg-protocol-darker rounded border border-protocol-error">
                    <p className="text-sm text-protocol-error flex items-center">
                      ⚠️ Please select at least one context file to continue
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Engineering Task Type Selector */}
          {problemStatementSaved && !filesAnalyzed && (
            <div className="p-4 bg-protocol-card border border-protocol-border rounded-lg">
              <h3 className="font-semibold mb-2 text-protocol-text-primary">
                What type of engineering task is this?{" "}
                <span className="text-sm font-normal text-protocol-text-muted">
                  (Select all that apply)
                </span>
              </h3>
              <p className="text-sm text-protocol-text-secondary mb-4">
                This helps the AI tailor questions and recommendations to your
                specific needs.{" "}
                <strong>Select before clicking "Analyze Files".</strong>
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {ENGINEERING_TASK_TYPES.map((taskType) => (
                  <label
                    key={taskType.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-protocol-darker cursor-pointer transition-colors border border-transparent hover:border-protocol-border"
                  >
                    <input
                      type="checkbox"
                      checked={engineeringTaskTypes.includes(taskType.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEngineeringTaskTypes([
                            ...engineeringTaskTypes,
                            taskType.id,
                          ]);
                        } else {
                          setEngineeringTaskTypes(
                            engineeringTaskTypes.filter(
                              (id) => id !== taskType.id
                            )
                          );
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded border-protocol-border text-protocol-primary focus:ring-protocol-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-protocol-text-primary mb-1">
                        {taskType.label}
                      </div>
                      <div className="text-sm text-protocol-text-secondary">
                        {taskType.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Engineering Task Type Display (readonly after analysis) */}
          {problemStatementSaved &&
            filesAnalyzed &&
            engineeringTaskTypes.length > 0 && (
              <div className="p-4 bg-protocol-darker border border-protocol-border rounded-lg">
                <h3 className="font-semibold mb-2 text-protocol-text-primary text-sm flex items-center gap-2">
                  Selected Engineering Task Types:
                  <span className="text-protocol-success text-xs">
                    🔒 Locked
                  </span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {engineeringTaskTypes.map((typeId) => {
                    const taskType = ENGINEERING_TASK_TYPES.find(
                      (t) => t.id === typeId
                    );
                    return taskType ? (
                      <div
                        key={typeId}
                        className="flex items-center gap-2 p-2 bg-protocol-card rounded border border-protocol-border"
                      >
                        <span className="text-protocol-success">✓</span>
                        <span className="text-sm text-protocol-text-primary font-medium">
                          {taskType.label}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-protocol-text-muted mt-2">
                  Task types are locked after analysis. Start a new conversation
                  to change them.
                </p>
              </div>
            )}

          {/* Start Analysis Button (prominent placement after setup) */}
          {problemStatementSaved && !filesAnalyzed && (
            <div className="p-6 bg-protocol-card border-2 border-protocol-primary rounded-lg text-center">
              <h3 className="text-lg font-semibold text-protocol-text-primary mb-2">
                Ready to Start Analysis
              </h3>
              <p className="text-sm text-protocol-text-secondary mb-4">
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} file(s) uploaded and ready to analyze`
                  : "You can start without files - the AI will ask tailored questions"}
              </p>
              <button
                onClick={analyzeFiles}
                disabled={
                  analyzing ||
                  !problemStatementSaved ||
                  selectedContexts.length === 0
                }
                className="px-8 py-3 bg-protocol-success text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
              >
                {analyzing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Starting Analysis...
                  </span>
                ) : (
                  `🚀 Start Analysis ${uploadedFiles.length > 0 ? `(${uploadedFiles.length} files)` : ""}`
                )}
              </button>
              {selectedContexts.length === 0 && (
                <p className="text-sm text-protocol-error mt-2 text-center">
                  Please select at least one context file above
                </p>
              )}
            </div>
          )}

          {/* Row 2: Conversation (Full Width) */}
          <div className="bg-protocol-card border border-protocol-border rounded-lg">
            <div className="p-4 border-b border-protocol-border">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-protocol-text-primary">
                    Conversation
                  </h3>
                  <p className="text-sm text-protocol-text-muted">
                    Answer the AI's questions below
                  </p>
                </div>
                {progressInfo && !allQuestionsAnswered && (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-protocol-text-secondary mb-1">
                        {progressInfo.total - progressInfo.asked > 0
                          ? `${progressInfo.total - progressInfo.asked} questions remaining`
                          : "Final question"}
                      </div>
                      <div className="w-32 bg-protocol-darker rounded-full h-2">
                        <div
                          className="bg-protocol-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(progressInfo.asked / progressInfo.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={skipToPOC}
                      className="px-3 py-1 text-sm bg-protocol-darker text-protocol-text-secondary border border-protocol-border rounded hover:bg-protocol-border hover:text-protocol-text-primary transition-colors"
                      title="Skip remaining questions and generate POC with current answers"
                    >
                      Skip to POC →
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-protocol-text-muted py-8">
                  <p>
                    Save your problem statement and click "Start Conversation"
                    to begin!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-2xl px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-protocol-primary text-white"
                          : msg.content.endsWith("?")
                            ? "bg-protocol-darker text-protocol-text-primary border-l-4 border-protocol-info"
                            : msg.content.startsWith(
                                  "📄 **Proof of Concept Document**"
                                )
                              ? "bg-protocol-darker text-protocol-text-primary border-l-4 border-protocol-success"
                              : msg.content.startsWith("🤖")
                                ? "bg-protocol-darker text-protocol-text-primary border-l-4 border-protocol-primary animate-pulse"
                                : "bg-protocol-darker text-protocol-text-primary"
                      }`}
                    >
                      <p className="whitespace-pre-wrap flex items-center gap-2">
                        {msg.content.startsWith("🤖") && (
                          <span className="inline-block">
                            <svg
                              className="animate-spin h-4 w-4 text-protocol-primary"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </span>
                        )}
                        {msg.content}
                      </p>
                      {/* Show download button for POC messages */}
                      {msg.role === "assistant" &&
                        msg.content.startsWith(
                          "📄 **Proof of Concept Document**"
                        ) &&
                        generatedPOCId && (
                          <div className="mt-4 pt-4 border-t border-protocol-border">
                            <button
                              onClick={() => downloadPOC(generatedPOCId)}
                              className="px-4 py-2 bg-protocol-success text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              📥 Download POC (.md)
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-2xl px-4 py-2 rounded-lg bg-protocol-darker text-protocol-text-primary">
                    <p className="flex items-center gap-2">
                      <span className="animate-pulse">●</span>
                      <span
                        className="animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      >
                        ●
                      </span>
                      <span
                        className="animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      >
                        ●
                      </span>
                      <span className="ml-2">
                        {agentActivity || "Reviewing problem..."}
                      </span>
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="p-4 border-t border-protocol-border">
              {allQuestionsAnswered && !generatedPOCId ? (
                /* Show Generate POC Button (only if POC hasn't been generated yet) */
                <div className="text-center">
                  <p className="text-protocol-success mb-4">
                    ✅ All questions answered! Ready to generate your Proof of
                    Concept.
                  </p>

                  {/* POC Format Selector */}
                  <div className="mb-4 inline-flex rounded-lg border border-protocol-border bg-protocol-card p-1">
                    <button
                      onClick={() => setPocFormat("business")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        pocFormat === "business"
                          ? "bg-protocol-primary text-white"
                          : "text-protocol-text-secondary hover:bg-protocol-darker"
                      }`}
                    >
                      👔 Business
                    </button>
                    <button
                      onClick={() => setPocFormat("developer")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        pocFormat === "developer"
                          ? "bg-protocol-primary text-white"
                          : "text-protocol-text-secondary hover:bg-protocol-darker"
                      }`}
                    >
                      💻 Developer
                    </button>
                    <button
                      onClick={() => setPocFormat("both")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        pocFormat === "both"
                          ? "bg-protocol-primary text-white"
                          : "text-protocol-text-secondary hover:bg-protocol-darker"
                      }`}
                    >
                      📚 Both
                    </button>
                  </div>

                  <p className="text-sm text-protocol-text-secondary mb-4">
                    {pocFormat === "business"
                      ? "Business-focused with executive summary, workflows, and visual diagrams"
                      : pocFormat === "developer"
                        ? "Technical implementation guide with code, YAML configs, and setup instructions"
                        : "Combined business and developer POC documents"}
                  </p>

                  <div className="flex gap-3 justify-center items-center">
                    <button
                      onClick={() => setShowFinalContextModal(true)}
                      className="px-6 py-3 bg-protocol-darker text-protocol-primary rounded-lg hover:bg-protocol-border transition-colors font-medium text-lg border border-protocol-border"
                    >
                      Add Final Context
                    </button>
                    <button
                      onClick={generatePOC}
                      disabled={generatingPOC}
                      className="px-8 py-3 bg-protocol-success text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                    >
                      {generatingPOC ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          {agentActivity || "Generating POC..."}
                        </span>
                      ) : (
                        `🚀 Generate POC`
                      )}
                    </button>
                  </div>
                </div>
              ) : allQuestionsAnswered && generatedPOCId ? (
                /* Show completion message after POC is generated with regenerate option */
                <div className="text-center">
                  <p className="text-protocol-primary mb-2">
                    ✅ POC document generated successfully!
                  </p>
                  <p className="text-sm text-protocol-text-secondary mb-4">
                    Check the "📄 POC History" tab to download your document.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        // Reset POC ID to show the generate button again
                        setGeneratedPOCId(null);
                        showToast("Ready to regenerate POC with current analysis", "info");
                      }}
                      className="px-6 py-2 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover transition-colors"
                    >
                      🔄 Regenerate POC
                    </button>
                  </div>
                </div>
              ) : (
                /* Show Input Field */
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef as any}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter without Shift = Send
                        // Shift+Enter = New line
                        if (e.key === "Enter" && !e.shiftKey && !loading) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your answer or question... (Shift+Enter for new line)"
                      className="w-full px-4 py-3 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-protocol-primary resize-none"
                      rows={3}
                      disabled={loading}
                    />
                    <p className="text-xs text-protocol-text-muted mt-1 ml-1">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={loading || !currentInput.trim()}
                    className="px-6 py-3 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover disabled:bg-protocol-text-disabled disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? "Sending..." : "Send"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-4 right-4 z-50 animate-fade-in">
              <div
                className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
                  toast.type === "success"
                    ? "bg-protocol-success text-white"
                    : toast.type === "error"
                      ? "bg-protocol-error text-white"
                      : "bg-protocol-primary text-white"
                }`}
              >
                <span className="text-lg">
                  {toast.type === "success"
                    ? "✓"
                    : toast.type === "error"
                      ? "✗"
                      : "ℹ"}
                </span>
                <span className="text-sm font-medium">{toast.message}</span>
                <button
                  onClick={() => setToast(null)}
                  className="ml-2 text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* New Conversation Confirmation Modal */}
      <ConfirmModal
        isOpen={showNewConversationModal}
        title="Start New Conversation?"
        message="This will keep your current problem statement and uploaded files, but start a fresh conversation with no messages."
        confirmText="Start New"
        cancelText="Cancel"
        variant="primary"
        onConfirm={() => {
          setShowNewConversationModal(false);
          window.location.href = window.location.href + "?new=true";
        }}
        onCancel={() => setShowNewConversationModal(false)}
      />

      {/* Final Context Modal */}
      {showFinalContextModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowFinalContextModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-protocol-card border border-protocol-border rounded-lg shadow-xl max-w-2xl w-full p-6">
              {/* Title */}
              <h3 className="text-xl font-semibold text-protocol-text-primary mb-3">
                Add Final Context
              </h3>

              {/* Description */}
              <p className="text-protocol-text-secondary mb-4">
                Would you like to add any additional context before generating
                the POC? This could include constraints, preferences, or any
                other important details.
              </p>

              {/* Textarea */}
              <textarea
                value={finalContext}
                onChange={(e) => setFinalContext(e.target.value)}
                className="w-full px-4 py-3 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-protocol-primary mb-4"
                rows={6}
                placeholder="Example: Must use AWS services only, need to support 10,000 concurrent users, prefer React over Angular, etc."
              />

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setFinalContext("");
                    setShowFinalContextModal(false);
                  }}
                  className="px-4 py-2 bg-protocol-darker text-protocol-text-primary rounded-lg hover:bg-protocol-border transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    setShowFinalContextModal(false);
                    // NOTE: finalContext is stored in UI state only
                    // If agents need it in the future, pass it as a parameter to the POC generation endpoint
                    generatePOC();
                  }}
                  className="px-6 py-2 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover transition-colors"
                >
                  Continue to Generate POC
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
