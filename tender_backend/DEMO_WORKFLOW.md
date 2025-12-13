# Tender Management System - Complete Workflow Demo

This document demonstrates how all components of the Tender Management System backend work together to provide a complete solution.

## Scenario: Complete Tender Analysis Workflow

Let's walk through a complete workflow from user registration to receiving analysis results via Telegram.

### Step 1: System Initialization

```bash
# Navigate to the project directory
cd tender_backend/tender_drf

# Run the initialization script
python setup_project.py

# Activate the virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Run the server
python run_server.py
```

### Step 2: User Registration and Login

#### 2.1 Register a New User
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_broker",
    "password": "secure_password123",
    "email": "john@broker.com",
    "first_name": "John",
    "last_name": "Broker",
    "role": "broker"
  }'
```

Response:
```json
{
  "token": "abcd1234efgh5678ijkl9012mnop3456qrst7890",
  "user_id": 2,
  "username": "john_broker",
  "role": "broker"
}
```

#### 2.2 Login as Admin User
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

Response:
```json
{
  "token": "xyz9876wvu5432tsrq1098ponm7654lkji3210",
  "user_id": 1,
  "username": "admin",
  "role": "admin",
  "xt_tokens": 100,
  "uzex_tokens": 100
}
```

### Step 3: Assign Broker to Admin

As an admin, assign the broker to your account:
```bash
curl -X PUT http://127.0.0.1:8000/api/users/2/ \
  -H "Authorization: Token xyz9876wvu5432tsrq1098ponm7654lkji3210" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": 1
  }'
```

### Step 4: Tender Analysis Process

#### 4.1 Purchase Tokens (if needed)
```bash
curl -X POST http://127.0.0.1:8000/api/tokens/purchase/ \
  -H "Authorization: Token xyz9876wvu5432tsrq1098ponm7654lkji3210" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "xt",
    "amount": 5
  }'
```

Response:
```json
{
  "message": "Successfully purchased 5 XT tokens",
  "xt_tokens": 105,
  "uzex_tokens": 100
}
```

#### 4.2 Spend Token for Analysis
```bash
curl -X POST http://127.0.0.1:8000/api/tokens/spend/ \
  -H "Authorization: Token xyz9876wvu5432tsrq1098ponm7654lkji3210" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "xt"
  }'
```

Response:
```json
{
  "message": "Successfully spent 1 XT token",
  "xt_tokens": 104,
  "uzex_tokens": 100
}
```

#### 4.3 Create New Tender Analysis
```bash
curl -X POST http://127.0.0.1:8000/api/tender-analyses/ \
  -H "Authorization: Token abcd1234efgh5678ijkl9012mnop3456qrst7890" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "xt",
    "main_url": "https://xt-xarid.uz/procedure/sample-tender",
    "status": "pending"
  }'
```

Response:
```json
{
  "id": "analysis_001",
  "user": 2,
  "platform": "xt",
  "status": "pending",
  "outcome": "active",
  "analysis_date": "2025-12-08T10:30:00Z",
  "main_url": "https://xt-xarid.uz/procedure/sample-tender",
  "error_message": null,
  "tender_data": null,
  "products": [],
  "expenses": []
}
```

#### 4.4 Update Analysis with Results
Internally, the system would:
1. Fetch tender data from the URL
2. Parse and analyze content using AI
3. Research market prices
4. Calculate expenses and bids
5. Update analysis with results

Here's how the system would update the analysis with results:
```bash
curl -X PUT http://127.0.0.1:8000/api/tender-analyses/analysis_001/update/ \
  -H "Authorization: Token abcd1234efgh5678ijkl9012mnop3456qrst7890" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "tender_data": {
      "summary": "Kompyuter jihozlari uchun tender",
      "lot_number": "LOT-2025-001",
      "tender_name": "50 dona notebook sotib olish",
      "customer_name": "Toshkent Davlat Universiteti",
      "starting_price": "50,000,000 UZS",
      "application_deadline": "2025-12-20",
      "win_probability": 75,
      "win_probability_reasoning": "Boshlang\'ich narx bozor narxidan 15% past, texnik talablar juda spesifik bo\'lgani uchun raqobatchilar soni kam",
      "broker_name": "John Doe"
    },
    "products": [
      {
        "name": "HP Pavilion 15 Laptop",
        "quantity": "50 dona",
        "description": "15.6-inch FHD IPS display, Intel Core i5, 16GB RAM, 512GB SSD",
        "price": "1,000,000 UZS",
        "found_market_price": "950000.00",
        "final_bid_price": "900000.00",
        "image_url": "https://example.com/laptop.jpg",
        "dimensions": "35.5 x 24.2 x 1.8 cm",
        "weight": "1.8 kg",
        "voltage": "19V DC"
      }
    ],
    "expenses": [
      {
        "name": "Yetkazish xizmati",
        "amount": "2000000",
        "is_percentage": false
      },
      {
        "name": "Bank to\'lovi",
        "amount": "3",
        "is_percentage": true
      }
    ]
  }'
```

Response:
```json
{
  "id": "analysis_001",
  "user": 2,
  "platform": "xt",
  "status": "completed",
  "outcome": "active",
  "analysis_date": "2025-12-08T10:30:00Z",
  "main_url": "https://xt-xarid.uz/procedure/sample-tender",
  "error_message": null,
  "tender_data": {
    "id": 1,
    "summary": "Kompyuter jihozlari uchun tender",
    "lot_number": "LOT-2025-001",
    "tender_name": "50 dona notebook sotib olish",
    "customer_name": "Toshkent Davlat Universiteti",
    "starting_price": "50,000,000 UZS",
    "application_deadline": "2025-12-20",
    "win_probability": 75,
    "win_probability_reasoning": "Boshlang'ich narx bozor narxidan 15% past, texnik talablar juda spesifik bo'lgani uchun raqobatchilar soni kam",
    "broker_name": "John Doe"
  },
  "products": [
    {
      "id": 1,
      "name": "HP Pavilion 15 Laptop",
      "quantity": "50 dona",
      "description": "15.6-inch FHD IPS display, Intel Core i5, 16GB RAM, 512GB SSD",
      "price": "1,000,000 UZS",
      "image_url": "https://example.com/laptop.jpg",
      "dimensions": "35.5 x 24.2 x 1.8 cm",
      "weight": "1.8 kg",
      "voltage": "19V DC",
      "search_query": null,
      "found_market_price": "950000.00",
      "source_url": null,
      "source_name": null,
      "final_bid_price": "900000.00",
      "specifications": []
    }
  ],
  "expenses": [
    {
      "id": 1,
      "name": "Yetkazish xizmati",
      "amount": "2000000",
      "is_percentage": false
    },
    {
      "id": 2,
      "name": "Bank to\'lovi",
      "amount": "3",
      "is_percentage": true
    }
  ]
}
```

#### 4.5 Update Analysis Outcome
After participating in the tender:
```bash
curl -X POST http://127.0.0.1:8000/api/tender-analyses/analysis_001/outcome/ \
  -H "Authorization: Token abcd1234efgh5678ijkl9012mnop3456qrst7890" \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": "won"
  }'
```

Response:
```json
{
  "message": "Analysis outcome updated successfully"
}
```

### Step 5: View Statistics

#### 5.1 Get Tender Statistics
```bash
curl -X GET http://127.0.0.1:8000/api/statistics/ \
  -H "Authorization: Token abcd1234efgh5678ijkl9012mnop3456qrst7890"
```

Response:
```json
{
  "total_analyses": 1,
  "completed_analyses": 1,
  "won_analyses": 1,
  "lost_analyses": 0,
  "skipped_analyses": 0,
  "win_rate": 100.0,
  "platform_distribution": {
    "xt": 1,
    "uzex": 0
  },
  "outcome_distribution": [
    {
      "name": "Won",
      "value": 1
    },
    {
      "name": "Lost",
      "value": 0
    },
    {
      "name": "Skipped",
      "value": 0
    }
  ]
}
```

### Step 6: Token Transaction History

#### 6.1 View Token Transactions
```bash
curl -X GET http://127.0.0.1:8000/api/tokens/transactions/ \
  -H "Authorization: Token abcd1234efgh5678ijkl9012mnop3456qrst7890"
```

Response:
```json
[
  {
    "id": 1,
    "user": 1,
    "platform": "xt",
    "transaction_type": "purchase",
    "amount": 5,
    "timestamp": "2025-12-08T10:15:00Z",
    "description": "Purchased 5 XT tokens"
  },
  {
    "id": 2,
    "user": 1,
    "platform": "xt",
    "transaction_type": "spend",
    "amount": 1,
    "timestamp": "2025-12-08T10:30:00Z",
    "description": "Spent 1 XT token for analysis"
  }
]
```

### Step 7: Telegram Notification

When an analysis is completed, the system can send a notification via Telegram:
```python
from telegram_integration import TelegramNotifier

notifier = TelegramNotifier("YOUR_TELEGRAM_BOT_TOKEN")

analysis_data = {
    "main_url": "https://xt-xarid.uz/procedure/sample-tender",
    "tender_data": {
        "tender_name": "50 dona notebook sotib olish",
        "lot_number": "LOT-2025-001",
        "customer_name": "Toshkent Davlat Universiteti",
        "starting_price": "50,000,000 UZS",
        "win_probability": 75
    },
    "products": [
        {
            "name": "HP Pavilion 15 Laptop",
            "quantity": "50 dona",
            "found_market_price": "950000.00"
        }
    ]
}

result = notifier.send_tender_analysis_notification("USER_TELEGRAM_CHAT_ID", analysis_data)
print(f"Notification sent: {result}")
```

Telegram message:
```
🔔 Yangi Tender Tahlili Yakunlandi

Tender nomi: 50 dona notebook sotib olish
Lot raqami: LOT-2025-001
Buyurtmachi: Toshkent Davlat Universiteti
Boshlang'ich narx: 50,000,000 UZS

G'oliblik ehtimoli: 75%

Mahsulotlar:
• HP Pavilion 15 Laptop (50 dona) - Bozor narxi: 950000.00

Batafsil ko'rish: https://xt-xarid.uz/procedure/sample-tender
```

## Conclusion

This workflow demonstrates the complete functionality of the Tender Management System backend:

1. **User Management**: Registration, authentication, and role-based access
2. **Token System**: Purchase, spending, and transaction tracking
3. **Tender Analysis**: Creation, processing, and result storage
4. **Statistics**: Win/loss tracking and performance metrics
5. **Notifications**: Real-time updates via Telegram

The system is designed to be scalable, secure, and extensible, providing a solid foundation for tender management operations.