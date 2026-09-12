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
    chip.onclick = () => selectOption(step, opt, optWrap, customWrap);
    optWrap.appendChild(chip);
  });
  chatlog.appendChild(optWrap);

  const customWrap = document.createElement('div');
  customWrap.className = 'customrow';
  customWrap.innerHTML = `
    <input type="text" placeholder="or type a custom message..." />
    <button>Send</button>
  `;
  const input = customWrap.querySelector('input');
  const btn = customWrap.querySelector('button');
  const submitCustom = () => {
    if (input.value.trim().length === 0) return;
    selectOption(step, input.value.trim(), optWrap, customWrap, true);
  };
  btn.onclick = submitCustom;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submitCustom(); });
  chatlog.appendChild(customWrap);

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