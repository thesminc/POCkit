import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants';

interface POC {
  id: string;
  createdAt: string;
  format: string;
  agentCount: number;
  problemStatement: string;
  preview: string;
}

interface POCHistoryProps {
  sessionId: string;
}

export default function POCHistory({ sessionId }: POCHistoryProps) {
  const [pocs, setPocs] = useState<POC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPOCs();
  }, [sessionId]);

  const loadPOCs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.SESSION_POCS(sessionId));
      setPocs(response.data.pocs);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load POCs:', err);
      setError('Failed to load POC history');
    } finally {
      setLoading(false);
    }
  };

  const downloadPOC = async (pocId: string) => {
    try {
      const response = await axios.get(API_ENDPOINTS.POC_DOWNLOAD(pocId), {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `poc-${pocId}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download POC:', err);
      alert('Failed to download POC');
    }
  };

  const exportPOC = async (pocId: string, format: 'pdf') => {
    try {
      const response = await axios.post(
        `/api/pocs/${pocId}/export`,
        { format },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `poc-${pocId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Failed to export POC as PDF:`, err);
      alert('Failed to export POC as PDF');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-protocol-text-muted">Loading POC history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-protocol-error">{error}</div>
      </div>
    );
  }

  if (pocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg className="w-16 h-16 text-protocol-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-protocol-text-secondary text-lg mb-2">No POCs generated yet</p>
        <p className="text-protocol-text-muted text-sm">Complete the conversation and click "Generate POC" to create your first document</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-protocol-text-primary">POC History</h2>
        <p className="text-protocol-text-secondary mt-1">All generated Proof of Concept documents for this session</p>
      </div>

      <div className="space-y-4">
        {pocs.map((poc) => (
          <div
            key={poc.id}
            className="bg-protocol-card border border-protocol-border rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    poc.format === 'business'
                      ? 'bg-protocol-darker text-protocol-primary border border-protocol-primary'
                      : 'bg-protocol-darker text-protocol-success border border-protocol-success'
                  }`}>
                    {poc.format === 'business' ? '👔 Business' : '💻 Developer'}
                  </span>
                  <span className="text-sm text-protocol-text-muted">
                    {poc.agentCount} agents
                  </span>
                  <span className="text-sm text-protocol-text-muted">•</span>
                  <span className="text-sm text-protocol-text-muted">
                    {formatDate(poc.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-protocol-text-secondary mb-3 line-clamp-2">
                  {poc.problemStatement}
                </p>

                <div className="bg-protocol-darker p-3 rounded border border-protocol-border">
                  <p className="text-xs text-protocol-text-secondary font-mono line-clamp-3">
                    {poc.preview}
                  </p>
                </div>
              </div>

              <div className="ml-4 flex flex-col gap-2">
                <button
                  onClick={() => downloadPOC(poc.id)}
                  className="px-4 py-2 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Markdown
                </button>
                <button
                  onClick={() => exportPOC(poc.id, 'pdf')}
                  className="px-4 py-2 bg-protocol-success text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pocs.length > 0 && (
        <div className="mt-6 text-center text-sm text-protocol-text-muted">
          Total: {pocs.length} POC{pocs.length !== 1 ? 's' : ''} generated
        </div>
      )}
    </div>
  );
}
