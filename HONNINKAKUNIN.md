# Enhanced Form Flow & Honninkakunin (本人確認)

## What's New ✨

### 1. **Automatic Question Progression**

- ✅ Questions now automatically advance to the next question after answer submission
- ✅ No clicking needed - answer → automatic transition
- ✅ Smooth delays between questions (1.2 seconds) for user to see confirmation
- ✅ Skip button also auto-advances (0.8 seconds)
- ✅ First question appears automatically after 2 seconds of form loading

### 2. **Honninkakunin (本人確認) - Identity Verification Page**

- **Location**: `/honninkakunin`
- **Purpose**: Security verification between form completion and final submission
- **Two-stage verification**:

#### Stage 1: Face ID Verification

- Camera access request
- Real-time camera feed display
- Simulated face detection with animated circle
- Automatic camera capture when face detected
- Auto-advances to voice stage after 2 seconds

**Features**:

```
┌─────────────────────────────────────────┐
│        本人確認                           │
│   カメラでお顔を確認させていただきます   │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  [Live Camera Feed]              │  │
│  │  [Rotating Detection Circle]     │  │
│  │  [Face Detected ✓]               │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [📷 カメラで顔認証]                    │
└─────────────────────────────────────────┘
```

#### Stage 2: Voice Signature

- Audio recording (5 seconds auto-stop)
- Real-time waveform visualization
- Microphone signal bars animate during recording
- Auto-advances to completion after recording finishes

**Features**:

```
┌─────────────────────────────────────────┐
│        音声署名                          │
│   本人確認のため、音声をご録音ください   │
│                                         │
│  [| || ||| || | | | |] ← Waveform       │
│                                         │
│   音声を録音中... (5秒で自動停止)       │
│                                         │
│  [🎤 音声の録音開始]                    │
│  OR [✓ 完了]                            │
└─────────────────────────────────────────┘
```

#### Stage 3: Verification Complete

- Success checkmark animation
- Confirmation message
- Button to proceed to success page

**Features**:

```
┌─────────────────────────────────────────┐
│            ✓                            │
│                                         │
│        本人確認完了                     │
│   本人確認が完了しました。              │
│   続けて申請を完了いたします。          │
│                                         │
│  [✓ 申請完了へ進む]                     │
└─────────────────────────────────────────┘
```

## Complete Flow Now

```
┌──────────────────────────────────────────────┐
│           /form (FormPage)                   │
│  ┌────────────────────────────────────────┐  │
│  │ ✅ Load form schema                    │  │
│  │ ✅ Speak: "申請書があります..."        │  │
│  │ ✅ Display first question on card      │  │
│  │ ✅ Read question aloud                 │  │
│  │ ✅ User answers (voice/text)           │  │
│  │ ✅ System confirms: "承知しました"     │  │
│  │ ✅ AUTO ADVANCE to next question       │  │
│  │ ✅ Loop: Questions 1→2→3→4            │  │
│  └────────────────────────────────────────┘  │
│                   ↓                          │
│        ALL QUESTIONS ANSWERED               │
│        (Automatically detected)              │
│                   ↓                          │
│ ┌──────────────────────────────────────────┐ │
│ │  /honninkakunin (Identity Verification)  │ │
│ │  ┌──────────────────────────────────────┐│ │
│ │  │ 1. Face ID Camera Verification       ││ │
│ │  │    └─ Auto-detect face               ││ │
│ │  │    └─ Auto-advance when complete    ││ │
│ │  │                                      ││ │
│ │  │ 2. Voice Signature Recording         ││ │
│ │  │    └─ 5-second audio capture        ││ │
│ │  │    └─ Auto-stop and advance         ││ │
│ │  │                                      ││ │
│ │  │ 3. Confirmation Display              ││ │
│ │  │    └─ Success message                ││ │
│ │  │    └─ Button to continue             ││ │
│ │  └──────────────────────────────────────┘│ │
│ └──────────────────────────────────────────┘ │
│                   ↓                          │
│ ┌──────────────────────────────────────────┐ │
│ │   /success (Final Submission Page)       │ │
│ │  ┌──────────────────────────────────────┐│ │
│ │  │  ✓ 申請完了!                         ││ │
│ │  │                                      ││ │
│ │  │  Form Name                           ││ │
│ │  │  Submission ID: {timestamp}         ││ │
│ │  │                                      ││ │
│ │  │  [📥 PDFをダウンロード]               ││ │
│ │  │  [🏠 ホームに戻る]                    ││ │
│ │  └──────────────────────────────────────┘│ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Key Improvements

### FormPage.tsx Changes

```typescript
// OLD: Clicked submit → Manual UI changes
handleSendMessage() {
  // Process answer
  // Manually call askNextQuestion() after delay
}

// NEW: Clicked submit → Auto progression with voice
handleSendMessage() {
  // Process answer
  speakText("かしこまりました。");  // Acknowledge
  // Auto-call askNextQuestion() with smooth timing
  // Next question appears automatically
}

// Same for skip button
handleSkip() {
  speakText("この質問をスキップします。");
  // Auto-advance (slightly faster: 0.8s vs 1.2s)
}
```

### Honninkakunin Flow

```typescript
const [stage, setStage] = useState<'face' | 'voice' | 'complete'>('face');

// Face ID Stage
handleCaptureFace() {
  startCamera();
  // Simulate face detection
  setTimeout(() => {
    setFaceDetected(true);
    captureFrameToCanvas();
    // Auto-advance
    setTimeout(() => setStage('voice'), 2000);
  }, 2500);
}

// Voice Signature Stage
handleStartVoiceRecording() {
  startAudio();
  mediaRecorder.start();
  // Auto-stop after 5 seconds
  setTimeout(() => mediaRecorder.stop(), 5000);
  // Auto-advance when recording stops
}

// Complete Stage
// Button click to proceed to /success
```

## URL Parameters Flow

**Form Completion**:

```
/form → [user fills 4 questions] → redirect to:
/honninkakunin?formName=申請書&submissionId=1234567890&formData={...}
```

**After Identity Verification**:

```
/honninkakunin → [face ID + voice] → proceed to:
/success?formName=申請書&submissionId=1234567890&formData={...}
```

## Technical Details

### Browser APIs Used

- **Camera Access**: `navigator.mediaDevices.getUserMedia({ video })`
- **Audio Recording**: `navigator.mediaDevices.getUserMedia({ audio })`
- **Canvas**: `canvas.drawImage()` for capturing camera frame
- **MediaRecorder**: `MediaRecorder` API for voice recording

### States & Transitions

```typescript
// FormPage
currentQuestion → formData[key] ← user input
                        ↓
            askNextQuestion() [auto-called]
                        ↓
  remainingFields.length === 0?
        YES ↓                    NO ↓
   redirect to           Display next
   honninkakunin         question

// Honninkakunin
'face' → [camera + detection]
  ↓
'voice' → [recording + waveform]
  ↓
'complete' → [success message]
  ↓
/success page
```

## Timing Details

```
FormPage Question Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0s    - Form loads
0.5s  - Form schema fetched
1s    - Form name spoken
2s    - First question displayed & spoken
[User answers question]
0.1s  - Answer captured
0.2s  - System response added to history
1.2s  - Next question displayed & spoken
[Repeat 2-4 more times]
[Last question answered]
1.2s  - Acknowledgement spoken
2.2s  - Redirect to /honninkakunin

Honninkakunin Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0s    - Face ID page displays
[User clicks camera button]
0.5s  - Camera starts
2.5s  - Face detection complete
3s    - Success checkmark appears
5s    - Auto-advance to voice stage
[Voice stage displays]
[User clicks recording button]
0.5s  - Recording starts
5.5s  - Auto-stop recording
6s    - Completion message appears
[User clicks proceed button]
0s    - Navigate to /success
```

## Testing Checklist

### ✅ Form Questions Auto-Advance

- [ ] Navigate to /form
- [ ] Watch first question appear automatically (2s)
- [ ] Type answer and click [送信]
- [ ] NO CLICKS - question automatically changes to #2
- [ ] Verify message shows "かしこまりました"
- [ ] Progress updates automatically (1/4 → 2/4)
- [ ] Repeat for all 4 questions

### ✅ Skip Button Auto-Advances

- [ ] Click [スキップ] without typing
- [ ] Question instantly changes (faster than send)
- [ ] "この質問をスキップします" message appears
- [ ] Progress still increments

### ✅ Honninkakunin Face ID

- [ ] After last question, redirects to /honninkakunin
- [ ] Face ID page displays with "本人確認"
- [ ] Click [📷 カメラで顔認証]
- [ ] Camera feed appears
- [ ] Rotating circle animation shows
- [ ] (Demo) After ~2.5s, checkmark appears
- [ ] Automatically advances to voice stage

### ✅ Honninkakunin Voice

- [ ] Voice stage displays with "音声署名"
- [ ] Click [🎤 音声の録音開始]
- [ ] Waveform bars animate
- [ ] Text shows "音声を録音中... (5秒で自動停止)"
- [ ] Recording auto-stops after 5s
- [ ] "完了" message appears
- [ ] Automatically advances to completion stage

### ✅ Honninkakunin Complete

- [ ] Success checkmark appears
- [ ] Message: "本人確認完了"
- [ ] Button [✓ 申請完了へ進む]
- [ ] Click button
- [ ] Redirects to /success page
- [ ] Form data carried through in URL

### ✅ Success & PDF

- [ ] Success page displays (same as before)
- [ ] Can download PDF with all answers
- [ ] Can return to home or fill new form

## Browser Compatibility

| Feature         | Chrome | Safari | Edge | Firefox |
| --------------- | ------ | ------ | ---- | ------- |
| Camera API      | ✅     | ✅     | ✅   | ✅      |
| Audio Recording | ✅     | ✅     | ✅   | ✅      |
| MediaRecorder   | ✅     | ✅     | ✅   | ✅      |
| Canvas Drawing  | ✅     | ✅     | ✅   | ✅      |
| Text-to-Speech  | ✅     | ✅     | ✅   | ✅      |

**Note**: HTTPS required for camera/audio access (localhost is exception)

## Files Modified

| File                             | Change                            |
| -------------------------------- | --------------------------------- |
| `src/components/FormPage.tsx`    | Auto-progression, improved timing |
| `src/app/honninkakunin/page.tsx` | NEW - Identity verification page  |

## Optional Enhancements (Future)

- [ ] Use actual face detection library (face-api.js, MediaPipe)
- [ ] Real voice biometric analysis
- [ ] Liveness detection for security
- [ ] Store biometric data securely
- [ ] Multi-language support for honninkakunin
- [ ] Accessibility improvements (screen reader support)

---

**Status**: ✅ Ready to test! Both auto-progression and honninkakunin fully implemented.
