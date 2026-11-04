import * as THREE from './vendor/three.module.js';
import {CARD_WIDTH, CARD_HEIGHT, STEP_X, STEP_Y, galleryShape, galleryCell, spherePoint, springStep, nearestCardPan, movedBeyondClick} from './echoes-gallery-core.mjs';

const vertexShader = `
  uniform vec2 uImpulse;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vBasisX;
  varying vec3 vBasisY;
  varying vec3 vBasisZ;
  void main() {
    vUv = uv;
    vec3 displaced = position;
    float membrane = sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265);
    float energy = min(length(uImpulse), 1.0);
    displaced.xy -= uImpulse * membrane * 12.0;
    displaced.z += membrane * energy * sin(uv.x * 5.0 + uv.y * 3.0 - uTime * 8.0) * 12.0;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorld = world.xyz;
    vBasisX = modelMatrix[0].xyz;
    vBasisY = modelMatrix[1].xyz;
    vBasisZ = modelMatrix[2].xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = `
  uniform sampler2D uPhoto;
  uniform vec4 uTile;
  uniform float uImageAspect;
  uniform vec2 uImpulse;
  uniform float uHover;
  uniform float uFresh;
  uniform float uTextOnly;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform vec3 uSecondary;
  uniform float uPattern;
  uniform float uSeed;
  uniform float uLight;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vBasisX;
  varying vec3 vBasisY;
  varying vec3 vBasisZ;

  float roundedBox(vec2 p) {
    vec2 q = abs(p) - vec2(0.6666667, 0.5) + 0.145;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.145;
  }
  float heightAt(vec2 p) {
    float edge = clamp(1.0 + roundedBox(p) / 0.106, 0.0, 1.0);
    return sqrt(max(1.0 - edge * edge, 0.0)) * 0.074;
  }
  vec2 photoUv(vec2 uv) {
    float cardAspect = 1.3333333;
    vec2 cover = vec2(min(1.0, cardAspect / uImageAspect), min(1.0, uImageAspect / cardAspect));
    vec2 local = clamp((uv - 0.5) * cover + 0.5, 0.003, 0.997);
    return uTile.xy + local * uTile.zw;
  }
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }
  float lineAt(float distance, float width) {
    return 1.0 - smoothstep(width, width * 2.3, abs(distance));
  }
  float segment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h);
  }
  float engraving(vec2 uv) {
    float phase = uSeed * 6.2831853;
    if (uPattern < 0.5) {
      // Light crossing a field of water-level contours.
      float tidal = uv.y + sin(uv.x * 5.0 + phase) * 0.06 + sin(uv.x * 12.0 - phase) * 0.014;
      return lineAt(sin(tidal * 60.0 + phase), 0.035) * 0.8;
    }
    if (uPattern < 1.5) {
      // Organic, uneven rings: a quiet ecological topography.
      vec2 p = (uv - vec2(0.86, 0.72)) * vec2(1.0, 0.85);
      float radius = length(p) + sin(atan(p.y, p.x) * 5.0 + phase) * 0.022;
      return lineAt(sin(radius * 56.0 + phase), 0.065);
    }
    if (uPattern < 2.5) {
      // A small, deterministic constellation of relationships.
      float network = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 a = vec2(hash21(vec2(fi + uSeed, 2.0)), hash21(vec2(fi, uSeed + 8.0))) * 0.76 + 0.12;
        vec2 b = vec2(hash21(vec2(fi + 1.0 + uSeed, 2.0)), hash21(vec2(fi + 1.0, uSeed + 8.0))) * 0.76 + 0.12;
        network += lineAt(segment(uv, a, b), 0.0018) * 0.55;
        network += exp(-dot(uv - a, uv - a) * 950.0);
      }
      return min(network, 1.2);
    }
    if (uPattern < 3.5) {
      // Archive strata and broken rules suggest lived-in urban memory.
      float row = floor(uv.y * 22.0);
      float edge = 0.20 + hash21(vec2(row, uSeed)) * 0.65;
      float rules = lineAt(fract(uv.y * 22.0) - 0.5, 0.026);
      return rules * smoothstep(edge - 0.10, edge + 0.03, uv.x) + lineAt(uv.x - 0.85, 0.0015) * 0.38;
    }
    if (uPattern < 4.5) {
      // Overlapping orbits evoke gatherings and human connection.
      vec2 p = (uv - vec2(0.80, 0.76)) * vec2(1.0, 0.9);
      float rings = lineAt(length(p) - 0.15, 0.0018) + lineAt(length(p) - 0.28, 0.0022) + lineAt(length(p) - 0.42, 0.0017);
      rings += lineAt(length(p - vec2(-0.14, -0.10)) - 0.23, 0.0015) * 0.75;
      return rings;
    }
    // A broad horizon leaves more silence for wishes about pace and wellbeing.
    float horizon = uv.y - 0.31 - sin(uv.x * 3.5 + phase) * 0.10;
    return exp(-horizon * horizon * 170.0) * 0.25 + lineAt(horizon + 0.055, 0.002) * 0.55;
  }
  vec3 photo(vec2 uv) {
    vec3 result = vec3(0.0);
    if (uTextOnly > 0.5) {
      vec2 offset = uv - vec2(0.78, 0.80);
      float softLight = exp(-dot(offset, offset) * 3.6);
      float lowerLight = exp(-dot(uv - vec2(0.15, 0.15), uv - vec2(0.15, 0.15)) * 7.0);
      vec3 field = mix(uBase, uAccent, softLight * mix(0.34, 0.13, uLight));
      field = mix(field, uSecondary, lowerLight * mix(0.16, 0.07, uLight));
      float motif = engraving(uv) * (0.18 + smoothstep(0.34, 1.0, uv.x) * 0.66);
      vec3 etched = mix(uAccent, uSecondary, 0.35);
      field = mix(field, etched, min(motif * mix(0.48, 0.22, uLight), 0.52));
      // Bright engravings stay below the reading contrast budget on dark glass.
      float fieldLuminance = dot(field, vec3(0.2126, 0.7152, 0.0722));
      if (uLight < 0.5 && fieldLuminance > 0.12) field *= 0.12 / fieldLuminance;
      float grain = (hash21(uv * vec2(1300.0, 975.0) + uSeed) - 0.5) * 0.006;
      result = field + grain;
    } else {
      result = texture2D(uPhoto, photoUv(uv)).rgb;
    }
    return result;
  }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.3333333, 1.0);
    float distance = roundedBox(p);
    if (distance > 0.0) discard;
    float epsilon = 0.001;
    vec2 slope = vec2(heightAt(p + vec2(epsilon, 0.0)) - heightAt(p - vec2(epsilon, 0.0)), heightAt(p + vec2(0.0, epsilon)) - heightAt(p - vec2(0.0, epsilon))) / (2.0 * epsilon);
    vec3 normal = normalize(vec3(-slope, 1.0));
    vec3 worldNormal = normalize(vBasisX * normal.x + vBasisY * normal.y + vBasisZ * normal.z);
    vec3 viewDirection = normalize(cameraPosition - vWorld);
    float bevel = 1.0 - smoothstep(0.0, 0.122, -distance);
    vec2 refracted = normal.xy * (0.038 + bevel * 0.043);
    refracted += uImpulse * 0.005 * bevel;
    vec2 centerUv = vUv + refracted;
    vec2 spread = normal.xy * 0.0033 * bevel;
    vec3 colour = vec3(photo(centerUv + spread).r, photo(centerUv).g, photo(centerUv - spread).b);
    // The photograph bends through its own bevel; no expensive scene-copy pass.
    float bottomShade = (1.0 - smoothstep(0.02, 0.48, vUv.y)) * mix(0.47, 0.08, uTextOnly);
    colour *= 0.96 - bottomShade;
    float fresnel = 0.035 + 0.8 * pow(1.0 - max(dot(worldNormal, viewDirection), 0.0), 4.2);
    vec3 reflectionDirection = reflect(-viewDirection, worldNormal);
    float broadReflection = smoothstep(-0.28, 0.92, reflectionDirection.y);
    vec3 environment = mix(vec3(0.06, 0.075, 0.12), vec3(0.86, 0.90, 1.0), broadReflection);
    colour = mix(colour, environment, min(0.60, fresnel * bevel * 0.92));
    // Broad, directional silver crescents model a reflected softbox. A thin
    // darker groove and the inner ridge make the bevel read as thick glass,
    // rather than a uniform coloured outline.
    float whiteReflection = pow(max(dot(normal, normalize(vec3(-0.72, 0.35, 0.42))), 0.0), 9.0);
    float upperReflection = pow(max(dot(normal, normalize(vec3(-0.20, 0.82, 0.47))), 0.0), 11.0);
    float lowerReflection = pow(max(dot(normal, normalize(vec3(0.60, -0.65, 0.48))), 0.0), 14.0);
    float ridge = exp(-pow((distance + 0.022) / 0.014, 2.0));
    float groove = exp(-pow((distance + 0.058) / 0.009, 2.0));
    float ridgeDirection = clamp(0.12 - normal.x * 0.52 + normal.y * 0.58, 0.0, 1.0);
    colour *= 1.0 - groove * 0.20;
    colour += bevel * (whiteReflection * vec3(1.15, 1.18, 1.23) + upperReflection * vec3(0.55, 0.61, 0.66) + lowerReflection * vec3(0.30, 0.37, 0.43));
    colour += ridge * (0.03 + ridgeDirection * 0.30) * vec3(0.91, 0.93, 1.0);
    float rim = 1.0 - smoothstep(0.0, 0.005, -distance);
    colour += rim * mix(vec3(0.14, 0.20, 0.24), vec3(0.85, 0.93, 0.96), vUv.y) * (0.33 + uHover * 0.17);
    colour += uFresh * bevel * vec3(0.02, 0.10, 0.13);
    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }
`;

function matrixString(elements, object = false) {
  return `matrix3d(${elements.map((value, index) => {
    const sign = object ? (index >= 4 && index <= 7 ? -1 : 1) : ([1, 5, 9, 13].includes(index) ? -1 : 1);
    const result = value * sign;
    return Math.abs(result) < 1e-10 ? 0 : result;
  }).join(',')})`;
}

const defaultVisual = {family:'horizon',pattern:5,layout:'story',base:'#082730',accent:'#2D9AAB',secondary:'#7BBECD',text:'#E9F1F6',serial:'2050',seed:0.34};
function visualFor(card) {
  return card.visual || defaultVisual;
}

function makeLabel() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'echo-gallery-card';
  const edition = document.createElement('span');
  edition.className = 'echo-card-edition';
  edition.textContent = 'SHANGHAI / 2050';
  const serial = document.createElement('span');
  serial.className = 'echo-card-number';
  serial.setAttribute('aria-hidden','true');
  const quote = document.createElement('span');
  quote.className = 'echo-card-quote';
  quote.textContent = '“';
  quote.setAttribute('aria-hidden','true');
  const caption = document.createElement('span');
  caption.className = 'echo-card-caption';
  const rule = document.createElement('span');
  rule.className = 'echo-card-rule';
  const title = document.createElement('span');
  title.className = 'echo-card-title';
  const description = document.createElement('span');
  description.className = 'echo-card-description';
  const openLabel = document.createElement('span');
  openLabel.className = 'echo-card-open';
  caption.append(rule, title, description);
  button.append(edition, serial, quote, caption, openLabel);
  return {button, title, description, openLabel, serial};
}

export function createEchoGallery({host, atlasUrl = null, columns = 6, rows = 4, onSelect = () => {}, onError = () => {}, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches} = {}) {
  if (!(host instanceof HTMLElement)) throw new TypeError('A gallery host is required');
  host.classList.add('echo-gallery');
  let cards = [], active = false, destroyed = false, frame = 0, previousTime = 0;
  let renderer, scene, camera, geometry, atlas, dom, cameraDom, fallback;
  let width = 1, height = 1, pixelsToWorld = 1;
  let pool = [], poolColumns = 0, poolRows = 0;
  let drag = null, hoveredId = null;
  let pan = {x: 0, y: 0}, velocity = {x: 0, y: 0}, target = {x: 0, y: 0}, inertia = {x: 0, y: 0};
  const textureCache = new Map();
  const visualCache = new Map();
  const abort = new AbortController();
  const {signal} = abort;
  const loader = new THREE.TextureLoader();
  const normalPoint = new THREE.Vector3();
  const fallbackPixel = new THREE.DataTexture(new Uint8Array([20, 29, 46, 255]), 1, 1, THREE.RGBAFormat);
  fallbackPixel.needsUpdate = true;

  function configureTexture(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }
  function imageTexture(url) {
    if (!url) return null;
    if (!textureCache.has(url)) {
      const entry = {texture: null, pending: true};
      textureCache.set(url, entry);
      loader.load(url, texture => {
        if (destroyed) { texture.dispose(); return; }
        entry.texture = configureTexture(texture);
        entry.pending = false;
        schedule();
      }, undefined, () => { entry.pending = false; });
    }
    return textureCache.get(url).texture;
  }

  function bindLabel(label, card) {
    const visual=visualFor(card);
    label.button.classList.toggle('is-text', !!card.textOnly);
    label.button.dataset.layout=visual.layout || 'story';
    label.button.dataset.family=visual.family || 'horizon';
    label.button.dataset.pattern=String(visual.pattern || 0);
    label.button.style.setProperty('--echo-card-ink',visual.text);
    label.button.style.setProperty('--echo-card-base',visual.base);
    label.button.style.setProperty('--echo-card-accent',visual.accent);
    label.button.style.setProperty('--echo-card-secondary',visual.secondary);
    const titleUnits=Array.from(card.title||'').reduce((sum,ch)=>sum+(/\p{Script=Han}/u.test(ch)?1:(/\s/u.test(ch) ? .22 : .50)),0);
    label.button.style.setProperty('--echo-word-size',`${Math.max(34,Math.min(60,260/Math.max(1,titleUnits)))}px`);
    label.button.classList.toggle('has-long-title',titleUnits>11);
    label.serial.textContent=visual.serial || '';
    if (label.button.dataset.cardId !== card.id) {
      label.button.dataset.cardId = card.id;
      label.button.classList.toggle('is-audience', !card.seed);
    }
    label.button.classList.toggle('is-fresh', !!card.isNew);
    if (label.title.textContent !== card.title) label.title.textContent = card.title || '';
    if (label.description.textContent !== card.description) label.description.textContent = card.description || '';
    label.openLabel.textContent = card.openLabel || 'VIEW VISION';
    label.button.setAttribute('aria-label', `${card.title || ''}. ${card.description || ''}`);
  }

  function fallbackRender() {
    if (!fallback) return;
    fallback.replaceChildren();
    for (const card of cards) {
      const label = makeLabel();
      bindLabel(label, card);
      const tile = Math.max(0, Math.min(columns * rows - 1, Number(card.tile) || 0));
      if (card.textOnly) {
        // CSS fallback uses the same semantic palette as the shader.
      } else if (card.imageUrl) {
        label.button.style.backgroundImage = `url(${JSON.stringify(card.imageUrl)})`;
        label.button.style.backgroundSize = 'cover';
        label.button.style.backgroundPosition = 'center';
      } else if (atlasUrl) {
        label.button.style.backgroundImage = `url(${JSON.stringify(atlasUrl)})`;
        label.button.style.backgroundSize = `${columns * 100}% ${rows * 100}%`;
        label.button.style.backgroundPosition = `${columns > 1 ? (tile % columns) * 100 / (columns - 1) : 0}% ${rows > 1 ? Math.floor(tile / columns) * 100 / (rows - 1) : 0}%`;
      }
      label.button.addEventListener('click', () => onSelect(card));
      fallback.append(label.button);
    }
  }

  function createSlot(column, row) {
    const uniforms = {
      uPhoto: {value: atlas || fallbackPixel}, uTile: {value: new THREE.Vector4(0, 0, 1, 1)},
      uImageAspect: {value: 4 / 3}, uImpulse: {value: new THREE.Vector2()}, uTime: {value: 0},
      uHover: {value: 0}, uFresh: {value: 0},
      uTextOnly: {value: 0}, uBase: {value:new THREE.Color('#082730')},
      uAccent: {value: new THREE.Color('#2D9AAB')}, uSecondary:{value:new THREE.Color('#7BBECD')},
      uPattern:{value:5},uSeed:{value:0.34},uLight:{value:0},
    };
    const material = new THREE.ShaderMaterial({uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: true, side: THREE.FrontSide});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const label = makeLabel();
    cameraDom.append(label.button);
    return {column, row, mesh, label, uniforms, card: null};
  }

  function clearPool() {
    for (const slot of pool) { scene.remove(slot.mesh); slot.mesh.material.dispose(); slot.label.button.remove(); }
    pool = [];
  }

  function resize() {
    if (destroyed || !renderer) return;
    const bounds = host.getBoundingClientRect();
    width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
    const visibleColumns = width < 580 ? 1.95 : width < 850 ? 3.15 : width < 1150 ? 4.3 : 5.3;
    const worldWidth = visibleColumns * STEP_X;
    camera.aspect = width / height;
    camera.position.z = worldWidth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.near = 10; camera.far = 15000;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    pixelsToWorld = worldWidth / width;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 700 ? 1.5 : 1.75));
    const fovPixels = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    dom.style.perspective = `${fovPixels}px`;
    cameraDom.style.transform = `translateZ(${fovPixels}px) ${matrixString(camera.matrixWorldInverse.elements)} translate(${width / 2}px,${height / 2}px)`;
    const requiredColumns = Math.ceil(visibleColumns) + 4;
    const requiredRows = Math.ceil(worldWidth / camera.aspect / STEP_Y) + 4;
    if (requiredColumns !== poolColumns || requiredRows !== poolRows) {
      clearPool(); poolColumns = requiredColumns; poolRows = Math.min(18, requiredRows);
      for (let row = -Math.floor(poolRows / 2); row < Math.ceil(poolRows / 2); row++) {
        for (let column = -Math.floor(poolColumns / 2); column < Math.ceil(poolColumns / 2); column++) pool.push(createSlot(column, row));
      }
    }
    schedule();
  }

  function schedule() {
    if (active && !destroyed && renderer && !frame) frame = requestAnimationFrame(render);
  }
  function render(time) {
    frame = 0;
    if (!active || destroyed || !renderer) return;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 1 / 30) : 1 / 60;
    previousTime = time;
    if (!drag) {
      target.x += inertia.x * delta; target.y += inertia.y * delta;
      const decay = Math.exp(-delta * 5.5);
      inertia.x *= decay; inertia.y *= decay;
    }
    if (reducedMotion) { pan = {...target}; velocity = {x: 0, y: 0}; inertia = {x: 0, y: 0}; }
    else {
      const sx = springStep(pan.x, velocity.x, target.x, delta);
      const sy = springStep(pan.y, velocity.y, target.y, delta);
      pan = {x: sx.position, y: sy.position}; velocity = {x: sx.velocity, y: sy.velocity};
    }
    const shape = galleryShape(cards.length);
    const nowSeconds = time / 1000;
    let hoverSettling = false;
    const accessibleCards = new Map();
    for (const slot of pool) {
      if (!cards.length) { slot.mesh.visible = false; slot.label.button.hidden = true; continue; }
      const cell = galleryCell(slot.column, slot.row, pan.x, pan.y, shape);
      const card = cards[cell.index];
      slot.card = card;
      const pose = spherePoint(cell.x, cell.y);
      slot.mesh.position.set(pose.x, pose.y, pose.z);
      normalPoint.set(pose.x + pose.nx, pose.y + pose.ny, pose.z + pose.nz);
      slot.mesh.lookAt(normalPoint);
      if (!reducedMotion) {
        slot.mesh.rotateX(Math.max(-0.045, Math.min(0.045, velocity.y / 26000)));
        slot.mesh.rotateY(Math.max(-0.045, Math.min(0.045, -velocity.x / 26000)));
      }
      slot.mesh.updateMatrixWorld();
      slot.uniforms.uImpulse.value.set(reducedMotion ? 0 : THREE.MathUtils.clamp(velocity.x / 2400, -1, 1), reducedMotion ? 0 : THREE.MathUtils.clamp(velocity.y / 2400, -1, 1));
      slot.uniforms.uTime.value = nowSeconds;
      slot.uniforms.uHover.value += ((card.id === hoveredId ? 1 : 0) - slot.uniforms.uHover.value) * Math.min(1, delta * 10);
      if (Math.abs((card.id === hoveredId ? 1 : 0) - slot.uniforms.uHover.value) > 0.005) hoverSettling = true;
      slot.uniforms.uFresh.value = card.isNew ? 1 : 0;
      slot.uniforms.uTextOnly.value = card.textOnly ? 1 : 0;
      const visual=visualFor(card);
      const visualKey=[visual.base,visual.accent,visual.secondary,visual.pattern,visual.seed].join('/');
      let materialVisual=visualCache.get(visualKey);
      if(!materialVisual){
        const base=new THREE.Color(visual.base),accent=new THREE.Color(visual.accent),secondary=new THREE.Color(visual.secondary);
        const light=base.r*.2126+base.g*.7152+base.b*.0722>.35?1:0;
        materialVisual={base,accent,secondary,light};visualCache.set(visualKey,materialVisual);
      }
      slot.uniforms.uBase.value.copy(materialVisual.base);
      slot.uniforms.uAccent.value.copy(materialVisual.accent);
      slot.uniforms.uSecondary.value.copy(materialVisual.secondary);
      slot.uniforms.uPattern.value=Number(visual.pattern)||0;
      slot.uniforms.uSeed.value=Number(visual.seed)||0;
      slot.uniforms.uLight.value=materialVisual.light;
      const ownImage = card.textOnly ? null : imageTexture(card.imageUrl);
      slot.uniforms.uPhoto.value = ownImage || atlas || fallbackPixel;
      if (ownImage) {
        slot.uniforms.uTile.value.set(0, 0, 1, 1);
        slot.uniforms.uImageAspect.value = ownImage.image.width / ownImage.image.height || 4 / 3;
      } else {
        const tile = Math.max(0, Math.min(columns * rows - 1, Math.floor(Number(card.tile) || 0)));
        slot.uniforms.uTile.value.set((tile % columns) / columns, 1 - (Math.floor(tile / columns) + 1) / rows, 1 / columns, 1 / rows);
        slot.uniforms.uImageAspect.value = atlas?.image ? (atlas.image.width / columns) / (atlas.image.height / rows) : 4 / 3;
      }
      bindLabel(slot.label, card);
      const visible = Math.abs(cell.x) < width * pixelsToWorld / 2 + CARD_WIDTH / 2 && Math.abs(cell.y) < height * pixelsToWorld / 2 + CARD_HEIGHT / 2;
      slot.mesh.visible = visible;
      slot.label.button.hidden = !visible;
      slot.label.button.style.transform = `translate(-50%,-50%) ${matrixString(slot.mesh.matrixWorld.elements, true)}`;
      if (visible) {
        const previous = accessibleCards.get(card.id);
        const distanceToCenter = cell.x * cell.x + cell.y * cell.y;
        if (!previous || distanceToCenter < previous.distance) accessibleCards.set(card.id, {slot, distance: distanceToCenter});
      }
    }
    // Wrapping may show a second copy at the perimeter. Assistive technology and
    // keyboard navigation encounter each narrative only once, at its closest copy.
    for (const slot of pool) {
      const accessible = slot.mesh.visible && accessibleCards.get(slot.card?.id)?.slot === slot;
      slot.label.button.tabIndex = accessible ? 0 : -1;
      slot.label.button.setAttribute('aria-hidden', String(!accessible));
    }
    renderer.render(scene, camera);
    // Static photographs need no perpetual render loop. Wake again for a gesture,
    // a translated label, an arriving photograph, or an unsettled spring.
    if (hoverSettling || (!reducedMotion && (Math.abs(velocity.x) + Math.abs(velocity.y) > 0.15 || Math.abs(target.x - pan.x) + Math.abs(target.y - pan.y) > 0.03 || Math.abs(inertia.x) + Math.abs(inertia.y) > 0.15))) schedule();
    else previousTime = 0;
  }

  function selectedCard(id) { return cards.find(card => card.id === id); }
  function beginDrag(pointerId,x,y,cardId,gesture=false) {
    drag = {pointerId, startX:x, startY:y, lastX:x, lastY:y, lastTime:performance.now(), moved:false, cardId, vx:0, vy:0, gesture};
    inertia = {x:0,y:0};schedule();
  }
  function onPointerDown(event) {
    if (event.button !== 0 || !active) return;
    beginDrag(event.pointerId,event.clientX,event.clientY,event.target.closest?.('[data-card-id]')?.dataset.cardId);
    try { host.setPointerCapture(event.pointerId); } catch {}
  }
  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) {
      hoveredId = event.target.closest?.('[data-card-id]')?.dataset.cardId || null;
      schedule();
      return;
    }
    const now = performance.now();
    const dt = Math.max(8, now - drag.lastTime) / 1000;
    const dx = (event.clientX - drag.lastX) * pixelsToWorld;
    const dy = -(event.clientY - drag.lastY) * pixelsToWorld;
    target.x += dx; target.y += dy;
    drag.vx = dx / dt; drag.vy = dy / dt;
    drag.lastX = event.clientX; drag.lastY = event.clientY; drag.lastTime = now;
    drag.moved ||= movedBeyondClick(drag.startX, drag.startY, event.clientX, event.clientY);
    host.classList.toggle('is-dragging', drag.moved);
    if (drag.moved) event.preventDefault();
    schedule();
  }
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const finished = drag; drag = null; host.classList.remove('is-dragging');
    if (!finished.gesture) { try { host.releasePointerCapture(event.pointerId); } catch {} }
    if (event.type !== 'pointercancel' && finished.moved && !reducedMotion && performance.now() - finished.lastTime < 120) inertia = {x: THREE.MathUtils.clamp(finished.vx * 0.65, -2400, 2400), y: THREE.MathUtils.clamp(finished.vy * 0.65, -2400, 2400)};
    if (event.type !== 'pointercancel' && !finished.moved && finished.cardId) {
      const card = selectedCard(finished.cardId); if (card) onSelect(card);
    }
    schedule();
  }

  // The camera controller owns gesture capture and explicit release. These
  // methods reuse the gallery's drag physics without dispatching fake DOM
  // pointer events or trying to capture a nonexistent hardware pointer.
  function gestureHit(x,y) {
    if (!active || destroyed || fallback || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    const hit=document.elementFromPoint(x,y);
    return hit && host.contains(hit) ? hit : null;
  }
  const gesture={
    hover(x,y){const hit=gestureHit(x,y);hoveredId=hit?.closest('[data-card-id]')?.dataset.cardId||null;schedule();return !!hit;},
    begin(x,y){const hit=gestureHit(x,y);if(!hit||drag)return false;beginDrag('gesture',x,y,hit.closest('[data-card-id]')?.dataset.cardId,true);return true;},
    move(x,y){if(!drag?.gesture||!active||!Number.isFinite(x)||!Number.isFinite(y))return false;onPointerMove({pointerId:'gesture',clientX:x,clientY:y,preventDefault(){}});return true;},
    end({release=false}={}){if(!drag?.gesture)return false;finishDrag({pointerId:'gesture',type:release&&active?'pointerup':'pointercancel'});return true;},
    cancel(){hoveredId=null;if(drag?.gesture){drag=null;inertia={x:0,y:0};target={...pan};velocity={x:0,y:0};host.classList.remove('is-dragging');}schedule();}
  };

  function focusCard(id) {
    const index = cards.findIndex(card => card.id === id);
    if (index < 0) return;
    if (fallback) { fallback.querySelector(`[data-card-id="${CSS.escape(id)}"]`)?.scrollIntoView({block: 'center', behavior: reducedMotion ? 'instant' : 'smooth'}); return; }
    target = nearestCardPan(index, galleryShape(cards.length), pan.x, pan.y);
    inertia = {x: 0, y: 0};
    schedule();
  }

  function useFallback(error) {
    cancelAnimationFrame(frame); frame = 0;
    drag = null; host.classList.remove('is-dragging');
    abort.abort();
    if (scene) clearPool();
    renderer?.dispose(); renderer = null;
    host.dataset.renderer = 'fallback';
    fallback = document.createElement('div'); fallback.className = 'echo-gallery-fallback';
    host.replaceChildren(fallback);
    fallbackRender();
    onError(error);
  }

  try {
    renderer = new THREE.WebGLRenderer({alpha: false, antialias: true, powerPreference: 'high-performance'});
    renderer.setClearColor(0x050711, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'echo-gallery-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.dataset.renderer = 'webgl';
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 10, 15000);
    geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 20, 15);
    dom = document.createElement('div'); dom.className = 'echo-gallery-dom';
    cameraDom = document.createElement('div'); cameraDom.className = 'echo-gallery-camera';
    dom.append(cameraDom); host.append(renderer.domElement, dom);
    if (atlasUrl) loader.load(atlasUrl, texture => { if (destroyed) texture.dispose(); else { atlas = configureTexture(texture); schedule(); } }, undefined, () => onError(new Error('The gallery photographs could not be loaded.')));
    host.addEventListener('pointerdown', onPointerDown, {signal});
    host.addEventListener('pointermove', onPointerMove, {signal});
    host.addEventListener('pointerup', finishDrag, {signal});
    host.addEventListener('pointercancel', finishDrag, {signal});
    host.addEventListener('lostpointercapture', () => { drag = null; host.classList.remove('is-dragging'); }, {signal});
    host.addEventListener('pointerleave', () => { hoveredId = null; schedule(); }, {signal});
    host.addEventListener('click', event => {
      // Pointer activation is handled above; detail===0 is keyboard/AT activation.
      if (event.detail !== 0) return;
      const card = selectedCard(event.target.closest?.('[data-card-id]')?.dataset.cardId);
      if (card) onSelect(card);
    }, {signal});
    host.addEventListener('wheel', event => {
      if (!active) return;
      event.preventDefault();
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
      target.x -= event.deltaX * factor * pixelsToWorld * 0.8;
      target.y += event.deltaY * factor * pixelsToWorld * 0.8;
      inertia = {x: 0, y: 0};
      schedule();
    }, {signal, passive: false});
    host.addEventListener('keydown', event => {
      const direction = {ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
      if (!direction) return;
      event.preventDefault();
      target.x += direction[0] * STEP_X; target.y += direction[1] * STEP_Y;
      inertia = {x: 0, y: 0};
      schedule();
    }, {signal});
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); useFallback(new Error('The gallery graphics context was interrupted. A card grid is available instead.')); }, {signal});
  } catch (error) {
    useFallback(error);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return {
    setCards(nextCards) {
      cards = Array.isArray(nextCards) ? nextCards.filter(card => card && typeof card.id === 'string') : [];
      fallbackRender(); schedule();
    },
    setActive(value) {
      active = !!value; previousTime = 0;
      host.setAttribute('aria-hidden', String(!active));
      if (active) { resize(); schedule(); }
      else { cancelAnimationFrame(frame); frame = 0; drag = null; inertia = {x: 0, y: 0}; host.classList.remove('is-dragging'); }
    },
    focusCard, resize, gesture,
    destroy() {
      if (destroyed) return;
      destroyed = true; active = false; abort.abort(); observer.disconnect();
      cancelAnimationFrame(frame); if (scene) clearPool();
      geometry?.dispose(); atlas?.dispose(); fallbackPixel.dispose();
      for (const entry of textureCache.values()) entry.texture?.dispose();
      renderer?.dispose(); host.replaceChildren(); host.classList.remove('echo-gallery', 'is-dragging');
    },
  };
}
