/* ============================================================================
   Waw Intro — Three (ESM) + GSAP (UMD global) + Bloom (UnrealBloomPass)
============================================================================ */
import * as THREE from './vendor/three.module.js';
import { EffectComposer }   from './vendor/postprocessing/EffectComposer.js';
import { RenderPass }       from './vendor/postprocessing/RenderPass.js';

const gsap = window.gsap; // récupère GSAP global

// --- DOM
const canvas   = document.getElementById('waw-canvas');
const loaderEl = document.getElementById('loader');
const fillEl   = document.getElementById('loader-fill');
const pctEl    = document.getElementById('loader-percent');
const enter    = document.getElementById('enter-overlay');
const enterBtn = document.getElementById('enter-btn');

loaderEl?.classList.add('hidden'); // masque le loader

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: false, powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Scène + Caméra
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 200);
camera.position.set(6, -6, 14);
scene.add(camera);

// Lumières
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const dir = new THREE.DirectionalLight(0xffffff, 0.7);
dir.position.set(5, 10, 7);
scene.add(dir);

// Tour
const towerGeo = new THREE.CylinderGeometry(3, 3, 16, 24, 1, true);
const towerMat = new THREE.MeshPhysicalMaterial({
  color: 0x7fb8ff, roughness: 0.6, metalness: 0, transmission: 0.85,
  thickness: 0.5, transparent: true, opacity: 1, side: THREE.DoubleSide
});
const tower = new THREE.Mesh(towerGeo, towerMat);
tower.position.y = 2;
scene.add(tower);

// Bulles
const bubbles = new THREE.Group();
const baseBubbleMat = new THREE.MeshPhysicalMaterial({
  color: 0xdfeaff, roughness: 0.25, metalness: 0, transmission: 0.9, thickness: 0.4,
  // Ajout d'émissif pour que le Bloom accroche bien
  emissive: new THREE.Color(0x88caff), emissiveIntensity: 0.45
});
const BUBBLE_COUNT = 90;
for (let i = 0; i < BUBBLE_COUNT; i++){
  const r = 0.12 + Math.random()*0.35;
  const geo = new THREE.SphereGeometry(r, 20, 16);
  const m = new THREE.Mesh(geo, baseBubbleMat.clone());
  const ang = Math.random()*Math.PI*2;
  const radius = 2.4 * Math.sqrt(Math.random());
  m.position.set(Math.cos(ang)*radius, -6 + Math.random()*12, Math.sin(ang)*radius);
  m.material.color.offsetHSL(0, 0, (Math.random()*0.2 - 0.1));
  bubbles.add(m);
}
scene.add(bubbles);

// =====================
// Postprocessing (Bloom)
// =====================
let composer, renderPass, bloomPass;
function initComposer() {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Réglages par défaut (ajustés par thème plus bas)
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.65,   // strength
    0.9,    // radius
    0.6     // threshold
  );
  composer.addPass(bloomPass);
}
initComposer();

// Thèmes (avec réglages Bloom)
const THEMES = {
  dark: {
    clearColor: 0x0b1020,
    tower:{rough:0.65,tr:0.85,col:0x7fb8ff},
    bubble:{rough:0.28,tr:0.9,col:0xdfeaff, em:0.5},
    bloom:{ strength:0.8, radius:0.95, threshold:0.55 }
  },
  light:{
    clearColor: 0xeaf1ff,
    tower:{rough:0.82,tr:0.72,col:0x97c7ff},
    bubble:{rough:0.38,tr:0.85,col:0xffffff, em:0.35},
    bloom:{ strength:0.55, radius:0.85, threshold:0.65 }
  }
};

function applyTheme(mode){
  const t = (mode==='light') ? THEMES.light : THEMES.dark;

  // Fond
  renderer.setClearColor(t.clearColor, 1);

  // Matériaux tour & bulles
  towerMat.roughness = t.tower.rough;
  towerMat.transmission = t.tower.tr;
  towerMat.color.setHex(t.tower.col);
  towerMat.needsUpdate = true;

  bubbles.children.forEach(m => {
    m.material.roughness = t.bubble.rough;
    m.material.transmission = t.bubble.tr;
    m.material.color.setHex(t.bubble.col);
    m.material.emissiveIntensity = t.bubble.em;
    m.material.needsUpdate = true;
  });

  // Bloom tuning
  if (bloomPass){
    bloomPass.strength  = t.bloom.strength;
    bloomPass.radius    = t.bloom.radius;
    bloomPass.threshold = t.bloom.threshold;
  }

  document.body.classList.toggle('theme-light', mode==='light');
  document.body.classList.toggle('theme-dark',  mode!=='light');
}

const mq = window.matchMedia('(prefers-color-scheme: light)');
let currentTheme = mq.matches ? 'light' : 'dark';
applyTheme(currentTheme);
mq.addEventListener?.('change', e => { currentTheme = e.matches ? 'light' : 'dark'; applyTheme(currentTheme); });
window.addEventListener('keydown', e => {
  if (e.key.toLowerCase()==='t'){
    currentTheme = currentTheme==='dark'?'light':'dark';
    applyTheme(currentTheme);
  }
});

// Anim bulles
const t0 = performance.now();
function animateBubbles(t){
  const elapsed = (t - t0)/1000;
  for (let i=0; i<bubbles.children.length; i++){
    const b = bubbles.children[i];
    b.position.y += Math.sin(elapsed*0.6 + i)*0.0025;
    b.rotation.y += 0.002;
    b.rotation.x += 0.0015;
  }
}

// Caméra (GSAP)
function animateCamera(){
  camera.position.set(6, -6, 14);
  camera.lookAt(0, 2, 0);

  const tl = gsap.timeline({ defaults: { ease:"power2.inOut" } });
  tl.to(camera.position, { duration:3.2, x:5,   y:4,  z:12 })
    .to(camera.position, { duration:2.2, x:1.8, y:8,  z:8  }, "<")
    .to(camera.position, { duration:1.6, x:0.9, y:8.8, z:5.8, ease:"power3.out" })
    .call(() => enter?.classList.remove('hidden'));

  gsap.ticker.add(() => camera.lookAt(0, 2, 0));
}

// Resize
function onResize(){
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer?.setSize(w, h);
}
window.addEventListener('resize', onResize);

// Boucle
let running = true;
document.addEventListener('visibilitychange', () => {
  running = (document.visibilityState === 'visible');
});
function tick(now){
  if (running){
    animateBubbles(now);
    tower.rotation.y += 0.0012;
    // Postprocessing render
    composer ? composer.render() : renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Entrer
enterBtn?.addEventListener('click', () => {
  enter?.classList.add('hidden');
  document.body.classList.add('fade-out');
  setTimeout(() => { window.location.href = 'messagerie.html'; }, 500);
});

// GO
animateCamera();
