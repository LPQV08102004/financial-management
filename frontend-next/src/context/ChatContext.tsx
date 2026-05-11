"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

import { ChatMessage } from '../types/chat';
import { sendChatMessage } from '../api/chatApi';

interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '0',
    role: 'assistant',
    content: 'Xin chào! Tôi là trợ lý tài chính của bạn.\nHỏi tôi bất cứ điều gì về tình hình tài chính nhé 😊',
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {

      const aiReply = await sendChatMessage(content, messages);

      const assistantMessage: ChatMessage = { role: 'assistant', content: aiReply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Rất tiếc, đã có lỗi xảy ra: ${error.message}. Bạn vui lòng thử lại nhé!`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, setMessages, sendMessage, isTyping, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return ctx;
}