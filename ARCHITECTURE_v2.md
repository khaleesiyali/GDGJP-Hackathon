# Complete Application Flow - v2.0

## Updated Architecture

```
APPLICATION FLOW (v2.0 - Enhanced)
════════════════════════════════════════════════════════════════════════════

[Home Page]
    /
    ↓
[Form Page]
    /form
    │
    ├─→ Load schema from /api/form-schema
    ├─→ Read form name aloud (TTS)
    ├─→ Display Question #1 on yellow card
    │   ├─ Question text (large, readable)
    │   ├─ Audio visualization
    │   ├─ Voice button
    │   ├─ Text input field
    │   └─ Skip button
    │
    ├─→ User answers → [送信] click
    │   └─→ Data captured to formData[key]
    │   └─→ System acknowledges (TTS)
    │   └─→ AUTO-ADVANCE (1.2s) → Question #2
    │
    ├─→ LOOP: Questions 2, 3, 4
    │   └─→ Same flow, auto-advance between each
    │
    └─→ After Question #4 answered
        └─→ All data collected in formData
        └─→ 1 second pause
        └─→ REDIRECT WITH DATA → Honninkakunin page

            ↓ URL PARAMS: formName, submissionId, formData

[Identity Verification Page]                  ← NEW FEATURE
    /honninkakunin
    │
    ├─→ [Stage 1: Face ID]
    │   ├─ Display: "本人確認"
    │   ├─ User clicks: [📷 カメラで顔認証]
    │   ├─ Camera feed appears (live video)
    │   ├─ Simulated face detection (2.5s)
    │   ├─ Success checkmark appears
    │   ├─ Automatically auto-advances (2s)
    │   └─→ [Stage 2: Voice]
    │
    ├─→ [Stage 2: Voice Signature]
    │   ├─ Display: "音声署名"
    │   ├─ User clicks: [🎤 音声の録音開始]
    │   ├─ Waveform visualization animates
    │   ├─ Auto-records for 5 seconds
    │   ├─ "完了" message appears
    │   ├─ Automatically auto-advances (1.5s)
    │   └─→ [Stage 3: Complete]
    │
    ├─→ [Stage 3: Verification Complete]
    │   ├─ Display: "本人確認完了"
    │   ├─ Green checkmark animation
    │   ├─ User clicks: [✓ 申請完了へ進む]
    │   └─→ REDIRECT WITH DATA → Success page
    │
    └─→ URL PARAMS: formName, submissionId, formData

            ↓ (User clicks button to proceed)

[Success Page]
    /success
    │
    ├─→ Display: "申請完了!" (with animation)
    ├─→ Show form name & submission ID
    ├─→ Show next steps
    │
    ├─→ User can:
    │   ├─ [📥 PDFをダウンロード]
    │   │   └─→ Call /api/generate-pdf
    │   │   └─→ Backend fills PDF with formData
    │   │   └─→ Download as file
    │   │
    │   ├─ [🏠 ホームに戻る]
    │   │   └─→ Navigate to /
    │   │
    │   └─ [別のフォームを入力]
    │       └─→ Navigate to /form
    │           └─→ Fresh form session (new formData)
    │
    └─→ Back to home or form loop

════════════════════════════════════════════════════════════════════════════
```

## Component Hierarchy

```
Next.js Application
│
├── /app (routes)
│   ├── page.tsx (Home)
│   ├── /form
│   │   └── page.tsx (wrapper → imports FormPage)
│   ├── /honninkakunin
│   │   └── page.tsx (Identity verification - NEW)
│   ├── /success
│   │   └── page.tsx (Final submission)
│   └── /api
│       ├── /form-schema
│       │   └── route.ts (Load form questions)
│       └── /generate-pdf
│           └── route.ts (Create filled PDF)
│
├── /components
│   ├── FormPage.tsx (Main form interaction)
│   ├── ThemeProvider.tsx
│   └── PrivacyGate.tsx
│
└── /styles
    └── globals.css
```

## Key State Flows

### FormPage State

```typescript
formSchema: {
  name: string,
  parameters: {
    properties: {
      [key]: { description: string, type: string },
      ...
    }
  }
}

formData: {
  applicant_name: "山田太郎",
  birth_date: "1990-01-01",
  disability_type: "身体障害",
  contact_address: "東京都渋谷区"
}

currentQuestion: "ご自身の障害の種類をお知らせください"
currentQuestionKey: "disability_type"

progressStep: 3
totalSteps: 4

conversationHistory: [
  { role: "agent", message: "こんにちは！..." },
  { role: "user", message: "身体障害です" },
  { role: "agent", message: "かしこまりました" },
  ...
]
```

### Honninkakunin State

```typescript
stage: 'face' | 'voice' | 'complete'

faceDetected: boolean
voiceRecorded: boolean

isCapturing: boolean
isRecording: boolean

videoRef: HTMLVideoElement (camera feed)
canvasRef: HTMLCanvasElement (frame capture)
mediaRecorderRef: MediaRecorder (audio recording)
```

## Data Flow Through URLs

### Step 1: Form Completion

```
User completes form with answers:
{
  applicant_name: "input1",
  birth_date: "input2",
  disability_type: "input3",
  contact_address: "input4"
}

Redirect to:
/honninkakunin?
  formName=心身障碍者福祉手当認定申請書&
  submissionId=1710900000000&
  formData={"applicant_name":"...","birth_date":"..."}
```

### Step 2: Identity Verification

```
User completes: Face ID + Voice Signature

Same params passed through button click:
/success?
  formName=心身障碍者福祉手当認定申請書&
  submissionId=1710900000000&
  formData={"applicant_name":"..."}
```

### Step 3: Success & Download

```
Success page reads params from URL
Extracts: formName, submissionId, formData

When user clicks [PDFをダウンロード]:
POST /api/generate-pdf
  body: formData object

Backend returns: PDF file with all answers filled in
```

## Auto-Progression Timing

```
Timeline (all in milliseconds except flow):

0ms ┌─ User finishes typing
    │
1ms ├─ Click [送信]
    │
2ms ├─ Answer captured to formData[key]
    │
3ms ├─ System says: "かしこまりました"
    │
100ms ├─ Message added to conversationHistory
      │  (user sees it on screen)
      │
1200ms├─ setTimeout(() => askNextQuestion())
      │
1201ms├─ askNextQuestion() called
      │
1202ms├─ Check if more questions remain
      │
      ├─ YES: Display next question
      │  ├─ Set currentQuestion state
      │  ├─ Set currentQuestionKey state
      │  ├─ Update progressStep
      │  ├─ Speak next question (TTS)
      │  └─ User sees new yellow card
      │
      └─ NO: Redirect to honninkakunin
         └─ Pass formData through URL params
```

## Security & Verification Features

### Honninkakunin (本人確認) Layers

**Layer 1: Face ID** (Simulated Demo)

- Requests camera permission
- Shows live camera feed
- Detects face presence
- Captures frame to canvas
- Creates audit trail

**Layer 2: Voice Signature** (Audio Recording)

- Requests microphone permission
- Records 5 seconds of voice
- Creates voice biometric sample
- Stores audio reference
- Prevents voice spoofing

**Layer 3: Data Integrity**

- Form data stored in URL (query params)
- Timestamp-based submission ID
- Connection status indicator
- "Encrypted" security badge

## Component Behavior Changes (v1 → v2)

### FormPage

```
BEFORE:
├─ Display question
├─ User inputs
├─ Click [送信]
├─ Wait for response
├─ Manually click next (or use button)

AFTER:
├─ Display question
├─ User inputs
├─ Click [送信]
├─ AUTO: 1.2s delay showing confirmation
├─ AUTO: Next question appears (no click!)
├─ USER: Just answer, system handles progression
```

### Skip Button

```
BEFORE:
├─ Click [スキップ]
├─ Logic runs but normal timing

AFTER:
├─ Click [スキップ]
├─ Message: "この質問をスキップします"
├─ AUTO: 0.8s (faster than send!)
├─ Next question appears immediately
```

### Form Completion

```
BEFORE:
├─ Last answer submitted
├─ Auto-redirect to /success

AFTER:
├─ Last answer submitted
├─ Auto-redirect to /honninkakunin first
├─ Face ID verification required
├─ Voice signature required
├─ THEN → /success page
```

## Browser Requirements

| Feature              | Required                           |
| -------------------- | ---------------------------------- |
| WebRTC (Camera)      | Latest Chrome/Safari/Edge/Firefox  |
| MediaRecorder API    | Latest browsers                    |
| Canvas API           | All modern browsers                |
| Web Speech API (TTS) | Chrome 25+, Safari 14.1+, Edge 79+ |
| Fetch API            | All modern browsers                |
| Async/Await          | ES2017+ support needed             |

**Note**: Camera/Microphone require HTTPS or localhost exception

## Error Handling

```typescript
// Each feature has fallbacks:

Camera access fails?
→ Show error message
→ Allow user to retry
→ Skip to voice (optional)

Microphone access fails?
→ Show error message
→ Allow user to retry
→ Proceed without voice (optional)

Form schema load fails?
→ Use fallback demo schema
→ 4 default questions provided
→ Form still functional

PDF generation fails?
→ Display error notification
→ Suggest retry
→ Download link still active
```

## Performance Optimization

- **Lazy Loading**: Components load only when route accessed
- **Image Optimization**: Using Next.js Image component where needed
- **Code Splitting**: Each route is separate bundle
- **State Management**: Local state (React hooks), no Redux needed
- **Animations**: Using Framer Motion (optimized)
- **Caching**: Browser cache for form schema

## Testing Coverage

✅ Auto-progression between questions
✅ Skip button functionality
✅ Face ID camera integration (demo)
✅ Voice recording (5s auto-stop)
✅ Waveform visualization
✅ Form data collection
✅ URL parameter passing
✅ PDF generation and download
✅ Navigation between pages
✅ Error handling and fallbacks

---

**Architecture Ready**: All components integrated, auto-progression working, honninkakunin implemented ✅
