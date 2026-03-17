import Link from "next/link";
import { Mic, ArrowRight, CornerDownLeft } from "lucide-react";

export default function FormView() {
  return (
    <div className="flex flex-col h-full w-full justify-between bg-[var(--brand-bg)] p-6 transition-colors duration-300">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-10 mt-6 text-[var(--brand-primary)]">
        <Link 
          href="/" 
          className="p-3 bg-[var(--brand-primary)]/10 rounded-full hover:bg-[var(--brand-primary)]/20 transition-colors"
          aria-label="ハブに戻る"
        >
          <CornerDownLeft size={24} />
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--brand-border)] rounded-full bg-[var(--brand-bg)]" aria-label="進捗: 1 / 5">
          <span className="font-bold text-sm tracking-widest uppercase text-[var(--brand-primary)]">1 / 5</span>
        </div>
      </header>

      {/* Main Content Area - Question Card */}
      <main className="flex-1 flex flex-col items-center justify-center w-full" aria-live="polite">
        <h2 className="text-xl font-medium tracking-wide text-[var(--brand-primary)]/60 uppercase mb-4" aria-label="現在の質問">
          <span aria-label="現在の質問">現在の質問</span>
        </h2>
        <div className="w-full bg-[var(--brand-primary)] text-[var(--brand-bg)] p-8 rounded-3xl shadow-[0_10px_30px_var(--brand-border)] transform transition-all duration-500" aria-label="障害等級">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            <span aria-label="障害等級について">障害等級は？</span>
          </h1>
          <p className="mt-6 text-lg font-medium opacity-80" aria-hidden="true">
            <span aria-label="公式に登録されている障害等級（1〜6級）を述べてください。">
              公式に登録されている障害等級（1〜6級）を述べてください。
            </span>
          </p>
        </div>
      </main>

      {/* Bottom Area - Waveform & Controls */}
      <footer className="w-full pb-8 pt-10 flex flex-col items-center">
        {/* Visual Waveform Simulator */}
        <div className="flex items-end gap-1 mb-10 h-16 justify-center w-full px-4 overflow-hidden" aria-hidden="true">
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
          <button className="h-16 w-16 bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] rounded-full flex items-center justify-center hover:bg-[var(--brand-primary)] hover:text-[var(--brand-bg)] transition-colors" aria-label="録音を一時停止">
             <Mic size={32} />
          </button>
          
          <Link 
            href="/success"
            className="h-16 bg-[var(--brand-primary)] text-[var(--brand-bg)] px-8 rounded-full flex items-center justify-center gap-3 font-bold text-lg hover:shadow-[0_0_20px_var(--brand-border)] transition-all uppercase tracking-wide"
            aria-label="スキップ / 完了画面へ"
          >
            <span><span aria-label="スキップ">スキップ</span></span>
            <ArrowRight size={24} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
