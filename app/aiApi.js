// AI API 请求模块

// 解析分析过程和回答的函数
function parseReasoningAndContent(fullContent) {
  // 尝试匹配中文格式
  let reasoningMatch = fullContent.match(/\*\*分析过程：\*\*\s*\n([\s\S]*?)(?=\n\*\*回答：\*\*)/);
  let contentMatch = fullContent.match(/\*\*回答：\*\*\s*\n([\s\S]*)/);
  // 如果没有找到中文格式，尝试匹配英文格式
  if (!reasoningMatch) {
    reasoningMatch = fullContent.match(/\*\*Analysis Process:\*\*\s*\n([\s\S]*?)(?=\n\*\*Answer:\*\*)/);
    contentMatch = fullContent.match(/\*\*Answer:\*\*\s*\n([\s\S]*)/);
  }
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "";
  const content = contentMatch ? contentMatch[1].trim() : fullContent;
  return { reasoning, content };
}

export async function fetchAIStreamResponse(model, text, messages, onChunk) {
  let aiContent = "";
  let aiReasoning = ""; // 专门存储 DeepSeek Reasoner 的 reasoning_content
  const controller = new AbortController();
  // 超时时间设为10分钟（600000毫秒）
  const timeoutId = setTimeout(() => controller.abort(), 600000);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      // 尝试解析错误响应
      let errorMessage = `HTTP error! status: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // 如果无法解析JSON，使用默认错误信息
      }
      throw new Error(errorMessage);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isComplete = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            // 检查是否是 DeepSeek Reasoner（有 reasoning_content）
            if (aiReasoning) {
              // DeepSeek Reasoner：使用分离的 reasoning 和 content
              onChunk(aiContent, aiReasoning, true);
              return { aiContent, aiReasoning };
            } else {
              // 其他模型：使用解析函数
              const { reasoning, content } = parseReasoningAndContent(aiContent);
              onChunk(content, reasoning, true);
              return { aiContent: content, aiReasoning: reasoning };
            }
            isComplete = true;
          }
          try {
            const json = JSON.parse(data);
            // 兼容不同AI服务的流式字段
            let chunk = "";
            let reasoningChunk = "";
            
            // Claude 格式: content_block_delta
            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
              chunk = json.delta.text;
            }
            // DeepSeek Reasoner 格式: 分离 reasoning_content 和 content
            else if (json.choices?.[0]?.delta?.reasoning_content) {
              reasoningChunk = json.choices[0].delta.reasoning_content;
            }
            // DeepSeek Reasoner 的 content 部分
            else if (json.choices?.[0]?.delta?.content && aiReasoning) {
              // 如果已经有 reasoning_content，那么这个 content 就是最终答案
              chunk = json.choices[0].delta.content;
            }
            // OpenAI 格式: choices[0].delta.content
            else if (json.choices?.[0]?.delta?.content) {
              chunk = json.choices[0].delta.content;
            }
            // Gemini 格式: candidates[0].content.parts[0].text
            else if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
              chunk = json.candidates[0].content.parts[0].text;
            }
            
            if (chunk || reasoningChunk) {
              if (reasoningChunk) {
                // 处理 DeepSeek Reasoner 的 reasoning_content
                aiReasoning += reasoningChunk;
                // 对于 DeepSeek Reasoner，直接使用 reasoning_content 作为分析过程
                onChunk(aiContent, aiReasoning, false);
              } else if (chunk) {
                // 处理普通 content
                aiContent += chunk;
                const { reasoning, content } = parseReasoningAndContent(aiContent);
                onChunk(content, reasoning, false);
              }
            }
            
            // 检查 Claude 的结束信号
            if (json.type === 'message_stop') {
              if (aiReasoning) {
                // DeepSeek Reasoner：使用分离的 reasoning 和 content
                onChunk(aiContent, aiReasoning, true);
                return { aiContent, aiReasoning };
              } else {
                // 其他模型：使用解析函数
                const { reasoning, content } = parseReasoningAndContent(aiContent);
                onChunk(content, reasoning, true);
                return { aiContent: content, aiReasoning: reasoning };
              }
              isComplete = true;
            }
          } catch (e) {
            console.warn('Failed to parse chunk:', data, e);
          }
        }
      }
    }
    // 补充：流关闭但没收到 [DONE]，这里补一次结束
    if (!isComplete && (aiContent || aiReasoning)) {
      if (aiReasoning) {
        // DeepSeek Reasoner：使用分离的 reasoning 和 content
        onChunk(aiContent, aiReasoning, true);
        return { aiContent, aiReasoning };
      } else {
        // 其他模型：使用解析函数
        const { reasoning, content } = parseReasoningAndContent(aiContent);
        onChunk(content, reasoning, true);
        return { aiContent: content, aiReasoning: reasoning };
      }
    }
  } catch (e) {
    console.error(e);
    clearTimeout(timeoutId);
    // 重新抛出错误，让调用方处理
    throw e;
  }
  return { aiContent, aiReasoning: "" };
} 