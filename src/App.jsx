import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Flame,
  Home,
  Lock,
  Scale,
  Settings,
  Upload,
  Feather,
  X
} from "lucide-react";
import { initPlanModelSelector } from "../model-selector/bootstrap.js";

const STORAGE_KEY = "how-to-summarize-react-state-v3";
const SUPABASE_URL = "https://vcixggayhuzrjpzutnkz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7867l84YC9AM3L4c5Wudlw_Wo64GlzC";
const CLOUD_TABLE = "summary_habit_records";
const PROJECT_ID = "how-to-summarize";
const MODEL_SELECTOR_PROJECT_CODE = "model_selector_summary-SUM01";
const SELECTOR_STATE_ENDPOINT = "https://pn4w9qze.vercel.app/api/selector-state";
const SELECTOR_MODELS_ENDPOINT = "https://pn4w9qze.vercel.app/api/models";
const MODEL_SELECTOR_ACCESS_TOKEN = "202306313";
const PASS_THRESHOLD = 75;

const SAMPLE_IMPORT = `总结不是缩短\t总结不是把长话说短，而是在一个具体问题下，把材料压缩成可复核、可调用、可行动的入口，并让下一步行动或规则发生变化。\t总结是在具体问题下，把材料压成可复核、可调用、能改变下一步行动或规则的入口，而不是单纯缩短文字。
不是中心思想\t阅读不是为了背中心思想，而是为了把信息整合成能解决问题的参考资料。读完一篇文字，真正的检验不是能不能说出一句漂亮概括，而是能不能回答更多问题、解释来龙去脉、查回依据、指导下一步判断。\t阅读总结不应停在中心思想，而要把材料变成能回答问题、查回依据并指导下一步判断的参考入口。
不是摘抄\t摘抄可以保存材料，但摘抄本身不是总结。摘抄只是把原文搬到你的笔记里，真正的总结要多做一步：用自己的问题、判断和行动框架重新组织材料。\t摘抄只保存原文，真正的总结要用自己的问题、判断和行动框架重新组织材料。
坏总结警报\t只有“我懂了”，没有文字表述；只有摘抄，没有自己的问题和判断；只有结论，没有依据入口；只有感慨，没有行动或规则，这些都说明总结没有真正完成。\t坏总结的共同问题是没有形成自己的文字、问题、依据入口或下一步规则，因此材料还没有真正被处理。`;

const navItems = [
  { id: "today", label: "今日训练", icon: Home },
  { id: "import", label: "导入材料", icon: FileText },
  { id: "archive", label: "训练存档", icon: BookOpen },
  { id: "rules", label: "评分规则", icon: Scale },
  { id: "settings", label: "模型设置", icon: Settings }
];

function App() {
  const [state, setState] = useState(() => normalizeState(loadState()));
  const [summaryDraft, setSummaryDraft] = useState(() => currentDraft(normalizeState(loadState())));
  const [activeModal, setActiveModal] = useState("");
  const [importText, setImportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectorReady, setSelectorReady] = useState(false);
  const [runtimeLabel, setRuntimeLabel] = useState("");
  const selectorRef = useRef(null);
  const cloudTimer = useRef(null);
  const didPersist = useRef(false);

  const current = state.passages[state.currentIndex] || null;
  const latest = latestAttempt(state, current?.id);
  const attempts = attemptsForPassage(state, current?.id);
  const passedCount = state.passages.filter((item) => latestAttempt(state, item.id)?.passed).length;
  const failedCount = state.passages.filter((item) => {
    const attempt = latestAttempt(state, item.id);
    return attempt && !attempt.passed && !attempt.forced && !attempt.technical;
  }).length;
  const forcedCount = state.attempts.filter((item) => item.forced).length;
  const remainingCount = Math.max(0, state.passages.length - passedCount - forcedCount);
  const avgScore = averageScore(state.attempts);
  const progress = state.passages.length ? Math.round(((state.currentIndex + 1) / state.passages.length) * 100) : 0;
  const canNext = Boolean(latest?.passed || latest?.forced);
  const canSkip = Boolean(latest && !latest.passed && !latest.forced && !latest.technical);

  const dimensions = useMemo(() => scoreDimensions(latest), [latest]);

  useEffect(() => {
    saveState(state);
    if (!didPersist.current) {
      didPersist.current = true;
      return;
    }
    scheduleCloudSync(state, cloudTimer);
  }, [state]);

  useEffect(() => {
    setSummaryDraft(currentDraft(state));
  }, [state.currentIndex, state.passages]);

  useEffect(() => {
    if (activeModal === "archive" || activeModal === "library") refreshArchive(setState);
  }, [activeModal]);

  function updateState(next) {
    setState(typeof next === "function" ? next : () => next);
  }

  async function ensureSelector(openAfterReady = false) {
    if (selectorRef.current) {
      if (openAfterReady) selectorRef.current.open?.();
      return selectorRef.current;
    }
    const selector = await initPlanModelSelector({
      projectId: PROJECT_ID,
      projectCode: MODEL_SELECTOR_PROJECT_CODE,
      selectionReference: state.settings.modelSelectionReference,
      stateEndpoint: SELECTOR_STATE_ENDPOINT,
      modelsEndpoint: SELECTOR_MODELS_ENDPOINT,
      modelSelectorAccessToken: MODEL_SELECTOR_ACCESS_TOKEN,
      position: "bottom-left",
      buttonText: "模型",
      title: "模型配置",
      subtitle: "选择评分模型和 API Key",
      onChange(activeConfig) {
        if (!activeConfig?.selectionReference) return;
        setState((prev) => ({
          ...prev,
          settings: { ...prev.settings, modelSelectionReference: activeConfig.selectionReference },
          updatedAt: nowIso()
        }));
      },
      onRuntimeChange(activeConfig) {
        setRuntimeLabel(modelLabel(activeConfig));
      }
    });
    selectorRef.current = selector;
    setSelectorReady(true);
    const config = selector.getActiveConfig?.();
    setRuntimeLabel(modelLabel(config));
    if (openAfterReady) selector.open?.();
    return selector;
  }

  function openSettings() {
    ensureSelector(true).catch(() => setSelectorReady(false));
  }

  function handleNav(item) {
    if (item.id === "settings") {
      openSettings();
      return;
    }
    if (item.id === "import" || item.id === "archive" || item.id === "rules") {
      setActiveModal(item.id);
    }
  }

  function handleDraftChange(value) {
    setSummaryDraft(value);
    setState((prev) => saveDraft(prev, value));
  }

  async function submitSummary() {
    if (!current || !summaryDraft.trim() || isSubmitting) return;
    setIsSubmitting(true);
    let providerConfig = null;
    const previousAttempts = attempts.slice(-5);
    try {
      const selector = await ensureSelector(false);
      providerConfig = selector?.getActiveConfig?.() || null;
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: current,
          summary: summaryDraft.trim(),
          threshold: PASS_THRESHOLD,
          previousAttempts,
          providerConfig,
          model: providerConfig?.model || providerConfig?.modelId || ""
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "AI 评分失败");
      const attempt = normalizeAttempt(result, current.id, summaryDraft.trim(), providerConfig);
      setState((prev) => recordAttempt(prev, attempt));
    } catch (error) {
      const attempt = {
        id: createId("a"),
        passageId: current.id,
        summary: summaryDraft.trim(),
        verdict: "revise",
        score: 0,
        passed: false,
        technical: true,
        headline: "模型没有完成评分",
        feedback: error.message || "请检查模型选择器配置后重新提交。",
        missing: ["需要可用模型评分后才能进入下一段"],
        revisedSummary: "",
        referenceAnswer: current.reference || "",
        reason: "",
        nextAction: "重新打开设置，确认模型和 Key 可用。",
        modelLabel: modelLabel(providerConfig) || "模型未连接",
        createdAt: nowIso()
      };
      setState((prev) => recordAttempt(prev, attempt));
    } finally {
      setIsSubmitting(false);
    }
  }

  function forceSkip() {
    if (!current || !canSkip) return;
    const attempt = {
      ...latest,
      id: createId("skip"),
      forced: true,
      passed: false,
      headline: "已强制跳过",
      feedback: "这一段被强制跳过，系统会保留未通过记录。",
      nextAction: "进入下一段前，注意这不是通过。",
      createdAt: nowIso()
    };
    setState((prev) => {
      const next = recordAttempt(prev, attempt);
      return { ...next, currentIndex: Math.min(next.passages.length - 1, next.currentIndex + 1) };
    });
  }

  function goNext() {
    if (!canNext) return;
    setState((prev) => ({ ...prev, currentIndex: Math.min(prev.passages.length - 1, prev.currentIndex + 1), updatedAt: nowIso() }));
  }

  function goPrev() {
    setState((prev) => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1), updatedAt: nowIso() }));
  }

  function importDeck(text) {
    const passages = parseImportedText(text);
    if (!passages.length) return;
    setState((prev) => ({
      ...createState(),
      recordId: createId("record"),
      title: passages[0]?.title || "一句话总结训练",
      passages,
      settings: prev.settings,
      cloud: prev.cloud,
      updatedAt: nowIso()
    }));
    setSummaryDraft("");
    setImportText("");
    setActiveModal("");
  }

  function newDeck() {
    setState((prev) => ({
      ...createState(),
      settings: prev.settings,
      cloud: prev.cloud,
      updatedAt: nowIso()
    }));
    setSummaryDraft("");
    setActiveModal("");
  }

  function openArchive(record) {
    if (!record?.state) return;
    setState(normalizeState({ ...record.state, cloud: state.cloud }));
    setActiveModal("");
  }

  function deleteArchive(recordId) {
    deleteCloudRecord(recordId).finally(() => refreshArchive(setState));
    if (recordId === state.recordId) newDeck();
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="grid min-h-screen grid-cols-[256px_772px_412px] max-[1100px]:grid-cols-[220px_1fr] max-[900px]:grid-cols-1">
        <aside className="flex min-h-screen flex-col border-r border-line bg-[#fbf7ef]/82 px-5 py-10 max-[900px]:min-h-0 max-[900px]:border-b max-[900px]:border-r-0">
          <div className="mb-14 flex items-center gap-3">
            <Feather className="h-7 w-7 text-clay" strokeWidth={1.8} />
            <h1 className="font-serif text-[22px] font-semibold tracking-[-0.01em]">一句话总结训练器</h1>
          </div>
          <nav className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === "today";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item)}
                  className={[
                    "flex h-[56px] w-full items-center gap-4 rounded-[11px] px-4 text-left text-[16px] transition",
                    active ? "bg-[#f7ecdf] text-ink shadow-soft ring-1 ring-[#eadbc9]" : "text-[#4c4036] hover:bg-[#f7efe5]"
                  ].join(" ")}
                >
                  <Icon className={active ? "h-5 w-5 text-clay" : "h-5 w-5 text-[#9b8e82]"} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-[12px] border border-line bg-panel/72 p-5 shadow-soft">
            <div className="flex items-center gap-4 border-b border-line pb-5">
              <CalendarDays className="h-5 w-5 text-[#8f7968]" strokeWidth={1.7} />
              <span className="text-[15px] text-[#5c4d41]">本组通过：</span>
              <strong className="ml-auto text-[24px]">{passedCount + forcedCount}</strong>
              <span className="text-[16px]">段</span>
            </div>
            <div className="flex items-center gap-4 pt-5">
              <Flame className="h-5 w-5 text-[#8f7968]" strokeWidth={1.7} />
              <span className="text-[15px] text-[#5c4d41]">剩余材料：</span>
              <strong className="ml-auto text-[24px]">{remainingCount}</strong>
              <span className="text-[16px]">段</span>
            </div>
          </div>
        </aside>

        <main className="px-10 py-10 max-[1100px]:px-7 max-[900px]:px-4">
          <div className="mx-auto max-w-[692px]">
            <header className="mb-6">
              <h2 className="font-serif text-[30px] font-semibold leading-tight tracking-[-0.02em]">训练材料：{state.title || "主动总结入门"}</h2>
              <div className="mt-6 flex items-center gap-6">
                <span className="font-serif text-[19px]">第 {state.currentIndex + 1} / {state.passages.length} 段</span>
              </div>
              <div className="mt-3 flex items-center gap-6">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eee8e0]">
                  <div className="h-full rounded-full bg-clay" style={{ width: `${progress}%` }} />
                </div>
                <span className="w-10 text-[16px] text-[#75685d]">{progress}%</span>
              </div>
            </header>

            <section className="rounded-[16px] border border-line bg-panel p-6 shadow-card">
              <div className="mb-7 flex items-start justify-between gap-4">
                <h3 className="font-serif text-[20px] font-semibold">当前段落</h3>
                <span className="rounded-[8px] border border-line bg-white px-4 py-2 text-[14px] text-[#6d5e50] shadow-soft">{current?.title || "等待导入"}</span>
              </div>
              <article className="min-h-[212px] px-5 pb-4 pt-1 font-serif text-[22px] leading-[2.05] tracking-[0.02em] text-[#231d18]">
                {current?.body || "导入材料后，从第一段开始训练。"}
              </article>
            </section>

            <section className="mt-7 rounded-[16px] border border-line bg-panel p-5 shadow-card">
              <h3 className="mb-4 font-serif text-[21px] font-semibold">用一句话总结这段内容</h3>
              <div className="relative">
                <textarea
                  value={summaryDraft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  placeholder="用自己的话写一句：这段材料回答了什么问题，给了什么判断，或能被用来做什么？"
                  maxLength={200}
                  className="min-h-[148px] w-full resize-none rounded-[9px] border border-[#d7c4b3] bg-white px-4 py-4 font-serif text-[17px] leading-8 text-ink outline-none transition placeholder:text-[#8c7e72] focus:border-clay focus:ring-2 focus:ring-[#e9cbbd]/45"
                />
                <span className="absolute bottom-3 right-4 text-[13px] text-[#796f66]">{summaryDraft.length} / 200</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-8 rounded-[10px] bg-[#fbf8f2] px-3 py-3 text-[13px] text-[#766a5f]">
                <Hint>尽量只写一句话</Hint>
                <Divider />
                <Hint>不要复制原文</Hint>
                <Divider />
                <Hint>说明核心观点，而不是罗列细节</Hint>
              </div>
              <div className="mt-7 flex items-center gap-5">
                <button
                  type="button"
                  disabled={isSubmitting || !summaryDraft.trim()}
                  onClick={submitSummary}
                  className="h-[52px] rounded-[8px] bg-clay px-8 text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(194,70,39,0.18)] transition hover:bg-clayDark disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isSubmitting ? `评分中${runtimeLabel ? ` · ${runtimeLabel}` : ""}` : latest && !latest.technical ? "重新评分" : "AI 评分"}
                </button>
                <button type="button" onClick={() => setState((prev) => saveDraft(prev, summaryDraft))} className="h-[52px] rounded-[8px] border border-[#d8c6b8] bg-white px-7 text-[16px] text-[#4b4138] transition hover:bg-[#fbf5ee]">
                  保存当前句
                </button>
                <button type="button" disabled={!canSkip} onClick={forceSkip} className="h-[52px] rounded-[8px] border border-[#d8c6b8] bg-white px-7 text-[16px] text-[#4b4138] transition hover:bg-[#fbf5ee] disabled:cursor-not-allowed disabled:opacity-45">
                  失败后跳过
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={goNext}
                  className="ml-auto inline-flex h-[52px] items-center gap-2 rounded-[8px] bg-[#eee9e3] px-7 text-[16px] text-[#b3aaa0] transition enabled:bg-[#f0dfd3] enabled:text-clayDark enabled:hover:bg-[#ead2c2] disabled:cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" strokeWidth={1.8} />
                  下一段
                </button>
              </div>
              <div className="mt-5 flex justify-between text-[13px] text-[#8a7d71]">
                <button type="button" onClick={goPrev} disabled={state.currentIndex <= 0} className="disabled:opacity-40">上一段</button>
                <span>{isSubmitting ? "等待 AI 评分时不能重复提交。" : submitHint(latest)}</span>
              </div>
            </section>
          </div>
        </main>

        <aside className="space-y-2 border-l border-line bg-[#fffaf4]/68 px-5 py-5 max-[1100px]:col-span-2 max-[1100px]:grid max-[1100px]:grid-cols-2 max-[1100px]:gap-4 max-[900px]:col-span-1 max-[900px]:grid-cols-1 max-[900px]:border-l-0 max-[900px]:border-t">
          <Card className="flex min-h-[54px] items-center justify-between px-5 py-3">
            <h3 className="font-serif text-[17px] font-semibold">本段状态</h3>
            <span className={`rounded-[8px] border px-3 py-1 text-[17px] font-semibold ${latest?.passed ? "border-[#cbd8bd] bg-[#f2f6ed] text-[#487241]" : latest?.technical ? "border-[#e9d7b9] bg-[#fff7e8] text-[#9a6a22]" : latest ? "border-[#f0d3c4] bg-[#fff0e8] text-clay" : "border-line bg-white text-[#7a6b5d]"}`}>
              {latest?.passed ? "已通过" : latest?.technical ? "模型异常" : latest ? "未通过" : "待评分"}
            </span>
          </Card>

          <Card>
            <h3 className="mb-4 font-serif text-[17px] font-semibold">AI 评分</h3>
            <div className="flex items-end gap-2">
              <strong className="font-serif text-[38px] leading-none text-clay">{latest?.score ?? "--"}</strong>
              <span className="pb-1 font-serif text-[22px]">/ 100</span>
            </div>
            <p className="mt-3 text-[15px]">结果：<strong className={latest?.passed ? "text-[#487241]" : latest?.technical ? "text-[#9a6a22]" : "text-clay"}>{latest?.passed ? "通过" : latest?.technical ? "模型异常" : latest ? "未通过" : "待评分"}</strong></p>
            <p className="mt-1 text-[14px] text-[#5f554d]">通过线：{PASS_THRESHOLD} 分</p>
          </Card>

          <Card>
            <h3 className="mb-5 font-serif text-[17px] font-semibold">维度评分</h3>
            <div className="space-y-4">
              {dimensions.map((item) => (
                <div key={item.label} className="grid grid-cols-[112px_58px_1fr] items-center gap-3 text-[14px]">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value} / {item.max}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e8e0d8]">
                    <div className="h-full rounded-full bg-clay" style={{ width: `${(item.value / item.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-serif text-[17px] font-semibold">AI 反馈</h3>
            <p className="font-serif text-[16px] leading-8 text-[#3c332b]">{latest?.feedback || "提交后只指出最影响通过的一两个问题，避免把反馈变成长篇阅读笔记。"}</p>
            {latest?.missing?.length ? (
              <ul className="mt-3 space-y-1 text-[14px] leading-6 text-[#6f6256]">
                {latest.missing.map((item) => <li key={item}>- {item}</li>)}
              </ul>
            ) : null}
          </Card>

          <Card>
            <h3 className="mb-3 font-serif text-[17px] font-semibold">修正版一句话</h3>
            <p className="font-serif text-[16px] leading-8 text-[#3c332b]">{latest?.revisedSummary || "评分后这里会给出一条更接近通过标准的改写，用来帮助你校准，不替代你自己的下一次提交。"}</p>
          </Card>

          <details className="rounded-[10px] border border-line bg-[#fffaf3] px-4 py-3 shadow-soft">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] text-[#8a735f]">
              <span className="font-serif">参考答案</span>
              <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
            </summary>
            <p className="mt-3 font-serif text-[15px] leading-7 text-[#4b4038]">{latest?.referenceAnswer || current?.reference || "暂无参考答案。"}</p>
          </details>

          <Card>
            <h3 className="mb-3 font-serif text-[17px] font-semibold">下一次怎么改</h3>
            <p className="font-serif text-[16px] leading-8 text-[#3c332b]">{latest?.nextAction || "先写一句自己的总结，再让 AI 判断它是否能成为可复核、可调用的入口。"}</p>
          </Card>

          <details className="rounded-[10px] border border-line bg-panel px-4 py-3 shadow-soft">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] text-[#4b4038]">
              <span className="font-serif">本段尝试记录（{attempts.length}）</span>
              <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
            </summary>
            <div className="mt-3 space-y-2">
              {attempts.length ? attempts.slice().reverse().map((item) => (
                <article key={item.id} className="rounded-[8px] border border-line bg-white/72 p-3">
                  <div className="flex items-center justify-between text-[13px] text-muted">
                    <strong className={item.passed ? "text-[#487241]" : item.technical ? "text-[#9a6a22]" : "text-clay"}>{item.passed ? "通过" : item.technical ? "模型异常" : item.forced ? "跳过" : "未通过"} · {item.technical ? "--" : item.score}</strong>
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-[14px] leading-6">{item.summary}</p>
                </article>
              )) : <p className="text-[14px] text-muted">这一段还没有提交记录。</p>}
            </div>
          </details>

          <Card className="max-[1100px]:col-span-2 max-[900px]:col-span-1">
            <h3 className="mb-4 font-serif text-[17px] font-semibold">本组进度</h3>
            <div className="grid grid-cols-4 divide-x divide-line text-center">
              <Metric label="已通过" value={passedCount} />
              <Metric label="未通过" value={failedCount} />
              <Metric label="已跳过" value={forcedCount} />
              <Metric label="剩余" value={remainingCount} highlight />
            </div>
          </Card>
        </aside>
      </div>

      {activeModal ? (
        <Modal title={modalTitle(activeModal)} onClose={() => setActiveModal("")}>
          {activeModal === "import" ? (
            <ImportPanel
              value={importText}
              onChange={setImportText}
              onImport={() => importDeck(importText)}
              onSample={() => setImportText(SAMPLE_IMPORT)}
              onFile={(text) => importDeck(text)}
            />
          ) : null}
          {activeModal === "archive" ? (
            <ArchivePanel records={state.cloud.records} status={state.cloud.status} error={state.cloud.lastError} onRefresh={() => refreshArchive(setState)} onOpen={openArchive} onDelete={deleteArchive} />
          ) : null}
          {activeModal === "rules" ? <RulesPanel /> : null}
        </Modal>
      ) : null}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={`rounded-[10px] border border-line bg-panel p-4 shadow-soft ${className}`}>{children}</section>;
}

function Hint({ children }) {
  return <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#9a8b7e]" strokeWidth={1.8} />{children}</span>;
}

function Divider() {
  return <span className="h-5 w-px bg-line" />;
}

function Metric({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-[13px] text-[#7d7168]">{label}</p>
      <strong className={`mt-2 block font-serif text-[23px] ${highlight ? "text-clay" : "text-ink"}`}>{value}</strong>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3c2b1d]/18 p-6 backdrop-blur-[2px]">
      <div className="max-h-[82vh] w-full max-w-[760px] overflow-auto rounded-[16px] border border-line bg-panel p-6 shadow-[0_24px_80px_rgba(62,43,28,0.18)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-[22px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-sand">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ImportPanel({ value, onChange, onImport, onSample, onFile }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-7 text-muted">支持 Anki 式 TSV：标题、正文、参考答案。也支持 CSV、Markdown 段落和用空行或 --- 分隔的纯文本。</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[280px] w-full resize-y rounded-[10px] border border-line bg-white p-4 font-serif text-[15px] leading-7 outline-none focus:border-clay"
        placeholder={"标题<Tab>正文<Tab>参考答案\n\n或粘贴多段正文。"}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onImport} className="rounded-[8px] bg-clay px-5 py-3 text-white">导入材料</button>
        <button type="button" onClick={onSample} className="rounded-[8px] border border-line bg-white px-5 py-3">填入示例</button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-line bg-white px-5 py-3">
          <Upload className="h-4 w-4" />
          上传文件
          <input
            type="file"
            accept=".txt,.tsv,.csv,.md"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onFile(await file.text());
            }}
          />
        </label>
      </div>
    </div>
  );
}

function ArchivePanel({ records, status, error, onRefresh, onOpen, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-muted">云端存档用于跨设备恢复训练进度。</p>
        <button type="button" onClick={onRefresh} className="rounded-[8px] border border-line bg-white px-4 py-2">刷新</button>
      </div>
      {status === "needs-setup" || status === "error" ? (
        <div className="rounded-[10px] border border-[#e6c4ae] bg-[#fff7ee] p-4">
          <strong>{status === "needs-setup" ? "云端表还没准备好" : "云端同步异常"}</strong>
          <p className="mt-2 text-[14px] text-muted">{error || "请在 Supabase 执行 docs/cloud-sync.sql"}</p>
          <code className="mt-3 inline-block rounded bg-white px-2 py-1 text-clay">docs/cloud-sync.sql</code>
        </div>
      ) : null}
      <div className="space-y-3">
        {(records || []).map((record) => (
          <article key={record.id} className="rounded-[10px] border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <strong>{record.title || "未命名训练"}</strong>
                <p className="mt-1 text-[13px] text-muted">{record.summary || "暂无摘要"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onOpen(record)} className="rounded border border-line px-3 py-1 text-[13px]">打开</button>
                <button type="button" onClick={() => onDelete(record.id)} className="rounded border border-[#efcabc] px-3 py-1 text-[13px] text-clay">删除</button>
              </div>
            </div>
          </article>
        ))}
        {!records?.length ? <p className="text-[14px] text-muted">暂无云端存档。</p> : null}
      </div>
    </div>
  );
}

function RulesPanel() {
  return (
    <div className="space-y-4 font-serif text-[16px] leading-8">
      <p>通过标准不是“写得漂亮”，而是这句话能不能让未来的自己知道：这段材料回答了什么问题，给了什么判断，或者能被用来做什么。</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>不能只写“很重要”“我懂了”或中心思想套话。</li>
        <li>不能主要复制原文，要用自己的话压缩。</li>
        <li>如果材料有条件、依据或用途，至少保留其中一个。</li>
        <li>未通过时必须重写；失败后才允许强制跳过。</li>
      </ul>
    </div>
  );
}

function modalTitle(id) {
  if (id === "import") return "导入材料";
  if (id === "archive") return "训练存档";
  if (id === "rules") return "评分规则";
  return "设置";
}

function createState() {
  const passages = parseImportedText(SAMPLE_IMPORT);
  return {
    recordId: createId("record"),
    title: "主动总结入门",
    currentIndex: 0,
    passages,
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
    currentIndex: clamp(Number(source.currentIndex ?? fallback.currentIndex), 0, Math.max(0, passages.length - 1)),
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
  return {
    id: item?.id || createId("p"),
    title: String(item?.title || `片段 ${index + 1}`).trim(),
    body: String(item?.body || item?.text || "").trim(),
    source: String(item?.source || "").trim(),
    reference: String(item?.reference || "").trim(),
    draft: String(item?.draft || "")
  };
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, cloud: { ...state.cloud, syncing: false } }));
}

function currentDraft(state) {
  return state.passages[state.currentIndex]?.draft || "";
}

function saveDraft(state, value) {
  const passages = state.passages.map((item, index) => index === state.currentIndex ? { ...item, draft: value } : item);
  return { ...state, passages, updatedAt: nowIso() };
}

function recordAttempt(state, attempt) {
  return {
    ...state,
    attempts: [...state.attempts, attempt],
    updatedAt: nowIso()
  };
}

function latestAttempt(state, passageId) {
  if (!passageId) return null;
  return state.attempts.filter((item) => item.passageId === passageId).at(-1) || null;
}

function attemptsForPassage(state, passageId) {
  if (!passageId) return [];
  return state.attempts.filter((item) => item.passageId === passageId);
}

function parseImportedText(text) {
  const value = String(text || "").trim();
  if (!value) return [];
  const lines = value.split(/\r?\n/).filter((line) => line.trim());
  if (lines.some((line) => line.includes("\t"))) {
    return lines.map((line, index) => {
      const [title, body, reference] = line.split("\t");
      return normalizePassage({ title: title || `片段 ${index + 1}`, body: body || title, reference }, index);
    }).filter((item) => item.body);
  }
  if (lines.some((line) => /","|,/.test(line))) {
    return lines.map(parseCsvLine).map(([title, body, reference], index) => normalizePassage({ title: title || `片段 ${index + 1}`, body: body || title, reference }, index)).filter((item) => item.body);
  }
  return value.split(/\n\s*\n|^-{3,}$/m).map((part, index) => normalizePassage({ title: `片段 ${index + 1}`, body: part }, index)).filter((item) => item.body);
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function scoreDimensions(attempt) {
  if (attempt?.dimensions?.length) return attempt.dimensions;
  const score = Number(attempt?.score || 0);
  const accuracy = Math.max(0, Math.min(40, Math.round(score * 0.39)));
  const concise = Math.max(0, Math.min(20, Math.round(score * 0.25)));
  const core = Math.max(0, Math.min(30, Math.round(score * 0.23)));
  const clarity = Math.max(0, Math.min(10, Math.round(score * 0.13)));
  return [
    { label: "问题入口:", value: accuracy, max: 40 },
    { label: "自主转述:", value: concise, max: 20 },
    { label: "依据条件:", value: core, max: 30 },
    { label: "行动可用:", value: clarity, max: 10 }
  ];
}

function averageScore(attempts) {
  const scored = attempts.filter((item) => !item.forced && Number.isFinite(Number(item.score)));
  if (!scored.length) return 0;
  return Math.round(scored.reduce((sum, item) => sum + Number(item.score || 0), 0) / scored.length);
}

function normalizeAttempt(result, passageId, summary, providerConfig) {
  return {
    id: createId("a"),
    passageId,
    summary,
    verdict: result.verdict,
    score: Number(result.score || 0),
    passed: Boolean(result.passed || (result.verdict === "pass" && Number(result.score || 0) >= PASS_THRESHOLD)),
    headline: String(result.headline || ""),
    feedback: String(result.feedback || ""),
    missing: Array.isArray(result.missing) ? result.missing.slice(0, 5) : [],
    dimensions: normalizeDimensions(result.dimensions),
    revisedSummary: String(result.revisedSummary || ""),
    referenceAnswer: String(result.referenceAnswer || ""),
    reason: String(result.reason || ""),
    nextAction: String(result.nextAction || ""),
    modelLabel: modelLabel(providerConfig),
    createdAt: nowIso()
  };
}

function normalizeDimensions(dimensions) {
  if (!Array.isArray(dimensions)) return [];
  return dimensions.map((item) => ({
    label: String(item.label || "").trim().replace(/：$/, "") + ":",
    value: Math.max(0, Math.min(Number(item.max || 100), Number(item.value || 0))),
    max: Math.max(1, Number(item.max || 100))
  })).filter((item) => item.label !== ":").slice(0, 4);
}

function modelLabel(config) {
  if (!config) return "";
  const provider = config.providerName || config.providerLabel || config.provider || config.providerId || "";
  const model = config.modelLabel || config.modelName || config.model || config.modelId || "";
  return [provider, model].filter(Boolean).join(" · ");
}

function submitHint(attempt) {
  if (!attempt) return "未提交前不能进入下一段。";
  if (attempt.technical) return "模型没有完成有效评分，不能进入下一段，也不会解锁跳过。";
  if (attempt.passed) return "已通过，可以进入下一段。";
  if (attempt.forced) return "已强制跳过。";
  return "未通过，需要重写，或选择强制跳过。";
}

async function refreshArchive(setState) {
  try {
    const records = await supabaseFetch(`${CLOUD_TABLE}?select=record_id,title,status,summary,state,created_at,updated_at&namespace=eq.public&project_id=eq.${PROJECT_ID}&order=updated_at.desc&limit=30`);
    setState((prev) => ({
      ...prev,
      cloud: {
        ...prev.cloud,
        records: records.map((item) => ({
          id: item.record_id,
          title: item.title,
          summary: item.summary,
          status: item.status,
          state: item.state,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        status: "connected",
        lastError: ""
      }
    }));
  } catch (error) {
    const needsSetup = /PGRST205|Could not find the table|404/.test(error.message || "");
    setState((prev) => ({
      ...prev,
      cloud: {
        ...prev.cloud,
        status: needsSetup ? "needs-setup" : "error",
        lastError: needsSetup ? "云端表还没准备好：请在 Supabase 执行 docs/cloud-sync.sql" : error.message
      }
    }));
  }
}

function scheduleCloudSync(state, timerRef) {
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    upsertCloudRecord(state).catch(() => {});
  }, 900);
}

async function upsertCloudRecord(state) {
  const latest = latestAttempt(state, state.passages[state.currentIndex]?.id);
  await supabaseFetch(CLOUD_TABLE, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      namespace: "public",
      project_id: PROJECT_ID,
      record_id: state.recordId,
      title: state.title || "一句话总结训练",
      status: "active",
      summary: latest?.summary || state.passages[state.currentIndex]?.body?.slice(0, 80) || "",
      state: { ...state, cloud: undefined },
      updated_at: nowIso()
    })
  });
}

async function deleteCloudRecord(recordId) {
  await supabaseFetch(`${CLOUD_TABLE}?namespace=eq.public&project_id=eq.${PROJECT_ID}&record_id=eq.${recordId}`, {
    method: "DELETE"
  });
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...options.headers
    },
    body: options.body
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `${response.status}`);
  return text ? JSON.parse(text) : null;
}

function sanitizeSelectionReference(value) {
  return value && typeof value === "object" ? value : null;
}

function createId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default App;
