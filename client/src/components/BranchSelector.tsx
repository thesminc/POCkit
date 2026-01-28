import React, { useState, useEffect } from "react";

interface Branch {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  parentBranchId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BranchSelectorProps {
  projectId: string;
  currentBranchId: string | null;
  onBranchChange: (branchId: string) => void;
}

export default function BranchSelector({
  projectId,
  currentBranchId,
  onBranchChange,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchDescription, setNewBranchDescription] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  useEffect(() => {
    loadBranches();
  }, [projectId]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/branches`);
      const data = await response.json();

      if (data.success) {
        setBranches(data.branches);
      } else {
        setError(data.error || "Failed to load branches");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) {
      alert("Branch name is required");
      return;
    }

    try {
      setCreatingBranch(true);
      const response = await fetch(`/api/projects/${projectId}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranchName,
          description: newBranchDescription || null,
          parentBranchId: currentBranchId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBranches([...branches, data.branch]);
        setShowCreateModal(false);
        setNewBranchName("");
        setNewBranchDescription("");
        onBranchChange(data.branch.id);
      } else {
        alert(data.error || "Failed to create branch");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingBranch(false);
    }
  };

  const deleteBranch = async (branchId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this branch? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setBranches(branches.filter((b) => b.id !== branchId));
        if (currentBranchId === branchId) {
          // Switch to first available branch
          const remainingBranches = branches.filter((b) => b.id !== branchId);
          if (remainingBranches.length > 0) {
            onBranchChange(remainingBranches[0].id);
          }
        }
      } else {
        alert(data.error || "Failed to delete branch");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentBranch = branches.find((b) => b.id === currentBranchId);

  if (loading) {
    return (
      <div className="bg-protocol-card border border-protocol-border rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-protocol-darker rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-protocol-darker rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-protocol-darker border border-protocol-error rounded-lg p-4">
        <p className="text-protocol-error">Error loading branches: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-protocol-card border border-protocol-border rounded-lg shadow">
      {/* What is a Branch? Info */}
      <div className="p-4 bg-protocol-darker border-b border-protocol-border">
        <h3 className="text-sm font-semibold text-protocol-text-primary mb-2">
          💡 What is a Branch?
        </h3>
        <p className="text-sm text-protocol-text-secondary">
          A <strong>branch</strong> is a separate workspace where you can
          explore different POC approaches without affecting your other work.
          Each branch maintains its own analysis sessions, uploaded files, and
          generated POCs.
        </p>
        <p className="text-sm text-protocol-text-secondary mt-2">
          <strong>Use cases:</strong> Compare cloud vs. on-prem solutions,
          explore different architectures (monolithic vs. microservices), or
          test alternative technology stacks side-by-side.
        </p>
      </div>

      {/* Branch Selector and List - Side by Side */}
      <div className="flex gap-4 p-4">
        {/* Left: Current Branch Selector */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-protocol-text-secondary mb-2">
            Current Branch
          </label>
          <div className="flex items-center gap-2 mb-4">
            <select
              value={currentBranchId || ""}
              onChange={(e) => onBranchChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-md shadow-sm focus:outline-none focus:ring-protocol-primary focus:border-protocol-primary"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                  {branch.description ? ` - ${branch.description}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-protocol-primary text-white rounded-md hover:bg-protocol-primary-hover focus:outline-none focus:ring-2 focus:ring-protocol-primary whitespace-nowrap"
            >
              New Branch
            </button>
          </div>

          {/* Branch Details */}
          {currentBranch && (
            <div>
              <h3 className="text-lg font-semibold text-protocol-text-primary mb-2">
                {currentBranch.name}
              </h3>
              {currentBranch.description && (
                <p className="text-sm text-protocol-text-secondary mb-3">
                  {currentBranch.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-protocol-text-muted">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(currentBranch.createdAt).toLocaleDateString()}
                </div>
                {currentBranch.parentBranchId && (
                  <div>
                    <span className="font-medium">Parent:</span>{" "}
                    {branches.find((b) => b.id === currentBranch.parentBranchId)
                      ?.name || "Unknown"}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => deleteBranch(currentBranch.id)}
                  className="px-3 py-1 text-sm bg-protocol-error text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-protocol-error"
                >
                  Delete Branch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: All Branches List */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-protocol-text-secondary mb-2">
            All Branches
          </h4>
          <div className="space-y-2">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  branch.id === currentBranchId
                    ? "bg-protocol-darker border border-protocol-primary"
                    : "bg-protocol-darker border border-protocol-border hover:bg-protocol-border"
                }`}
                onClick={() => onBranchChange(branch.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-protocol-text-primary">{branch.name}</p>
                    {branch.description && (
                      <p className="text-sm text-protocol-text-secondary mt-1">
                        {branch.description}
                      </p>
                    )}
                  </div>
                  {branch.id === currentBranchId && (
                    <span className="ml-2 px-2 py-1 text-xs bg-protocol-primary text-white rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-protocol-card border border-protocol-border rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-protocol-text-primary mb-4">
              Create New Branch
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-protocol-text-secondary mb-2">
                Branch Name <span className="text-protocol-error">*</span>
              </label>
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBranchName.trim() && !creatingBranch) {
                    createBranch();
                  }
                }}
                className="block w-full px-3 py-2 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-md shadow-sm focus:outline-none focus:ring-protocol-primary focus:border-protocol-primary"
                placeholder="e.g., cloud-native-approach"
                disabled={creatingBranch}
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-protocol-text-secondary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={newBranchDescription}
                onChange={(e) => setNewBranchDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && newBranchName.trim() && !creatingBranch) {
                    createBranch();
                  }
                }}
                rows={3}
                className="block w-full px-3 py-2 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-md shadow-sm focus:outline-none focus:ring-protocol-primary focus:border-protocol-primary"
                placeholder="Describe the purpose of this branch..."
                disabled={creatingBranch}
              />
              <p className="text-xs text-protocol-text-muted mt-1">
                Press Ctrl+Enter to submit
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBranchName("");
                  setNewBranchDescription("");
                }}
                className="px-4 py-2 text-protocol-text-secondary bg-protocol-darker rounded-md hover:bg-protocol-border focus:outline-none focus:ring-2 focus:ring-protocol-border"
                disabled={creatingBranch}
              >
                Cancel
              </button>
              <button
                onClick={createBranch}
                className="px-4 py-2 bg-protocol-primary text-white rounded-md hover:bg-protocol-primary-hover focus:outline-none focus:ring-2 focus:ring-protocol-primary disabled:opacity-50"
                disabled={creatingBranch || !newBranchName.trim()}
              >
                {creatingBranch ? "Creating..." : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
