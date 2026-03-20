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
    print("✅ Noto Sans 字体注册成功")
except Exception as e:
    print(f"❌ 字体加载失败: {e}")

def convert_to_jp_era(year, month, day):
    """将西历转换为和历 (黑客松简易版)"""
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
    print(f"✅ 成功生成透明文字层: {transparent_pdf_path}")


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
                # 加个 try 防止用户没填完整的日期导致报错
                try:
                    year, month, day = value.split("-")
                    era_code, jp_year = convert_to_jp_era(year, month, day)
                    
                    # 1. 画年
                    if "year" in rule:
                        c.drawString(rule["year"]["x"], rule["year"]["y"], jp_year)
                    # 2. 画月
                    if "month" in rule:
                        c.drawString(rule["month"]["x"], rule["month"]["y"], month)
                    # 3. 画日
                    if "day" in rule:
                        c.drawString(rule["day"]["x"], rule["day"]["y"], day)
                        
                    # 4. 画元号圈圈 (era)
                    if "era" in rule and "options" in rule["era"] and era_code in rule["era"]["options"]:
                        cx = rule["era"]["options"][era_code]["x"]
                        cy = rule["era"]["options"][era_code]["y"]
                        c.circle(cx, cy, 10, stroke=1, fill=0)
                except Exception as e:
                    print(f"⚠️ 日期解析出错: {value}, 错误信息: {e}")

            # 3. For space that need separate character (type = char_spilt)
            elif rule.get("type") == "char_split" and value:
                # 把用户传来的 "123456789012" 转成字符串，防止报错
                str_value = str(value) 
                start_x = rule["start_x"]
                spacing_x = rule["spacing_x"]
                y = rule["y"]
                
                # Draw each character into the boxes
                for i, char in enumerate(str_value):
                    current_x = start_x + (i * spacing_x)
                    c.drawString(current_x, y, char)
                    print(f"📍 画入单字: {char} 在坐标 (x:{current_x}, y:{y})")

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
                        print(f"📍 画入不规则单字: {char} 在坐标 (x:{current_x}, y:{y})")
                    else:
                        print(f"⚠️ 警告：名字太长，超出了格子限制！丢弃字符: {char}")
    process_node(answers, mapping)

def merge_pdfs(blank_form_path, text_layer_path, final_output_path):
    """将透明文字层，像印章一样盖在空白表格上，生成最终的全新 PDF"""
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
    print(f"🎉 大功告成！最终生成的申请表已保存为: {final_output_path}")

    

if __name__ == "__main__":
    # We need to be result json here
    fill_pdf_data("result_f996172c.json", "mock_Mapping.json", "transparent_text.pdf")
    merge_pdfs("blank_form.pdf", "transparent_text.pdf", "Final_Filled_Application.pdf")