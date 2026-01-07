# AI 聊天机器人启动模板

一个基于腾讯云 EdgeOne 构建的现代 AI 聊天机器人模板，支持多个 AI 模型，具有实时流式响应功能。无需传统后端。

## 部署

[![部署到 EdgeOne](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?template=https://github.com/tomcomtang/ai-chatbot-starter&output-directory=./public&build-command=npm%20run%20build&install-command=npm%20install)

点击上方按钮直接部署到腾讯云 EdgeOne Pages。

## 🌐 在线演示

[https://ai-chatbot-starter.edgeone.app/](https://ai-chatbot-starter.edgeone.app/)

## ⚙️ 必需的环境变量

在 EdgeOne Pages 或本地 `.env` 文件中设置以下环境变量（API 密钥）：

```
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
NEBIUS_API_KEY=your_nebius_api_key
CLAUDE_API_KEY=your_claude_api_key
```

## 🛠️ 本地开发

### 1. 前端（Next.js）

启动前端本地开发：

```bash
npm install
npm run dev
```

### 2. 边缘函数（API）

您需要全局安装 EdgeOne CLI 并按照官方步骤运行本地边缘函数：

#### 快速入门指南

1. **全局安装 EdgeOne CLI：**

   ```bash
   npm install -g edgeone
   ```

   更多命令请查看[脚手架文档](https://pages.edgeone.ai/document/edgeone-cli)。

2. **函数初始化：**

   ```bash
   edgeone pages init
   ```

   这将自动初始化函数目录并托管函数代码。

3. **关联项目：**

   ```bash
   edgeone pages link
   ```

   输入您当前的项目名称以自动关联项目 KV 配置、环境变量等。

4. **本地开发：**

   ```bash
   edgeone pages dev
   ```

   这将启动本地代理服务并启用函数调试（通常在 http://localhost:8088）。

5. **函数发布：**
   将代码推送到远程仓库以自动构建和发布函数。

---

如果您有问题或建议，请随时提出 issue 或 PR！

## 许可证

本项目采用 MIT 许可证。
