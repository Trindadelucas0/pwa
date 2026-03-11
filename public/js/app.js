/**
 * PWA Teste - Lógica da página de testes.
 * Testes: notificações, vibração, geolocalização, bateria, câmera, microfone.
 */

(function () {
  'use strict';

  // ----- Navegação entre as 3 telas -----
  const telas = document.querySelectorAll('.tela');
  const botoesTela = document.querySelectorAll('.tela-btn');

  function mostrarTela(num) {
    telas.forEach((t, i) => t.classList.toggle('hidden', i + 1 !== num));
    botoesTela.forEach((b, i) => {
      const ativo = i + 1 === num;
      b.classList.toggle('text-cyan-400', ativo);
      b.classList.toggle('border-cyan-400', ativo);
      b.classList.toggle('text-slate-400', !ativo);
      b.classList.toggle('border-transparent', !ativo);
    });
  }

  botoesTela.forEach(btn => {
    btn.addEventListener('click', () => mostrarTela(Number(btn.dataset.tela)));
  });

  function msg(elId, text, isError) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'mt-4 text-sm min-h-[2rem] ' + (isError ? 'text-red-400' : 'text-slate-400');
  }

  // ----- Notificações -----
  document.getElementById('btn-notificacao').addEventListener('click', async () => {
    const el = 'msg-tela1';
    if (!('Notification' in window)) {
      msg(el, 'Notificações não suportadas.', true);
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('PWA Teste', { body: 'Notificação de teste enviada!', icon: '/icons/icon-192.png' });
      msg(el, 'Notificação enviada.');
      return;
    }
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('PWA Teste', { body: 'Permissão concedida! Teste enviado.', icon: '/icons/icon-192.png' });
        msg(el, 'Permissão concedida e notificação enviada.');
      } else {
        msg(el, 'Permissão negada.', true);
      }
    } else {
      msg(el, 'Permissão negada. Habilite nas configurações do site.', true);
    }
  });

  // ----- Vibração -----
  document.getElementById('btn-vibracao').addEventListener('click', () => {
    if (!navigator.vibrate) {
      msg('msg-tela1', 'Vibração não suportada (ex: iOS pode não suportar).', true);
      return;
    }
    navigator.vibrate([200, 100, 200]);
    msg('msg-tela1', 'Vibração executada (200ms, 100ms pausa, 200ms).');
  });

  // ----- Geolocalização -----
  document.getElementById('btn-geolocalizacao').addEventListener('click', () => {
    const el = 'msg-tela1';
    if (!navigator.geolocation) {
      msg(el, 'Geolocalização não suportada.', true);
      return;
    }
    msg(el, 'Obtendo posição...');
    navigator.geolocation.getCurrentPosition(
      (pos) => msg(el, `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`),
      (err) => msg(el, 'Erro: ' + (err.message || 'acesso negado'), true)
    );
  });

  // ----- Bateria -----
  document.getElementById('btn-bateria').addEventListener('click', async () => {
    const el = 'msg-tela1';
    const nav = navigator;
    const bat = nav.getBattery ? await nav.getBattery() : null;
    if (!bat) {
      msg(el, 'API de bateria não suportada (ex: iOS).', true);
      return;
    }
    const pct = Math.round(bat.level * 100);
    const cargando = bat.charging ? ' (carregando)' : '';
    msg(el, `Bateria: ${pct}%${cargando}`);
  });

  // ----- Câmera -----
  const video = document.getElementById('video-camera');
  const areaCamera = document.getElementById('area-camera');
  let streamCamera = null;

  document.getElementById('btn-camera').addEventListener('click', async () => {
    const el = 'msg-tela2';
    try {
      if (streamCamera) {
        streamCamera.getTracks().forEach(t => t.stop());
        streamCamera = null;
        video.srcObject = null;
        areaCamera.classList.add('hidden');
        msg(el, 'Câmera desligada.');
        return;
      }
      streamCamera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = streamCamera;
      areaCamera.classList.remove('hidden');
      msg(el, 'Câmera ligada. Toque de novo para desligar.');
    } catch (err) {
      msg(el, 'Erro ao acessar câmera: ' + (err.message || 'permissão negada'), true);
    }
  });

  // ----- Microfone -----
  document.getElementById('btn-microfone').addEventListener('click', async () => {
    const el = 'msg-tela2';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      msg(el, 'Microfone acessado com sucesso. Permissão OK.');
    } catch (err) {
      msg(el, 'Erro ao acessar microfone: ' + (err.message || 'permissão negada'), true);
    }
  });

  // ----- Status PWA (Tela 3) -----
  function atualizarStatus() {
    document.getElementById('status-online').textContent = navigator.onLine ? 'Sim' : 'Não';
    document.getElementById('status-https').textContent = location.protocol === 'https:' ? 'Sim' : 'Não (use HTTPS no celular)';
    document.getElementById('status-notif').textContent = 'Notification' in window ? (Notification.permission || 'não solicitado') : 'não suportado';

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      document.getElementById('status-sw').textContent = 'Registrado';
    } else if ('serviceWorker' in navigator) {
      document.getElementById('status-sw').textContent = 'Não registrado';
    } else {
      document.getElementById('status-sw').textContent = 'Não suportado';
    }
  }

  document.getElementById('btn-atualizar-status').addEventListener('click', atualizarStatus);
  atualizarStatus();

  // ----- Instalação do PWA (Android/desktop + instruções iOS) -----
  let deferredPrompt = null;
  const btnInstalar = document.getElementById('btn-instalar');
  const iosModal = document.getElementById('ios-modal');
  const iosModalClose = document.getElementById('ios-modal-close');

  function isIOS() {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }

  // Android / Chrome / desktop: captura o evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (btnInstalar) {
      btnInstalar.classList.remove('hidden');
    }
  });

  if (btnInstalar) {
    btnInstalar.addEventListener('click', async () => {
      // Se o navegador suportar beforeinstallprompt (Android/desktop)
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        return;
      }

      // iOS: mostra modal com instruções de "Adicionar à Tela de Início"
      if (isIOS()) {
        if (iosModal) {
          iosModal.classList.remove('hidden');
        } else {
          alert('No iPhone, use o botão Compartilhar do Safari e escolha "Adicionar à Tela de Início".');
        }
        return;
      }

      // Outros navegadores sem suporte
      alert('Seu navegador não oferece instalação automática de PWA. Use a opção "Adicionar à tela inicial" do próprio navegador.');
    });
  }

  if (iosModal && iosModalClose) {
    iosModalClose.addEventListener('click', () => {
      iosModal.classList.add('hidden');
    });
    iosModal.addEventListener('click', (event) => {
      if (event.target === iosModal) {
        iosModal.classList.add('hidden');
      }
    });
  }
})();
