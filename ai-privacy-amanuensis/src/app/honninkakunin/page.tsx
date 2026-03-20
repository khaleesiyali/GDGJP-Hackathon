'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Mic, CheckCircle, Camera, Volume2 } from 'lucide-react';

export default function Honninkakunin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formName = searchParams.get('formName') || '申請フォーム';
  const submissionId = searchParams.get('submissionId') || `${Date.now()}`;
  const formDataJson = searchParams.get('formData');

  const [stage, setStage] = useState<'face' | 'voice' | 'complete'>('face');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize face detection
  useEffect(() => {
    if (stage !== 'face' || !isCapturing) return;

    const startCamera = async () => {
      try {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('Camera API not available on this device');
          // Auto-proceed anyway for demo
          setTimeout(() => {
            setFaceDetected(true);
            setTimeout(() => {
              setStage('voice');
              setIsCapturing(false);
              setFaceDetected(false);
            }, 2000);
          }, 2500);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Camera error:', error);
        // Auto-proceed anyway for demo (camera permission denied)
        setTimeout(() => {
          setFaceDetected(true);
          setTimeout(() => {
            setStage('voice');
            setIsCapturing(false);
            setFaceDetected(false);
          }, 2000);
        }, 2500);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        try {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        } catch (error) {
          console.error('Error stopping camera:', error);
        }
      }
    };
  }, [stage, isCapturing]);

  // Simulate face detection after delay
  const handleCaptureFace = async () => {
    setIsCapturing(true);
    
    // Simulate face detection (in real implementation, would use face detection library)
    setTimeout(() => {
      setFaceDetected(true);
      
      // Capture canvas frame
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }

      // Auto-advance after successful face detection
      setTimeout(() => {
        setStage('voice');
        setIsCapturing(false);
        setFaceDetected(false);
      }, 2000);
    }, 2500);
  };

  // Voice signature recording
  const handleStartVoiceRecording = async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Microphone API not available on this device');
        // Auto-proceed anyway for demo
        setIsRecording(true);
        setTimeout(() => {
          setIsRecording(false);
          setVoiceRecorded(true);
          setTimeout(() => {
            setStage('complete');
          }, 1500);
        }, 5000);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        setVoiceRecorded(true);

        // Auto-advance after voice recording
        setTimeout(() => {
          setStage('complete');
        }, 1500);
      };

      mediaRecorder.start();

      // Auto-stop recording after 5 seconds
      setTimeout(() => {
        try {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Error stopping recording:', error);
        }
      }, 5000);
    } catch (error) {
      console.error('Microphone error:', error);
      // Auto-proceed anyway for demo (microphone permission denied)
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setVoiceRecorded(true);
        setTimeout(() => {
          setStage('complete');
        }, 1500);
      }, 5000);
    }
  };

  // Proceed to success after complete
  const handleProceedToSuccess = () => {
    const queryParams = new URLSearchParams({
      formName: formName,
      submissionId: submissionId,
      formData: formDataJson || '{}'
    });
    router.push(`/success?${queryParams.toString()}`);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-900 to-slate-800 items-center justify-center p-6">
      {/* Stage: Face ID Verification */}
      {stage === 'face' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">本人確認</h1>
          <p className="text-yellow-400/70 mb-8">
            カメラでお顔を確認させていただきます
          </p>

          {isCapturing ? (
            <div className="space-y-6">
              {/* Camera Feed Container */}
              <div className="relative w-full aspect-square bg-slate-700 rounded-3xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Face Detection Animation */}
                {!faceDetected && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 border-4 border-yellow-400 rounded-full flex items-center justify-center"
                    style={{
                      width: '280px',
                      height: '280px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-full h-full border-4 border-transparent border-t-yellow-400 border-r-yellow-400 rounded-full"
                    />
                  </motion.div>
                )}

                {/* Face Detected Success */}
                {faceDetected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-green-500/20 border-4 border-green-400 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle size={80} className="text-green-400" />
                  </motion.div>
                )}

                {/* Canvas for storing frame */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                  width={400}
                  height={400}
                />
              </div>

              <p className="text-yellow-400/60 text-sm">
                {faceDetected ? 'お顔が確認できました' : 'カメラをご覧ください'}
              </p>
            </div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleCaptureFace}
              className="w-full h-16 bg-yellow-400 text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-bold hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all transform hover:scale-105"
            >
              <Camera size={24} />
              <span>カメラで顔認証</span>
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Stage: Voice Signature */}
      {stage === 'voice' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">音声署名</h1>
          <p className="text-yellow-400/70 mb-8">
            本人確認のため、音声をご録音ください
          </p>

          <div className="space-y-8">
            {/* Voice Recording Visualization */}
            <div className="flex items-center justify-center gap-1 h-24">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: '10px' }}
                  animate={
                    isRecording
                      ? { height: ['10px', '60px', '10px'] }
                      : voiceRecorded
                        ? { height: '10px' }
                        : { height: '20px' }
                  }
                  transition={{
                    duration: 0.6,
                    delay: i * 0.05,
                    repeat: isRecording ? Infinity : 0
                  }}
                  className="w-3 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-full"
                />
              ))}
            </div>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-yellow-400/70 text-sm">
                {isRecording
                  ? '音声を録音中... (5秒で自動停止)'
                  : voiceRecorded
                    ? '音声署名が完了しました'
                    : 'マイクボタンをクリックして開始'}
              </p>
            </div>

            {/* Recording Button */}
            {!voiceRecorded ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleStartVoiceRecording}
                disabled={isRecording}
                className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all transform ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-yellow-400 hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] text-slate-900 hover:scale-105'
                }`}
              >
                <Mic size={24} />
                <span>{isRecording ? '録音中...' : '音声の録音開始'}</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 w-full h-16 bg-green-500/20 border-2 border-green-400 rounded-2xl text-green-400 font-bold"
              >
                <CheckCircle size={24} />
                <span>完了</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Stage: Verification Complete */}
      {stage === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <div className="w-24 h-24 mx-auto">
              <svg
                className="w-24 h-24 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </motion.div>

          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">本人確認完了</h1>
            <p className="text-yellow-400/70">
              本人確認が完了しました。<br />
              続けて申請を完了いたします。
            </p>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleProceedToSuccess}
            className="w-full h-16 bg-yellow-400 text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-bold hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all transform hover:scale-105"
          >
            <CheckCircle size={24} />
            <span>申請完了へ進む</span>
          </motion.button>
        </motion.div>
      )}

      {/* Status Indicator */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2 text-yellow-400/60 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>暗号化により保護されています</span>
      </div>
    </div>
  );
}
