"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
// Sử dụng đường dẫn tương đối theo yêu cầu của bạn
import { ChatMessage } from '../types/chat';
import { sendChatMessage } from '../api/chatApi';

// --- Types ---
interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Tin nhắn chào mừng mặc định
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'Xin chào! Tôi là trợ lý tài chính của bạn.\nHỏi tôi bất cứ điều gì về tình hình tài chính nhé 😊',
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Hàm gửi tin nhắn tích hợp gọi API Agentic AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // 1. Thêm tin nhắn của người dùng vào giao diện ngay lập tức
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // 2. Gọi API để Agent xử lý
      // Truyền cả lịch sử tin nhắn (history) để Agent hiểu ngữ cảnh[cite: 3, 4]
      const aiReply = await sendChatMessage(content, messages);

      // 3. Thêm phản hồi của AI vào danh sách
      const assistantMessage: ChatMessage = { role: 'assistant', content: aiReply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      // Xử lý lỗi (ví dụ: mất mạng hoặc lỗi server)
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: `Rất tiếc, đã có lỗi xảy ra: ${error.message}. Bạn vui lòng thử lại nhé!` 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  // Hàm xóa lịch sử chat
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