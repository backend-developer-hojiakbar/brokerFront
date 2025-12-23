#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Demonstration script for enhanced multilingual product search functionality
"""

import sys
import os

# Add the tender_backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'tender_backend'))

def demonstrate_multilingual_search():
    """Demonstrate the enhanced multilingual search functionality"""
    try:
        from tender_drf.tender_app.narx import UltraScanner
        
        # Create an instance of UltraScanner
        scanner = UltraScanner()
        
        print("🔍 ENHANCED MULTILINGUAL PRODUCT SEARCH DEMONSTRATION")
        print("=" * 60)
        print("This demonstration shows how the system can search for products")
        print("using terms in different languages (Uzbek, Russian, English)")
        print("=" * 60)
        
        # Test cases representing products in different languages
        test_products = [
            {
                "name": "смартфон Samsung Galaxy",
                "description": "Смартфон с Android, 128 ГБ памяти",
                "language": "Russian"
            },
            {
                "name": "smartphone iPhone 15",
                "description": "Latest Apple smartphone with iOS",
                "language": "English"
            },
            {
                "name": "telefon Xiaomi Redmi",
                "description": "Android smartphone, 64 GB xotira",
                "language": "Uzbek (Latin)"
            },
            {
                "name": "ноутбук Lenovo ThinkPad",
                "description": "Ноутбук для бизнеса, Intel Core i7",
                "language": "Russian"
            },
            {
                "name": "laptop MacBook Pro",
                "description": "Apple laptop for professionals",
                "language": "English"
            },
            {
                "name": "планшет iPad Air",
                "description": "Планшет от Apple с экраном 10.9 дюймов",
                "language": "Russian"
            }
        ]
        
        # Demonstrate translation functionality for each product
        for i, product in enumerate(test_products, 1):
            print(f"\n{i}. Testing {product['language']} product: '{product['name']}'")
            print(f"   Description: {product['description']}")
            
            # Generate translated terms
            translated_terms = scanner.get_translated_terms(product['name'])
            print(f"   Generated {len(translated_terms)} search terms including:")
            
            # Show examples of translated terms
            examples = translated_terms[:8]  # Show first 8 terms
            for j, term in enumerate(examples, 1):
                print(f"     {j}. {term}")
            
            if len(translated_terms) > 8:
                print(f"     ... and {len(translated_terms) - 8} more terms")
        
        print("\n" + "=" * 60)
        print("🎯 KEY FEATURES OF ENHANCED SEARCH:")
        print("1. Automatic language detection")
        print("2. Translation between Uzbek (Latin/Cyrillic), Russian, and English")
        print("3. Context-aware search term generation")
        print("4. Location-specific modifiers (Tashkent/Toshkent)")
        print("5. Product category specific terms")
        print("6. Multi-query approach for better coverage")
        print("=" * 60)
        
        print("\n💡 BENEFITS:")
        print("• Users can search in their preferred language")
        print("• Higher chance of finding relevant products")
        print("• Better search results across different websites")
        print("• More accurate price comparison")
        
        print("\n🚀 The system is now ready to handle multilingual product searches!")
        
        # Close the scanner
        scanner.close()
        
    except Exception as e:
        print(f"Error demonstrating multilingual search functionality: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    demonstrate_multilingual_search()