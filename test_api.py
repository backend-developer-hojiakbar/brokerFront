import requests
import json

# Test the backend API endpoints
BASE_URL = "http://127.0.0.1:8000"

def test_api_endpoints():
    print("Testing backend API endpoints...\n")
    
    # Test 1: Health check - try to access the API root
    try:
        response = requests.get(f"{BASE_URL}/api/")
        print(f"1. API Root Access: Status {response.status_code}")
        if response.status_code == 200: 
            print("   ✓ Backend is accessible")
        else:
            print(f"   ✗ Unexpected status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("1. API Root Access: Failed to connect to backend")
        print("   ✗ Backend may not be running or accessible")
        return
    except Exception as e:
        print(f"1. API Root Access: Error - {e}")
    
    # Test 2: Test authentication endpoint
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login/", data={"username": "admin", "password": "admin123"})
        print(f"\n2. Authentication Endpoint: Status {response.status_code}")
        if response.status_code == 200:
            print("   ✓ Authentication endpoint is working")
            token_data = response.json()
            print(f"   Token received: {token_data.get('token', 'No token')[:10]}...")
        elif response.status_code == 400:
            print("   ⚠ Authentication failed (expected if credentials are wrong)")
        else:
            print(f"   ✗ Unexpected status code: {response.status_code}")
    except Exception as e:
        print(f"2. Authentication Endpoint: Error - {e}")
    
    # Test 3: Test user registration endpoint
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register/", data={
            "username": "testuser",
            "password": "testpass123",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "role": "broker"
        })
        print(f"\n3. User Registration Endpoint: Status {response.status_code}")
        if response.status_code == 201:
            print("   ✓ User registration endpoint is working")
        elif response.status_code == 400:
            print("   ⚠ Registration failed (user may already exist)")
        else:
            print(f"   ✗ Unexpected status code: {response.status_code}")
    except Exception as e:
        print(f"3. User Registration Endpoint: Error - {e}")

if __name__ == "__main__":
    test_api_endpoints()