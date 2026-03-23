# █ O QUE ESPREITA █

Jogo de terror textual onde você explora uma mansão abandonada enquanto uma presença invisível se aproxima. Quanto mais perto o monstro, mais o texto se corrompe e a silhueta da criatura começa a aparecer por trás das palavras.

## Como rodar

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/o-que-espreita.git
cd o-que-espreita
```

### 2. Configure a API Key
```bash
cp .env.example .env
# Edite o .env e coloque sua ANTHROPIC_API_KEY
```

Obtenha sua chave em: https://console.anthropic.com

### 3. Inicie o servidor
```bash
node server.js
```

### 4. Abra no navegador
```
http://localhost:3000
```

## Estrutura
```
o-que-espreita/
├── server.js        # Servidor Node.js + proxy para a API
├── package.json
├── .env.example
├── .gitignore
└── public/
    ├── index.html   # Estrutura da página
    ├── style.css    # Visual (terminal de terror)
    └── game.js      # Lógica do jogo
```

## Como funciona

- Você digita ações em português e o Claude narra o resultado
- Uma barra de **proximidade** (0–100%) rastreia o quão perto o monstro está
- Conforme a proximidade aumenta, o texto se **corrompe progressivamente**
- A partir de 40%, a **silhueta do monstro** aparece por trás do texto
- Acima de 70%, glitches visuais, pulsação e tremores de tela
- Chegou a 100%? A criatura te encontrou. **Fim.**

## Dicas
- Fugir e se esconder **diminui** a proximidade
- Fazer barulho **aumenta** a proximidade
- Nunca vá em direção ao que está no porão
