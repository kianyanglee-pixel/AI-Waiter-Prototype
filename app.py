import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# from other apps
from utils.gemini_chat import get_gemini_recommendation

load_dotenv()

app = Flask(__name__)

# Load menu.json from the assets folder
try:
    with open('./assets/menus/menu.json', 'r', encoding='utf-8') as f:
        MENU_DATA = json.load(f)
except Exception as e:
    print(f"Error loading menu.json: {e}")
    MENU_DATA = []

@app.route("/")
def index():
    return render_template("chat.html")

@app.route("/api/menu", methods=["GET"])
def get_menu():
    return jsonify(MENU_DATA)

@app.route("/recommend", methods=['POST'])
def chat_recommendation():
    data = request.json
    # Fixed: match the "preferences" key sent by chatbot.js
    user_preferences = data.get("user_preferences", {})
    
    try:
        recommendation_text = get_gemini_recommendation(user_preferences, MENU_DATA)
        return jsonify({"recommendation": recommendation_text})
    except Exception as e:
        return jsonify({"recommendation": f"Error generating recommendation: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)