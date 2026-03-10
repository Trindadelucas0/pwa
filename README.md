# PWA Teste

Página de teste para validar recursos de PWA no **iPhone** e **Android** (notificações, câmera, geolocalização, etc.). Use esta página antes de criar o sistema completo e o manifest definitivo.

## Ícone do aplicativo

O ícone do app é o **dog leashed** (cachorro com coleira): classe CSS `fi fi-bs-dog-leashed` (Flaticon Uicons). Está no header da página e deve ser usado como referência para os ícones do manifest (`/icons/icon-192.png` e `icon-512.png`). Substitua os PNGs em `public/icons/` por ícones 192×192 e 512×512 com o mesmo visual.

## Como rodar

Na pasta **pwa**:

```bash
cd pwa
npm install
npm start
```

Abre no navegador: **http://localhost:3000**

## Testar no celular (iPhone e Android)

1. **Servidor acessível na rede**  
   Use o IP da sua máquina na mesma rede (ex.: `http://192.168.1.10:3000`) ou um túnel (ngrok, localtunnel, etc.).

2. **HTTPS**  
   No celular, notificações e alguns recursos costumam exigir HTTPS. Em desenvolvimento use:
   - **Android**: Chrome pode permitir `localhost` com flags; para IP use túnel HTTPS.
   - **iPhone**: use um túnel HTTPS (ngrok, etc.) ou sirva com HTTPS na rede.

3. **Instalar como app**  
   No Android: Chrome → menu (⋮) → “Instalar app” / “Adicionar à tela inicial”.  
   No iPhone: Safari → Compartilhar → “Adicionar à Tela de Início”.

## O que a página testa

- **Tela 1 – Testes principais:** notificações, vibração, geolocalização, status da bateria.
- **Tela 2 – Câmera e microfone:** ligar câmera (vídeo ao vivo), testar permissão de microfone.
- **Tela 3 – Status:** online, Service Worker, permissão de notificações, HTTPS.

## Stack

- **Backend:** Node.js + Express  
- **View:** 1 página EJS com 3 “telas” (seções)  
- **Estilo:** Tailwind CSS (CDN)  
- **Ícone:** Flaticon Uicons (`fi fi-bs-dog-leashed`)  
- **PWA:** `manifest.json`, Service Worker básico em `public/sw.js`

## Estrutura

Tudo fica dentro da pasta **pwa**:

```
pwa/
├── server.js          # Servidor Express
├── package.json
├── views/
│   └── index.ejs      # Única página (3 telas)
├── public/
│   ├── manifest.json  # Manifest PWA (ícone = dog-leashed)
│   ├── sw.js          # Service Worker
│   ├── js/app.js      # Lógica dos botões de teste
│   └── icons/         # Ícones 192 e 512 (substituir pelo dog-leashed)
└── README.md
```
