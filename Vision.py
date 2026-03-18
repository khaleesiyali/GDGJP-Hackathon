import json
import logging
import os
import uuid 
from dotenv import load_dotenv

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents import AgentSession, Agent, function_tool
from livekit.plugins import openai, silero


logger = logging.getLogger("form-agent")
logger.setLevel(logging.INFO)
load_dotenv(".env.local")

print(f"DEBUG: OPENAI_API_KEY is {'SET' if os.getenv('OPENAI_API_KEY') else 'MISSING'}")

# 1. Extract JSON schema
FORM_DB = {
    "心身障碍者福祉手当認定申請書": "心身障碍者福祉手当認定申請書.json",   # This is our database, although we only have 1 for now
}

def load_form_from_db(form_id: str):
    """Read according JSON file based on the command received from User"""
    file_path = FORM_DB.get(form_id)
    if not file_path or not os.path.exists(file_path):
        logger.error(f"Cant find form id: {form_id}")
        return None
        
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
    


# 2. Agent (Form filling and Form retrieving)
class FormAgent(Agent):
    def __init__(self):
        # Asking user's purpose
        instructions = """
        あなたは日本の区役所の親切な総合案内の職員です。視覚障害のある方を音声でサポートします。

        【初期対応】
        まずは「こんにちは。Aman AIです。本日はどのようなお手続きでしょうか？『手当の申請をしたい』や『過去の履歴を見たい』など、ご自由にお話しください。

        【アクションルール】
        1. ユーザーが「申請書を作りたい（例：福祉手帳、手当の申請、お金の申請など）」と言った場合、`start_form_filling` ツールを呼び出してください。
        2. ユーザーが「過去の履歴を見たい」「前の書類を出して」と言った場合、`open_my_files` ツールを呼び出してください。
        3. ツールからシステムメッセージが返ってきたら、その指示に従って自然に会話を続けてください。
        """
        super().__init__(instructions=instructions)
        self.current_form_data = None
        self.expected_format = ""

    # ----------------------------------------------------
    # Form filling Mode
    # ----------------------------------------------------
    @function_tool(description="ユーザーが新しい申請書を作成したい場合に呼び出します。ユーザーの会話内容から最適なフォームを推測して選択してください。")
    async def start_form_filling(self, form_type: str) -> str:
        """
        Args:
            form_type: ユーザーの目的に応じて以下のいずれかのIDを指定してください：
            - "心身障碍者福祉手当認定申請書" : 「福祉手当」「障害者手当」「お金の申請」「申請書」などのキーワードが出た場合。
        """
        logger.info(f"🧠 AI 传进来的原始表单类型: {form_type}")
        if form_type not in ["心身障碍者福祉手当認定申請書"]:
            logger.warning(f"⚠️ 捕捉到 AI 幻觉！瞎编了 [{form_type}]，已强制纠正为 [心身障碍者福祉手当認定申請書]！")
            form_type = "心身障碍者福祉手当認定申請書"

        self.current_form_data = load_form_from_db(form_type)
        
        if not self.current_form_data:
            return "システムエラー：該当するフォームが見つかりませんでした。ユーザーに「現在その申請書には対応していません」と謝罪し、他の要件がないか聞いてください。"

        properties = self.current_form_data.get("parameters", {}).get("properties", {})
        
    
        self.expected_format = json.dumps(properties, ensure_ascii=False, indent=2)
        missing_fields = []
        for key, value in properties.items():
            desc = value.get("description", "")
            missing_fields.append(f"{key} ({desc})" if desc else key)
            
        missing_fields_str = "\n".join([f"- {field}" for field in missing_fields])
        form_name = self.current_form_data.get("name", "未命名申請フォーム")

        logger.info(f"Successfully loading [{form_name}]，ready for action")

        # Core rules
        return f"""
        【システム指示：ここからモードを切り替えてください】
        フォーム「{form_name}」がロードされました。
        ここからは「申請書記入サポート係」として振る舞い。
        ⚠️【最優先アクション：フォームの確認】⚠️
        まずはユーザーに「{form_name}ですね。こちらの作成を始めてもよろしいでしょうか？」とだけ聞いて、ユーザーの同意（「はい」「お願いします」など）を待ってください。同意を得る前に、個人情報の質問を始めてはいけません！
        以下の項目をユーザーに質問してください：
        {missing_fields_str}

        会話のルール:
        1. 【【質問のペース（超重要）】絶対に箇条書き（1. 2. 3...）で大量の質問を列挙しないでください！視覚障害のある方が音声で覚えやすいよう、**一度の会話で聞くのは「関連する1〜2項目」まで**に制限してください。（例：「次に、各種手帳はお持ちでしょうか？また、何か具体的な病名があれば教えていただけますか？」のように、自然な対話のキャッチボールを心がけてください）。
        2. 【優しくフォロー】不足している項目だけを追加で質問してください。
        3. 【超重要：漢字の確認】氏名を聞き取った後は、必ず漢字表記を確認してください。
        4. 【最終確認】全ての必要な情報を集め終わったら、内容をまとめて復唱してください。
        5. ⭐️【音声署名の要求】ユーザーが復唱内容に同意したら、最後に必ずこうお願いしてください：
        「ありがとうございます。最後に電子署名として、ご本人確認の録音を行います。『この内容で申請します』と声に出して宣言してください。」
        6. 【送信条件】ユーザーが上記の宣言を声に出して言ったのを確認した後のみ、`submit_form_data` を呼び出してください。
        7. ⚠️【超重要：厳密なデータフォーマット】⚠️
        `submit_form_data` に渡す `updated_json_string` は、必ず以下のJSON構造(スキーマ)を完全に維持してください!勝手に構造をFlattenしたり、キーの名前を変えたりすることは絶対に禁止です。収集できなかった項目は `null` または `""` にしてください。
        8.　使用言語は日本語のみ
        9.もし年齢は18歳以上としたら、保護者の記入は不要

        【必須の出力JSON構造テンプレート】:
        {self.expected_format}
        """
# ----------------------------------------------------
    # Form retrieving Mode
# ----------------------------------------------------   

    @function_tool(description="ユーザーが過去の申請履歴（マイファイル）を見たいと言った場合に呼び出します。")
    async def open_my_files(self) -> str:
        # TODO: Add code here to use livekit send signal to frontend
        logger.info("📡 触发信号：通知前端网页跳转到 MyFile 页面！")
        return """
        【システム指示】
        フロントエンドにマイファイルを開くシグナルを送信しました。
        ユーザーに「はい、画面に過去の申請履歴を表示しました。読み上げることも可能ですが、いかがなさいますか？」と伝えてください。
        """


    # 3. Save the data as result_userid.json
    @function_tool(description="すべての必要な項目が収集できたら、この関数を呼び出してデータを送信します。")
    async def submit_form_data(self, updated_json_string: str) -> str:
        try:
            user_answers = json.loads(updated_json_string)
            submission_id = str(uuid.uuid4())[:8]
            form_name = self.current_form_data.get("name", "unknown_form") if self.current_form_data else "unknown_form"
            
            final_submission = {
                "form_name": form_name,
                "submission_id": submission_id,
                "status": "completed",
                "answers": user_answers
            }

            new_file_name = f"result_{submission_id}.json"
            with open(new_file_name, "w", encoding="utf-8") as f:
                json.dump(final_submission, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ 成功！新建了独立的文件: {new_file_name}")
            return """
            お疲れ様でした。無事に電子署名の録音と申請データの送信が完了し、正式な申請書類が作成されました。
            作成された書類は、アプリ内の「マイファイル」からいつでもご確認いただけます。
            本日はご利用いただき、本当にありがとうございました。
            """

        except json.JSONDecodeError:
            return "すみません、システムエラーが発生しました。"

# 4. Choose what LLM to use and start the conversation
async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    
    session = AgentSession(
        stt=openai.STT(language="ja"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="alloy", speed=0.90),
        vad=silero.VAD.load(),
    )
    
    await session.start(
        room=ctx.room,
        agent=FormAgent()
    )
    logger.info("✅ AI connected")

    greeting_text = "こんにちは、Aman　AIです。本日はどのようなお手続きでしょうか？『手当の申請をしたい』や『過去の履歴を見たい』など、ご自由にお話しください。"
    
    # Opening Sentence
    try:
        await session.say(greeting_text, allow_interruptions=True)
        logger.info("🗣️ Start Speaking")
    except AttributeError:
        # In case the SDK version is too old
        logger.warning("SDK version not compatiable")
        session.chat_ctx.messages.append({"role": "user", "content": "こんにちは。最初の挨拶をお願いします。"})
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))