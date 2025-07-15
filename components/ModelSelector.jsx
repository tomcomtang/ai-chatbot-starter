import React, { useState, useRef, useEffect } from "react";

export default function ModelSelector({ value, onChange, borderless }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // 获取可用模型列表
  useEffect(() => {
    async function fetchModels() {
      try {
        // 调用EdgeOne Functions的API
        const response = await fetch('/api/models', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
        const data = await response.json();
        setModels(data.models);
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // 如果API调用失败，使用默认的DeepSeek模型
        setModels([
          { value: "deepseek-chat", label: "DeepSeek-V3", disabled: false },
          { value: "deepseek-reasoner", label: "DeepSeek-R1", disabled: false }
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchModels();
  }, []);

  const selected = models.find((m) => m.value === value) || models[0];

  useEffect(() => {
    if (open && menuRef.current) {
      menuRef.current.focus();
    }
  }, [open]);

  // 关闭下拉菜单（点击外部或失焦）
  useEffect(() => {
    function handleClick(e) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    function handleMouseLeave() {
      setHighlight(-1);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      if (menuRef.current) {
        menuRef.current.addEventListener("mouseleave", handleMouseLeave);
      }
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      if (menuRef.current) {
        menuRef.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [open]);

  // 键盘导航
  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      setHighlight((h) => (h + 1) % models.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlight((h) => (h - 1 + models.length) % models.length);
      e.preventDefault();
    } else if (e.key === "Enter" && highlight >= 0) {
      onChange(models[highlight].value);
      setOpen(false);
      setHighlight(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className={`flex items-center gap-1 px-2 py-2 rounded bg-transparent text-gray-400 text-base ${borderless ? '' : 'border bg-gray-50'}`}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex align-middle select-none" tabIndex={-1}>
      <button
        ref={btnRef}
        type="button"
        className={`flex items-center gap-1 px-2 py-2 rounded bg-transparent text-gray-700 text-base focus:outline-none ${borderless ? '' : 'border bg-gray-50'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.label || 'Select Model'}</span>
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" className="text-gray-400" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <ul
          ref={menuRef}
          tabIndex={0}
          className="absolute left-0 bottom-full mb-1 min-w-full bg-white border rounded-xl shadow-lg z-20 outline-none"
          role="listbox"
          onKeyDown={handleKeyDown}
        >
          {models.map((m, idx) => (
            <li
              key={m.value}
              className={`px-4 py-2 text-base whitespace-nowrap transition-colors
                ${idx === 0 ? 'rounded-t-xl' : ''} 
                ${idx === models.length - 1 ? 'rounded-b-xl' : ''}
                ${m.disabled ? 'text-gray-300 bg-white cursor-not-allowed' :
                  value === m.value ? "bg-gray-100 text-black cursor-pointer" :
                  highlight === idx ? "bg-gray-100 text-gray-600 cursor-pointer" :
                  "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"}
              `}
              role="option"
              aria-selected={value === m.value}
              aria-disabled={m.disabled}
              onClick={() => {
                if (!m.disabled) {
                  onChange(m.value);
                  setOpen(false);
                  setHighlight(-1);
                }
              }}
              onMouseEnter={() => setHighlight(idx)}
            >
              {m.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 