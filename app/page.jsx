"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import Navbar from "../components/Navbar";
import ChatHistory from "../components/ChatHistory";
import ChatInputBar from "../components/ChatInputBar";
import { fetchAIStreamResponse } from "./aiApi";

// 系统提示词
const SYSTEM_PROMPT = "You are a helpful AI assistant. When appropriate, you may provide your analysis process before giving the final answer.";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-reasoner");
  const chatBottomRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const chatAreaRef = useRef(null);
  // 新增：首屏动画状态
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeFade, setWelcomeFade] = useState(false); // 控制淡出

  // 滚动到底部的函数
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 监听滚动，判断是否在底部
  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (!chatArea) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatArea;
      // 距离底部小于30px算在底部
      setShowScrollDown(scrollTop + clientHeight < scrollHeight - 30);
    };
    chatArea.addEventListener('scroll', handleScroll);
    // 初始判断
    handleScroll();
    return () => chatArea.removeEventListener('scroll', handleScroll);
  }, [messages]);

  // 流式输出回调函数
  const handleStreamChunk = useCallback((content, reasoning, isComplete) => {
    // 使用 flushSync 确保立即更新
    flushSync(() => {
      setMessages((prevMsgs) => {
        // 查找最后一条消息，优先查找loading消息，如果没有则查找最后一条assistant消息
        let idx = prevMsgs.findIndex((msg) => msg.loading);
        if (idx === -1) {
          // 如果没有loading消息，查找最后一条assistant消息
          idx = prevMsgs.length - 1;
          while (idx >= 0 && prevMsgs[idx].role !== "assistant") {
            idx--;
          }
        }
        
        if (idx === -1) {
          console.warn('No assistant message found, creating new one');
          return [...prevMsgs, { 
            role: "assistant", 
            content: content, 
            reasoning: reasoning || "",
            streaming: !isComplete 
          }];
        }
        
        const newMsgs = [...prevMsgs];
        if (isComplete) {
          // 流式输出完成，设置最终内容，移除所有特殊标志
          newMsgs[idx] = {
            role: "assistant",
            content: content,
            reasoning: reasoning || "",
          };
          setIsThinking(false);
        } else {
          // 流式输出中，更新内容并保持streaming标志
          // 对于 DeepSeek Reasoner，根据内容更新情况决定光标位置
          const isDeepSeekReasoner = selectedModel === 'deepseek-reasoner';
          const hasReasoning = reasoning && reasoning.length > 0;
          const hasContent = content && content.length > 0;
          
          newMsgs[idx] = {
            role: "assistant",
            content: content,
            reasoning: reasoning || "",
            streaming: true,
            // 为 DeepSeek Reasoner 添加更精确的光标控制
            ...(isDeepSeekReasoner && {
              streamingReasoning: hasReasoning && !hasContent, // 只在推理阶段显示推理光标
              streamingContent: hasContent // 有内容时显示内容光标
            })
          };
        }
        return newMsgs;
      });
    });
  }, []);

  // 修改 handleSend，先触发动画再切换视图
  const handleSend = async (text) => {
    if (!text.trim() || isThinking) return;
    if (messages.length === 0 && showWelcome) {
      // 首次发送，先淡出首屏
      setWelcomeFade(true); // 触发 opacity-0
      setTimeout(() => {
        setShowWelcome(false); // 真正切换到聊天区
        actuallySend(text);
      }, 300); // 动画时长 300ms
    } else {
      actuallySend(text);
    }
  };

  // 抽离实际发送逻辑
  const actuallySend = async (text) => {
    setMessages((prevMsgs) => [
      ...prevMsgs,
      { role: "user", content: text },
      { role: "assistant", content: "", thinking: "", loading: true }
    ]);
    setIsThinking(true);
    let messagesForApi;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const chatMessages = messages
      .concat({ role: "user", content: text })
      .filter((msg) => !msg.loading)
      .map((msg) => ({ role: msg.role, content: msg.content }));
    messagesForApi = chatMessages;
    try {
      await fetchAIStreamResponse(selectedModel, text, messagesForApi, handleStreamChunk);
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages((prevMsgs) => {
        const idx = prevMsgs.findIndex((msg) => msg.loading);
        if (idx === -1) return prevMsgs.map(msg => {
          if (msg.loading) {
            const { loading, ...rest } = msg;
            return rest;
          }
          return msg;
        });
        const newMsgs = [...prevMsgs];
        newMsgs[idx] = {
          role: "assistant",
          content: `AI request failed: ${error?.message || error?.toString() || "Unknown error"}`,
          reasoning: ""
        };
        return newMsgs.map(msg => {
          if (msg.loading) {
            const { loading, ...rest } = msg;
            return rest;
          }
          return msg;
        });
      });
      setIsThinking(false);
    }
  };

  // Chat area and input area max width
  const containerClass = "w-full max-w-2xl mx-auto";
  // 聊天输入卡片高度（用于底部留白）
  const chatInputHeight = 120;

  // 判断是否有流式输出中的消息
  const hasStreaming = messages.some(msg => msg.streaming);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className={`flex-1 flex flex-col overflow-hidden relative`}>
        {/* 首屏动画包裹 */}
        {showWelcome && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-300 ${welcomeFade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <div className="w-full max-w-2xl flex-1 flex flex-col justify-center items-center">
              <div className="flex flex-col items-center justify-center mb-24 select-none">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight drop-shadow-sm text-center">Multi-model AI Chatbot</h1>
                <p className="text-lg text-gray-500 mb-2 text-center max-w-2xl">
                  Unlock new ways of thinking, creating, and working—AI empowers your ideas and accelerates your journey.
                </p>
              </div>
              <ChatInputBar
                onSend={handleSend}
                isThinking={isThinking}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                cardHeight={chatInputHeight}
              />
            </div>
          </div>
        )}
        {/* 聊天区动画包裹 */}
        <div
          className={`flex-1 flex flex-col items-center justify-start transition-opacity duration-300 ${!showWelcome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {(!showWelcome || messages.length > 0) && (
            <>
              <div
                ref={chatAreaRef}
                className="w-full flex-1 overflow-y-auto relative"
                style={{
                  maxHeight: `calc(100vh - ${chatInputHeight + 56}px)`,
                  paddingBottom: `${chatInputHeight + 48}px`,
                  scrollbarGutter: 'stable',
                }}
              >
                <div className={containerClass + " px-2"}>
                  <ChatHistory messages={messages} />
                  <div ref={chatBottomRef} style={{ scrollMarginBottom: `${chatInputHeight + 48}px` }} />
                </div>
              </div>
              {/* 只要有流式输出中的消息，彻底隐藏按钮 */}
              {!hasStreaming && showScrollDown && (
                <div className="fixed left-0 w-full flex justify-center z-30 pointer-events-none" style={{ bottom: `${chatInputHeight + 120}px` }}>
                  <div className="w-full max-w-2xl flex justify-center pointer-events-auto">
                    <button
                      className="scroll-to-bottom-btn rounded-full p-2"
                      onClick={() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      aria-label="Scroll to bottom"
                    >
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12l5 5 5-5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <ChatInputBar
                onSend={handleSend}
                isThinking={isThinking}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                cardHeight={chatInputHeight}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
} 