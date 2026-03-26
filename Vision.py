import json
import logging
import os
import uuid 
import asyncio
import urllib.parse
from dotenv import load_dotenv

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents import AgentSession, Agent, function_tool
import livekit.rtc
from livekit.plugins import openai, silero

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
import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter
import os



# Japanese FONT (we used NotoSans, which is a open-sourced font created by google)
font_path = os.path.join("Font", "NotoSansJP-Medium.ttf")
try:
    pdfmetrics.registerFont(TTFont('NotoSans', font_path))
    print("✅ Noto Sans Loading completed")
except Exception as e:
    print(f"❌ Loading failed: {e}")

def convert_to_jp_era(year, month, day):
    """Changing YMD into Japanese era"""
    y, m, d = int(year), int(month), int(day)
    if y >= 2019: 
        return "R", str(y - 2018)  # Reiwa
    elif y >= 1989:
        return "H", str(y - 1988)  # Heisei
    else:
        return "S", str(y - 1925)  # Showa

def fill_pdf_data(user_answers_path, mapping_json_path, transparent_pdf_path="transparent_text.pdf"):
    # 1. Read the dictionary
    with open(user_answers_path, 'r', encoding='utf-8') as f:
        answers = json.load(f)["answers"]
    
    with open(mapping_json_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)["mapping"]
        
    # 2. Generate a empty canvas (For transparent_text.pdf)
    c = canvas.Canvas(transparent_pdf_path)
    c.setFont('NotoSans', 10) 
    
    # 3. (use answer and mapping json to fill the empty canvas)
    smart_fill_pdf(answers, mapping, c)
    
    # 4. Save as transparent_pdf
    c.save()
    print(f"✅ transparent Layer: {transparent_pdf_path}")


def smart_fill_pdf(answers, mapping, c):
    def process_node(ans_node, map_node):
        for key, value in ans_node.items():
            if key not in map_node:
                continue
                
            rule = map_node[key]
            
            if isinstance(value, dict):
                process_node(value, rule)
                continue
                
            # 1. General text (type=text)
            if isinstance(rule, dict) and rule.get("type") == "text" and value:
                c.drawString(rule["x"], rule["y"], str(value))
            elif rule.get("type") == "date_split" and value:
                year, month, day = value.split("-")
                if "year" in rule:
                    c.drawString(rule["year"]["x"], rule["year"]["y"], year)
                if "month" in rule:
                    c.drawString(rule["month"]["x"], rule["month"]["y"], month)
                if "day" in rule:
                    c.drawString(rule["day"]["x"], rule["day"]["y"], day)
            # 2. Spilting the date into YYYY MM DD (type = date_split)
            elif rule.get("type") == "date_split_era" and value:
                # In case the year month day is not complete
                try:
                    year, month, day = value.split("-")
                    era_code, jp_year = convert_to_jp_era(year, month, day)
                    
                    # 1. year
                    if "year" in rule:
                        c.drawString(rule["year"]["x"], rule["year"]["y"], jp_year)
                    # 2. Month
                    if "month" in rule:
                        c.drawString(rule["month"]["x"], rule["month"]["y"], month)
                    # 3. Day
                    if "day" in rule:
                        c.drawString(rule["day"]["x"], rule["day"]["y"], day)
                        
                    # 4. Era
                    if "era" in rule and "options" in rule["era"] and era_code in rule["era"]["options"]:
                        cx = rule["era"]["options"][era_code]["x"]
                        cy = rule["era"]["options"][era_code]["y"]
                        c.circle(cx, cy, 10, stroke=1, fill=0)
                except Exception as e:
                    print(f"⚠️ 日期解析出错: {value}, 错误信息: {e}")

            # 3. For space that need separate character (type = char_spilt)
            elif rule.get("type") == "char_split" and value:
                str_value = str(value) 
                start_x = rule["start_x"]
                spacing_x = rule["spacing_x"]
                y = rule["y"]
                
                # Draw each character into the boxes
                for i, char in enumerate(str_value):
                    current_x = start_x + (i * spacing_x)
                    c.drawString(current_x, y, char)
                    print(f"📍 Draw: {char} at (x:{current_x}, y:{y})")

            # 4. Circle and Check (type = boolean_circle)
            elif rule.get("type") == "boolean_circle" and value or rule.get("type")=="boolean_check" and value:
                if value in rule.get("options", {}):
                    cx = rule["options"][value]["x"]
                    cy = rule["options"][value]["y"]
                    c.circle(cx, cy, 10, stroke=1, fill=0)

            # 5. irregular character spilt (type = irregular)
            elif rule.get("type") == "char_split_irregular" and value:
                str_value = str(value)
                x_coords = rule.get("x_coords", [])
                y = rule["y"]
                
                # put each characters into boxes
                for i, char in enumerate(str_value):
                    if i < len(x_coords): 
                        current_x = x_coords[i]
                        c.drawString(current_x, y, char)
                        print(f"📍 Draw irregular: {char} at (x:{current_x}, y:{y})")
                    else:
                        print(f"⚠️ length exceeded, drop: {char}")
    process_node(answers, mapping)

def merge_pdfs(blank_form_path, text_layer_path, final_output_path):
    """Generating New PDF"""
    # Read empty form
    original_pdf = PdfReader(blank_form_path)
    text_pdf = PdfReader(text_layer_path)
    
    writer = PdfWriter()
    
    # Put transparent text on empty form
    original_page = original_pdf.pages[0]
    text_page = text_pdf.pages[0]
    original_page.merge_page(text_page)
    
    writer.add_page(original_page)
    
    # Generate new User PDF
    with open(final_output_path, "wb") as f:
        writer.write(f)
    print(f"🎉 The new pdf is: {final_output_path}")



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
        2. 【超重要：漢字の確認（一文字ずつ）】氏名を聞き取った後、必ず**一文字ずつ漢字を使った単語を挙げて確認**してください。（例：「『山』は富士山の『山』、『田』は田んぼの『田』で合っていますか？」）。ユーザーが「はい」と全て正しいことに同意するまで、絶対に次の質問に進まないでください。
        3. 【優しくフォロー】不足している項目だけを追加で質問してください。
        4. 【論理的チェック（聞き間違い防止）】ユーザーの回答が質問の意図と明らかに合っていない場合（例：住所を聞いているのに「はい」と答えた、電話番号に文字が含まれる等）、音声認識エラーと判断し、「すみません、うまく聞き取れませんでした。もう一度〇〇を教えていただけますか？」と優しく聞き直してください。
        5. 【最終確認】全ての必要な情報を集め終わったら、内容をまとめて復唱してください。
        6. ⭐️【音声署名の要求】ユーザーが復唱内容に同意したら、最後に必ずこうお願いしてください：
        「ありがとうございます。最後に電子署名として、ご本人確認の録音を行います。『この内容で申請します』と声に出して宣言してください。」
        7. 【途中終了の対応（スキップ）】もしユーザーが「もうこれだけでいい」「残りはスキップして」「ここまでにしたい」など、記入の終了を明言した場合は、残りの未記入項目（JSONに存在しても）の質問をすべてスキップし、直ちに【最終確認】と【音声署名の要求】に進んでください。
        8. 【送信条件】ユーザーが上記の宣言を声に出して言ったのを確認した後のみ、`submit_form_data` を呼び出してください。
        9. ⚠️【超重要：厳密なデータフォーマット】⚠️
        `submit_form_data` に渡す `updated_json_string` は、必ず以下のJSON構造(スキーマ)を完全に維持してください!勝手に構造をFlattenしたり、キーの名前を変えたりすることは絶対に禁止です。収集できなかった項目は `null` または `""` にしてください。
        10. ⚠️【超重要：画面UIの更新】⚠️ ユーザーに新しい質問をする直前には、**必ず `update_ui_card` ツールを呼び出して**、画面のカードを更新してください（例：title="お電話番号", description="日中連絡がつく電話番号を教えてください"）。このアクションは毎回の質問で必須です。
        11. 【徹底質問】ユーザーが「途中終了」を宣言しない限り、JSONフォーマットに存在する項目はすべて埋まるまで質問を続けてください（18歳以上の場合の保護者欄などは文脈で判断してスキップ可）。
        12. 【英語対応とデータ言語の分離】基本は日本語で対話しますが、ユーザーが「英語で話して (Speak in English)」等と要求した場合は、それ以降の**会話（音声）は英語**で行ってください。ただし、**JSONに保存するデータ内容は絶対に日本語**に翻訳して記録してください（例：User says "Tokyo", record as "東京都"）。


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
            final_pdf_name = f"Final_Filled_{submission_id}.pdf"
            fill_pdf_data(new_file_name, "心身障碍者福祉手当認定申請書Mapping.json", "transparent_text.pdf")
            merge_pdfs("blank_form.pdf", "transparent_text.pdf", final_pdf_name)
            logger.info(f"📄 PDF 生成成功: {final_pdf_name}")

            # Send Navigation Signal to Success Page
            if self.room:
                payload = json.dumps({
                    "action": "navigate", 
                    "destination": f"/success?submission_id={submission_id}"
                }).encode('utf-8')
                asyncio.create_task(self.room.local_participant.publish_data(payload, reliable=True))

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
        stt=openai.STT(), # Removed language="ja" to allow auto-detection for English and Japanese
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="alloy"),
        vad=silero.VAD.load(min_silence_duration=0.5),
    )
    
    await session.start(
        room=ctx.room,
        agent=FormAgent(room=ctx.room)
    )
    logger.info("✅ AI connected")

    @ctx.room.on("data_received")
    def on_data_received(dp: livekit.rtc.DataPacket, **kwargs):
        try:
            payload = json.loads(dp.data.decode("utf-8"))
            if payload.get("action") == "camera_scan":
                content = payload.get("content", "")
                logger.info(f"📸 カメラからの書類データを取得しました！\n{content}")
                
                # Context Injection
                session.chat_ctx.messages.append({
                    "role": "user",
                    "content": f"【カメラからスキャンした書類のデータ】\n{content}\nこれをもとに、何の書類か特定し、すでに書かれている内容を確認した上で、残りの空欄を埋めるための質問を順番に開始してください。"
                })
                # Send prompt to start gathering specific missing info over AI Voice
                asyncio.create_task(session.say(f"カメラから情報を読み取りました。以下の情報が不足しています。順番に教えてください。\n\n{keys_to_ask_str}", allow_interruptions=True))
                    
            elif payload.get("action") == "set_language":
                lang = payload.get("lang")
                logger.info(f"Language switched to {lang}")
                if lang == "en":
                    session.chat_ctx.messages.append({
                        "role": "system",
                        "content": "【SYSTEM INSTRUCTION】The user has switched the language to English. You MUST now speak, ask all questions, and communicate entirely in English. \nCRITICAL RULES:\n1. Your voice and text responses must be in English.\n2. When calling `update_ui_card`, use English for the title and description.\n3. However, the data you collect and fill into the JSON schema MUST be strictly translated into Japanese (e.g., if user says 'Tokyo', save it as '東京都' in the JSON). Do not save English text in the final form payload."
                    })
                    asyncio.create_task(session.say("I have switched to English. How can I help you today?", allow_interruptions=True))
                else:
                    session.chat_ctx.messages.append({
                        "role": "system",
                        "content": "【SYSTEM INSTRUCTION】ユーザーが言語を日本語に切り替えました。これ以降はすべて日本語で話し、UIカードも日本語にしてください。JSONへの入力も通常通り日本語で行ってください。"
                    })
                    asyncio.create_task(session.say("日本語に切り替えました。引き続きよろしくお願いいたします。", allow_interruptions=True))

        except Exception as e:
            logger.error(f"Error processing data channel message: {e}")

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