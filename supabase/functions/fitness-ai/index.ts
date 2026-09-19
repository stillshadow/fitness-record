const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

const foodSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    estimated_weight_g: { type: "number", minimum: 0 },
    carbs_g: { type: "number", minimum: 0 },
    protein_g: { type: "number", minimum: 0 },
    fat_g: { type: "number", minimum: 0 },
    calories_kcal: { type: "number", minimum: 0 },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    assumptions: { type: "array", items: { type: "string" }, maxItems: 8 },
    components: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          estimated_weight_g: { type: "number", minimum: 0 },
          carbs_g: { type: "number", minimum: 0 },
          protein_g: { type: "number", minimum: 0 },
          fat_g: { type: "number", minimum: 0 }
        },
        required: ["name", "estimated_weight_g", "carbs_g", "protein_g", "fat_g"]
      }
    }
  },
  required: ["name", "estimated_weight_g", "carbs_g", "protein_g", "fat_g", "calories_kcal", "confidence", "summary", "assumptions", "components"]
};

const insightSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    observations: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          level: { type: "string", enum: ["info", "positive", "attention"] }
        },
        required: ["title", "detail", "level"]
      }
    },
    suggestions: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" }
        },
        required: ["title", "detail"]
      }
    },
    data_quality: { type: "string" }
  },
  required: ["title", "summary", "observations", "suggestions", "data_quality"]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function outputText(response) {
  for (const item of response?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item?.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function instructionsFor(mode) {
  if (mode === "food_estimate") {
    return [
      "你是健身饮食记录中的食物营养估算助手。",
      "根据用户提供的食物照片、已知总重量和文字备注，估算这一整顿食物的碳水、蛋白质、脂肪和热量。",
      "如果用户明确说没吃鸡皮、没拌汤汁、剩下某部分等，必须据此调整可食部分。",
      "如果给了总重量，优先将它视为用户实际称得的整份食物重量，但要结合备注判断不可食骨头、包装等是否可能包含在称重里。",
      "不要虚构精确到克的确定性。信息不足时降低 confidence，并在 assumptions 说明主要不确定来源。",
      "calories_kcal 应与三大营养素大致满足 C*4 + P*4 + F*9。",
      "输出简洁中文。"
    ].join("\n");
  }
  if (mode === "exercise") {
    return [
      "你是力量训练记录分析助手。",
      "基于用户传入的某个动作最近训练记录，分析重量、次数、RIR、估算1RM和训练间隔的变化。",
      "优先描述数据能支持的趋势，不把单次波动说成停滞或退步。",
      "如果数据不足，明确说数据不足。",
      "建议应保守、可执行，不要自行修改用户计划，不要声称医学诊断或恢复状态。",
      "输出简洁中文。"
    ].join("\n");
  }
  return [
    "你是个人健身记录分析助手。",
    "用户会提供由程序提前计算好的体重、饮食宏量营养和力量训练数据。",
    "算术结果以输入数据为准，你负责解释趋势，不要重新臆算不存在的数据。",
    "区分单日波动与多日趋势。数据不足时明确指出。",
    "建议应保守、具体，不要因为一天超标就建议大幅调整饮食，也不要直接修改用户目标。",
    "不要做医学诊断，不要推断疾病、激素、精神状态或受伤原因。",
    "输出简洁中文，重点放在最值得关注的2到4件事。"
  ].join("\n");
}

function userText(mode, payload) {
  if (mode === "food_estimate") {
    return "请估算这顿食物。以下是用户提供的信息：\n" + JSON.stringify(payload || {});
  }
  if (mode === "today") {
    return "请生成今天的健身简报。下面是程序整理好的 JSON 数据：\n" + JSON.stringify(payload || {});
  }
  if (mode === "weekly") {
    return "请分析最近7天，并与之前7天比较。下面是程序整理好的 JSON 数据：\n" + JSON.stringify(payload || {});
  }
  return "请分析这个动作最近的训练表现。下面是程序整理好的 JSON 数据：\n" + JSON.stringify(payload || {});
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) return json({ ok: false, error: "服务器尚未配置 DEEPSEEK_API_KEY" }, 503);

    const body = await req.json();
    const mode = String(body?.mode || "");
    if (mode === "healthcheck") {
      return json({ ok: true, mode, data: { provider: "DeepSeek", model: "deepseek-flash", configured: true } });
    }
    if (!["food_estimate", "today", "weekly", "exercise"].includes(mode)) {
      return json({ ok: false, error: "不支持的 AI 分析模式" }, 400);
    }

    const payload = body?.payload ?? {};
    const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : null;
    if (imageDataUrl && imageDataUrl.length > 6_000_000) {
      return json({ ok: false, error: "图片过大，请压缩后重试" }, 413);
    }

    const content = [{ type: "input_text", text: userText(mode, payload) }];
    if (mode === "food_estimate" && imageDataUrl) {
      if (!/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl)) {
        return json({ ok: false, error: "图片格式不支持" }, 400);
      }
      content.push({ type: "input_image", image_url: imageDataUrl, detail: "low" });
    }

    const schema = mode === "food_estimate" ? foodSchema : insightSchema;
    const deepseekResponse = await fetch("https://api.deepseek.com/responses", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-flash",
        instructions: instructionsFor(mode),
        input: [{ role: "user", content }],
        reasoning: { effort: "none" },
        max_output_tokens: mode === "food_estimate" ? 1200 : 1600,
        text: {
          format: {
            type: "json_schema",
            name: mode === "food_estimate" ? "food_estimate" : "fitness_insight",
            schema
          }
        }
      })
    });

    const raw = await deepseekResponse.json().catch(() => null);
    if (!deepseekResponse.ok) {
      const message = raw?.error?.message || raw?.message || ("DeepSeek HTTP " + deepseekResponse.status);
      return json({ ok: false, error: message }, 502);
    }

    const text = outputText(raw);
    if (!text) return json({ ok: false, error: "DeepSeek 没有返回可解析结果" }, 502);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return json({ ok: false, error: "DeepSeek 返回了无效 JSON" }, 502);
    }

    return json({
      ok: true,
      mode,
      data,
      usage: raw?.usage ? {
        input_tokens: raw.usage.input_tokens || 0,
        output_tokens: raw.usage.output_tokens || 0,
        total_tokens: raw.usage.total_tokens || 0
      } : null
    });
  } catch (err) {
    return json({ ok: false, error: err?.message || "AI 服务异常" }, 500);
  }
});