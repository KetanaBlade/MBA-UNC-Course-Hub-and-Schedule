// scripts/test-heuristics.mjs
import assert from "node:assert";

function extractWeekNumber(text) {
  if (!text) return null;
  const clean = text.trim();

  const weekMatch = clean.match(/(?:^|\b|_)week[\s_-]*0*(\d{1,2})\b/i);
  if (weekMatch && weekMatch[1]) {
    const num = parseInt(weekMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  const wMatch = clean.match(/(?:^|\b|_)w[\s_-]*0*(\d{1,2})\b/i);
  if (wMatch && wMatch[1]) {
    const num = parseInt(wMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  const modMatch = clean.match(/(?:^|\b|_)(?:module|mod)[\s_-]*0*(\d{1,2})\b/i);
  if (modMatch && modMatch[1]) {
    const num = parseInt(modMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  const sessionMatch = clean.match(/(?:^|\b|_)(?:session|class)[\s_-]*0*(\d{1,2})\b/i);
  if (sessionMatch && sessionMatch[1]) {
    const num = parseInt(sessionMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  const romanMatch = clean.match(
    /(?:^|\b|_)week[\s_-]*(i{1,3}|iv|v|vi{0,3}|ix|x)\b/i
  );
  if (romanMatch && romanMatch[1]) {
    const roman = romanMatch[1].toLowerCase();
    const romanMap = {
      i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10
    };
    if (romanMap[roman]) return romanMap[roman];
  }

  return null;
}

function categorizeResource(name) {
  const lower = name.toLowerCase();
  if (lower.includes("case") || lower.includes("hbr")) return "case";
  if (lower.endsWith(".pptx") || lower.includes("slides")) return "slides";
  if (lower.endsWith(".xlsx") || lower.includes("model")) return "spreadsheet";
  if (lower.includes("syllabus")) return "syllabus";
  return "reading";
}

function extractZoomLinks(html) {
  if (!html) return [];
  const urls = [];
  const zoomRegex = /https:\/\/[a-zA-Z0-9.-]*zoom\.us\/(?:j|my)\/[a-zA-Z0-9?=&_-]+/gi;
  let match;
  while ((match = zoomRegex.exec(html)) !== null) {
    if (!urls.includes(match[0])) urls.push(match[0]);
  }
  return urls;
}

console.log("Running Heuristic & Parser Verification Tests...");

// Test Week Extraction
assert.strictEqual(extractWeekNumber("Week 1 - Introduction"), 1);
assert.strictEqual(extractWeekNumber("Week 02 - Balance Sheets"), 2);
assert.strictEqual(extractWeekNumber("Homework 3"), null);
assert.strictEqual(extractWeekNumber("Week 3 Homework"), 3);
assert.strictEqual(extractWeekNumber("Files / Week 4 / Pre-readings"), 4);
assert.strictEqual(extractWeekNumber("W05 Lecture Notes"), 5);
assert.strictEqual(extractWeekNumber("Module 6: Supply Chain"), 6);
assert.strictEqual(extractWeekNumber("Session 7 Case Discussion"), 7);
assert.strictEqual(extractWeekNumber("Week IV Review"), 4);
console.log("✔ Week number extraction tests passed!");

// Test Resource Categorization
assert.strictEqual(categorizeResource("Midwest Electric HBR Case Study.pdf"), "case");
assert.strictEqual(categorizeResource("Financial Accounting Syllabus Fall 2026.docx"), "syllabus");
assert.strictEqual(categorizeResource("Week 2 Presentation Slides.pptx"), "slides");
assert.strictEqual(categorizeResource("Three-Statement Financial Model.xlsx"), "spreadsheet");
assert.strictEqual(categorizeResource("Chapter 4 Reading - Goodwill & Intangibles.pdf"), "reading");
console.log("✔ Resource categorization tests passed!");

// Test Zoom Extraction
const htmlWithZoom = `<p>Join our live session here: <a href="https://unc.zoom.us/j/98421038291?pwd=abc">Zoom Link</a></p>`;
const extracted = extractZoomLinks(htmlWithZoom);
assert.strictEqual(extracted.length, 1);
assert.strictEqual(extracted[0], "https://unc.zoom.us/j/98421038291?pwd=abc");
console.log("✔ Zoom link extraction tests passed!");

console.log("\nALL HEURISTICS TESTS PASSED SUCCESSFULLY! 🚀");
