// 図鑑にのせる車の一覧。1台ふやすときは、この中に1つ足します。
//
// kana     : 息子さん向けの名前（ひらがな）
// say      : ひとことの説明（ひらがな。ことばの区切りに空白）
// kind     : 種類（KINDS の中のどれか）
// name     : 正式な名前
// maker    : メーカー
// years    : 売られていた年
// model    : 3Dモデルのファイル（models/ の中）
// poster   : 一覧に出す絵（posters/ の中）
// sound    : エンジン音のファイル（sounds/ の中）。ない車は書かない
// soundCredit : エンジン音の出どころ（sound があるときだけ）
// credit   : 3Dモデルの出どころ（作者・ライセンス）

window.KINDS = [
  { id: 'sports', kana: 'すぽーつかー', color: '#e63946' },
  { id: 'work',   kana: 'はたらく くるま', color: '#f4a261' },
  { id: 'family', kana: 'まちの くるま', color: '#2a9d8f' },
];

window.CARS = [
  {
    id: 'supra',
    kana: 'すーぷら',
    say: 'はやく はしる かっこいい すぽーつかー。うしろの おおきな はねが めじるし。',
    kind: 'sports',
    name: 'スープラ（A80型 / MK IV）',
    maker: 'トヨタ',
    years: '1993年〜2002年',
    model: 'models/supra.glb',
    poster: 'posters/supra.webp',
    credit: {
      title: 'Toyota Supra MK IV (1994)',
      author: 'Martin Trafas',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      source: 'Sketchfab',
      sourceUrl: '',
      changes: 'ファイルを軽くするため圧縮しました',
    },
  },
];
