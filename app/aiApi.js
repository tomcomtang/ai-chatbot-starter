// AI API request module

// Function to parse analysis process and answer
function parseReasoningAndContent(fullContent) {
  // Try to match English format first
  let reasoningMatch = fullContent.match(/\*\*Analysis Process:\*\*\s*\n([\s\S]*?)(?=\n\*\*Answer:\*\*)/);
  let contentMatch = fullContent.match(/\*\*Answer:\*\*\s*\n([\s\S]*)/);
  // If English format not found, try matching Chinese format for compatibility
  if (!reasoningMatch) {
    reasoningMatch = fullContent.match(/\*\*分析过程：\*\*\s*\n([\s\S]*?)(?=\n\*\*回答：\*\*)/);
    contentMatch = fullContent.match(/\*\*回答：\*\*\s*\n([\s\S]*)/);
  }
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "";
  const content = contentMatch ? contentMatch[1].trim() : fullContent;
  return { reasoning, content };
}

export async function fetchAIStreamResponse(model, text, messages, onChunk) {
  let aiContent = "";
  let aiReasoning = ""; // Specifically stores DeepSeek Reasoner's reasoning_content
  const controller = new AbortController();
  // Set timeout to 10 minutes (600000 milliseconds)
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
      // Try to parse error response
      let errorMessage = `HTTP error! status: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If JSON cannot be parsed, use default error message
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
            // Check if it's DeepSeek Reasoner (has reasoning_content)
            if (aiReasoning) {
              // DeepSeek Reasoner: use separated reasoning and content
              onChunk(aiContent, aiReasoning, true);
              return { aiContent, aiReasoning };
            } else {
              // Other models: use parsing function
              const { reasoning, content } = parseReasoningAndContent(aiContent);
              onChunk(content, reasoning, true);
              return { aiContent: content, aiReasoning: reasoning };
            }
            isComplete = true;
          }
          try {
            const json = JSON.parse(data);
            // Compatible with different AI service streaming fields
            let chunk = "";
            let reasoningChunk = "";
            
            // Claude format: content_block_delta
            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
              chunk = json.delta.text;
            }
            // DeepSeek Reasoner format: separated reasoning_content and content
            else if (json.choices?.[0]?.delta?.reasoning_content) {
              reasoningChunk = json.choices[0].delta.reasoning_content;
            }
            // DeepSeek Reasoner content part
            else if (json.choices?.[0]?.delta?.content && aiReasoning) {
              // If reasoning_content already exists, this content is the final answer
              chunk = json.choices[0].delta.content;
            }
            // OpenAI format: choices[0].delta.content
            else if (json.choices?.[0]?.delta?.content) {
              chunk = json.choices[0].delta.content;
            }
            // Gemini format: candidates[0].content.parts[0].text
            else if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
              chunk = json.candidates[0].content.parts[0].text;
            }
            
            if (chunk || reasoningChunk) {
              if (reasoningChunk) {
                // Process DeepSeek Reasoner's reasoning_content
                aiReasoning += reasoningChunk;
                // For DeepSeek Reasoner, directly use reasoning_content as analysis process
                onChunk(aiContent, aiReasoning, false);
              } else if (chunk) {
                // Process regular content
                aiContent += chunk;
                const { reasoning, content } = parseReasoningAndContent(aiContent);
                onChunk(content, reasoning, false);
              }
            }
            
            // Check Claude's end signal
            if (json.type === 'message_stop') {
              if (aiReasoning) {
                // DeepSeek Reasoner: use separated reasoning and content
                onChunk(aiContent, aiReasoning, true);
                return { aiContent, aiReasoning };
              } else {
                // Other models: use parsing function
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
    // Supplement: stream closed but no [DONE] received, add one more end here
    if (!isComplete && (aiContent || aiReasoning)) {
      if (aiReasoning) {
        // DeepSeek Reasoner: use separated reasoning and content
        onChunk(aiContent, aiReasoning, true);
        return { aiContent, aiReasoning };
      } else {
        // Other models: use parsing function
        const { reasoning, content } = parseReasoningAndContent(aiContent);
        onChunk(content, reasoning, true);
        return { aiContent: content, aiReasoning: reasoning };
      }
    }
  } catch (e) {
    console.error(e);
    clearTimeout(timeoutId);
    // Re-throw error for caller to handle
    throw e;
  }
  return { aiContent, aiReasoning: "" };
} 