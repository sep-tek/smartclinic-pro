import * as THREE from "three";

const PALETTE_CYCLE_SECONDS = 36;

export function createEnergyCoreScene(container, options = {}) {
  const reducedMotion = Boolean(options.reducedMotion);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 7.2;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const master = new THREE.Group();
  scene.add(master);

  const isCompact = container.clientWidth < 640;

  // Central energy core
  const coreUniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color("#7fa99f") },
    uColorB: { value: new THREE.Color("#6ea8fe") },
  };

  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 2.2);
        float flow = 0.5 + 0.5 * sin(vNormal.y * 6.0 + uTime * 1.4);
        vec3 base = mix(uColorA, uColorB, flow * 0.5 + fresnel * 0.5);
        float brightness = 0.45 + fresnel * 1.05;
        gl_FragColor = vec4(base * brightness, 0.85 + fresnel * 0.15);
      }
    `,
  });

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 48, 48),
    coreMaterial
  );
  master.add(core);

  const glowTexture = makeRadialTexture();
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: new THREE.Color("#7fa99f"),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.setScalar(5.2);
  master.add(glow);

  const baseOrbits = [
    { radius: 2.0, tilt: 0.35, speed: 0.35, dir: 1, opacity: 0.8, size: 0.09, particles: 14 },
    { radius: 2.5, tilt: -0.55, speed: 0.22, dir: -1, opacity: 0.55, size: 0.07, particles: 10 },
    { radius: 3.0, tilt: 0.95, speed: 0.16, dir: 1, opacity: 0.35, size: 0.06, particles: 8 },
    { radius: 1.6, tilt: 1.25, speed: 0.5, dir: -1, opacity: 0.6, size: 0.05, particles: 6 },
  ];

  const orbits = [];

  baseOrbits.forEach((base, index) => {
    const config = {
      ...base,
      particles: isCompact
        ? Math.max(3, Math.ceil(base.particles / 2))
        : base.particles,
    };

    const group = new THREE.Group();
    group.rotation.x = config.tilt;
    group.rotation.y = index * 0.7;
    master.add(group);

    const ringGeometry = new THREE.TorusGeometry(
      config.radius,
      0.012,
      8,
      160
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x7fa99f,
      transparent: true,
      opacity: config.opacity,
    });
    group.add(new THREE.Mesh(ringGeometry, ringMaterial));

    const particlePositions = new Float32Array(config.particles * 3);
    const particlePhases = [];
    for (let i = 0; i < config.particles; i += 1) {
      particlePhases.push((i / config.particles) * Math.PI * 2);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x6ea8fe,
      size: config.size,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(
      new THREE.Points(particleGeometry, particleMaterial)
    );

    orbits.push({
      group,
      ringMaterial,
      particleMaterial,
      particlePositions,
      particlePhases,
      particleGeometry,
      config,
      index,
    });
  });

  const pulses = [];
  for (let i = 0; i < 2; i += 1) {
    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1.0, 64),
      new THREE.MeshBasicMaterial({
        color: 0x7fa99f,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    pulse.rotation.x = Math.PI / 2;
    master.add(pulse);
    pulses.push({ mesh: pulse, offset: i * 2.6 });
  }

  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };

  function handleMouseMove(event) {
    const rect = container.getBoundingClientRect();
    pointerTarget.x =
      ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerTarget.y =
      ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  container.addEventListener("mousemove", handleMouseMove);

  function handleResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", handleResize);

  let rafId = null;
  let visible = true;

  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
    },
    { threshold: 0.05 }
  );
  observer.observe(container);

  const clock = new THREE.Clock();
  const color = new THREE.Color();

  function renderFrame(elapsed) {
    const t = elapsed;

    // Deterministic palette sweep: smooth triangle wave through
    // teal/cyan/blue/violet/magenta over PALETTE_CYCLE_SECONDS.
    const phase = (t % PALETTE_CYCLE_SECONDS) / PALETTE_CYCLE_SECONDS;
    const triangle = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    const baseHue = 0.3 + triangle * 0.55;

    color.setHSL(baseHue, 0.55, 0.6);
    coreUniforms.uColorA.value.copy(color);
    glowMaterial.color.copy(color);

    color.setHSL((baseHue + 0.12) % 1, 0.6, 0.65);
    coreUniforms.uColorB.value.copy(color);

    orbits.forEach((orbit) => {
      const offset = orbit.index * 0.08;
      color.setHSL((baseHue + offset) % 1, 0.6, 0.62);
      orbit.ringMaterial.color.copy(color);
      orbit.particleMaterial.color.copy(color);

      orbit.group.rotation.z += 0.003 * orbit.config.speed * orbit.config.dir;
      orbit.group.rotation.y += 0.002 * orbit.config.speed * orbit.config.dir;

      for (let i = 0; i < orbit.particlePhases.length; i += 1) {
        const angle =
          orbit.particlePhases[i] +
          t * orbit.config.speed * orbit.config.dir * 1.6;
        orbit.particlePositions[i * 3] =
          Math.cos(angle) * orbit.config.radius;
        orbit.particlePositions[i * 3 + 1] =
          Math.sin(angle) * orbit.config.radius;
        orbit.particlePositions[i * 3 + 2] = 0;
      }
      orbit.particleGeometry.attributes.position.needsUpdate = true;
    });

    pulses.forEach((pulse) => {
      const cycle = ((t + pulse.offset) % 5.2) / 5.2;
      pulse.mesh.scale.setScalar(1 + cycle * 2.4);
      pulse.mesh.material.opacity = Math.max(0, 0.35 * (1 - cycle));
      color.setHSL((baseHue + 0.06) % 1, 0.55, 0.6);
      pulse.mesh.material.color.copy(color);
    });

    core.scale.setScalar(1 + 0.06 * Math.sin(t * 2.1));
    coreUniforms.uTime.value = t;
    glow.material.opacity = 0.45 + 0.16 * Math.sin(t * 1.7);

    pointer.x += (pointerTarget.x - pointer.x) * 0.05;
    pointer.y += (pointerTarget.y - pointer.y) * 0.05;
    master.rotation.y = pointer.x * 0.28;
    master.rotation.x = pointer.y * 0.18;

    renderer.render(scene, camera);
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (!visible) return;
    renderFrame(clock.getElapsedTime());
  }

  if (reducedMotion) {
    master.rotation.set(0.18, 0.35, 0);
    coreUniforms.uTime.value = 2.4;
    const phase = (2.4 % PALETTE_CYCLE_SECONDS) / PALETTE_CYCLE_SECONDS;
    const triangle = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    const baseHue = 0.3 + triangle * 0.55;
    color.setHSL(baseHue, 0.55, 0.6);
    coreUniforms.uColorA.value.copy(color);
    glowMaterial.color.copy(color);
    color.setHSL((baseHue + 0.12) % 1, 0.6, 0.65);
    coreUniforms.uColorB.value.copy(color);
    orbits.forEach((orbit) => {
      color.setHSL((baseHue + orbit.index * 0.08) % 1, 0.6, 0.62);
      orbit.ringMaterial.color.copy(color);
      orbit.particleMaterial.color.copy(color);
    });
    renderer.render(scene, camera);
  } else {
    animate();
  }

  return function dispose() {
    if (rafId) cancelAnimationFrame(rafId);
    observer.disconnect();
    window.removeEventListener("resize", handleResize);
    container.removeEventListener("mousemove", handleMouseMove);

    orbits.forEach((orbit) => {
      orbit.particleGeometry.dispose();
      orbit.particleMaterial.dispose();
      orbit.ringMaterial.dispose();
    });
    pulses.forEach((pulse) => {
      pulse.mesh.geometry.dispose();
      pulse.mesh.material.dispose();
    });
    coreMaterial.dispose();
    glowMaterial.dispose();
    glowTexture.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };
}

function makeRadialTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
