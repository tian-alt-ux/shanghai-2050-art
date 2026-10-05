// Keep the navigational frame in place while its content changes rhythm.
export function createSiteMotion(menu, {reducedMotion = false} = {}) {
  const ease = 'cubic-bezier(.19,1,.22,1)';
  let panelVersion = 0, dialogVersion = 0;
  const panelAnimations = new Set(), dialogAnimations = new Set();
  const animate = (node, frames, options, group) => {
    if (reducedMotion || !node?.animate) return null;
    const animation = node.animate(frames, {fill:'both', easing:ease, ...options});
    group?.add(animation);
    animation.finished.then(() => { group?.delete(animation); animation.cancel(); }, () => group?.delete(animation));
    return animation;
  };
  const stop = group => { group.forEach(animation => animation.cancel()); group.clear(); };
  const wait = async animation => { try { await animation?.finished; } catch {} };
  const active = () => menu.querySelector('.menu-panel.active');
  const announce = panel => window.dispatchEvent(new CustomEvent('sh2050:navigation',{detail:{view:'menu',panel}}));

  function commit(panel) {
    menu.querySelectorAll('.site-menu-nav [data-menu]').forEach(button => {
      if (button.dataset.menu === panel) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    menu.querySelectorAll('.menu-panel').forEach(section => {
      const selected = section.dataset.panel === panel;
      section.classList.toggle('active', selected);
      section.inert = !selected;
      section.removeAttribute('aria-hidden');
    });
    menu.dataset.panel = panel;
    menu.scrollTop = 0;
  }

  function revealPanel(section, delay = 0) {
    if (!section) return;
    const nodes = section.querySelectorAll(':scope > .menu-eyebrow, :scope > h2, :scope > .menu-lede, .story-steps > article, .plan-card, :scope > .contact-links, :scope > .artist-signature, :scope > .menu-note');
    nodes.forEach((node, index) => {
      const headline = node.tagName === 'H2';
      animate(node, [
        {opacity:0, transform:`translateY(${headline ? 24 : 14}px)`, filter:`blur(${headline ? 5 : 3}px)`},
        {opacity:1, transform:'translateY(0)', filter:'blur(0px)'}
      ], {duration:headline ? 760 : 640, delay:delay + Math.min(index * 58, 390)}, panelAnimations);
    });
  }

  async function selectPanel(panel, {instant = false} = {}) {
    const previous = active(), next = menu.querySelector(`[data-panel="${panel}"]`);
    if (!next || (previous === next && !instant)) return;
    const version = ++panelVersion;
    stop(panelAnimations);
    menu.dataset.motion = 'changing';
    if (menu.open && !instant && previous && !reducedMotion) {
      previous.inert = true;
      await wait(animate(previous, [
        {opacity:1, transform:'translateY(0)', filter:'blur(0px)'},
        {opacity:0, transform:'translateY(-8px)', filter:'blur(2px)'}
      ], {duration:400, easing:'cubic-bezier(.4,0,.6,1)'}, panelAnimations));
      if (version !== panelVersion || !menu.open) return;
    }
    commit(panel);
    if (menu.open && !instant) { revealPanel(next); announce(panel); }
    menu.dataset.motion = 'open';
  }

  function open() {
    ++dialogVersion;
    stop(dialogAnimations);
    menu.classList.remove('is-closing');
    if (!menu.open) menu.showModal();
    menu.dataset.motion = 'opening';
    animate(menu, [{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:480}, dialogAnimations);
    menu.querySelectorAll('.site-menu-nav button').forEach((button,index) => {
      animate(button,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:580,delay:75+index*38},dialogAnimations);
    });
    stop(panelAnimations);
    revealPanel(active(), 95);
    announce(active()?.dataset.panel);
    menu.dataset.motion = 'open';
  }

  async function close() {
    if (!menu.open) return;
    const version = ++dialogVersion;
    ++panelVersion;
    const opacity = getComputedStyle(menu).opacity;
    stop(dialogAnimations);
    stop(panelAnimations);
    menu.classList.add('is-closing');
    menu.dataset.motion = 'closing';
    await wait(animate(menu,[{opacity,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:400,easing:'cubic-bezier(.4,0,.6,1)'},dialogAnimations));
    if (version !== dialogVersion) return;
    menu.close();
    menu.classList.remove('is-closing');
    menu.dataset.motion = 'closed';
  }

  function revealView(node) {
    animate(node,[{opacity:0,filter:'blur(3px)'},{opacity:1,filter:'blur(0px)'}],{duration:650},new Set());
  }

  return {selectPanel, open, close, revealView};
}
