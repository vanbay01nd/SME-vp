import assert from "node:assert/strict";
import test, { after } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

test("Privacy Masking Engine: name, CIF, phone, tax ID masking", async () => {
  const {
    maskName,
    maskCif,
    maskPhone,
    maskTaxId,
    maskStaffName,
    maskDepartment,
    maskField,
    DEFAULT_PRIVACY_CONFIG,
  } = await vite.ssrLoadModule("/lib/privacy.ts");

  // Name masking
  assert.equal(maskName("Nguyễn Văn A", "off"), "Nguyễn Văn A");
  assert.equal(maskName("Nguyễn Văn A", "full"), "••••••••");
  assert.equal(maskName("Nguyễn Văn An", "partial"), "Nguyễn V*** A***");

  // CIF masking
  assert.equal(maskCif("12345678", "off"), "12345678");
  assert.equal(maskCif("12345678", "full"), "••••••••");
  assert.equal(maskCif("12345678", "partial"), "123****78");

  // Phone masking
  assert.equal(maskPhone("0912345678", "off"), "0912345678");
  assert.equal(maskPhone("0912345678", "full"), "••••••••");
  assert.equal(maskPhone("0912345678", "partial"), "0912****78");

  // Tax ID masking
  assert.equal(maskTaxId("0101234567", "off"), "0101234567");
  assert.equal(maskTaxId("0101234567", "full"), "••••••••");
  assert.equal(maskTaxId("0101234567", "partial"), "01******67");

  // Staff and Dept
  assert.equal(maskStaffName("Nguyễn Văn B", "partial"), "N***");
  assert.equal(maskDepartment("Phòng KHDN 1", "partial"), "Phò***");

  // Master maskField with config
  const customConfig = {
    level: "partial",
    fields: {
      customerName: true,
      cif: true,
      phone: true,
      taxId: true,
      staffName: true,
      department: true,
    },
  };
  assert.equal(maskField("Công ty TNHH ABC", "customerName", customConfig), "Công t*** T*** A***");
});

test("Note Templates: placeholder rendering", async () => {
  const { renderNoteTemplate, noteTemplates } = await vite.ssrLoadModule("/lib/note-templates.ts");

  assert.equal(noteTemplates.length, 4);

  const sampleTask = {
    id: "999",
    customer: "Công ty ABC",
    cif: "888888",
    source: "Chiến dịch Q1",
  };

  const rendered = renderNoteTemplate("Liên hệ {customer} task #{taskId} CIF {cif} nguồn {source}", sampleTask);
  assert.equal(rendered, "Liên hệ Công ty ABC task #999 CIF 888888 nguồn Chiến dịch Q1");
});

test("Disclaimer & Tips: contents and validity", async () => {
  const { DISCLAIMER_SECTIONS, DISCLAIMER_VERSION } = await vite.ssrLoadModule("/lib/disclaimer.ts");
  const { TIPS, getRandomTip, getDailyTip } = await vite.ssrLoadModule("/lib/tips.ts");

  assert.equal(DISCLAIMER_VERSION, "v1");
  assert.equal(DISCLAIMER_SECTIONS.length, 5);
  DISCLAIMER_SECTIONS.forEach((section) => {
    assert.ok(section.title);
    assert.ok(Array.isArray(section.items));
    assert.ok(section.items.length > 0);
  });

  assert.ok(TIPS.length >= 8);
  assert.ok(typeof getRandomTip() === "string");
  assert.ok(typeof getDailyTip() === "string");
});

test("CSS Classes & 4-Breakpoint Responsive System", () => {
  const cssPath = path.join(root, "app", "globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  const requiredClasses = [
    ".customer-cell",
    ".company-icon",
    ".cell-sub",
    ".source-cell",
    ".status-dot",
    ".due-now",
    ".due",
    ".priority",
    ".empty-table",
    ".check-col",
    ".detail-kicker",
    ".detail-card",
    ".batch-summary",
    ".lead-360",
    ".lead-360-heading",
    ".lead-meta-grid",
    ".lead-context-grid",
    ".timeline-card",
    ".context-title",
    ".timeline-item",
    ".context-empty",
    ".context-loading",
    ".activity-form-panel",
    ".panel-subhead",
    ".picker-label",
    ".note-footer",
    ".draft-tag",
    ".personalize-toggle",
    ".process-progress-strip",
    ".submit-section",
    ".tip-banner",
    ".footer-disclaimer",
    ".connection-sheet",
    ".connection-header",
    ".connection-title-row",
    ".connection-title-icon",
    ".sheet-form",
    ".security-note",
    ".connection-tabs",
    ".credential-card",
    ".method-heading",
    ".identity-grid",
    ".credential-error",
    ".mobile-token-card",
    ".token-steps",
    ".fallback-connect-card",
    ".audit-panel",
    ".audit-filter-bar",
    ".audit-filter-buttons",
    ".audit-filter-active",
    ".audit-customer",
    ".audit-warning",
    ".audit-error",
    ".compact-empty",
    ".audit-mobile-list",
    ".audit-desktop-table",
    ".search-wrap",
    ".contractor-card-header",
    ".contractor-chip",
    ".contractor-quick-badges",
    ".bid-overview-summary",
    ".contractor-packages-section",
    ".contractor-stat-grid",
    ".package-list",
    ".package-item",
    ".package-meta",
  ];

  for (const cls of requiredClasses) {
    assert.ok(
      css.includes(cls),
      `Expected globals.css to contain class "${cls}"`,
    );
  }

  assert.ok(css.includes("@media (max-width: 1280px)"), "Missing 1280px breakpoint");
  assert.ok(css.includes("@media (max-width: 1024px)"), "Missing 1024px breakpoint");
  assert.ok(css.includes("@media (max-width: 768px)"), "Missing 768px breakpoint");
  assert.ok(css.includes("@media (max-width: 480px)"), "Missing 480px breakpoint");

  assert.ok(css.includes("safe-area-inset-bottom"), "Missing safe-area-inset support");
  assert.ok(css.includes("pointer: coarse"), "Missing touch media query");
  assert.ok(css.includes("prefers-reduced-motion"), "Missing accessibility reduced motion query");
});

