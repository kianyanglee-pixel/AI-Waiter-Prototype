import os
import json
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY") or "")

app = Flask(__name__)

# Load menu database
def load_menu():
    if os.path.exists("menu.json"):
        with open("menu.json", "r") as f:
            return json.load(f)
    return {"items": []}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json
    user_preferences = data.get("preferences", {})
    menu_database = load_menu()

    matching_prompt = f"""
You are BiteMatch AI. Match user preferences with the menu database.

User Preferences:
{json.dumps(user_preferences, indent=2)}

Menu Database:
{json.dumps(menu_database, indent=2)}

Instructions:
1. Greeting: Polite, maximum 2 words (e.g., "Hi!").
2. Selection: List ALL suitable matching dishes, placing highest priority on the requested craving.
3. Descriptions: Keep each dish explanation to a maximum of 10 words using simple, accessible English.
4. Constraints: Maximum 100 words total. Maintain ultra-precise output with zero conversational fluff.
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=matching_prompt,
            config=types.GenerateContentConfig(temperature=0.0)
        )
        return jsonify({"success": True, "recommendation": response.text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)