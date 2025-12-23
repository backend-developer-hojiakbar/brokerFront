#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script to verify price details modal functionality
"""

import requests
import json

# Test the price details modal with a sample product
test_product = {
    "product": {
        "name": "Цилиндр опрокидывающего механизма",
        "specifications": [
            {"key": "Brand", "value": "Hitachi Construction Machinery Co. Ltd."},
            {"key": "Model", "value": "YA00084551"}
        ]
    }
}

print("🔍 TESTING PRICE DETAILS MODAL FUNCTIONALITY")
print("=" * 50)

try:
    # Send request to the product price API
    url = "http://localhost:8000/api/product-price/"
    response = requests.post(url, json=test_product, timeout=60)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ API Response received successfully!")
        print("📊 Response structure:")
        
        # Check if we have the expected fields for the modal
        required_fields = ['success', 'product_name', 'best_per_language', 'all_results']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
        else:
            print("✅ All required fields present")
            
            # Display summary of results
            print(f"\n📋 Product: {data['product_name']}")
            print(f"🌐 Languages with results: {len(data['best_per_language'])}")
            print(f"📈 Total results found: {len(data['all_results'])}")
            
            # Display best prices per language
            print("\n🥇 Best prices per language:")
            for language, price_data in data['best_per_language'].items():
                lang_name = {
                    'russian': 'Rus tili',
                    'uzbek_cyrillic': "O'zbekcha (krill)",
                    'uzbek_latin': "O'zbekcha (lotin)",
                    'english': 'Ingliz tili',
                    'original': 'Original til'
                }.get(language, language)
                
                print(f"  {lang_name}: {price_data['price']} {price_data['currency']} ({price_data['shop']})")
            
            # Display first few results
            print(f"\n📰 First 3 results:")
            for i, result in enumerate(data['all_results'][:3]):
                print(f"  {i+1}. {result['shop']}: {result['price']} {result['currency']}")
                print(f"     Method: {result['method']}")
                print(f"     Language: {result['language']}")
                print(f"     Link: {result['link'][:50]}...")
                
        print("\n✅ Modal should display these results correctly!")
        
    else:
        print(f"❌ API Error: {response.text}")

except Exception as e:
    print(f"💥 Error during test: {str(e)}")

print("\n🏁 Test completed")