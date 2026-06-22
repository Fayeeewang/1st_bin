const chatWidget = document.querySelector("#chatWidget");
const chatToggle = document.querySelector("#chatToggle");
const openChatButton = document.querySelector("#openChatButton");
const collapseChatButton = document.querySelector("#collapseChatButton");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector("#chatMessages");
const chatModeText = document.querySelector("#chatModeText");
const sendChatButton = document.querySelector("#sendChatButton");
const promptButtons = document.querySelectorAll("[data-question]");

const chatHistory = [];

const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector("#chatMessages");
const promptButtons = document.querySelectorAll("[data-question]");

const replies = [
  {
    keywords: ["为什么", "零基础", "计算机", "高中", "cs", "computer"],
    answer:
      "高中零基础反而让我对计算机更有新鲜感。选择它是因为我喜欢把想法快速做成可见的东西，也想理解 AI、视觉和交互背后的逻辑。现在还是起步阶段，但我很享受从 0 到 1 的过程。",
  },
  {
    keywords: ["加拿大", "本科", "普高", "ualberta", "难不难", "就读", "体验"],
    answer:
      "普高到加拿大本科会有挑战，尤其是语言环境、课程节奏和主动学习方式都需要适应。但它也很锻炼独立性：你会更快学会规划、提问、找资源，并且认识来自不同背景的人。",
  },
  {
    keywords: ["心情", "今天", "how are you", "hello", "hi", "你好", "嗨"],
    answer:
      "今天心情是 baby blue 色的：有一点安静，但很清爽。像喝了一口冰美式，然后继续把脑子里的灵感慢慢做出来。",
  },
  {
    keywords: ["最近", "做什么", "vibe", "coding", "起步"],
    answer:
      "Faye 最近在 vibe coding 起步中，先练习把想法落地成可交互页面。这个主页就是第一版：结构清楚、能预览，之后可以继续接入真实 AI、作品集和更完整的内容管理。",
  },
  {
    keywords: ["擅长", "方向", "关心", "视觉", "深度学习", "ai"],
    answer:
      "她目前最关心计算机视觉和深度学习，也对 AI 如何融入摄影、穿搭、美妆试色、健康记录这类日常场景很感兴趣。",
  },
  {
    keywords: ["兴趣", "电影", "书", "滑雪", "户外", "萨摩耶", "冰美式", "摄影", "美妆", "穿搭"],
    answer:
      "Faye 的兴趣很像一面收集墙：科幻电影、读书、摄影、滑雪户外、穿搭美妆、运动饮食、萨摩耶和冰美式。以后这些都可以变成独立作品集入口。",
  },
];

function getLocalReply(question) {
function getReply(question) {
  const normalizedQuestion = question.trim().toLowerCase();
  const matchedReply = replies.find((reply) =>
    reply.keywords.some((keyword) => normalizedQuestion.includes(keyword.toLowerCase())),
  );

  return (
    matchedReply?.answer ||
    "这个问题我还在学习怎么回答。你可以先问我：为什么选择计算机、加拿大本科体验、最近在做什么，或者今天心情怎么样。"
  );
}

function addMessage(content, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = content;
  message.append(paragraph);
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function setChatOpen(isOpen) {
  chatWidget.classList.toggle("is-collapsed", !isOpen);
  chatToggle.setAttribute("aria-expanded", String(isOpen));
  chatToggle.setAttribute(
    "aria-label",
    isOpen ? "Collapse Faye's digital twin chat" : "Open Faye's digital twin chat",
  );

  if (isOpen) {
    window.setTimeout(() => chatInput.focus(), 120);
  }
}

function setChatLoading(isLoading) {
  sendChatButton.disabled = isLoading;
  chatInput.disabled = isLoading;
  sendChatButton.textContent = isLoading ? "思考中" : "发送";
}

async function getLlmReply(question) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: question,
      history: chatHistory.slice(-8),
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.reply) {
    throw new Error("Chat API returned no reply");
  }

  return data.reply;
}

async function askDigitalTwin(question) {
}

function askDigitalTwin(question) {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    return;
  }

  addMessage(trimmedQuestion, "user");
  chatInput.value = "";
  setChatLoading(true);

  const thinkingMessage = addMessage("正在思考中...", "bot");
  let answer;

  try {
    answer = await getLlmReply(trimmedQuestion);
    chatModeText.textContent = "大模型回复 · online";
  } catch (error) {
    answer = getLocalReply(trimmedQuestion);
    chatModeText.textContent = "本地兜底回复 · API 未连接";
  } finally {
    thinkingMessage.remove();
    setChatLoading(false);
  }

  addMessage(answer, "bot");
  chatHistory.push(
    {
      role: "user",
      content: trimmedQuestion,
    },
    {
      role: "assistant",
      content: answer,
    },
  );

  if (chatHistory.length > 12) {
    chatHistory.splice(0, chatHistory.length - 12);
  }
}

chatToggle.addEventListener("click", () => {
  setChatOpen(true);
});

openChatButton.addEventListener("click", () => {
  setChatOpen(true);
});

collapseChatButton.addEventListener("click", () => {
  setChatOpen(false);
});


  window.setTimeout(() => {
    addMessage(getReply(trimmedQuestion), "bot");
  }, 280);
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askDigitalTwin(chatInput.value);
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setChatOpen(true);
    askDigitalTwin(button.dataset.question);
  });
});
