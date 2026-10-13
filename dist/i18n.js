import { staticCopy } from './ui-copy.js?v=11';

const storageKey = 'lightyear-language';
const validLanguage = value => value === 'th' || value === 'en';
let language = 'th';
const requested = new URLSearchParams(location.search).get('lang');
try {
  const saved = localStorage.getItem(storageKey);
  if (validLanguage(saved)) language = saved;
} catch { /* Language switching still works when storage is unavailable. */ }
if (validLanguage(requested)) language = requested;
export const getLanguage = () => language;
export const t = (thai, english) => language === 'en' ? english : thai;
export const cleanCopy = value => language === 'th' ? value.replace(/\. /g, ' ').replace(/\.$/, '') : value;
export const shortDistance = value => value.replace(/^(ประมาณ |About )/, '');

// Retain the original text nodes and attributes so changing language preserves
// icons, event handlers, dialog state and the existing layout.
const staticNodes = [];
const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node = walker.currentNode;
  if (node.parentElement?.closest('script,style,noscript')) continue;
  const key = node.textContent.trim();
  if (Object.hasOwn(staticCopy, key)) staticNodes.push({ node, original: node.textContent, english: staticCopy[key] });
}
const staticAttributes = [];
for (const element of document.querySelectorAll('[aria-label], [aria-valuetext], meta[content]')) {
  for (const attribute of ['aria-label', 'aria-valuetext', 'content']) {
    const original = element.getAttribute(attribute);
    if (original && Object.hasOwn(staticCopy, original)) staticAttributes.push({ element, attribute, original, english: staticCopy[original] });
  }
}
function languageSwitch() {
  const group = document.createElement('div');
  group.className = 'language-switch';
  group.setAttribute('role', 'group');
  for (const [locale, label] of [['th', 'TH'], ['en', 'EN']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.language = locale;
    button.textContent = label;
    button.addEventListener('click', () => setLanguage(locale));
    group.append(button);
  }
  return group;
}
const flightHeader = document.querySelector('.journey-header');
flightHeader?.querySelector('.brand').after(languageSwitch());
const classicHeader = document.querySelector('.site-header');
classicHeader?.querySelector('.header-cta').before(languageSwitch());
for (const heading of document.querySelectorAll('.panel-heading, .dialog-copy')) heading.prepend(languageSwitch());
function applyLanguage() {
  document.documentElement.lang = language;
  for (const { node, original, english } of staticNodes) {
    if (!node.isConnected) continue;
    node.textContent = language === 'th' ? original : original.replace(original.trim(), english);
  }
  for (const { element, attribute, original, english } of staticAttributes) element.setAttribute(attribute, language === 'th' ? original : english);
  document.querySelector('.equation-unit small').textContent=t('ปีแสง', 'light-year');
  for (const group of document.querySelectorAll('.language-switch')) group.setAttribute('aria-label', t('ภาษา', 'Language'));
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
    button.setAttribute('aria-label', button.dataset.language === 'th' ? t('เปลี่ยนเป็นภาษาไทย', 'Switch to Thai') : t('เปลี่ยนเป็นภาษาอังกฤษ', 'Switch to English'));
  }
}
export function setLanguage(next) {
  if (!validLanguage(next)) return;
  try { localStorage.setItem(storageKey, next); } catch { /* Optional persistence. */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  history.replaceState(history.state, '', url);
  if (language === next) return;
  language = next;
  applyLanguage();
  document.dispatchEvent(new CustomEvent('languagechange', { detail: language }));
}
applyLanguage();
