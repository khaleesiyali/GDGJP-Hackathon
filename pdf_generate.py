import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter
import os

# 注册支持日文的字体 (你需要准备一个 .ttf 字体文件，比如 Windows 自带的 msmincho.ttf)
font_path = os.path.join("Font", "NotoSansJP-Medium.ttf")
try:
    pdfmetrics.registerFont(TTFont('NotoSans', font_path))
    print("✅ Noto Sans 字体注册成功")
except Exception as e:
    print(f"❌ 字体加载失败: {e}")

def convert_to_jp_era(year, month, day):
    """将西历转换为和历 (黑客松简易版)"""
    y, m, d = int(year), int(month), int(day)
    if y >= 2019: # 严格来说是 2019年5月1日之后是令和
        return "R", str(y - 2018)  # Reiwa
    elif y >= 1989:
        return "H", str(y - 1988)  # Heisei (平成)
    else:
        return "S", str(y - 1925)  # Showa

def fill_pdf_data(user_answers_path, mapping_json_path, transparent_pdf_path="transparent_text.pdf"):
    # 1. 读取两份字典
    with open(user_answers_path, 'r', encoding='utf-8') as f:
        answers = json.load(f)["answers"]
    
    with open(mapping_json_path, 'r', encoding='utf-8') as f:
        mapping = json.load(f)["mapping"]
        
    # 2. 准备一张透明的画布 (Canvas)
    c = canvas.Canvas(transparent_pdf_path)
    c.setFont('NotoSans', 10) 
    
    # 3. ⭐️ 必须调用你的引擎！不然什么都不会画！
    smart_fill_pdf(answers, mapping, c)
    
    # 4. ⭐️ 必须保存！生成透明的文字层
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
                
            # 1. 普通文本
            if isinstance(rule, dict) and rule.get("type") == "text" and value:
                c.drawString(rule["x"], rule["y"], str(value))
                
            # 2. 日期拆分 (需要算平成/令和的复杂逻辑)
            elif rule.get("type") == "date_split" and value:
                year, month, day = value.split("-")
                era_code, jp_year = convert_to_jp_era(year, month, day)
                c.drawString(rule["year"]["x"], rule["year"]["y"], jp_year)
                # ... 省略月、日、圈圈的绘制 ...

            # ⭐️ 3. 新增：单字拆分 (完美应对 12 位个人番号、邮编等格子)
            elif rule.get("type") == "char_split" and value:
                # 把用户传来的 "123456789012" 转成字符串，防止报错
                str_value = str(value) 
                start_x = rule["start_x"]
                spacing_x = rule["spacing_x"]
                y = rule["y"]
                
                # 遍历这串数字，挨个画进格子里
                for i, char in enumerate(str_value):
                    current_x = start_x + (i * spacing_x)
                    c.drawString(current_x, y, char)
                    print(f"📍 画入单字: {char} 在坐标 (x:{current_x}, y:{y})")

            # 4. 单选画圈
            elif rule.get("type") == "boolean_circle" and value or rule.get("type")=="boolean_check" and value:
                if value in rule.get("options", {}):
                    cx = rule["options"][value]["x"]
                    cy = rule["options"][value]["y"]
                    c.circle(cx, cy, 10, stroke=1, fill=0)

            # 5. 最新追加：不规则单字拆分 (专治区役所瞎排版的格子)
            elif rule.get("type") == "char_split_irregular" and value:
                str_value = str(value)
                x_coords = rule.get("x_coords", [])
                y = rule["y"]
                
                # 遍历这串字符（比如 "ワセダタロウ"）
                for i, char in enumerate(str_value):
                    # 安全机制：防止用户的名字太长，超出了你量出来的格子数量
                    if i < len(x_coords): 
                        current_x = x_coords[i]
                        c.drawString(current_x, y, char)
                        print(f"📍 画入不规则单字: {char} 在坐标 (x:{current_x}, y:{y})")
                    else:
                        print(f"⚠️ 警告：名字太长，超出了格子限制！丢弃字符: {char}")
    process_node(answers, mapping)

def merge_pdfs(blank_form_path, text_layer_path, final_output_path):
    """将透明文字层，像印章一样盖在空白表格上，生成最终的全新 PDF"""
    # 读取原始空白表格
    original_pdf = PdfReader(blank_form_path)
    # 读取我们刚画好的透明文字层
    text_pdf = PdfReader(text_layer_path)
    
    writer = PdfWriter()
    
    # 假设只有一页，把文字层合并到底图的第一页上
    original_page = original_pdf.pages[0]
    text_page = text_pdf.pages[0]
    original_page.merge_page(text_page)
    
    writer.add_page(original_page)
    
    # ⭐️ 输出为一个全新的 PDF，绝不破坏原文件！
    with open(final_output_path, "wb") as f:
        writer.write(f)
    print(f"🎉 大功告成！最终生成的申请表已保存为: {final_output_path}")

    

# 运行测试
if __name__ == "__main__":
    # 把刚才生成的 result.json 的名字替换到这里
    fill_pdf_data("result_52060887.json", "mock_Mapping.json", "transparent_text.pdf")
    merge_pdfs("blank_form.pdf", "transparent_text.pdf", "Final_Filled_Application.pdf")