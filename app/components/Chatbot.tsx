"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/solid";
import { gpt } from "../gpt_action";
import { useRouter } from "next/navigation";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const Chatbot = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([]);
  const [input, setInput] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // messages가 변경될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: ChatCompletionMessageParam = {
      content: input,
      role: "user",
    };
    const newMessages = messages.concat(userMessage);

    setMessages(newMessages);
    setInput("");

    const botResponse = await getBotResponse(newMessages);
    const botMessage: ChatCompletionMessageParam = {
      content: botResponse,
      role: "assistant",
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const getBotResponse = async (
    messages: ChatCompletionMessageParam[],
  ): Promise<string> => {
    try {
      const data = await gpt(messages, window.location.href);

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      }

      return data.text;
    } catch (error) {
      console.error("Error fetching bot response:", error);
      return "죄송합니다. 응답을 가져올 수 없습니다.";
    }
  };

  return (
    <div className="fixed right-4 bottom-4 flex flex-col items-end z-50">
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
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {/* {msg.content} */}
                    {msg.content as string}
                  </span>
                </div>
              ))}
              {/* 스크롤 위치를 위한 더미 div */}
              <div ref={messagesEndRef} />
            </div>
            {/* 입력 영역 */}
            <form
              className="p-2 border-t flex"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="flex-1 border rounded px-2 py-1"
                value={input}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setInput(e.target.value)
                }
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-primary text-white rounded"
              >
                SEND
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
