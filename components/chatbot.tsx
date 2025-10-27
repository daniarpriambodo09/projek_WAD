"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya adalah AI Assistant siDesa. Tanyakan apa saja tentang data desa, analisis, atau insights yang Anda butuhkan.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // Ref untuk container

  // Fungsi scroll ke bawah
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll otomatis setiap kali messages atau loading berubah
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    setLoading(true);

    // Pastikan scroll terjadi setelah pesan user ditambahkan
    setTimeout(scrollToBottom, 10);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage,
          sendHistory: messages.length > 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mendapatkan respons dari AI");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: new Date() },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Pastikan backend berjalan di http://localhost:3001";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Maaf, terjadi kesalahan: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch("/api/gemini/reset", { method: "POST" });
      setMessages([
        {
          role: "assistant",
          content: "Percakapan telah direset. Silakan mulai pertanyaan baru.",
          timestamp: new Date(),
        },
      ]);
      setError(null);
      setTimeout(scrollToBottom, 10);
    } catch (error) {
      setError("Gagal mereset percakapan");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-white">AI Assistant siDesa</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            title="Reset conversation"
            className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors text-white"
          >
            Reset
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors text-white"
          >
            {isOpen ? "−" : "+"}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      {isOpen && (
        <>
          {/* 🎯 Tambahkan ref ke container ini */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 h-80"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-700 text-gray-100 rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown className="text-sm prose prose-invert max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg text-sm rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {/* 🎯 Ref ini harus ada di akhir konten chat */}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-900 border-t border-red-700 text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-750">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya AI..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white text-sm transition-colors font-medium"
              >
                {loading ? "..." : "Kirim"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}