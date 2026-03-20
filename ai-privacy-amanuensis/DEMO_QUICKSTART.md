# ✅ DEMO IS LIVE - Quick Start Guide

## 🎯 Access Points

### 🌐 Main Form (Integrated with Backend)

```
http://localhost:3001/form
```

👆 **Click here to see the integrated demo!**

### 🏠 Home Hub

```
http://localhost:3001
```

---

## 📱 For iPhone Simulator Users

```bash
# 1. Open iPhone Simulator
open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app

# 2. In Safari, visit:
http://192.168.1.64:3001/form
```

---

## 🔄 Running Servers

### ✅ Backend (FastAPI)

- Status: **RUNNING** ✅
- URL: `http://localhost:8000`
- Purpose: Generates LiveKit tokens
- Test endpoint: `/get_token?room_name=test&participant_name=demo`

### ✅ Frontend (Next.js)

- Status: **RUNNING** ✅
- URL: `http://localhost:3001`
- New page: `/form` - Integrated form with backend
- Features: Conversation UI, JSON download, voice control ready

---

## 📋 What You Can Do in the Form

1. **See Live Token Generation**
   - Opens the form page
   - Console shows "✅ Token received from backend"
   - Connection status displays ✅ Ready

2. **Interactive Chat**
   - Type messages and press Enter
   - AI agent responds (simulated, ready for real LiveKit)
   - Animated message bubbles

3. **Download as JSON**
   - Click "JSONをダウンロード" button
   - Downloads form*response*\*.json file
   - Contains all conversation and data

4. **Voice Control Ready**
   - "音声入力" (Voice Input) button
   - Ready to integrate Web Audio API
   - Shows listening state

---

## 💻 Terminal Commands (if needed)

### Start Backend Alone

```bash
cd /Users/y4l1/Documents/GDGJP-Hackathon/ai-privacy-amanuensis/backend
uv run uvicorn server:app --reload
```

### Start Frontend Alone

```bash
cd /Users/y4l1/Documents/GDGJP-Hackathon/ai-privacy-amanuensis
npm run dev
```

### Kill All and Restart

```bash
pkill -f "uvicorn server|npm run dev"
# Wait 3 seconds, then run both commands above
```

---

## 📊 Architecture

```
🖥️  FRONTEND                        ⚙️  BACKEND
Next.js (3001)                 FastAPI (8000)
    ↓                              ↓
/form page ─────────GET─────→ /get_token
    ↓                              ↓
Show connection status ←──JWT token── AccessToken
    ↓                              ↓
Display "✅ Ready"            Uses LiveKit
    ↓                         credentials
User inputs message
    ↓
Message in chat UI
    ↓
Ready to send to
AI Agent (Vision.py)
```

---

## 🎨 Features Implemented

✅ Full frontend-backend integration  
✅ Real JWT token generation  
✅ Japanese UI (日本語)  
✅ Conversation history with animations  
✅ JSON data export  
✅ Connection status indicator  
✅ Voice control button (ready)  
✅ Dark/Light theme (in home page)  
✅ Responsive mobile-first design  
✅ Error handling with fallback mode

---

## 🚀 Next Steps (Optional)

### To Enable Real Voice Sessions

1. Get LiveKit server URL and credentials
2. Update `.env.local` files
3. Install `@livekit/components-react`
4. Replace simulated responses with real LiveKit room

### To Enable AI Agent Responses

1. Set `OPENAI_API_KEY` in backend `.env.local`
2. Run `backend/Vision.py`
3. Connect FormPage to Vision agent
4. User speaks, AI listens, responds intelligently

### To Enable PDF Generation

1. Use backend `pdf_generate.py` endpoint
2. Create `/api/fill-pdf` in Next.js
3. Send form data, get back filled PDF
4. Download directly from frontend

---

## 📁 Key Files Modified/Created

```
✨ NEW: src/components/FormPage.tsx
        ↳ Complete integration component

✨ NEW: src/app/form/page.tsx
        ↳ Updated to use FormPage

✨ NEW: .env.local
        ↳ Frontend environment config

✨ NEW: backend/.env.local
        ↳ Backend environment config

📋 DOCS: INTEGRATION_DEMO.md
        ↳ Full integration guide
```

---

## 🐛 If Something Breaks

| Issue                | Fix                               |
| -------------------- | --------------------------------- |
| Can't reach backend  | `curl http://localhost:8000/docs` |
| Can't reach frontend | `curl http://localhost:3001`      |
| Port already in use  | Kill process and wait 10 seconds  |
| Blank page           | Clear cache (Cmd+Shift+Delete)    |
| Form won't load      | Check browser console for errors  |

---

## ✨ You're All Set!

Your integrated system is now running with:

- ✅ Backend token generation working
- ✅ Frontend form page communicating with backend
- ✅ Live conversation interface ready
- ✅ JSON data collection working
- ✅ Everything set up for demo/testing

**Visit: http://localhost:3001/form** to see it in action! 🎉
