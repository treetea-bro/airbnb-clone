"use client";

import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubbleOvalLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Message {
  text: string;
  sender: "user" | "bot";
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const botResponse = await getBotResponse(input);
    const botMessage: Message = { text: botResponse, sender: "bot" };
    setMessages((prev) => [...prev, botMessage]);
  };

  const getBotResponse = async (userInput: string): Promise<string> => {
    // 실제 API 호출 로직으로 대체하세요.
    return `챗봇 응답: ${userInput}`;
  };

  return (
    <div className="fixed right-4 bottom-4 flex flex-col items-end">
      {/* 토글 버튼 */}
      <button
        className="mb-2 p-3 bg-primary text-white rounded-full shadow-lg focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "챗봇 닫기" : "챗봇 열기"}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChatBubbleOvalLeftIcon className="h-6 w-6" />
        )}
      </button>

      {/* 챗봇 창 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, transform: "scale(0.9)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.9)" }}
            transition={{ duration: 0.2 }}
            className="w-80 h-96 bg-white shadow-lg flex flex-col"
          >
            <div className="flex-1 p-4 overflow-auto chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    msg.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-2 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-2 border-t flex">
              <input
                type="text"
                className="flex-1 border rounded px-2 py-1"
                value={input}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                  e.key === "Enter" && handleSend()
                }
              />
              <button
                className="ml-2 px-4 py-2 bg-primary text-white rounded"
                onClick={handleSend}
              >
                보내기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
