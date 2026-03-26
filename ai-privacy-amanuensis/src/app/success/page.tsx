'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Home, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAmanAI } from '@/components/AmanAIContext';

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useAmanAI();
  const formName = searchParams.get('formName') || (language === "ja" ? '申請フォーム' : 'Application Form');
  const submissionId = searchParams.get('submission_id') || searchParams.get('submissionId') || 'UNKNOWN_ID';
  const formDataJson = searchParams.get('formData');
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownloadPDF = async () => {
    if (!submissionId) return;
    try {
      setIsDownloading(true);
      setDownloadProgress(50);
      
      const a = document.createElement('a');
      a.href = `/api/download-pdf?id=${submissionId}`;
      a.download = `${formName}_${submissionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadProgress(100);
      
      // reset progress visually
      setTimeout(() => {
        setDownloadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(language === "ja" ? 'PDFのダウンロードに失敗しました' : 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const [qrSrc, setQrSrc] = useState<string>("");
  
  useEffect(() => {
    import('qrcode').then((QRCode) => {
      // The default export works a bit differently depending on module resolution, but usually it's QRCode.default or QRCode itself
      const qrc = typeof QRCode.toDataURL === 'function' ? QRCode : (QRCode as any).default;
      if (qrc && typeof qrc.toDataURL === 'function') {
        qrc.toDataURL(submissionId, { width: 150, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } })
          .then((url: string) => setQrSrc(url));
      }
    }).catch(e => console.error("QR Code generation failed:", e));
  }, [submissionId]);

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full bg-gradient-to-br from-slate-900 to-slate-800 items-center justify-start p-6 pt-12 pb-24">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="mb-8"
      >
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 text-yellow-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-yellow-400 mb-4">
          {language === "ja" ? "申請完了！" : "Application Complete!"}
        </h1>
        <p className="text-xl text-yellow-400/70 mb-2">
          {formName}
        </p>
        <p className="text-sm text-slate-400 mb-6 flex flex-col items-center gap-1">
          <span>{language === "ja" ? "受付ID: " : "Submission ID: "}<span className="font-mono text-yellow-400">{submissionId}</span></span>
        </p>
        
        <div className="flex justify-center mb-8">
          {qrSrc ? (
            <div className="bg-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="Submission QR Code" className="w-[120px] h-[120px] md:w-[150px] md:h-[150px]" />
            </div>
          ) : (
            <div className="w-[144px] h-[144px] bg-slate-800 animate-pulse rounded-2xl" />
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-yellow-400/60">
          <CheckCircle size={20} />
          <span>{language === "ja" ? "あなたのフォームが正常に登録されました" : "Your form has been successfully registered"}</span>
        </div>
      </motion.div>

      {/* Download Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-md mb-12"
      >
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading || !submissionId}
          className="w-full h-16 bg-yellow-400 text-slate-900 px-8 rounded-2xl flex items-center justify-center gap-3 font-bold hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        >
          <Download size={24} />
          <span className="text-lg">
            {isDownloading ? (language === "ja" ? "ダウンロード中..." : "Downloading...") : (language === "ja" ? "PDFをダウンロード" : "Download PDF")}
          </span>
        </button>

        {isDownloading && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${downloadProgress}%` }}
            className="mt-3 h-2 bg-yellow-400 rounded-full"
          />
        )}
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-full max-w-md bg-slate-800/50 border border-yellow-400/20 rounded-2xl p-6 mb-8 text-center"
      >
        <h3 className="text-yellow-400 font-bold mb-3">{language === "ja" ? "次のステップ" : "Next Steps"}</h3>
        <ul className="text-yellow-400/70 text-sm space-y-2">
          <li>{language === "ja" ? "✓ PDFファイルをダウンロードしています" : "✓ PDF file is being generated"}</li>
          <li>{language === "ja" ? "✓ 受付IDを大切に保管してください" : "✓ Please keep your Submission ID safe"}</li>
          <li>{language === "ja" ? "✓ ご不明な点はサポートまで" : "✓ Contact support if you have questions"}</li>
        </ul>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="w-full max-w-md flex flex-col gap-4"
      >
        <button
          onClick={() => router.push('/')}
          className="h-14 bg-slate-800 text-yellow-400 px-8 rounded-full flex items-center justify-center gap-2 font-bold border-2 border-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-all whitespace-nowrap"
        >
          <Home size={20} />
          <span>{language === "ja" ? "ホームに戻る" : "Back to Home"}</span>
        </button>
        <button
          onClick={() => router.push('/form')}
          className="h-14 bg-yellow-400/20 text-yellow-400 px-8 rounded-full flex items-center justify-center gap-2 font-bold border-2 border-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-all whitespace-nowrap"
        >
          <span>{language === "ja" ? "別のフォームを入力" : "Fill another form"}</span>
        </button>
      </motion.div>

      {/* Confetti-like background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              y: -100,
              x: Math.random() * window.innerWidth
            }}
            animate={{ 
              opacity: [0, 1, 0],
              y: window.innerHeight + 100
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: i * 0.1,
              repeat: Infinity,
            }}
            className="w-2 h-2 bg-yellow-400 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
