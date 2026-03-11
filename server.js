/**
 * Servidor Express para a página de teste PWA.
 * Sirve as views EJS e arquivos estáticos (manifest, ícones, sw).
 * Ícone do app na interface: fi fi-bs-dog-leashed (ver views/index.ejs e README).
 */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Engine EJS (máximo 3 telas na única view)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Arquivos estáticos: manifest.json, ícones, sw.js, js/app.js
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal: única página com as 3 telas de teste (Testes, Câmera & Mic, Status)
app.get('/', (req, res) => {
  res.render('index');
});

// Tenta subir na porta definida; se estiver em uso (EADDRINUSE), tenta a próxima
function start(port) {
  const server = app.listen(port, () => {
    console.log(`PWA Teste rodando em http://localhost:${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Porta ${port} em uso, tentando ${port + 1}...`);
      start(port + 1);
    } else {
      throw err;
    }
  });
}
start(PORT);
