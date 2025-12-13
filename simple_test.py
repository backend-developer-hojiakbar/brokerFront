import requests
import json

# Simple test with minimal product data
product_data = {
    "product": {
        "name": "Yuqori bosimli yuvish mashinasi"
    }
}

url = "http://127.0.0.1:8000/api/product-price/"
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, headers=headers, json=product_data)
    print("Status Code:", response.status_code)
    result = response.json()
    print("Success:", result.get('success', False))
    if result.get('success'):
        best_price = result['best_price']
        print(f"Eng arzon narx: {best_price['price']:,} {best_price['currency']}")
        print(f"Do'kon: {best_price['shop']}")
        print(f"Havola: {best_price['link']}")
    else:
        print("Xatolik:", result.get('error', 'Noma\'lum xatolik'))
except Exception as e:
    print("Xatolik:", str(e))