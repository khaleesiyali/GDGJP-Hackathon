"use client";

import Link from "next/link";
import { Folder, Camera, User, Mic, Sun, Moon, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  useLocalParticipant,
  useVoiceAssistant,
  useRoomContext
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useRouter } from "next/navigation";
import "@livekit/components-styles";

// The interactive inner component logic
function HubSession({ 
  shouldDisconnect,
  setHasConnected 
}: { 
  shouldDisconnect: boolean,
  setHasConnected: (v: boolean) => void 
}) {
  const room = useRoomContext();
  const router = useRouter();
  const { localParticipant } = useLocalParticipant();
  let voiceAssistant;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    voiceAssistant = useVoiceAssistant();
  } catch (e) {
    voiceAssistant = { state: "disconnected" };
  }
  
  const agentState = voiceAssistant?.state || "disconnected";
  const isMicOn = localParticipant?.isMicrophoneEnabled;
  
  // As soon as room mounts, turn on mic so agent can hear "hello"
  useEffect(() => {
    if (localParticipant && !isMicOn && agentState !== "disconnected") {
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices) {
          localParticipant.setMicrophoneEnabled(true).catch((error) => {
            console.error('Microphone enable error:', error);
          });
        } else {
          console.error("Microphone access blocked: You must use HTTPS or localhost.");
        }
      } catch (error) {
        console.error('Error enabling microphone:', error);
      }
    }
  }, [localParticipant, isMicOn, agentState]);

  useEffect(() => {
    if (agentState !== "disconnected") setHasConnected(true);
  }, [agentState, setHasConnected]);

  useEffect(() => {
    if (shouldDisconnect && localParticipant) {
      localParticipant.setMicrophoneEnabled(false);
    }
  }, [shouldDisconnect, localParticipant]);

  // Voice Navigation via DataChannel
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data.action === "navigate" && data.destination) {
          router.push(data.destination);
        }
      } catch (e) {
        // ignore non-json messages
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, router]);

  // Map Agent state to our visually custom Orb states
  let orbVisual: "idle" | "listening" | "processing" | "success" = "idle";
  let statusText = "接続完了。お話しください";

  if (agentState === "speaking") {
    orbVisual = "listening"; // Rings for speaking
    statusText = "エージェントが発言中...";
  } else if (agentState === "thinking" || agentState === "initializing") {
    orbVisual = "processing"; // Swirls
    statusText = "処理中...";
  } else if (agentState === "listening" || isMicOn) {
    orbVisual = "listening";
    statusText = "聞き取り中...";
  }

  const orbVariants = {
    idle: {
      scale: [1, 1.05, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      backgroundColor: "var(--brand-primary)",
      boxShadow: "0 0 40px var(--brand-border)"
    },
    listening: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
      backgroundColor: "var(--brand-primary)",
      boxShadow: "0 0 80px var(--brand-border)"
    },
    processing: {
      rotate: 360,
      borderRadius: ["50%", "30%", "50%"],
      scale: [1, 0.9, 1],
      transition: { duration: 2, repeat: Infinity, ease: "linear" },
      backgroundColor: "var(--brand-primary)",
      boxShadow: "0 0 60px var(--brand-border)"
    },
    success: {
      scale: 1.1,
      backgroundColor: "#22c55e",
      boxShadow: "0 0 60px rgba(34, 197, 94, 0.5)",
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <RoomAudioRenderer />
      {/* Background ripples */}
      {orbVisual === "idle" && (
        <div className="absolute w-48 h-48 bg-[var(--brand-primary)] opacity-20 rounded-full animate-ping" />
      )}

      {/* Processing Swirls */}
      {orbVisual === "processing" && (
        <motion.div
          className="absolute w-56 h-56 border-[4px] border-dashed border-[var(--brand-primary)] rounded-full opacity-40"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Listening Rings */}
      {orbVisual === "listening" && (
        <>
          <motion.div
            className="absolute w-48 h-48 rounded-full border-2 border-[var(--brand-primary)] opacity-30"
            animate={{ scale: [1, 2], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full border-2 border-[var(--brand-primary)] opacity-30"
            animate={{ scale: [1, 2], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
          />
        </>
      )}

      {/* Core Orb */}
      <motion.button
        variants={orbVariants}
        animate={orbVisual}
        className="w-32 h-32 rounded-full flex items-center justify-center text-[var(--brand-bg)] shadow-[0_0_40px_var(--brand-border)] z-10 cursor-default border-none outline-none focus:outline-none"
        aria-label="音声アシスタント接続済み"
      >
        <Mic size={48} strokeWidth={2.5} />
      </motion.button>
      
      {/* Overlay Status text below orb */}
      <div className="absolute top-48 w-full flex justify-center pointer-events-none">
         <p className="text-lg font-bold tracking-widest uppercase animate-pulse text-[var(--brand-primary)]">
            <span aria-label={statusText}>{statusText}</span>
         </p>
      </div>
    </>
  );
}

// Main page component
export default function Hub() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const [showNav, setShowNav] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleOrbClick = async () => {
    if (token) {
      // Already connected, show navigation button
      setShowNav(true);
      return;
    }
    
    setIsConnecting(true);
    try {
      let ptName = sessionStorage.getItem("amanai_pt_name");
      if (!ptName) {
        ptName = `user-${Math.random().toString(36).substring(7)}`;
        sessionStorage.setItem("amanai_pt_name", ptName);
      }
      
      const response = await fetch(`/api/token?room_name=form-session-${Date.now()}&participant_name=${ptName}`);
      if (!response.ok) throw new Error("Failed token fetch");
      const data = await response.json();
      setToken(data.token);
    } catch (e) {
      console.error(e);
      setIsConnecting(false);
    }
  };

  const orbVariants: any = {
    idle: {
      scale: [1, 1.05, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      backgroundColor: "var(--brand-primary)",
      boxShadow: "0 0 40px var(--brand-border)"
    }
  };

  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://jing-139sv34p.livekit.cloud";

  return (
    <div className="flex flex-col h-full w-full justify-between items-center relative p-6">
      {/* Header */}
      <header className="w-full relative mt-8 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-[var(--brand-primary)]" aria-label="Amanuensis">
            AmanAI
          </h1>
          <p className="text-[var(--brand-primary)] opacity-70 text-sm mt-2 font-medium">
            <span aria-label="エンドツーエンド暗号化">エンドツーエンド暗号化</span>
          </p>
        </div>

        {mounted && (
          <button
            onClick={toggleTheme}
            className="absolute right-0 top-0 p-2 rounded-full border border-[var(--brand-border)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-bg)] transition-colors"
            aria-label="テーマ切り替え"
          >
            {theme === "tokyo-night" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
      </header>

      {/* Main Center - Pulsating Orb */}
      <div className="flex-1 flex items-center justify-center flex-col w-full relative">
        <div className="relative group flex flex-col items-center justify-center mt-12 mb-8" aria-live="polite">
          
          {token ? (
            <LiveKitRoom
              serverUrl={liveKitUrl}
              token={token}
              connect={true}
              audio={true}
              video={false}
              className="flex items-center justify-center w-full h-full"
            >
              <HubSession 
                shouldDisconnect={showNav}
                setHasConnected={setHasConnected} 
              />
            </LiveKitRoom>
          ) : (
             <>
              <div className="absolute w-48 h-48 bg-[var(--brand-primary)] opacity-20 rounded-full animate-ping" />
              <motion.button
                onClick={handleOrbClick}
                variants={orbVariants}
                animate="idle"
                className="w-32 h-32 rounded-full flex items-center justify-center text-[var(--brand-bg)] shadow-[0_0_40px_var(--brand-border)] z-10 cursor-pointer border-none outline-none focus:outline-none"
                aria-label="音声アシスタントを起動"
                disabled={isConnecting}
              >
                {isConnecting ? <Loader size={48} className="animate-spin" /> : <Mic size={48} strokeWidth={2.5} />}
              </motion.button>
              
              <div className="h-12 mt-8 flex items-center justify-center">
                <p className="text-lg font-bold tracking-widest uppercase text-[var(--brand-primary)]">
                  <span aria-label="タップして話す">
                    {isConnecting ? "接続中..." : "タップして話す"}
                  </span>
                </p>
              </div>
             </>
          )}

        </div>

        <div className="h-16 mt-16 w-full flex justify-center">
          <AnimatePresence>
            {(hasConnected || showNav) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Link href="/form" onClick={() => setShowNav(true)} className="px-8 py-3 bg-[var(--brand-primary)] text-[var(--brand-bg)] rounded-full font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center justify-center shadow-lg shadow-[var(--brand-border)]">
                  <span aria-label="申請を進める">申請を進める →</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav
        className="w-full bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-2xl p-4 flex justify-around items-center mb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20"
        aria-label="メインナビゲーション"
      >
        <button className="flex flex-col items-center gap-1 text-[var(--brand-primary)] opacity-60 hover:opacity-100 transition-opacity">
          <Folder size={24} />
          <span className="text-[10px] font-bold tracking-wider" aria-label="ファイル">ファイル</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-[var(--brand-primary)] opacity-60 hover:opacity-100 transition-opacity">
          <Camera size={24} />
          <span className="text-[10px] font-bold tracking-wider" aria-label="スキャン">スキャン</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-[var(--brand-primary)] opacity-60 hover:opacity-100 transition-opacity">
          <User size={24} />
          <span className="text-[10px] font-bold tracking-wider" aria-label="プロフィール">プロフィール</span>
        </button>
      </nav>
    </div>
  );
}
