const SUMMARY_PROFILE = {
  product: "这是一个一句话总结习惯训练工具。它服务初期习惯：读完一段材料后，必须主动写一句自己的总结，再由 AI 判断是否足够可用。",
  coreDefinition: "总结不是把长话说短，而是在一个具体问题下，把材料压缩成可复核、可调用、可行动的入口。",
  trainingScope: [
    "第一阶段只训练一件事：看完一段话后主动输出一句总结。",
    "不要把训练变成完整摘要、读后感、中心思想背诵或抄金句。",
    "一句话总结应说明材料对象、核心判断或可用入口，尽量保留条件、依据或下一步用途中的至少一项。",
    "AI 反馈要帮助用户形成主动总结习惯，不能用长篇说教替用户完成全部思考。"
  ],
  passCriteria: [
    "必须是用户自己的概括，不能主要是原文摘抄。",
    "不能只写情绪、感慨、中心思想或漂亮口号。",
    "必须能让未来的自己知道这段材料回答了什么问题、提供了什么判断，或能被用来做什么。",
    "如果材料里有明显条件、限制或依据入口，优秀答案应至少保留其中一个。",
    "一句话可以较长，但应保持单一主句；不要写成多段笔记。"
  ],
  scoringDimensions: [
    "问题入口 40 分：是否说明材料回答了什么问题、提供了什么判断，或能被用于什么判断。",
    "自主转述 20 分：是否主要用用户自己的语言组织，而不是复制原文或套中心思想。",
    "依据条件 30 分：是否保留材料里的关键依据、条件、限制、对象或可回查入口。",
    "行动可用 10 分：是否能影响下一步判断、行动、规则、清单、模板或验证计划。"
  ],
  rejectSignals: [
    "很有道理",
    "我懂了",
    "讲得很好",
    "下次注意",
    "中心思想是",
    "这篇文章告诉我们",
    "我太菜了",
    "继续努力"
  ],
  feedbackStyle: [
    "先给明确分数和是否通过。",
    "反馈短而具体，只指出最影响通过的一两个问题。",
    "修正版只基于原文和用户输入，不虚构材料。",
    "参考答案默认给一条，不追求唯一标准答案。"
  ]
};

function getAiStatus() {
  return { ok: true, mode: "model-selector-runtime", message: "Summary trainer uses runtime config from the shared model selector." };
}

function buildPrompt(payload = {}) {
  const passage = payload.passage && typeof payload.passage === "object" ? payload.passage : {};
  const summary = asText(payload.summary);
  const threshold = clampNumber(payload.threshold, 0, 100, 75);
  const previousAttempts = Array.isArray(payload.previousAttempts) ? payload.previousAttempts.slice(-5) : [];
  const context = {
    passage: {
      title: asText(passage.title),
      body: asText(passage.body).slice(0, 9000),
      source: asText(passage.source),
      userProvidedReference: asText(passage.reference)
    },
    userSummary: summary,
    threshold,
    previousAttempts: previousAttempts.map((item) => ({
      summary: asText(item.summary),
      score: Number(item.score || 0),
      passed: Boolean(item.passed),
      feedback: asText(item.feedback)
    }))
  };

  return [
    "你是一个阅读总结习惯教练。你不聊天，不扩写成完整读书笔记，只评估用户的一句话总结。",
    "目标是帮助用户从“只看材料”转向“读完必须主动压缩成一个可调用入口”。",
    "所有判断基于给定材料和用户这一句话，不要虚构原文没有的信息。",
    "",
    "SUMMARY_PROFILE:",
    JSON.stringify(SUMMARY_PROFILE, null, 2),
    "",
    "评分规则:",
    "- 0-39: 基本没有总结，或只有情绪/口号/明显误读。",
    "- 40-59: 抓到主题，但像中心思想、标题复述或原文摘抄，缺少问题入口。",
    "- 60-74: 能概括主张，但依据、条件、用途或限制太弱，暂不通过。",
    "- 75-89: 能形成可调用的一句话入口，通过。",
    "- 90-100: 同时保留问题、核心判断、关键条件/依据或下一步用途，非常稳。",
    "",
    "通过门槛:",
    `- score >= ${threshold} 且 verdict 为 pass 才通过。`,
    "- 如果用户明显只复制原文，即使看似准确，也应降分。",
    "- 如果用户写了多句，但第一句已经满足训练目标，可以通过，并建议下次压成一句。",
    "",
    "输出必须是纯 JSON，不要 markdown，不要解释 JSON 外文本。格式:",
    JSON.stringify({
      ok: true,
      verdict: "pass | revise",
      score: 0,
      headline: "一句话判断",
      feedback: "最关键的反馈，2-4 句",
      missing: ["还缺什么"],
      dimensions: [
        { label: "问题入口", value: 0, max: 40 },
        { label: "自主转述", value: 0, max: 20 },
        { label: "依据条件", value: 0, max: 30 },
        { label: "行动可用", value: 0, max: 10 }
      ],
      revisedSummary: "基于用户输入修正成的一句话",
      referenceAnswer: "一条可参考的一句话答案，默认隐藏给用户看",
      reason: "为什么给这个分数",
      nextAction: "如果未通过，下一次怎么改；如果通过，下一段怎么保持",
      shouldAdvance: false
    }, null, 2),
    "",
    "当前请求数据:",
    JSON.stringify(context, null, 2)
  ].join("\n");
}

function normalizeResponse(raw, payload = {}) {
  const source = typeof raw === "string" ? parseJson(raw) : raw;
  const threshold = clampNumber(payload.threshold, 0, 100, 75);
  const score = clampNumber(source?.score, 0, 100, 0);
  let verdict = normalizeVerdict(source?.verdict);
  if (score < threshold) verdict = "revise";
  const result = {
    ok: true,
    verdict,
    score,
    passed: verdict === "pass" && score >= threshold,
    headline: asText(source?.headline) || (score >= threshold ? "这句话可以进入下一段" : "这句话还不够可用"),
    feedback: asText(source?.feedback),
    missing: Array.isArray(source?.missing) ? source.missing.map(asText).filter(Boolean).slice(0, 5) : [],
    dimensions: normalizeDimensions(source?.dimensions),
    revisedSummary: asText(source?.revisedSummary),
    referenceAnswer: asText(source?.referenceAnswer),
    reason: asText(source?.reason),
    nextAction: asText(source?.nextAction),
    shouldAdvance: verdict === "pass" && score >= threshold && source?.shouldAdvance !== false
  };

  if (!result.feedback || !result.revisedSummary || !result.referenceAnswer) {
    result.verdict = "revise";
    result.passed = false;
    result.shouldAdvance = false;
    result.headline = "反馈不完整";
    result.feedback = result.feedback || "AI 没有给出足够的反馈、修正版或参考答案。请重新提交。";
  }
  return result;
}

function normalizeDimensions(dimensions) {
  if (!Array.isArray(dimensions)) return [];
  const allowed = [
    { label: "问题入口", max: 40 },
    { label: "自主转述", max: 20 },
    { label: "依据条件", max: 30 },
    { label: "行动可用", max: 10 }
  ];
  return allowed.map((item, index) => {
    const source = dimensions.find((dimension) => asText(dimension?.label).includes(item.label)) || dimensions[index] || {};
    return {
      label: item.label,
      value: clampNumber(source.value, 0, item.max, 0),
      max: item.max
    };
  });
}

function runtimeConfig(payload = {}) {
  const runtime = payload.providerConfig && typeof payload.providerConfig === "object" ? payload.providerConfig : {};
  const apiKey = runtime.apiKey || runtime.apiToken || runtime.key || "";
  const model = payload.model || runtime.model || "";
  const provider = runtime.provider || runtime.providerId || "";
  const baseUrl = runtime.baseUrl || "";
  return {
    apiKey,
    model,
    url: baseUrl ? normalizeChatUrl(baseUrl) : defaultProviderChatUrl(provider)
  };
}

function normalizeChatUrl(baseUrl) {
  const trimmed = String(baseUrl || "").replace(/\/$/, "");
  if (/\/chat\/completions$/.test(trimmed)) return trimmed;
  if (/\/v1$/.test(trimmed)) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function defaultProviderChatUrl(provider) {
  const value = String(provider || "").toLowerCase();
  if (value.includes("openrouter")) return "https://openrouter.ai/api/v1/chat/completions";
  if (value.includes("deepseek")) return "https://api.deepseek.com/v1/chat/completions";
  if (value.includes("qwen") || value.includes("dashscope")) return "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
  if (value.includes("groq")) return "https://api.groq.com/openai/v1/chat/completions";
  return "https://api.openai.com/v1/chat/completions";
}

async function processSummaryRequest(payload = {}) {
  const config = runtimeConfig(payload);
  if (!config.apiKey || !config.model || !config.url) {
    const error = new Error("模型选择器没有提供可用的运行时配置");
    error.status = 400;
    throw error;
  }
  const prompt = buildPrompt(payload);
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "Return strict JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1200
    })
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`模型请求失败：${response.status} ${text.slice(0, 240)}`);
    error.status = 502;
    throw error;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const error = new Error("模型服务返回不是 JSON");
    error.status = 502;
    throw error;
  }
  const content = data.choices?.[0]?.message?.content || "";
  return normalizeResponse(content, payload);
}

function parseJson(content) {
  const text = String(content || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("AI 返回内容不是可解析 JSON");
  }
}

function normalizeVerdict(value) {
  return String(value || "").trim() === "pass" ? "pass" : "revise";
}

function asText(value) {
  return String(value || "").trim();
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

module.exports = {
  SUMMARY_PROFILE,
  buildPrompt,
  normalizeResponse,
  getAiStatus,
  processSummaryRequest
};
