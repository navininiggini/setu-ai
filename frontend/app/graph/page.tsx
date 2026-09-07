"use client";

import React, { useEffect, useState } from "react";
import { fetchNetworkGraph, fetchGraphEntities } from "../../lib/api";
import { MPIDANetworkGraph } from "../../components/graph/MPIDANetworkGraph";
import { MoSPINationalFlow } from "../../components/graph/authority/MoSPINationalFlow";
import { SNAStateVendorConcentration } from "../../components/graph/authority/SNAStateVendorConcentration";
import { DADistrictVendorCapture } from "../../components/graph/authority/DADistrictVendorCapture";
import { MPConstituencyFundVelocity } from "../../components/graph/authority/MPConstituencyFundVelocity";
import { SearchableMpDropdown } from "../../components/graph/SearchableMpDropdown";
import { StakeholderGuideModal } from "../../components/graph/StakeholderGuideModal";
import { MagicCard } from "../../components/ui/MagicCard";
import { useRole } from "../../context/RoleContext";
import { formatDistrictName } from "../../lib/districts";
import { 
  Network, ShieldAlert, Users, Building, Activity, Info, 
  MapPin, SlidersHorizontal, RefreshCw, AlertTriangle, ArrowRight,
  Landmark, Layers, CheckCircle2, ChevronRight, PieChart, Target, Milestone, BookOpen
} from "lucide-react";

const POPULAR_STATES = [
  "All India",
  "Bihar",
  "Uttar Pradesh",
  "Maharashtra",
  "Rajasthan",
  "West Bengal",
  "Gujarat",
  "Madhya Pradesh",
  "Tamil Nadu",
  "Karnataka",
  "Odisha",
  "Kerala",
  "Punjab",
  "Haryana",
  "Assam",
  "Jharkhand",
  "Chhattisgarh",
  "Andhra Pradesh",
  "Telangana"
];

export default function NetworkGraphPage() {
  const { role, jurisdiction, setRole } = useRole();

  // Active authority perspective on this page: defaults to global role context
  const [activeAuthority, setActiveAuthority] = useState<string>(role || "ministry");

  // Keep local authority synced with global role changes
  useEffect(() => {
    setActiveAuthority(role);
  }, [role]);

  // Determine initial state based on active authority
  const getInitialState = () => {
    if (activeAuthority === "state" && jurisdiction && jurisdiction !== "National") {
      return jurisdiction;
    }
    if (activeAuthority === "district" || activeAuthority === "mp") {
      return "Bihar";
    }
    return "All India";
  };

  const [selectedState, setSelectedState] = useState<string>(getInitialState);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Darbhanga");
  const [selectedMp, setSelectedMp] = useState<string>("Mr Gopal Jee Thakur");
  const [entities, setEntities] = useState<{
    states: string[];
    districts: string[];
    mps: { name: string; works_count: number; total_capital: number }[];
  }>({
    states: POPULAR_STATES.filter(s => s !== "All India"),
    districts: ["Darbhanga", "Patna Sahib", "Saran", "Gaya", "Muzaffarpur"],
    mps: []
  });

  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[]; telemetry?: any }>({
    nodes: [],
    links: [],
    telemetry: null
  });
  const [loading, setLoading] = useState(true);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [showRawTopology, setShowRawTopology] = useState<boolean>(false);

  // Dynamic fetch of available entities (States, Districts, MPs)
  useEffect(() => {
    let isMounted = true;
    async function loadEntities() {
      try {
        const data = await fetchGraphEntities(selectedState === "All India" ? undefined : selectedState);
        if (isMounted && data) {
          setEntities({
            states: data.states && data.states.length > 0 ? data.states : POPULAR_STATES.filter(s => s !== "All India"),
            districts: data.districts || [],
            mps: data.mps || []
          });

          // Auto-select valid district if current one not in list
          if (data.districts && data.districts.length > 0) {
            const hasCurrent = data.districts.some(d => d.toLowerCase() === selectedDistrict.toLowerCase());
            if (!hasCurrent) {
              const darbhangaMatch = data.districts.find(d => d.toLowerCase() === "darbhanga");
              if (darbhangaMatch) {
                setSelectedDistrict(darbhangaMatch);
              } else {
                setSelectedDistrict(data.districts[0]);
              }
            }
          }

          // Auto-select valid MP dynamically if current one is not in the state's list
          if (data.mps && data.mps.length > 0) {
            const mpNames = data.mps.map(m => m.name);
            if (!mpNames.some(name => name.toLowerCase() === selectedMp.toLowerCase())) {
              setSelectedMp(data.mps[0].name);
            }
          }
        }
      } catch (err) {
        console.error("Error loading entities:", err);
      }
    }
    loadEntities();
    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  // Dynamic fetch whenever selectedState, selectedDistrict, selectedMp, minRisk, or activeAuthority changes
  useEffect(() => {
    let isMounted = true;
    async function loadGraph() {
      setLoading(true);
      try {
        const res = await fetchNetworkGraph(
          200, 
          minRisk, 
          selectedState, 
          selectedDistrict, 
          selectedMp,
          activeAuthority, 
          jurisdiction
        );
        if (isMounted) {
          setGraphData(res);
        }
      } catch (err) {
        console.error("Error loading network graph for authority:", activeAuthority, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGraph();
    return () => {
      isMounted = false;
    };
  }, [selectedState, selectedDistrict, selectedMp, minRisk, activeAuthority, jurisdiction]);

  const telemetry = graphData.telemetry || {
    scope: selectedState,
    total_capital: 0,
    total_works: 0,
    monopoly_links_count: 0,
    active_mps_count: 0,
    active_idas_count: 0
  };

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-200 shadow-xs">
              SETU INTELLIGENCE
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-600">FINANCIAL FORENSICS</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-700">CAG VENDOR CONCENTRATION RADAR</span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Money Flow, Cartels & Concentration Radar
            <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
              Dynamic CAG Engine
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Real-time bipartite money flows, Herfindahl Index (HHI), statutory tender structuring (smurfing), single-agency monopoly lock-in, and delivery dwell times tailored for public spending oversight.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all shadow-xs cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-amber-700" />
            <span>📖 Interpretation Guide</span>
          </button>
          <button
            onClick={() => setShowRawTopology(!showRawTopology)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-xs cursor-pointer ${
              showRawTopology 
                ? "border-cyan-500 bg-cyan-50 text-cyan-900 shadow-xs" 
                : "border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Network className="h-4 w-4" />
            <span>{showRawTopology ? "Hide Bipartite" : "Bipartite Network"}</span>
          </button>
        </div>
      </div>

      {/* Streamlined Stakeholder Command & Scope Bar */}
      <MagicCard glowColor="245, 158, 11" className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-2.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Segmented Authority Pill Control */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => {
              setActiveAuthority("ministry");
              setRole("ministry");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAuthority === "ministry"
                ? "bg-white text-cyan-950 shadow-xs border border-cyan-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span>🏛️ MoSPI Ministry</span>
          </button>

          <button
            onClick={() => {
              setActiveAuthority("state");
              setRole("state");
              if (selectedState === "All India") setSelectedState("Bihar");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAuthority === "state"
                ? "bg-white text-amber-950 shadow-xs border border-amber-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span>⚖️ State Nodal ({selectedState === "All India" ? "Bihar" : selectedState})</span>
          </button>

          <button
            onClick={() => {
              setActiveAuthority("district");
              setRole("district");
              if (selectedState === "All India") setSelectedState("Bihar");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAuthority === "district"
                ? "bg-white text-rose-950 shadow-xs border border-rose-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span>🛡️ District DM ({formatDistrictName(selectedDistrict, selectedState)})</span>
          </button>

          <button
            onClick={() => {
              setActiveAuthority("mp");
              setRole("mp");
              if (selectedState === "All India") setSelectedState("Bihar");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAuthority === "mp"
                ? "bg-white text-blue-950 shadow-xs border border-blue-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span>🗳️ MP ({selectedMp.length > 18 ? selectedMp.substring(0, 16) + '...' : selectedMp})</span>
          </button>
        </div>

        {/* Contextual Filter & Scope Strip */}
        <div className="flex items-center gap-2.5 flex-wrap px-1">
          {/* Active Scope Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
            <MapPin className="h-3 w-3 text-amber-600" />
            <span className="text-slate-500 font-sans">Scope:</span>
            <span className="font-bold text-slate-900">
              {activeAuthority === "ministry"
                ? selectedState.toUpperCase()
                : activeAuthority === "state"
                ? (selectedState === "All India" ? "BIHAR" : selectedState).toUpperCase()
                : activeAuthority === "district"
                ? formatDistrictName(selectedDistrict, selectedState).toUpperCase()
                : selectedMp.toUpperCase()}
            </span>
          </div>

          {/* Interactive State Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden hover:border-slate-400 cursor-pointer"
            >
              <option value="All India">
                🇮🇳 All India (Whole Dataset)
              </option>
              {entities.states.map((st) => (
                <option key={st} value={st}>
                  📍 {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown for District Magistrate View */}
          {activeAuthority === "district" && entities.districts.length > 0 && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-xl border border-rose-300 bg-rose-50/40 px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-xs focus:border-rose-500 focus:outline-hidden hover:border-rose-400 cursor-pointer"
            >
              {entities.districts.map((d) => (
                <option key={d} value={d}>
                  🏛️ {formatDistrictName(d, selectedState)}
                </option>
              ))}
            </select>
          )}

          {/* Searchable MP Combobox with Type-to-Filter */}
          {activeAuthority === "mp" && entities.mps.length > 0 && (
            <SearchableMpDropdown
              selectedMp={selectedMp}
              mps={entities.mps}
              selectedState={selectedState}
              onSelectMp={(mp) => setSelectedMp(mp)}
            />
          )}
        </div>
      </MagicCard>

      {/* Interactive In-App Stakeholder Guide & Case Studies Modal */}
      <StakeholderGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultTab={
          activeAuthority === "ministry"
            ? "mospi"
            : activeAuthority === "state"
            ? "sna"
            : activeAuthority === "district"
            ? "da"
            : "mp"
        }
      />

      {/* Main Forensic Visualizer Container */}
      {loading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-xs" />
            <div className="absolute text-[10px] font-black text-amber-700">SETU</div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">
              Aggregating Dynamic Forensic Telemetry for {activeAuthority.toUpperCase()} Scope...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Calculating real-time Herfindahl Index (HHI), concentration ratios, structuring deltas, and agency dwell times.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Render Bespoke Authority Visualizer */}
          {activeAuthority === "ministry" && (
            <MoSPINationalFlow
              telemetry={telemetry}
              nodes={graphData.nodes}
              links={graphData.links}
              selectedState={selectedState}
              availableStates={entities.states}
              onSelectState={(st) => setSelectedState(st)}
            />
          )}

          {activeAuthority === "state" && (
            <SNAStateVendorConcentration
              telemetry={telemetry}
              stateName={selectedState === "All India" ? "Bihar" : selectedState}
              availableStates={entities.states}
              onSelectState={(st) => setSelectedState(st)}
            />
          )}

          {activeAuthority === "district" && (
            <DADistrictVendorCapture
              telemetry={telemetry}
              districtName={selectedDistrict}
              availableDistricts={entities.districts}
              onSelectDistrict={(dist) => setSelectedDistrict(dist)}
            />
          )}

          {activeAuthority === "mp" && (
            <MPConstituencyFundVelocity
              telemetry={telemetry}
              mpName={selectedMp}
              availableMps={entities.mps}
              onSelectMp={(mp) => setSelectedMp(mp)}
            />
          )}

          {/* Optional Raw Force-Directed & Bipartite Network Graph (Collapsible) */}
          {showRawTopology && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Network className="h-4 w-4 text-cyan-600" />
                  Bipartite Force-Directed & Alluvial Flow Topology
                </span>
                <span className="text-[11px] text-slate-500">Full Graph Raw Exploration</span>
              </div>
              <MagicCard glowColor="59, 130, 246" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <MPIDANetworkGraph data={graphData} />
              </MagicCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
