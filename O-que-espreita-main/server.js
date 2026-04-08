const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
// Hugging Face Inference API — gratuita, sem necessidade de API key
// (Opcional: para uso ilimitado, crie conta em huggingface.co e adicione aqui)
const HF_API_KEY = process.env.HF_API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  // ── CORS headers ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── API proxy — Hugging Face Inference API ──
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const parsed = JSON.parse(body);

      // Converte formato Anthropic -> formato Hugging Face chat
      const messages = [];
      if (parsed.system) {
        messages.push({ role: 'system', content: parsed.system });
      }
      if (parsed.messages) {
        messages.push(...parsed.messages);
      }

      const hfBody = JSON.stringify({
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        max_tokens: parsed.max_tokens || 1000,
        messages,
      });

      const options = {
        hostname: 'api-inference.huggingface.co',
        path: '/models/Qwen/Qwen2.5-Coder-32B-Instruct/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(hfBody),
        },
      };

      if (HF_API_KEY) {
        options.headers['Authorization'] = `Bearer ${HF_API_KEY}`;
      }

      const hfReq = https.request(options, hfRes => {
        let data = '';
        hfRes.on('data', chunk => data += chunk);
        hfRes.on('end', () => {
          // Converte resposta Hugging Face -> formato que o game.js espera
          try {
            const hfData = JSON.parse(data);
            const content = hfData.choices?.[0]?.message?.content || 'Erro ao obter resposta.';

            if (hfRes.statusCode >= 400) {
              const errMsg = hfData.error || hfData.message || 'Erro na API';
              res.writeHead(hfRes.statusCode, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: errMsg }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ content: [{ text: content }] }));
            }
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro ao processar resposta da API' }));
          }
        });
      });

      hfReq.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      hfReq.write(hfBody);
      hfReq.end();
    });
    return;
  }

  // ── Static files ──
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n🕷  O Que Espreita rodando em http://localhost:${PORT}`);
  console.log(`   IA: Hugging Face (Qwen2.5-Coder) — ${HF_API_KEY ? 'com API key ✓' : 'sem API key (gratuito)'}\n`);
});
