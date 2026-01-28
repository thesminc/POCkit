import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface POC {
  id: string;
  branchId: string;
  content: string;
  createdAt: string;
}

interface POCViewerProps {
  pocId?: string;
  branchId?: string;
  onClose?: () => void;
}

export default function POCViewer({ pocId, branchId, onClose }: POCViewerProps) {
  const [poc, setPoc] = useState<POC | null>(null);
  const [pocs, setPocs] = useState<POC[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (pocId) {
      loadPOC(pocId);
    } else if (branchId) {
      loadPOCsForBranch(branchId);
    }
  }, [pocId, branchId]);

  const loadPOC = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pocs/${id}`);
      const data = await response.json();

      if (data.success) {
        setPoc(data.poc);
        setEditedContent(data.poc.content);
      } else {
        setError(data.error || 'Failed to load POC');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPOCsForBranch = async (bId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/branches/${bId}/pocs`);
      const data = await response.json();

      if (data.success) {
        setPocs(data.pocs);
        if (data.pocs.length > 0) {
          setPoc(data.pocs[0]); // Load most recent
          setEditedContent(data.pocs[0].content);
        }
      } else {
        setError(data.error || 'Failed to load POCs');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePOC = async () => {
    if (!branchId) {
      alert('Branch ID is required to generate POC');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const response = await fetch(`/api/branches/${branchId}/generate-poc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeValidationNotes: true,
          focusAreas: [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPoc({
          id: data.poc.id,
          branchId: data.poc.branchId,
          content: data.poc.markdown,
          createdAt: data.poc.createdAt,
        });
        setEditedContent(data.poc.markdown);
        // Reload list
        if (branchId) {
          loadPOCsForBranch(branchId);
        }
      } else {
        setError(data.error || 'Failed to generate POC');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const savePOC = async () => {
    if (!poc) return;

    try {
      const response = await fetch(`/api/pocs/${poc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });

      const data = await response.json();

      if (data.success) {
        setPoc(data.poc);
        setEditing(false);
        alert('POC updated successfully');
      } else {
        alert(data.error || 'Failed to update POC');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const downloadPOC = async () => {
    if (!poc) return;

    try {
      const response = await fetch(`/api/pocs/${poc.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `POC-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to download: ' + err.message);
    }
  };

  const exportPowerPoint = async () => {
    if (!poc) return;

    try {
      const response = await fetch(`/api/pocs/${poc.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'powerpoint' }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `POC-${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to export PowerPoint: ' + err.message);
    }
  };

  const deletePOC = async () => {
    if (!poc) return;

    if (!confirm('Are you sure you want to delete this POC? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/pocs/${poc.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setPoc(null);
        if (branchId) {
          loadPOCsForBranch(branchId);
        }
      } else {
        alert(data.error || 'Failed to delete POC');
      }
    } catch (err: any) {
      alert(err.message);
    }
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

  if (error && !poc) {
    return (
      <div className="bg-protocol-darker border border-protocol-error rounded-lg p-6">
        <p className="text-protocol-error mb-4">Error: {error}</p>
        {branchId && (
          <button
            onClick={generatePOC}
            disabled={generating}
            className="px-4 py-2 bg-protocol-primary text-white rounded hover:bg-protocol-primary-hover disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate POC'}
          </button>
        )}
      </div>
    );
  }

  if (!poc && pocs.length === 0) {
    return (
      <div className="bg-protocol-card rounded-lg shadow p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-protocol-text-primary mb-2">
            No POC Generated Yet
          </h3>
          <p className="text-protocol-text-secondary mb-6">
            Generate a proof-of-concept document from your branch analysis.
          </p>
          {branchId && (
            <button
              onClick={generatePOC}
              disabled={generating}
              className="px-6 py-3 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Generating POC...
                </span>
              ) : (
                'Generate POC'
              )}
            </button>
          )}
          {generating && (
            <p className="text-sm text-protocol-text-muted mt-4">
              This may take 30-60 seconds as we analyze your findings and generate the document...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-protocol-card rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-protocol-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-protocol-text-primary">
              Proof of Concept Document
            </h2>
            {poc && (
              <p className="text-sm text-protocol-text-secondary mt-1">
                Generated on {new Date(poc.createdAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {pocs.length > 1 && (
              <select
                value={poc?.id || ''}
                onChange={(e) => loadPOC(e.target.value)}
                className="px-3 py-2 border border-protocol-input-border bg-protocol-input-bg text-protocol-text-primary rounded-md"
              >
                {pocs.map((p, index) => (
                  <option key={p.id} value={p.id}>
                    Version {pocs.length - index} ({new Date(p.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 text-protocol-text-secondary hover:text-protocol-text-primary"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-protocol-border bg-protocol-darker px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 text-sm bg-protocol-card border border-protocol-border text-protocol-text-primary rounded hover:bg-protocol-input-bg"
            >
              {editing ? 'Cancel Edit' : 'Edit'}
            </button>
            {editing && (
              <button
                onClick={savePOC}
                className="px-4 py-2 text-sm bg-protocol-primary text-white rounded hover:bg-protocol-primary-hover"
              >
                Save Changes
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadPOC}
              className="px-4 py-2 text-sm bg-protocol-success text-white rounded hover:bg-green-700"
            >
              Download (.md)
            </button>
            <button
              onClick={exportPowerPoint}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Export (.pptx)
            </button>
            <button
              onClick={deletePOC}
              className="px-4 py-2 text-sm bg-protocol-error text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {editing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[600px] p-4 font-mono text-sm border border-protocol-input-border bg-protocol-input-bg text-protocol-text-primary rounded focus:outline-none focus:ring-2 focus:ring-protocol-primary"
              placeholder="Edit POC markdown content..."
            />
          </div>
        ) : (
          <div className="prose prose-blue max-w-none text-protocol-text-primary">
            <ReactMarkdown>{poc?.content || ''}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Footer */}
      {!editing && (
        <div className="border-t border-protocol-border bg-protocol-darker px-6 py-4">
          <div className="flex items-center justify-between text-sm text-protocol-text-secondary">
            <div>
              <span className="text-protocol-warning">💡</span> <strong className="text-protocol-text-primary">Tip:</strong> All findings include confidence levels and citations to source documents.
            </div>
            {branchId && (
              <button
                onClick={generatePOC}
                disabled={generating}
                className="px-4 py-2 bg-protocol-primary text-white rounded hover:bg-protocol-primary-hover disabled:opacity-50"
              >
                {generating ? 'Regenerating...' : 'Regenerate POC'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
