import glob
import json
import os
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from utils.gemini_chat import get_gemini_recommendation

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

load_dotenv(os.path.join(ROOT_DIR, '.env'))

app = Flask(
    __name__,
    template_folder=os.path.join(ROOT_DIR, 'frontend', 'templates'),
    static_folder=os.path.join(ROOT_DIR, 'frontend', 'static'),
)

menus_dir= os.path.join(ROOT_DIR, 'frontend', 'static', 'assets', 'menus')
MENU_DATA=[]
print(f'DEBUG: Looking for menu.json files in {menus_dir}...')
json_files = glob.glob(os.path.join(menus_dir, '*.json'))

for file_path in json_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)

            #All files uses {"items": [...] } structure, so we extract the items list
            if 'items' in content:
                items=content['items']

            MENU_DATA.extend(items)
            print(
            f'Successfully loaded {len(items)} items from'
            f' {os.path.basename(file_path)}'
            )

    except Exception as e:
        print(f'Error loading {file_path}: {e}')

print(f'Total menu items loaded: {len(MENU_DATA)}')


#--ROUTES--
@app.route('/')
def index():
  return render_template('chat.html')


@app.route('/api/menu', methods=['GET'])
def get_menu():
  return jsonify(MENU_DATA)


@app.route('/recommend', methods=['POST'])
def chat_recommendation():
  data = request.json
  user_preferences = data.get('user_preferences', {})

  try:
    print('Processing recommendation request...')
    recommendation_text = get_gemini_recommendation(user_preferences, MENU_DATA)
    return jsonify({'recommendation': recommendation_text})
  except Exception as e:
    import traceback

    traceback.print_exc()  # This will print the exact traceback in your terminal
    return jsonify(
        {'recommendation': f'Error generating recommendation: {str(e)}'}
    ), 500


if __name__ == '__main__':
  app.run(debug=True, port=5000)