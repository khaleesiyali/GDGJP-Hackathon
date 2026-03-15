import Link from "next/link";
import { Folder, Camera, User, Mic } from "lucide-react";

export default function Hub() {
  return (
    <div className="flex flex-col h-full w-full justify-between items-center relative p-6">
      {/* Header */}
      <header className="w-full text-center mt-8">
        <h1 className="text-3xl font-extrabold tracking-tight uppercase" aria-label="AI Privacy Amanuensis">
          Amanuensis
        </h1>
        <p className="text-yellow-400/70 text-sm mt-2 font-medium" aria-label="Privacy mode enabled">
          End-to-End Encrypted
        </p>
      </header>

      {/* Main Center - Pulsating Orb */}
      <div className="flex-1 flex items-center justify-center flex-col w-full">
        <Link 
          href="/form" 
          className="relative group flex items-center justify-center"
          aria-label="Start Voice Listening"
        >
          {/* Outer ripples */}
          <div className="absolute w-48 h-48 bg-yellow-400/20 rounded-full animate-ping" />
          <div className="absolute w-64 h-64 bg-yellow-400/10 rounded-full animate-pulse" />
          
          {/* Core Orb */}
          <button 
            className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(250,204,21,0.6)] z-10 transition-transform active:scale-95 hover:scale-105"
            aria-label="Activate voice assistant"
          >
            <Mic size={48} strokeWidth={2.5} />
          </button>
        </Link>
        <p className="mt-12 text-lg font-bold tracking-widest uppercase animate-pulse" aria-hidden="true">
          Tap to Speak
        </p>
      </div>

      {/* Bottom Navigation */}
      <nav 
        className="w-full bg-black/90 backdrop-blur-md border border-yellow-400/30 rounded-2xl p-4 flex justify-around items-center mb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20"
        aria-label="Primary bottom navigation"
      >
        <button className="flex flex-col items-center gap-1 text-yellow-400/60 hover:text-yellow-400 transition-colors" aria-label="My Files">
          <Folder size={24} />
          <span className="text-[10px] uppercase font-bold tracking-wider">Files</span>
        </button>
        
        <button className="flex flex-col items-center gap-1 text-yellow-400/60 hover:text-yellow-400 transition-colors" aria-label="Scan Document">
          <Camera size={24} />
          <span className="text-[10px] uppercase font-bold tracking-wider">Scan</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-yellow-400/60 hover:text-yellow-400 transition-colors" aria-label="User Profile">
          <User size={24} />
          <span className="text-[10px] uppercase font-bold tracking-wider">Profile</span>
        </button>
      </nav>
    </div>
  );
}
