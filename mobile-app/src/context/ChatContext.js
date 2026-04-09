import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

const INITIAL_MESSAGES = [
  {
    id: '0',
    role: 'assistant',
    content: 'Xin chào! Tôi là trợ lý tài chính của bạn.\nHỏi tôi bất cứ điều gì về tình hình tài chính nhé 😊',
  },
];

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
