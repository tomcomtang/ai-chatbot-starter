import React from "react";
import ReactMarkdown from "react-markdown";
import { FaUserCircle, FaRobot } from "react-icons/fa";

export default function MessageItem({ message }) {
  const isUser = message.role === "user";

  if (!isUser) {
    // AI 消息：AI回复内容在下，分析过程在上，默认收起
    if (message.loading) {
      // AI loading 动画，结构与常规AI消息保持一致（两行）
      return (
        <div className="flex items-center justify-start mb-2 min-h-[48px]">
          <div className="flex-shrink-0 mr-2 flex items-center">
            <FaRobot className="text-2xl" style={{ color: '#555' }} />
          </div>
          <div className="flex items-center w-full">
            <span className="animate-pulse text-base text-gray-900">AI is thinking</span>
            <span className="ml-1 inline-block w-4 h-4 align-middle">
              <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-bounce mr-0.5" style={{ animationDelay: '0s' }}></span>
              <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-bounce mr-0.5" style={{ animationDelay: '0.15s' }}></span>
              <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start justify-start mb-2">
        <div className="flex-shrink-0 mr-2 mt-1">
          <FaRobot className="text-2xl" style={{ color: '#555' }} />
        </div>
        <div className="flex flex-col w-full">
          {/* 分析过程（如果有的话） */}
          {message.reasoning && (
            <div className="border-l-4 border-gray-400 pl-3 mb-3">
              <div className="text-sm font-medium text-gray-500 mb-2">
                {message.reasoning.includes('分析') || message.reasoning.includes('思考') ? '分析过程：' : 'Analysis Process:'}
              </div>
              <div className="prose prose-sm max-w-none text-gray-500">
                <ReactMarkdown>{message.reasoning}</ReactMarkdown>
                {(message.streamingReasoning || (message.streaming && message.reasoning && !message.content)) && (
                  <span className="inline-block w-2 h-4 bg-gray-500 ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>
                )}
              </div>
            </div>
          )}
          
          {/* AI 回复内容始终在底部 */}
          <div className="prose prose-blue max-w-none text-base text-gray-900 mt-0 [&>*:first-child]:mt-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {(message.streamingContent || (message.streaming && message.content && !message.reasoning)) && (
              <span className="inline-block w-2 h-5 bg-gray-900 ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 用户消息：使用微信风格气泡形状（绿色气泡，右下角带小三角），浅灰背景，深色文字
  return (
    <div className="flex items-center justify-end mb-2">
      <div className="relative max-w-[80%] flex items-center">
        <div className="bg-[#f3f4f6] text-gray-900 px-4 py-2 rounded-[18px] shadow flex items-center min-h-[40px]" style={{ lineHeight: '1.7' }}>
          <div className="user-message-markdown text-base text-gray-900 w-full" style={{ display: 'flex', alignItems: 'center' }}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
        {/* 微信风格右下角三角，SVG与圆角自然衔接 */}
        <svg
          className="absolute right-[-10px] bottom-2"
          width="16" height="18" viewBox="0 0 16 18" fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ zIndex: 1 }}
        >
          <path
            d="M0 18 Q8 2 16 8 Q10 12 0 18 Z"
            fill="#f3f4f6"
          />
        </svg>
      </div>
      <div className="flex-shrink-0 ml-4">
        <FaUserCircle className="text-2xl" style={{ color: '#555' }} />
      </div>
    </div>
  );
} 