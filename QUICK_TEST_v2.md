# Quick Test Guide - Auto-Progression & Honninkakunin

## Setup (60 seconds)

```bash
# Terminal 1: Backend
cd /Users/y4l1/Documents/GDGJP-Hackathon
python -m uvicorn server:app --reload

# Terminal 2: Frontend
cd /Users/y4l1/Documents/GDGJP-Hackathon/ai-privacy-amanuensis
npm run dev

# Browser
http://localhost:3001/form
```

## Test Flow (5 minutes)

### 🎯 Phase 1: Form Questions (2 min)

```
✓ Form loads
✓ Hear: "心身障碍者福祉手当認定申請書の申請書があります..."
✓ Yellow card appears with question #1: "ご用件について"

[NO CLICKING BETWEEN QUESTIONS - AUTOMATIC!]

① 1/4: Type answer (any text)
    ↓
   Click [送信]
    ↓
   Hear: "かしこまりました。ありがとうございます。"
    ↓
   AUTOMATIC → Question #2 appears (NO CLICK NEEDED!)
   Progress shows: 2 / 4

② 2/4: Type answer
    ↓
   Click [送信]
    ↓
   AUTOMATIC → Question #3 appears
   Progress shows: 3 / 4

③ 3/4: Type answer OR click [スキップ]
    ↓
   (Skip is even FASTER - auto-advances in 0.8s)
    ↓
   AUTOMATIC → Question #4 appears
   Progress shows: 4 / 4

④ 4/4: Type final answer
    ↓
   Click [送信]
    ↓
   Hear acknowledgement
    ↓
   AUTOMATIC → Redirects to honninkakunin page
   (1-2 second pause, then redirect)
```

### 🔐 Phase 2: Identity Verification (3 min)

```
✓ Page changes to: "本人確認" (Identity Confirmation)
✓ Subtitle: "カメラでお顔を確認させていただきます"
✓ Large button: [📷 カメラで顔認証]

Click [📷 カメラで顔認証]:
    ↓
   [LIVE CAMERA FEED APPEARS]
   Rotating circle animation
    ↓
   After ~2.5 seconds:
   Green checkmark: "お顔が確認できました"
    ↓
   AUTO-ADVANCE (2 seconds) → Voice signature page

✓ Page shows: "音声署名"
✓ Subtitle: "本人確認のため、音声をご録音ください"
✓ Button: [🎤 音声の録音開始]

Click [🎤 音声の録音開始]:
    ↓
   Waveform bars ANIMATE in real-time
   Text: "音声を録音中... (5秒で自動停止)"
    ↓
   After 5 seconds:
   AUTOMATIC STOP
   Text changes: "音声署名が完了しました"
   Button shows: "✓ 完了"
    ↓
   AUTO-ADVANCE (1.5 seconds) → Completion page

✓ Page shows: "本人確認完了"
✓ Large green checkmark animation
✓ Button: [✓ 申請完了へ進む]

Click button:
    ↓
   AUTOMATIC → Success page (same as before)
```

### ✅ Phase 3: Success & Download (1 min)

```
✓ Success page: "申請完了!"
✓ Shows form name
✓ Shows submission ID
✓ Button: [📥 PDFをダウンロード]

Click [📥 PDFをダウンロード]:
    ↓
   Progress bar fills
    ↓
   PDF downloads to your computer
   File named: form_[submissionId].pdf

✓ Buttons: [🏠 ホームに戻る] or [別のフォームを入力]
```

## Key Things to Observe

✅ **Auto-Progression**

- [ ] Questions change WITHOUT clicking a "Next" button
- [ ] Progress number updates (1/4 → 2/4 → 3/4 → 4/4)
- [ ] Smooth 1.2 second delay between questions
- [ ] User sees acknowledgement before next question

✅ **Honninkakunin Face**

- [ ] Camera feed displays in real-time
- [ ] Rotating circle shows detection in progress
- [ ] Green checkmark appears when "detected"
- [ ] Auto-advances to voice stage (NO BUTTON CLICK)

✅ **Honninkakunin Voice**

- [ ] Waveform bars animate during recording
- [ ] Recording auto-stops after 5 seconds
- [ ] "完了" appears automatically
- [ ] Auto-advances to completion (NO BUTTON CLICK)

✅ **Full Journey**

- [ ] Form → Honninkakunin → Success page
- [ ] All data carried through URLs
- [ ] PDF contains all form answers
- [ ] Can start new form from success page

## Troubleshooting

### Form questions not auto-advancing?

```bash
# Check:
1. Browser console for errors (F12)
2. Network tab - verify /form-schema loaded
3. formData state updating in React DevTools
```

### Camera not working?

```bash
• Need HTTPS (localhost exception exists)
• Check browser permissions for camera
• Verify camera connected
• Try different browser (Chrome/Safari best)
```

### Audio recording issues?

```bash
• Check microphone connected
• Check browser volume isn't muted
• Verify browser has microphone permission
• Try different audio device in system settings
```

### PDF download fails?

```bash
1. Check backend running on :8000
2. Verify NetworkTab shows /api/generate-pdf called
3. Check browser download settings
```

## Keyboard Shortcuts

| Action        | Key                           |
| ------------- | ----------------------------- |
| Submit Answer | Enter ↩️                      |
| Skip Question | Click button (or Tab + Enter) |
| Start Over    | Navigate back to /form        |
| Home          | Click button on /success      |

## Success Criteria ✅

- [x] Questions auto-advance (no button clicks between Qs)
- [x] Progress indicator updates automatically
- [x] Face ID page shows and auto-advances
- [x] Voice recording with visualization
- [x] Complete journey: Form → Honninkakunin → Success
- [x] PDF download works with all answers

## Demo Timing

Fastest complete run: ~4-5 minutes

- Form: ~2 minutes (4 quick answers)
- Honninkakunin: ~2 minutes (face + voice)
- Success/PDF: ~30 seconds

## What's Different From Before?

| Feature           | Before                 | Now                           |
| ----------------- | ---------------------- | ----------------------------- |
| Question Changes  | Click sends, then wait | Click sends, auto-advance     |
| Between Questions | Manual button click    | Automatic (1.2s)              |
| Skip              | Manual click + wait    | Auto-advances (0.8s)          |
| After Form        | Goes to Success        | Goes to Honninkakunin first   |
| Identity Check    | Not implemented        | Face + Voice verification     |
| Security Level    | Basic                  | Enhanced with ID verification |

---

**Ready to test?** → `http://localhost:3001/form`

Problems? Check HONNINKAKUNIN.md for full details
