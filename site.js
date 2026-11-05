import { createSiteMotion } from './site-motion.js';
import {PROJECT_COPY,applyProjectAboutDialog} from './week/project-copy.mjs';

const $ = id => document.getElementById(id);
const translations = {
  en: {
    menu:'MENU', close:'CLOSE', landingTop:'AN ARTISTIC SCENARIO · 2050', globeInstruction:'DRAG TO ROTATE · SELECT SHANGHAI TO ENTER',   explore:'EXPLORE MY WORK', preparing:'PREPARING THE CITY EXPERIENCE…', artistLine:'AN INTERACTIVE ARTWORK BY TIAN YZHE',  tideHan:'', pulseHan:'', signalHan:'', shanghaiMarker:'SHANGHAI', shanghaiEntry:'Enter Shanghai 2050', landingActions:'DRAG TO ROTATE · CLICK TO ENTER', dragRotate:'DRAG TO ORBIT', switch123:'PRESS 1 / 2 / 3',
    menuOverline:'SHANGHAI 2050 / INDEX', home:'HOME', artwork:'ARTWORK', aboutProject:'ABOUT THE PROJECT', futurePlans:'FUTURE PLANS', contact:'CONTACT', menuFooter:'TIDE / PULSE / SIGNAL',

    contactEyebrow:'THE ARTIST / SHANGHAI 2050', contactHeadline:"LET'S STAY<br>IN TOUCH.", contactLede:'Questions, dialogue and collaboration are welcome.', contactEmail:'EMAIL', artistDetail:'CHINA · BORN 2006', contactNote:'This link opens your email application.',

    landingLabel:'Shanghai 2050 introduction', globeLabel:'Rotatable Earth centred on Shanghai', experienceLabel:'Interactive three-dimensional Shanghai 2050 artwork', menuLabel:'Site menu', openMenu:'Open menu', closeMenu:'Close menu', unavailable:'THE 3D EXPERIENCE IS UNAVAILABLE', unavailableHelp:'Try a browser with WebGL enabled or turn on hardware acceleration.', reload:'RELOAD', loading:'REVEALING SHANGHAI\'S URBAN FIELD', returnHome:'BACK TO EARTH'
  },
  zh: {
    menu:'菜单', close:'关闭', landingTop:'艺术情景推演 · 2050', globeInstruction:'拖动旋转地球 · 点击上海进入作品',   explore:'探索我的作品', preparing:'正在展开城市体验…', artistLine:'ᴛɪᴀɴ ʏᴢʜᴇ 的交互艺术作品',  tideHan:'潮', pulseHan:'脉', signalHan:'讯', shanghaiMarker:'上海 SHANGHAI', shanghaiEntry:'进入上海2050作品', landingActions:'拖动旋转 · 点击进入作品', dragRotate:'拖动旋转', switch123:'按 1 / 2 / 3 切换',
    menuOverline:'上海 2050 / 目录', home:'首页', artwork:'艺术作品', aboutProject:'关于作品', futurePlans:'未来规划', contact:'联系我', menuFooter:'潮 / 脉 / 讯',

    contactEyebrow:'创作者 / 上海2050', contactHeadline:'期待与你<br>交流。', contactLede:'欢迎就作品提问、交流或探讨合作。', contactEmail:'邮箱', artistDetail:'中国 · 2006年出生', contactNote:'点击邮箱将打开你的邮件应用。',

    landingLabel:'上海2050入口', globeLabel:'面向上海的可旋转地球', experienceLabel:'上海2050交互三维城市艺术作品', menuLabel:'网站菜单', openMenu:'打开菜单', closeMenu:'关闭菜单', unavailable:'三维画面暂时无法打开', unavailableHelp:'请使用支持 WebGL 的浏览器，或开启浏览器图形加速后重试。', reload:'重新加载', loading:'正在展开上海的城市脉络', returnHome:'返回地球'
  }
};

Object.assign(translations.en,PROJECT_COPY.en);
Object.assign(translations.zh,PROJECT_COPY.zh);

const menu = $('site-menu');
const menuButton = $('menu-button');
const menuClose = $('menu-close');
const landing = $('landing');
const experience = $('experience');
const exploreButton = $('explore-button');
const loadLabel = $('landing-load');
let lang = 'en';
const initialQuery = new URLSearchParams(location.search);
if (initialQuery.has('lang')) lang = initialQuery.get('lang') === 'zh' ? 'zh' : 'en';
let artReady = false;
let entering = false;
let pendingEntry = false;
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = createSiteMotion(menu, {reducedMotion:prefersReducedMotion});
const shanghaiButton = $('globe-marker');
const safeHTMLKeys = new Set(['aboutHeadline','plansHeadline','contactHeadline']);

function translateAbout(c) {
  const dialog = $('about-dialog');
  const paras = [...dialog.children].filter(node => node.tagName === 'P');
  dialog.querySelector('.dialog-close').setAttribute('aria-label', c===translations.zh?'关闭作品说明':'Close artwork information');
  dialog.querySelector('.dialog-close').textContent = `${c.close} ×`;
  dialog.querySelector('h1').textContent = c.aboutDialogTitle;
  paras[1].textContent = c.aboutDialogIntro;
  const grid = dialog.querySelector('.about-grid');
  const sections = grid.querySelectorAll(':scope > div');
  sections[0].querySelector('h2').textContent = c.aboutLayersTitle;
  sections[0].querySelector('p').innerHTML = c.aboutLayers;
  sections[1].querySelector('h2').textContent = c.aboutExploreTitle;
  const how = sections[1].querySelectorAll('p');
  how[0].textContent = c.aboutExplore1;
  how[1].textContent = c.aboutExplore2;
  $('interaction-heading').textContent = c.interactionTitle;
  dialog.querySelector('.interaction-setting label span').textContent = c.zoomSetting;
  $('zoom-description').innerHTML = c.zoomDescription;
  paras[2].textContent = c.aboutCredit1;

  paras[3].innerHTML = c.aboutCredit3;
  $('place-dialog').querySelector('.dialog-close').setAttribute('aria-label', c===translations.zh?'关闭地点说明':'Close place information');
  $('place-dialog').querySelector('.dialog-close').textContent = `${c.close} ×`;
  $('place-dialog').querySelector('.credit').textContent = c.placeCredit;
  applyProjectAboutDialog(lang);
}

function setLanguage(next) {
  lang = next === 'zh' ? 'zh' : 'en';
  const c = translations[lang];
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = lang === 'zh' ? '上海 2050 · 潮 / 脉 / 讯' : 'SHANGHAI 2050 · TIDE / PULSE / SIGNAL';
  document.querySelector('meta[name="description"]').content = lang === 'zh' ? '上海2050：沿一周时间，在同一座三维上海中探索天气、公共生活与数字服务的交互艺术作品。' : 'Shanghai 2050: a week of weather, public life and digital services in one interactive, three-dimensional city.';
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    if (!(key in c)) return;
    if (safeHTMLKeys.has(key)) node.innerHTML = c[key];
    else node.textContent = c[key];
  });
  document.querySelectorAll('.language-switch button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
  document.querySelectorAll('[data-i18n-aria]').forEach(node => node.setAttribute('aria-label', c[node.dataset.i18nAria]));
  landing.setAttribute('aria-label', c.landingLabel);
  $('globe-canvas').setAttribute('aria-label', c.globeLabel);
  experience.setAttribute('aria-label', c.experienceLabel);
  menu.setAttribute('aria-label', c.menuLabel);
  menuButton.setAttribute('aria-label', c.openMenu);
  menuClose.setAttribute('aria-label', c.closeMenu);
  $('error').querySelector('h2').textContent = c.unavailable;
  $('error').querySelector('p').textContent = c.unavailableHelp;
  $('error').querySelector('button').textContent = c.reload;
  const loadingCopy = $('loading')?.querySelector('p')?.firstChild;
  if (loadingCopy) loadingCopy.textContent = c.loading;
  translateAbout(c);
  window.dispatchEvent(new CustomEvent('sh2050:language', {detail:{lang}}));
}

const selectPanel = panel => motion.selectPanel(panel);
const closeMenu = () => motion.close();

function openMenu(panel='about') {
  if (entering) return;
  motion.selectPanel(panel, {instant:true});
  motion.open();
  document.body.dataset.menuOpen = 'true';
  menu.querySelector(`[data-menu="${panel}"]`)?.focus();
}

async function enterArtwork(skipAnimation=false) {
  if (entering) return;
  if (document.body.dataset.view === 'artwork') {
    await closeMenu();
    $('world').focus({preventScroll:true});
    window.dispatchEvent(new CustomEvent('sh2050:navigation',{detail:{view:'artwork'}}));
    return;
  }
  if (!artReady) {
    if (window.SH2050_BOOT?.failed) { showArtworkError(); return; }
    pendingEntry = true;
    loadLabel.hidden = false;
    exploreButton.setAttribute('aria-busy','true');
    shanghaiButton.setAttribute('aria-busy','true');
    return;
  }
  pendingEntry = false;
  entering = true;
  if (menu.open) await closeMenu();
  exploreButton.removeAttribute('aria-busy');
  shanghaiButton.removeAttribute('aria-busy');
  document.body.dataset.view = skipAnimation || prefersReducedMotion ? 'artwork' : 'entering';
  if (!skipAnimation && !prefersReducedMotion) {
    try { await window.SH2050_GLOBE?.enter?.(); } catch {}
  }
  document.body.dataset.view = 'artwork';
  landing.setAttribute('aria-hidden','true');
  experience.inert = false;
  if (!skipAnimation) motion.revealView(experience);
  window.SH2050_GLOBE?.destroy?.();
  $('world').focus({preventScroll:true});
  entering = false;
  window.dispatchEvent(new CustomEvent('sh2050:navigation',{detail:{view:'artwork'}}));
}

async function returnHome() {
  if (entering) return;
  pendingEntry = false;
  if (menu.open) await closeMenu();
  experience.inert = true;
  landing.removeAttribute('aria-hidden');
  document.body.dataset.view = 'landing';
  window.SH2050_GLOBE?.show?.();
  motion.revealView(landing);
  exploreButton.focus({preventScroll:true});
  window.dispatchEvent(new CustomEvent('sh2050:navigation',{detail:{view:'landing'}}));
}

menuButton.addEventListener('click', () => openMenu());
menuClose.addEventListener('click', closeMenu);
menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
menu.addEventListener('close', () => {
  delete document.body.dataset.menuOpen;
  if (document.activeElement === document.body || menu.contains(document.activeElement)) menuButton.focus({preventScroll:true});
});
menu.addEventListener('click', event => { if (event.target === menu) closeMenu(); });
menu.addEventListener('keydown', event => { if (event.key !== 'Escape') event.stopPropagation(); });
menu.querySelectorAll('.site-menu-nav button').forEach(button => button.addEventListener('click', () => {
  switch (button.dataset.menu) {
    case 'home': returnHome(); break;
    case 'artwork': enterArtwork(); break;
    default: selectPanel(button.dataset.menu);
  }
}));
document.querySelectorAll('.language-switch button').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
exploreButton.addEventListener('click', () => enterArtwork());
shanghaiButton.addEventListener('click', () => enterArtwork());
window.addEventListener('sh2050:ready', () => {
  artReady = true;
  loadLabel.hidden = true;
  exploreButton.removeAttribute('aria-busy');
  shanghaiButton.removeAttribute('aria-busy');
  if (pendingEntry) enterArtwork();
});
function showArtworkError() {
  pendingEntry = false;
  exploreButton.removeAttribute('aria-busy');
  exploreButton.disabled = true;
  shanghaiButton.disabled = true;
  if (window.SH2050_BOOT) { window.SH2050_BOOT.fail(new Error('City initialization failed.')); return; }
  loadLabel.hidden = true;
  if (document.querySelector('.landing-error')) return;
  const message = document.createElement('p');
  message.className = 'landing-error';
  message.setAttribute('role', 'alert');
  message.dataset.i18n = 'unavailableHelp';
  message.textContent = translations[lang].unavailableHelp;
  exploreButton.after(message);
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'landing-retry';
  retry.dataset.i18n = 'reload';
  retry.textContent = translations[lang].reload;
  retry.addEventListener('click', () => location.reload());
  message.after(retry);
}
window.addEventListener('sh2050:error', showArtworkError);
window.addEventListener('sh2050:load-failed', showArtworkError);
if (window.SH2050?.ready) artReady = true;
setLanguage(lang);
if (artReady) loadLabel.hidden = true;
if (window.SH2050?.error || window.SH2050_BOOT?.failed) showArtworkError();
if (['about','plans','contact'].includes(initialQuery.get('menu'))) openMenu(initialQuery.get('menu'));
if (window.SH2050_BOOT?.consumeEntryIntent?.()) enterArtwork();

// A fixed star arrangement echoes the observational grid without a tiled pattern.
document.querySelectorAll('.landing-stars, .menu-stars').forEach(field => {
  const fragment = document.createDocumentFragment();
  let seed = 2050;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 125; i++) {
    const star = document.createElement('i');
    const size = .65 + random() * 1.4;
    star.style.cssText = `left:${random()*100}%;top:${random()*100}%;width:${size}px;height:${size}px;opacity:${.15 + random() * .6}`;
    fragment.appendChild(star);
  }
  field.appendChild(fragment);
});

