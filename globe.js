import * as THREE from 'three';

// The landing globe has its own short-lived renderer.  The much larger city
// renderer remains owned by app.js, so returning HOME can recreate this scene.
const frame = document.getElementById('globe-frame');
const canvas = document.getElementById('globe-canvas');
const marker = document.getElementById('globe-marker');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const latitude = THREE.MathUtils.degToRad(31.2304);
const longitude = THREE.MathUtils.degToRad(121.4737);
const shanghaiYaw = Math.PI / 2 - (longitude + Math.PI);
const shanghaiLocal = new THREE.Vector3(
  -Math.cos(longitude + Math.PI) * Math.cos(latitude),
  Math.sin(latitude),
  Math.sin(longitude + Math.PI) * Math.cos(latitude)
);

let renderer;
let scene;
let camera;
let earth;
let tilt;
let spin;
let cityPoint;
let cityPulse;
let resizeObserver;
let animationFrame = 0;
let transition = null;
let transitionTimeout = 0;
let dragging = false;
let moved = false;
let pointerX = 0;
let pointerY = 0;
let yaw = shanghaiYaw;
let pitch = latitude;
let lastInteraction = 0;
let startTime = performance.now();
let generation = 0;
let fallback = false;

function makeTexture(url, currentGeneration) {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer ? Math.min(renderer.capabilities.getMaxAnisotropy(), 8) : 1;
      if (currentGeneration !== generation) {
        texture.dispose();
        resolve(null);
      } else resolve(texture);
    }, undefined, () => resolve(null));
  });
}

function makeHalo() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vNormal; varying vec3 vView; void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vView = normalize(-viewPosition.xyz);
      gl_Position = projectionMatrix * viewPosition;
    }`,
    fragmentShader: `varying vec3 vNormal; varying vec3 vView; void main() {
      float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
      gl_FragColor = vec4(0.18, 0.66, 1.0, rim * 0.46);
    }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1.075, 48, 32), material);
}

function addShanghaiBeacon() {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xa9f4ff, depthTest: true })
  );
  dot.position.copy(shanghaiLocal).multiplyScalar(1.018);
  spin.add(dot);
  cityPoint = dot;

  const pulse = new THREE.Mesh(
    new THREE.RingGeometry(0.032, 0.039, 48),
    new THREE.MeshBasicMaterial({ color: 0x58dbff, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false })
  );
  pulse.position.copy(shanghaiLocal).multiplyScalar(1.027);
  pulse.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), shanghaiLocal.clone().normalize());
  spin.add(pulse);
  cityPulse = pulse;
}

function resize() {
  if (!renderer || !frame || !camera) return;
  const width = Math.max(1, Math.floor(frame.clientWidth));
  const height = Math.max(1, Math.floor(frame.clientHeight));
  const aspect = width / height;
  renderer.setSize(width, height, false);
  camera.aspect = aspect;
  // Resize changes the projection without interrupting a running camera flight.
  if (!transition) camera.position.z = Math.max(3.2, 1.2 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect));
  camera.updateProjectionMatrix();
}

function positionMarker() {
  if (!marker || !cityPoint || !camera || !frame || !spin) return;
  spin.updateWorldMatrix(true, true);
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  const position = cityPoint.getWorldPosition(new THREE.Vector3());
  const visible = position.z > 0.22 && position.clone().normalize().dot(camera.position.clone().normalize()) > 0.18;
  marker.style.opacity = visible ? '1' : '0';
  marker.style.visibility = visible ? 'visible' : 'hidden';
    marker.disabled = !visible || Boolean(transition) || Boolean(window.SH2050?.error);
    marker.tabIndex = marker.disabled ? -1 : 0;
  if (!visible) return;
  position.project(camera);
  marker.style.left = `${(position.x * 0.5 + 0.5) * frame.clientWidth}px`;
  marker.style.top = `${(-position.y * 0.5 + 0.5) * frame.clientHeight}px`;
}

function tick(now) {
  if (!renderer || !scene || !camera) return;
  animationFrame = requestAnimationFrame(tick);
  if (document.body.dataset.menuOpen === 'true') return;
  // site.js switches to "entering" before asking for this flight. Both views
  // must keep rendering, otherwise the promise never completes.
  if (document.hidden || !['landing', 'entering'].includes(document.body.dataset.view)) return;

  if (transition) {
    const fraction = Math.min(1, (now - transition.start) / transition.duration);
    const ease = fraction * fraction * (3 - 2 * fraction);
    yaw = transition.yawFrom + (transition.targetYaw - transition.yawFrom) * ease;
    pitch = transition.pitchFrom + (latitude - transition.pitchFrom) * ease;
    camera.position.z = transition.zoomFrom + (1.37 - transition.zoomFrom) * ease;
    spin.rotation.y = yaw;
    if (fraction >= 1) {
      finishEntry();
    }
  } else if (!dragging && !reducedMotion.matches && now - lastInteraction > 2400) {
    // A restrained oscillation keeps Shanghai in view, unlike a full spin.
    spin.rotation.y = yaw + Math.sin((now - startTime) * 0.00032) * 0.055;
  } else spin.rotation.y = yaw;
  tilt.rotation.x = pitch;
  if (cityPulse && !reducedMotion.matches) {
    const phase = ((now - startTime) % 2700) / 2700;
    cityPulse.scale.setScalar(1 + phase * 1.6);
    cityPulse.material.opacity = (1 - phase) * 0.8;
  }
  positionMarker();
  renderer.render(scene, camera);
}

function onPointerDown(event) {
  if (transition || event.button !== 0 || document.body.dataset.view !== 'landing') return;
  dragging = true;
  moved = false;
  pointerX = event.clientX;
  pointerY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor = 'grabbing';
}

function onPointerMove(event) {
  if (!dragging || transition) return;
  const dx = event.clientX - pointerX;
  const dy = event.clientY - pointerY;
  if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
  yaw += dx * 0.005;
  pitch = THREE.MathUtils.clamp(pitch + dy * 0.0035, -1.17, 1.17);
  pointerX = event.clientX;
  pointerY = event.clientY;
  lastInteraction = performance.now();
}

function onPointerUp(event) {
  if (!dragging) return;
  dragging = false;
  canvas.style.cursor = 'grab';
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  lastInteraction = performance.now();
  if (!moved) {
    // A click recentres the globe, so the Shanghai point is easy to recover.
    yaw = shanghaiYaw;
    pitch = latitude;
  }
}

async function show() {
  if (!frame || !canvas) return;
  if (renderer || fallback) {
    if (camera && renderer) resize();
    return;
  }
  const currentGeneration = ++generation;
  frame.dataset.globeState = 'loading';
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
  } catch {
    fallback = true;
    frame.dataset.globeState = 'fallback';
    canvas.classList.add('globe-fallback');
    // A calm, nonblocking fallback keeps the entry usable without WebGL.
    canvas.style.background = 'radial-gradient(circle at 32% 26%, #496579 0%, #162a3e 28%, #070e18 64%, transparent 66%)';
    if (marker) {
      marker.style.left = '50%';
      marker.style.top = '50%';
      marker.style.visibility = 'visible';
    }
    return;
  }
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0x7b9cc2, 0.4));
  const sunlight = new THREE.DirectionalLight(0xe1eeff, 0.85);
  sunlight.position.set(-3, 1.4, 4);
  scene.add(sunlight);
  tilt = new THREE.Group();
  spin = new THREE.Group();
  tilt.add(spin);
  scene.add(tilt);
  const material = new THREE.MeshPhongMaterial({ color: 0x536a83, shininess: 4, specular: 0x22334a });
  earth = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), material);
  spin.add(earth);
  scene.add(makeHalo());
  addShanghaiBeacon();
  yaw = shanghaiYaw;
  pitch = latitude;
  dragging = false;
  lastInteraction = 0;
  startTime = performance.now();
  resize();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(frame);
  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  animationFrame = requestAnimationFrame(tick);

  const [dayTexture, nightTexture] = await Promise.all([
    makeTexture('./assets/earth-day-nasa.jpg', currentGeneration),
    makeTexture('./assets/earth-night-nasa.png', currentGeneration)
  ]);
  if (currentGeneration !== generation || !earth) {
    dayTexture?.dispose();
    nightTexture?.dispose();
    return;
  }
  if (dayTexture) material.map = dayTexture;
  if (nightTexture) {
    material.emissiveMap = nightTexture;
    material.emissive = new THREE.Color(0x9fc8ff);
    material.emissiveIntensity = 0.88;
  }
  material.needsUpdate = true;
  frame.dataset.globeState = 'ready';
}

function finishEntry() {
  if (!transition) return;
  const resolve = transition.resolve;
  transition = null;
  clearTimeout(transitionTimeout);
  transitionTimeout = 0;
  yaw = shanghaiYaw;
  pitch = latitude;
  resolve();
}

function enter() {
  if (!renderer || !camera) return Promise.resolve();
  if (transition) return transition.promise;
  if (reducedMotion.matches) {
    yaw = shanghaiYaw;
    pitch = latitude;
    return Promise.resolve();
  }
  let resolveTransition;
  const promise = new Promise((resolve) => { resolveTransition = resolve; });
  // Choose the nearest equivalent rotation to avoid a long reverse orbit.
  const nearestYaw = yaw + THREE.MathUtils.euclideanModulo(shanghaiYaw - yaw + Math.PI, Math.PI * 2) - Math.PI;
  transition = {
    start: performance.now(), duration: 1300,
    yawFrom: yaw, pitchFrom: pitch, zoomFrom: camera.position.z,
    resolve: resolveTransition, promise
  };
  // shanghaiYaw is adjusted to the nearest turn for the interpolation, then
  // restored to its canonical value after the transition completes.
  transition.targetYaw = nearestYaw;
  // A background tab or lost graphics context can suspend requestAnimationFrame.
  // The transition still settles, so returning to the tab never traps visitors.
  transitionTimeout = window.setTimeout(finishEntry, transition.duration + 200);
  return promise;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        material.map?.dispose();
        material.emissiveMap?.dispose();
        material.dispose();
      });
    }
  });
}

function destroy() {
  generation++;
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  finishEntry();
  clearTimeout(transitionTimeout);
  transitionTimeout = 0;
  resizeObserver?.disconnect();
  resizeObserver = null;
  canvas?.removeEventListener('pointerdown', onPointerDown);
  canvas?.removeEventListener('pointermove', onPointerMove);
  canvas?.removeEventListener('pointerup', onPointerUp);
  canvas?.removeEventListener('pointercancel', onPointerUp);
  if (scene) disposeObject(scene);
  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
  earth = null;
  tilt = null;
  spin = null;
  cityPoint = null;
  cityPulse = null;
  fallback = false;
  dragging = false;
  canvas?.classList.remove('globe-fallback');
  if (canvas) canvas.style.background = '';
  if (frame) frame.dataset.globeState = 'idle';
  if (marker) marker.style.opacity = '1';
}

window.SH2050_GLOBE = { show, enter, destroy };
if (document.body.dataset.view === 'landing') show();
