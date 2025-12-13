import sys
import os

# Add current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

print("--- LOADED CONFIGURATION ---")
print(f"Current Working Directory: {os.getcwd()}")
print(f"SMTP_HOST: {settings.SMTP_HOST}")
print(f"SMTP_USER: {settings.SMTP_USER}")
print(f"SMTP_PASSWORD: {settings.SMTP_PASSWORD}") # Be careful with this in logs, but user asked to verify
print(f"EMAILS_FROM_EMAIL: {settings.EMAILS_FROM_EMAIL}")
print("--------------------------")
