import { useEffect, useState } from 'react';
import { aiApiClient } from '../services/api';
import type { 
  RoadRiskAssessment, 
  HotspotAnalysisResponse, 
  ModelEvaluationMetrics, 
  GeminiRiskExplanation,
  GeminiIncidentAnalysis
} from '../types/api';
import { 
  Activity, 
  Sparkles, 
  Info,
  Compass,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Send,
  Loader2
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
import { Card, Button, Badge } from '../components/ui';

export const AIIntelligencePage = () => {
  const [assessments, setAssessments] = useState<RoadRiskAssessment[]>([]);
  const [hotspots, setHotspots] = useState<HotspotAnalysisResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelEvaluationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<RoadRiskAssessment | null>(null);

  // Gemini State
  const [geminiExplanation, setGeminiExplanation] = useState<GeminiRiskExplanation | null>(null);
  const [loadingGeminiRisk, setLoadingGeminiRisk] = useState(false);

  const [testDescription, setTestDescription] = useState('Kottara underpass water level is waist high. Bus stalled and two wheelers cannot cross.');
  const [testLocation, setTestLocation] = useState('Kottara Chowki Flyover');
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiIncidentAnalysis | null>(null);
  const [loadingGeminiAnalysis, setLoadingGeminiAnalysis] = useState(false);

  const fetchGeminiExplanation = async (roadId: string) => {
    try {
      setLoadingGeminiRisk(true);
      const res = await aiApiClient.explainRiskWithGemini(roadId);
      setGeminiExplanation(res);
    } catch (err) {
      console.warn('Gemini explanation error:', err);
    } finally {
      setLoadingGeminiRisk(false);
    }
  };

  const handleRunGeminiTest = async () => {
    try {
      setLoadingGeminiAnalysis(true);
      const res = await aiApiClient.analyzeWithGemini(testDescription, testLocation, 'UNDERPASS_FLOODING');
      setGeminiAnalysis(res);
    } catch (err) {
      console.warn('Gemini test error:', err);
    } finally {
      setLoadingGeminiAnalysis(false);
    }
  };

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
        if (riskData.length > 0) {
          setSelectedAssessment(riskData[0]);
          fetchGeminiExplanation(riskData[0].road_id);
        }
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

  // Distribution counts for Chart
  const distributionData = [
    { name: 'Critical', count: assessments.filter(a => a.risk_category === 'CRITICAL').length, color: '#dc2626' },
    { name: 'High', count: assessments.filter(a => a.risk_category === 'HIGH').length, color: '#ea580c' },
    { name: 'Moderate', count: assessments.filter(a => a.risk_category === 'MODERATE').length, color: '#d97706' },
    { name: 'Low', count: assessments.filter(a => a.risk_category === 'LOW').length, color: '#059669' },
  ];

  // Feature Importances formatting
  const importanceChartData = modelInfo ? Object.entries(modelInfo.feature_importances).map(([k, v]) => ({
    feature: k.replace(/_/g, ' ').toUpperCase(),
    importance: v
  })) : [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-28 text-[#64748d] gap-3">
        <Activity className="w-7 h-7 text-[#533afd] animate-spin" />
        <span className="text-xs font-medium text-[#061b31]">
          Evaluating Multi-Factor Spatial Risk Matrices & Model Weights...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5edf5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#061b31] tracking-tight">
              AI Flood Intelligence & Explainability Engine
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff] uppercase tracking-wider">
              Scikit-Learn + Gemini
            </span>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            Empirical multi-factor hazard scoring, drainage convergence hotspots, and natural language model explanations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-white border border-[#e5edf5] px-3 py-1.5 rounded-[4px]">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
          <span className="text-[#061b31] font-mono text-[11px]">Model: {assessments[0]?.model_version || 'v2.4-rf'}</span>
        </div>
      </div>

      {/* Assumptions & Scientific Rigor Banner */}
      <div className="p-4 rounded-[4px] bg-white border border-[#e5edf5] text-xs text-[#50617a] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#533afd] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#061b31]">Explainable AI & Calibration Integrity:</strong> Thresholds reflect transparent empirical physics combining rainfall intensity (Open-Meteo), soil moisture saturation (24h accumulation), PostGIS elevation profiles, and verified ground incidents. Every calculated score exposes its exact mathematical factor contributions.
        </div>
      </div>

      {/* Top Row: Risk Distribution & ML Held-Out Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Card */}
        <Card
          className="p-5 flex flex-col justify-between"
          title="Corridor Risk Distribution"
          subtitle={`Categorized across ${assessments.length} key urban corridors`}
        >
          <div className="h-44 w-full flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5edf5', borderRadius: '4px', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#f1f5f9]">
            {distributionData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: d.color }}></span>
                <span className="text-[#64748d] font-medium">{d.name}:</span>
                <span className="text-[#061b31] font-semibold">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Scikit-Learn Model Information & Evaluation */}
        <Card
          className="lg:col-span-2 p-5 flex flex-col justify-between"
          title="ML Architecture & Held-Out Test Evaluation"
          subtitle={`${modelInfo?.model_name || 'Random Forest Classifier'} trained on historical calibrated monsoon records`}
          headerAction={
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
              Validated Split
            </span>
          }
        >
          {modelInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
              <div className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Held-Out Accuracy</span>
                <span className="text-xl font-light text-[#059669]">
                  {(modelInfo.test_accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#64748d] block mt-0.5">25% test partition</span>
              </div>

              <div className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Macro F1 Score</span>
                <span className="text-xl font-light text-[#061b31]">
                  {modelInfo.test_f1_macro.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#64748d] block mt-0.5">Balanced Precision</span>
              </div>

              <div className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Training Samples</span>
                <span className="text-xl font-light text-[#533afd]">
                  {modelInfo.training_samples_count}
                </span>
                <span className="text-[10px] text-[#64748d] block mt-0.5">Calibrated records</span>
              </div>

              <div className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Validation Split</span>
                <span className="text-xl font-light text-[#061b31]">
                  {modelInfo.test_samples_count}
                </span>
                <span className="text-[10px] text-[#64748d] block mt-0.5">Unseen evaluation</span>
              </div>
            </div>
          )}

          {/* Feature Importances Bar */}
          <div className="h-28 w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importanceChartData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e5edf5" />
                <XAxis type="number" stroke="#64748d" tick={{ fontSize: 9 }} domain={[0, 0.5]} />
                <YAxis dataKey="feature" type="category" stroke="#061b31" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5edf5', borderRadius: '4px', fontSize: '11px' }} />
                <Bar dataKey="importance" fill="#533afd" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-[#64748d] mt-2 italic">
            * {modelInfo?.provenance_note}
          </p>
        </Card>
      </div>

      {/* Corridors Grid & Interactive Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Corridors List */}
        <Card
          className="p-5"
          title={`Road Risk Matrix (${assessments.length})`}
          subtitle="Real-time multi-factor calculated weights"
        >
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {assessments.map((a) => (
              <div
                key={a.road_id}
                onClick={() => {
                  setSelectedAssessment(a);
                  fetchGeminiExplanation(a.road_id);
                }}
                className={`p-3 rounded-[4px] border transition-all cursor-pointer flex flex-col gap-2 ${
                  selectedAssessment?.road_id === a.road_id
                    ? 'bg-[#e8e9ff]/50 border-[#533afd]'
                    : 'bg-[#f8fafd] border-[#e5edf5] hover:border-[#cbd5e1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#061b31]">{a.road_name}</span>
                  <Badge status={a.risk_category === 'CRITICAL' ? 'BLOCKED' : a.risk_category as any}>
                    {a.risk_category} ({Math.round(a.composite_risk_score * 100)})
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748d]">
                  <span>{a.ward}</span>
                  <span>Confidence: {a.confidence_level}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Explainability Breakdown Panel */}
        {selectedAssessment && (
          <Card
            className="lg:col-span-2 p-6 flex flex-col justify-between"
            title={selectedAssessment.road_name}
            subtitle={selectedAssessment.ward}
            headerAction={
              <div className="text-right">
                <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">Data Completeness</span>
                <span className="text-xs font-semibold text-[#533afd]">{selectedAssessment.data_completeness_pct}%</span>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge status={selectedAssessment.risk_category === 'CRITICAL' ? 'BLOCKED' : selectedAssessment.risk_category as any}>
                  {selectedAssessment.risk_category} RISK
                </Badge>
                <span className="text-xs text-[#64748d]">
                  Calculated Score: {Math.round(selectedAssessment.composite_risk_score * 100)} / 100
                </span>
              </div>

              {/* Natural Language Explanation Synthesis */}
              <div className="p-4 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#533afd]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explainable AI Risk Rationale</span>
                </div>
                <p className="text-xs text-[#061b31] leading-relaxed">
                  {selectedAssessment.plain_language_explanation}
                </p>
                <div className="p-2.5 rounded-[4px] bg-[#fffbeb] border border-[#fde68a] text-xs text-[#d97706] font-medium">
                  Advisory: {selectedAssessment.mitigation_advisory}
                </div>
              </div>

              {/* Mathematical Factor Contributions */}
              <div>
                <h4 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider mb-2">
                  Contributing Factor Weights Breakdown
                </h4>

                <div className="flex flex-col gap-2">
                  {selectedAssessment.contributing_factors.map(f => (
                    <div key={f.factor_name} className="p-3 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5]">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-[#061b31]">{f.factor_name}</span>
                        <span className="font-mono text-[#533afd] font-semibold">
                          +{(f.weighted_contribution * 100).toFixed(1)} pts (weight: {(f.weight * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="bg-[#533afd] h-full rounded-full"
                          style={{ width: `${Math.min(100, f.normalized_score * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-[#64748d]">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Gemini AI Risk Explanation Briefing */}
              <div className="p-4 rounded-[4px] bg-[#e8e9ff]/40 border border-[#d8dbff] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#533afd]" />
                    <span className="text-xs font-semibold text-[#533afd]">Google Gemini AI • Explainable Corridor Analysis</span>
                  </div>
                  {loadingGeminiRisk && (
                    <span className="flex items-center gap-1 text-[11px] text-[#533afd]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Consulting Gemini...
                    </span>
                  )}
                </div>

                {geminiExplanation ? (
                  <div className="text-xs text-[#061b31] space-y-2">
                    <p className="leading-relaxed">
                      <strong className="text-[#533afd]">Geomorphology:</strong> {geminiExplanation.geomorphology_factor}
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-[#533afd]">Monsoon Context:</strong> {geminiExplanation.monsoon_context}
                    </p>
                    <div className="p-3 rounded-[4px] bg-white border border-[#e5edf5] flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[#061b31]">Recommended Action:</strong>
                        <span>{geminiExplanation.recommended_action}</span>
                        <span className="block mt-1 text-[11px] text-[#533afd] font-medium">
                          Suggested Detour: {geminiExplanation.alternative_route_tip}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748d]">Select a corridor to generate an explainable Gemini intelligence brief.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#f1f5f9] text-[10px] text-[#64748d] flex flex-wrap justify-between items-center gap-2">
              <span>Sources: {selectedAssessment.data_sources_used.join(' • ')}</span>
              <span>Updated: {new Date(selectedAssessment.calculated_at).toLocaleTimeString()}</span>
            </div>
          </Card>
        )}
      </div>

      {/* Hotspots & Vulnerability Ranking */}
      {hotspots && (
        <Card
          className="p-5"
          title="Mangaluru Drainage Convergence & Bottleneck Hotspots"
          subtitle="Historical monsoon vulnerability ranking calibrated from topographically constrained basins"
          headerAction={<Compass className="w-4 h-4 text-[#533afd]" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hotspots.vulnerability_analysis.slice(0, 3).map(h => (
              <div key={h.corridor_id} className="p-4 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#061b31]">{h.corridor_name}</span>
                    <span className="text-[10px] font-mono text-[#dc2626] font-semibold">
                      Risk Index: {(h.historical_vulnerability_index * 100).toFixed(0)}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748d] block mt-1">{h.ward}</span>
                  <p className="text-xs text-[#50617a] mt-2 leading-relaxed">
                    {h.typical_bottleneck_reason}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#e5edf5] text-[10px] text-[#64748d] flex justify-between">
                  <span>Elevation: {h.elevation_msl_meters}m</span>
                  <span>Status: {h.current_status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Google Gemini Citizen Report Intelligence & Spam Detection Laboratory */}
      <Card
        className="p-6"
        title="Google Gemini AI • Citizen Report Analysis & Spam Detection"
        subtitle="Live natural language processing for citizen flood descriptions, estimated depth, and false report detection"
        headerAction={
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-[4px] bg-[#e8e9ff] text-[#533afd] border border-[#d8dbff]">
            Gemini 3.5 Flash Lite
          </span>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          {/* Input Box */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-1">Location Context</label>
              <input
                type="text"
                value={testLocation}
                onChange={(e) => setTestLocation(e.target.value)}
                className="w-full bg-white border border-[#e5edf5] rounded-[4px] px-3 py-2 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#061b31] block mb-1">Citizen Narrative Description</label>
              <textarea
                rows={3}
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                className="w-full bg-white border border-[#e5edf5] rounded-[4px] p-3 text-xs text-[#061b31] focus:outline-none focus:border-[#533afd] resize-none"
              />
            </div>

            <Button
              onClick={handleRunGeminiTest}
              disabled={loadingGeminiAnalysis}
              size="md"
            >
              {loadingGeminiAnalysis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Analyze with Gemini Intelligence</span>
            </Button>
          </div>

          {/* Analysis Results Display */}
          <div className="p-4 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] flex flex-col justify-between">
            {geminiAnalysis ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#e5edf5]">
                  <span className="font-semibold text-[#061b31]">Gemini Classification:</span>
                  <Badge status="CAUTION">{geminiAnalysis.category_suggestion}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#64748d] block">Urgency Tier:</span>
                    <span className="font-semibold text-[#d97706]">{geminiAnalysis.urgency_tier}</span>
                  </div>
                  <div>
                    <span className="text-[#64748d] block">Estimated Water Depth:</span>
                    <span className="font-semibold text-[#061b31]">
                      {geminiAnalysis.estimated_water_depth_cm !== null ? `${geminiAnalysis.estimated_water_depth_cm} cm` : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#64748d] block mb-1">Passable Vehicle Classes:</span>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] ${geminiAnalysis.passable_vehicles.two_wheelers ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                      2-Wheelers: {geminiAnalysis.passable_vehicles.two_wheelers ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] ${geminiAnalysis.passable_vehicles.four_wheelers ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                      4-Wheelers: {geminiAnalysis.passable_vehicles.four_wheelers ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] ${geminiAnalysis.passable_vehicles.emergency_vehicles ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                      Emergency: {geminiAnalysis.passable_vehicles.emergency_vehicles ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-[4px] bg-white border border-[#e5edf5] text-xs">
                  <strong className="block text-[#533afd] mb-0.5">Tactical Dispatch Summary:</strong>
                  {geminiAnalysis.tactical_summary}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64748d] pt-1">
                  <span>Confidence: {(geminiAnalysis.confidence_score * 100).toFixed(0)}%</span>
                  {geminiAnalysis.is_suspicious_or_spam ? (
                    <span className="text-[#dc2626] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Flagged Suspicious
                    </span>
                  ) : (
                    <span className="text-[#059669] font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Citizen Pattern
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#64748d] space-y-2">
                <Bot className="w-8 h-8 text-[#94a3b8]" />
                <p className="text-xs">Click "Analyze with Gemini Intelligence" to test narrative parsing.</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
