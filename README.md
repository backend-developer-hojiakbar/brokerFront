<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Q8JrtG27aDqIgG8FBj9vszJbninH_Tvj

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend Setup

1. Navigate to the backend directory:
   `cd tender_backend/tender_drf`
2. Install Python dependencies:
   `pip install -r requirements.txt`
3. Run Django migrations:
   `python manage.py migrate`
4. Start the Django server:
   `python manage.py runserver`

## New Product Price Search Feature

This app now includes an advanced product price search feature that automatically finds the best prices for products by scraping the web. When you click the "Qayta qidirish" (Search again) button in the Tender Details view, the system will:

1. Generate a comprehensive search query based on the product name, specifications, and other details
2. Search the web for the product using advanced scraping techniques
3. Extract the best (lowest) price found
4. Display the price along with the source URL

The system now sends detailed product information to improve search accuracy:
- Product name
- Specifications (author, brand, model, etc.)
- Description keywords
- Quantity information

This enhanced approach helps find more accurate pricing for specific products like books, electronics, and other specialized items.

For more details about this feature, see [PRODUCT_PRICE_FEATURE.md](PRODUCT_PRICE_FEATURE.md).