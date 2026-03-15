import json
import logging
from dotenv import load_dotenv
logger = logging.getLogger("form-agent")
logger.setLevel(logging.INFO)
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents import AgentSession, Agent, function_tool
from livekit.plugins import openai, google, silero

load_dotenv(".env.local")
import os
print(f"DEBUG: GOOGLE_API_KEY is {'SET' if os.getenv('GOOGLE_API_KEY') else 'MISSING'}")

import json
import os
import logging
from livekit.agents import Agent, function_tool

logger = logging.getLogger("form-agent")

# 1. Reading JSON file and mock test
def load_form_from_db(file_path="mock_form.json"):
    # For testing purpose: a fake pdf file
    if not os.path.exists(file_path):
        return {
            "form_id": "doc_8848",
            "form_name": "障害者手帳交付申請書",
            "fields": {
                "氏名（漢字）": None,          # 这个是 null，AI 会去问
                "生年月日": None,             # 这个是 null，AI 会去问
                "国籍": "日本",               # 这个已经有值了，AI 应该忽略它
                "障害の種別": None,           # 这个是 null，AI 会去问
                "連絡先電話番号": None         # 动态新增的 null，AI 也会去问
            }
        }
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

# 2. AGENT
class FormAgent(Agent):
    def __init__(self, form_data: dict):
        self.form_data = form_data
        
        # Finding All null values and ask users
        missing_fields = []
        for key, value in self.form_data.get("fields", {}).items():
            if value is None:
                missing_fields.append(key)
        
        # Change everything into string and record it
        missing_fields_str = "\n".join([f"- {field}" for field in missing_fields])
        
        #prompt still needs to be fixed. (漢字表記 and etc...)
        instructions = f"""
あなたは日本区役所の親切な職員で、視覚障害のある方の申請書記入を丁寧にサポートします。

現在処理中のフォーム: {self.form_data.get('form_name')}

以下の項目が未入力(null)です。ユーザーに一つずつ質問して、情報を収集してください：
{missing_fields_str}

ルール:
1. 各質問は必ず一つずつ行ってください。一度に複数の項目を聞かないでください。
2. 氏名を聞いた後は、必ず漢字表記を確認してください。
3. 全ての情報を集めたら、最後にまとめて復唱してください。
4. ユーザーが「はい」と明確に同意した後のみ、`submit_form_data` を呼び出してください。
"""
        super().__init__(instructions=instructions)

    # 3. Change everything into JSON format
    @function_tool(description="すべての未入力項目が収集できたら、この関数を呼び出してデータを送信します。")
    async def submit_form_data(
        self,
        updated_json_string: str
    ) -> str:
        """
        Args:
            updated_json_string: 収集した情報をすべて埋めた、完全なJSON形式の文字列。
        """
        try:
            # From LLM to Dictionary format
            filled_data = json.loads(updated_json_string)
            
            # PUT the Answer Directly into the original dictionary? Might need to fix that
            for key, value in filled_data.items():
                if key in self.form_data["fields"]:
                    self.form_data["fields"][key] = value

            logger.info(f"\n========================================\n✅ 成功获取完整表单数据并写入:\n{json.dumps(self.form_data, ensure_ascii=False, indent=2)}\n========================================")
            
            # self.form_data is the final output, we can use this for PDF creation
            
            return "かしこまりました。ただいま書類を作成しております。"
        except json.JSONDecodeError:
            logger.error("LLM 传回来的不是标准 JSON 格式")
            return "すみません、システムエラーが発生しました。もう一度確認させてください。"

# 3. Calling Agent
async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Different Model (I dont know why but Gemini API is not working for me...So used OpenAI for now)
    current_form = load_form_from_db()
    
    session = AgentSession(
        stt=openai.STT(language="ja"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="alloy"),
        vad=silero.VAD.load(),
    )

    
    await session.start(
        room=ctx.room,
        agent=FormAgent(form_data=current_form)
    )
    logger.info("发送隐形启动信号，唤醒 AI...")
    
    # 1. Sent Agent a secret message for it to start conversation
    session.chat_ctx.append(
        role="user",
        text="【システム通知】ユーザーが部屋に入りました。ルールに従って、まずは優しく挨拶をし、最初の未入力項目（nullの項目）について質問を始めてください。"
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))