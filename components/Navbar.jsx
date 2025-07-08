import React from "react";
import { FaGithub, FaMoon, FaSun } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="w-full h-14 flex items-center justify-between px-4 bg-transparent shadow-none">
      <div className="flex items-center gap-2 font-bold text-lg" style={{ color: '#222' }}>
        <span className="inline-block align-middle" style={{ width: 28, height: 28 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="24" height="24" rx="7" fill="#fff" stroke="#222" strokeWidth="2"/>
            <path d="M9 9h10M9 14h7M9 19h10" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        <span>Chatbot</span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/tomcomtang/ai-chatbot-starter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl transition-all duration-200 hover:text-blue-600 hover:scale-110"
          style={{ color: '#222' }}
        >
          <FaGithub />
        </a>
      </div>
    </nav>
  );
} 