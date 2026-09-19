const STEPS = [
  {
    key: 'diet',
    title: 'Any strict dietary or religious rules?',
    sub: 'Step 1: Dietary preference',
    options: ['Halal Only', 'Vegetarian', 'Vegan', 'None'],
  },
  {
    key: 'allergen',
    title: 'Any allergies or ingredients to avoid?',
    sub: 'Step 2: Common Allergens',
    options: ['Peanuts', 'Shellfish', 'Dairy', 'Gluten', 'None'],
  },
  {
    key: 'pax',
    title: 'How many people are dining?',
    sub: 'Step 3: Party size',
    options: ['1 pax', '2 pax', '3-4 pax', '5+ pax'],
  },
  {
    key: 'craving',
    title: 'What is your main craving right now?',
    sub: 'Step 4: Preferred food category',
    options: ['Rice', 'Noodles', 'Grilled Meat', 'Light Salad', 'Anything'],
  },
  {
    key: 'spice',
    title: 'What is your tolerance for spiciness?',
    sub: 'Step 5: Preferred spice level',
    options: ['Non-spicy', 'Mild kick', 'Extra spicy'],
  },
  {
    key: 'budget',
    title: 'What is your budget for the meal?',
    sub: 'Step 6: Maximum price range',
    options: ['<RM5', '<RM10', '<RM15', '<RM20'],
  },
];

let stepIndex = 0;
let answers = {};
const chatlog = document.getElementById('chatlog');
const stepperEl = document.getElementById('stepper');

function buildStepper() {
  stepperEl.innerHTML = '';
  STEPS.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'stepdot';
    d.id = 'dot' + i;
    d.innerHTML = '<i></i>';
    stepperEl.appendChild(d);
  });
}
buildStepper();

function updateStepper() {
  STEPS.forEach((s, i) => {
    const d = document.getElementById('dot' + i);
    d.classList.remove('active', 'done');
    if (i < stepIndex) d.classList.add('done');
    else if (i === stepIndex) d.classList.add('active');
  });
}

function scrollBottom() {
  chatlog.scrollTop = chatlog.scrollHeight + 200;
}

function addBotBubble(step) {
  const row = document.createElement('div');
  row.className = 'row bot';
  row.innerHTML = `
    <div class="avatar">南</div>
    <div class="bubble">
      <div class="qtitle">${step.title}</div>
      <div class="qsub">${step.sub}</div>
    </div>
  `;
  chatlog.appendChild(row);

  const optWrap = document.createElement('div');
  optWrap.className = 'options';
  optWrap.id = 'opts-' + stepIndex;
  step.options.forEach((opt, i) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    const numSpan = document.createElement('span');
    numSpan.className = 'num';
    numSpan.textContent = i + 1;
    chip.appendChild(numSpan);
    chip.appendChild(document.createTextNode(opt));
    chip.onclick = () => selectOption(step, opt, optWrap, customWrap, true);
    optWrap.appendChild(chip);
  });
  chatlog.appendChild(optWrap);

  // Custom row wrapper with vertical stacking to prevent text clipping
  const customWrap = document.createElement('div');
  customWrap.className = 'customrow';
  customWrap.style.display = 'flex';
  customWrap.style.flexDirection = 'column';
  customWrap.style.gap = '8px';

  customWrap.innerHTML = `
    <div style="display: flex; gap: 8px; width: 100%;">
      <input type="text" placeholder="or type a custom message..." style="flex: 1; min-width: 0;" />
      <button>Send</button>
      <button id="micButton">🎤</button>
    </div>
    <div id="voiceStatus" style="display: none; font-size: 13px;"></div>
  `;

  const input = customWrap.querySelector('input');
  const btn = customWrap.querySelector('button');
  const micButton = customWrap.querySelector('#micButton');
  const voiceStatus = customWrap.querySelector('#voiceStatus');

  const submitCustom = () => {
    if (input.value.trim().length === 0) return;
    selectOption(step, input.value.trim(), optWrap, customWrap, true);
  };

  btn.onclick = submitCustom;
  input.addEventListener('keydown', e => { 
    if (e.key === 'Enter') submitCustom(); 
  });
  
  chatlog.appendChild(customWrap);
  
  // ========================================
  // SPEECH RECOGNITION SETUP (Following Guide)
  // ========================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micButton.disabled = true;
    voiceStatus.textContent = 'Voice input is not supported in this browser.';
    voiceStatus.style.display = 'block';
  } else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    micButton.onclick = () => {
      try {
        recognition.start();
      } catch (error) {
        console.error("Could not start recognition:", error);
      }
    };

    recognition.addEventListener('start', () => {
      micButton.textContent = '🔴';
      voiceStatus.textContent = 'Listening...';
      voiceStatus.style.display = 'block';
    });

    recognition.addEventListener('result', (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      // Show temporary text while user is talking
      input.value = finalTranscript + interimTranscript;

      // Automatically submit once the speech segment is final
      if (finalTranscript.trim() !== '') {
        selectOption(step, finalTranscript.trim(), optWrap, customWrap, true);
      }
    });

    recognition.addEventListener('end', () => {
      micButton.textContent = '🎤';
      // Hide voice status if it wasn't showing an error
      if (voiceStatus.textContent === 'Listening...') {
        voiceStatus.style.display = 'none';
      }
    });

    recognition.addEventListener('error', (event) => {
      console.error('Speech recognition error:', event.error);
      micButton.textContent = '🎤';
      voiceStatus.style.display = 'block';

      switch (event.error) {
        case 'not-allowed':
          voiceStatus.textContent = 'Microphone permission was denied.';
          break;
        case 'no-speech':
          voiceStatus.textContent = "I didn't hear anything. Please try again.";
          break;
        case 'audio-capture':
          voiceStatus.textContent = 'No microphone was detected.';
          break;
        case 'network':
          voiceStatus.textContent = 'Speech recognition network error.';
          break;
        default:
          voiceStatus.textContent = 'Voice recognition failed. Please try again.';
      }
    });
  }

  scrollBottom();
}

function selectOption(step, value, optWrap, customWrap, isCustom) {
  optWrap.classList.add('taken');
  customWrap.style.display = 'none';

  const row = document.createElement('div');
  row.className = 'row user';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = value;
  row.appendChild(bubble);
  chatlog.appendChild(row);

  answers[step.key] = value;
  stepIndex++;
  updateStepper();
  scrollBottom();

  setTimeout(() => {
    if (stepIndex < STEPS.length) {
      addBotBubble(STEPS[stepIndex]);
    } else {
      showResults();
    }
  }, isCustom ? 500 : 350);
}

function showResults() {
  const row = document.createElement('div');
  row.className = 'row bot';
  row.innerHTML = `
    <div class="avatar">南</div>
    <div class="bubble">
      <div class="qtitle">Finding your best match...</div>
      <div class="qsub">Consulting BiteMatch AI & menu database</div>
    </div>
  `;
  chatlog.appendChild(row);
  scrollBottom();

  fetch('/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_preferences: answers })
  })
  .then(res => res.json())
  .then(data => {
    row.remove();

    const botRow = document.createElement('div');
    botRow.className = 'row bot';
    botRow.innerHTML = `
      <div class="avatar">南</div>
      <div class="bubble">
        <div class="qtitle">Here is your match</div>
        <div class="qsub">${data.recommendation}</div>
      </div>
    `;
    chatlog.appendChild(botRow);

    const restart = document.createElement('button');
    restart.className = 'restartbtn';
    restart.textContent = 'Start over';
    restart.onclick = resetFlow;
    chatlog.appendChild(restart);
    scrollBottom();
  })
  .catch(err => {
    console.error(err);
    row.remove();
  });
}

function resetFlow() {
  stepIndex = 0;
  answers = {};
  chatlog.innerHTML = '';
  updateStepper();
  addBotBubble(STEPS[0]);
}

updateStepper();
addBotBubble(STEPS[0]);