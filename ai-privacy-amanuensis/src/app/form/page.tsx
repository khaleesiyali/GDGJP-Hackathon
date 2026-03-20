"use client";

import Link from "next/link";
import { Mic, ArrowRight, CornerDownLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  {
    title: "ご用件について",
    description: "本日はどのようなご用件でしょうか？詳細をお話しください。"
  },
  {
    title: "ご住所",
    description: "次にご住所についてお聞きしたいのですが、いかがですか？"
  },
  {
    title: "その他ご不明点",
    description: "他にご不明な点はございますか？"
  },
  {
    title: "情報の確認",
    description: "素晴らしい。それでは情報を確認させていただきます。準備はよろしいですか？"
  }
];

export default function FormView() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [token, setToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(`${backendUrl}/get_token?room_name=form-session&participant_name=user-demo`);
        if (!response.ok) throw new Error("Backend error");
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        setToken("mock-token-for-demo");
      } finally {
        setIsConnecting(false);
      }
    };
    getToken();
  }, []);

  const handleNext = () => {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      router.push("/success");
    }
  };

  const currentQ = QUESTIONS[currentIdx];

  return (
    <div className="flex flex-col h-full w-full justify-between bg-[var(--brand-bg)] p-6 transition-colors duration-300">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6 mt-6 text-[var(--brand-primary)]">
        <Link 
          href="/" 
          aria-label="ハブに戻る"
          className="p-3 bg-[var(--brand-primary)]/10 rounded-full hover:bg-[var(--brand-primary)]/20 transition-colors"
        >
          <CornerDownLeft size={24} />
        </Link>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-4 py-1.5 border-2 border-[var(--brand-border)] rounded-full bg-[var(--brand-bg)]" aria-label={`進捗: ${currentIdx + 1} / ${QUESTIONS.length}`}>
            <span className="font-bold text-sm tracking-widest text-[var(--brand-primary)]">{currentIdx + 1} / {QUESTIONS.length}</span>
          </div>
          
          {/* Backend Connection Status */}
          <div className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 opacity-80" aria-live="polite">
            {isConnecting ? (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span aria-label="接続中...">接続中...</span>
              </>
            ) : token !== "mock-token-for-demo" ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-green-500 text-opacity-90" aria-label="バックエンド接続完了">接続完了</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-500 text-opacity-90" aria-label="デモモード">デモモード</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Question Card */}
      <main className="flex-1 flex flex-col items-center justify-center w-full" aria-live="polite">
        <h2 className="text-lg font-medium tracking-widest text-[var(--brand-primary)]/60 uppercase mb-4">
          <span aria-label="現在の質問">現在の質問</span>
        </h2>
        <div className="w-full bg-[var(--brand-primary)] text-[var(--brand-bg)] p-8 rounded-3xl shadow-[0_10px_30px_var(--brand-border)] transform transition-all duration-300">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            {currentQ.title}
          </h1>
          <p className="mt-6 text-lg font-medium opacity-80 leading-snug">
            {currentQ.description}
          </p>
        </div>
      </main>

      {/* Bottom Area - Waveform & Controls */}
      <footer className="w-full pb-8 pt-10 flex flex-col items-center">
        {/* Visual Waveform Simulator */}
        <div className="flex items-end gap-1.5 mb-10 h-16 justify-center w-full px-4 overflow-hidden" aria-hidden="true">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className="w-3 bg-[var(--brand-primary)] rounded-full animate-pulse"
              style={{
                height: `${Math.max(20, Math.random() * 100)}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.5 + Math.random()}s`
              }}
            />
          ))}
        </div>

        <p className="text-[var(--brand-primary)]/80 uppercase tracking-widest text-sm font-bold mb-8 animate-pulse">
          <span aria-label="聞き取り中...">聞き取り中...</span>
        </p>
        
        <div className="w-full flex justify-between items-center px-4">
          <button className="h-16 w-16 bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] rounded-full flex items-center justify-center hover:bg-[var(--brand-primary)] hover:text-[var(--brand-bg)] transition-colors border border-[var(--brand-primary)]/30" aria-label="録音をコントロール">
             <Mic size={32} />
          </button>
          
          <button 
            onClick={handleNext}
            className="h-16 bg-[var(--brand-primary)] text-[var(--brand-bg)] px-8 rounded-full flex items-center justify-center gap-3 font-bold text-lg hover:shadow-[0_0_20px_var(--brand-border)] transition-all uppercase tracking-wide cursor-pointer"
            aria-label="スキップ / 次へ"
          >
            <span><span aria-label="スキップ">スキップ</span></span>
            <ArrowRight size={24} />
          </button>
        </div>
      </footer>
    </div>
  );
}
