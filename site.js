import { createSiteMotion } from './site-motion.js';

const $ = id => document.getElementById(id);
const translations = {
  en: {
    menu:'MENU', close:'CLOSE', landingTop:'AN ARTISTIC SCENARIO · 2050', globeInstruction:'DRAG TO ROTATE · SELECT SHANGHAI TO ENTER', landingKicker:'A CITY IN MOTION', landingSubtitle:'Tide, pulse and signal: three ways a future city becomes visible.', explore:'EXPLORE MY WORK', preparing:'PREPARING THE CITY EXPERIENCE…', artistLine:'AN INTERACTIVE ARTWORK BY TIAN YZHE', scenarioLine:'PRESENT DATA × FUTURE SCENARIO', tideHan:'', pulseHan:'', signalHan:'', shanghaiMarker:'SHANGHAI', shanghaiEntry:'Enter Shanghai 2050', landingActions:'DRAG TO ROTATE · CLICK TO ENTER', dragRotate:'DRAG TO ORBIT', switch123:'PRESS 1 / 2 / 3',
    menuOverline:'SHANGHAI 2050 / INDEX', home:'HOME', artwork:'ARTWORK', aboutProject:'ABOUT THE PROJECT', futurePlans:'FUTURE PLANS', contact:'CONTACT', menuFooter:'TIDE / PULSE / SIGNAL',
    aboutEyebrow:'AN ARTISTIC PORTRAIT OF SHANGHAI', aboutHeadline:'THE CITY IS<br>NEVER STILL.', aboutLede:'Shanghai 2050 imagines the city as a living field shaped by water and air, by people in motion, and by the signals they leave behind.', tideTitle:'The environmental rhythm', tideBody:'Contours, humidity and currents reveal the forces beneath the visible city.', pulseTitle:'The human rhythm', pulseBody:'Neighbourhoods, mobility and culture form an uneven, luminous heartbeat.', signalTitle:'The networked rhythm', signalBody:"Points and links make the city's invisible exchanges briefly perceptible.", aboutNote:'The 2050 sequence is an artistic scenario. It does not claim to predict the future or display live data.',
    plansEyebrow:'OFFICIAL DOCUMENTS / SHANGHAI', plansHeadline:"THE CITY'S<br>LONG VIEW.", plansLede:'Explore the planning context behind the digital, ecological and economic ambitions of Shanghai. Four documents are available in their original Chinese.', planDigitalTitle:'DIGITAL SHANGHAI · 15TH FIVE-YEAR PLAN', planDigitalBody:'Public data, intelligent infrastructure, inclusive services and digital governance.', planBeautifulTitle:'BEAUTIFUL SHANGHAI · 15TH FIVE-YEAR PLAN', planBeautifulBody:'Cleaner air and water, lower emissions, greener spaces and ecological protection.', planIndustriesTitle:'STRATEGIC EMERGING INDUSTRIES · 15TH FIVE-YEAR PLAN', planIndustriesBody:'Emerging industries, technological innovation and the future economic landscape.', planMasterTitle:'STATE COUNCIL APPROVAL · MASTER PLAN', planMasterBody:'Direction for urban form, ecological boundaries, heritage, public services and resilience.', plansNote:"Official planning context is distinct from the artwork's speculative 2050 interpretation.",
    contactEyebrow:'THE ARTIST / SHANGHAI 2050', contactHeadline:"LET'S STAY<br>IN TOUCH.", contactLede:'Questions, dialogue and collaboration are welcome.', contactEmail:'EMAIL', artistDetail:'CHINA · BORN 2006', contactNote:'This link opens your email application; this site does not collect messages.',
    aboutDialogTitle:'SHANGHAI, REVEALED IN MOTION.', aboutDialogIntro:'A city lives in three rhythms at once: environmental fluctuation, human movement and the flow of information. Set in a speculative 2050, this artwork lets those systems meet in one navigable space.', aboutLayersTitle:'THREE LAYERS', aboutLayers:'<b>TIDE</b> — An undulating field evokes water, humidity and wind; contours suggest relative levels while cyan light traces wet ground and waterways.<br><b>PULSE</b> — Buildings, districts and points of light carry community and culture, while the Huangpu River threads between the banks.<br><b>SIGNAL</b> — The city dissolves into abstract particles and links, making invisible connections momentarily visible.', aboutExploreTitle:'HOW TO EXPLORE', aboutExplore1:'Drag to orbit; scroll to zoom; right-drag to pan. Use the layer buttons or press 1 / 2 / 3. The controls below pause time, scrub through a simulated day, reset the view, turn on sound and enter full screen.', aboutExplore2:'Chart headings cycle through topics. Select a landmark in PULSE for its story. On touch screens, use one finger to orbit and two to zoom.', interactionTitle:'INTERACTION SETTINGS', zoomSetting:'LINK SCROLL ZOOM TO LAYERS', zoomDescription:'Zoom out: TIDE → middle: PULSE → zoom in: SIGNAL.<br>When off, scrolling changes only the camera distance. Buttons and number keys always switch layers.', aboutCredit1:'Road, water and some building outlines draw on OpenStreetMap. Landmarks and additional structures are artistic approximations. Environmental, human and information intensities are synthetic scenarios; no live API or validated 2050 forecast is connected. See the data notes for sources and visual mappings.', aboutCredit2:'Visual and interaction research acknowledges <a href="https://convergencela.com/" target="_blank" rel="noopener noreferrer">ConvergenceLA</a> by Susan Narduli / Narduli Studio and Refik Anadol. This is an independently implemented Shanghai work.', aboutCredit3:'<a href="./data-notes.html" target="_blank" rel="noopener noreferrer">DATA & VISUAL MAPPING ↗</a> &nbsp; / &nbsp; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL</a>', placeCredit:'Existing landmark · artistically interpreted form',
    landingLabel:'Shanghai 2050 introduction', globeLabel:'Rotatable Earth centred on Shanghai', experienceLabel:'Interactive three-dimensional Shanghai 2050 artwork', menuLabel:'Site menu', openMenu:'Open menu', closeMenu:'Close menu', unavailable:'THE 3D EXPERIENCE IS UNAVAILABLE', unavailableHelp:'Try a browser with WebGL enabled or turn on hardware acceleration.', reload:'RELOAD', loading:'REVEALING SHANGHAI\'S URBAN FIELD', returnHome:'BACK TO EARTH'
  },
  zh: {
    menu:'菜单', close:'关闭', landingTop:'艺术情景推演 · 2050', globeInstruction:'拖动旋转地球 · 点击上海进入作品', landingKicker:'流动中的城市', landingSubtitle:'潮、脉、讯：未来城市显影的三种方式。', explore:'探索我的作品', preparing:'正在展开城市体验…', artistLine:'ᴛɪᴀɴ ʏᴢʜᴇ 的交互艺术作品', scenarioLine:'当下数据 × 未来情景', tideHan:'潮', pulseHan:'脉', signalHan:'讯', shanghaiMarker:'上海 SHANGHAI', shanghaiEntry:'进入上海2050作品', landingActions:'拖动旋转 · 点击进入作品', dragRotate:'拖动旋转', switch123:'按 1 / 2 / 3 切换',
    menuOverline:'上海 2050 / 目录', home:'首页', artwork:'艺术作品', aboutProject:'关于作品', futurePlans:'未来规划', contact:'联系我', menuFooter:'潮 / 脉 / 讯',
    aboutEyebrow:'上海的艺术肖像', aboutHeadline:'城市<br>从未静止。', aboutLede:'《上海2050》把这座城市想象为一片不断变化的场：水与空气、人群的流动，以及他们留下的信息，共同塑造城市。', tideTitle:'环境的节律', tideBody:'等值线、水汽和流场呈现可见城市背后的地理力量。', pulseTitle:'人的节律', pulseBody:'街区、出行和文化形成明暗不均的城市脉搏。', signalTitle:'连接的节律', signalBody:'粒子与线网让城市中不可见的交流短暂显现。', aboutNote:'2050年的变化是艺术情景，不代表预测未来，也不表示展示实时数据。',
    plansEyebrow:'官方文件 / 上海', plansHeadline:'城市的<br>长远目光。', plansLede:'从数字建设、生态环境到产业发展，阅读上海的未来规划。文献库收录四份规划文件的中文原文。', planDigitalTitle:'“数字上海”建设“十五五”规划', planDigitalBody:'涉及公共数据、智能基础设施、普惠服务和数字治理。', planBeautifulTitle:'美丽上海建设“十五五”规划', planBeautifulBody:'关注空气与水环境、低碳转型、绿色空间和生态保护。', planIndustriesTitle:'战略性新兴产业发展“十五五”规划', planIndustriesBody:'关注新兴产业、技术创新与未来经济格局。', planMasterTitle:'国务院关于上海市城市总体规划的批复', planMasterBody:'对2017—2035年总体规划中的空间形态、生态底线、文化保护和城市韧性提出要求。', plansNote:'官方规划是背景资料；作品中的2050年仍是艺术推演。',
    contactEyebrow:'创作者 / 上海2050', contactHeadline:'期待与你<br>交流。', contactLede:'欢迎就作品提问、交流或探讨合作。', contactEmail:'邮箱', artistDetail:'中国 · 2006年出生', contactNote:'点击邮箱将打开你的邮件应用；本网站不会收集留言。',
    aboutDialogTitle:'上海，在流动中显影。', aboutDialogIntro:'一座城市同时活在三种节奏里：环境的涨落，人的往返，信息的传播。作品以2050为艺术愿景，让上海的自然、人文与数字生活在同一个空间中相遇。', aboutLayersTitle:'三层画面', aboutLayers:'<b>潮 TIDE</b>　起伏线场描绘自然水汽系统，轮廓线表达相对水位，亮蓝区域表达水域与湿润程度。<br><b>脉 PULSE</b>　建筑、街区和蓝橙光点承载上海的文化、社区与活动，黄浦江光带穿过两岸。<br><b>讯 SIGNAL</b>　城市逐渐解体为抽象粒子与连接线，表现信息的汇聚、关联和传播。', aboutExploreTitle:'探索方式', aboutExplore1:'拖动旋转，滚轮缩放，右键拖动平移。点击左侧按钮或按 1 / 2 / 3 切换三层。底部可暂停、选择一天中的时刻、复位、开启声音及全屏。', aboutExplore2:'图表标题可切换数据主题。点击“脉”层的地标查看说明。触屏支持单指旋转及双指缩放。', interactionTitle:'交互设置', zoomSetting:'滚轮缩放联动场景', zoomDescription:'拉远 潮 TIDE → 中间 脉 PULSE → 拉近 讯 SIGNAL。<br>关闭后只缩放当前层；按钮与数字键始终可切换。', aboutCredit1:'道路、水系与部分建筑轮廓来自 OpenStreetMap。地标及补充建筑为艺术化近似。环境、人文与信息强度采用合成情景，尚未接入实时 API 或经验证的2050预测模型。数据来源及视觉映射见下方说明。', aboutCredit2:'视觉与交互研究参考 <a href="https://convergencela.com/" target="_blank" rel="noopener noreferrer">ConvergenceLA</a>，原作由 Susan Narduli / Narduli Studio 与 Refik Anadol 创作。本作品为上海主题的独立实现。', aboutCredit3:'<a href="./data-notes.html" target="_blank" rel="noopener noreferrer">数据与艺术映射 ↗</a>　/　<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL</a>', placeCredit:'现有地标 · 形体艺术化表达',
    landingLabel:'上海2050入口', globeLabel:'面向上海的可旋转地球', experienceLabel:'上海2050交互三维城市艺术作品', menuLabel:'网站菜单', openMenu:'打开菜单', closeMenu:'关闭菜单', unavailable:'三维画面暂时无法打开', unavailableHelp:'请使用支持 WebGL 的浏览器，或开启浏览器图形加速后重试。', reload:'重新加载', loading:'正在展开上海的城市脉络', returnHome:'返回地球'
  }
};

const menu = $('site-menu');
const menuButton = $('menu-button');
const menuClose = $('menu-close');
const landing = $('landing');
const experience = $('experience');
const exploreButton = $('explore-button');
const loadLabel = $('landing-load');
let lang = 'en';
try { lang = localStorage.getItem('sh2050-language') === 'zh' ? 'zh' : 'en'; } catch {}
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
  dialog.querySelector('.dialog-close').setAttribute('aria-label', c.closeMenu);
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
  paras[3].innerHTML = c.aboutCredit2;
  paras[4].innerHTML = c.aboutCredit3;
  $('place-dialog').querySelector('.dialog-close').setAttribute('aria-label', c.closeMenu);
  $('place-dialog').querySelector('.dialog-close').textContent = `${c.close} ×`;
  $('place-dialog').querySelector('.credit').textContent = c.placeCredit;
}

function setLanguage(next) {
  lang = next === 'zh' ? 'zh' : 'en';
  const c = translations[lang];
  try { localStorage.setItem('sh2050-language', lang); } catch {}
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = lang === 'zh' ? '上海 2050 · 潮 / 脉 / 讯' : 'SHANGHAI 2050 · TIDE / PULSE / SIGNAL';
  document.querySelector('meta[name="description"]').content = lang === 'zh' ? '上海2050：以潮、脉、讯三层探索环境、人的生活与数字连接的艺术情景。' : 'Shanghai 2050: an interactive, speculative portrait of environmental rhythms, human life and digital signals.';
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
  document.querySelectorAll('.plan-card').forEach(link => {
    const url = new URL(link.href);
    url.searchParams.set('lang', lang);
    link.href = url.href;
  });
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
  if (pendingEntry || new URLSearchParams(location.search).has('scene')) enterArtwork(new URLSearchParams(location.search).has('scene'));
});
function showArtworkError() {
  pendingEntry = false;
  exploreButton.removeAttribute('aria-busy');
  loadLabel.hidden = true;
  exploreButton.disabled = true;
  shanghaiButton.disabled = true;
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
if (window.SH2050?.ready) artReady = true;
setLanguage(lang);
if (artReady) loadLabel.hidden = true;
if (window.SH2050?.error) showArtworkError();
if (artReady && initialQuery.has('scene')) enterArtwork(true);
if (['about','plans','contact'].includes(initialQuery.get('menu'))) openMenu(initialQuery.get('menu'));

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
