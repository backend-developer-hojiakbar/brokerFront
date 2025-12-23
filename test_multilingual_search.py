#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for multilingual product search functionality
"""

import sys
import os

# Add the tender_backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'tender_backend'))

def test_translation_functionality():
    """Test the enhanced translation functionality"""
    try:
        from tender_drf.tender_app.narx import UltraScanner
        
        # Create an instance of UltraScanner
        scanner = UltraScanner()
        
        # Test cases in different languages
        test_cases = [
            "смартфон",  # Russian
            "smartphone",  # English
            "telefon",  # Uzbek (Latin)
            "телефон",  # Uzbek (Cyrillic)
            "ноутбук",  # Russian
            "laptop",  # English
            "noutbuk",  # Uzbek (Latin)
            "ноутбук",  # Uzbek (Cyrillic)
        ]
        
        print("Testing multilingual translation functionality...")
        print("=" * 60)
        
        for test_case in test_cases:
            print(f"\nTesting query: '{test_case}'")
            translated_terms = scanner.get_translated_terms(test_case)
            print(f"Generated {len(translated_terms)} translated terms:")
            for i, term in enumerate(translated_terms[:10]):  # Show first 10 terms
                print(f"  {i+1}. {term}")
            if len(translated_terms) > 10:
                print(f"  ... and {len(translated_terms) - 10} more terms")
        
        print("\n" + "=" * 60)
        print("Translation functionality test completed successfully!")
        
        # Close the scanner
        scanner.close()
        
    except Exception as e:
        print(f"Error testing translation functionality: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_translation_functionality()