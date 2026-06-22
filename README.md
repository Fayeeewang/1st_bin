# Faye Wang Personal Homepage Prototype

一个轻量个人主页原型，包含：

- 头像、姓名和一句话介绍
- 个人信息展示区
- 兴趣入口和科幻电影收集墙
- 可折叠浮窗式数字分身聊天区
- 可配置的大模型聊天 API，未配置时自动使用本地兜底回复
- 移动端适配
- 底部循环走动的萨摩耶小宠物

## Static preview

直接在浏览器打开 `index.html`，或在仓库根目录启动一个静态服务器：

```bash
python3 -m http.server 8000
```

然后访问 <http://localhost:8000>。

静态预览时 `/api/chat` 不会运行，聊天浮窗会自动使用本地 persona 兜底回复。

## LLM setup

`api/chat.js` 是一个 Vercel-style serverless function，通过 OpenAI-compatible
Chat Completions API 调用大模型。部署时配置这些环境变量：

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
# Optional, for OpenAI-compatible providers:
OPENAI_BASE_URL=https://api.openai.com/v1
```

配置完成后，前端会优先请求 `/api/chat`；如果接口不可用或未配置 API key，
页面会继续使用本地兜底回复，保证原型始终可用。