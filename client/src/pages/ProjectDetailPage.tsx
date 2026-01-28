import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BranchSelector from "../components/BranchSelector";
import BranchComparison from "../components/BranchComparison";
import ConversationInterface from "../components/ConversationInterface";
import POCViewer from "../components/POCViewer";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

type Tab = "analysis" | "branches" | "compare" | "poc";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("analysis");
  const [compareBranchId, setCompareBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (currentBranchId) {
      loadOrCreateSession();
    }
  }, [currentBranchId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
      } else {
        alert("Project not found");
        navigate("/projects");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateSession = async () => {
    if (!currentBranchId || !projectId) return;

    try {
      // Check if user wants to force a new conversation
      const urlParams = new URLSearchParams(window.location.search);
      const forceNew = urlParams.get("new") === "true";

      // If forceNew, clear the URL parameter
      if (forceNew) {
        window.history.replaceState({}, "", window.location.pathname);
      }

      // Get or create a session for this branch
      const response = await fetch(`/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId,
          branchId: currentBranchId,
          forceNew: forceNew, // Tell backend to create new session if true
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSessionId(data.session.id);
      } else {
        console.error("Failed to create session:", data.error);
        alert("Failed to create session: " + (data.message || data.error));
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      alert("Failed to create session. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-protocol-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-protocol-text-primary">
        Project not found
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/projects")}
          className="text-protocol-primary hover:text-protocol-primary-hover mb-2 flex items-center"
        >
          ← Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-protocol-text-primary">
          {project.name}
        </h1>
        {project.description && (
          <p className="text-protocol-text-secondary mt-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Branch Selector */}
      <div className="mb-6">
        <BranchSelector
          projectId={projectId!}
          currentBranchId={currentBranchId}
          onBranchChange={setCurrentBranchId}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-protocol-border mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "analysis"
                ? "border-b-2 border-protocol-primary text-protocol-primary"
                : "text-protocol-text-muted hover:text-protocol-text-secondary"
            }`}
          >
            Analysis & Q&A
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "branches"
                ? "border-b-2 border-protocol-primary text-protocol-primary"
                : "text-protocol-text-muted hover:text-protocol-text-secondary"
            }`}
          >
            Branch Management
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "compare"
                ? "border-b-2 border-protocol-primary text-protocol-primary"
                : "text-protocol-text-muted hover:text-protocol-text-secondary"
            }`}
          >
            Compare Branches
          </button>
          {/* POC tab hidden - POCs are generated in the conversation */}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "analysis" && currentSessionId && (
        <div className="space-y-4">
          {/* Main Content Area */}
          <ConversationInterface sessionId={currentSessionId} />
        </div>
      )}

      {activeTab === "branches" && (
        <div className="max-w-4xl">
          <h2 className="text-xl font-semibold text-protocol-text-primary mb-4">
            Branch Management
          </h2>
          <p className="text-protocol-text-secondary mb-6">
            Branches allow you to explore multiple POC approaches in parallel.
            Create a new branch to try different recommendations without losing
            your current work.
          </p>
          {/* BranchSelector already shown above */}
          <div className="bg-protocol-darker border border-protocol-border rounded-lg p-4">
            <p className="text-sm text-protocol-text-secondary">
              💡 <strong>Tip:</strong> Use branches to compare different
              architectural approaches (e.g., monolithic vs. microservices,
              on-prem vs. cloud).
            </p>
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div>
          <h2 className="text-xl font-semibold text-protocol-text-primary mb-4">
            Compare Branches
          </h2>
          {!compareBranchId && (
            <div className="bg-protocol-card border border-protocol-border rounded-lg shadow p-6">
              <p className="text-protocol-text-secondary mb-4">
                Select a second branch to compare with the current branch
              </p>
              <BranchSelector
                projectId={projectId!}
                currentBranchId={compareBranchId}
                onBranchChange={setCompareBranchId}
              />
            </div>
          )}
          {currentBranchId &&
            compareBranchId &&
            currentBranchId !== compareBranchId && (
              <BranchComparison
                projectId={projectId!}
                branch1Id={currentBranchId}
                branch2Id={compareBranchId}
              />
            )}
        </div>
      )}

      {activeTab === "poc" && currentBranchId && (
        <div>
          <h2 className="text-xl font-semibold text-protocol-text-primary mb-4">
            Proof of Concept Document
          </h2>
          <POCViewer branchId={currentBranchId} />
        </div>
      )}

      {!currentSessionId && activeTab === "analysis" && (
        <div className="bg-protocol-darker border border-protocol-border rounded-lg p-6 text-center">
          <p className="text-protocol-text-primary">
            Please select a branch to start analysis
          </p>
        </div>
      )}
    </div>
  );
}
