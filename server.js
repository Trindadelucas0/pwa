/**
 * Servidor Express para a página de teste PWA.
 * Sirve as views EJS e arquivos estáticos (manifest, ícones, sw).
 * Ícone do app na interface: fi fi-bs-dog-leashed (ver views/index.ejs e README).
 */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3222;

// Engine EJS (máximo 3 telas na única view)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Arquivos estáticos: manifest.json, ícones, sw.js, js/app.js
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal: única página com as 3 telas de teste (Testes, Câmera & Mic, Status)
app.get('/', (req, res) => {
  res.render('index');
});

app.listen(PORT, () => {
  console.log(`PWA Teste rodando em http://localhost:${PORT}`);
});
