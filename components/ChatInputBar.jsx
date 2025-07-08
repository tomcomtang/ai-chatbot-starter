import React, { useState, useRef } from "react";
import ModelSelector from "./ModelSelector";
import { FaArrowUp } from "react-icons/fa";

export default function ChatInputBar({
  onSend,
  isThinking,
  selectedModel,
  setSelectedModel,
  cardHeight = 120,
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSend(input);
    setInput("");
    // 发送后自动聚焦输入框
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 点击卡片聚焦输入框
  const handleCardClick = (e) => {
    if (e.target === e.currentTarget) {
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-transparent border-t-0 z-10 flex justify-center pb-6 pointer-events-none">
      <div
        className={`w-full max-w-2xl flex flex-col gap-3 bg-white rounded-xl shadow-lg px-6 py-5 pointer-events-auto cursor-text transition-all duration-150 border border-[#e5e7eb]`}
        style={focused ? {
          minHeight: cardHeight,
          marginBottom: '16px',
          border: '1.5px solid #d1d5db',
        } : { minHeight: cardHeight, marginBottom: '16px' }}
        onClick={handleCardClick}
      >
        {/* 输入框独占一行 */}
        <textarea
          ref={textareaRef}
          className="w-full resize-none rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-0 focus:border-none border-none shadow-none min-h-[48px] max-h-40 bg-transparent"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          rows={2}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {/* 下方一行：左模型选择，右发送按钮 */}
        <div className="flex items-center justify-between w-full gap-2 mt-2">
          <div className="flex-1">
            <ModelSelector value={selectedModel} onChange={setSelectedModel} borderless />
          </div>
          <button
            className="ml-2 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white text-xl disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md transition hover:bg-black focus:outline-none"
            onClick={handleSend}
            disabled={isThinking || !input.trim()}
            aria-label="Send"
          >
            <FaArrowUp />
          </button>
        </div>
      </div>
    </div>
  );
} 