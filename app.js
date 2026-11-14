(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const kindOf = (id) => KINDS.find((k) => k.id === id) || { kana: '', color: '#888' };

  // ---------- 写真の保存（このブラウザの中だけ） ----------
  const DB_NAME = 'kuruma-zukan';
  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const store = req.result.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
          store.createIndex('carId', 'carId');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction('photos', mode);
      const result = fn(t.objectStore('photos'));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  const listPhotos = (carId) => tx('readonly', (s) => s.index('carId').getAll(carId));
  const addPhoto = (carId, blob) => tx('readwrite', (s) => s.add({ carId, blob, added: Date.now() }));
  const deletePhoto = (id) => tx('readwrite', (s) => s.delete(id));

  // 大きすぎる写真は縮めてから保存する（容量の節約）
  function shrink(file, max = 1600) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob((b) => resolve(b || file), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  // ---------- 一覧 ----------
  let currentKind = 'all';

  function renderKinds() {
    const used = new Set(CARS.map((c) => c.kind));
    const items = [{ id: 'all', kana: 'ぜんぶ' }, ...KINDS.filter((k) => used.has(k.id))];
    const nav = $('kinds');
    nav.innerHTML = '';
    nav.hidden = items.length <= 2;
    for (const k of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = k.kana;
      b.setAttribute('aria-pressed', String(k.id === currentKind));
      b.addEventListener('click', () => { currentKind = k.id; renderKinds(); renderCards(); });
      nav.appendChild(b);
    }
  }

  function renderCards() {
    const box = $('cards');
    box.innerHTML = '';
    const cars = CARS.filter((c) => currentKind === 'all' || c.kind === currentKind);
    if (!cars.length) {
      box.innerHTML = '<p class="empty">まだ ないよ</p>';
      return;
    }
    for (const c of cars) {
      const k = kindOf(c.kind);
      const a = document.createElement('a');
      a.className = 'card';
      a.href = '#/car/' + c.id;
      a.innerHTML = `
        <div class="pic" style="background:${k.color}22">
          <img src="${c.poster}" alt="" loading="lazy">
        </div>
        <div class="label">
          <div class="kana"></div>
          <div class="kind"></div>
        </div>`;
      a.querySelector('.kana').textContent = c.kana;
      a.querySelector('.kind').textContent = k.kana;
      box.appendChild(a);
    }
  }

  // ---------- 1台のページ ----------
  let current = null;
  let audio = null;
  const photoUrls = [];

  function creditNode(cr, prefix) {
    const frag = document.createDocumentFragment();
    frag.append(prefix + `「${cr.title}」 作者 ${cr.author}`);
    if (cr.source) {
      frag.append('（');
      if (cr.sourceUrl) {
        const a = document.createElement('a');
        a.href = cr.sourceUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = cr.source;
        frag.append(a);
      } else {
        frag.append(cr.source);
      }
      frag.append('）');
    }
    frag.append('、ライセンス ');
    const l = document.createElement('a');
    l.href = cr.licenseUrl;
    l.target = '_blank';
    l.rel = 'noopener';
    l.textContent = cr.license;
    frag.append(l);
    if (cr.changes) frag.append(`。${cr.changes}`);
    return frag;
  }

  function showCar(car) {
    current = car;
    const k = kindOf(car.kind);
    const chip = $('car-kind');
    chip.textContent = k.kana;
    chip.style.background = k.color;
    $('car-kana').textContent = car.kana;
    $('car-say').textContent = car.say;
    $('car-name').textContent = car.name;
    $('car-maker').textContent = car.maker;
    $('car-years').textContent = car.years;

    const credit = $('car-credit');
    credit.innerHTML = '';
    credit.append(creditNode(car.credit, '3Dモデル：'));
    if (car.sound && car.soundCredit) {
      credit.append(document.createElement('br'), creditNode(car.soundCredit, 'エンジン音：'));
    }

    const stage = $('stage');
    stage.innerHTML = '';
    const mv = document.createElement('model-viewer');
    mv.setAttribute('src', car.model);
    mv.setAttribute('poster', car.poster);
    mv.setAttribute('alt', car.kana);
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('touch-action', 'pan-y');
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('auto-rotate-delay', '1500');
    mv.setAttribute('rotation-per-second', '20deg');
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('camera-orbit', '35deg 75deg auto');
    stage.style.background = k.color + '18';
    stage.appendChild(mv);

    stopSound();
    const sb = $('sound-btn');
    sb.hidden = !car.sound;
    sb.setAttribute('aria-pressed', 'false');

    renderPhotos();
  }

  function stopSound() {
    if (audio) { audio.pause(); audio = null; }
    const sb = $('sound-btn');
    sb.setAttribute('aria-pressed', 'false');
    sb.textContent = '🔊 えんじんの おとを きく';
  }

  $('sound-btn').addEventListener('click', () => {
    if (!current || !current.sound) return;
    if (audio) { stopSound(); return; }
    audio = new Audio(current.sound);
    audio.addEventListener('ended', stopSound);
    audio.play().catch(stopSound);
    const sb = $('sound-btn');
    sb.setAttribute('aria-pressed', 'true');
    sb.textContent = '■ とめる';
  });

  async function renderPhotos() {
    const grid = $('photo-grid');
    const carId = current.id;
    let photos = [];
    try {
      photos = await listPhotos(carId);
    } catch (e) {
      $('photo-note').textContent = 'このブラウザでは写真を保存できないようです。';
      return;
    }
    if (!current || current.id !== carId) return;
    photoUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
    grid.innerHTML = '';
    photos.sort((a, b) => b.added - a.added);
    for (const p of photos) {
      const url = URL.createObjectURL(p.blob);
      photoUrls.push(url);
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'しゃしんを おおきく みる');
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      b.appendChild(img);
      b.addEventListener('click', () => openViewer(p.id, url));
      grid.appendChild(b);
    }
    $('photo-note').textContent = '';
  }

  $('photo-input').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!current || !files.length) return;
    const carId = current.id;
    $('photo-note').textContent = 'いれています…';
    try {
      for (const f of files) {
        await addPhoto(carId, await shrink(f));
      }
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch (err) {
      $('photo-note').textContent = '写真を保存できませんでした（容量がいっぱいかもしれません）。';
      return;
    }
    if (current && current.id === carId) renderPhotos();
  });

  // ---------- 写真を大きく見る ----------
  let viewing = null;
  let armTimer = null;
  function openViewer(id, url) {
    viewing = id;
    $('viewer-img').src = url;
    disarm();
    $('viewer').hidden = false;
  }
  function closeViewer() {
    $('viewer').hidden = true;
    viewing = null;
    disarm();
  }
  function disarm() {
    clearTimeout(armTimer);
    const d = $('viewer-del');
    d.classList.remove('armed');
    d.textContent = 'けす';
  }
  $('viewer-close').addEventListener('click', closeViewer);
  $('viewer-del').addEventListener('click', async () => {
    const d = $('viewer-del');
    if (!d.classList.contains('armed')) {
      d.classList.add('armed');
      d.textContent = 'ほんとうに けす';
      armTimer = setTimeout(disarm, 3000);
      return;
    }
    const id = viewing;
    closeViewer();
    await deletePhoto(id);
    renderPhotos();
  });

  // ---------- このアプリについて ----------
  function renderAbout() {
    const ul = $('credits');
    ul.innerHTML = '';
    for (const c of CARS) {
      const li = document.createElement('li');
      li.append(creditNode(c.credit, `${c.maker} ${c.name}：3Dモデル `));
      ul.appendChild(li);
      if (c.sound && c.soundCredit) {
        const li2 = document.createElement('li');
        li2.append(creditNode(c.soundCredit, `${c.maker} ${c.name}：エンジン音 `));
        ul.appendChild(li2);
      }
    }
  }

  // ---------- 画面の切りかえ ----------
  let lastListScroll = 0;
  function route() {
    const h = location.hash;
    const m = h.match(/^#\/car\/([\w-]+)/);
    const listV = $('list-view');
    const wasList = !listV.hidden;
    if (wasList) lastListScroll = window.scrollY;
    closeViewer();

    if (m) {
      const car = CARS.find((c) => c.id === m[1]);
      if (car) {
        listV.hidden = true;
        $('about-view').hidden = true;
        $('car-view').hidden = false;
        showCar(car);
        window.scrollTo(0, 0);
        return;
      }
    }
    stopSound();
    current = null;
    $('stage').innerHTML = '';
    $('car-view').hidden = true;
    if (h === '#/about') {
      listV.hidden = true;
      $('about-view').hidden = false;
      renderAbout();
      window.scrollTo(0, 0);
      return;
    }
    $('about-view').hidden = true;
    listV.hidden = false;
    window.scrollTo(0, lastListScroll);
  }

  renderKinds();
  renderCards();
  window.addEventListener('hashchange', route);
  route();
})();
