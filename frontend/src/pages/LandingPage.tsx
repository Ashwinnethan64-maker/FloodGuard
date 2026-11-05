import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Map as MapIcon, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck,
  Send,
  Truck,
  Database,
  CloudRain
} from 'lucide-react';
import { Button, Badge } from '../components/ui';

export const LandingPage = () => {
  return (
    <div className="flex flex-col flex-1 bg-[#f8fafd]">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#e5edf5] bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge Identification */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#e8e9ff] text-[#533afd] text-xs font-medium border border-[#d8dbff]">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#533afd]" />
                <span>Mangaluru Smart Monsoon Initiative</span>
              </div>

              {/* Refined Left-Aligned Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#061b31] tracking-tight leading-[1.1]">
                Know the road. <br />
                <span className="font-semibold text-[#533afd]">
                  Navigate the risk.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#64748d] max-w-xl font-normal leading-relaxed">
                AI-powered road-level flood intelligence and emergency route management for Mangaluru.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link to="/dashboard">
                  <Button size="lg" className="shadow-sm">
                    <span>Explore Live Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/map">
                  <Button variant="outline" size="lg">
                    <MapIcon className="w-4 h-4 text-[#533afd]" />
                    <span>Explore Interactive GIS Map</span>
                  </Button>
                </Link>
              </div>

              {/* Trust/Operational Badges */}
              <div className="pt-6 border-t border-[#e5edf5] flex flex-wrap items-center gap-6 text-xs text-[#50617a]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#059669]" />
                  <span>Real PostGIS Road Vectors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#533afd]" />
                  <span>Automated Weather Forecast Grid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                  <span>Verified Triage System</span>
                </div>
              </div>
            </div>

            {/* Right Product Preview Mockup */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-[#e5edf5] rounded-[4px] shadow-sm overflow-hidden">
                {/* Header bar of preview */}
                <div className="px-4 py-3 bg-[#f8fafd] border-b border-[#e5edf5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    <span className="text-[11px] font-mono text-[#64748d] ml-2">mangaluru-telemetry.postgis</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-[4px] border border-[#a7f3d0]">
                    LIVE SYNC
                  </span>
                </div>

                {/* Simulated Real Map Preview Area */}
                <div className="p-4 space-y-3 bg-[#f8fafd]">
                  <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px] flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                        <span className="text-xs font-semibold text-[#061b31]">Kottara Chowki Underpass</span>
                      </div>
                      <p className="text-[11px] text-[#64748d] mt-1">NH-66 Arterial Corridor • Water Depth: 65cm</p>
                    </div>
                    <Badge status="BLOCKED">Inundated</Badge>
                  </div>

                  <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px] flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                        <span className="text-xs font-semibold text-[#061b31]">Pumpwell Circle (Mahaveera)</span>
                      </div>
                      <p className="text-[11px] text-[#64748d] mt-1">Junction Underpass • Water Depth: 25cm</p>
                    </div>
                    <Badge status="CAUTION">Caution</Badge>
                  </div>

                  <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px] flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#059669]" />
                        <span className="text-xs font-semibold text-[#061b31]">Kadri Hills - Mallikatta Link</span>
                      </div>
                      <p className="text-[11px] text-[#64748d] mt-1">Elevated Bypass • Passable for all vehicles</p>
                    </div>
                    <Badge status="OPEN">Passable</Badge>
                  </div>
                </div>

                {/* Footer status bar */}
                <div className="px-4 py-2.5 bg-white border-t border-[#e5edf5] flex items-center justify-between text-[11px] text-[#64748d]">
                  <span>Active Corridors Monitored: 7</span>
                  <Link to="/map" className="text-[#533afd] font-medium hover:underline flex items-center gap-1">
                    <span>Inspect Layer</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE MONSOON ROAD-ACCESSIBILITY PROBLEM */}
      <section id="problem" className="py-20 border-b border-[#e5edf5] bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-2">
              The Coastal Monsoon Challenge
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
              Why generic navigation applications fail during Mangaluru downpours.
            </h2>
            <p className="text-sm text-[#64748d] mt-3 leading-relaxed">
              Coastal Karnataka experiences intense micro-bursts where 40-70mm of rain falls in less than an hour. Highway underpasses like Kottara Chowki and low-lying junctions like Pumpwell flood rapidly while standard traffic GPS apps still direct commuters into waterlogged traps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px]">
              <div className="w-8 h-8 rounded-[4px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] flex items-center justify-center mb-4">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#061b31]">Topographical Bottlenecks</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Mangaluru sits between the Western Ghats and the Arabian Sea. Rain runoff rushes downhill through natural storm channels that cross major arterial corridors at low elevations.
              </p>
            </div>

            <div className="p-6 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px]">
              <div className="w-8 h-8 rounded-[4px] bg-[#fffbeb] border border-[#fde68a] text-[#d97706] flex items-center justify-center mb-4">
                <CloudRain className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#061b31]">Lack of Depth Telemetry</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Standard navigation apps measure velocity slowdowns, not standing water depth. A road looks like slow traffic when in reality commuter sedans and two-wheelers are engine-stalled.
              </p>
            </div>

            <div className="p-6 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px]">
              <div className="w-8 h-8 rounded-[4px] bg-[#e8e9ff] border border-[#d8dbff] text-[#533afd] flex items-center justify-center mb-4">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#061b31]">Delayed Emergency Dispatch</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Emergency ambulances and police patrol units lack authoritative real-time clearance status on alternate elevated routes to Wenlock and Father Muller Hospitals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW FLOODGUARD WORKS */}
      <section id="how-it-works" className="py-20 border-b border-[#e5edf5] bg-[#f8fafd]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-2">
              System Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
              End-to-end intelligence from rain gauge to routing
            </h2>
            <p className="text-sm text-[#64748d] mt-2">
              Four coordinated pipeline layers providing reliable, non-hallucinated road risk guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Meteorological Forecast Telemetry',
                desc: 'Continuous real-time ingestion from Open-Meteo weather models and localized Mangaluru precipitation grid.',
                icon: CloudRain,
              },
              {
                step: '02',
                title: 'PostGIS Spatial Matching',
                desc: 'Geometric buffering and point-in-corridor spatial queries aligning hazard spots directly to road segments.',
                icon: Database,
              },
              {
                step: '03',
                title: 'FLOODGUARD AI Assistant',
                desc: 'Risk index computation factoring rainfall intensity, road elevation, catchment runoff, and past flood history.',
                icon: Cpu,
              },
              {
                step: '04',
                title: 'Tactical Route Engine',
                desc: 'Dynamic Dijkstra/A* routing penalizing submerged links to suggest safe, elevated detour corridors.',
                icon: Compass,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="p-6 bg-white border border-[#e5edf5] rounded-[4px] relative">
                  <span className="text-[10px] font-mono font-bold text-[#533afd] uppercase tracking-wider block mb-3">
                    LAYER {s.step}
                  </span>
                  <div className="w-8 h-8 rounded-[4px] bg-[#e8e9ff] text-[#533afd] flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#061b31] mb-2">{s.title}</h3>
                  <p className="text-xs text-[#64748d] leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE GIS INTELLIGENCE PREVIEW */}
      <section id="gis-preview" className="py-20 border-b border-[#e5edf5] bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block">
                Spatial Precision
              </span>
              <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
                Accurate road-level geospatial intelligence for Mangaluru
              </h2>
              <p className="text-sm text-[#64748d] leading-relaxed">
                Unlike city-wide storm warnings, FLOODGUARD tracks individual road segments. Each corridor is assigned an explicit operational status backed by real coordinates and elevation profiles.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-[4px] bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#061b31]">Passable / Open</h4>
                    <p className="text-[11px] text-[#64748d]">Normal water runoff. Road is safe for all vehicles including two-wheelers.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-[4px] bg-[#fffbeb] border border-[#fde68a] text-[#d97706] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#061b31]">Caution / Waterlogged</h4>
                    <p className="text-[11px] text-[#64748d]">Water accumulation up to 20cm. Low-clearance two-wheelers advised to exercise caution.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-[4px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#061b31]">Submerged / Inundated</h4>
                    <p className="text-[11px] text-[#64748d]">Depth exceeding 35cm. Severe risk of engine hydro-lock. Traffic halted or diverted.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/map">
                  <Button variant="secondary">
                    <span>Open Full Map Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5edf5]">
                <span className="text-xs font-semibold text-[#061b31]">Mangaluru Corridor Vulnerability Index</span>
                <span className="text-[11px] text-[#64748d]">Station: Bajpe & Kadri</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Kottara Chowki Underpass', depth: '65 cm', status: 'BLOCKED', risk: '92%' },
                  { name: 'Pumpwell Circle Underpass', depth: '28 cm', status: 'CAUTION', risk: '64%' },
                  { name: 'Car Street Temple Vicinity', depth: '32 cm', status: 'BLOCKED', risk: '84%' },
                  { name: 'Baikampady Industrial Estate Road', depth: '14 cm', status: 'CAUTION', risk: '48%' },
                  { name: 'Kadri Hills Elevated Pass', depth: '0 cm', status: 'OPEN', risk: '12%' },
                ].map((item) => (
                  <div key={item.name} className="p-3 bg-white border border-[#e5edf5] rounded-[4px] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#061b31]">{item.name}</div>
                      <div className="text-[11px] text-[#64748d] mt-0.5">Water Depth: {item.depth} • Flood Risk: {item.risk}</div>
                    </div>
                    <Badge status={item.status as any} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FLOOD REPORTING & VERIFICATION WORKFLOW */}
      <section className="py-20 border-b border-[#e5edf5] bg-[#f8fafd]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-2">
              Civic Engagement & Trust
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
              Rigorous citizen report verification pipeline
            </h2>
            <p className="text-sm text-[#64748d] mt-2">
              Citizen reports are never published as authoritative blockages without verification, eliminating false alarm panic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-[#e5edf5] rounded-[4px]">
              <div className="w-8 h-8 rounded-[4px] bg-[#e8e9ff] text-[#533afd] flex items-center justify-center mb-4">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#061b31]">1. Citizen Hazard Report</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Commuters upload geo-tagged observations with depth estimates (ankle, knee, waist), vehicle passability indicators, and photographic evidence.
              </p>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-[11px] text-[#6366f1] font-medium">
                Tagged as: UNVERIFIED
              </div>
            </div>

            <div className="p-6 bg-white border border-[#e5edf5] rounded-[4px]">
              <div className="w-8 h-8 rounded-[4px] bg-[#e8e9ff] text-[#533afd] flex items-center justify-center mb-4">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#061b31]">2. Patrol & Admin Triage</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Traffic police patrol units and the Municipal Disaster Control Room review incoming reports alongside live meteorological observations.
              </p>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-[11px] text-[#d97706] font-medium">
                Under Triage & Verification
              </div>
            </div>

            <div className="p-6 bg-white border border-[#e5edf5] rounded-[4px]">
              <div className="w-8 h-8 rounded-[4px] bg-[#e8e9ff] text-[#533afd] flex items-center justify-center mb-4">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#061b31]">3. Verified Grid Broadcast</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Once confirmed, the road segment geometry is instantly flagged as CAUTION or BLOCKED, automatically updating all rerouting calculations.
              </p>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-[11px] text-[#059669] font-medium">
                Broadcasted as: VERIFIED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AI-POWERED FLOOD INTELLIGENCE & EXPLAINABILITY */}
      <section id="ai-engine" className="py-20 border-b border-[#e5edf5] bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block">
                Explainable AI
              </span>
              <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
                Not a black box. Transparent, physics-informed AI assessments.
              </h2>
              <p className="text-sm text-[#64748d] leading-relaxed">
                FLOODGUARD incorporates the FLOODGUARD AI Assistant to synthesize rainfall telemetry, historical drainage patterns, and corridor elevations into plain-language operational rationales.
              </p>
              <div className="p-4 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#061b31]">
                  <Cpu className="w-4 h-4 text-[#533afd]" />
                  <span>Explainability Sample: Kottara Chowki</span>
                </div>
                <p className="text-xs text-[#50617a] italic leading-relaxed">
                  "Kottara Chowki underpass has a steep depression grade (3.2m below street plane) and connects to a tidal backwater canal. Rainfall exceeding 35mm/hr combined with high tide creates a back-flow condition, resulting in 65cm of standing water within 25 minutes."
                </p>
              </div>
              <Link to="/ai-engine">
                <Button variant="outline" className="mt-2">
                  <span>Explore AI Intelligence Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="lg:col-span-6 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px] p-6 space-y-4">
              <h3 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider">
                Risk Modeling Features
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px]">
                  <span className="text-xl font-light text-[#061b31] block">87.4%</span>
                  <span className="text-[11px] text-[#64748d]">Model F1-Score</span>
                </div>
                <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px]">
                  <span className="text-xl font-light text-[#533afd] block">&lt; 1.2s</span>
                  <span className="text-[11px] text-[#64748d]">Inference Latency</span>
                </div>
                <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px]">
                  <span className="text-xl font-light text-[#059669] block">100%</span>
                  <span className="text-[11px] text-[#64748d]">PostGIS Linestring Precision</span>
                </div>
                <div className="p-3 bg-white border border-[#e5edf5] rounded-[4px]">
                  <span className="text-xl font-light text-[#d97706] block">15 min</span>
                  <span className="text-[11px] text-[#64748d]">Telemetry Ingestion Window</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FLOOD-AWARE ALTERNATIVE ROUTING */}
      <section id="routing" className="py-20 border-b border-[#e5edf5] bg-[#f8fafd]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-2">
              Dynamic Avoidance
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
              Flood-aware routing that actively avoids submerged arteries
            </h2>
            <p className="text-sm text-[#64748d] mt-2">
              Our routing engine calculates distance, transit time, and cumulative inundation risk score to provide truly viable alternate corridors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-[#e5edf5] rounded-[4px] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#dc2626]">Standard GPS Route (Risky)</span>
                <span className="text-xs text-[#64748d]">Distance: 7.2 km • Est: 18 min</span>
              </div>
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[4px] text-xs text-[#dc2626]">
                Passes through Kottara Chowki underpass (65cm submerged) and Pumpwell circle. High probability of engine stall.
              </div>
              <ul className="text-xs text-[#64748d] space-y-2">
                <li>• Low elevation underpass route</li>
                <li>• Flood risk penalty: Extreme (95/100)</li>
                <li>• Two-wheelers: Impassable</li>
              </ul>
            </div>

            <div className="p-6 bg-white border border-[#533afd]/40 rounded-[4px] space-y-4 relative">
              <div className="absolute top-3 right-3 text-[10px] font-semibold bg-[#e8e9ff] text-[#533afd] px-2 py-0.5 rounded-[4px]">
                RECOMMENDED
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#533afd]">FLOODGUARD Flood-Safe Route</span>
                <span className="text-xs text-[#64748d]">Distance: 8.9 km • Est: 23 min</span>
              </div>
              <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-[4px] text-xs text-[#059669]">
                Diverts via Kadri Hills and Mallikatta elevated ridge. Zero submerged bottlenecks encountered.
              </div>
              <ul className="text-xs text-[#64748d] space-y-2">
                <li>• High elevation bypass corridors</li>
                <li>• Flood risk penalty: Minimal (12/100)</li>
                <li>• Two-wheelers: 100% Passable</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. EMERGENCY-RESPONSE CAPABILITIES */}
      <section className="py-20 border-b border-[#e5edf5] bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block">
                Civil Defense & Tactical Dispatch
              </span>
              <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
                Dedicated consoles for Mangaluru Traffic Police & Fire Rescue
              </h2>
              <p className="text-sm text-[#64748d] leading-relaxed">
                Emergency services cannot afford trial-and-error routing during medical evacuation. FLOODGUARD equips dispatchers with guaranteed clear corridors directly to tertiary medical centers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px]">
                  <h4 className="text-xs font-semibold text-[#061b31]">Hospital Priority Corridors</h4>
                  <p className="text-[11px] text-[#64748d] mt-1">Continuous live clearance monitoring along ambulance arterials to Wenlock District Hospital and KMC Jyothi.</p>
                </div>
                <div className="p-4 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px]">
                  <h4 className="text-xs font-semibold text-[#061b31]">Patrol Barricade Directives</h4>
                  <p className="text-[11px] text-[#64748d] mt-1">Instant digital dispatch order triggering physical barricade placement before vehicles enter inundated dips.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5edf5]">
                <span className="text-xs font-semibold text-[#061b31]">Tactical Dispatch Readiness</span>
                <Badge status="VERIFIED">STANDBY</Badge>
              </div>
              <div className="space-y-2 text-xs text-[#50617a]">
                <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                  <span>Kadri Patrol Unit 04:</span>
                  <span className="font-semibold text-[#061b31]">On Station • Pumpwell</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                  <span>Urwa Rescue Squad 01:</span>
                  <span className="font-semibold text-[#061b31]">Equipped • Kottara Underpass</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                  <span>Disaster Cell Admin:</span>
                  <span className="font-semibold text-[#059669]">24/7 Monitoring Active</span>
                </div>
              </div>
              <Link to="/responder">
                <Button size="sm" variant="secondary" className="w-full mt-2">
                  <span>Open Tactical Responder Console</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TRANSPARENT DATA AND VERIFICATION METHODOLOGY */}
      <section className="py-20 border-b border-[#e5edf5] bg-[#f8fafd]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-2">
              Verification Methodology
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#061b31] tracking-tight">
              Absolute distinction between measured fact and predicted risk
            </h2>
            <p className="text-sm text-[#64748d] mt-3 leading-relaxed">
              In public safety applications, misleading precision can be hazardous. FLOODGUARD maintains strict transparency across every metric displayed on the platform:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="p-6 bg-white border border-[#e5edf5] rounded-[4px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669] block mb-2">
                MEASURED FACT
              </span>
              <h3 className="text-sm font-semibold text-[#061b31]">Open-Meteo Weather Model Data</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Physical millimeter precipitation amounts sourced directly from calibrated meteorological forecast models for Mangaluru coordinates.
              </p>
            </div>

            <div className="p-6 bg-white border border-[#e5edf5] rounded-[4px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#533afd] block mb-2">
                ESTIMATED PROJECTION
              </span>
              <h3 className="text-sm font-semibold text-[#061b31]">Machine Learning Forecasts</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Probabilistic predictions computed from historical drainage response curves, labeled clearly with model confidence scores.
              </p>
            </div>

            <div className="p-6 bg-white border border-[#e5edf5] rounded-[4px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d97706] block mb-2">
                FIELD VERIFICATION
              </span>
              <h3 className="text-sm font-semibold text-[#061b31]">Human Officer Confirmations</h3>
              <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
                Physical road closures require positive confirmation by certified Mangaluru disaster control authorities or on-duty police patrols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CALL TO ACTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#e8e9ff] text-[#533afd] text-xs font-semibold">
            <span>Mangaluru Smart Monsoon Initiative</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-light text-[#061b31] tracking-tight">
            Ready to experience next-generation monsoon road intelligence?
          </h2>

          <p className="text-sm text-[#64748d] max-w-xl mx-auto">
            Explore live Mangaluru corridors, trigger real-time monsoon flood scenarios, or submit road reports directly to city responders.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/dashboard">
              <Button size="lg" className="shadow-sm">
                <span>Access Live Grid Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg">
                <span>Run Interactive Demo Scenario</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
