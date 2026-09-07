import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BACKEND_BASE = process.env.BACKEND_URL || "http://127.0.0.1:8001/api";

describe("Dashboard Authority Views & Dynamic Features Suite", () => {

  describe("Task 1: State Nodal Authority - State Inspection Priority Removed", () => {
    it("StateNodalView component source should NOT contain 'State Inspection Priority'", () => {
      const filePath = path.resolve(process.cwd(), "components/dashboard/StateNodalView.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(
        !content.includes("State Inspection Priority"),
        "State Inspection Priority should be completely removed from StateNodalView"
      );
      assert.ok(
        !content.includes("<FraudEvidenceVisualizer"),
        "FraudEvidenceVisualizer spotlight should not be present in StateNodalView"
      );
    });

    it("State Nodal API should return state-scoped metrics without errors", async () => {
      const res = await fetch(`${BACKEND_BASE}/dashboard?role=state&jurisdiction=Bihar`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.role, "state");
      assert.equal(data.jurisdiction, "Bihar");
      assert.ok(data.summary.total_works > 0, "Should have works in Bihar");
      assert.ok(Array.isArray(data.top_flagged_works), "Should return top_flagged_works array");
    });
  });

  describe("Task 2: District Authority - Dynamic Pre-Sanction Stop-Work Alert", () => {
    it("DistrictMagistrateView component should support dynamic activeWork, lookup input, and table inspection", () => {
      const filePath = path.resolve(process.cwd(), "components/dashboard/DistrictMagistrateView.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(content.includes("activeWork"), "Should declare activeWork state");
      assert.ok(content.includes("handleLookup"), "Should have handleLookup handler");
      assert.ok(content.includes("inputQuery"), "Should support inputQuery state");
      assert.ok(content.includes("district-stop-work-spotlight"), "Should have spotlight container anchor");
      assert.ok(content.includes("Crosshair"), "Should have inspect action button");
    });

    it("District Authority API should dynamically return district-specific top proposal when district changes", async () => {
      // 1. Darbhanga
      const resDarbhanga = await fetch(`${BACKEND_BASE}/dashboard?role=district&jurisdiction=Darbhanga`);
      assert.equal(resDarbhanga.status, 200);
      const dataDarbhanga = await resDarbhanga.json();
      assert.ok(dataDarbhanga.top_flagged_works.length > 0, "Darbhanga should have proposals");
      const topDarbhanga = dataDarbhanga.top_flagged_works[0].id;
      assert.equal(topDarbhanga, "MPLADS-003277");

      // 2. Salem - must NOT be MPLADS-003277
      const resSalem = await fetch(`${BACKEND_BASE}/dashboard?role=district&jurisdiction=Salem`);
      assert.equal(resSalem.status, 200);
      const dataSalem = await resSalem.json();
      assert.ok(dataSalem.top_flagged_works.length > 0, "Salem should have proposals");
      const topSalem = dataSalem.top_flagged_works[0].id;
      assert.notEqual(topSalem, "MPLADS-003277", "Salem top proposal must not be Darbhanga proposal");
      assert.equal(topSalem, "MPLADS-001216");

      // 3. Patna - must NOT be MPLADS-003277
      const resPatna = await fetch(`${BACKEND_BASE}/dashboard?role=district&jurisdiction=Patna`);
      assert.equal(resPatna.status, 200);
      const dataPatna = await resPatna.json();
      assert.ok(dataPatna.top_flagged_works.length > 0, "Patna should have proposals");
      assert.notEqual(dataPatna.top_flagged_works[0].id, "MPLADS-003277");

      // 4. Gaya - fallback should ensure top work is present even if low risk
      const resGaya = await fetch(`${BACKEND_BASE}/dashboard?role=district&jurisdiction=Gaya`);
      assert.equal(resGaya.status, 200);
      const dataGaya = await resGaya.json();
      assert.ok(dataGaya.top_flagged_works.length > 0, "Gaya should return top work via fallback");
    });

    it("Direct Work ID lookup should return complete forensic data for inspection", async () => {
      const res = await fetch(`${BACKEND_BASE}/works/MPLADS-001216`);
      assert.equal(res.status, 200);
      const work = await res.json();
      assert.equal(work.id, "MPLADS-001216");
      assert.ok(typeof work.risk_score === "number");
      assert.equal(work.state, "Tamil Nadu");
    });
  });

  describe("Task 3: MP Constituency View - Dynamic Project Spotlight", () => {
    it("MPConstituencyView component should support dynamic activeWork, lookup input, and table inspection", () => {
      const filePath = path.resolve(process.cwd(), "components/dashboard/MPConstituencyView.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      assert.ok(content.includes("activeWork"), "Should declare activeWork state");
      assert.ok(content.includes("handleLookup"), "Should have handleLookup handler");
      assert.ok(content.includes("inputQuery"), "Should support inputQuery state");
      assert.ok(content.includes("mp-project-spotlight"), "Should have spotlight container anchor");
      assert.ok(content.includes("Crosshair"), "Should have inspect action button");
    });

    it("MP Dashboard API should dynamically return MP-specific top proposal when MP changes", async () => {
      // 1. Mr Gopal Jee Thakur
      const resGopal = await fetch(`${BACKEND_BASE}/dashboard?role=mp&jurisdiction=Mr%20Gopal%20Jee%20Thakur`);
      assert.equal(resGopal.status, 200);
      const dataGopal = await resGopal.json();
      assert.ok(dataGopal.top_flagged_works.length > 0);
      const topGopal = dataGopal.top_flagged_works[0].id;
      assert.equal(topGopal, "MPLADS-003277");

      // 2. Hon. MP Aachal Basu - must NOT be MPLADS-003277
      const resBasu = await fetch(`${BACKEND_BASE}/dashboard?role=mp&jurisdiction=Hon.%20MP%20Aachal%20Basu`);
      assert.equal(resBasu.status, 200);
      const dataBasu = await resBasu.json();
      assert.ok(dataBasu.top_flagged_works.length > 0);
      const topBasu = dataBasu.top_flagged_works[0].id;
      assert.notEqual(topBasu, "MPLADS-003277");
      assert.equal(topBasu, "MPLADS-004007");

      // 3. Hon. MP Aadi Naik - must NOT be MPLADS-003277
      const resNaik = await fetch(`${BACKEND_BASE}/dashboard?role=mp&jurisdiction=Hon.%20MP%20Aadi%20Naik`);
      assert.equal(resNaik.status, 200);
      const dataNaik = await resNaik.json();
      assert.ok(dataNaik.top_flagged_works.length > 0);
      const topNaik = dataNaik.top_flagged_works[0].id;
      assert.notEqual(topNaik, "MPLADS-003277");
      assert.equal(topNaik, "MPLADS-004688");

      // 4. Hon. MP Aadhya Mann - fallback should provide top work
      const resMann = await fetch(`${BACKEND_BASE}/dashboard?role=mp&jurisdiction=Hon.%20MP%20Aadhya%20Mann`);
      assert.equal(resMann.status, 200);
      const dataMann = await resMann.json();
      assert.ok(dataMann.top_flagged_works.length > 0, "Aadhya Mann should have top work via fallback");
    });
  });

  describe("Ministry View Verification", () => {
    it("Ministry dashboard returns full national telemetry", async () => {
      const res = await fetch(`${BACKEND_BASE}/dashboard?role=ministry`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.role, "ministry");
      assert.equal(data.jurisdiction, "National");
      assert.ok(data.summary.total_works >= 5000);
      assert.ok(data.extra_insights.vendor_concentration_hhi !== undefined);
      assert.ok(Array.isArray(data.extra_insights.structuring_clusters));
    });
  });
});
