import requests
import json

# Test the fixed API endpoint
url = "http://127.0.0.1:8000/api/product-price/"

# Sample product data with a simpler name
product_data = {
    "product": {
        "name": "Кўтариш платформаси",
        "quantity": "1 дона",
        "specifications": [
            {"key": "Товар коди", "value": "28.22.11.190_00004"}
        ]
    }
}

# Make the request
try:
    response = requests.post(url, json=product_data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success! Response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print("Error response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")