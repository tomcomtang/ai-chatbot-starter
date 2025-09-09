# AI Chatbot Starter

A modern AI chatbot template built on Tencent Cloud EdgeOne, supporting multiple AI models with real-time streaming responses. No traditional backend required.

## Deploy

[![Deploy to EdgeOne](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?template=https://github.com/tomcomtang/ai-chatbot-starter&output-directory=./public&build-command=npm%20run%20build&install-command=npm%20install)

Click the button above to deploy directly to Tencent Cloud EdgeOne Pages.

## 🌐 Live Demo

[https://ai-chatbot-starter.edgeone.app/](https://ai-chatbot-starter.edgeone.app/)

## ⚙️ Required Environment Variables

Set the following environment variables (API keys) in EdgeOne Pages or your local `.env` file:

```
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
NEBIUS_API_KEY=your_nebius_api_key
CLAUDE_API_KEY=your_claude_api_key
```

## ��️ Local Development

### 1. Frontend (Next.js)

Start the frontend locally:

```bash
npm install
npm run dev
```

### 2. Edge Functions (API)

You need to install EdgeOne CLI globally and follow the official steps to run local edge functions:

#### Quick Start Guide

1. **Install EdgeOne CLI globally:**

   ```bash
   npm install -g edgeone
   ```

   For more commands, see the [scaffolding document](https://pages.edgeone.ai/document/edgeone-cli).

2. **Function Initialization:**

   ```bash
   edgeone pages init
   ```

   This will automatically initialize the functions directory and host the functions code.

3. **Associate Project:**

   ```bash
   edgeone pages link
   ```

   Enter your current project name to automatically associate project KV configuration, environment variables, etc.

4. **Local Development:**

   ```bash
   edgeone pages dev
   ```

   This will start the local proxy service and enable function debugging (usually at http://localhost:8088).

5. **Function Release:**
   Push code to the remote repository to automatically build and release the function.

---

Feel free to open an issue or PR if you have questions or suggestions!

## License

This project is licensed under the MIT License.
