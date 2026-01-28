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

interface FindingSummary {
  type: string;
  value: string;
  confidence: number;
  sourceReference: string;
}

interface FindingConflict {
  type: string;
  branch1Value: string;
  branch2Value: string;
  branch1Confidence: number;
  branch2Confidence: number;
}

interface BranchComparisonData {
  branch1: Branch;
  branch2: Branch;
  sessionDifferences: {
    branch1Only: number;
    branch2Only: number;
    common: number;
  };
  findingDifferences: {
    branch1Only: FindingSummary[];
    branch2Only: FindingSummary[];
    common: FindingSummary[];
    conflicts: FindingConflict[];
  };
}

interface BranchComparisonProps {
  projectId: string;
  branch1Id: string;
  branch2Id: string;
}

export default function BranchComparison({
  projectId,
  branch1Id,
  branch2Id,
}: BranchComparisonProps) {
  const [comparison, setComparison] = useState<BranchComparisonData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"conflicts" | "unique" | "common">(
    "conflicts"
  );

  useEffect(() => {
    loadComparison();
  }, [branch1Id, branch2Id]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/branches/${branch1Id}/compare/${branch2Id}`
      );
      const data = await response.json();

      if (data.success) {
        setComparison(data.comparison);
      } else {
        setError(data.error || "Failed to compare branches");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-protocol-success bg-protocol-darker border border-protocol-success";
    if (confidence >= 0.7) return "text-protocol-warning bg-protocol-darker border border-protocol-warning";
    if (confidence >= 0.5) return "text-protocol-warning bg-protocol-darker border border-protocol-warning";
    return "text-protocol-error bg-protocol-darker border border-protocol-error";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    if (confidence >= 0.5) return "Low";
    return "Very Low";
  };

  if (loading) {
    return (
      <div className="bg-protocol-card rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-protocol-border rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-protocol-border rounded w-full mb-2"></div>
          <div className="h-4 bg-protocol-border rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-protocol-border rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-protocol-darker border border-protocol-error rounded-lg p-6">
        <p className="text-protocol-error">Error loading comparison: {error}</p>
        <button
          onClick={loadComparison}
          className="mt-4 px-4 py-2 bg-protocol-error text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="bg-protocol-darker border border-protocol-border rounded-lg p-6">
        <p className="text-protocol-text-secondary">No comparison data available</p>
      </div>
    );
  }

  const { branch1, branch2, sessionDifferences, findingDifferences } =
    comparison;
  const hasConflicts = findingDifferences.conflicts.length > 0;

  return (
    <div className="bg-protocol-card rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-protocol-border">
        <h2 className="text-2xl font-bold text-protocol-text-primary mb-4">
          Branch Comparison
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-protocol-darker border border-protocol-primary rounded-lg p-4">
            <h3 className="font-semibold text-protocol-primary">{branch1.name}</h3>
            {branch1.description && (
              <p className="text-sm text-protocol-text-secondary mt-1">
                {branch1.description}
              </p>
            )}
          </div>
          <div className="bg-protocol-darker border border-purple-500 rounded-lg p-4">
            <h3 className="font-semibold text-purple-400">{branch2.name}</h3>
            {branch2.description && (
              <p className="text-sm text-protocol-text-secondary mt-1">
                {branch2.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="p-6 border-b border-protocol-border bg-protocol-darker">
        <h3 className="font-semibold text-protocol-text-primary mb-3">Session Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-protocol-card rounded border border-protocol-border">
            <div className="text-2xl font-bold text-protocol-primary">
              {sessionDifferences.branch1Only}
            </div>
            <div className="text-sm text-protocol-text-secondary">Only in {branch1.name}</div>
          </div>
          <div className="text-center p-3 bg-protocol-card rounded border border-protocol-border">
            <div className="text-2xl font-bold text-protocol-success">
              {sessionDifferences.common}
            </div>
            <div className="text-sm text-protocol-text-secondary">Common Sessions</div>
          </div>
          <div className="text-center p-3 bg-protocol-card rounded border border-protocol-border">
            <div className="text-2xl font-bold text-purple-400">
              {sessionDifferences.branch2Only}
            </div>
            <div className="text-sm text-protocol-text-secondary">Only in {branch2.name}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-protocol-border">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("conflicts")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "conflicts"
                ? "border-b-2 border-protocol-error text-protocol-error"
                : "text-protocol-text-muted hover:text-protocol-text-secondary"
            }`}
          >
            Conflicts ({findingDifferences.conflicts.length})
          </button>
          <button
            onClick={() => setActiveTab("unique")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "unique"
                ? "border-b-2 border-protocol-primary text-protocol-primary"
                : "text-protocol-text-muted hover:text-protocol-text-secondary"
            }`}
          >
            Unique Findings (
            {findingDifferences.branch1Only.length +
              findingDifferences.branch2Only.length}
            )
          </button>
          <button
            onClick={() => setActiveTab("common")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "common"
                ? "border-b-2 border-protocol-success text-protocol-success"
                : "text-protocol-text-muted hover:text-protocol-text-secondary"
            }`}
          >
            Common ({findingDifferences.common.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Conflicts Tab */}
        {activeTab === "conflicts" && (
          <div>
            {hasConflicts ? (
              <div className="space-y-4">
                <p className="text-sm text-protocol-text-secondary mb-4">
                  These findings have different values in each branch for the
                  same category.
                </p>
                {findingDifferences.conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="border border-protocol-error rounded-lg bg-protocol-darker p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-protocol-text-primary capitalize">
                        {conflict.type.replace("_", " ")}
                      </h4>
                      <span className="px-2 py-1 bg-protocol-error text-white text-xs rounded">
                        CONFLICT
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-protocol-card border border-protocol-primary rounded p-3">
                        <p className="text-xs text-protocol-primary font-medium mb-1">
                          {branch1.name}
                        </p>
                        <p className="text-sm font-medium text-protocol-text-primary">
                          {conflict.branch1Value}
                        </p>
                        <span
                          className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(
                            conflict.branch1Confidence
                          )}`}
                        >
                          {getConfidenceLabel(conflict.branch1Confidence)} (
                          {(conflict.branch1Confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="bg-protocol-card border border-purple-500 rounded p-3">
                        <p className="text-xs text-purple-400 font-medium mb-1">
                          {branch2.name}
                        </p>
                        <p className="text-sm font-medium text-protocol-text-primary">
                          {conflict.branch2Value}
                        </p>
                        <span
                          className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(
                            conflict.branch2Confidence
                          )}`}
                        >
                          {getConfidenceLabel(conflict.branch2Confidence)} (
                          {(conflict.branch2Confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-protocol-text-secondary">
                  No conflicts found between branches
                </p>
                <p className="text-sm text-protocol-text-muted mt-2">
                  All findings are either common or unique to one branch
                </p>
              </div>
            )}
          </div>
        )}

        {/* Unique Findings Tab */}
        {activeTab === "unique" && (
          <div className="space-y-6">
            {findingDifferences.branch1Only.length > 0 && (
              <div>
                <h3 className="font-semibold text-protocol-text-primary mb-3">
                  Only in {branch1.name}
                </h3>
                <div className="space-y-2">
                  {findingDifferences.branch1Only.map((finding, index) => (
                    <div
                      key={index}
                      className="border border-protocol-primary rounded-lg bg-protocol-darker p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-protocol-text-primary capitalize">
                            {finding.type.replace("_", " ")}
                          </p>
                          <p className="text-lg font-semibold text-protocol-text-primary mt-1">
                            {finding.value}
                          </p>
                          <p className="text-xs text-protocol-text-secondary mt-1">
                            Source: {finding.sourceReference}
                          </p>
                        </div>
                        <span
                          className={`ml-4 px-3 py-1 rounded text-sm font-medium ${getConfidenceColor(
                            finding.confidence
                          )}`}
                        >
                          {getConfidenceLabel(finding.confidence)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {findingDifferences.branch2Only.length > 0 && (
              <div>
                <h3 className="font-semibold text-protocol-text-primary mb-3">
                  Only in {branch2.name}
                </h3>
                <div className="space-y-2">
                  {findingDifferences.branch2Only.map((finding, index) => (
                    <div
                      key={index}
                      className="border border-purple-500 rounded-lg bg-protocol-darker p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-protocol-text-primary capitalize">
                            {finding.type.replace("_", " ")}
                          </p>
                          <p className="text-lg font-semibold text-protocol-text-primary mt-1">
                            {finding.value}
                          </p>
                          <p className="text-xs text-protocol-text-secondary mt-1">
                            Source: {finding.sourceReference}
                          </p>
                        </div>
                        <span
                          className={`ml-4 px-3 py-1 rounded text-sm font-medium ${getConfidenceColor(
                            finding.confidence
                          )}`}
                        >
                          {getConfidenceLabel(finding.confidence)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {findingDifferences.branch1Only.length === 0 &&
              findingDifferences.branch2Only.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-protocol-text-secondary">
                    No unique findings in either branch
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Common Findings Tab */}
        {activeTab === "common" && (
          <div>
            {findingDifferences.common.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-protocol-text-secondary mb-4">
                  These findings appear in both branches with the same value.
                </p>
                {findingDifferences.common.map((finding, index) => (
                  <div
                    key={index}
                    className="border border-protocol-success rounded-lg bg-protocol-darker p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-protocol-text-primary capitalize">
                          {finding.type.replace("_", " ")}
                        </p>
                        <p className="text-lg font-semibold text-protocol-text-primary mt-1">
                          {finding.value}
                        </p>
                        <p className="text-xs text-protocol-text-secondary mt-1">
                          Source: {finding.sourceReference}
                        </p>
                      </div>
                      <span
                        className={`ml-4 px-3 py-1 rounded text-sm font-medium ${getConfidenceColor(
                          finding.confidence
                        )}`}
                      >
                        {getConfidenceLabel(finding.confidence)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-protocol-text-secondary">
                  No common findings between branches
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
