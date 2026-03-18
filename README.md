**Vision.py**
1. load_form_from_db(form_id: str)

Role: The Database Fetcher.

What it does: It takes the form ID the AI guessed (e.g., "心身障碍者福祉手当認定申請書") and opens the corresponding JSON template (like 心身障碍者福祉手当認定申請書.json) so the AI knows what questions it needs to ask.

2. __init__(self) (Inside the FormAgent class)

Role: The Greeter 

What it does: This sets up the AI's initial personality when the user first connects. At this stage, the AI has no form loaded; it simply greets the user and asks, "Do you want to fill out a new form, or check your past files?".

3. start_form_filling(self, form_type: str)

Role: The Mode Switcher (Semantic Router).

What it does: This is a tool the AI triggers when it realizes the user wants to fill out a form. It loads the blank fields from your JSON schema, generates a strict new set of rules (the Prompt), and instantly transforms the AI from a general "receptionist" into a strict but polite "form-filling assistant".

4. open_my_files(self)

Role: The Frontend Navigator.

What it does:  If the user asks to see their history, the AI triggers this. Right now it just prints a log, but eventually, you will add a line of code here to send a signal to frontend to redirect the app to the My Files screen.

5. submit_form_data(self, updated_json_string: str)

Role: The Data Saver.

What it does: Once the AI has successfully collected all the answers and gotten the verbal signature, it bundles the data into a clean JSON string, generates a unique ID, and saves it to your computer as result_xxxx.json.

6. entrypoint(ctx: JobContext)

Role: The Engine Starter.

What it does: This is the main switch that turns everything on. It connects to the LiveKit room, equips the AI with STT (Ears), LLM (Brain), and TTS (Mouth), sets the speaking speed and patience level (VAD), and triggers the very first "Hello" message.



**pdf_generate.py**
1. convert_to_jp_era(year, month, day)

Role: The Date Translator.

What it does: Japanese government forms usually require the traditional calendar (Reiwa, Heisei, Showa). This simple math function converts standard Western years (like 2026) into the correct Japanese format.

2. fill_pdf_data(user_answers_path, mapping_json_path, ...)

Role: The Print Manager.

What it does: It opens the user's answers and your coordinate map (mock_Mapping.json). Then, it creates a completely transparent, invisible PDF "canvas" and hands it over to the drawing engine.

3. smart_fill_pdf(answers, mapping, c)

Role: The Core Drawing Engine.

What it does: This is the heavy lifter. It matches the user's answers to the exact X and Y coordinates on your map. It knows how to draw regular text, split dates into separate boxes, draw circles for checkboxes, and even split long names into irregular little grids.

4. merge_pdfs(blank_form_path, text_layer_path, final_output_path)

Role: The Stamper.

What it does: It takes the transparent canvas full of text that you just drew, and acts like a physical rubber stamp, pressing it perfectly over the original, blank Ward Office PDF to create the final, complete document.



**server.py**
- Connecting Frontend to Backend. Generate token for livekit API keys

**blank_form**
- Contain the PDF (Forms) we use and perform testing on.

**心身障害者福祉手当認定申請書.json**
- The original version of Agent JSON we will use to get user information

**心身障害者福祉手当認定申請書_Mapping.json**
- The JSON we will use to map and draw the PDF

result_f996172
- User info for demo

what will be generated:
- transparent_text.pdf
    - A layer PDF containing all the answer
- Final_Filled_Application.pdf
