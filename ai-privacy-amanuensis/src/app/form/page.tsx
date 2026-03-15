import Link from "next/link";
import { Mic, CheckCircle, ArrowRight, CornerDownLeft } from "lucide-react";

export default function FormView() {
  return (
    <div className="flex flex-col h-full w-full justify-between bg-black p-6">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-10 mt-6 text-yellow-500">
        <Link 
          href="/" 
          className="p-3 bg-yellow-400/10 rounded-full hover:bg-yellow-400/20 transition-colors"
          aria-label="Back to Hub"
        >
          <CornerDownLeft size={24} />
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-yellow-400 rounded-full bg-yellow-400/10" aria-label="Progress: Question 1 of 5">
          <span className="font-bold text-sm tracking-widest uppercase text-yellow-400">1 / 5</span>
        </div>
      </header>

      {/* Main Content Area - Question Card */}
      <main className="flex-1 flex flex-col items-center justify-center w-full" aria-live="polite">
        <h2 className="text-xl font-medium tracking-wide text-yellow-400/60 uppercase mb-4" aria-label="Current Question">
          Current Question
        </h2>
        <div className="w-full bg-yellow-400 text-black p-8 rounded-3xl shadow-[0_10px_30px_rgba(250,204,21,0.2)] transform transition-all duration-500" aria-label="Disability Grade">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Disability Grade?
          </h1>
          <p className="mt-6 text-lg font-medium opacity-80" aria-hidden="true">
            Please state your officially registered disability grade level (1-6).
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
              className="w-3 bg-yellow-400 rounded-full animate-pulse"
              style={{
                height: `${Math.max(20, Math.random() * 100)}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.5 + Math.random()}s`
              }}
            />
          ))}
        </div>

        <p className="text-yellow-400/80 uppercase tracking-widest text-sm font-bold mb-8 animate-pulse" aria-label="Listening">
          Listening...
        </p>
        
        <div className="w-full flex justify-between items-center px-4">
          <button className="h-16 w-16 bg-yellow-400/20 text-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors" aria-label="Pause Recording">
             <Mic size={32} />
          </button>
          
          <Link 
            href="/success"
            className="h-16 bg-yellow-400 text-black px-8 rounded-full flex items-center justify-center gap-3 font-bold text-lg hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all uppercase tracking-wide"
            aria-label="Skip / Proceed to Success Step"
          >
            <span>Skip</span>
            <ArrowRight size={24} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
