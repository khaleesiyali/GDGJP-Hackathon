##  `Vision.py` 
This file handles the LiveKit connection and the core logic for the AI Agent's interactions.

* **`load_form_from_db(form_id: str)`**
  * **Role:**  *The Database Fetcher*
  * **What it does:** It takes the form ID the AI guessed (e.g., `"心身障碍者福祉手当認定申請書"`) and opens the corresponding JSON template so the AI knows what questions it needs to ask.

* **`__init__(self)`** *(Inside the FormAgent class)*
  * **Role:**  *The Greeter*
  * **What it does:** Sets up the AI's initial personality when the user first connects. At this stage, the AI has no form loaded; it simply greets the user and asks, *"Do you want to fill out a new form, or check your past files?"*

* **`start_form_filling(self, form_type: str)`**
  * **Role:**  *The Mode Switcher (Semantic Router)*
  * **What it does:** A tool AI triggers when it realizes the user wants to fill out a form. It loads the blank fields from your JSON schema, generates a strict new set of rules (the Prompt), and instantly transforms the AI into a strict but polite "form-filling assistant."

* **`open_my_files(self)`**
  * **Role:**  *The Frontend Navigator*
  * **What it does:** If the user asks to see their history, the AI triggers this. Right now it just prints a log, but eventually, this will send a signal to the frontend to redirect the app to the "My Files" screen.

* **`submit_form_data(self, updated_json_string: str)`**
  * **Role:**  *The Data Saver*
  * **What it does:** Once the AI has successfully collected all answers and gotten the verbal signature, it bundles the data into a clean JSON string, generates a unique ID, and saves it locally as `result_xxxx.json`.

* **`entrypoint(ctx: JobContext)`**
  * **Role:**  *The Engine Starter*
  * **What it does:** The main switch that turns everything on. It connects to the LiveKit room, equips the AI with STT (Ears), LLM (Brain), and TTS (Mouth), sets the speaking speed and patience level (VAD), and triggers the very first "Hello" message.

---

##  `pdf_generate.py` (The Physical Rendering Engine)
This file handles the mechanical rendering of extracted JSON data onto physical PDF coordinates.

* **`convert_to_jp_era(year, month, day)`**
  * **Role:**  *The Date Translator*
  * **What it does:** Converts standard Western years (like 2026) into the correct Japanese traditional calendar format (Reiwa, Heisei, Showa) required by government forms.

* **`fill_pdf_data(user_answers_path, mapping_json_path, ...)`**
  * **Role:**  *The Print Manager*
  * **What it does:** Opens the user's answers and the coordinate map (`mock_Mapping.json`). It then creates a completely transparent, invisible PDF "canvas" and hands it over to the drawing engine.

* **`smart_fill_pdf(answers, mapping, c)`**
  * **Role:**  *The Core Drawing Engine*
  * **What it does:** The heavy lifter. It matches the user's answers to the exact X and Y coordinates on the map. It can draw regular text, split dates into separate boxes, draw circles for checkboxes, and split long strings into irregular grids.

* **`merge_pdfs(blank_form_path, text_layer_path, final_output_path)`**
  * **Role:**  *The Stamper*
  * **What it does:** Takes the transparent canvas full of drawn text and acts like a physical rubber stamp, pressing it perfectly over the original, blank Ward Office PDF to create the final document.

---

##  Project Structure & Assets

| File / Folder | Description |
| :--- | :--- |
| **`server.py`** | Connects Frontend to Backend. Generates tokens for LiveKit API keys. |
| **`/blank_form/`** | Directory containing the official PDF forms used for mapping and testing. |
| **`心身障害福祉手当認定申請書.json`** | The original JSON schema used by the Agent to extract user information. |
| **`心身障害福祉手当認定申請書_Mapping.json`** | The coordinate mapping JSON used by the rendering engine to draw on the PDF. |
| **`result_f996172.json`** | Sample generated user info data used for testing/demos. |

---

##  Generated Outputs

When the pipeline completes, it generates the following files:

* **`transparent_text.pdf`**: A transparent layer PDF containing only the generated text/answers.
* **`Final_Filled_Application.pdf`**: The final, merged PDF ready for submission.
