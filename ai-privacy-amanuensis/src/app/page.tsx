"use client";

import Link from "next/link";
import { Folder, Camera, User, Mic, Sun, Moon, Loader } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  useLocalParticipant,
  useVoiceAssistant
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useAmanAI } from "@/components/AmanAIContext";

// The interactive inner component logic
function HubSession({
  shouldDisconnect
}: {
  shouldDisconnect: boolean
}) {
  const { localParticipant } = useLocalParticipant();
  const { setHasConnected, language } = useAmanAI();
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

  // Map Agent state to our visually custom Orb states
  let orbVisual: "idle" | "listening" | "processing" | "success" = "idle";
  let statusText = language === "ja" ? "接続完了。お話しください" : "Connected. Please speak.";

  if (agentState === "speaking") {
    orbVisual = "listening"; // Rings for speaking
    statusText = language === "ja" ? "エージェントが発言中..." : "Agent speaking...";
  } else if (agentState === "thinking" || agentState === "initializing") {
    orbVisual = "processing"; // Swirls
    statusText = language === "ja" ? "処理中..." : "Processing...";
  } else if (agentState === "listening" || isMicOn) {
    orbVisual = "listening";
    statusText = language === "ja" ? "聞き取り中..." : "Listening...";
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
  const { token, connect, isConnecting, hasConnected, sendScannedContext, language, toggleLanguage } = useAmanAI();
  const [mounted, setMounted] = useState(false);
  const [showNav, setShowNav] = useState(false);

  // Camera State
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => setMounted(true), []);

  const openScanner = async () => {
    setIsScanning(true);
    try {
      // Prompt for both video and audio so the Agent works flawlessly right after
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn("Could not get environment camera, falling back to default.", e);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (err) {
        alert("カメラ・マイクへのアクセスが許可されていません。(Camera/Mic access denied)");
        setIsScanning(false);
      }
    }
  };

  const closeScanner = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current) return;
    setIsProcessingImage(true);

    // Draw to canvas
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);

    try {
      // 1. Send to Next.js API to extract text
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image })
      });
      if (!res.ok) throw new Error("Failed to scan image");
      const { text } = await res.json();

      closeScanner();

      // 2. Connect to AI Agent if not already
      if (!token) {
        await connect();
      }

      // 3. Send extracted text to AI
      await sendScannedContext(text);
      setShowNav(true);

    } catch (error) {
      console.error(error);
      alert("画像の読み取りに失敗しました。もう一度お試しください。");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleOrbClick = async () => {
    if (token) {
      // Already connected, show navigation button
      setShowNav(true);
      return;
    }
    await connect();
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
            <span aria-label="エンドツーエンド暗号化">{language === "ja" ? "エンドツーエンド暗号化" : "End-to-End Encrypted"}</span>
          </p>
        </div>

        {/* Language Toggle Button (Top Left) */}
        {mounted && (
          <button
            onClick={toggleLanguage}
            className="absolute left-0 top-0 p-2 px-3 text-xs font-bold rounded-full border border-[var(--brand-border)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-bg)] transition-colors"
            aria-label="Toggle Language"
          >
            {language === "ja" ? "EN" : "JP"}
          </button>
        )}

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
            <div className="flex items-center justify-center w-full h-full">
              <HubSession shouldDisconnect={showNav} />
            </div>
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

                  <span className="text-[15px] font-bold tracking-wider" aria-label={language === "ja" ? "タップして話す" : "Tap to Speak"}>{language === "en" ? "Tap to Speak" : "タップして話す"}

                    {isConnecting ? (language === "en" ? " Connecting..." : " 接続中...") : ""}
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
                  <span aria-label={language === "ja" ? "申請を進める" : "Proceed"}>{language === "ja" ? "申請を進める →" : "Proceed →"}</span>

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
        <Link href="/files" className="flex flex-col items-center gap-1 text-[var(--brand-primary)] opacity-60 hover:opacity-100 transition-opacity">
          <Folder size={24} />
          <span className="text-[10px] font-bold tracking-wider" aria-label={language === "ja" ? "ファイル" : "Files"}>{language === "ja" ? "ファイル" : "Files"}</span>
        </Link>

        <button
          onClick={openScanner}
          className="flex flex-col items-center gap-1 text-[var(--brand-primary)] opacity-60 hover:opacity-100 transition-opacity"
        >
          <Camera size={24} />
          <span className="text-[10px] font-bold tracking-wider" aria-label={language === "ja" ? "スキャン" : "Scan"}>{language === "ja" ? "スキャン" : "Scan"}</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-[var(--brand-primary)] opacity-60 hover:opacity-100 transition-opacity">
          <User size={24} />
          <span className="text-[10px] font-bold tracking-wider" aria-label={language === "ja" ? "プロフィール" : "Profile"}>{language === "ja" ? "プロフィール" : "Profile"}</span>
        </button>
      </nav>

      {/* Camera Scanner Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between pointer-events-auto"
          >
            <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <h2 className="text-white font-bold tracking-wider">書類スキャン</h2>
              <button onClick={closeScanner} className="text-white bg-white/20 px-4 py-2 rounded-full font-bold">
                閉じる (Close)
              </button>
            </div>

            <div className="relative w-full h-[80vh] flex bg-slate-900 mt-16 rounded-3xl overflow-hidden mx-4">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 border-4 border-yellow-400/50 rounded-3xl m-8 pointer-events-none" />
            </div>

            <div className="w-full h-[15vh] flex items-center justify-center pb-8 bg-black">
              <button
                onClick={captureAndScan}
                disabled={isProcessingImage}
                className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 active:scale-95 transition-transform flex items-center justify-center"
              >
                {isProcessingImage ? <Loader className="animate-spin text-black" size={32} /> : null}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
