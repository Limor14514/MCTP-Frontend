/**
 * 文件用途：站点多语言（导航栏右上角 Language 选择器使用）
 * 作用：
 *  - LANGS：可选语言列表，word 是该语言里"语言"这个词（选择器里显示的就是它）；
 *  - locale：当前语言（响应式），切换后所有用 t() 取的文字自动刷新；
 *  - 选择会记在浏览器本地（localStorage），下次打开仍是上次选的语言；读不到时回到简体中文。
 * 现状：目前只翻译了导航栏文字；索引页、主页面等正式文案定稿后，按同样格式往 MESSAGES 里补 key 即可。
 * 新增语言：在 LANGS 加一项，并在 MESSAGES 里补同名 code 的翻译（缺的 key 会回退到英文 → 简体中文）。
 */
import { ref, watch } from 'vue'

export const LANGS = [
  { code: 'zh-CN', word: '语言', name: '简体中文' },
  { code: 'zh-TW', word: '語言', name: '繁體中文' },
  { code: 'en', word: 'Language', name: 'English' },
  { code: 'ja', word: '言語', name: '日本語' },
  { code: 'ko', word: '언어', name: '한국어' },
  { code: 'es', word: 'Idioma', name: 'Español' },
  { code: 'pt', word: 'Idioma', name: 'Português' },
  { code: 'fr', word: 'Langue', name: 'Français' },
  { code: 'de', word: 'Sprache', name: 'Deutsch' },
  { code: 'it', word: 'Lingua', name: 'Italiano' },
  { code: 'nl', word: 'Taal', name: 'Nederlands' },
  { code: 'sv', word: 'Språk', name: 'Svenska' },
  { code: 'pl', word: 'Język', name: 'Polski' },
  { code: 'ru', word: 'Язык', name: 'Русский' },
  { code: 'uk', word: 'Мова', name: 'Українська' },
  { code: 'tr', word: 'Dil', name: 'Türkçe' },
  { code: 'vi', word: 'Ngôn ngữ', name: 'Tiếng Việt' },
  { code: 'th', word: 'ภาษา', name: 'ไทย' },
  { code: 'id', word: 'Bahasa', name: 'Bahasa Indonesia' },
  { code: 'ar', word: 'اللغة', name: 'العربية' },
]

const MESSAGES = {
  'zh-CN': { 'nav.index': '索引', 'nav.home': '主页面', 'nav.feedback': '反馈' },
  'zh-TW': { 'nav.index': '索引', 'nav.home': '主頁面', 'nav.feedback': '回饋' },
  en: { 'nav.index': 'Index', 'nav.home': 'Home', 'nav.feedback': 'Feedback' },
  ja: { 'nav.index': 'インデックス', 'nav.home': 'ホーム', 'nav.feedback': 'フィードバック' },
  ko: { 'nav.index': '색인', 'nav.home': '홈', 'nav.feedback': '피드백' },
  es: { 'nav.index': 'Índice', 'nav.home': 'Inicio', 'nav.feedback': 'Comentarios' },
  pt: { 'nav.index': 'Índice', 'nav.home': 'Início', 'nav.feedback': 'Feedback' },
  fr: { 'nav.index': 'Index', 'nav.home': 'Accueil', 'nav.feedback': 'Avis' },
  de: { 'nav.index': 'Index', 'nav.home': 'Start', 'nav.feedback': 'Feedback' },
  it: { 'nav.index': 'Indice', 'nav.home': 'Home', 'nav.feedback': 'Feedback' },
  nl: { 'nav.index': 'Index', 'nav.home': 'Home', 'nav.feedback': 'Feedback' },
  sv: { 'nav.index': 'Index', 'nav.home': 'Hem', 'nav.feedback': 'Feedback' },
  pl: { 'nav.index': 'Indeks', 'nav.home': 'Start', 'nav.feedback': 'Opinie' },
  ru: { 'nav.index': 'Индекс', 'nav.home': 'Главная', 'nav.feedback': 'Отзывы' },
  uk: { 'nav.index': 'Індекс', 'nav.home': 'Головна', 'nav.feedback': 'Відгуки' },
  tr: { 'nav.index': 'Dizin', 'nav.home': 'Ana Sayfa', 'nav.feedback': 'Geri Bildirim' },
  vi: { 'nav.index': 'Mục lục', 'nav.home': 'Trang chủ', 'nav.feedback': 'Phản hồi' },
  th: { 'nav.index': 'ดัชนี', 'nav.home': 'หน้าหลัก', 'nav.feedback': 'ความคิดเห็น' },
  id: { 'nav.index': 'Indeks', 'nav.home': 'Beranda', 'nav.feedback': 'Masukan' },
  ar: { 'nav.index': 'الفهرس', 'nav.home': 'الرئيسية', 'nav.feedback': 'الملاحظات' },
}

const STORE_KEY = 'mctp-locale'
function readSaved() {
  try {
    const v = localStorage.getItem(STORE_KEY)
    return LANGS.some((l) => l.code === v) ? v : null
  } catch {
    return null // 隐私模式等情况读不到本地存储，直接用默认语言
  }
}

export const locale = ref(readSaved() || 'zh-CN')

export function setLocale(code) {
  if (!LANGS.some((l) => l.code === code)) return
  locale.value = code
  try {
    localStorage.setItem(STORE_KEY, code)
  } catch {
    /* 存不了就只在本次访问内生效 */
  }
}

/** 作用：取当前语言的文字；缺翻译时依次回退到英文、简体中文、key 本身 */
export function t(key) {
  return MESSAGES[locale.value]?.[key] ?? MESSAGES.en[key] ?? MESSAGES['zh-CN'][key] ?? key
}

// 同步 <html lang>，让浏览器朗读、字体回退按正确语言处理
watch(
  locale,
  (v) => {
    document.documentElement.lang = v
  },
  { immediate: true },
)
