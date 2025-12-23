# Local test to verify narx.py fixes
import sys
import os

# Add the tender_backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'tender_backend'))

# Try to import and test the narx module
try:
    from tender_drf.tender_app.narx import UltraScanner
    print("Successfully imported UltraScanner!")
    
    # Check if there are any syntax errors
    import ast
    with open('tender_backend/tender_drf/tender_app/narx.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try to parse the file
    try:
        ast.parse(content)
        print("No syntax errors found in narx.py!")
    except SyntaxError as e:
        print(f"Syntax error in narx.py: {e}")
        
except Exception as e:
    print(f"Error importing UltraScanner: {e}")