# █ O QUE ESPREITA █

> Um jogo de terror textual onde a realidade se corrompe à medida que o monstro se aproxima.

---

## Como funciona

Você digita ações em português e o jogo narra o que acontece. Há uma criatura invisível na mansão — quanto mais você se aproxima dela, mais o texto se distorce e a silhueta do monstro emerge nas sombras do ecrã.

### Níveis de proximidade

| Proximidade | Efeito |
|-------------|--------|
| 0–15%       | Texto limpo, atmosfera sombria |
| 15–40%      | Caracteres começam a corromper (`░▒▓│┤╣`) |
| 40–65%      | Silhueta do monstro aparece por trás do texto |
| 65–85%      | Corrupção intensa, glitch vermelho, tela pulsa |
| 85–100%     | Tela treme, text completamente distorcido |
| 100%        | **GAME OVER** — a criatura te encontrou |

### Dicas

- Fugir e se esconder **diminui** a proximidade
- Fazer barulho ou explorar sons **aumenta** muito a proximidade
- Nunca vá em direção ao que está no porão

---

## Setup

Este jogo usa a **API da Anthropic** diretamente no browser (ideal para uso local ou via GitHub Pages com proxy).

### Uso local (recomendado para desenvolvimento)

1. Clone o repositório
2. Como o browser bloqueia chamadas diretas à API da Anthropic por CORS, use um servidor local com proxy, ou sirva via extensão como Live Server no VS Code com um proxy configurado.

### Opção mais simples: GitHub Pages + proxy

Para rodar em produção sem expor sua API key, você precisará de um backend mínimo (ex: Cloudflare Worker, Vercel Function) que repasse as chamadas para a API da Anthropic com a key no servidor.

Exemplo de Cloudflare Worker:
```js
export default {
  async fetch(request) {
    const body = await request.json();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY, // variável de ambiente
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    return new Response(await res.text(), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
```

Depois, no `game.js`, troque a URL:
```js
const response = await fetch('https://SEU-WORKER.workers.dev', { ... });
```

---

## Estrutura

```
o-que-espreita/
├── index.html   — estrutura da página
├── style.css    — visual, animações, efeitos
├── game.js      — lógica do jogo e chamadas à API
└── README.md    — este arquivo
```

---

## Tecnologias

- HTML/CSS/JS puro — zero dependências
- [Anthropic API](https://docs.anthropic.com) — `claude-sonnet-4-20250514`
- Google Fonts — Share Tech Mono + Creepster
