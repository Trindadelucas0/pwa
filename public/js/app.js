/**
 * PWA Teste - Lógica da página de testes.
 * Testes: notificações, vibração, geolocalização, bateria, câmera, microfone.
 */

(function () {
  'use strict';

  // ----- Mapa / Geolocalização avançada -----
  let mapaGeoloc = null;
  let marcadorUsuario = null;
  let marcadorCachorro = null;
  let rotaLayer = null;
  let userCoords = null;
  const raiosCirculos = [];
  const marcadoresLugares = [];

  const mapWrapperEl = document.getElementById('map-geoloc-wrapper');
  const mapInfoEl = document.getElementById('map-info');

  function setMapInfo(text) {
    if (!mapInfoEl) return;
    mapInfoEl.textContent = text || '';
  }

  function initMapaIfNeeded(centerLat, centerLng) {
    if (!mapWrapperEl) return;
    mapWrapperEl.classList.remove('hidden');
    if (mapaGeoloc) {
      return;
    }
    if (typeof L === 'undefined') {
      setMapInfo('Mapa indisponível (Leaflet não carregou).');
      return;
    }
    mapaGeoloc = L.map('map-geoloc').setView([centerLat, centerLng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapaGeoloc);

    // Marcador do usuário (azul)
    marcadorUsuario = L.marker([centerLat, centerLng]).addTo(mapaGeoloc);

    // Marcador do cachorro (laranja, arrastável)
    marcadorCachorro = L.marker([centerLat, centerLng], { draggable: true }).addTo(mapaGeoloc);
    marcadorCachorro.on('dragend', () => {
      const pos = marcadorCachorro.getLatLng();
      setMapInfo(`Cachorro marcado em: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
    });
  }

  function atualizarCirculos(lat, lng) {
    if (!mapaGeoloc || typeof L === 'undefined') return;
    // Remove círculos antigos
    raiosCirculos.forEach(c => mapaGeoloc.removeLayer(c));
    raiosCirculos.length = 0;

    const raios = [100, 500, 1000]; // metros
    raios.forEach((r) => {
      const circle = L.circle([lat, lng], {
        radius: r,
        color: '#22d3ee',
        weight: 1,
        fillColor: '#22d3ee',
        fillOpacity: 0.08
      }).addTo(mapaGeoloc);
      raiosCirculos.push(circle);
    });
  }

  function atualizarMarcadores(lat, lng) {
    if (!mapaGeoloc) {
      initMapaIfNeeded(lat, lng);
    }
    if (!mapaGeoloc) return;

    if (marcadorUsuario) {
      marcadorUsuario.setLatLng([lat, lng]);
    }
    if (!marcadorCachorro) {
      marcadorCachorro = L.marker([lat, lng], { draggable: true }).addTo(mapaGeoloc);
    }
    mapaGeoloc.setView([lat, lng], 16);
    atualizarCirculos(lat, lng);
  }

  function getDogLatLng() {
    if (!marcadorCachorro) return null;
    const pos = marcadorCachorro.getLatLng();
    return { lat: pos.lat, lng: pos.lng };
  }

  async function traçarRotaAteCachorro() {
    if (!userCoords || !mapaGeoloc || typeof L === 'undefined') {
      setMapInfo('Precisa primeiro obter sua localização.');
      return;
    }
    const dog = getDogLatLng();
    if (!dog) {
      setMapInfo('Marque a posição do cachorro no mapa.');
      return;
    }

    const url = `https://router.project-osrm.org/route/v1/foot/${userCoords.lng},${userCoords.lat};${dog.lng},${dog.lat}?overview=full&geometries=geojson`;
    try {
      setMapInfo('Calculando rota até o cachorro...');
      const resp = await fetch(url);
      if (!resp.ok) {
        setMapInfo('Não foi possível calcular a rota.');
        return;
      }
      const data = await resp.json();
      const route = data.routes && data.routes[0];
      if (!route || !route.geometry || !route.geometry.coordinates) {
        setMapInfo('Rota não encontrada.');
        return;
      }
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      if (rotaLayer) {
        mapaGeoloc.removeLayer(rotaLayer);
      }
      rotaLayer = L.polyline(coords, { color: '#f97316', weight: 4 }).addTo(mapaGeoloc);
      mapaGeoloc.fitBounds(rotaLayer.getBounds(), { padding: [30, 30] });
      setMapInfo('Rota traçada até o cachorro.');
    } catch (err) {
      setMapInfo('Erro ao buscar rota. Tente novamente.');
    }
  }

  async function buscarLugaresPerto() {
    if (!userCoords || !mapaGeoloc || typeof L === 'undefined') {
      setMapInfo('Precisa primeiro obter sua localização.');
      return;
    }

    // Remove marcadores antigos de lugares
    marcadoresLugares.forEach(m => mapaGeoloc.removeLayer(m));
    marcadoresLugares.length = 0;

    const { lat, lng } = userCoords;
    const raio = 1000; // metros
    const query = `
      [out:json];
      (
        node["leisure"="park"](around:${raio},${lat},${lng});
        node["shop"="pet"](around:${raio},${lat},${lng});
        node["amenity"="veterinary"](around:${raio},${lat},${lng});
      );
      out center;
    `;

    try {
      setMapInfo('Buscando parques, pet shops e veterinários por perto...');
      const resp = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: 'data=' + encodeURIComponent(query)
      });
      if (!resp.ok) {
        setMapInfo('Não foi possível buscar lugares por perto.');
        return;
      }
      const data = await resp.json();
      if (!data.elements || !data.elements.length) {
        setMapInfo('Nenhum lugar encontrado nesse raio.');
        return;
      }
      data.elements.forEach((el) => {
        const eLat = el.lat || (el.center && el.center.lat);
        const eLng = el.lon || (el.center && el.center.lon);
        if (typeof eLat !== 'number' || typeof eLng !== 'number') return;

        let tipo = 'Lugar';
        if (el.tags) {
          if (el.tags.shop === 'pet') tipo = 'Pet shop';
          else if (el.tags.amenity === 'veterinary') tipo = 'Veterinário';
          else if (el.tags.leisure === 'park') tipo = 'Parque';
        }
        const nome = (el.tags && el.tags.name) || '(sem nome)';
        const marker = L.marker([eLat, eLng]).addTo(mapaGeoloc);
        marker.bindPopup(`<strong>${tipo}</strong><br>${nome}`);
        marcadoresLugares.push(marker);
      });
      setMapInfo('Lugares por perto carregados. Toque nos marcadores para ver detalhes.');
    } catch (err) {
      setMapInfo('Erro ao buscar lugares por perto.');
    }
  }

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
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        userCoords = { lat, lng };
        msg(el, `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`);
        atualizarMarcadores(lat, lng);
      },
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

  const btnRotaDog = document.getElementById('btn-rota-dog');
  const btnLugaresPerto = document.getElementById('btn-lugares-perto');

  if (btnRotaDog) {
    btnRotaDog.addEventListener('click', () => {
      traçarRotaAteCachorro();
    });
  }

  if (btnLugaresPerto) {
    btnLugaresPerto.addEventListener('click', () => {
      buscarLugaresPerto();
    });
  }

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
