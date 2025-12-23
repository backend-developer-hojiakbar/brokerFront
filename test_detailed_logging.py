#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script to verify detailed logging functionality
"""

import requests
import json

# Test the enhanced API endpoint with detailed logging
url = "http://localhost:8000/api/product-price/"  # Using localhost for testing

# Simple test product
test_product = {
    "product": {
        "name": "смартфон Samsung",
        "specifications": [{"key": "Brand", "value": "Samsung"}]
    }
}

print("🔍 TESTING DETAILED LOGGING FUNCTIONALITY")
print("=" * 50)

try:
    print(f"Sending request for product: {test_product['product']['name']}")
    response = requests.post(url, json=test_product, timeout=60)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Success! Check the backend console for detailed logs.")
        print(f"Product name: {data.get('product_name', 'N/A')}")
        print(f"Search variants: {len(data.get('search_variants', []))}")
        if 'best_price_overall' in data:
            best = data['best_price_overall']
            print(f"Best price: {best['price']} {best['currency']} from {best['shop']}")
        if 'results_by_language' in data:
            print(f"Languages covered: {list(data['results_by_language'].keys())}")
    else:
        print("❌ Error:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        
except Exception as e:
    print(f"⚠️ Request failed: {e}")

print("\n" + "=" * 50)
print("💡 To see detailed logs:")
print("1. Check the browser console (F12 Developer Tools)")
print("2. Check the Django backend console/logs")
print("3. Look for emoji-marked log entries")
print("=" * 50)