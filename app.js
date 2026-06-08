const STORAGE_KEY = "how-to-summarize-state-v1";
const SUPABASE_URL = "https://vcixggayhuzrjpzutnkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7867l84YC9AM3L4c5Wudlw_Wo64GlzC";
const CLOUD_TABLE = "summary_habit_records";
const PROJECT_ID = "how-to-summarize";
const MODEL_SELECTOR_PROJECT_CODE = "model_selector_summary-SUM01";
const SELECTOR_STATE_ENDPOINT = "https://pn4w9qze.vercel.app/api/selector-state";
const SELECTOR_MODELS_ENDPOINT = "https://pn4w9qze.vercel.app/api/models";
const MODEL_SELECTOR_ACCESS_TOKEN = "202306313";
const PASS_THRESHOLD = 75;

const SAMPLE_IMPORT = `总结不是缩短\t总结不是把长话说短，而是在一个具体问题下，把材料压缩成可复核、可调用、可行动的入口，并让下一步行动或规则发生变化。\t总结是在具体问题下形成可复核、可调用、能改变行动的入口，而不是单纯缩短文字。
坏总结警报\t只有“我懂了”，没有文字表述；只有摘抄，没有自己的问题和判断；只有结论，没有依据入口；只有感慨，没有行动或规则，这些都说明总结没有真正完成。\t坏总结的共同问题是没有把材料变成可检查、可调用、能影响下一步的文本。`;

const dom = {};
let state = normalizeState(loadState());
let selectorInstance = null;
let cloudHydrated = false;
let cloudTimer = null;
let submitting = false;
let submittingModel = "";

document.addEventListener("DOMContentLoaded", () => {
  bindDom();
  bindEvents();
  render();
  hydrateCloud();
});

function createState() {
  return {
    recordId: createId(),
    title: "一句话总结训练",
    currentIndex: 0,
    passages: samplePassages(),
    attempts: [],
    settings: { modelSelectionReference: null },
    cloud: { records: [], status: "offline", syncing: false, lastSyncAt: "", lastError: "" },
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

function normalizeState(raw) {
  const fallback = createState();
  const source = raw && typeof raw === "object" ? raw : {};
  const passages = Array.isArray(source.passages) && source.passages.length ? source.passages.map(normalizePassage) : fallback.passages;
  return {
    ...fallback,
    ...source,
    title: String(source.title || fallback.title),
    currentIndex: clamp(Number(source.currentIndex || 0), 0, Math.max(0, passages.length - 1)),
    passages,
    attempts: Array.isArray(source.attempts) ? source.attempts : [],
    settings: {
      modelSelectionReference: sanitizeSelectionReference(source.settings?.modelSelectionReference)
    },
    cloud: {
      records: Array.isArray(source.cloud?.records) ? source.cloud.records : [],
      status: source.cloud?.status || "offline",
      syncing: false,
      lastSyncAt: source.cloud?.lastSyncAt || "",
      lastError: source.cloud?.lastError || ""
    }
  };
}

function normalizePassage(item, index = 0) {
  const body = String(item?.body || item?.text || "").trim();
  return {
    id: item?.id || createId("p"),
    title: String(item?.title || `片段 ${index + 1}`).trim(),
    body,
    source: String(item?.source || "").trim(),
    reference: String(item?.reference || "").trim()
  };
}

function samplePassages() {
  return parseImportedText(SAMPLE_IMPORT);
}

function bindDom() {
  for (const id of [
    "progressLabel", "passLabel", "cloudLabel", "modelButton", "newDeck", "importText", "importButton",
    "sampleButton", "fileInput", "archiveDetails", "archiveMeta", "cloudRefresh", "archiveList",
    "passageKicker", "passageTitle", "passageBody", "prevPassage", "nextPassage", "forceSkip",
    "sentenceHint", "summaryInput", "submitStatus", "submitSummary", "feedbackPanel", "feedbackTitle",
    "scoreBadge", "feedbackBody"
  ]) dom[id] = document.getElementById(id);
}

function bindEvents() {
  dom.modelButton.addEventListener("click", openSelector);
  dom.newDeck.addEventListener("click", newDeck);
  dom.importButton.addEventListener("click", importFromTextarea);
  dom.sampleButton.addEventListener("click", () => {
    dom.importText.value = SAMPLE_IMPORT;
  });
  dom.fileInput.addEventListener("change", importFromFile);
  dom.prevPassage.addEventListener("click", () => {
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    persist();
  });
  dom.nextPassage.addEventListener("click", goNext);
  dom.forceSkip.addEventListener("click", forceSkip);
  dom.submitSummary.addEventListener("click", submitSummary);
  dom.summaryInput.addEventListener("input", () => {
    updateSentenceHint();
    saveCurrentDraft();
  });
  dom.cloudRefresh.addEventListener("click", () => refreshCloud(false));
  dom.archiveList.addEventListener("click", handleArchiveAction);
}

function render() {
  renderHeader();
  renderPassage();
  renderFeedback();
  renderArchive();
}

function renderHeader() {
  const total = state.passages.length;
  const passed = state.passages.filter((item) => latestAttempt(item.id)?.passed).length;
  dom.progressLabel.textContent = total ? `${state.currentIndex + 1} / ${total}` : "0 / 0";
  dom.passLabel.textContent = `通过 ${passed}`;
  dom.cloudLabel.textContent = cloudText();
  dom.modelButton.textContent = state.settings.modelSelectionReference ? "模型已连接" : "模型未连接";
  dom.modelButton.dataset.connected = state.settings.modelSelectionReference ? "true" : "false";
}

function renderPassage() {
  const passage = currentPassage();
  const total = state.passages.length;
  const attempt = latestAttempt(passage?.id);
  dom.passageKicker.textContent = total ? `片段 ${state.currentIndex + 1} / ${total}` : "等待导入";
  dom.passageTitle.textContent = passage?.title || "先导入一组训练片段";
  dom.passageBody.textContent = passage?.body || "粘贴或上传材料后，从第一段开始训练。";
  dom.prevPassage.disabled = state.currentIndex <= 0;
  dom.nextPassage.disabled = !canGoNext();
  dom.forceSkip.disabled = !canForceSkip();
  dom.summaryInput.value = currentDraft();
  dom.submitSummary.disabled = submitting || !passage;
  dom.submitSummary.textContent = submitting ? "评分中..." : "评分";
  updateSentenceHint();
  dom.submitStatus.textContent = submitting ? submittingStatusText() : submitStatusText(attempt);
}

function renderFeedback() {
  const attempt = latestAttempt(currentPassage()?.id);
  dom.feedbackPanel.classList.toggle("is-empty", !attempt);
  if (!attempt) {
    dom.feedbackTitle.textContent = "等待提交";
    dom.scoreBadge.textContent = "--";
    dom.scoreBadge.className = "score-badge";
    dom.feedbackBody.className = "feedback-body muted";
    dom.feedbackBody.textContent = "提交后显示分数、是否通过、修正建议。参考答案默认隐藏。";
    return;
  }

  dom.feedbackTitle.textContent = attempt.forced ? "已强制跳过" : attempt.passed ? "本段通过" : "需要重写";
  dom.scoreBadge.textContent = attempt.forced ? "跳过" : `${attempt.score}`;
  dom.scoreBadge.className = `score-badge ${attempt.passed ? "pass" : "revise"}`;
  const missing = attempt.missing?.length ? `<ul>${attempt.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>无明显缺口。</p>";
  dom.feedbackBody.className = "feedback-body";
  dom.feedbackBody.innerHTML = `<article class="feedback-card">
    <section><h3>判断</h3><p>${escapeHtml(attempt.headline || "")}</p></section>
    ${attempt.modelLabel ? `<section><h3>回复模型</h3><p>${escapeHtml(attempt.modelLabel)}</p></section>` : ""}
    <section><h3>反馈</h3><p>${escapeHtml(attempt.feedback || "")}</p></section>
    <section><h3>缺口</h3>${missing}</section>
    <section><h3>修正版</h3><p>${escapeHtml(attempt.revisedSummary || "")}</p></section>
    <details class="reference-answer"><summary>参考答案</summary><p>${escapeHtml(attempt.referenceAnswer || currentPassage()?.reference || "暂无参考答案。")}</p></details>
    <section><h3>下一步</h3><p>${escapeHtml(attempt.nextAction || "")}</p></section>
  </article>
  ${renderAttemptHistory(currentPassage()?.id, attempt.id)}`;
}

function renderAttemptHistory(passageId, latestId) {
  const history = attemptsForPassage(passageId)
    .filter((item) => item.id !== latestId)
    .slice(-6)
    .reverse();
  if (!history.length) return "";
  return `<details class="attempt-history">
    <summary>查看本段过去尝试（${history.length}）</summary>
    <div class="attempt-history-list">
      ${history.map((item) => `<article class="attempt-history-item">
        <div><strong>${escapeHtml(item.passed ? "通过" : item.forced ? "跳过" : "未通过")} · ${escapeHtml(String(item.score || 0))}</strong><span>${escapeHtml(formatTime(item.createdAt))}</span></div>
        <p>${escapeHtml(item.summary || "")}</p>
        ${item.feedback ? `<small>${escapeHtml(compact(item.feedback, 120))}</small>` : ""}
      </article>`).join("")}
    </div>
  </details>`;
}

function renderArchive() {
  const records = state.cloud.records || [];
  dom.archiveMeta.textContent = `${records.length} 条`;
  dom.archiveList.innerHTML = records.map((item) => `<article class="archive-item">
    <strong>${escapeHtml(item.title || "未命名训练")}</strong>
    <p>${escapeHtml(compact(item.summary || "", 90))}</p>
    <footer>
      <span>${escapeHtml(formatTime(item.updatedAt || item.createdAt))}</span>
      <div class="archive-buttons">
        <button class="ghost small" type="button" data-action="open" data-id="${escapeHtml(item.id)}">打开</button>
        <button class="ghost small warn" type="button" data-action="delete" data-id="${escapeHtml(item.id)}">删除</button>
      </div>
    </footer>
  </article>`).join("") || `<p class="muted">暂无云端存档。</p>`;
}

function updateSentenceHint() {
  const text = dom.summaryInput.value.trim();
  if (!text) {
    dom.sentenceHint.textContent = "未填写";
    return;
  }
  const sentenceCount = countSentences(text);
  dom.sentenceHint.textContent = sentenceCount <= 1 ? "一句话" : `${sentenceCount} 句，建议压成一句`;
}

function submitStatusText(attempt) {
  if (!attempt) return "写完后交给 AI 评分。";
  if (attempt.forced) return "本段已强制跳过，可以进入下一段。";
  if (attempt.passed) return "本段已通过，可以进入下一段。";
  return "未通过。请重写后再次评分，或强制跳过。";
}

async function submitSummary() {
  if (submitting) return;
  const passage = currentPassage();
  if (!passage) return;
  const summary = dom.summaryInput.value.trim();
  const local = preflightSummary(summary);
  if (!local.ok) {
    recordAttempt(passage, {
      score: local.score,
      passed: false,
      verdict: "revise",
      headline: local.headline,
      feedback: local.feedback,
      missing: local.missing,
      revisedSummary: "",
      referenceAnswer: passage.reference || "",
      nextAction: local.nextAction
    });
    persist();
    return;
  }

  submitting = true;
  submittingModel = "";
  renderPassage();
  try {
    const activeConfig = await getActiveModelConfig();
    if (!activeConfig) throw new Error("请先点击顶部模型按钮，选择可用模型。");
    submittingModel = describeModelConfig(activeConfig);
    renderPassage();
    const result = await postAi({
      mode: "score",
      threshold: PASS_THRESHOLD,
      passage,
      summary,
      previousAttempts: attemptsForPassage(passage.id),
      providerConfig: activeConfig,
      model: activeConfig.model
    });
    recordAttempt(passage, { ...result, summary, modelLabel: submittingModel });
    persist();
  } catch (error) {
    recordAttempt(passage, {
      summary,
      score: 0,
      passed: false,
      verdict: "revise",
      headline: "AI 请求失败",
      feedback: error.message || "模型服务暂时不可用。",
      missing: ["没有 AI 评分时不能进入下一段。"],
      revisedSummary: "",
      referenceAnswer: passage.reference || "",
      nextAction: "检查模型配置后重新提交。"
    });
    persist();
  } finally {
    submitting = false;
    submittingModel = "";
    render();
  }
}

function preflightSummary(summary) {
  if (!summary) {
    return { ok: false, score: 0, headline: "先写一句总结", feedback: "当前没有任何输出。训练目标是读完以后主动写一句自己的总结。", missing: ["缺少总结文本"], nextAction: "写一句这段材料能回答什么问题或提供什么判断。" };
  }
  if (summary.length < 8) {
    return { ok: false, score: 30, headline: "太短，无法判断", feedback: "这句话短到无法形成可调用入口。", missing: ["材料对象或核心判断"], nextAction: "补出材料对象和核心判断。" };
  }
  if (/很有道理|我懂了|讲得很好|中心思想|告诉我们|下次注意|继续努力/.test(summary)) {
    return { ok: false, score: 45, headline: "像感想，不像总结", feedback: "这类表达不能帮助未来的自己调用材料。", missing: ["具体问题、判断或用途"], nextAction: "改写成：这段材料在什么问题下给了什么判断。" };
  }
  return { ok: true };
}

function recordAttempt(passage, result) {
  const normalized = {
    id: createId("a"),
    passageId: passage.id,
    summary: String(result.summary || dom.summaryInput.value || "").trim(),
    score: Number(result.score || 0),
    verdict: result.verdict || (result.passed ? "pass" : "revise"),
    passed: Boolean(result.passed || result.shouldAdvance),
    forced: Boolean(result.forced),
    headline: result.headline || "",
    feedback: result.feedback || "",
    missing: Array.isArray(result.missing) ? result.missing : [],
    revisedSummary: result.revisedSummary || "",
    referenceAnswer: result.referenceAnswer || passage.reference || "",
    reason: result.reason || "",
    nextAction: result.nextAction || "",
    modelLabel: result.modelLabel || "",
    createdAt: nowIso()
  };
  state.attempts = state.attempts.filter((item) => !(item.passageId === passage.id && item.draft));
  state.attempts.push(normalized);
}

function saveCurrentDraft() {
  const passage = currentPassage();
  if (!passage) return;
  const summary = dom.summaryInput.value;
  const existing = state.attempts.find((item) => item.passageId === passage.id && item.draft);
  const at = nowIso();
  if (existing) {
    existing.summary = summary;
    existing.updatedAt = at;
  } else {
    state.attempts.push({ id: createId("d"), passageId: passage.id, summary, draft: true, createdAt: at, updatedAt: at });
  }
  state.updatedAt = nowIso();
  saveState();
  scheduleCloudSync();
}

function currentDraft() {
  const passage = currentPassage();
  if (!passage) return "";
  const draft = [...state.attempts].reverse().find((item) => item.passageId === passage.id && item.draft);
  return draft?.summary || latestAttempt(passage.id)?.summary || "";
}

function latestAttempt(passageId) {
  if (!passageId) return null;
  return [...state.attempts].reverse().find((item) => item.passageId === passageId && !item.draft) || null;
}

function attemptsForPassage(passageId) {
  return state.attempts.filter((item) => item.passageId === passageId && !item.draft);
}

function currentPassage() {
  return state.passages[state.currentIndex] || null;
}

function canGoNext() {
  const passage = currentPassage();
  if (!passage || state.currentIndex >= state.passages.length - 1) return false;
  const attempt = latestAttempt(passage.id);
  return Boolean(attempt?.passed || attempt?.forced);
}

function canForceSkip() {
  const passage = currentPassage();
  if (!passage) return false;
  const attempt = latestAttempt(passage.id);
  return Boolean(attempt && !attempt.passed && !attempt.forced);
}

function goNext() {
  if (!canGoNext()) return;
  state.currentIndex = Math.min(state.passages.length - 1, state.currentIndex + 1);
  persist();
}

function forceSkip() {
  const passage = currentPassage();
  if (!canForceSkip()) return;
  if (!passage || !confirm("强制跳过会记录为未通过跳过。确定继续？")) return;
  recordAttempt(passage, {
    summary: dom.summaryInput.value.trim(),
    score: 0,
    passed: false,
    forced: true,
    headline: "已强制跳过",
    feedback: "这次没有通过 AI 评分，但你选择继续训练下一段。",
    missing: ["本段没有形成合格总结"],
    nextAction: "下一段继续先写一句自己的总结。"
  });
  persist();
}

function importFromTextarea() {
  const passages = parseImportedText(dom.importText.value);
  if (!passages.length) {
    alert("没有识别到可导入的段落。");
    return;
  }
  state.passages = passages;
  state.currentIndex = 0;
  state.attempts = [];
  state.title = `一句话总结训练 · ${passages.length} 段`;
  persist();
}

async function importFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  dom.importText.value = text;
  importFromTextarea();
  event.target.value = "";
}

function parseImportedText(text) {
  const value = String(text || "").trim();
  if (!value) return [];
  const tabRows = parseDelimitedRows(value, "\t");
  if (tabRows.length) {
    return rowsToPassages(tabRows);
  }
  const csvRows = value.includes("\n") ? parseDelimitedRows(value, ",") : [];
  if (csvRows.length) {
    return rowsToPassages(csvRows);
  }
  return value.split(/\n\s*---\s*\n|\n{2,}/).map((block, index) => {
    const lines = block.trim().split(/\r?\n/).filter(Boolean);
    const heading = lines[0]?.replace(/^#+\s*/, "");
    const hasHeading = /^#/.test(lines[0] || "");
    return normalizePassage({
      title: hasHeading ? heading : `片段 ${index + 1}`,
      body: hasHeading ? lines.slice(1).join("\n") : lines.join("\n")
    }, index);
  }).filter((item) => item.body);
}

function parseDelimitedRows(text, delimiter) {
  const rows = String(text || "")
    .split(/\r?\n/)
    .map((line) => splitDelimitedLine(line, delimiter).map((part) => part.trim()))
    .filter((cells) => cells.some(Boolean));
  const dataRows = rows.filter((cells) => cells.length >= 2 && cells[1]);
  if (!dataRows.length) return [];
  const first = dataRows[0].map((cell) => cell.toLowerCase());
  const hasHeader = first.some((cell) => ["title", "标题", "front", "question"].includes(cell)) &&
    first.some((cell) => ["body", "正文", "back", "text", "内容"].includes(cell));
  return hasHeader ? dataRows.slice(1) : dataRows;
}

function splitDelimitedLine(line, delimiter) {
  if (delimiter === "\t") return String(line || "").split("\t");
  const cells = [];
  let current = "";
  let quoted = false;
  const text = String(line || "");
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === "\"") {
      if (quoted && text[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function rowsToPassages(rows) {
  return rows.map((cells, index) => {
    const [first, second, third] = cells;
    const body = second || first;
    return normalizePassage({
      title: second ? first : `片段 ${index + 1}`,
      body,
      reference: third || ""
    }, index);
  }).filter((item) => item.body);
}

function newDeck() {
  if (!confirm("新建会清空当前本地训练。已同步存档仍可打开。")) return;
  const cloud = state.cloud;
  const selection = state.settings.modelSelectionReference;
  state = createState();
  state.cloud = cloud;
  state.settings.modelSelectionReference = selection;
  persist();
}

async function initModelSelector() {
  try {
    const mod = await import("./model-selector/src/connect-model-selector.js");
    selectorInstance = await mod.connectFloatingModelSelector({
      projectId: PROJECT_ID,
      projectCode: MODEL_SELECTOR_PROJECT_CODE,
      selectionReference: state.settings.modelSelectionReference,
      stateEndpoint: SELECTOR_STATE_ENDPOINT,
      modelsEndpoint: SELECTOR_MODELS_ENDPOINT,
      modelSelectorAccessToken: MODEL_SELECTOR_ACCESS_TOKEN,
      providerIconBaseUrl: "/model-selector/assets/provider-icons/",
      defaultOpen: false,
      onChange(activeConfig) {
        const ref = sanitizeSelectionReference(activeConfig?.selectionReference);
        if (ref) {
          state.settings.modelSelectionReference = ref;
          saveState();
          scheduleCloudSync();
          renderHeader();
        }
      },
      onRuntimeChange(activeConfig) {
        const ref = sanitizeSelectionReference(activeConfig?.selectionReference);
        if (ref) state.settings.modelSelectionReference = ref;
        renderHeader();
      }
    });
    document.querySelector(".ms-floating-host")?.classList.add("selector-host-via-status");
    const active = selectorInstance?.getActiveConfig?.({ maskSecrets: false });
    const ref = sanitizeSelectionReference(active?.selectionReference);
    if (ref) state.settings.modelSelectionReference = ref;
    renderHeader();
  } catch (error) {
    console.warn("Model selector unavailable", error);
  }
}

async function openSelector() {
  if (!selectorInstance) await initModelSelector();
  selectorInstance?.open?.();
}

async function getActiveModelConfig() {
  if (!selectorInstance) await initModelSelector();
  const config = selectorInstance?.getActiveConfig?.({ maskSecrets: false });
  return config?.apiKey && config?.model ? config : null;
}

function describeModelConfig(config) {
  if (!config || typeof config !== "object") return "当前模型";
  const provider = config.providerName || config.providerLabel || config.providerId || config.provider || "";
  const model = config.modelName || config.model || "";
  const keyAlias = config.keyAlias ? ` · ${config.keyAlias}` : "";
  return `${[provider, model].filter(Boolean).join(" / ") || "当前模型"}${keyAlias}`;
}

function submittingStatusText() {
  return submittingModel ? `正在用 ${submittingModel} 评分...` : "正在读取模型配置...";
}

async function postAi(payload) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || `AI 请求失败：${response.status}`);
  return data;
}

async function hydrateCloud() {
  try {
    state.cloud.status = "syncing";
    renderArchive();
    const records = await readCloudRecords();
    state.cloud.records = records;
    state.cloud.status = "ready";
    cloudHydrated = true;
    await syncCloudNow();
  } catch (error) {
    state.cloud.status = isSetupError(error.message) ? "needs-setup" : "error";
    state.cloud.lastError = formatCloudError(error.message);
    cloudHydrated = true;
    persist(false);
  }
}

async function readCloudRecords() {
  const rows = await supabaseRequest(`${CLOUD_TABLE}?namespace=eq.personal&project_id=eq.${PROJECT_ID}&select=*&order=updated_at.desc`);
  return rows.map(rowToRecord);
}

async function syncCloudNow() {
  if (!cloudHydrated || !hasSyncableContent()) return;
  state.cloud.syncing = true;
  renderArchive();
  const payload = cloudPayload();
  const rows = await supabaseRequest(`${CLOUD_TABLE}?on_conflict=namespace,project_id,record_id`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([payload])
  });
  const saved = Array.isArray(rows) ? rows[0] : null;
  state.cloud.lastSyncAt = saved?.updated_at || payload.updated_at;
  state.cloud.status = "synced";
  state.cloud.syncing = false;
  state.cloud.lastError = "";
  state.cloud.records = await readCloudRecords();
  saveState();
  renderHeader();
  renderArchive();
}

function scheduleCloudSync() {
  if (!cloudHydrated) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => syncCloudNow().catch((error) => {
    state.cloud.status = isSetupError(error.message) ? "needs-setup" : "error";
    state.cloud.lastError = formatCloudError(error.message);
    state.cloud.syncing = false;
    saveState();
    renderHeader();
    renderArchive();
  }), 1500);
}

async function refreshCloud(silent = false) {
  try {
    if (!silent) state.cloud.syncing = true;
    renderArchive();
    if (hasSyncableContent()) await syncCloudNow();
    state.cloud.records = await readCloudRecords();
    state.cloud.status = "synced";
    state.cloud.lastError = "";
    persist(false);
  } catch (error) {
    state.cloud.status = isSetupError(error.message) ? "needs-setup" : "error";
    state.cloud.lastError = formatCloudError(error.message);
    persist(false);
  }
}

async function handleArchiveAction(event) {
  const id = event.target?.dataset?.id;
  const action = event.target?.dataset?.action;
  if (!id || !action) return;
  if (action === "open") {
    await openCloudRecord(id);
    return;
  }
  if (action === "delete") await deleteCloudRecord(id);
}

async function openCloudRecord(id) {
  const rows = await supabaseRequest(`${CLOUD_TABLE}?namespace=eq.personal&project_id=eq.${PROJECT_ID}&record_id=eq.${encodeURIComponent(id)}&select=*`);
  const row = rows[0];
  if (!row) return;
  const keepCloud = state.cloud;
  state = normalizeState(row.state || {});
  state.cloud = keepCloud;
  state.currentIndex = clamp(state.currentIndex, 0, Math.max(0, state.passages.length - 1));
  saveState();
  render();
}

async function deleteCloudRecord(id) {
  if (!confirm("确定删除这条云端存档？此操作不会删除模型配置。")) return;
  try {
    await supabaseRequest(`${CLOUD_TABLE}?namespace=eq.personal&project_id=eq.${PROJECT_ID}&record_id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    state.cloud.records = state.cloud.records.filter((item) => item.id !== id);
    if (state.recordId === id) {
      const cloud = state.cloud;
      const selection = state.settings.modelSelectionReference;
      state = createState();
      state.cloud = cloud;
      state.settings.modelSelectionReference = selection;
    }
    state.cloud.status = "synced";
    state.cloud.lastError = "";
    saveState();
    render();
  } catch (error) {
    state.cloud.status = isSetupError(error.message) ? "needs-setup" : "error";
    state.cloud.lastError = formatCloudError(error.message);
    saveState();
    renderHeader();
    renderArchive();
  }
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase 请求失败：${response.status}`);
  return text ? JSON.parse(text) : [];
}

function cloudPayload() {
  const at = nowIso();
  return {
    namespace: "personal",
    project_id: PROJECT_ID,
    record_id: state.recordId,
    title: state.title || "一句话总结训练",
    status: trainingStatus(),
    summary: archiveSummary(),
    state: cloudState(),
    created_at: state.createdAt,
    updated_at: at,
    completed_at: trainingStatus() === "completed" ? at : null
  };
}

function cloudState() {
  return {
    ...state,
    cloud: { records: [], status: state.cloud.status, lastSyncAt: state.cloud.lastSyncAt, lastError: "" },
    settings: { modelSelectionReference: sanitizeSelectionReference(state.settings.modelSelectionReference) }
  };
}

function rowToRecord(row) {
  return {
    id: row.record_id,
    title: row.title,
    status: row.status,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function persist(shouldSync = true) {
  state.updatedAt = nowIso();
  saveState();
  render();
  if (shouldSync) scheduleCloudSync();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState()));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function hasSyncableContent() {
  return state.passages.length > 0;
}

function trainingStatus() {
  const total = state.passages.length;
  if (!total) return "drafting";
  const done = state.passages.filter((item) => {
    const attempt = latestAttempt(item.id);
    return attempt?.passed || attempt?.forced;
  }).length;
  return done >= total ? "completed" : "active";
}

function archiveSummary() {
  const passed = state.passages.filter((item) => latestAttempt(item.id)?.passed).length;
  const forced = state.passages.filter((item) => latestAttempt(item.id)?.forced).length;
  return `${state.passages.length} 段，${passed} 段通过，${forced} 段跳过。`;
}

function cloudText() {
  if (state.cloud.syncing) return "云端同步中";
  if (state.cloud.status === "synced") return "云端已同步";
  if (state.cloud.status === "needs-setup") return "云端表未建";
  if (state.cloud.status === "error") return "云端异常";
  return "云端待同步";
}

function formatCloudError(text) {
  if (isSetupError(text)) return "云端表还没准备好：请在 Supabase 执行 docs/cloud-sync.sql";
  return String(text || "云端同步失败").slice(0, 240);
}

function isSetupError(text) {
  return /summary_habit_records|relation .* does not exist|schema cache|PGRST/i.test(String(text || ""));
}

function sanitizeSelectionReference(ref) {
  if (!ref || typeof ref !== "object") return null;
  const copy = {};
  for (const key of ["selectionId", "projectId", "projectCode", "providerId", "model", "keyAlias", "params", "fallbackIds"]) {
    if (ref[key] !== undefined) copy[key] = ref[key];
  }
  return Object.keys(copy).length ? copy : null;
}

function countSentences(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return 0;
  const marks = cleaned.match(/[。！？!?]+/g);
  return Math.max(1, marks ? marks.length : 1);
}

function compact(value, length = 80) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[char]));
}

function createId(prefix = "sum") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
