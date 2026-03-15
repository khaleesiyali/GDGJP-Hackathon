import Link from "next/link";
import { CheckCircle, Download, QrCode, ShieldCheck, Home } from "lucide-react";

export default function SuccessView() {
  return (
    <div className="flex flex-col h-full w-full justify-between bg-black p-6 items-center text-center">
      {/* Top Section - Success Message */}
      <div className="flex-1 flex flex-col items-center justify-center w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-black mb-8 shadow-[0_0_60px_rgba(250,204,21,0.4)]" aria-label="Success Checkmark">
          <CheckCircle size={64} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-yellow-400 tracking-tight mb-4 uppercase" aria-label="Form Completed">
          Form Completed
        </h1>
        <p className="text-yellow-500/80 text-lg font-medium max-w-[250px] mx-auto" aria-hidden="true">
          Your document is ready and encrypted.
        </p>
      </div>

      {/* Middle Section - Primary Action */}
      <div className="w-full flex flex-col items-center gap-6 z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        <button 
          className="w-full h-16 bg-yellow-400 text-black rounded-2xl flex items-center justify-center gap-3 font-extrabold text-xl uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-400/20"
          aria-label="Download PDF"
        >
          <Download size={28} />
          <span>Download PDF</span>
        </button>
        
        <Link 
          href="/"
          className="w-full h-14 bg-transparent border-2 border-yellow-400/30 text-yellow-400 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider hover:bg-yellow-400/10 transition-colors"
          aria-label="Return to Hub"
        >
          <Home size={20} />
          <span>Back to Hub</span>
        </Link>
      </div>

      {/* Bottom Section - Encrypted Signature */}
      <footer className="w-full mt-12 mb-8 flex flex-col items-center justify-end animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-yellow-400 shadow-yellow-400/20" aria-label="Sample Encrypted QR Code">
          <QrCode size={120} className="text-black" />
        </div>
        
        <div className="flex items-center gap-2 mt-6 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-full" aria-label="Security Status">
          <ShieldCheck size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">
            Voice Signature Encrypted
          </span>
        </div>
      </footer>
    </div>
  );
}
