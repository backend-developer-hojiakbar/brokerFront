#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script to verify price display functionality
"""

import requests
import json

# Test the price display with a sample product
test_product = {
    "product": {
        "name": "Цилиндр опрокидывающего механизма",
        "specifications": [
            {"key": "Brand", "value": "Sample Brand"},
            {"key": "Model", "value": "SM-123"}
        ]
    }
}

print("🔍 TESTING PRICE DISPLAY FUNCTIONALITY")
print("=" * 50)

try:
    # Send request to the product price API
    url = "http://localhost:8000/api/product-price/"
    response = requests.post(url, json=test_product, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ API Response:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        # Check if we have the expected fields
        if data.get('success') and data.get('best_price'):
            price = data['best_price'].get('price')
            print(f"💰 Found price: {price}")
        elif data.get('success') and data.get('best_per_language'):
            # Get the cheapest price from any language
            best_price = None
            for lang, price_data in data['best_per_language'].items():
                if isinstance(price_data, dict) and 'price' in price_data:
                    if best_price is None or price_data['price'] < best_price:
                        best_price = price_data['price']
            
            if best_price is not None:
                print(f"💰 Best multilingual price: {best_price}")
            else:
                print("❌ No valid price found in multilingual results")
        else:
            print("⚠️ Unexpected response format")
    else:
        print(f"❌ API Error: {response.text}")

except Exception as e:
    print(f"💥 Error during test: {str(e)}")

print("\n🏁 Test completed")