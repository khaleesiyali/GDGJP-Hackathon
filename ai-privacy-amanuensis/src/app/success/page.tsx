import Link from "next/link";
import { CheckCircle, Download, QrCode, ShieldCheck, Home } from "lucide-react";

export default function SuccessView() {
  return (
    <div className="flex flex-col h-full w-full justify-between bg-[var(--brand-bg)] p-6 items-center text-center transition-colors duration-300">
      {/* Top Section - Success Message */}
      <div className="flex-1 flex flex-col items-center justify-center w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-32 h-32 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-[var(--brand-bg)] mb-8 shadow-[0_0_60px_var(--brand-border)]">
          <CheckCircle size={64} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-[var(--brand-primary)] tracking-tight mb-4 uppercase">
          <span aria-label="手続き完了">手続き完了</span>
        </h1>
        <p className="text-[var(--brand-primary)]/80 text-lg font-medium max-w-[250px] mx-auto">
          <span aria-label="書類の準備と暗号化が完了しました。">
            書類の準備と暗号化が完了しました。
          </span>
        </p>
      </div>

      {/* Middle Section - Primary Action */}
      <div className="w-full flex flex-col items-center gap-6 z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        <button className="w-full h-16 bg-[var(--brand-primary)] text-[var(--brand-bg)] rounded-2xl flex items-center justify-center gap-3 font-extrabold text-xl uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[var(--brand-primary)]/20" aria-label="PDFをダウンロード">
          <Download size={28} />
          <span>PDFをダウンロード</span>
        </button>
        
        <Link href="/" className="w-full h-14 bg-transparent border-2 border-[var(--brand-border)] text-[var(--brand-primary)] rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider hover:bg-[var(--brand-primary)]/10 transition-colors" aria-label="ハブに戻る">
          <Home size={20} />
          <span>ハブに戻る</span>
        </Link>
      </div>

      {/* Bottom Section - Encrypted Signature */}
      <footer className="w-full mt-12 mb-8 flex flex-col items-center justify-end animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-[var(--brand-primary)] shadow-[var(--brand-border)]">
          <QrCode size={120} className="text-black" aria-label="暗号化されたQRコード" />
        </div>
        
        <div className="flex items-center gap-2 mt-6 text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-4 py-2 rounded-full" aria-label="音声署名 暗号化済み">
          <ShieldCheck size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">
            音声署名 暗号化済み
          </span>
        </div>
      </footer>
    </div>
  );
}
