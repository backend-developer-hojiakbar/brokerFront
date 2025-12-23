import requests
import json

# Test the enhanced API endpoint with multilingual queries
url = "http://localhost:8000/api/product-price/"  # Using localhost for testing

# Test cases in different languages
test_cases = [
    {
        "name": "Russian smartphone",
        "product": {
            "name": "смартфон",
            "specifications": [{"key": "Brand", "value": "Samsung"}]
        }
    },
    {
        "name": "English laptop",
        "product": {
            "name": "laptop",
            "specifications": [{"key": "Brand", "value": "Lenovo"}]
        }
    },
    {
        "name": "Uzbek (Latin) phone",
        "product": {
            "name": "telefon",
            "specifications": [{"key": "Brand", "value": "iPhone"}]
        }
    },
    {
        "name": "Uzbek (Cyrillic) tablet",
        "product": {
            "name": "планшет",
            "specifications": [{"key": "Brand", "value": "iPad"}]
        }
    }
]

# Make requests for each test case
for test_case in test_cases:
    print(f"\nTesting: {test_case['name']}")
    print(f"Product name: {test_case['product']['name']}")
    
    try:
        response = requests.post(url, json=test_case, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Success!")
            if 'best_price' in data:
                best = data['best_price']
                print(f"Best price: {best['price']} {best['currency']} from {best['shop']}")
            print(f"Search query used: {data.get('search_query', 'N/A')}")
        else:
            print("Error:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Request failed: {e}")

print("\nMultilingual API test completed!")