export async function onRequest({ request, env }) {
  try {
    // 设置CORS头
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理OPTIONS请求（预检请求）
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }

    // 只允许POST请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers 
      });
    }

    const models = [];
    
    // 检查环境变量并添加对应的模型
    if (env.DEEPSEEK_API_KEY) {
      models.push(
        { value: "deepseek-chat", label: "DeepSeek-V3", disabled: false },
        { value: "deepseek-reasoner", label: "DeepSeek-R1", disabled: false }
      );
    }
    
    if (env.OPENAI_API_KEY) {
      models.push({ value: "gpt-4o-mini", label: "GPT-4o Mini (OpenAI)", disabled: false });
    }
    
    if (env.GEMINI_API_KEY) {
      models.push(
        { value: "gemini-flash", label: "Gemini 2.0 Flash (Google)", disabled: false },
        { value: "gemini-flash-lite", label: "Gemini 2.0 Flash-Lite (Google)", disabled: false }
      );
    }
    
    if (env.CLAUDE_API_KEY) {
      models.push({ value: "claude", label: "Claude 3 Sonnet (Anthropic)", disabled: false });
    }
    
    if (env.NEBIUS_API_KEY) {
      models.push({ value: "nebius-studio", label: "Nebius Studio", disabled: false });
    }
    
    // 如果没有配置任何API密钥，返回默认的DeepSeek模型
    if (models.length === 0) {
      models.push(
        { value: "deepseek-chat", label: "DeepSeek-V3", disabled: false },
        { value: "deepseek-reasoner", label: "DeepSeek-R1", disabled: false }
      );
    }
    
    return new Response(JSON.stringify({ models }), { 
      status: 200, 
      headers 
    });
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: e.message || 'Internal error',
      models: [
        { value: "deepseek-chat", label: "DeepSeek-V3", disabled: false },
        { value: "deepseek-reasoner", label: "DeepSeek-R1", disabled: false }
      ]
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
