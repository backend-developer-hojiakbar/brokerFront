# Product Price Search Feature

This document explains the new product price search feature that integrates the `narx.py` module into the Django backend and frontend.

## Overview

The feature allows users to search for product prices automatically by integrating with the UltraScanner class from `narx.py`. When a user clicks the "Qayta qidirish" (Search again) button in the Tender Details view, the system will:

1. Generate a comprehensive search query based on the product name, specifications, and other details
2. Use the UltraScanner to search the web for the product
3. Extract the best (lowest) price found
4. Display the price along with the source URL

## Backend Implementation

### 1. API Endpoint

A new API endpoint has been added:
- **URL**: `/api/product-price/`
- **Method**: POST
- **Authentication**: Token-based (same as other endpoints)
- **Request Body**: 
  ```json
  {
    "product": {
      "name": "Product name",
      "description": "Product description (optional)",
      "specifications": [
        {"key": "Specification name", "value": "Specification value"}
      ],
      "quantity": "Product quantity (optional)"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "product_name": "Валида Мадиярова АРХАИЗМЛАР ТАРЖИМАСИДА ЛИНГВОМАДАНИЙ ВА ЛИНГВОКОГНИТИВ ХУСУСИЯТЛАР РЕПЕРЗЕНТАЦИЯСИ",
    "search_query": "Валида Мадиярова АРХАИЗМЛАР ТАРЖИМАСИДА ЛИНГВОМАДАНИЙ ВА ЛИНГВОКОГНИТИВ ХУСУСИЯТЛАР РЕПЕРЗЕНТАЦИЯСИ Валида Мадиярова narxi Toshkentda",
    "best_price": {
      "shop": "OLX.UZ",
      "price": 15000000,
      "original_price": 15000000,
      "currency": "UZS",
      "link": "https://olx.uz/item/iphone-15-pro",
      "method": "Text Search (Assumed UZS)"
    },
    "all_results": [...]
  }
  ```

### 2. Dependencies

The following dependencies were added to `requirements.txt`:
- selenium==4.15.0
- beautifulsoup4==4.12.2
- webdriver-manager==4.0.1
- ddgs==9.9.3

## Frontend Implementation

### 1. API Service

A new function was added to `apiService.ts`:
```typescript
productPriceApi.getPrice(product: { name: string; description?: string; specifications?: { key: string; value: string }[]; quantity?: string })
```

### 2. Integration with TenderWorkspace

The `handleFindPrice` function in `TenderWorkspace.tsx` was updated to:
1. Send detailed product information to the new product price API
2. Fall back to the original Serper search method if the API fails

### 3. Enhanced Search Query Generation

The backend now creates more targeted search queries by:
1. Using the product name as the base
2. Including important specifications like brand, model, author, etc.
3. Adding relevant keywords from the product description
4. Appending "narxi Toshkentda" to localize the search

### 4. User Interface

When users click the "Qayta qidirish" button:
1. A loading indicator is shown
2. The system searches for the product price using enhanced search criteria
3. Results are displayed with the source URL
4. Success or error messages are shown via toast notifications

## How to Test

1. Start the Django backend server
2. Start the React frontend
3. Navigate to a tender analysis with products
4. Click the "Qayta qidirish" button next to a product with "Narx topilmadi"
5. Observe the loading indicator and then the price result

## Example Use Case

For a product with the following details:
- Name: "Валида Мадиярова АРХАИЗМЛАР ТАРЖИМАСИДА ЛИНГВОМАДАНИЙ ВА ЛИНГВОКОГНИТИВ ХУСУСИЯТЛАР РЕПЕРЗЕНТАЦИЯСИ"
- Specifications: Author="Валида Мадиярова", Pages="144 бет", Cover="Қаттиқ муқова", Year="2025"
- Description: "Монография 144 бет қаттиқ муқова 2025 йил китоб нархи Тошкентда"

The system will generate a search query like:
"Валида Мадиярова АРХАИЗМЛАР ТАРЖИМАСИДА ЛИНГВОМАДАНИЙ ВА ЛИНГВОКОГНИТИВ ХУСУСИЯТЛАР РЕПЕРЗЕНТАЦИЯСИ Валида Мадиярова narxi Toshkentda"

This enhanced query helps the system find more accurate pricing information for specific products.

## Troubleshooting

### Common Issues

1. **ChromeDriver not found**: Make sure Chrome is installed on the system
2. **Timeout errors**: The search may take time, especially on slower connections
3. **No prices found**: Some products may be too specific or rare to find prices for

### Solutions

1. Install Chrome browser if not already installed
2. Check internet connectivity
3. Try searching for more common products to test the functionality

## Future Improvements

1. Add caching mechanism to avoid repeated searches for the same product
2. Improve error handling and user feedback
3. Add support for image-based searches
4. Implement price history tracking