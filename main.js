const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 200, 900);

const container = document.getElementById('renderer-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

let isPaused = false;
let lastFrameTime = Date.now();
const MS_PER_FRAME = 16.667;

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 80;
controls.maxDistance = 1500;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.target.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(1, 1, 1);
scene.add(dirLight);

const starCount = 3000;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 800 + Math.random() * 400;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi);
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.2,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

const sunGeo = new THREE.SphereGeometry(25, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

const glowCanvas = document.createElement('canvas');
glowCanvas.width = 256;
glowCanvas.height = 256;
const gctx = glowCanvas.getContext('2d');
const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
grad.addColorStop(0, 'rgba(255,220,50,1)');
grad.addColorStop(0.2, 'rgba(255,180,20,0.6)');
grad.addColorStop(0.5, 'rgba(255,120,0,0.2)');
grad.addColorStop(1, 'rgba(255,120,0,0)');
gctx.fillStyle = grad;
gctx.fillRect(0, 0, 256, 256);
const glowTexture = new THREE.CanvasTexture(glowCanvas);
const glowMat = new THREE.SpriteMaterial({
  map: glowTexture,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const glow = new THREE.Sprite(glowMat);
glow.scale.set(180, 180, 1);
scene.add(glow);

const DEG2RAD = Math.PI / 180;
const PLANET_ORBITAL_DATA = {
  Mercury: { a0: 0.38709927, a_dot: 0.00000037, e0: 0.20563593, e_dot: 0.00001906, i0: 7.00497902, i_dot: -0.00594749, L0: 252.25032350, L_dot: 149472.67411175, lp0: 77.45779628, lp_dot: 0.16047689, o0: 48.33076593, o_dot: -0.12534081 },
  Venus:   { a0: 0.72333566, a_dot: 0.00000390, e0: 0.00677672, e_dot: -0.00004107, i0: 3.39467605, i_dot: -0.00078890, L0: 181.97909950, L_dot: 58517.81538729, lp0: 131.60246718, lp_dot: 0.00268329, o0: 76.67984255, o_dot: -0.27769418 },
  Earth:   { a0: 1.00000261, a_dot: 0.00000562, e0: 0.01671123, e_dot: -0.00004392, i0: -0.00001531, i_dot: -0.01294668, L0: 100.46457166, L_dot: 35999.37244981, lp0: 102.93768193, lp_dot: 0.32327364, o0: 0.0, o_dot: 0.0 },
  Mars:    { a0: 1.52371034, a_dot: 0.00001847, e0: 0.09339410, e_dot: 0.00007882, i0: 1.84969142, i_dot: -0.00813131, L0: -4.55343205, L_dot: 19140.30268499, lp0: -23.94362959, lp_dot: 0.44441088, o0: 49.55953891, o_dot: -0.29257343 },
  Jupiter: { a0: 5.20288700, a_dot: -0.00011607, e0: 0.04838624, e_dot: -0.00013253, i0: 1.30439695, i_dot: -0.00183714, L0: 34.39644051, L_dot: 3034.74612775, lp0: 14.72847983, lp_dot: 0.21252668, o0: 100.47390909, o_dot: 0.20469106 },
  Saturn:  { a0: 9.53667594, a_dot: -0.00125060, e0: 0.05386179, e_dot: -0.00050991, i0: 2.48599187, i_dot: 0.00193609, L0: 49.95424423, L_dot: 1222.49362201, lp0: 92.59887831, lp_dot: -0.41897216, o0: 113.66242448, o_dot: -0.28867794 },
  Uranus:  { a0: 19.18916464, a_dot: -0.00196176, e0: 0.04725744, e_dot: -0.00004397, i0: 0.77263783, i_dot: -0.00242939, L0: 313.23810451, L_dot: 428.48202785, lp0: 170.95427630, lp_dot: 0.40805281, o0: 74.01692503, o_dot: 0.04240589 },
  Neptune: { a0: 30.06992276, a_dot: 0.00026291, e0: 0.00859048, e_dot: 0.00005105, i0: 1.77004347, i_dot: 0.00035372, L0: -55.12002969, L_dot: 218.45945325, lp0: 44.96476227, lp_dot: -0.32241464, o0: 131.78422574, o_dot: -0.00508664 }
};

function getJulianCenturies(date) {
  const JD = date.getTime() / 86400000 + 2440587.5;
  return (JD - 2451545.0) / 36525;
}

function solveKepler(M, e) {
  let E = M;
  for (let i = 0; i < 100; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

function getPlanetEclipticPos(name, date) {
  const el = PLANET_ORBITAL_DATA[name];
  if (!el) return { x: 0, y: 0, z: 0 };
  const T = getJulianCenturies(date);
  const a = el.a0 + el.a_dot * T;
  const e = el.e0 + el.e_dot * T;
  const i_deg = el.i0 + el.i_dot * T;
  const L_deg = el.L0 + el.L_dot * T;
  const lp_deg = el.lp0 + el.lp_dot * T;
  const o_deg = el.o0 + el.o_dot * T;
  const i = i_deg * DEG2RAD;
  const w = ((lp_deg - o_deg) % 360) * DEG2RAD;
  const o = (o_deg % 360) * DEG2RAD;
  let M_deg = (L_deg - lp_deg) % 360;
  if (M_deg < 0) M_deg += 360;
  const M = M_deg * DEG2RAD;
  const E = solveKepler(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cosO = Math.cos(o); const sinO = Math.sin(o);
  const cosW = Math.cos(w); const sinW = Math.sin(w);
  const cosI = Math.cos(i); const sinI = Math.sin(i);
  return {
    x: (cosW * cosO - sinW * sinO * cosI) * xp + (-sinW * cosO - cosW * sinO * cosI) * yp,
    y: (cosW * sinO + sinW * cosO * cosI) * xp + (-sinW * sinO + cosW * cosO * cosI) * yp,
    z: (sinW * sinI) * xp + (cosW * sinI) * yp
  };
}

const planetsData = [
  {name:"Mercury", orbitRadius:90, size:4, color:0xb5b5b5, tilt:0.03, realMoonCount:0, orbitalPeriodDays:87.97},
  {name:"Venus",   orbitRadius:130, size:7, color:0xe8cda0, tilt:0.05, realMoonCount:0, orbitalPeriodDays:224.70},
  {name:"Earth",   orbitRadius:175, size:8, color:0x4fa3e0, tilt:0.41, realMoonCount:1, orbitalPeriodDays:365.25},
  {name:"Mars",    orbitRadius:220, size:6, color:0xc1440e, tilt:0.44, realMoonCount:2, orbitalPeriodDays:686.97},
  {name:"Jupiter", orbitRadius:340, size:22, color:0xc88b3a, tilt:0.05, realMoonCount:95, orbitalPeriodDays:4332.59},
  {name:"Saturn",  orbitRadius:400, size:18, color:0xe4d191, tilt:0.47, realMoonCount:146, orbitalPeriodDays:10759.22},
  {name:"Uranus",  orbitRadius:490, size:13, color:0x7de8e8, tilt:1.71, realMoonCount:28, orbitalPeriodDays:30688.50},
  {name:"Neptune", orbitRadius:580, size:12, color:0x3f54ba, tilt:0.49, realMoonCount:16, orbitalPeriodDays:60182.00}
];

const planets = planetsData.map(p => {
  const geo = new THREE.SphereGeometry(p.size, 32, 32);
  const mat = new THREE.MeshPhongMaterial({ color: p.color, shininess: 15 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = p.tilt;

  const pos = getPlanetEclipticPos(p.name, new Date());
  const initialAngle = Math.atan2(pos.y, pos.x);
  mesh.position.x = Math.cos(initialAngle) * p.orbitRadius;
  mesh.position.z = Math.sin(initialAngle) * p.orbitRadius;
  scene.add(mesh);

  const ringPoints = [];
  for (let j = 0; j <= 128; j++) {
    const t = (j / 128) * Math.PI * 2;
    ringPoints.push(Math.cos(t) * p.orbitRadius, 0, Math.sin(t) * p.orbitRadius);
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(ringPoints, 3));
  const ringMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.07
  });
  const ring = new THREE.LineLoop(ringGeo, ringMat);
  scene.add(ring);

  let saturnRing = null;
  if (p.name === 'Saturn') {
    const ringGeo2 = new THREE.RingGeometry(20, 38, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    saturnRing = new THREE.Mesh(ringGeo2, ringMat2);
    saturnRing.rotation.x = -Math.PI / 2.5;
    mesh.add(saturnRing);
  }

  const div = document.createElement('div');
  div.className = 'planet-label';
  div.textContent = p.name;
  const label = new THREE.CSS2DObject(div);
  label.position.set(0, p.size + 5, 0);
  mesh.add(label);

  return {
    ...p,
    angle: initialAngle,
    mesh,
    saturnRing,
    moons: []
  };
});

const moonData = {
  Earth: [{name:"Luna", orbitRadius:18, size:3, color:0xcccccc, speed:0.001}],
  Mars: [{name:"Phobos", orbitRadius:13, size:2, color:0xaaaaaa, speed:0.0018}, {name:"Deimos", orbitRadius:20, size:1.5, color:0x999999, speed:0.001}],
  Jupiter: [
    {name:"Metis",     orbitRadius:19, size:1.0, color:0x905030, speed:0.0028},
    {name:"Thebe",     orbitRadius:25, size:1.2, color:0x906040, speed:0.0022},
    {name:"Amalthea",  orbitRadius:22, size:1.5, color:0x884422, speed:0.0024},
    {name:"Io",        orbitRadius:30, size:3.5, color:0xe8c840, speed:0.0016},
    {name:"Europa",    orbitRadius:38, size:3.0, color:0xc8d4e0, speed:0.00128},
    {name:"Ganymede",  orbitRadius:48, size:4.2, color:0xa09080, speed:0.0009},
    {name:"Callisto",  orbitRadius:60, size:3.8, color:0x706050, speed:0.0006},
    {name:"Lysithea",  orbitRadius:84, size:0.9, color:0x807878, speed:0.0003},
    {name:"Elara",     orbitRadius:80, size:1.0, color:0x807878, speed:0.00034},
    {name:"Ananke",    orbitRadius:88, size:0.8, color:0x686060, speed:0.00028},
    {name:"Carme",     orbitRadius:93, size:1.0, color:0x706868, speed:0.00026},
    {name:"Pasiphae",  orbitRadius:90, size:1.0, color:0x787070, speed:0.00026},
    {name:"Sinope",    orbitRadius:97, size:0.9, color:0x706868, speed:0.00024},
    {name:"Himalia",   orbitRadius:72, size:1.2, color:0x888880, speed:0.0004}
  ],
  Saturn: [
    {name:"Prometheus", orbitRadius:17, size:0.8, color:0x989890, speed:0.0038},
    {name:"Pandora",    orbitRadius:17, size:0.8, color:0x909088, speed:0.00376},
    {name:"Janus",      orbitRadius:19, size:1.0, color:0xa8a8a0, speed:0.0034},
    {name:"Epimetheus", orbitRadius:19, size:0.9, color:0xa0a098, speed:0.00338},
    {name:"Mimas",      orbitRadius:22, size:1.5, color:0xb8b8b0, speed:0.0028},
    {name:"Enceladus",  orbitRadius:27, size:1.8, color:0xe8e8f0, speed:0.0022},
    {name:"Tethys",     orbitRadius:32, size:2.3, color:0xd0d0c8, speed:0.0017},
    {name:"Dione",      orbitRadius:38, size:2.4, color:0xc0c0b8, speed:0.00136},
    {name:"Rhea",       orbitRadius:45, size:2.8, color:0xc8c8c0, speed:0.0011},
    {name:"Titan",      orbitRadius:55, size:4.5, color:0xd4a050, speed:0.0008},
    {name:"Hyperion",   orbitRadius:62, size:1.4, color:0xa09070, speed:0.00066},
    {name:"Iapetus",    orbitRadius:80, size:2.6, color:0x908070, speed:0.0004},
    {name:"Phoebe",     orbitRadius:95, size:1.2, color:0x504840, speed:0.00028}
  ],
  Uranus: [
    {name:"Juliet",     orbitRadius:11, size:0.8, color:0x888880, speed:0.0042},
    {name:"Portia",     orbitRadius:12, size:0.9, color:0x909088, speed:0.004},
    {name:"Puck",       orbitRadius:13, size:1.0, color:0x888880, speed:0.0038},
    {name:"Miranda",    orbitRadius:16, size:1.5, color:0xa0a098, speed:0.0028},
    {name:"Ariel",      orbitRadius:23, size:2.2, color:0xb0b0a8, speed:0.0018},
    {name:"Umbriel",    orbitRadius:30, size:2.2, color:0x585858, speed:0.00136},
    {name:"Titania",    orbitRadius:38, size:2.8, color:0xb0c0c8, speed:0.001},
    {name:"Oberon",     orbitRadius:46, size:2.6, color:0x908888, speed:0.00076},
    {name:"Caliban",    orbitRadius:58, size:0.9, color:0x706868, speed:0.0005},
    {name:"Sycorax",    orbitRadius:68, size:1.0, color:0x786868, speed:0.00038}
  ],
  Neptune: [
    {name:"Despina",    orbitRadius:11, size:0.8, color:0x606060, speed:0.004},
    {name:"Galatea",    orbitRadius:13, size:0.9, color:0x686868, speed:0.0034},
    {name:"Larissa",    orbitRadius:16, size:1.0, color:0x707070, speed:0.0026},
    {name:"Proteus",    orbitRadius:20, size:1.5, color:0x787878, speed:0.0018},
    {name:"Triton",     orbitRadius:30, size:3.0, color:0xa0b8c8, speed:0.0009},
    {name:"Nereid",     orbitRadius:55, size:1.2, color:0x888880, speed:0.00036}
  ]
};

for (const p of planets) {
  const list = moonData[p.name];
  if (!list) continue;
  p.moons = list.map(m => {
    const geo = new THREE.SphereGeometry(m.size, 16, 16);
    const mat = new THREE.MeshPhongMaterial({ color: m.color });
    const moonMesh = new THREE.Mesh(geo, mat);
    moonMesh.visible = false;
    p.mesh.add(moonMesh);

    const pts = [];
    for (let j = 0; j <= 64; j++) {
      const t = (j / 64) * Math.PI * 2;
      pts.push(Math.cos(t) * m.orbitRadius, 0, Math.sin(t) * m.orbitRadius);
    }
    const oGeo = new THREE.BufferGeometry();
    oGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const oMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const orbitLine = new THREE.LineLoop(oGeo, oMat);
    orbitLine.visible = false;
    p.mesh.add(orbitLine);

    return {
      ...m,
      angle: Math.random() * Math.PI * 2,
      mesh: moonMesh,
      orbitLine
    };
  });
}



let showMoons = false;
document.getElementById('moonToggle').addEventListener('click', () => {
  showMoons = !showMoons;
  document.getElementById('moonToggle').textContent = showMoons ? '\u{1F319} Hide Moons' : '\u{1F319} Show Moons';
  for (const p of planets) {
    for (const m of p.moons) {
      m.mesh.visible = showMoons;
      m.orbitLine.visible = showMoons;
    }
  }
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9999, -9999);
let lastMouseX = 0, lastMouseY = 0;
let focusTarget = null;

function pointerMove(clientX, clientY) {
  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  lastMouseX = clientX;
  lastMouseY = clientY;
}

window.addEventListener('mousemove', (e) => pointerMove(e.clientX, e.clientY));
window.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) pointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

window.addEventListener('click', (e) => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
  if (intersects.length > 0) {
    const planet = planets.find(p => p.mesh === intersects[0].object);
    if (planet) focusTarget = planet;
  }
});

document.getElementById('resetCamera').addEventListener('click', () => {
  focusTarget = null;
  camera.position.set(0, 200, 900);
  controls.target.set(0, 0, 0);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  const timeNow = Date.now();
  const dt = Math.min(timeNow - lastFrameTime, 50);
  lastFrameTime = timeNow;

  const dtSeconds = dt / 1000;
  planets.forEach(p => {
    const pos = getPlanetEclipticPos(p.name, new Date());
    p.angle = Math.atan2(pos.y, pos.x);
    p.mesh.position.x = Math.cos(p.angle) * p.orbitRadius;
    p.mesh.position.z = -Math.sin(p.angle) * p.orbitRadius;
  });

  if (!isPaused) {
    for (const p of planets) {
      p.mesh.rotation.y += 0.002 * (dt / 16.667);
      for (const m of p.moons) {
        m.angle += m.speed * (dt / 16.667);
        m.mesh.position.x = Math.cos(m.angle) * m.orbitRadius;
        m.mesh.position.z = Math.sin(m.angle) * m.orbitRadius;
      }
    }
    sun.rotation.y += 0.002 * (dt / 16.667);
  }

  const now = new Date();
  document.getElementById('dateDisplay').innerHTML = `
    <div style="font-size:15px;font-weight:500">\u{1F550} ${now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true})}</div>
    <div style="font-size:11px;opacity:0.7;margin-top:3px">${now.toLocaleDateString('en-US', {weekday:'short', month:'long', day:'numeric', year:'numeric'})}</div>
  `;

  raycaster.setFromCamera(mouse, camera);
  const planetMeshes = planets.map(p => p.mesh);
  const intersects = raycaster.intersectObjects(planetMeshes);
  const tooltip = document.getElementById('tooltip');
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const planet = planets.find(p => p.mesh === hit);
    if (planet) {
      tooltip.style.display = 'block';
      tooltip.style.left = (lastMouseX + 16) + 'px';
      tooltip.style.top = (lastMouseY - 50) + 'px';
      const moonCount = planet.moons.length;
      const moonText = moonCount === 0 ? 'No moons' : (moonCount === planet.realMoonCount ? moonCount + ' moon' + (moonCount !== 1 ? 's' : '') : moonCount + ' of ' + planet.realMoonCount + ' moons shown');
      tooltip.innerHTML = '<b>' + planet.name + '</b><br>' + moonText + '<br>Orbit: ' + planet.orbitRadius + ' units';
      planets.forEach(p => p.mesh.material.emissive.set(0x000000));
      hit.material.emissive.set(new THREE.Color(planet.color).multiplyScalar(0.3));
    }
  } else {
    tooltip.style.display = 'none';
    planets.forEach(p => p.mesh.material.emissive.set(0x000000));
  }

  if (focusTarget) {
    const worldPos = new THREE.Vector3();
    focusTarget.mesh.getWorldPosition(worldPos);
    const targetPos = worldPos.clone().add(new THREE.Vector3(0, focusTarget.size * 3, focusTarget.size * 8));
    camera.position.lerp(targetPos, 0.05);
    controls.target.lerp(worldPos, 0.05);
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

document.getElementById('pauseBtn').addEventListener('click', () => {
  isPaused = !isPaused;
  const btn = document.getElementById('pauseBtn');
  const banner = document.getElementById('pausedBanner');
  if (isPaused) {
    btn.textContent = '\u25B6 Resume';
    btn.style.background = 'rgba(255, 165, 0, 0.25)';
    btn.style.borderColor = 'rgba(255, 165, 0, 0.6)';
    if (banner) banner.style.display = 'block';
  } else {
    btn.textContent = '\u23F8 Pause';
    btn.style.background = 'rgba(255,255,255,0.12)';
    btn.style.borderColor = 'rgba(255,255,255,0.3)';
    if (banner) banner.style.display = 'none';
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    document.getElementById('pauseBtn').click();
  }
});

animate();
