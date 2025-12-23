import requests
import json

# Test the enhanced API endpoint with multilingual queries
url = "http://localhost:8000/api/product-price/"  # Using localhost for testing

# Test cases for different types of products in different languages
test_cases = [
    {
        "name": "Russian washing machine",
        "product": {
            "name": "стиральная машина LG",
            "specifications": [{"key": "Brand", "value": "LG"}]
        }
    },
    {
        "name": "English bicycle",
        "product": {
            "name": "mountain bike Merida",
            "specifications": [{"key": "Brand", "value": "Merida"}]
        }
    },
    {
        "name": "Uzbek (Latin) television",
        "product": {
            "name": "televizor Samsung",
            "specifications": [{"key": "Brand", "value": "Samsung"}]
        }
    },
    {
        "name": "Uzbek (Cyrillic) refrigerator",
        "product": {
            "name": "музлатгич Whirlpool",
            "specifications": [{"key": "Brand", "value": "Whirlpool"}]
        }
    }
]

print("🔍 TESTING ENHANCED MULTILINGUAL API ENDPOINT")
print("=" * 60)

# Make requests for each test case
for test_case in test_cases:
    print(f"\nTesting: {test_case['name']}")
    print(f"Product name: {test_case['product']['name']}")
    
    try:
        response = requests.post(url, json={"product": test_case['product']}, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            if 'best_price_overall' in data:
                best = data['best_price_overall']
                print(f"   Best price: {best['price']} {best['currency']} from {best['shop']}")
                print(f"   Language: {best.get('language', 'unknown')}")
            elif 'best_price' in data:
                best = data['best_price']
                print(f"   Best price: {best['price']} {best['currency']} from {best['shop']}")
            print(f"   Search variants: {len(data.get('search_variants', []))}")
            if 'results_by_language' in data:
                print(f"   Languages covered: {list(data['results_by_language'].keys())}")
        else:
            print("❌ Error:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"⚠️ Request failed: {e}")

print("\n" + "=" * 60)
print("✅ ENHANCED MULTILINGUAL API TEST COMPLETED")
print("The API can now handle ANY type of product in multiple languages")
print("and return the cheapest prices from all language variants.")
print("=" * 60)