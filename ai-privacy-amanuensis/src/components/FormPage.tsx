"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Loader, CornerDownLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface TokenResponse {
  token: string;
}

interface FormData {
  [key: string]: string | null;
}

interface FormSchema {
  name: string;
  parameters: {
    properties: {
      [key: string]: {
        description: string;
        type?: string;
      };
    };
  };
}

export default function FormPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [participantName] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [formData, setFormData] = useState<FormData>({});
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentQuestionKey, setCurrentQuestionKey] = useState<string>("");
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [formName, setFormName] = useState<string>("申請フォーム");
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
  const [progressStep, setProgressStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const formDataRef = useRef<FormData>({});
  const roomName = `form-session-${Date.now()}`;

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
        setToken("mock-token-for-demo");
      } finally {
        setIsConnecting(false);
      }
    };

    getToken();
  }, [participantName, roomName]);

  // Load form schema
  useEffect(() => {
    const loadFormSchema = async () => {
      try {
        const response = await fetch('/api/form-schema');
        if (response.ok) {
          const schema: FormSchema = await response.json();
          setFormSchema(schema);
          setFormName(schema.name);
          const properties = schema.parameters.properties;
          setTotalSteps(Object.keys(properties).length);
          
          // Read out the form name
          speakText(`${schema.name}の申請書があります。${schema.name}ですね。確認してよろしいですか？`);
          
          // Start asking questions after a short delay
          setTimeout(() => {
            if (!formDataRef.current || Object.keys(formDataRef.current).length === 0) {
              askNextQuestion();
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to load form schema:", error);
      }
    };

    loadFormSchema();
  }, []);

  // Text-to-speech function (iOS optimized)
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create utterance
        speechSynthesisRef.current = new SpeechSynthesisUtterance(text);
        speechSynthesisRef.current.lang = 'ja-JP';
        speechSynthesisRef.current.rate = 0.85; // Slightly slower for iOS clarity
        speechSynthesisRef.current.pitch = 1.0;
        speechSynthesisRef.current.volume = 1.0;
        
        // iOS-specific: add a small delay before speaking
        setTimeout(() => {
          try {
            window.speechSynthesis.speak(speechSynthesisRef.current!);
          } catch (error) {
            console.error('Speech synthesis error:', error);
          }
        }, 100);
      } catch (error) {
        console.error('Text-to-speech setup error:', error);
      }
    }
  };

  // Ask next question
  const askNextQuestion = () => {
    if (!formSchema) return;

    const properties = formSchema.parameters.properties;
    const remainingFields = Object.entries(properties).filter(
      ([key]) => !formData[key]
    );

    if (remainingFields.length === 0) {
      // All questions answered, redirect to honninkakunin for identity verification
      const submissionId = `${Date.now()}`;
      const queryParams = new URLSearchParams({
        formName: formName,
        submissionId: submissionId,
        formData: JSON.stringify(formData)
      });
      
      // Brief pause before redirecting
      setTimeout(() => {
        router.push(`/honninkakunin?${queryParams.toString()}`);
      }, 1000);
      return;
    }

    const [nextKey, nextField] = remainingFields[0];
    const question = nextField.description || nextKey;
    
    setCurrentQuestionKey(nextKey);
    setCurrentQuestion(question);
    setProgressStep(Object.keys(formData).length + 1);
    
    // Speak the question
    speakText(question);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, message: input };
    setConversationHistory((prev) => [...prev, userMessage]);
    
    // Update form data with the answer
    if (currentQuestionKey) {
      setFormData((prev) => {
        const updated = {
          ...prev,
          [currentQuestionKey]: input
        };
        formDataRef.current = updated;
        return updated;
      });
    }

    setInput("");
    setIsLoading(true);

    // Acknowledge the answer with smooth transition
    const responses = [
      "かしこまりました。ありがとうございます。",
      "了解いたしました。",
      "ご回答ありがとうございます。"
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Speak acknowledgement
    speakText(response);
    
    // Add acknowledgement to history
    setConversationHistory((prev) => [
      ...prev,
      { role: "agent", message: response }
    ]);
    
    setIsLoading(false);
    
    // Auto advance to next question with smooth delay for user to see the response
    // Then ask next question immediately
    setTimeout(() => {
      askNextQuestion();
    }, 1200);
  };

  // Handle skip
  const handleSkip = () => {
    // Speak skip message
    speakText("この質問をスキップします。");
    
    // Add to history
    setConversationHistory((prev) => [
      ...prev,
      { role: "agent", message: "この質問をスキップします。" }
    ]);
    
    // Clear input
    setInput("");
    
    // Auto advance after brief pause
    setTimeout(() => {
      askNextQuestion();
    }, 800);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_name: formName,
          answers: formData
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formName}_filled.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 justify-between p-6">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-10 text-yellow-400">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-yellow-400/10 rounded-full hover:bg-yellow-400/20 transition-colors"
        >
          <CornerDownLeft size={24} />
        </button>
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold">{formName}</div>
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-yellow-400 rounded-full">
            <span className="font-bold">{progressStep} / {totalSteps}</span>
          </div>
          {token && (
            <div className="flex items-center gap-2 px-3 py-1 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>接続完了</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Current Question */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <h2 className="text-xl font-medium tracking-wide text-yellow-400/60 uppercase mb-8">
          現在の質問
        </h2>
        
        {currentQuestion ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={currentQuestion}
            className="w-full bg-yellow-400 text-slate-900 p-8 rounded-3xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] transform"
          >
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              {currentQuestion}
            </h1>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-yellow-400 text-slate-900 p-8 rounded-3xl shadow-[0_10px_30px_rgba(250,204,21,0.3)]"
          >
            <h1 className="text-3xl font-extrabold">
              {formName}ですね。確認してよろしいですか？
            </h1>
          </motion.div>
        )}
      </main>

      {/* Audio Visualization */}
      <div className="flex items-end gap-1 mb-8 h-20 justify-center w-full px-4">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="w-3 bg-yellow-400 rounded-full"
            style={{
              height: `${Math.max(20, Math.random() * 100)}%`,
              animationDelay: `${i * 0.1}s`,
              animation: isListening ? 'pulse 0.8s ease-in-out infinite' : 'none'
            }}
          />
        ))}
      </div>

      <div className="text-center mb-8">
        <p className="text-yellow-400/60 text-sm tracking-wider uppercase">
          {isListening ? "聞き取り中..." : "入力を待機中..."}
        </p>
      </div>

      {/* Input Area */}
      <div className="w-full flex gap-4">
        <button
          onClick={() => {
            setIsListening(!isListening);
            if (!isListening) {
              speakText("どうぞ、お答えください");
            }
          }}
          className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? "bg-red-500 hover:bg-red-600"
              : "bg-yellow-400 hover:bg-yellow-500 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]"
          }`}
        >
          <Mic size={32} className={isListening ? "text-white" : "text-slate-900"} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="ここに答えを入力..."
          className="flex-1 bg-slate-800 text-white border-2 border-yellow-400 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="h-16 bg-yellow-400 text-slate-900 px-8 rounded-full flex items-center justify-center gap-3 font-bold hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {!isLoading && <span>送信</span>}
        </button>

        <button
          onClick={handleSkip}
          className="h-16 bg-slate-800 text-yellow-400 px-8 rounded-full flex items-center justify-center gap-2 font-bold border-2 border-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-all"
        >
          スキップ
        </button>
      </div>

      {/* Style for animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
