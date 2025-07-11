export async function onRequest({ request, env }) {
  try {
    
    request.headers.delete('accept-encoding');
    
    const { model, messages } = await request.json();
    if (!model || !messages) {
      return new Response(JSON.stringify({ error: 'Missing model or messages' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (model === 'deepseek-chat' || model === 'deepseek-reasoner') {
      return proxyDeepSeek(messages, model, env);
    } else if (model === 'gpt-4o-mini') {
      return proxyOpenAI(messages, env);
    } else if (model === 'gemini-flash') {
      return proxyGemini(messages, env);
    } else if (model === 'nebius-studio') {
      return proxyNebius(messages, env);
    } else if (model === 'claude') {
      return proxyClaude(messages, env);
    } else if (model === 'gemini-flash-lite') {
      return proxyGeminiFlashLite(messages, env);
    } else if (model === 'gemini-2-5-flash-lite') {
      return proxyGemini25FlashLite(messages, env);
    } else {
      return new Response(JSON.stringify({ error: 'Unknown model' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function proxyDeepSeek(messages, model, env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY not set in environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const deepseekModel = model === 'deepseek-reasoner' ? 'deepseek-reasoner' : 'deepseek-chat';
  const requestBody = {
    model: deepseekModel,
    messages,
    stream: true,
  };
  if (deepseekModel === 'deepseek-chat') {
    requestBody.temperature = 0.7;
  }

  const res = await PROVIDERS.fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  return streamProxy(res);
}

async function proxyOpenAI(messages, env) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set in environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const res = await PROVIDERS.fetch('https://api.openai.com/v1/chat/completions', {
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

async function proxyGemini(messages, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set in environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const geminiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
  const res = await PROVIDERS.fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?alt=sse', {
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

async function proxyNebius(messages, env) {
  const apiKey = env.NEBIUS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'NEBIUS_API_KEY not set in environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const res = await PROVIDERS.fetch('https://api.studio.nebius.com/v1/chat/completions', {
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

async function proxyClaude(messages, env) {
  const apiKey = env.CLAUDE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CLAUDE_API_KEY not set in environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const claudeMessages = messages.map(m => ({ role: m.role, content: m.content }));
  const res = await PROVIDERS.fetch('https://api.anthropic.com/v1/messages', {
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
  return streamProxy(res);
}

async function proxyGeminiFlashLite(messages, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set in environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const geminiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
  const res = await PROVIDERS.fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?alt=sse', {
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
    return new Response(JSON.stringify({ error: errText }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }
  return streamProxy(res);
}

async function proxyGemini25FlashLite(messages, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set in environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const geminiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
  const res = await PROVIDERS.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2-5-flash-lite:generateContent?alt=sse', {
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
    return new Response(JSON.stringify({ error: errText }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }
  return streamProxy(res);
}

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
