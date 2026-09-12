import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY") or "")

def get_gemini_recommendation(user_preferences, menu_database):
    matching_prompt = f"""
You are BiteMatch AI for Old Nanyang Coffee. Match user preferences with the menu database.

User Preferences:
{json.dumps(user_preferences, indent=2)}

Menu Database:
{json.dumps(menu_database, indent=2)}

Instructions:
1. Greeting: Polite, maximum 2 words (e.g., "Hi!").
2. Selection: List ALL suitable matching dishes, placing highest priority on the requested craving.
3. Descriptions: Keep each dish explanation to a maximum of 10 words using simple, accessible English.
4. Constraints: Maximum 100 words total. Maintain ultra-precise output with zero conversational fluff.
5. If no suitable dishes are found, respond with: "No suitable dishes found. You may try again!"
"""

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=matching_prompt,
        config=types.GenerateContentConfig(temperature=0.0)
    )
    
    return response.text