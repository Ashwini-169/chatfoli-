#!/usr/bin/env python3
"""
Simple test script to verify Gemini API connection
Run: python test_gemini.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
print(f"🔑 API Key loaded: {API_KEY[:20]}..." if API_KEY else "❌ API Key NOT found")

try:
    import google.generativeai as genai
    print("✅ google-generativeai imported successfully")
    
    if API_KEY:
        genai.configure(api_key=API_KEY)
        print("✅ Gemini configured")
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        print("✅ Model initialized")
        
        # Test message
        response = model.generate_content("Say 'Hello from Gemini' and then return this JSON: ```json\n{\"test\": \"ok\"}\n```")
        print(f"\n✅ Response received!")
        print(f"📝 Response text:\n{response.text}\n")
    else:
        print("❌ API Key not set in .env")
        
except ImportError as e:
    print(f"❌ Failed to import google-generativeai: {e}")
    print("   Run: pip install google-generativeai")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
