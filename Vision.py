import json
import logging
import os
import uuid 
import asyncio
import urllib.parse
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
    def __init__(self, room):
        # Asking user's purpose
        instructions = """
        あなたは日本の区役所の親切な総合案内の職員です。視覚障害のある方を音声でサポートします。

        【初期対応】
        まずは「こんにちは。Aman AIです。本日はどのようなお手続きでしょうか？『手当の申請をしたい』や『過去の履歴を見たい』など、ご自由にお話しください。

        【会話のルール】
        1. ユーザーに対して、自然で温かいトーンで話しかけてください。
        2. 一度に1つの質問だけをユーザーに聞いてください。
        3. **絶対に忘れないでください**: 新しい質問をする前には、**必ず `update_ui_card` ツールを呼び出して**、画面の表示を現在聞こうとしている質問内容に更新してください。
        4. ツールからシステムメッセージが返ってきたら、自然に会話を続けてください。
        """
        super().__init__(instructions=instructions)
        self.room = room
        self.current_form_data = None
        self.expected_format = ""
        self.last_submission = None

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

        # Trigger Frontend Navigation
        if self.room:
            payload = json.dumps({"action": "navigate", "destination": "/form"}).encode('utf-8')
            asyncio.create_task(self.room.local_participant.publish_data(payload, reliable=True))

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
        8. ⚠️【超重要：画面UIの更新】⚠️ ユーザーに新しい質問をする直前には、**必ず `update_ui_card` ツールを呼び出して**、画面のカードを更新してください（例：title="お電話番号", description="日中連絡がつく電話番号を教えてください"）。このアクションは毎回の質問で必須です。
        9. 【徹底質問】JSONフォーマットに存在する項目は、**1つ残らず絶対にすべて**ユーザーに質問して埋めてください。銀行口座情報（金融機関名、支店名、口座番号）や保護者情報など、面倒な項目も絶対にスキップしてはいけません！すべて聞き出してください。
        10. 使用言語は日本語のみ
        9.もし年齢は18歳以上としたら、保護者の記入は不要

        【必須の出力JSON構造テンプレート】:
        {self.expected_format}
        """
# ----------------------------------------------------
    # Form retrieving Mode
# ----------------------------------------------------   

    @function_tool(description="新しい質問をする直前に【必ず・毎回】呼び出します。画面のUIカードを更新します。titleは質問の短い見出し（例:「お電話番号」「ご住所」）、descriptionは画面に表示する詳しい説明文を指定します。")
    async def update_ui_card(self, title: str, description: str) -> str:
        logger.info(f"📡 UIカード動的更新: {title}")
        if self.room:
            payload = json.dumps({
                "action": "update_card", 
                "title": title,
                "description": description
            }).encode('utf-8')
            asyncio.create_task(self.room.local_participant.publish_data(payload, reliable=True))
        return "UI card successfully updated, now you can ask the user the question verbally."

    @function_tool(description="ユーザーがすべての質問に答え終わり、記入内容の確認も完了した後に呼び出します。フロントエンドを自動的に「手続き完了」画面に移動させます。")
    async def finish_form(self) -> str:
        logger.info("📡 完了通知シグナル！")
        if self.room:
            destination = "/success"
            if self.last_submission:
                encoded_data = urllib.parse.quote(json.dumps(self.last_submission))
                sub_id = self.last_submission.get("submission_id", "")
                destination = f"/success?formData={encoded_data}&submissionId={sub_id}"
                
            payload = json.dumps({"action": "navigate", "destination": destination}).encode('utf-8')
            asyncio.create_task(self.room.local_participant.publish_data(payload, reliable=True))
        return "Navigating to success"

    @function_tool(description="ユーザーが過去の申請履歴（マイファイル）を見たいと言った場合に呼び出します。")
    async def open_my_files(self) -> str:
        logger.info("📡 触发信号：通知前端网页跳转到 MyFile 页面！")
        if self.room:
            payload = json.dumps({"action": "navigate", "destination": "/files"}).encode('utf-8')
            asyncio.create_task(self.room.local_participant.publish_data(payload, reliable=True))
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
            self.last_submission = final_submission

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
        agent=FormAgent(room=ctx.room)
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