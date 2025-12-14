import requests
import json

BASE_URL = "http://localhost:8000/api"
EMAIL = "test_user_123@example.com"
PASSWORD = "StrongPassword123!"
FULL_NAME = "Test User"

def run_test():
    # 1. Signup (to ensure user exists)
    signup_url = f"{BASE_URL}/auth/signup"
    signup_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": FULL_NAME,
        "role": "inventory_manager" # Assuming this is a valid role based on UserRole enum
    }
    
    print(f"Attempting to signup user: {EMAIL}...")
    try:
        response = requests.post(signup_url, json=signup_data)
        if response.status_code == 200:
            print("Signup successful.")
        elif response.status_code == 400 and "already exists" in response.text:
            print("User already exists. Proceeding to login.")
        else:
            print(f"Signup failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error during signup request: {e}")
        print("Is the server running on localhost:8000?")
        return

    # 2. Login
    login_url = f"{BASE_URL}/auth/login"
    # OAuth2PasswordRequestForm expects form data, not JSON
    login_data = {
        "username": EMAIL,
        "password": PASSWORD
    }
    
    print(f"\nAttempting to login user: {EMAIL}...")
    try:
        response = requests.post(login_url, data=login_data)
        
        if response.status_code == 200:
            print("\nLogin Successful! Here is the JSON output:")
            print("-" * 40)
            print(json.dumps(response.json(), indent=4))
            print("-" * 40)
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error during login request: {e}")

if __name__ == "__main__":
    run_test()
