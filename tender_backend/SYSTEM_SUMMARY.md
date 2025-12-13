# Tender Management System - Backend Implementation

## Overview

This document provides a comprehensive overview of the Django REST Framework backend implementation for the Tender Management System. The backend provides all the necessary APIs and data models to support the frontend application's functionality.

## System Architecture

The backend is built using:
- **Django 5.2.8**: Python web framework
- **Django REST Framework 3.15.2**: Toolkit for building Web APIs
- **SQLite**: Default database (can be changed to PostgreSQL/MySQL)
- **Token Authentication**: For securing API endpoints

## Core Components

### 1. Authentication System
- Custom User model extending Django's AbstractUser
- Token-based authentication for API access
- Role-based access control (Admin/Broker)

### 2. Tender Analysis Management
- Complete CRUD operations for tender analyses
- Detailed data storage for:
  - Tender information (summary, lot number, customer, etc.)
  - Product listings with specifications
  - Market price research
  - Expense calculations
  - Bid pricing
- Status tracking (pending, analyzing, pricing, completed, error)
- Outcome tracking (won, lost, skipped, active)

### 3. Contract Analysis Management
- Processing of contract documents
- Storage of contract data and terms
- Compliance checking capabilities

### 4. Token Management System
- Platform-specific tokens (XT/Xarid and Tender/UZEX)
- Purchase and spending tracking
- Transaction history

### 5. User Management
- Admin/broker role system
- Token balance tracking
- Broker-admin relationship management

### 6. Statistics and Reporting
- Tender analysis statistics
- Win/loss tracking
- Platform usage metrics

### 7. Telegram Integration
- Notification system for analysis completion
- Customizable message templates

## Data Models

### User Model
Extended from Django's AbstractUser with additional fields:
- `role`: Admin or Broker
- `xt_tokens`: Balance of XT platform tokens
- `uzex_tokens`: Balance of UZEX platform tokens
- `admin_id`: Reference to admin user (for brokers)

### TenderAnalysis Model
Main model for tender analyses:
- `id`: Primary key
- `user`: Foreign key to User
- `platform`: XT or UZEX
- `status`: Current processing status
- `outcome`: Final result tracking
- `analysis_date`: Creation timestamp
- `main_url`: Source URL
- `error_message`: Error details if failed

### Product Model
Products in tender analyses:
- `analysis`: Foreign key to TenderAnalysis
- `name`: Product name
- `quantity`: Quantity and units
- `description`: Product description
- `price`: Starting price
- `image_url`: Product image URL
- `dimensions`, `weight`, `voltage`: Physical specs
- `search_query`: Market research query
- `found_market_price`: Discovered market price
- `source_url`: Source of market price
- `final_bid_price`: Calculated bid price

### ProductSpecification Model
Technical specifications for products:
- `product`: Foreign key to Product
- `key`: Specification name
- `value`: Specification value

### TenderData Model
Detailed tender information:
- `analysis`: One-to-one with TenderAnalysis
- `summary`: Tender summary
- `lot_number`: Lot identification
- `tender_name`: Name of the tender
- `customer_name`: Customer organization
- `starting_price`: Initial price
- `application_deadline`: Submission deadline
- `win_probability`: Likelihood of winning (0-100%)
- `win_probability_reasoning`: Explanation for probability
- `broker_name`: Assigned broker

### Expense Model
Expenses for bid calculations:
- `analysis`: Foreign key to TenderAnalysis
- `name`: Expense description
- `amount`: Value or percentage
- `is_percentage`: Flag for percentage-based expenses

### ContractAnalysis Model
Contract analysis records:
- `id`: Primary key
- `user`: Foreign key to User
- `file_name`: Original file name
- `status`: Processing status
- `analysis_date`: Creation timestamp
- `error_message`: Error details if failed

### ContractData Model
Detailed contract information:
- `contract_analysis`: One-to-one with ContractAnalysis
- `summary`: Contract summary
- `customer`: Customer organization
- `supplier`: Supplier organization
- `contract_number`: Identification number
- `contract_date`: Signing date
- `subject`: Contract subject
- `total_value`: Contract value
- `warranty`: Warranty terms
- `governing_law`: Legal jurisdiction
- `force_majeure`: Force majeure clauses

### ContractParty Model
Parties involved in contracts:
- `contract_data`: Foreign key to ContractData
- `party_type`: Customer or supplier
- `name`: Party name

### ContractTerm Model
Specific terms in contracts:
- `contract_data`: Foreign key to ContractData
- `term_type`: Type of term (delivery, payment, etc.)
- `description`: Term details

### ComplianceCheck Model
Compliance verification:
- `contract_data`: One-to-one with ContractData
- `status`: Compliant/non-compliant/review needed

### ComplianceNote Model
Notes on compliance issues:
- `compliance_check`: Foreign key to ComplianceCheck
- `note`: Note content

### Recommendation Model
Business recommendations:
- `contract_data`: Foreign key to ContractData
- `recommendation`: Recommendation text

### Risk Model
Identified risks:
- `contract_data`: Foreign key to ContractData
- `risk_description`: Risk details

### TokenTransaction Model
Token usage tracking:
- `user`: Foreign key to User
- `platform`: XT or UZEX
- `transaction_type`: Purchase or spend
- `amount`: Number of tokens
- `timestamp`: When transaction occurred
- `description`: Transaction details

## API Endpoints

### Authentication
- `POST /api/auth/login/`: Login user
- `POST /api/auth/register/`: Register new user

### Users
- `GET /api/users/`: List users
- `POST /api/users/`: Create user
- `GET /api/users/{id}/`: Get user details
- `PUT /api/users/{id}/`: Update user
- `DELETE /api/users/{id}/`: Delete user

### Tender Analyses
- `GET /api/tender-analyses/`: List analyses
- `POST /api/tender-analyses/`: Create analysis
- `GET /api/tender-analyses/{id}/`: Retrieve analysis
- `PUT /api/tender-analyses/{id}/`: Update analysis
- `DELETE /api/tender-analyses/{id}/`: Delete analysis
- `PUT /api/tender-analyses/{id}/update/`: Update analysis data
- `POST /api/tender-analyses/{id}/outcome/`: Update outcome

### Contract Analyses
- `GET /api/contract-analyses/`: List analyses
- `POST /api/contract-analyses/`: Create analysis
- `GET /api/contract-analyses/{id}/`: Retrieve analysis
- `PUT /api/contract-analyses/{id}/`: Update analysis
- `DELETE /api/contract-analyses/{id}/`: Delete analysis

### Token Management
- `POST /api/tokens/purchase/`: Purchase tokens
- `POST /api/tokens/spend/`: Spend token
- `GET /api/tokens/transactions/`: List transactions

### Statistics
- `GET /api/statistics/`: Retrieve tender statistics

## Implementation Details

### Security
- Token-based authentication for all protected endpoints
- Role-based access control
- Input validation and sanitization
- Secure password handling

### Scalability
- Efficient database relationships
- Pagination support for large datasets
- Caching-ready architecture

### Extensibility
- Modular design with separate apps
- Well-defined data models
- RESTful API design principles

## Deployment

### Requirements
- Python 3.8+
- Django 5.2.8
- Django REST Framework 3.15.2
- Requests 2.31.0

### Installation Steps
1. Clone the repository
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
4. Install requirements: `pip install -r requirements.txt`
5. Run migrations: `python manage.py migrate`
6. Create superuser: `python manage.py createsuperuser`
7. Start server: `python manage.py runserver`

### Configuration
The application uses environment variables for configuration:
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `DATABASE_URL`: Database connection string (optional)

## Future Enhancements

### Planned Features
1. Email notification system
2. Advanced reporting and analytics
3. Multi-language support
4. Mobile-responsive admin interface
5. API rate limiting
6. OAuth integration
7. File storage integration (AWS S3, etc.)

### Performance Improvements
1. Database indexing optimization
2. Caching implementation
3. Asynchronous task processing
4. Query optimization
5. CDN integration for static files

## Troubleshooting

### Common Issues
1. **Migration errors**: Ensure all dependencies are installed and database is accessible
2. **Authentication failures**: Check token validity and user permissions
3. **Permission denied**: Verify user roles and object ownership
4. **Database connection**: Confirm database settings in `settings.py`

### Support
For issues not covered in this document, please:
1. Check the Django logs for error messages
2. Review the API response codes and messages
3. Consult the Django REST Framework documentation
4. Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.