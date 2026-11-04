import { useEffect, useState } from 'react';
import { aiApiClient } from '../services/api';
import type { 
  RoadRiskAssessment, 
  HotspotAnalysisResponse, 
  ModelEvaluationMetrics, 
  RiskCategory 
} from '../types/api';
import { 
  Cpu, 
  Activity, 
  BarChart3, 
  Sparkles, 
  Info,
  Compass
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const AIIntelligencePage = () => {
  const [assessments, setAssessments] = useState<RoadRiskAssessment[]>([]);
  const [hotspots, setHotspots] = useState<HotspotAnalysisResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelEvaluationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<RoadRiskAssessment | null>(null);

  useEffect(() => {
    async function loadAIData() {
      try {
        setLoading(true);
        const [riskData, hotspotData, modelData] = await Promise.all([
          aiApiClient.getRoadRisks(),
          aiApiClient.getHotspotAnalysis(),
          aiApiClient.getModelInfo(),
        ]);
        setAssessments(riskData);
        if (riskData.length > 0) setSelectedAssessment(riskData[0]);
        setHotspots(hotspotData);
        setModelInfo(modelData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAIData();
  }, []);

  const getRiskBadge = (category: RiskCategory) => {
    switch (category) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/40';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/40';
      case 'MODERATE':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/40';
      case 'LOW':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40';
      default:
        return 'bg-slate-700/40 text-slate-400 border border-slate-600';
    }
  };

  // Distribution counts for Chart
  const distributionData = [
    { name: 'Critical', count: assessments.filter(a => a.risk_category === 'CRITICAL').length, color: '#f43f5e' },
    { name: 'High', count: assessments.filter(a => a.risk_category === 'HIGH').length, color: '#f97316' },
    { name: 'Moderate', count: assessments.filter(a => a.risk_category === 'MODERATE').length, color: '#f59e0b' },
    { name: 'Low', count: assessments.filter(a => a.risk_category === 'LOW').length, color: '#10b981' },
  ];

  // Feature Importances formatting
  const importanceChartData = modelInfo ? Object.entries(modelInfo.feature_importances).map(([k, v]) => ({
    feature: k.replace(/_/g, ' ').toUpperCase(),
    importance: v
  })) : [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm font-medium">Computing Multi-Factor Road Risk Weights...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white">AI Flood Intelligence & Explainability Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transparent multi-factor empirical risk scoring, spatial bottleneck hotspots, and Scikit-learn validation metrics
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-300 font-mono text-[11px]">Model: {assessments[0]?.model_version}</span>
        </div>
      </div>

      {/* Assumptions & Scientific Rigor Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-cyan-300">Explainable AI & Calibration Integrity:</strong> Thresholds reflect transparent provisional empirical assumptions combining rainfall intensity (Open-Meteo), soil moisture saturation (24h accumulation), PostGIS elevation, and verified ground incidents. Every calculated score details its mathematical weights and drivers.
        </div>
      </div>

      {/* Top Row: Risk Distribution & ML Held-Out Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
              Mangaluru Corridor Risk Distribution
            </h3>
            <p className="text-[11px] text-slate-400">
              Categorized across {assessments.length} key urban corridors
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
            {distributionData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="text-slate-300 font-semibold">{d.name}:</span>
                <span className="text-white font-bold">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scikit-Learn Model Information & Evaluation */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  ML Model Architecture & Held-Out Test Evaluation
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  Validated Test Split
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {modelInfo?.model_name} trained on historical calibrated monsoon records
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>

          {modelInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Held-Out Accuracy</span>
                <span className="text-xl font-bold text-emerald-400">
                  {(modelInfo.test_accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 block">25% test partition</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Macro F1 Score</span>
                <span className="text-xl font-bold text-white">
                  {modelInfo.test_f1_macro.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">Precision & Recall balance</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Training Samples</span>
                <span className="text-xl font-bold text-cyan-300">
                  {modelInfo.training_samples_count}
                </span>
                <span className="text-[10px] text-slate-500 block">Calibrated records</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Validation Split</span>
                <span className="text-xl font-bold text-white">
                  {modelInfo.test_samples_count} test
                </span>
                <span className="text-[10px] text-slate-500 block">Unseen evaluation</span>
              </div>
            </div>
          )}

          {/* Feature Importances Bar */}
          <div className="h-28 w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importanceChartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 9 }} domain={[0, 0.5]} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }} />
                <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-slate-500 mt-2 italic">
            * {modelInfo?.provenance_note}
          </p>
        </div>
      </div>

      {/* Corridors Grid & Interactive Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Corridors List */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Road Corridors Risk Matrix ({assessments.length})
            </h3>
            <span className="text-[10px] text-cyan-400">Real-time weights</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {assessments.map((a) => (
              <div
                key={a.road_id}
                onClick={() => setSelectedAssessment(a)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  selectedAssessment?.road_id === a.road_id
                    ? 'bg-cyan-950/40 border-cyan-500/60'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{a.road_name}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getRiskBadge(a.risk_category)}`}>
                    {a.risk_category} ({Math.round(a.composite_risk_score * 100)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{a.ward}</span>
                  <span className="text-slate-500">Confidence: {a.confidence_level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explainability Breakdown Panel */}
        {selectedAssessment && (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getRiskBadge(selectedAssessment.risk_category)}`}>
                      {selectedAssessment.risk_category} RISK
                    </span>
                    <span className="text-xs text-slate-400">Score: {Math.round(selectedAssessment.composite_risk_score * 100)} / 100</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedAssessment.road_name}</h2>
                  <p className="text-xs text-slate-400">{selectedAssessment.ward}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block">Data Completeness</span>
                  <span className="text-sm font-bold text-cyan-400">{selectedAssessment.data_completeness_pct}%</span>
                </div>
              </div>

              {/* Natural Language Explanation Synthesis */}
              <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explainable AI Risk Rationale</span>
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedAssessment.plain_language_explanation}
                </p>
                <div className="mt-2 text-xs text-amber-300/90 font-medium bg-amber-950/20 p-2 rounded border border-amber-900/40">
                  Advisory: {selectedAssessment.mitigation_advisory}
                </div>
              </div>

              {/* Mathematical Factor Contributions */}
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Contributing Factor Weights Breakdown
              </h4>

              <div className="flex flex-col gap-2.5">
                {selectedAssessment.contributing_factors.map(f => (
                  <div key={f.factor_name} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-200">{f.factor_name}</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        +{(f.weighted_contribution * 100).toFixed(1)} pts (weight: {(f.weight * 100).toFixed(0)}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, f.normalized_score * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
              <span>Sources: {selectedAssessment.data_sources_used.join(' • ')}</span>
              <span>Updated: {new Date(selectedAssessment.calculated_at).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Hotspots & Vulnerability Ranking */}
      {hotspots && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Mangaluru Drainage Convergence & Bottleneck Hotspots
              </h3>
              <p className="text-[11px] text-slate-400">
                Historical monsoon vulnerability ranking calibrated from topographically constrained basins
              </p>
            </div>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hotspots.vulnerability_analysis.slice(0, 3).map(h => (
              <div key={h.corridor_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{h.corridor_name}</span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">
                      Risk Index: {(h.historical_vulnerability_index * 100).toFixed(0)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">{h.ward}</span>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {h.typical_bottleneck_reason}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                  <span>Elevation: {h.elevation_msl_meters}m</span>
                  <span>Status: {h.current_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
