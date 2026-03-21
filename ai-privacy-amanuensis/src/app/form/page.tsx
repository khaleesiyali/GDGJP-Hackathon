"use client";

import Link from "next/link";
import { Mic, MicOff, ArrowRight, CornerDownLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  useLocalParticipant,
  useVoiceAssistant
} from "@livekit/components-react";
import "@livekit/components-styles";

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

// Inner Room Component that has access to LiveKit hooks
function FormSession({ 
  currentIdx, 
  handleNext 
}: { 
  currentIdx: number, 
  handleNext: () => void 
}) {
  const { localParticipant } = useLocalParticipant();
  let voiceAssistant;
  try {
    // Attempt to use the voice assistant hook if available
    // eslint-disable-next-line react-hooks/rules-of-hooks
    voiceAssistant = useVoiceAssistant();
  } catch (e) {
    // Fallback if the component version behaves differently
    voiceAssistant = { state: "disconnected" };
  }
  
  const agentState = voiceAssistant?.state || "disconnected";
  const isMicOn = localParticipant?.isMicrophoneEnabled;
  
  const toggleMic = async () => {
    if (localParticipant) {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        alert("エラー: マイクを使用するにはHTTPSで接続する必要があります。(iOSのセキュリティ制限)");
        return;
      }
      
      if (isMicOn) {
        await localParticipant.setMicrophoneEnabled(false);
      } else {
        await localParticipant.setMicrophoneEnabled(true);
      }
    }
  };

  const currentQ = QUESTIONS[currentIdx];

  // Determine UI Status
  let statusText = "マイクオフ";
  if (isMicOn) {
    if (agentState === "speaking") {
      statusText = "エージェントが発言中...";
    } else if (agentState === "thinking" || agentState === "initializing") {
      statusText = "処理中...";
    } else {
      statusText = "聞き取り中...";
    }
  }

  const isAnimating = isMicOn || agentState === "speaking" || agentState === "thinking";

  return (
    <div className="flex flex-col h-full w-full justify-between bg-[var(--brand-bg)] p-6 transition-colors duration-300">
      <RoomAudioRenderer />
      
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
          
          <div className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 opacity-80" aria-live="polite">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-green-500 text-opacity-90" aria-label="バックエンド接続完了">接続完了</span>
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
              className={`w-3 bg-[var(--brand-primary)] rounded-full ${isAnimating ? "animate-pulse" : "opacity-30"}`}
              style={{
                height: isAnimating ? `${Math.max(20, Math.random() * 100)}%` : "20%",
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.5 + Math.random()}s`
              }}
            />
          ))}
        </div>

        <p className={`text-[var(--brand-primary)]/80 uppercase tracking-widest text-sm font-bold mb-8 ${isAnimating ? "animate-pulse" : ""}`}>
          <span aria-label={statusText}>{statusText}</span>
        </p>
        
        <div className="w-full flex justify-between items-center px-4">
          <button 
            onClick={toggleMic}
            className={`h-16 w-16 rounded-full flex items-center justify-center transition-all border-2 ${
              isMicOn 
                ? "bg-[var(--brand-primary)] text-[var(--brand-bg)] border-[var(--brand-primary)] shadow-[0_0_20px_var(--brand-primary)] scale-110" 
                : "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/30"
            }`}
            aria-label="マイクをコントロール"
          >
             {isMicOn ? <Mic size={32} /> : <MicOff size={32} />}
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

// Main View wrapping the Session in a LiveKitRoom
export default function FormView() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [token, setToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      try {
        let ptName = sessionStorage.getItem("amanai_pt_name");
        if (!ptName) {
           ptName = `user-${Math.random().toString(36).substring(7)}`;
           sessionStorage.setItem("amanai_pt_name", ptName);
        }
        // Use our new local Next.js API route instead of the external python server
        // ✅ 抢救代码 (加上 Date.now()，每次点击都会生成类似 form-session-1711044678 的全新房间)
        const response = await fetch(`/api/token?room_name=form-session-${Date.now()}&participant_name=${ptName}`);
        
        if (!response.ok) throw new Error("Backend error fetching token");
        
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error("Token fetch failed:", error);
        setToken(""); // We actually require a token to connect to LiveKit
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

  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://jing-139sv34p.livekit.cloud";

  if (isConnecting) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[var(--brand-bg)] text-[var(--brand-primary)]">
        <div className="w-12 h-12 bg-yellow-400 rounded-full animate-bounce mb-4 shadow-[0_0_30px_#FACC15]" />
        <h1 className="text-xl font-bold tracking-widest uppercase animate-pulse">接続中...</h1>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[var(--brand-bg)] text-red-500">
        <h1 className="text-2xl font-bold tracking-widest">バックエンド接続エラー</h1>
        <p className="mt-4 opacity-80">ライブキットのトークンが取得できませんでした。</p>
        <p className="mt-2 text-sm opacity-60">Pythonバックエンドが起動しているか確認してください。</p>
        <Link href="/" className="mt-8 px-6 py-3 border-2 border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors">
          ハブに戻る
        </Link>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={liveKitUrl}
      token={token}
      connect={true}
      audio={true} 
      video={false}
      className="h-screen w-full"
    >
      <FormSession currentIdx={currentIdx} handleNext={handleNext} />
    </LiveKitRoom>
  );
}
