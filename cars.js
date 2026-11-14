// 図鑑にのせる車の一覧。1台ふやすときは、CARS の中に1つ足します。
//
// kana     : 息子さん向けの名前（ひらがな）
// say      : ひとことの説明（ひらがな。ことばの区切りに空白）
// tags     : タグ（TAGS の中の id を並べる。最初の1つはメーカー）
// name     : 正式な名前
// maker    : メーカー
// years    : 売られていた年
// model    : 3Dモデルのファイル（models/ の中）
// poster   : 一覧に出す絵（posters/ の中）
// orbit    : 最初に見せる向き（書かなければ ななめ前から）
// sound    : エンジン音のファイル（sounds/ の中）。ない車は書かない
// soundCredit : エンジン音の出どころ（sound があるときだけ）
// paint    : 色を切りかえられる車だけ書く。material は車体の色の部品の名前、
//            colors は色の一覧（最初の1つが もとの色）
// credit   : 3Dモデルの出どころ（作者・ライセンス）

// タグ。group ごとに1列で並びます。
window.TAG_GROUPS = [
  { id: 'maker', kana: 'めーかー' },
  { id: 'country', kana: 'くに' },
  { id: 'feature', kana: 'とくちょう' },
];
window.TAGS = [
  { id: 'toyota', group: 'maker', kana: 'とよた', color: '#e63946' },
  { id: 'honda', group: 'maker', kana: 'ほんだ', color: '#f77f00' },
  { id: 'nissan', group: 'maker', kana: 'にっさん', color: '#457b9d' },
  { id: 'mazda', group: 'maker', kana: 'まつだ', color: '#2a9d8f' },
  { id: 'porsche', group: 'maker', kana: 'ぽるしぇ', color: '#6d597a' },
  { id: 'lamborghini', group: 'maker', kana: 'らんぼるぎーに', color: '#b8860b' },
  { id: 'benz', group: 'maker', kana: 'べんつ', color: '#6c757d' },
  { id: 'rossa', group: 'maker', kana: 'ろっさ', color: '#b5179e' },
  { id: 'japan', group: 'country', kana: 'にほん', color: '#1d3557' },
  { id: 'germany', group: 'country', kana: 'どいつ', color: '#1d3557' },
  { id: 'italy', group: 'country', kana: 'いたりあ', color: '#1d3557' },
  { id: 'russia', group: 'country', kana: 'ろしあ', color: '#1d3557' },
  { id: 'supercar', group: 'feature', kana: 'すーぱーかー', color: '#1d3557' },
  { id: 'popup', group: 'feature', kana: 'らいとが ひらく', color: '#1d3557' },
  { id: 'open', group: 'feature', kana: 'やねが あく', color: '#1d3557' },
  { id: 'race', group: 'feature', kana: 'れーすの くるま', color: '#1d3557' },
];

// 色の一覧をつくる。最初に もとの色、そのあとに ほかの色を並べる
const BASE_COLORS = [
  { kana: 'あか', css: '#c40d12' },
  { kana: 'しろ', css: '#f2f2f2' },
  { kana: 'くろ', css: '#141414' },
  { kana: 'ぎんいろ', css: '#9aa0a6' },
  { kana: 'あお', css: '#0b3fa8' },
  { kana: 'きいろ', css: '#f2c200' },
  { kana: 'みどり', css: '#0d6b3a' },
  { kana: 'おれんじ', css: '#f26a00' },
];
const colors = (kana, css) => [{ kana, css }, ...BASE_COLORS.filter((c) => c.kana !== kana)];

// 作者 Lexyc16 さんのモデルの出どころ
const lexyc = (title, slug, nc) => ({
  title,
  author: 'Lexyc16',
  license: nc ? 'CC BY-NC 4.0' : 'CC BY 4.0',
  licenseUrl: nc ? 'https://creativecommons.org/licenses/by-nc/4.0/' : 'https://creativecommons.org/licenses/by/4.0/',
  source: 'Sketchfab',
  sourceUrl: 'https://sketchfab.com/3d-models/' + slug,
  changes: 'ファイルを軽くするため圧縮しました',
});

window.CARS = [
  {
    id: 'supra',
    kana: 'すーぷら',
    say: 'はやく はしる かっこいい すぽーつかー。うしろの おおきな はねが めじるし。',
    tags: ['toyota', 'japan'],
    name: 'スープラ（A80型 / MK IV）',
    maker: 'トヨタ',
    years: '1993年〜2002年',
    model: 'models/supra.glb',
    poster: 'posters/supra.webp',
    paint: { material: 'TOYOTA_SUPRA_CAR_PAINT', colors: colors('あか', '#c40d12') },
    credit: {
      title: 'Toyota Supra MK IV (1994)',
      author: 'Martin Trafas',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      source: 'Sketchfab',
      sourceUrl: 'https://skfb.ly/ooJwY',
      changes: 'ファイルを軽くするため圧縮しました',
    },
  },
  {
    id: 'ae86',
    kana: 'はちろく',
    say: '「はちろく」と よばれて にんきの くるま。らいとが ぱかっと ひらくよ。',
    tags: ['toyota', 'japan', 'popup'],
    name: 'スプリンター トレノ（AE86型）',
    maker: 'トヨタ',
    years: '1983年〜1987年',
    model: 'models/ae86.glb',
    poster: 'posters/ae86.webp',
    paint: { material: 'Material.001', colors: colors('しろ', '#ffffff') },
    credit: lexyc('Toyota Corolla AE86 Trueno', 'toyota-corolla-ae86-trueno-fe02fba6302e450ea8424591493341ea', false),
  },
  {
    id: 'civic',
    kana: 'しびっく',
    say: 'ちいさくて きびきび はしる くるま。せかいじゅうで にんきが あるよ。',
    tags: ['honda', 'japan'],
    name: 'シビック Si（1999年式・クーペ）',
    maker: 'ホンダ',
    years: '1999年〜2000年（北米向け）',
    model: 'models/civic.glb',
    poster: 'posters/civic.webp',
    paint: { material: 'CarPaint', colors: colors('あお', '#0044bb') },
    credit: {
      title: '1999 Honda Civic Si',
      author: 'Ddiaz Design',
      license: 'CC BY-NC-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      source: 'Sketchfab',
      sourceUrl: 'https://sketchfab.com/3d-models/1999-honda-civic-si-ce29e75eb129406f874e0423ab8869c3',
      changes: 'ファイルを軽くするため圧縮しました',
    },
  },
  {
    id: 'nsx',
    kana: 'えぬえすえっくす',
    say: 'にほんで うまれた すーぱーかー。えんじんが うんてんせきの うしろに あるよ。',
    tags: ['honda', 'japan', 'supercar', 'popup'],
    name: 'NSX（初代・NA1型）',
    maker: 'ホンダ',
    years: '1990年〜2005年',
    model: 'models/nsx.glb',
    poster: 'posters/nsx.webp',
    paint: { material: 'Material.003', colors: colors('しろ', '#f5f5f5') },
    credit: lexyc('Honda NSX 1990', 'honda-nsx-1990-1cc15628a00a4739a6b6c01128927c8d', false),
  },
  {
    id: 'r32',
    kana: 'じーてぃーあーる（あーる32）',
    say: 'れーすで とても つよかった くるま。うしろの まるい らんぷが めじるし。',
    tags: ['nissan', 'japan'],
    name: 'スカイライン GT-R（BNR32型）',
    maker: '日産',
    years: '1989年〜1994年',
    model: 'models/r32.glb',
    poster: 'posters/r32.webp',
    paint: { material: 'car_paint', colors: colors('あか', '#ad0000') },
    credit: lexyc('Nissan Skyline (R32) GT-R', 'nissan-skyline-r32-gt-r-8810e677eca543a6b840cf67dd064aa4', true),
  },
  {
    id: 'r34',
    kana: 'じーてぃーあーる（あーる34）',
    say: 'えいがや げーむでも にんきの すぽーつかー。あおい いろが ゆうめい。',
    tags: ['nissan', 'japan'],
    name: 'スカイライン GT-R（BNR34型）',
    maker: '日産',
    years: '1999年〜2002年',
    model: 'models/r34.glb',
    poster: 'posters/r34.webp',
    paint: { material: 'Material.001', colors: colors('あお', '#0045c5') },
    credit: lexyc('Nissan Skyline R34 GT-R', 'nissan-skyline-r34-gt-r-ff8fb2251dfa4bb9979e7022c5a6666c', false),
  },
  {
    id: 'z32',
    kana: 'ふぇあれでぃ ぜっと',
    say: 'ひくくて ひらべったい かたちの すぽーつかー。',
    tags: ['nissan', 'japan'],
    name: 'フェアレディZ（Z32型 / 海外名 300ZX）',
    maker: '日産',
    years: '1989年〜2000年',
    model: 'models/z32.glb',
    poster: 'posters/z32.webp',
    paint: { material: 'Material.001', colors: colors('しろ', '#ffffff') },
    credit: lexyc('Nissan Fairlady 300ZX (Z32) 1989', 'nissan-fairlady-300zx-z32-1989-8c04336a4ed84f6f836760db8256f9f0', true),
  },
  {
    id: 'roadster',
    kana: 'ろーどすたー',
    say: 'やねを あけて はしれる ちいさな すぽーつかー。らいとが ぱかっと ひらくよ。',
    tags: ['mazda', 'japan', 'open', 'popup'],
    name: 'ユーノス ロードスター（NA型 / 海外名 MX-5 ミアータ）',
    maker: 'マツダ',
    years: '1989年〜1997年',
    model: 'models/roadster.glb',
    poster: 'posters/roadster.webp',
    paint: { material: 'Material.002', colors: colors('あか', '#ff0000') },
    credit: lexyc('Mazda Miata MX-5 NA', 'mazda-miata-mx-5-na-d51fcd44b74f4daf8012c41e0400c041', false),
  },
  {
    id: 'rx7',
    kana: 'あーるえっくす せぶん',
    say: 'ろーたりーえんじん という めずらしい えんじんで はしるよ。',
    tags: ['mazda', 'japan', 'popup'],
    name: 'RX-7（FD3S型）',
    maker: 'マツダ',
    years: '1991年〜2002年',
    model: 'models/rx7.glb',
    poster: 'posters/rx7.webp',
    paint: { material: 'Material.007', colors: colors('きいろ', '#ffd100') },
    credit: lexyc('Mazda RX-7 FD', 'mazda-rx-7-fd-d35ff630df614771b82e7b2f59035b1e', false),
  },
  {
    id: 'porsche930',
    kana: 'ぽるしぇ 911',
    say: 'かえる みたいな まるい めの くるま。えんじんは うしろに あるよ。',
    tags: ['porsche', 'germany'],
    name: '911 ターボ（930型）',
    maker: 'ポルシェ',
    years: '1975年〜1989年',
    model: 'models/porsche930.glb',
    poster: 'posters/porsche930.webp',
    paint: { material: 'Material.001', colors: colors('くろ', '#262626') },
    credit: lexyc('Porsche 911 (930) Turbo 1975', 'porsche-911-930-turbo-1975-de1ffd344c41481892511f7fd332c136', false),
  },
  {
    id: 'a45',
    kana: 'べんつ えー45',
    say: 'ちいさいけれど とても はやい くるま。',
    tags: ['benz', 'germany'],
    name: 'メルセデスAMG A45（W176型）',
    maker: 'メルセデス・ベンツ',
    years: '2013年〜2018年',
    model: 'models/a45.glb',
    poster: 'posters/a45.webp',
    orbit: '215deg 75deg auto',
    paint: { material: 'main_color', colors: colors('ぎんいろ', '#999999') },
    credit: lexyc('Mercedes-Benz A45 AMG 2018', 'mercedes-benz-a45-amg-2018-9482f251f9c34a6e91d7777db5934cfc', true),
  },
  {
    id: 'countach',
    kana: 'かうんたっく',
    say: 'どあが うえに ひらく すーぱーかー。せかいに 112だい しか ないよ。',
    tags: ['lamborghini', 'italy', 'supercar'],
    name: 'カウンタック LPI 800-4',
    maker: 'ランボルギーニ',
    years: '2021年発表（112台限定）',
    model: 'models/countach.glb',
    poster: 'posters/countach.webp',
    orbit: '215deg 75deg auto',
    paint: { material: 'Material.012', colors: colors('しろ', '#ffffff') },
    credit: lexyc('2021 Lamborghini Countach LPI 800-4', '2021-lamborghini-countach-lpi-800-4-d76b94884432422b966d1a7f8815afb5', true),
  },
  {
    id: 'rossa-lm',
    kana: 'ろっさ',
    say: 'ろしあで うまれた れーすの くるま。おおきな はねが ついているよ。',
    tags: ['rossa', 'russia', 'supercar', 'race'],
    name: 'ロッサ LM GT（プロトタイプ 2023）',
    maker: 'ロッサ・カーズ',
    years: '2023年〜',
    model: 'models/rossa-lm.glb',
    poster: 'posters/rossa-lm.webp',
    paint: { material: 'main_color', colors: colors('あか', '#c40000') },
    credit: lexyc('[FREE] Rossa GT LM Prototype 2023', 'free-rossa-gt-lm-prototype-2023-d37778f32a67458689022b3f92b49228', true),
  },
];

// クイズの はずれの選択肢に まぜる名前（図鑑の車が少ないうちに使います）
window.QUIZ_DECOYS = [
  'ぷりうす', 'じむにー', 'はいえーす', 'らんどくるーざー', 'ふぃっと',
  'かろーら', 'えぬぼっくす', 'あくあ', 'せれな', 'いんぷれっさ',
];
