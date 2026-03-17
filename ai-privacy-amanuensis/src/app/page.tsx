"use client";

import Link from "next/link";
import { Folder, Camera, User, Mic, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export default function Hub() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [orbState, setOrbState] = useState<"idle" | "listening" | "processing" | "success">("idle");

  useEffect(() => setMounted(true), []);

  const handleOrbClick = () => {
    if (orbState === "idle") setOrbState("listening");
    else if (orbState === "listening") setOrbState("processing");
    else if (orbState === "processing") setOrbState("success");
    else setOrbState("idle");
  };

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

  const statusText = {
    idle: "タップして話す",
    listening: "聞き取り中...",
    processing: "処理中...",
    success: "完了"
  };

  return (
    <div className="flex flex-col h-full w-full justify-between items-center relative p-6">
      {/* Header */}
      <header className="w-full relative mt-8 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold" aria-label="Amanuensis">
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
        <div className="relative group flex items-center justify-center mt-12 mb-8" aria-live="polite">

          {/* Background ripples */}
          {orbState === "idle" && (
            <div className="absolute w-48 h-48 bg-[var(--brand-primary)] opacity-20 rounded-full animate-ping" />
          )}

          {/* Processing Swirls */}
          {orbState === "processing" && (
            <motion.div
              className="absolute w-56 h-56 border-[4px] border-dashed border-[var(--brand-primary)] rounded-full opacity-40"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Listening Rings */}
          {orbState === "listening" && (
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
            onClick={handleOrbClick}
            variants={orbVariants}
            animate={orbState}
            className="w-32 h-32 rounded-full flex items-center justify-center text-[var(--brand-bg)] shadow-[0_0_40px_var(--brand-border)] z-10 cursor-pointer border-none outline-none focus:outline-none"
            aria-label="音声アシスタントを起動"
          >
            <Mic size={48} strokeWidth={2.5} />
          </motion.button>
        </div>

        <div className="h-12 mt-8 flex items-center justify-center">
          <p className="text-lg font-bold tracking-widest uppercase animate-pulse">
            <span aria-label={statusText[orbState]}>{statusText[orbState]}</span>
          </p>
        </div>

        <div className="h-16 mt-4">
          <AnimatePresence>
            {orbState === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Link href="/form" className="px-8 py-3 bg-[var(--brand-primary)] text-[var(--brand-bg)] rounded-full font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center justify-center shadow-lg shadow-[var(--brand-border)]">
                  <span aria-label="フォームに進む">フォームに進む</span>
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
