#!/usr/bin/env python
"""
Complete System Initialization Script for Tender Management System

This script initializes the entire Tender Management System backend,
including database setup, initial data, and verification.
"""

import os
import sys
import subprocess
import sqlite3
import time

def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_step(text):
    """Print a formatted step"""
    print(f"\n▶ {text}")

def print_success(text):
    """Print a success message"""
    print(f"  ✓ {text}")

def print_error(text):
    """Print an error message"""
    print(f"  ✗ {text}")

def check_python_version():
    """Check if Python version is compatible"""
    print_step("Checking Python version...")
    if sys.version_info < (3, 8):
        print_error("Python 3.8 or higher is required")
        return False
    print_success(f"Python {sys.version.split()[0]} detected")
    return True

def setup_virtual_environment():
    """Create and activate virtual environment"""
    print_step("Setting up virtual environment...")
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True, cwd="tender_drf")
        print_success("Virtual environment created")
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to create virtual environment")
        return False

def install_requirements():
    """Install project requirements"""
    print_step("Installing requirements...")
    try:
        # Determine the path to the Python executable in the virtual environment
        if os.name == 'nt':  # Windows
            python_executable = os.path.join("venv", "Scripts", "python.exe")
        else:  # Unix/Linux/Mac
            python_executable = os.path.join("venv", "bin", "python")
        
        # Install requirements
        subprocess.run([python_executable, "-m", "pip", "install", "--upgrade", "pip"], 
                      check=True, cwd="tender_drf")
        subprocess.run([python_executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, cwd="tender_drf")
        print_success("Requirements installed")
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to install requirements")
        return False

def run_migrations():
    """Run Django migrations"""
    print_step("Running database migrations...")
    try:
        # Determine the path to the Python executable in the virtual environment
        if os.name == 'nt':  # Windows
            python_executable = os.path.join("venv", "Scripts", "python.exe")
        else:  # Unix/Linux/Mac
            python_executable = os.path.join("venv", "bin", "python")
        
        # Run migrations
        subprocess.run([python_executable, "manage.py", "makemigrations"], 
                      check=True, cwd="tender_drf")
        subprocess.run([python_executable, "manage.py", "migrate"], 
                      check=True, cwd="tender_drf")
        print_success("Database migrations completed")
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to run migrations")
        return False

def create_super_user():
    """Create Django superuser"""
    print_step("Creating superuser...")
    try:
        # Determine the path to the Python executable in the virtual environment
        if os.name == 'nt':  # Windows
            python_executable = os.path.join("venv", "Scripts", "python.exe")
        else:  # Unix/Linux/Mac
            python_executable = os.path.join("venv", "bin", "python")
        
        # Create superuser using Django shell
        create_admin_script = '''
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@example.com", "admin123")
    print("Superuser 'admin' created with password 'admin123'")
else:
    print("Superuser already exists")
'''
        
        subprocess.run([python_executable, "manage.py", "shell", "-c", create_admin_script], 
                      check=True, cwd="tender_drf")
        print_success("Superuser created/verified")
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to create superuser")
        return False

def load_initial_data():
    """Load initial data"""
    print_step("Loading initial data...")
    try:
        # Determine the path to the Python executable in the virtual environment
        if os.name == 'nt':  # Windows
            python_executable = os.path.join("venv", "Scripts", "python.exe")
        else:  # Unix/Linux/Mac
            python_executable = os.path.join("venv", "bin", "python")
        
        # Run initial data command
        subprocess.run([python_executable, "manage.py", "init_data"], 
                      check=True, cwd="tender_drf")
        print_success("Initial data loaded")
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to load initial data")
        return False

def verify_database():
    """Verify database structure"""
    print_step("Verifying database structure...")
    try:
        db_path = os.path.join("tender_drf", "db.sqlite3")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        required_tables = [
            'tender_app_user',
            'tender_app_tenderanalysis',
            'tender_app_product',
            'tender_app_productspecification',
            'tender_app_tenderdata',
            'tender_app_expense',
            'tender_app_contractanalysis',
            'tender_app_contractdata',
            'tender_app_contractparty',
            'tender_app_contractterm',
            'tender_app_compliancecheck',
            'tender_app_compliancenote',
            'tender_app_recommendation',
            'tender_app_risk',
            'tender_app_tokentransaction',
            'auth_token'
        ]
        
        missing_tables = [table for table in required_tables if table not in tables]
        
        if missing_tables:
            print_error(f"Missing tables: {missing_tables}")
            return False
        
        print_success("Database structure verified")
        conn.close()
        return True
    except Exception as e:
        print_error(f"Database verification failed: {e}")
        return False

def print_instructions():
    """Print post-initialization instructions"""
    print_header("INITIALIZATION COMPLETE")
    print("\nYour Tender Management System backend has been successfully initialized!")
    print("\nNext steps:")
    print("1. Activate the virtual environment:")
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\activate")
    else:  # Unix/Linux/Mac
        print("   source venv/bin/activate")
    print("\n2. Navigate to the Django project directory:")
    print("   cd tender_drf")
    print("\n3. Run the development server:")
    print("   python run_server.py")
    print("\n4. Access the application:")
    print("   Admin Interface: http://127.0.0.1:8000/admin/")
    print("   API Root: http://127.0.0.1:8000/api/")
    print("\nDefault credentials:")
    print("   Username: admin")
    print("   Password: admin123")
    print("\nAPI Documentation:")
    print("   See README.md and DEMO_WORKFLOW.md for detailed API usage")

def main():
    """Main initialization function"""
    print_header("TENDER MANAGEMENT SYSTEM INITIALIZATION")
    
    # Change to the backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check prerequisites
    if not check_python_version():
        sys.exit(1)
    
    # Setup steps
    steps = [
        ("Setting up virtual environment", setup_virtual_environment),
        ("Installing requirements", install_requirements),
        ("Running migrations", run_migrations),
        ("Creating superuser", create_super_user),
        ("Loading initial data", load_initial_data),
        ("Verifying database", verify_database)
    ]
    
    # Execute setup steps
    for step_name, step_func in steps:
        if not step_func():
            print_error(f"Initialization failed at step: {step_name}")
            sys.exit(1)
        time.sleep(1)  # Small delay between steps
    
    # Print final instructions
    print_instructions()

if __name__ == "__main__":
    main()