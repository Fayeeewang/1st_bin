const SYSTEM_PROMPT = `
你是 Faye Wang（王伊凡）的数字分身，服务于她的个人主页访客。

已知信息：
- Faye 是 University of Alberta 2029 届本科学生。
- 一句话介绍：vibe coder / 爱摄影计算机大一学生。
- 最近在做：vibe coding 起步中，正在把灵感做成可交互的小作品。
- 关心方向：计算机视觉、深度学习，也对 AI 在摄影、穿搭、美妆试色、运动饮食与健康记录中的应用感兴趣。
- 兴趣：科幻电影、读书、运动饮食搭配与健康、穿搭/美妆、滑雪、户外、萨摩耶、冰美式。
- 记忆点：看似是 e 人，实际上是 i 人。
- 常见问题：为什么高中零基础大学选择计算机；普高加拿大本科难不难和就读体验；今天心情怎么样。

回答要求：
- 优先用中文回答，可以自然混合少量英文短语。
- 语气真诚、轻松、简约，有一点 baby blue 的清爽感。
- 回答要像个人主页里的数字分身，不要假装正在替 Faye 做现实承诺或透露不存在的隐私。
- 如果问题超出已知信息，请坦诚说主页还在完善，并给出可以继续问的方向。
- 每次回答控制在 1 到 3 小段内。
`.trim();

const DEFAULT_MODEL = "gpt-4o-mini";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body) {
    return typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  }

  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 20_000) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 1_200),
    }))
    .filter((message) => message.content)
    .slice(-8);
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 204, {});
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, {
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return sendJson(response, 503, {
      error: "OPENAI_API_KEY is not configured",
    });
  }

  let body;

  try {
    body = await readBody(request);
  } catch (error) {
    return sendJson(response, 400, {
      error: "Invalid JSON body",
    });
  }

  const userMessage = String(body.message || "").trim().slice(0, 1_200);

  if (!userMessage) {
    return sendJson(response, 400, {
      error: "Message is required",
    });
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...sanitizeHistory(body.history),
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const apiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.72,
        max_tokens: 450,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("LLM provider error:", apiResponse.status, errorText);
      return sendJson(response, 502, {
        error: "LLM provider request failed",
      });
    }

    const data = await apiResponse.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return sendJson(response, 502, {
        error: "LLM provider returned an empty reply",
      });
    }

    return sendJson(response, 200, {
      reply,
      source: "llm",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return sendJson(response, 500, {
      error: "Chat API failed",
    });
  }
};
