const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const { normalizeResponse, buildPrompt } = require("../lib/summary-core");

const storage = new Map();
const domStore = new Map();
function element(id) {
  if (!domStore.has(id)) {
    domStore.set(id, {
      id,
      value: "",
      textContent: "",
      innerHTML: "",
      className: "",
      dataset: {},
      disabled: false,
      addEventListener() {},
      classList: { toggle() {} }
    });
  }
  return domStore.get(id);
}

const context = {
  console,
  alert() {},
  confirm() { return true; },
  setTimeout,
  clearTimeout,
  fetch,
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value)
  },
  document: {
    addEventListener() {},
    getElementById: element,
    querySelector() { return null; }
  }
};

vm.createContext(context);
vm.runInContext(`${fs.readFileSync("app.js", "utf8")}
globalThis.__summaryTest = { state, dom, canGoNext, canForceSkip, currentDraft, saveCurrentDraft, recordAttempt, renderArchive, parseImportedText };`, context);

const app = context.__summaryTest;
const tsv = app.parseImportedText("标题A\t正文A\t参考A\n标题B\t正文B\t参考B");
assert.strictEqual(tsv.length, 2);
assert.strictEqual(tsv[0].title, "标题A");
assert.strictEqual(tsv[0].body, "正文A");
assert.strictEqual(tsv[0].reference, "参考A");

const csv = app.parseImportedText("title,body,reference\n标题A,\"正文,含逗号\",参考A");
assert.strictEqual(csv.length, 1);
assert.strictEqual(csv[0].body, "正文,含逗号");

const md = app.parseImportedText("# 标题A\n正文A\n\n正文B");
assert.strictEqual(md.length, 2);
assert.strictEqual(md[0].title, "标题A");

const payload = {
  threshold: 75,
  passage: { title: "测试", body: "总结不是缩短，而是形成可调用入口。" },
  summary: "总结是把材料变成可调用入口。"
};
assert.ok(buildPrompt(payload).includes("SUMMARY_PROFILE"));

const pass = normalizeResponse(JSON.stringify({
  verdict: "pass",
  score: 82,
  headline: "可用",
  feedback: "抓住了核心。",
  revisedSummary: "总结是把材料压成可调用入口。",
  referenceAnswer: "总结是在具体问题下形成可调用入口。",
  shouldAdvance: true
}), payload);
assert.strictEqual(pass.passed, true);
assert.strictEqual(pass.shouldAdvance, true);

const fail = normalizeResponse(JSON.stringify({
  verdict: "pass",
  score: 60,
  headline: "不够",
  feedback: "太泛。",
  revisedSummary: "总结是形成入口。",
  referenceAnswer: "总结是在具体问题下形成可调用入口。"
}), payload);
assert.strictEqual(fail.passed, false);
assert.strictEqual(fail.shouldAdvance, false);

app.state.passages = tsv;
app.state.currentIndex = 0;
app.state.attempts = [];
app.dom.summaryInput = element("summaryInput");
app.dom.summaryInput.value = "这是当前草稿";
app.saveCurrentDraft();
assert.strictEqual(app.currentDraft(), "这是当前草稿");
assert.ok(app.state.attempts.some((item) => item.draft && item.summary === "这是当前草稿"));
assert.strictEqual(app.canGoNext(), false);
assert.strictEqual(app.canForceSkip(), false);
app.recordAttempt(tsv[0], { summary: "不够", score: 40, passed: false, feedback: "不通过" });
assert.strictEqual(app.canGoNext(), false);
assert.strictEqual(app.canForceSkip(), true);
app.recordAttempt(tsv[0], { summary: "通过", score: 80, passed: true, feedback: "通过" });
assert.strictEqual(app.canGoNext(), true);
assert.strictEqual(app.canForceSkip(), false);
assert.strictEqual(app.state.attempts.filter((item) => item.passageId === tsv[0].id && !item.draft).length, 2);

app.state.cloud.status = "needs-setup";
app.state.cloud.lastError = "云端表还没准备好：请在 Supabase 执行 docs/cloud-sync.sql";
app.dom.archiveMeta = element("archiveMeta");
app.dom.archiveList = element("archiveList");
app.renderArchive();
assert.ok(element("archiveList").innerHTML.includes("docs/cloud-sync.sql"));

console.log("smoke-check passed");
