import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { model, messages } = await req.json();
    if (!model || !messages) {
      return NextResponse.json({ error: 'Missing model or messages' }, { status: 400 });
    }

    // 选择不同AI服务
    if (model === 'deepseek-chat' || model === 'deepseek-reasoner') {
      return proxyDeepSeek(messages, req, model);
    } else if (model === 'gpt-4o-mini') {
      return proxyOpenAI(messages, req);
    } else if (model === 'gemini-flash') {
      return proxyGemini(messages, req);
    } else if (model === 'nebius-studio') {
      return proxyNebius(messages, req);
    } else if (model === 'claude') {
      return proxyClaude(messages, req);
    } else if (model === 'gemini-flash-lite') {
      return proxyGeminiFlashLite(messages, req);
    } else if (model === 'gemini-2-5-flash-lite') {
      return proxyGemini25FlashLite(messages, req);
    } else {
      return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

// --- 代理各AI服务 ---
async function proxyDeepSeek(messages, req, model) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY not set in environment' }, { status: 500 });
  }
  
  // 使用传入的模型类型
  const deepseekModel = model === 'deepseek-reasoner' ? 'deepseek-reasoner' : 'deepseek-chat';

  console.log('DeepSeek model:', deepseekModel);
  
  // 构建请求体，reasoner 模型不支持 temperature 参数
  const requestBody = {
    model: deepseekModel,
    messages,
    stream: true,
  };
  
  // 只有 chat 模型才添加 temperature 参数
  if (deepseekModel === 'deepseek-chat') {
    requestBody.temperature = 0.7;
  }
  
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  return streamProxy(res);
}

async function proxyOpenAI(messages, req) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set in environment' }, { status: 500 });
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
    }),
  });
  return streamProxy(res);
}

async function proxyGemini(messages, req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set in environment' }, { status: 500 });
  }
  // Gemini 支持完整对话历史，过滤掉 system 消息
  const geminiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
  const res = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?alt=sse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: { temperature: 1, topP: 1, maxOutputTokens: 1024 },
      safetySettings: [],
    }),
  });
  return streamProxy(res);
}

async function proxyNebius(messages, req) {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NEBIUS_API_KEY not set in environment' }, { status: 500 });
  }
  const res = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      store: false,
      messages,
      max_tokens: 1024,
      temperature: 1,
      top_p: 1,
      n: 1,
      stream: true,
      presence_penalty: 0,
      frequency_penalty: 0,
    }),
  });
  return streamProxy(res);
}

// --- Claude 3 Sonnet ---
async function proxyClaude(messages, req) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'CLAUDE_API_KEY not set in environment' }, { status: 500 });
  }
  // Claude 3 API 需要 messages 格式为 [{role: 'user', content: ...}]
  // 这里假设 messages 最后一条为用户输入，其余为上下文
  const claudeMessages = messages.map(m => ({ role: m.role, content: m.content }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-7-sonnet-20250219',
      messages: claudeMessages,
      max_tokens: 2048,
      stream: true,
    }),
  });
  console.log('Claude response:', res);
  return streamProxy(res);
}

// --- Gemini 2.0 Flash-Lite ---
async function proxyGeminiFlashLite(messages, req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set in environment' }, { status: 500 });
  }
  // Gemini 支持完整对话历史，过滤掉 system 消息
  const geminiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
  const res = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?alt=sse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 500 },
      safetySettings: [],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini Flash-Lite API error:', errText);
    return NextResponse.json({ error: errText }, { status: res.status });
  }
    return streamProxy(res);
}

// --- Gemini 2.5 Flash-Lite ---
async function proxyGemini25FlashLite(messages, req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set in environment' }, { status: 500 });
  }
  // Gemini 支持完整对话历史，过滤掉 system 消息
  const geminiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2-5-flash-lite:generateContent?alt=sse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 500 },
      safetySettings: [],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini 2.5 Flash-Lite API error:', errText);
    return NextResponse.json({ error: errText }, { status: res.status });
  }
  return streamProxy(res);
}

// --- 通用流式转发 ---
function streamProxy(res) {
  // 直接转发流式响应
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
} 