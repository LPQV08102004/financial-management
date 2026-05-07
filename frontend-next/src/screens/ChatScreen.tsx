"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Footer from '../components/Footer';
import { sendChatMessage, parseTransaction, parseSavingsAction } from '../api/chatApi';
import { useChatContext } from '../context/ChatContext';
import TransactionConfirmCard from '../components/TransactionConfirmCard';
import SavingsConfirmCard from '../components/SavingsConfirmCard';

const SUGGESTED = [
  'Tháng này tôi chi tiêu bao nhiêu?',
  'Thu nhập tháng này là bao nhiêu?',
  'Tôi có tiết kiệm được không?',
  'Cho tôi xem 10 giao dịch gần nhất',
];

export default function ChatScreen() {
  const { messages, setMessages } = useChatContext();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [nlpMode, setNlpMode] = useState(false);
  const [savingsMode, setSavingsMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const getHistory = (msgs: any[]) =>
    msgs
      .filter((m) => m.id !== '0' && m.type !== 'card')
      .map((m) => ({ role: m.role, content: m.content }));

  const send = useCallback(async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: userText };
    const nextMessages = [...messages, userMsg] as any[];
    setMessages(nextMessages);
    setLoading(true);

    try {
      if (nlpMode) {
        setNlpMode(false);
        const result = await parseTransaction(userText);
        setMessages((prev) => {
          const newMsgs: any[] = [];
          if (result.warning) {
            newMsgs.push({
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: result.warning,
            });
          }
          newMsgs.push({
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            type: 'card',
            content: '__card__',
            parsed: result,
          });
          return [...prev, ...newMsgs];
        });
      } else if (savingsMode) {
        setSavingsMode(false);
        const result = await parseSavingsAction(userText);
        setMessages((prev) => {
          const newMsgs: any[] = [];
          if (result.warning) {
            newMsgs.push({
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: result.warning,
            });
          }
          newMsgs.push({
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            type: 'savings-card',
            content: '__savings-card__',
            parsed: result,
          });
          return [...prev, ...newMsgs];
        });
      } else {
        const reply = await sendChatMessage(userText, getHistory(nextMessages));
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: `❌ ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, nlpMode, savingsMode, setMessages]);

  const updateMessageConfirmed = (msgId: string | undefined, content: string) => {
    if (!msgId) return;
    setMessages((prev) =>
      prev.map((m: any) => (m.id === msgId ? { ...m, confirmed: true, content } : m))
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] overflow-hidden">
      {/* Header[cite: 9] */}
      <header className="flex items-center bg-[#075c09] pt-12 pb-4 px-4 text-white shrink-0">
        <button onClick={() => window.history.back()} className="mr-3 text-2xl">←</button>
        <h1 className="text-lg font-bold text-white">🤖 Trợ lý tài chính</h1>
      </header>

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((item) => {
          const isUser = item.role === 'user';

          if (item.type === 'card' && !item.confirmed) {
            return (
              <TransactionConfirmCard
                key={item.id}
                parsed={item.parsed}
                onConfirmed={() => updateMessageConfirmed(item.id, '✅ Giao dịch đã được lưu thành công!')}
                onCancel={() => updateMessageConfirmed(item.id, '🚫 Đã huỷ giao dịch.')}
              />
            );
          }

          if (item.type === 'savings-card' && !item.confirmed) {
            return (
              <SavingsConfirmCard
                key={item.id}
                parsed={item.parsed}
                onConfirmed={() => updateMessageConfirmed(item.id, '✅ Đã nạp/rút tiền tiết kiệm thành công!')}
                onCancel={() => updateMessageConfirmed(item.id, '🚫 Đã huỷ.')}
              />
            );
          }

          return (
            <div 
              key={item.id}
              className={`max-w-[85%] p-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                isUser 
                ? 'ml-auto bg-[#075c09] text-white rounded-br-none' 
                : item.content.startsWith('⚠️')
                  ? 'mr-auto bg-orange-50 text-orange-800 rounded-bl-none border border-orange-200'
                  : 'mr-auto bg-white text-gray-800 rounded-bl-none border border-gray-100'
              }`}
            >
              {item.content.split('\n').map((line: string, i: number) => (
                <React.Fragment key={i}>
                  {line}
                  {i < item.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-xs px-2 animate-pulse">
            <div className="w-2 h-2 bg-[#075c09] rounded-full animate-bounce"></div>
            {nlpMode ? 'Đang phân tích giao dịch...' : savingsMode ? 'Đang phân tích tiết kiệm...' : 'Đang trả lời...'}
          </div>
        )}
      </div>

      {/* Banners & Suggestions[cite: 9] */}
      <section className="shrink-0">
        {nlpMode && !loading && (
          <div className="bg-[#e8f5e9] px-4 py-2 border-t border-[#c8e6c9] flex justify-between items-center text-[13px]">
            <p className="text-[#075c09]">📝 Nhập giao dịch: "Ăn tối 150k"</p>
            <button onClick={() => setNlpMode(false)} className="text-red-500 font-bold">Huỷ</button>
          </div>
        )}

        {savingsMode && !loading && (
          <div className="bg-[#e3f2fd] px-4 py-2 border-t border-[#90caf9] flex justify-between items-center text-[13px]">
            <p className="text-[#1565c0]">🏦 Nhập tiết kiệm: "Bỏ ống 200k"</p>
            <button onClick={() => setSavingsMode(false)} className="text-red-500 font-bold">Huỷ</button>
          </div>
        )}

        {messages.length <= 1 && !loading && !nlpMode && !savingsMode && (
          <div className="flex flex-wrap gap-2 px-3 pb-3">
            {SUGGESTED.map((s, i) => (
              <button 
                key={i} 
                onClick={() => send(s)}
                className="bg-[#e8f5e9] text-[#075c09] border border-[#c8e6c9] rounded-full px-3 py-1.5 text-xs hover:bg-[#c8e6c9] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Input Bar[cite: 9] */}
      <footer className="bg-white border-t p-3 flex items-end gap-2 shrink-0 pb-20">
        <button 
          onClick={() => { setNlpMode(!nlpMode); setSavingsMode(false); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
            nlpMode ? 'bg-[#075c09] border-[#075c09]' : 'bg-[#e8f5e9] border-[#c8e6c9]'
          }`}
        >
          <span className="text-lg">🧾</span>
        </button>

        <button 
          onClick={() => { setSavingsMode(!savingsMode); setNlpMode(false); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
            savingsMode ? 'bg-[#1565c0] border-[#1565c0]' : 'bg-[#e3f2fd] border-[#90caf9]'
          }`}
        >
          <span className="text-lg">🏦</span>
        </button>

        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={nlpMode ? 'VD: Cafe 45k...' : savingsMode ? 'VD: Tiết kiệm 100k...' : 'Nhập câu hỏi...'}
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-[15px] focus:outline-none resize-none max-h-32"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />

        <button 
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
            !input.trim() || loading ? 'bg-gray-300' : 'bg-[#075c09]'
          }`}
        >
          ➤
        </button>
      </footer>
          </div>
  );
}
