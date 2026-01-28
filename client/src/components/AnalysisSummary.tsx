import { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS, CONFIDENCE_THRESHOLDS, getConfidenceLevel as getLevel, ConfidenceLevel } from "../constants";

interface Finding {
  id: string;
  type: string;
  value: string;
  confidence: number;
  sourceReference: string;
  quote: string;
  validated: boolean;
  needsValidation: boolean;
}

interface AnalysisSummaryProps {
  sessionId: string;
}

export default function AnalysisSummary({ sessionId }: AnalysisSummaryProps) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [stats, setStats] = useState({ high: 0, medium: 0, low: 0, none: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFindings();
  }, [sessionId]);

  const loadFindings = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.SESSION_BY_ID(sessionId));
      const results = response.data.analysisResults || [];
      setFindings(results);

      // Calculate stats
      const stats = { high: 0, medium: 0, low: 0, none: 0 };
      results.forEach((f: Finding) => {
        if (f.confidence >= CONFIDENCE_THRESHOLDS.HIGH) stats.high++;
        else if (f.confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) stats.medium++;
        else if (f.confidence >= CONFIDENCE_THRESHOLDS.LOW) stats.low++;
        else stats.none++;
      });
      setStats(stats);
    } catch (error) {
      console.error("Failed to load findings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    const level = getLevel(confidence);
    const colorMap = {
      high: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-orange-100 text-orange-800",
      unacceptable: "bg-red-100 text-red-800",
    };
    const labelMap = {
      high: "High",
      medium: "Medium",
      low: "Low",
      unacceptable: "None",
    };
    return { label: labelMap[level], color: colorMap[level] };
  };

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, string> = {
      technology: "🔧",
      volume: "📊",
      integration: "🔗",
      architecture: "🏗️",
      security: "🔒",
      performance: "⚡",
      other: "📌",
    };
    return icons[type] || icons.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading analysis...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview - Only show the 4 confidence boxes */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-800">{stats.high}</div>
          <div className="text-sm text-green-600">High Confidence</div>
          <div className="text-xs text-green-500">≥90%</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-800">
            {stats.medium}
          </div>
          <div className="text-sm text-yellow-600">Medium</div>
          <div className="text-xs text-yellow-500">70-89%</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-800">{stats.low}</div>
          <div className="text-sm text-white-600">Low</div>
          <div className="text-xs text-orange-500">50-69%</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-800">{stats.none}</div>
          <div className="text-sm text-red-600">Uncertain</div>
          <div className="text-xs text-red-500">&lt;50%</div>
        </div>
      </div>
    </div>
  );
}
