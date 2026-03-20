"use client";

//updated 3/18

import { useState, useEffect } from "react";
import { Mic, MicOff, Send, Loader } from "lucide-react";
import { motion } from "framer-motion";

interface TokenResponse {
  token: string;
}

interface FormData {
  [key: string]: string | null;
}

export default function FormPage() {
  const [token, setToken] = useState<string>("");
  const [participantName] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [formData, setFormData] = useState<FormData>({});
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "agent"; message: string }>
  >([
    {
      role: "agent",
      message: "こんにちは！申請書へようこそ。本日はどのようなご用件でしょうか？"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const roomName = "form-session";

  // Get token from backend
  useEffect(() => {
    const getToken = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(
          `${backendUrl}/get_token?room_name=${roomName}&participant_name=${participantName}`
        );

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const data: TokenResponse = await response.json();
        setToken(data.token);
        console.log("✅ Token received from backend:", data.token.substring(0, 20) + "...");
      } catch (error) {
        console.error("❌ Failed to get token from backend:", error);
        // For demo purposes, continue with mock token
        setToken("mock-token-for-demo");
      } finally {
        setIsConnecting(false);
      }
    };

    getToken();
  }, [participantName, roomName]);

  // Simulate message response from agent
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user" as const, message: input };
    setConversationHistory((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate agent response
    setTimeout(() => {
      const responses = [
        "かしこまりました。次に、ご住所についてお聞きしたいのですが、いかがですか？",
        "ありがとうございます。そちらについてはメモさせていただきました。",
        "了解いたしました。他にご不明な点はございますか？",
        "素晴らしい。それでは情報を確認させていただきます。"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setConversationHistory((prev) => [
        ...prev,
        { role: "agent", message: randomResponse }
      ]);
      setIsLoading(false);
    }, 1000);

    // Update form data (mock)
    setFormData((prev) => ({
      ...prev,
      user_input: input
    }));
  };

  const handleDownloadJSON = () => {
    const dataToDownload = {
      form_name: "申請フォーム",
      submission_id: Math.random().toString(36).substr(2, 9),
      status: "completed",
      answers: formData,
      conversation: conversationHistory
    };

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToDownload, null, 2))
    );
    element.setAttribute("download", `form_response_${Date.now()}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            申請フォームアシスタント
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI音声アシスタントがあなたの申請をサポートします
          </p>
          <div className="mt-4 flex items-center gap-2">
            {isConnecting ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  バックエンドに接続中...
                </span>
              </>
            ) : token ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✅ 準備完了（トークン取得: {token.substring(0, 20)}...）
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600 dark:text-red-400">
                  接続エラー（デモモード）
                </span>
              </>
            )}
          </div>
        </div>

        {/* Conversation Area */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6 h-96 overflow-y-auto">
          <div className="space-y-4">
            {conversationHistory.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none"
                    }`}
                >
                  {msg.message}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-gray-500"
              >
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="メッセージを入力してください..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>

          {/* Voice Control */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${isListening
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white"
                }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isListening ? "リッスン中..." : "音声入力"}
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              JSONをダウンロード
            </button>
          </div>
        </div>

        {/* Form Data Preview */}
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">
            フォームデータプレビュー
          </h3>
          <pre className="text-xs bg-white dark:bg-slate-800 p-3 rounded overflow-auto text-gray-900 dark:text-gray-100">
            {JSON.stringify(formData || { status: "受け取り待機中..." }, null, 2)}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
