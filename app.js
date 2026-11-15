(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const tagOf = (id) => TAGS.find((t) => t.id === id) || { id, kana: id, color: '#888' };
  // 車の最初のタグ（メーカー）
  const makerOf = (car) => tagOf(car.tags[0]);

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
  const selected = new Set();   // えらんでいるタグ
  let filterOpen = false;
  let query = '';

  // さがすときは、カタカナをひらがなに、大文字を小文字にそろえて比べる
  const norm = (s) => String(s).toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[\s　]/g, '');
  const matches = (c, q) => !q || [c.kana, c.name, c.maker, c.credit.title, ...c.tags.map((t) => tagOf(t).kana)].some((t) => norm(t).includes(q));

  // えらんだタグに合う車か。同じ列（めーかー など）の中は「どれか」、
  // ちがう列どうしは「どちらも」で しぼる
  function tagMatch(car) {
    for (const g of TAG_GROUPS) {
      const want = TAGS.filter((t) => t.group === g.id && selected.has(t.id));
      if (want.length && !want.some((t) => car.tags.includes(t.id))) return false;
    }
    return true;
  }

  function toggleTag(id) {
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    renderTags();
    renderCards();
  }

  function renderTags() {
    const used = new Set(CARS.flatMap((c) => c.tags));
    const nav = $('tags');
    nav.innerHTML = '';

    // ひらく・とじる ボタンと、いま えらんでいるタグ
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'filter-open';
    open.setAttribute('aria-expanded', String(filterOpen));
    open.textContent = (filterOpen ? '▲ ' : '▼ ') + 'しぼりこむ';
    open.addEventListener('click', () => { filterOpen = !filterOpen; renderTags(); });
    bar.appendChild(open);
    for (const id of selected) {
      const t = tagOf(id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'filter-chip';
      chip.textContent = t.kana + ' ✕';
      chip.setAttribute('aria-label', t.kana + ' を はずす');
      chip.addEventListener('click', () => toggleTag(id));
      bar.appendChild(chip);
    }
    nav.appendChild(bar);

    if (!filterOpen) return;
    const panel = document.createElement('div');
    panel.className = 'filter-panel';
    for (const g of TAG_GROUPS) {
      const tags = TAGS.filter((t) => t.group === g.id && used.has(t.id));
      if (!tags.length) continue;
      const label = document.createElement('div');
      label.className = 'tag-label';
      label.textContent = g.kana;
      panel.appendChild(label);
      const row = document.createElement('div');
      row.className = 'tag-wrap';
      for (const t of tags) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = t.kana;
        b.setAttribute('aria-pressed', String(selected.has(t.id)));
        b.addEventListener('click', () => toggleTag(t.id));
        row.appendChild(b);
      }
      panel.appendChild(row);
    }
    const foot = document.createElement('div');
    foot.className = 'filter-foot';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'filter-clear';
    clear.textContent = 'ぜんぶ はずす';
    clear.disabled = !selected.size;
    clear.addEventListener('click', () => { selected.clear(); renderTags(); renderCards(); });
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'filter-done';
    done.textContent = 'とじる';
    done.addEventListener('click', () => { filterOpen = false; renderTags(); });
    foot.append(clear, done);
    panel.appendChild(foot);
    nav.appendChild(panel);
  }

  function renderCards() {
    const box = $('cards');
    box.innerHTML = '';
    const q = norm(query);
    const cars = CARS.filter((c) => tagMatch(c) && matches(c, q));
    const narrowed = q || selected.size;
    $('count').textContent = narrowed ? `${cars.length}だい みつかったよ` : `ぜんぶで ${CARS.length}だい`;
    if (!cars.length) {
      box.innerHTML = `<p class="empty">${narrowed ? 'みつからないよ' : 'まだ ないよ'}</p>`;
      return;
    }
    for (const c of cars) {
      const k = makerOf(c);
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

  $('search').addEventListener('input', (e) => { query = e.target.value; renderCards(); });

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
    const k = makerOf(car);
    const chips = $('car-tags');
    chips.innerHTML = '';
    for (const id of car.tags) {
      const t = tagOf(id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tag-chip';
      b.textContent = t.kana;
      b.style.background = t.color;
      // タグを押すと、そのタグの車だけの一覧にもどる
      b.addEventListener('click', () => { selected.clear(); selected.add(id); filterOpen = false; lastListScroll = 0; renderTags(); renderCards(); location.hash = '#/list'; });
      chips.appendChild(b);
    }
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
    mv.setAttribute('camera-orbit', car.orbit || '35deg 75deg auto');
    stage.style.background = k.color + '18';
    stage.appendChild(mv);
    // 3Dを 画面いっぱいに する ボタン
    const full = document.createElement('button');
    full.type = 'button';
    full.className = 'full-btn';
    full.id = 'full-btn';
    full.addEventListener('click', () => setFull(!stage.classList.contains('full')));
    stage.appendChild(full);
    setFull(false);
    renderColors(car, mv);

    stopSound();
    const sb = $('sound-btn');
    sb.hidden = !car.sound;
    sb.setAttribute('aria-pressed', 'false');

    renderPhotos();
    showCarPos();
  }

  // ---------- 色の切りかえ ----------
  function renderColors(car, mv) {
    const box = $('colors');
    const row = $('swatches');
    row.innerHTML = '';
    box.hidden = true;
    if (!car.paint) return;
    let chosen = 0;
    const label = $('color-name');
    const showName = () => {
      const col = car.paint.colors[chosen];
      label.textContent = col.kana;
      $('color-note').textContent = car.paint.real ? col.name : '';
    };
    showName();
    const apply = () => {
      if (!mv.model) return;
      const col = car.paint.colors[chosen];
      const mat = mv.model.materials.find((m) => m.name === car.paint.material);
      if (mat) mat.pbrMetallicRoughness.setBaseColorFactor(col.css);
      if (car.paint.hood) {
        const h = mv.model.materials.find((m) => m.name === car.paint.hood);
        if (h) h.pbrMetallicRoughness.setBaseColorFactor(col.decal ? '#070707' : col.css);
      }
      // ドアの文字など、色によって出したり消したりする部品
      if (car.paint.decal) {
        const d = mv.model.materials.find((m) => m.name === car.paint.decal);
        if (d) {
          if (decalMode === null) decalMode = d.getAlphaMode();
          if (col.decal) {
            d.setAlphaMode(decalMode);
            d.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
          } else {
            d.setAlphaMode('MASK');
            d.setAlphaCutoff(0.5);
            d.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 0]);
          }
        }
      }
    };
    let decalMode = null;
    car.paint.colors.forEach((col, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      if (col.decal && car.paint.decalMark) b.textContent = car.paint.decalMark;
      b.style.background = col.css;
      b.setAttribute('aria-label', col.kana);
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        chosen = i;
        showName();
        row.querySelectorAll('.swatch').forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
        apply();
      });
      row.appendChild(b);
    });
    // 色のボタンは、3Dモデルを読みこみ終わってから出す
    mv.addEventListener('load', () => { box.hidden = false; if (chosen) apply(); });
  }

  // ---------- クイズ ----------
  const shuffle = (a) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  let quiz = null;

  function startQuiz() {
    quiz = { cars: shuffle(CARS).slice(0, 5), at: 0, right: 0 };
    $('quiz-end').hidden = true;
    $('quiz-play').hidden = false;
    showQuestion();
  }

  function showQuestion() {
    const car = quiz.cars[quiz.at];
    $('quiz-count').textContent = `${quiz.at + 1} / ${quiz.cars.length}`;
    $('quiz-img').src = car.poster;
    $('quiz-result').textContent = '';
    $('quiz-result').className = 'quiz-result';
    $('quiz-next').hidden = true;
    // はずれは、まず図鑑のほかの車から。足りない分は QUIZ_DECOYS から
    const others = shuffle(CARS.filter((c) => c.kana !== car.kana).map((c) => c.kana));
    const decoys = shuffle((window.QUIZ_DECOYS || []).filter((n) => n !== car.kana && !others.includes(n)));
    const wrong = [...new Set(others)].concat(decoys).slice(0, 2);
    const box = $('quiz-choices');
    box.innerHTML = '';
    for (const name of shuffle([car.kana, ...wrong])) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', () => answer(b, name === car.kana, car));
      box.appendChild(b);
    }
  }

  function answer(btn, ok, car) {
    const buttons = [...$('quiz-choices').children];
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.textContent === car.kana) b.classList.add('right');
    });
    const res = $('quiz-result');
    if (ok) {
      quiz.right++;
      res.textContent = '◯ せいかい！';
      res.classList.add('ok');
    } else {
      btn.classList.add('wrong');
      res.textContent = `ざんねん… こたえは「${car.kana}」`;
      res.classList.add('ng');
    }
    const next = $('quiz-next');
    next.textContent = quiz.at + 1 < quiz.cars.length ? 'つぎへ' : 'けっかを みる';
    next.hidden = false;
  }

  $('quiz-next').addEventListener('click', () => {
    quiz.at++;
    if (quiz.at < quiz.cars.length) { showQuestion(); return; }
    $('quiz-play').hidden = true;
    $('quiz-end').hidden = false;
    $('quiz-count').textContent = '';
    $('quiz-score').textContent = `${quiz.cars.length}もん ちゅう ${quiz.right}もん せいかい`;
    $('quiz-msg').textContent = quiz.right === quiz.cars.length ? 'ぜんぶ せいかい！ すごい！' : 'また やってみよう！';
  });
  $('quiz-again').addEventListener('click', startQuiz);

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

  // ---------- となりの車へ（まえ・つぎ の ボタン） ----------
  // いま しぼりこんでいる車の中で、まえ・つぎ に うつる
  function carOrder() {
    const q = norm(query);
    const list = CARS.filter((c) => tagMatch(c) && matches(c, q));
    return current && list.includes(current) ? list : CARS;
  }
  function stepCar(delta) {
    if (!current) return;
    const list = carOrder();
    if (list.length < 2) return;
    const next = list[(list.indexOf(current) + delta + list.length) % list.length];
    const view = $('car-view');
    view.classList.remove('slide-next', 'slide-prev');
    void view.offsetWidth;
    view.classList.add(delta > 0 ? 'slide-next' : 'slide-prev');
    location.replace('#/car/' + next.id);
  }
  function showCarPos() {
    const list = carOrder();
    $('car-pos').textContent = `${list.indexOf(current) + 1} / ${list.length}`;
    $('car-prev').disabled = $('car-next').disabled = list.length < 2;
  }
  $('car-prev').addEventListener('click', () => stepCar(-1));
  $('car-next').addEventListener('click', () => stepCar(1));

  // ---------- 3Dを 画面いっぱいに ----------
  function setFull(on) {
    const stage = $('stage');
    const mv = stage.querySelector('model-viewer');
    const btn = $('full-btn');
    stage.classList.toggle('full', on);
    document.body.classList.toggle('no-scroll', on);
    // いっぱいのときは、たてに うごかしても 車が まわるようにする
    if (mv) mv.setAttribute('touch-action', on ? 'none' : 'pan-y');
    if (btn) {
      btn.textContent = on ? '✕ とじる' : '⤢ おおきく';
      btn.setAttribute('aria-label', on ? 'もとの おおきさに もどす' : '3Dを がめん いっぱいに する');
    }
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setFull(false); });

  // ---------- トップ ----------
  // きょうの くるま は、アプリを ひらくたびに 1台 えらぶ
  const todayCar = CARS[Math.floor(Math.random() * CARS.length)];
  function showHome() {
    $('today').href = '#/car/' + todayCar.id;
    $('today-name').textContent = todayCar.kana;
    const box = $('today-stage');
    box.style.background = makerOf(todayCar).color + '18';
    if (box.firstChild) return;
    const mv = document.createElement('model-viewer');
    mv.setAttribute('src', todayCar.model);
    mv.setAttribute('poster', todayCar.poster);
    mv.setAttribute('alt', todayCar.kana);
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('auto-rotate-delay', '0');
    mv.setAttribute('rotation-per-second', '24deg');
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('camera-orbit', todayCar.orbit || '35deg 75deg auto');
    box.appendChild(mv);
  }

  // ---------- 画面の切りかえ ----------
  let lastListScroll = 0;
  function route() {
    const h = location.hash;
    const m = h.match(/^#\/car\/([\w-]+)/);
    const views = ['home-view', 'list-view', 'car-view', 'quiz-view', 'about-view'];
    const show = (id) => views.forEach((v) => { $(v).hidden = v !== id; });
    if (!$('list-view').hidden) lastListScroll = window.scrollY;
    closeViewer();
    setFull(false);

    const car = m && CARS.find((c) => c.id === m[1]);
    if (car) {
      $('today-stage').innerHTML = '';
      show('car-view');
      showCar(car);
      window.scrollTo(0, 0);
      return;
    }
    stopSound();
    current = null;
    $('stage').innerHTML = '';
    if (h === '#/list') {
      $('today-stage').innerHTML = '';
      show('list-view');
      window.scrollTo(0, lastListScroll);
      return;
    }
    if (h === '#/quiz') {
      $('today-stage').innerHTML = '';
      show('quiz-view');
      startQuiz();
    } else if (h === '#/about') {
      $('today-stage').innerHTML = '';
      show('about-view');
      renderAbout();
    } else {
      show('home-view');
      showHome();
    }
    window.scrollTo(0, 0);
  }

  renderTags();
  renderCards();
  window.addEventListener('hashchange', route);
  route();
})();
