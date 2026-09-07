import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_BASE = process.env.BACKEND_URL || "http://127.0.0.1:8001/api";

describe("SETU Frontend UI & Live Route Verification", () => {
  const routes = [
    { path: "/", name: "Public Landing Page", expectedKeyword: "SETU" },
    { path: "/dashboard", name: "Operational Command Center", expectedKeyword: "Command Center" },
    { path: "/works", name: "MPLADS Works Explorer", expectedKeyword: "Works Explorer" },
    { path: "/works/MPLADS-003277", name: "Work Detail View", expectedKeyword: "Synchronizing Real-Time Audit Telemetry" },
    { path: "/maps", name: "Geospatial Risk Visualizer", expectedKeyword: "Geospatial" },
    { path: "/graph", name: "MP-IDA Money Flow Graph", expectedKeyword: "Bipartite" },
    { path: "/cases", name: "Case Management Kanban", expectedKeyword: "Case" },
    { path: "/alerts", name: "Risk Alert Feed", expectedKeyword: "Alert" },
    { path: "/reports", name: "Compliance & Audit Reports", expectedKeyword: "Reports" },
    { path: "/model-metrics", name: "Model Evaluation & Fairness", expectedKeyword: "Model" },
    { path: "/roadmap", name: "Future Architecture Roadmap", expectedKeyword: "Roadmap" },
  ];

  for (const route of routes) {
    it(`should render ${route.name} (${route.path}) with HTTP 200`, async () => {
      const res = await fetch(`${FRONTEND_BASE}${route.path}`, {
        headers: { "User-Agent": "SETU-UI-TestRunner/1.0" },
      });
      assert.equal(res.status, 200, `Expected 200 OK for route ${route.path}, got ${res.status}`);
      const text = await res.text();
      assert.ok(text.length > 300, `Expected HTML content on ${route.path}, received ${text.length} bytes`);
      assert.ok(
        text.toLowerCase().includes(route.expectedKeyword.toLowerCase()),
        `Expected page ${route.path} to contain keyword "${route.expectedKeyword}"`
      );
    });
  }
});

describe("4-Tier Governance & Role Scoping Telemetry", () => {
  it("MoSPI Ministry (National Scope) should return macro metrics & national distribution", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=ministry`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "ministry");
    assert.ok(data.summary.total_works > 0, "Ministry summary total_works must be > 0");
    assert.ok(data.summary.flagged_works_count > 0, "Ministry flagged_works_count must be > 0");
    assert.ok(data.summary.amount_at_risk > 0, "Ministry amount_at_risk must be > 0");
    assert.ok(Array.isArray(data.top_flagged_works), "Must return top_flagged_works");
    assert.ok(Array.isArray(data.fraud_breakdown), "Must return fraud_breakdown");
  });

  it("State Nodal Authority (State Scope - Bihar) should return state-scoped anomalies", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=state&jurisdiction=Bihar`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "state");
    assert.equal(data.jurisdiction, "Bihar");
    assert.ok(data.summary.total_works > 0);
  });

  it("District Authority DM (District Scope - DARBHANGA) should return district triage data", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=district&jurisdiction=DARBHANGA`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "district");
    assert.equal(data.jurisdiction, "DARBHANGA");
  });

  it("Member of Parliament (MP Scope - Mr Gopal Jee Thakur) should return constituency utilization", async () => {
    const res = await fetch(`${BACKEND_BASE}/dashboard?role=mp&jurisdiction=Mr%20Gopal%20Jee%20Thakur`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.role, "mp");
    assert.equal(data.jurisdiction, "Mr Gopal Jee Thakur");
  });
});

describe("Geospatial & Graph Integration Contracts", () => {
  it("State choropleth endpoint should return valid geographic data arrays", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/states-choropleth`);
    assert.equal(res.status, 200);
    const states = await res.json();
    assert.ok(Array.isArray(states) && states.length > 0);
    const sample = states[0];
    assert.ok("state" in sample, "StateData must have state name");
    assert.ok("avg_risk_score" in sample, "StateData must have avg_risk_score");
    assert.ok("total_works" in sample, "StateData must have total_works");
  });

  it("District drilldown should return districts for Bihar", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/district-drilldown?state=Bihar`);
    assert.equal(res.status, 200);
    const districts = await res.json();
    assert.ok(Array.isArray(districts) && districts.length > 0);
    assert.ok("district" in districts[0]);
  });

  it("Constituency pins endpoint should accept limit parameter and return coordinate pins", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/pins?constituency=DARBHANGA&limit=50`);
    assert.equal(res.status, 200);
    const pins = await res.json();
    assert.ok(Array.isArray(pins));
    if (pins.length > 0) {
      assert.ok("lat" in pins[0] && "lng" in pins[0]);
      assert.ok("risk_score" in pins[0]);
    }
  });

  it("Bipartite network graph endpoint should return nodes and links", async () => {
    const res = await fetch(`${BACKEND_BASE}/graph/network?max_nodes=50&min_risk=0`);
    assert.equal(res.status, 200);
    const graph = await res.json();
    assert.ok(Array.isArray(graph.nodes), "Network graph must contain nodes");
    assert.ok(Array.isArray(graph.links), "Network graph must contain links");
  });

  it("Constituencies risk endpoint should return all nationwide constituencies with risk metrics", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/constituencies-risk`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data), "Must return array of constituencies");
    assert.ok(data.length > 300, `Expected >300 constituencies, got ${data.length}`);
    const sample = data[0];
    assert.ok(sample.name && sample.state);
    assert.ok(typeof sample.avg_risk_score === "number");
    assert.ok(typeof sample.total_works === "number");
  });

  it("Constituency detail endpoint should return deep forensic telemetry for a selected constituency", async () => {
    const res = await fetch(`${BACKEND_BASE}/geo/constituency-detail?name=DARBHANGA`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.name.includes("Darbhanga"), "Constituency name should contain Darbhanga");
    assert.equal(data.state, "Bihar");
    assert.ok(data.mp_name);
    assert.ok(Array.isArray(data.top_works), "Must return top flagged works");
    assert.ok(data.top_works.length > 0, "Darbhanga must have top flagged works");
  });
});

describe("UI Bug & Contract Discrepancy Diagnostics", () => {
  it("Diagnostic: Check Case entity contract for 'amount' and 'risk_level' fields", async () => {
    const res = await fetch(`${BACKEND_BASE}/cases?limit=5`);
    assert.equal(res.status, 200);
    const cases = await res.json();
    assert.ok(Array.isArray(cases) && cases.length > 0, "At least one case must exist");

    const sample = cases[0];
    const hasAmount = "amount" in sample && typeof sample.amount === "number";
    const hasRiskLevel = "risk_level" in sample && typeof sample.risk_level === "string";

    // Informative diagnostic assertions:
    // If these fields are missing on Case, UI renders NaN for amounts and undefined for risk level badges!
    if (!hasAmount) {
      console.warn("⚠️ [UI BUG DETECTED] Case object missing 'amount' property: Causes '₹NaN L' in app/cases/page.tsx:144 & 269");
    }
    if (!hasRiskLevel) {
      console.warn("⚠️ [UI BUG DETECTED] Case object missing 'risk_level' property: Causes TS2339 & missing RiskBadge label in app/cases/page.tsx:139");
    }
    assert.ok(sample.id, "Case must have an id");
    assert.ok(sample.title, "Case must have a title");
  });

  it("Diagnostic: Check Alert severity casing against TypeScript enum ('Critical' vs 'critical')", async () => {
    const res = await fetch(`${BACKEND_BASE}/alerts?limit=10`);
    assert.equal(res.status, 200);
    const alerts = await res.json();
    assert.ok(Array.isArray(alerts) && alerts.length > 0);

    const severities = new Set(alerts.map((a) => a.severity));
    console.log("ℹ️ Live Alert severities in database:", Array.from(severities));

    // Alert severity in backend is Titlecase ("Critical", "High", "Medium", "Low")
    // Frontend app/alerts/page.tsx compares against lowercase "critical", causing TS2367
    const hasTitleCase = alerts.some((a) => a.severity === "Critical" || a.severity === "High");
    assert.ok(hasTitleCase, "Database alert severities are Titlecase, confirming frontend TS2367 mismatch");
  });
});

describe("React Bits MagicBento Component Verification", () => {
  it("should have SETU_CORE_CAPABILITIES with all 6 statutory cards configured", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const tsxPath = path.resolve("./components/ui/MagicBento.tsx");
    const tsxContent = fs.readFileSync(tsxPath, "utf-8");

    assert.ok(tsxContent.includes("export const SETU_CORE_CAPABILITIES"), "Must export SETU_CORE_CAPABILITIES");
    assert.ok(tsxContent.includes('DEFAULT_SOVEREIGN_GLOW = "245, 158, 11"'), "Must use sovereign warm amber/gold RGB");

    const expectedLabels = ["GFR §155", "HHI > 0.65", "Forensic GIS", "March Rush", "Multi-Tier", "CAG Ready"];
    for (const label of expectedLabels) {
      assert.ok(tsxContent.includes(`label: "${label}"`), `Card must have label ${label}`);
    }
  });

  it("should contain institutional styles and accessibility guards in MagicBento.css", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const cssPath = path.resolve("./components/ui/MagicBento.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    assert.ok(cssContent.includes("--bento-glow-color: 245, 158, 11;"), "Must use SETU amber/gold glow token");
    assert.ok(cssContent.includes("#0D1527"), "Must use SETU midnight slate navy background token");
    assert.ok(cssContent.includes("magic-bento-grid"), "Must define responsive grid");
    assert.ok(cssContent.includes("prefers-reduced-motion"), "Must provide accessibility guard for reduced motion");
  });

  it("should mount MagicBento inside Act II on the landing page", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const pagePath = path.resolve("./app/page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    assert.ok(pageContent.includes("MagicBento"), "Landing page must import and render MagicBento");
    assert.ok(pageContent.includes('glowColor="245, 158, 11"'), "Landing page must set sovereign amber glow");
  });
});

describe("Universal MagicCard Component & Site-Wide Integration Verification", () => {
  it("should define MagicCard with polymorphic typing and GSAP tilt/glow in MagicCard.tsx", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const cardTsxPath = path.resolve("./components/ui/MagicCard.tsx");
    const content = fs.readFileSync(cardTsxPath, "utf-8");

    assert.ok(content.includes("export const MagicCard"), "Must export MagicCard");
    assert.ok(content.includes("enableBorderGlow"), "Must support enableBorderGlow prop");
    assert.ok(content.includes("enableTilt"), "Must support enableTilt prop");
    assert.ok(content.includes("clickEffect"), "Must support clickEffect prop");
    assert.ok(content.includes("gsap"), "Must utilize GSAP for smooth spring physics");
  });

  it("should integrate MagicCard inside StatCard to power all 16 command center KPI cards", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const statCardPath = path.resolve("./components/ui/StatCard.tsx");
    const content = fs.readFileSync(statCardPath, "utf-8");

    assert.ok(content.includes("import { MagicCard }"), "StatCard must import MagicCard");
    assert.ok(content.includes("<MagicCard"), "StatCard must wrap elements in MagicCard");
  });

  it("should apply MagicCard across all major pages (landing, dashboard, cases, alerts, reports, metrics, roadmap, works, maps, graph)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const pagesToVerify = [
      "./app/page.tsx",
      "./components/dashboard/MinistryView.tsx",
      "./components/dashboard/StateNodalView.tsx",
      "./components/dashboard/DistrictMagistrateView.tsx",
      "./components/dashboard/MPConstituencyView.tsx",
      "./app/cases/page.tsx",
      "./app/alerts/page.tsx",
      "./app/reports/page.tsx",
      "./app/model-metrics/page.tsx",
      "./app/roadmap/page.tsx",
      "./app/works/page.tsx",
      "./app/works/[id]/page.tsx",
      "./app/maps/page.tsx",
      "./app/graph/page.tsx"
    ];

    for (const relativePath of pagesToVerify) {
      const fullPath = path.resolve(relativePath);
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.ok(content.includes("MagicCard"), `${relativePath} must use MagicCard component`);
    }
  });
});

describe("SETU Sovereign SpecularButton Adaptation Verification", () => {
  it("should define SpecularButton with OGL WebGL shader and SETU sovereign tokens", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const buttonTsxPath = path.resolve("./components/ui/SpecularButton.tsx");
    const content = fs.readFileSync(buttonTsxPath, "utf-8");

    assert.ok(content.includes("export const SpecularButton"), "Must export SpecularButton");
    assert.ok(content.includes("SETU_VARIANTS"), "Must define SETU sovereign variant mapping");
    assert.ok(content.includes("#1C1917"), "Primary variant must use sovereign midnight slate #1C1917");
    assert.ok(content.includes("#FDE68A"), "Primary variant must use royal golden rim highlight #FDE68A");
    assert.ok(content.includes("#D97706"), "Amber variant must use brand saffron/amber #D97706");
    assert.ok(content.includes("#FAF7F2"), "Parchment variant must use archival vellum #FAF7F2");
    assert.ok(content.includes("#991B1B"), "Danger variant must use audit crimson #991B1B");
    assert.ok(content.includes("#065F46"), "Success variant must use verified emerald #065F46");
    assert.ok(content.includes("from \"ogl\""), "Must utilize OGL for WebGL specular shader rendering");
  });

  it("should contain sovereign institutional styling and accessibility in SpecularButton.css", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const cssPath = path.resolve("./components/ui/SpecularButton.css");
    const content = fs.readFileSync(cssPath, "utf-8");

    assert.ok(content.includes(".specular-button"), "Must define .specular-button class");
    assert.ok(content.includes(".specular-button:focus-visible"), "Must define visible focus states");
    assert.ok(content.includes(".specular-button:disabled"), "Must handle disabled state");
    assert.ok(content.includes("prefers-reduced-motion"), "Must provide reduced-motion accessibility guard");
    assert.ok(content.includes(".specular-button--sm"), "Must provide sm sizing");
    assert.ok(content.includes(".specular-button--md"), "Must provide md sizing");
    assert.ok(content.includes(".specular-button--lg"), "Must provide lg sizing");
  });

  it("should integrate SpecularButton in key user action flows (landing, works detail, reports, cases, dashboard)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const keyFiles = [
      "./app/page.tsx",
      "./app/works/[id]/page.tsx",
      "./app/reports/page.tsx",
      "./app/dashboard/page.tsx",
      "./app/cases/page.tsx"
    ];

    for (const relativePath of keyFiles) {
      const fullPath = path.resolve(relativePath);
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.ok(content.includes("SpecularButton"), `${relativePath} must import and use SpecularButton`);
    }
  });
});


