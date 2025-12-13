import requests
import json

# Define the product data with full specifications
product_data = {
    "product": {
        "name": "Yuqori bosimli yuvish mashinasi",
        "description": "Performance 900 l/h, Working pressure 250 bar, Power 6 kW, Fuel tank volume 25 l, Electrical parameters 3/ph. 400/V. 50/Hz, Cleaning agent tanks volume 20 l, High-pressure hose 20 m, Jet tube 1050 mm, Dimensions 1330 x 750 x 1060 mm, Weight 164 kg",
        "specifications": [
            {"key": "Performance", "value": "900 l/h"},
            {"key": "Working pressure", "value": "250 bar"},
            {"key": "Power", "value": "6 kW"},
            {"key": "Fuel tank volume", "value": "25 l"},
            {"key": "Electrical parameters", "value": "3/ph. 400/V. 50/Hz"},
            {"key": "Cleaning agent tanks volume", "value": "20 l"},
            {"key": "High-pressure hose", "value": "20 m"},
            {"key": "Jet tube", "value": "1050 mm"},
            {"key": "Dimensions", "value": "1330 x 750 x 1060 mm"},
            {"key": "Weight", "value": "164 kg"}
        ]
    }
}

# Send request to the API without authentication
url = "http://127.0.0.1:8000/api/product-price/"
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, headers=headers, json=product_data)
    print("Status Code:", response.status_code)
    result = response.json()
    print("Response:", json.dumps(result, indent=2, ensure_ascii=False))
    
    if result.get('success'):
        print("\n=== MAHSULOT HAQIDA MA'LUMOT ===")
        print(f"Mahsulot nomi: {result['product_name']}")
        print(f"Qidiruv so'rovi: {result['search_query']}")
        print("\n=== ENG ARZON NARX ===")
        best_price = result['best_price']
        print(f"Do'kon: {best_price['shop']}")
        print(f"Narx: {best_price['price']:,} {best_price['currency']}")
        print(f"Original narx: {best_price['original_price']} {best_price['currency']}")
        print(f"Havola: {best_price['link']}")
        print(f"Topilgan usul: {best_price['method']}")
        
        print("\n=== BARCHA NATIJALAR ===")
        for i, item in enumerate(result['all_results'], 1):
            print(f"\n{i}. {item['shop']}")
            print(f"   Narx: {item['price']:,} {item['currency']}")
            print(f"   Havola: {item['link']}")
            print(f"   Usul: {item['method']}")
    else:
        print("Xatolik:", result.get('error', 'Noma\'lum xatolik'))
        
except Exception as e:
    print("Xatolik:", str(e))