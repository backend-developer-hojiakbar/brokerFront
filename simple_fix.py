# Simple script to fix the f-string issue
with open('tender_backend/tender_drf/tender_app/narx.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 466 (0-indexed as 465)
if 'print(f"✅ {len(links)} ta sayt topildi. Chuqur tahlil boshlandi...\\n")' in lines[465]:
    lines[465] = '        print("✅ {} ta sayt topildi. Chuqur tahlil boshlandi...\\n".format(len(links)))\n'

# Write back to file
with open('tender_backend/tender_drf/tender_app/narx.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Successfully fixed the f-string issue!")