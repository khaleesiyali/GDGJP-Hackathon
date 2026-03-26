"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, Download, QrCode, X, Loader } from "lucide-react";
import { useAmanAI } from "@/components/AmanAIContext";

type Submission = {
  filename: string;
  form_name: string;
  submission_id: string;
  timestamp: string;
  data: any;
};

export default function MyFiles() {
  const router = useRouter();
  const { language } = useAmanAI();
  const [files, setFiles] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<Submission | null>(null);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch("/api/myfiles");
        const json = await res.json();
        setFiles(json.submissions || []);
      } catch (e) {
        console.error("Failed to fetch files", e);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  const handleCardClick = (file: Submission) => {
    setSelectedFile(file);
    // Generate QR Code dynamically
    import("qrcode")
      .then((QRCode) => {
        const qrc = typeof QRCode.toDataURL === "function" ? QRCode : (QRCode as any).default;
        if (qrc && typeof qrc.toDataURL === "function") {
          qrc.toDataURL(file.submission_id, { width: 300, margin: 1, color: { dark: "#000000", light: "#FFFFFF" } })
            .then((url: string) => setQrSrc(url));
        }
      })
      .catch((e) => console.error(e));
  };

  const closeOverlay = () => {
    setSelectedFile(null);
    setQrSrc("");
  };

  const downloadPDF = async (file: Submission) => {
    if (file.data?.isDemo) {
      const a = document.createElement("a");
      a.href = "/demo.pdf";
      a.download = `Final_Filled_Application.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Hit the Next.js streaming API instead of generating it!
    const a = document.createElement("a");
    a.href = `/api/download-pdf?id=${file.submission_id}`;
    a.download = `Final_Filled_${file.submission_id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full overflow-y-auto w-full bg-[var(--brand-bg)] text-[var(--brand-primary)] p-4 flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 mt-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-6 py-4 bg-[var(--brand-border)] hover:bg-[var(--brand-primary)] hover:text-black rounded-full transition-colors"
          aria-label="ホームに戻る (Go Back Home)"
        >
          <Home size={32} />
          <span className="text-xl font-bold tracking-widest">{language === "ja" ? "戻る" : "Back"}</span>
        </button>
        <h1 className="text-3xl font-extrabold tracking-widest uppercase">{language === "ja" ? "マイファイル" : "My Files"}</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader size={64} className="animate-spin mb-4" />
          <p className="text-2xl font-bold animate-pulse">{language === "ja" ? "読み込み中..." : "Loading..."}</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <FileText size={80} className="opacity-30 mb-6" />
          <p className="text-2xl font-bold opacity-70">{language === "ja" ? "申請履歴がありません" : "No file history"}</p>
        </div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col gap-6 pb-20">
          {files.map((file) => (
            <motion.button
              key={file.filename}
              onClick={() => handleCardClick(file)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-[var(--brand-bg)] border-4 border-yellow-400/30 hover:border-yellow-400 p-8 rounded-3xl text-left transition-colors flex flex-col gap-3 shadow-[0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_40px_rgba(250,204,21,0.3)] active:scale-95"
              aria-label={`${file.form_name}。受付ID: ${file.submission_id}。タップして詳細を開く`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-extrabold mb-2 leading-tight break-words">
                    {file.form_name}
                  </h2>
                  <p className="text-xl opacity-80 font-mono tracking-wider">
                    ID: {file.submission_id}
                  </p>
                </div>
                <FileText size={48} className="opacity-80 shrink-0 mt-1" />
              </div>
              <div className="mt-4 pt-4 border-t-2 border-yellow-400/20">
                <p className="text-lg opacity-60 font-bold">
                  {new Date(file.timestamp).toLocaleString(language === "ja" ? "ja-JP" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-start pointer-events-auto p-4 md:p-8 overflow-y-auto"
          >
            <div className="w-full max-w-2xl flex items-center justify-end mb-8 mt-4">
              <button
                onClick={closeOverlay}
                className="flex items-center gap-2 px-8 py-4 bg-yellow-400 text-black rounded-full font-extrabold text-2xl hover:scale-105 active:scale-95 transition-transform"
                aria-label="閉じる (Close File Details)"
              >
                <X size={32} />
                <span>{language === "ja" ? "閉じる" : "Close"}</span>
              </button>
            </div>

            <div className="w-full max-w-2xl bg-slate-900 border-4 border-yellow-400 rounded-[2rem] p-8 flex flex-col items-center text-center shadow-[0_0_60px_rgba(250,204,21,0.3)]">
              <h2 className="text-2xl font-extrabold mb-4 leading-tight">{selectedFile.form_name}</h2>
              <p className="text-2xl font-mono text-yellow-400/80 tracking-widest mb-12">
                ID: {selectedFile.submission_id}
              </p>

              <div className="w-full flex flex-col gap-6">
                {/* Giant PDF Download Button */}
                <button
                  onClick={() => downloadPDF(selectedFile)}
                  disabled={isDownloading}
                  className="w-full bg-yellow-400 text-black p-8 rounded-3xl flex items-center justify-center gap-6 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  aria-label="PDFを再ダウンロード (Redownload PDF)"
                >
                  <Download size={48} />
                  <span className="text-2xl font-extrabold">
                    {isDownloading ? (language === "ja" ? "処理中..." : "Processing...") : (language === "ja" ? "PDFダウンロード" : "Download PDF")}
                  </span>
                </button>

                {/* QR Code Section */}
                <div className="w-full bg-black/50 border-2 border-yellow-400/30 p-8 rounded-3xl flex flex-col items-center justify-center gap-6 mt-6">
                  <div className="flex items-center gap-4 text-yellow-400">
                    <QrCode size={40} />
                    <span className="text-2xl font-extrabold tracking-widest">{language === "ja" ? "受付QRコード" : "Counter QR Code"}</span>
                  </div>
                  {qrSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrSrc} alt="Submission QR Code" className="w-[200px] h-[200px] bg-white p-4 rounded-3xl mx-auto" aria-hidden="true" />
                  ) : (
                    <div className="w-[200px] h-[200px] bg-slate-800 animate-pulse rounded-3xl" />
                  )}
                  <p className="text-lg opacity-70 mt-2 font-bold">
                    {language === "ja" ? "窓口でこの画面をご提示ください" : "Please present this screen at the counter"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
