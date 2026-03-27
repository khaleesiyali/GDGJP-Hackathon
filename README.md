# AmanAI (アマンAI) 🎙️📄

## 📖 ABOUT (アプリについて)

**[English]**
AmanAI is a privacy-first, voice-driven Progressive Web App (PWA) designed to assist users—especially visually impaired individuals or foreigners living in Japan—in filling out complex Japanese government forms. Featuring a bilingual AI Audio Agent, users can easily converse with the AI in either English or Japanese. The AI will audibly ask the necessary questions, scan physical documents for information using the camera, and then accurately generate a fully formatted Japanese PDF ready for submission at the city hall, completely hands-free!

**[日本語]**
AmanAI（アマンAI）は、視覚障害のある方や日本に住む外国人が、複雑な日本の行政手続き書類を簡単に作成できるように支援する、プライバシー重視の音声対話型Webアプリです。ユーザーはAI音声エージェントと日本語または英語で自然に会話するだけで手続きを進めることができます。AIが必要な情報をヒアリングし、カメラを使って手元の書類をスキャンし、最終的に役所の窓口へそのまま提出できる正式な日本語フォーマットのPDFを自動的に生成します。

---

## ⚙️ Requirements (動作環境・必須条件)

**[English]**
- Node.js (v18+)
- Python 3.10+
- LiveKit Cloud Account (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` must be set)
- OpenAI API Key (`OPENAI_API_KEY` for GPT-4o, Whisper STT, and TTS)

---

## 🚀 How to Run It (実行方法)

The application is split into a Next.js Frontend and a Python LiveKit AI Agent Backend. You need to run them simultaneously in three separate terminals.
*(このアプリはフロントエンドとバックエンドに分かれています。以下の3つのコマンドを別々のターミナルで同時に実行してください。)*

### 1. The Next.js Frontend (UI / フロントエンド)
Navigate into the frontend directory and start the dev server.
*(フロントエンドのディレクトリに移動し、サーバーを起動します。)*
```bash
cd ai-privacy-amanuensis
npm run dev
```

### 2. The Python LiveKit AI Agent (Backend / AIエージェント)
At the root directory (`GDGJP-Hackathon`), start the Python Agent using the built-in virtual environment.
*(プロジェクトのルートディレクトリで、Pythonの仮想環境からエージェントを起動します。)*
```bash
./ai-privacy-amanuensis/backend/.venv/bin/python Vision.py dev
```

### 3. Public Mobile Access Tunnel (Ngrok / モバイル実機テスト用)
To use the microphone and camera on an iOS/Android device, the site MUST be served over HTTPS. Use ngrok to expose your local frontend to the web!
*(スマートフォンからマイクやカメラ機能を使用するには、HTTPS接続が必須です。ngrokを使用してローカルの3000番ポートを公開してください！)*
```bash
cd ai-privacy-amanuensis
npx ngrok http 3000
```
**Next Step (次のステップ):** Open the provided Ngrok HTTPS URL on your smartphone! *(ターミナルに表示された Ngrok の「HTTPS URL」をスマートフォンのブラウザで開いてテストしてください！)*
