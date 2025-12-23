# Script to fix f-string issues in narx.py

# Read the file
with open('tender_backend/tender_drf/tender_app/narx.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the problematic f-string line
content = content.replace(
    '        print(f"✅ {len(links)} ta sayt topildi. Chuqur tahlil boshlandi...\\n")',
    '        print("✅ {} ta sayt topildi. Chuqur tahlil boshlandi...\\n".format(len(links)))'
)

# Write the fixed content back to the file
with open('tender_backend/tender_drf/tender_app/narx.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed the f-string issue in narx.py")