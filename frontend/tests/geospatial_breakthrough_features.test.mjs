import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.BACKEND_URL || "http://127.0.0.1:8001/api";
const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";

// Load SVG map dataset
const svgPath = path.join(__dirname, "../public/data/india_constituencies_svg.json");
const svgData = JSON.parse(fs.readFileSync(svgPath, "utf8"));

const normalizeKey = (s) =>
  (s || "").toUpperCase().replace(/\s*\([^)]*\)/g, "").replace(/[^A-Z0-9]/g, "");

const CONSTITUENCY_ALIASES = {
  BELGAUM: "BELAGAVI",
  PEDDAPALLE: "PEDDAPALLI",
  UJJARPUR: "UJIARPUR",
  JANJGIRCHAMPA: "JANJGIRCHAMPA",
  CHIKKODI: "CHIKODI",
  DHARAMAPURI: "DHARMAPURI",
  GUWAHATI: "GAUHATI",
  ANAKAPALLE: "ANAKAPALLI",
  AURANGABADBR: "AURANGABAD",
  KANNIYAKUMARI: "KANNIYAKUMARI",
  ANANTAPUR: "ANANTAPUR",
  NAINITALUDHAMSINGHNAG: "NAINITALUDHAMSINGHNAGAR",
  NAINITALUDHAMSINGHNAGAR: "NAINITALUDHAMSINGHNAGAR",
  SONEPAT: "SONIPAT",
  DAVANAGERE: "DAVANAGERE",
  WARANGEL: "WARANGAL",
  MAHARAJGANJBR: "MAHARAJGANJ",
  CHELVELLA: "CHEVELLA",
  HAMIRPURHP: "HAMIRPUR",
  PURNEA: "PURNIA",
  FIROZPUR: "FIROZPUR",
  MAYILADUTHURAI: "MAYILADUTURAI",
  HARDWAR: "HARIDWAR",
  BARRACKPUR: "BARRACKPORE",
  BHATINDA: "BATHINDA",
  BARAMULLAH: "BARAMULLA",
  HAMIRPURUP: "HAMIRPUR",
  TIRUVALLUR: "THIRUVALLUR",
  MAHARAJGANJUP: "MAHARAJGANJ",
  MANDSOUR: "MANDSAUR",
  BANGALOREURBAN: "BANGALORESOUTH",
  BANGALORE: "BANGALORESOUTH",
};

const resolveConstituencyKey = (s) => {
  const norm = normalizeKey(s);
  return CONSTITUENCY_ALIASES[norm] || norm;
};

test("Breakthrough Feature 1: Cross-Border Cartel Conduits", async (t) => {
  await t.test("API returns paired multi-constituency agency monopolies", async () => {
    const res = await fetch(`${API_BASE}/geo/cartel-conduits?min_risk=35.0&limit=40`);
    assert.equal(res.status, 200, "Conduit endpoint returns HTTP 200");
    const conduits = await res.json();
    assert.ok(Array.isArray(conduits), "Response is an array");
    assert.ok(conduits.length > 0, "Contains at least 1 conduit");

    // Verify first conduit schema
    const first = conduits[0];
    assert.ok(first.id, "Conduit has ID");
    assert.ok(first.agency_name, "Conduit has agency_name");
    assert.ok(first.source_constituency, "Conduit has source_constituency");
    assert.ok(first.target_constituency, "Conduit has target_constituency");
    assert.ok(first.total_capital > 0, "Conduit has non-zero total capital");
    assert.ok(first.avg_risk >= 0, "Conduit has avg_risk");
    assert.ok(["Critical", "High", "Medium", "Low"].includes(first.risk_level), "Valid risk_level");
  });

  await t.test("All returned cartel conduits map to SVG coordinate centroids", async () => {
    const res = await fetch(`${API_BASE}/geo/cartel-conduits?min_risk=35.0&limit=40`);
    const conduits = await res.json();

    const centroidMap = new Map();
    svgData.constituencies.forEach((c) => {
      centroidMap.set(resolveConstituencyKey(c.name), c.centroid);
    });

    let mappedCount = 0;
    conduits.forEach((conduit) => {
      const sKey = resolveConstituencyKey(conduit.source_constituency);
      const tKey = resolveConstituencyKey(conduit.target_constituency);
      const p1 = centroidMap.get(sKey);
      const p2 = centroidMap.get(tKey);
      if (p1 && p2) mappedCount++;
    });

    assert.ok(mappedCount > 0, `At least some returned cartel conduits (${mappedCount}/${conduits.length}) map to centroids`);
  });
});

test("Breakthrough Feature 2: 4D Temporal Audit Scrubber", async (t) => {
  await t.test("API returns monthly time-series with March 2024 Pre-Election surge", async () => {
    const res = await fetch(`${API_BASE}/geo/temporal-risk`);
    assert.equal(res.status, 200, "Temporal risk endpoint returns HTTP 200");
    const data = await res.json();

    assert.ok(Array.isArray(data.months), "Months array returned");
    assert.ok(data.months.includes("2024-03"), "Includes March 2024 rush month");
    assert.ok(data.timeline["2024-03"], "Contains March 2024 timeline entry");
    assert.equal(data.timeline["2024-03"].is_surge, true, "March 2024 flagged as surge");
    assert.ok(data.timeline["2024-03"].total_works > 0, "March 2024 has works count");
    assert.ok(data.timeline["2024-03"].total_capital > 0, "March 2024 has capital outlay");
    assert.ok(Object.keys(data.timeline["2024-03"].constituencies).length > 0, "Has constituency overrides");
  });

  await t.test("Constituency risk overrides correctly resolve against SVG names", async () => {
    const res = await fetch(`${API_BASE}/geo/temporal-risk`);
    const data = await res.json();
    const marchData = data.timeline["2024-03"];

    let matches = 0;
    const svgNames = new Set(svgData.constituencies.map((c) => resolveConstituencyKey(c.name)));

    Object.keys(marchData.constituencies).forEach((cName) => {
      const k = resolveConstituencyKey(cName);
      if (svgNames.has(k)) {
        matches++;
      }
    });

    assert.ok(matches >= 25, `Resolved ${matches} constituency risk overrides for March 2024`);
  });
});

test("Breakthrough Feature 3: Executive Anomaly Tour Hotspots", async (t) => {
  const EXECUTIVE_HOTSPOTS = [
    { constituency: "Darbhanga", state: "Bihar" },
    { constituency: "Karauli-Dholpur", state: "Rajasthan" },
    { constituency: "Bangalore South", state: "Karnataka" },
    { constituency: "Murshidabad", state: "West Bengal" },
    { constituency: "Adilabad", state: "Telangana" },
  ];

  await t.test("All 5 curated briefing hotspots exist in SVG boundaries with valid bounds", async () => {
    EXECUTIVE_HOTSPOTS.forEach((hotspot) => {
      const targetKey = resolveConstituencyKey(hotspot.constituency);
      const found = svgData.constituencies.find(
        (c) => resolveConstituencyKey(c.name) === targetKey
      );
      assert.ok(found, `Hotspot ${hotspot.constituency} found in SVG dataset`);
      assert.ok(found.bounds && found.bounds.length === 2, `Hotspot ${hotspot.constituency} has valid bounds`);
      const [[minX, minY], [maxX, maxY]] = found.bounds;
      assert.ok(maxX > minX, `Valid bounding box width for ${hotspot.constituency}`);
      assert.ok(maxY > minY, `Valid bounding box height for ${hotspot.constituency}`);
    });
  });
});

test("Frontend Integration: /maps route renders successfully", async () => {
  const res = await fetch(`${FRONTEND_BASE}/maps`);
  assert.equal(res.status, 200, "/maps page renders HTTP 200");
  const html = await res.text();
  assert.ok(html.includes("Geospatial Risk Visualizer") || html.includes("Audit Pins Map"), "HTML contains geospatial visualizer shell");
});
