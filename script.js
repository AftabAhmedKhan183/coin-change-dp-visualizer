/* ================================================================
   Coin Change — Dynamic Programming Visualizer
   Course: Design & Analysis of Algorithms
   ================================================================ */

// ── State ──────────────────────────────────────────────────────
let coins = [];
let amount = 0;
let dp = [];
let combos = [];
let stepMode = false;
let currentStep = -1;
let totalSteps = 0;
let visitedCells = new Set();
let activeCellKey = null;
let playInterval = null;
let isPlaying = false;

// ── DOM References ─────────────────────────────────────────────
const coinsInput   = document.getElementById('coinsInput');
const amountInput  = document.getElementById('amountInput');
const runBtn       = document.getElementById('runBtn');
const errorMsg     = document.getElementById('errorMsg');
const results      = document.getElementById('results');

const cardWays     = document.getElementById('cardWays');
const cardCoins    = document.getElementById('cardCoins');
const cardAmount   = document.getElementById('cardAmount');

const dpTable      = document.getElementById('dpTable');
const stepModeBtn  = document.getElementById('stepModeBtn');
const stepNav      = document.getElementById('stepNav');
const prevBtn      = document.getElementById('prevBtn');
const playBtn      = document.getElementById('playBtn');
const nextBtn      = document.getElementById('nextBtn');
const exitBtn      = document.getElementById('exitBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar  = document.getElementById('progressBar');
const stepLabel    = document.getElementById('stepLabel');
const stepPct      = document.getElementById('stepPct');
const stepExplain  = document.getElementById('stepExplain');
const combosWrap   = document.getElementById('combosWrap');
const comboLabel   = document.getElementById('comboLabel');
const cxTime       = document.getElementById('cxTime');
const cxSpace      = document.getElementById('cxSpace');

// ── Event Listeners ────────────────────────────────────────────
runBtn.addEventListener('click', run);
coinsInput.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
amountInput.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
stepModeBtn.addEventListener('click', startStepMode);
prevBtn.addEventListener('click', () => goToStep(currentStep - 1));
nextBtn.addEventListener('click', () => goToStep(currentStep + 1));
exitBtn.addEventListener('click', exitStepMode);
playBtn.addEventListener('click', togglePlay);

// ── RUN ────────────────────────────────────────────────────────
function run() {
  const rawCoins = coinsInput.value
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0);
  const rawAmount = parseInt(amountInput.value);

  if (rawCoins.length === 0)            return showError('Enter at least one valid coin denomination.');
  if (isNaN(rawAmount) || rawAmount < 1) return showError('Enter a valid positive target amount.');
  if (rawAmount > 30)                   return showError('Amount too large for visualization (max 30).');
  if (rawCoins.length > 8)             return showError('Too many coins for visualization (max 8).');

  clearError();
  stopPlay();

  coins = rawCoins;
  amount = rawAmount;
  totalSteps = coins.length * amount;

  dp = buildDP(coins, amount);
  combos = getCombinations(coins, amount);

  stepMode = false;
  currentStep = -1;
  visitedCells = new Set();
  activeCellKey = null;

  updateCards();
  renderTable();
  renderCombos();
  updateComplexity();
  resetStepUI();

  results.classList.remove('hidden');
}

// ── DP Algorithm ───────────────────────────────────────────────
function buildDP(coins, amount) {
  const n = coins.length;
  const table = Array.from({ length: n + 1 }, () => Array(amount + 1).fill(0));
  for (let i = 0; i <= n; i++) table[i][0] = 1;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= amount; j++) {
      table[i][j] = table[i - 1][j];
      if (coins[i - 1] <= j) table[i][j] += table[i][j - coins[i - 1]];
    }
  }
  return table;
}

// ── Combinations (backtracking) ────────────────────────────────
function getCombinations(coins, amount) {
  const results = [];
  function bt(remaining, start, current) {
    if (remaining === 0) { results.push([...current]); return; }
    for (let i = start; i < coins.length; i++) {
      if (coins[i] <= remaining) {
        current.push(coins[i]);
        bt(remaining - coins[i], i, current);
        current.pop();
      }
    }
  }
  bt(amount, 0, []);
  return results;
}

// ── Update Cards ───────────────────────────────────────────────
function updateCards() {
  cardWays.textContent   = dp[coins.length][amount];
  cardCoins.textContent  = `[${coins.join(', ')}]`;
  cardAmount.textContent = amount;
}

// ── Render DP Table ────────────────────────────────────────────
function renderTable() {
  dpTable.innerHTML = '';

  // Column header row
  const headRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'row-header';
  corner.textContent = 'coins\\amt';
  corner.style.cssText = 'width:90px;font-size:.63rem;color:var(--muted);text-align:right;padding-right:10px;';
  headRow.appendChild(corner);

  for (let j = 0; j <= amount; j++) {
    const th = document.createElement('th');
    th.className = 'col-header';
    th.textContent = j;
    th.id = `ch-${j}`;
    headRow.appendChild(th);
  }
  dpTable.appendChild(headRow);

  // Row 0: no coins
  dpTable.appendChild(makeRow(0, '(none)'));

  // Rows 1..n
  for (let i = 1; i <= coins.length; i++) {
    dpTable.appendChild(makeRow(i, `c=${coins[i - 1]}`));
  }

  // Highlight answer cell
  applyAnswerHighlight();
}

function makeRow(i, label) {
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.className = 'row-header';
  th.textContent = label;
  th.id = `rh-${i}`;
  th.style.cssText = 'text-align:right;padding-right:10px;font-size:.72rem;';
  tr.appendChild(th);

  for (let j = 0; j <= amount; j++) {
    const td = document.createElement('td');
    td.id = `cell-${i}-${j}`;
    td.textContent = dp[i][j];
    tr.appendChild(td);
  }
  return tr;
}

function applyAnswerHighlight() {
  for (let i = 0; i <= coins.length; i++) {
    for (let j = 0; j <= amount; j++) {
      const td = document.getElementById(`cell-${i}-${j}`);
      if (!td) continue;
      td.className = '';
      if (i === coins.length && j === amount) td.classList.add('answer-cell');
    }
  }
}

// ── Render Combinations ────────────────────────────────────────
function renderCombos() {
  combosWrap.innerHTML = '';
  comboLabel.textContent = `▸ ALL VALID COMBINATIONS (${combos.length} total)`;
  combos.forEach((combo, idx) => {
    const chip = document.createElement('div');
    chip.className = 'combo-chip';
    chip.innerHTML = `
      <span class="chip-num">#${idx + 1}</span>
      <span>${combo.join(' + ')}</span>
      <span class="chip-eq">= ${amount}</span>
    `;
    combosWrap.appendChild(chip);
  });
}

// ── Update Complexity Info ─────────────────────────────────────
function updateComplexity() {
  cxTime.textContent  = `${coins.length} coins × ${amount} amounts = ${coins.length * amount} operations`;
  cxSpace.textContent = `DP table: ${coins.length + 1} × ${amount + 1} = ${(coins.length + 1) * (amount + 1)} cells`;
}

// ── Step Mode ──────────────────────────────────────────────────
function startStepMode() {
  stepMode = true;
  visitedCells = new Set();
  // Base case: all column-0 cells visible
  for (let i = 0; i <= coins.length; i++) visitedCells.add(`${i}-0`);

  stepModeBtn.classList.add('hidden');
  stepNav.classList.remove('hidden');
  progressWrap.classList.remove('hidden');

  goToStep(0);
}

function exitStepMode() {
  stopPlay();
  stepMode = false;
  currentStep = -1;
  visitedCells = new Set();
  activeCellKey = null;

  stepModeBtn.classList.remove('hidden');
  stepNav.classList.add('hidden');
  progressWrap.classList.add('hidden');
  stepExplain.classList.add('hidden');

  applyAnswerHighlight();
}

function resetStepUI() {
  stepModeBtn.classList.remove('hidden');
  stepNav.classList.add('hidden');
  progressWrap.classList.add('hidden');
  stepExplain.classList.add('hidden');
}

// ── Step Navigation ────────────────────────────────────────────
function goToStep(s) {
  if (s < 0 || s > totalSteps) return;
  currentStep = s;

  // Rebuild visited set
  visitedCells = new Set();
  for (let i = 0; i <= coins.length; i++) visitedCells.add(`${i}-0`);
  for (let idx = 0; idx < s; idx++) {
    const { i, j } = stepCoords(idx);
    visitedCells.add(`${i}-${j}`);
  }

  activeCellKey = null;
  if (s > 0 && s <= totalSteps) {
    const { i, j } = stepCoords(s - 1);
    activeCellKey = `${i}-${j}`;
  }

  applyCellStyles();
  updateProgressUI();
  updateStepExplain(s);
}

// step index → dp table (row i, col j)
function stepCoords(idx) {
  const j = (idx % amount) + 1;
  const i = Math.floor(idx / amount) + 1;
  return { i, j };
}

function applyCellStyles() {
  const n = coins.length;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= amount; j++) {
      const td = document.getElementById(`cell-${i}-${j}`);
      if (!td) continue;

      const key      = `${i}-${j}`;
      const isBase   = (j === 0);
      const isAnswer = (i === n && j === amount);
      const isActive = (key === activeCellKey);
      const isVisited = visitedCells.has(key);

      td.className = '';

      if (isBase) {
        td.classList.add('computed');
      } else if (isActive) {
        td.classList.add('active-cell');
      } else if (isAnswer && isVisited) {
        td.classList.add('answer-cell');
      } else if (isVisited) {
        td.classList.add('computed');
      } else {
        td.classList.add('dimmed');
      }
    }
  }

  // Highlight active row/col headers
  for (let i = 0; i <= coins.length; i++) {
    const rh = document.getElementById(`rh-${i}`);
    if (!rh) continue;
    const ai = activeCellKey ? parseInt(activeCellKey.split('-')[0]) : -1;
    rh.style.color      = (i === ai) ? 'var(--cyan)' : '';
    rh.style.fontWeight = (i === ai) ? '700' : '';
  }
  for (let j = 0; j <= amount; j++) {
    const ch = document.getElementById(`ch-${j}`);
    if (!ch) continue;
    const aj = activeCellKey ? parseInt(activeCellKey.split('-')[1]) : -1;
    ch.style.color = (j === aj) ? 'var(--cyan)' : '';
  }
}

function updateProgressUI() {
  const pct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  progressBar.style.width = `${pct}%`;
  stepLabel.textContent   = `Step ${currentStep} of ${totalSteps}`;
  stepPct.textContent     = `${pct}%`;
  prevBtn.disabled = currentStep <= 0;
  nextBtn.disabled = currentStep >= totalSteps;
}

function updateStepExplain(s) {
  if (!stepMode || s <= 0 || s > totalSteps) {
    stepExplain.classList.add('hidden');
    return;
  }

  const { i, j } = stepCoords(s - 1);
  const coin      = coins[i - 1];
  const fromAbove = dp[i - 1][j];
  const canUse    = coin <= j;
  const fromLeft  = canUse ? dp[i][j - coin] : 0;
  const total     = dp[i][j];
  const subset    = `[${coins.slice(0, i).join(', ')}]`;

  stepExplain.classList.remove('hidden');
  stepExplain.innerHTML =
    `<span class="c-cyan">▸ Step ${s}:</span> Computing ` +
    `<span class="c-green">dp[${i}][${j}]</span> — ways to make ` +
    `<span class="glow-gold">${j}</span> using coins ${subset}.<br>` +
    `&nbsp;&nbsp;<b>Exclude</b> coin <span class="c-orange">${coin}</span>: ` +
    `dp[${i-1}][${j}] = <span class="c-cyan">${fromAbove}</span> way(s)` +
    (canUse
      ? ` &nbsp;+&nbsp; <b>Include</b> coin <span class="c-orange">${coin}</span>: dp[${i}][${j - coin}] = <span class="c-cyan">${fromLeft}</span> way(s)`
      : ` &nbsp;&nbsp;<span style="color:var(--muted)">(coin ${coin} > ${j}, cannot include)</span>`) +
    ` &nbsp;= <span class="c-green" style="font-weight:700">${total}</span>`;
}

// ── Play / Pause ───────────────────────────────────────────────
function togglePlay() {
  if (isPlaying) { stopPlay(); return; }
  isPlaying = true;
  playBtn.textContent = '⏸ PAUSE';
  playBtn.classList.add('paused');

  if (!stepMode) startStepMode();

  playInterval = setInterval(() => {
    const next = currentStep + 1;
    if (next > totalSteps) { stopPlay(); return; }
    goToStep(next);
  }, 180);
}

function stopPlay() {
  clearInterval(playInterval);
  playInterval = null;
  isPlaying = false;
  playBtn.textContent = '▶ PLAY';
  playBtn.classList.remove('paused');
}

// ── Error Helpers ──────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = '⚠ ' + msg;
  errorMsg.classList.remove('hidden');
}
function clearError() {
  errorMsg.textContent = '';
  errorMsg.classList.add('hidden');
}