// ─────────────────────────────────────────────
// MONSTER ASCII ART
// ─────────────────────────────────────────────
const MONSTER_ASCII = `
                                    ▄▄▄
                               ▄████████▄
                            ▄██▀░░▄▄░░░░▀██▄
                          ▄██░░░▀█████▀░░░░██▄
                        ▄██░░░░░░░▀▀░░░░░░░░▀██
                       ██░▄▄░░░░░░░░░░░░░░▄▄░▀█
                      ██░████▄░░░░░░░░░▄████░░█
                      █░██████░░░░░░░░░██████░░█
                      █░▀████▀░░▄████▄░▀████▀░░█
                      ██░░░░░░▄████████▄░░░░░░██
                       ██▄░░▄███▀░░░░▀███▄░░▄██
                        ▀██████▀░░░░░░░▀██████▀
                          ▀████░░░██░░░░████▀
                           ████░░████░░████
                          ██▀██░██████░██▀██
                         ██░░███▀████▀███░░██
                        ██░░░░░▀██████▀░░░░░██
                       ██░░░░░░░░░░░░░░░░░░░░██
                      ██░░░░░░░░░░░░░░░░░░░░░░██
`;

// ─────────────────────────────────────────────
// CORRUPTION CHARS
// ─────────────────────────────────────────────
const CORRUPT_CHARS = {
  low:  '░▒│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌',
  mid:  '▓█▄▀▐▌▆▇▃▂▁▉▊▋╳╲╱⣿⣾⣽⣼⣻⣺⣹⣸⣷⣶⣵⣴⣳',
  high: '𝕳𝕰𝕷𝕷𝕺ꝸꝹꞘꞙꟊꟵꟶ꧋꧌꧍ᚱᚲᚳᚴᚵᚶᚷᚸᚹᚺᚻ₰₱₲₳₴₵₶₷₸₹',
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let proximity = 0;
let conversationHistory = [];
let isThinking = false;

const SYSTEM_PROMPT = `Você é o narrador de um jogo de terror textual chamado "O Que Espreita".

O jogador está numa mansão abandonada e há uma criatura invisível que pode sentir.

REGRAS ABSOLUTAS:
1. Responda SEMPRE em português brasileiro
2. Suas respostas devem ser narrativas atmosféricas e perturbadoras (3-6 frases)
3. Ao final de cada resposta, inclua EXATAMENTE esta linha:
   [PROXIMIDADE:XX]
   Onde XX é um número de 0 a 100 indicando o quão perto o monstro está.
   - Ações que fogem/se escondem: diminuem proximidade (-5 a -15)
   - Ações neutras ou exploração: mantém ou aumenta levemente (+0 a +8)
   - Fazer barulho, chamar atenção, ir em direção a sons: aumenta muito (+10 a +25)
   - Se o jogador encontra o monstro diretamente: 100

4. Se a proximidade chegar a 100, a criatura o encontra e o jogo termina com uma cena de horror.
5. Nunca revele explicitamente a aparência do monstro. Descreva apenas seus efeitos: cheiro, sons, sensações, sombras.
6. À medida que a proximidade aumenta, sua narração fica mais fragmentada, caótica e menos coerente.
7. Tom: horror cósmico/existencial, não violência explícita.

CENÁRIO INICIAL: Uma mansão em ruínas numa noite sem lua. O jogador acabou de entrar pela porta principal.`;

// ─────────────────────────────────────────────
// CURSOR
// ─────────────────────────────────────────────
document.addEventListener('mousemove', e => {
  const c = document.getElementById('cursor');
  c.style.left = e.clientX + 'px';
  c.style.top  = e.clientY + 'px';
});

// ─────────────────────────────────────────────
// START GAME
// ─────────────────────────────────────────────
function startGame() {
  const screen = document.getElementById('intro-screen');
  screen.style.transition = 'opacity 1s';
  screen.style.opacity = '0';
  setTimeout(() => screen.style.display = 'none', 1000);

  const sessionId = Array.from({ length: 3 }, () =>
    Math.random().toString(16).substr(2, 4).toUpperCase()
  ).join('-');
  document.getElementById('session-id').textContent = 'SESSÃO: ' + sessionId;

  appendGameEntry(null,
    'Você está de pé na entrada da Mansão Hargreave.\n' +
    'A porta atrás de você se fechou sozinha.\n' +
    'O ar cheira a mofo... e a algo mais.\n' +
    'Uma presença.\n' +
    'O que você faz?'
  );
}

// ─────────────────────────────────────────────
// CORRUPT TEXT
// ─────────────────────────────────────────────
function corruptText(text, level) {
  if (level < 15) return text;

  const corruptRate = Math.min((level - 15) / 100, 0.7);
  let pool = CORRUPT_CHARS.low;
  if (level > 40) pool += CORRUPT_CHARS.mid;
  if (level > 65) pool += CORRUPT_CHARS.high;

  return text.split('').map(ch => {
    if (ch === '\n' || ch === ' ') return ch;
    if (Math.random() < corruptRate * 0.6) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (level > 75 && Math.random() < 0.3) return ch + '̴̧̨̢';
    return ch;
  }).join('');
}

// ─────────────────────────────────────────────
// APPEND ENTRY
// ─────────────────────────────────────────────
function appendGameEntry(playerAction, gameResponse) {
  const output  = document.getElementById('output');
  const wrap    = document.getElementById('messages-wrap');
  const entry   = document.createElement('div');
  entry.className = 'entry';

  if (playerAction) {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'entry-player';
    playerDiv.textContent = playerAction;
    entry.appendChild(playerDiv);
  }

  const gameDiv = document.createElement('div');
  gameDiv.className = 'entry-game';
  gameDiv.textContent = corruptText(gameResponse, proximity);
  if (proximity > 70) gameDiv.classList.add('glitch-text');

  entry.appendChild(gameDiv);
  wrap.appendChild(entry);
  output.scrollTop = output.scrollHeight;

  updateMonsterOverlay();
}

// ─────────────────────────────────────────────
// MONSTER OVERLAY
// ─────────────────────────────────────────────
function updateMonsterOverlay() {
  const layer = document.getElementById('monster-layer');

  if (proximity < 40) {
    layer.style.opacity = '0';
    return;
  }

  layer.style.opacity = String(Math.min((proximity - 40) / 60, 0.85));

  const lines       = MONSTER_ASCII.split('\n');
  const linesNeeded = Math.floor(document.getElementById('output').clientHeight / 22) + 5;
  let monsterText   = '';
  for (let i = 0; i < linesNeeded; i++) monsterText += lines[i % lines.length] + '\n';
  layer.textContent = monsterText;

  layer.style.color = proximity > 80 ? '#8b000055'
                    : proximity > 60 ? '#8b000033'
                    :                  '#8b000018';
}

// ─────────────────────────────────────────────
// UPDATE PROXIMITY UI
// ─────────────────────────────────────────────
function updateProximityUI() {
  const fill        = document.getElementById('proximity-fill');
  const val         = document.getElementById('proximity-value');
  const inputSec    = document.getElementById('input-section');
  const output      = document.getElementById('output');

  fill.style.width              = proximity + '%';
  fill.style.backgroundPosition = proximity + '% 0';
  val.textContent               = proximity + '%';

  if (proximity > 70) {
    val.style.color = '#cc0000';
    inputSec.classList.add('danger');
    output.classList.add('danger-pulse');
    document.body.style.setProperty('--green', '#cc2200');
  } else if (proximity > 40) {
    val.style.color = '#886600';
    inputSec.classList.remove('danger');
    output.classList.remove('danger-pulse');
    document.body.style.setProperty('--green', '#88aa00');
  } else {
    val.style.color = '#00ff41';
    inputSec.classList.remove('danger');
    output.classList.remove('danger-pulse');
    document.body.style.setProperty('--green', '#00ff41');
  }

  if (proximity > 85) {
    const container = document.getElementById('game-container');
    container.classList.add('shaking');
    setTimeout(() => container.classList.remove('shaking'), 500);
  }
}

// ─────────────────────────────────────────────
// PARSE RESPONSE
// ─────────────────────────────────────────────
function parseResponse(rawText) {
  const match = rawText.match(/\[PROXIMIDADE:(\d+)\]/);
  return {
    text:      rawText.replace(/\[PROXIMIDADE:\d+\]/g, '').trim(),
    proximity: match ? Math.max(0, Math.min(100, parseInt(match[1]))) : proximity,
  };
}

// ─────────────────────────────────────────────
// GAME OVER
// ─────────────────────────────────────────────
function triggerGameOver(finalText) {
  const output = document.getElementById('output');
  output.style.transition = 'background 1s';
  output.style.background = '#000';

  setTimeout(() => {
    const entry   = document.createElement('div');
    entry.className = 'entry';
    const gameDiv = document.createElement('div');
    gameDiv.className = 'entry-game';
    gameDiv.style.color      = '#8b0000';
    gameDiv.style.textShadow = '0 0 10px #ff000066';
    gameDiv.textContent      = finalText + '\n\n\n[ FIM ]';
    entry.appendChild(gameDiv);
    document.getElementById('messages-wrap').appendChild(entry);
    output.scrollTop = output.scrollHeight;

    document.getElementById('player-input').disabled = true;
    document.getElementById('send-btn').disabled     = true;
    document.getElementById('prompt-prefix').style.color = '#8b0000';
    document.getElementById('title').style.color         = '#ff0000';
  }, 1200);
}

// ─────────────────────────────────────────────
// SEND ACTION — calls local proxy /api/chat
// ─────────────────────────────────────────────
async function sendAction() {
  if (isThinking) return;

  const input  = document.getElementById('player-input');
  const action = input.value.trim();
  if (!action) return;

  input.value = '';
  input.disabled = true;
  document.getElementById('send-btn').disabled = true;
  isThinking = true;

  const thinkEl = document.getElementById('thinking-indicator');
  thinkEl.style.display = 'inline';
  thinkEl.classList.add('loading');

  conversationHistory.push({ role: 'user', content: action });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     SYSTEM_PROMPT,
        messages:   conversationHistory,
      }),
    });

    const data = await response.json();

    if (!data.content) {
      const errMsg = data.error?.message || JSON.stringify(data);
      throw new Error(errMsg);
    }

    const rawText = data.content.map(b => b.text || '').join('');
    const { text, proximity: newProx } = parseResponse(rawText);

    proximity = newProx;
    updateProximityUI();
    conversationHistory.push({ role: 'assistant', content: rawText });
    appendGameEntry(action, text);

    if (proximity >= 100) setTimeout(() => triggerGameOver(text), 500);

  } catch (err) {
    console.error('Erro:', err);
    appendGameEntry(action, `[ERRO — ${err.message}]`);
  } finally {
    isThinking = false;
    thinkEl.style.display = 'none';
    thinkEl.classList.remove('loading');
    input.disabled = false;
    document.getElementById('send-btn').disabled = false;
    input.focus();
  }
}

// ─────────────────────────────────────────────
// KEYBOARD
// ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const intro = document.getElementById('intro-screen');
    if (intro.style.display === 'none' || document.activeElement === document.getElementById('player-input')) {
      sendAction();
    }
  }
});

// ─────────────────────────────────────────────
// AMBIENT: coordinate flicker
// ─────────────────────────────────────────────
setInterval(() => {
  if (proximity > 30) {
    const n = () => (Math.random() * 999 | 0).toString().padStart(3, '0');
    document.getElementById('coord-display').textContent =
      `COORD: ${n()}.${n()} // ${n()}.${n()}`;
  }
}, 2000);
