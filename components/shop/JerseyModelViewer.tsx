"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { bodyMetrics, type ShopGender, type ShopSize } from "@/lib/shop";

/**
 * Placeholder 3D jersey viewer — vanilla Three.js (NO @react-three/fiber).
 *
 * Why vanilla: Next 15's App Router runs a React 19 client runtime, while the
 * project is pinned to React 18. @react-three/fiber's react-reconciler reads
 * React-18 internals that React 19 removed (ReactCurrentBatchConfig), which
 * crashes in production. Three.js itself has no React coupling, so driving the
 * scene imperatively in an effect is bullet-proof here.
 *
 * A procedural mannequin (scaled by wearer height + gender) wears a jersey whose
 * chest girth and length come straight from the selected size's measurements, so
 * the drape visibly loosens/tightens as the buyer changes size or body. The
 * whole figure orbits 360°.
 *
 * SWAPPING IN A REAL MODEL: replace buildFigure() with a GLTFLoader load
 * (`new GLTFLoader().load(url, ...)`) and morph/scale the loaded mesh by the same
 * props — the renderer, lights, controls and UI stay untouched.
 */

const COLOR = {
  body: 0x3a2e50,
  bodyDark: 0x2a2138,
  skin: 0xc9b4f6,
  jersey: 0x1c1428,
  jerseyTrim: 0xa855f7,
  glow: 0xc77dff,
};

const CM = 0.01; // cm → world units (metres)
const circToRadius = (circCm: number) => (circCm * CM) / (2 * Math.PI);

interface ViewerProps {
  gender: ShopGender;
  heightCm: number;
  size: ShopSize;
  jerseyName: string;
  jerseyNumber: string;
  autoRotate?: boolean;
  className?: string;
}

/** Back-panel name + number drawn on a canvas — no font asset required. */
function makeBackTexture(name: string, number: string): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#1C1428";
  ctx.fillRect(0, 0, 512, 512);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ECE7F2";
  ctx.font = "bold 76px Arial, sans-serif";
  const cleanName = (name || "").toUpperCase().slice(0, 12);
  if (cleanName) ctx.fillText(cleanName, 256, 150);
  const cleanNumber = (number || "").replace(/[^0-9]/g, "").slice(0, 2);
  if (cleanNumber) {
    ctx.fillStyle = "#C77DFF";
    ctx.font = "bold 300px Arial, sans-serif";
    ctx.fillText(cleanNumber, 256, 400);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

interface BuiltFigure {
  group: THREE.Group;
  targetY: number;
  dispose: () => void;
}

/** Build the mannequin + jersey + ground as one disposable group. */
function buildFigure(
  gender: ShopGender,
  heightCm: number,
  size: ShopSize,
  jerseyName: string,
  jerseyNumber: string
): BuiltFigure {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T): T => {
    disposables.push(o);
    return o;
  };

  const m = bodyMetrics(heightCm, gender);
  const H = heightCm * CM;
  const legLen = 0.46 * H;
  const torsoLen = 0.3 * H;
  const neckLen = 0.045 * H;
  const headR = 0.066 * H;
  const hipR = circToRadius(m.hip * 2.4);
  const chestR = circToRadius(m.chest);
  const shoulderHalf = m.shoulder * 0.5 * CM;
  const armR = 0.052 * H;
  const legR = 0.07 * H;

  const hipY = legLen;
  const shoulderY = legLen + torsoLen;
  const headCenterY = shoulderY + neckLen + headR;

  const bodyMat = track(new THREE.MeshStandardMaterial({ color: COLOR.body, roughness: 0.85, metalness: 0.05 }));
  const limbMat = track(new THREE.MeshStandardMaterial({ color: COLOR.bodyDark, roughness: 0.9, metalness: 0.04 }));
  const skinMat = track(new THREE.MeshStandardMaterial({ color: COLOR.skin, roughness: 0.6, metalness: 0.05 }));
  const jerseyMat = track(new THREE.MeshStandardMaterial({ color: COLOR.jersey, roughness: 0.55, metalness: 0.15 }));
  const trimMat = track(
    new THREE.MeshStandardMaterial({
      color: COLOR.jerseyTrim,
      emissive: new THREE.Color(COLOR.jerseyTrim),
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.2,
    })
  );

  const group = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], cast = true) => {
    track(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = cast;
    group.add(mesh);
    return mesh;
  };

  /* ── mannequin ── */
  add(new THREE.SphereGeometry(headR, 24, 24), skinMat, [0, headCenterY, 0]);
  add(new THREE.CylinderGeometry(headR * 0.45, headR * 0.5, neckLen, 16), skinMat, [0, shoulderY + neckLen * 0.5, 0]);
  add(new THREE.CylinderGeometry(chestR, hipR, torsoLen, 28), bodyMat, [0, hipY + torsoLen * 0.5, 0]);
  for (const s of [-1, 1]) {
    const arm = add(
      new THREE.CapsuleGeometry(armR, torsoLen * 0.9, 6, 14),
      limbMat,
      [s * (shoulderHalf + armR * 0.2), shoulderY - torsoLen * 0.42, 0]
    );
    arm.castShadow = true;
  }
  for (const s of [-1, 1]) {
    add(new THREE.CapsuleGeometry(legR, legLen * 0.82, 6, 14), limbMat, [s * hipR * 0.5, legLen * 0.5, 0]);
  }

  /* ── jersey ── */
  const bodyChestR = chestR;
  const jerseyR = Math.max(bodyChestR * 1.04, circToRadius(size.chest));
  const jerseyLen = size.length * CM;
  const garmentShoulderHalf = Math.max(m.shoulder, size.shoulder) * 0.5 * CM;
  const sleeveLen = size.sleeve * CM;
  const topY = shoulderY;
  const centerY = topY - jerseyLen * 0.5;

  add(new THREE.CylinderGeometry(jerseyR * 0.84, jerseyR, jerseyLen, 30, 1, false), jerseyMat, [0, centerY, 0]);
  add(new THREE.CylinderGeometry(jerseyR * 0.84, jerseyR * 0.86, jerseyLen * 0.05, 30), trimMat, [0, topY, 0]);
  add(
    new THREE.CylinderGeometry(jerseyR, jerseyR, jerseyLen * 0.04, 30),
    trimMat,
    [0, centerY - jerseyLen * 0.5, 0],
    false
  );
  for (const s of [-1, 1]) {
    const sleeve = new THREE.Mesh(
      track(new THREE.CylinderGeometry(size.sleeve * 0.42 * CM, jerseyR * 0.5, sleeveLen, 18, 1, true)),
      jerseyMat
    );
    sleeve.position.set(s * (garmentShoulderHalf + sleeveLen * 0.35), topY - sleeveLen * 0.35, 0);
    sleeve.rotation.z = s * 0.5;
    sleeve.castShadow = true;
    group.add(sleeve);
  }
  // chest logo placeholder
  add(new THREE.BoxGeometry(jerseyR * 0.5, jerseyLen * 0.16, 0.004), trimMat, [0, topY - jerseyLen * 0.32, jerseyR * 0.86], false);

  // back name + number panel
  const backTex = makeBackTexture(jerseyName, jerseyNumber);
  if (backTex) {
    track(backTex);
    const backMat = track(new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.6, metalness: 0.05, transparent: true }));
    const back = new THREE.Mesh(track(new THREE.PlaneGeometry(jerseyR * 1.2, jerseyLen * 0.72)), backMat);
    back.position.set(0, topY - jerseyLen * 0.42, -jerseyR * 0.9);
    back.rotation.y = Math.PI;
    group.add(back);
  }

  /* ── ground: shadow catcher + glow ring ── */
  const shadowCatcher = new THREE.Mesh(
    track(new THREE.CircleGeometry(H * 0.7, 48)),
    track(new THREE.ShadowMaterial({ transparent: true, opacity: 0.35 }))
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.receiveShadow = true;
  group.add(shadowCatcher);

  const ring = new THREE.Mesh(
    track(new THREE.RingGeometry(H * 0.55, H * 0.6, 64)),
    track(new THREE.MeshBasicMaterial({ color: COLOR.jerseyTrim, transparent: true, opacity: 0.25, side: THREE.DoubleSide }))
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.001;
  group.add(ring);

  group.position.y = -H * 0.06;

  return {
    group,
    targetY: H * 0.52,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

export default function JerseyModelViewer({
  gender,
  heightCm,
  size,
  jerseyName,
  jerseyNumber,
  autoRotate = true,
  className,
}: ViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    raf: number;
    figure: BuiltFigure | null;
    ro: ResizeObserver;
  } | null>(null);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  // mount: renderer / scene / camera / controls / lights / loop
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "pan-y";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 1, 3);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.85;
    controls.minPolarAngle = Math.PI * 0.32;
    controls.maxPolarAngle = Math.PI * 0.6;
    controls.autoRotateSpeed = 1.1;

    // lights
    const ambient = new THREE.AmbientLight(0xb8a6e8, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -1;
    scene.add(key);
    const rim = new THREE.DirectionalLight(COLOR.glow, 1.1);
    rim.position.set(-4, 3, -5);
    scene.add(rim);
    const point = new THREE.PointLight(COLOR.jerseyTrim, 6, 9);
    point.position.set(0, 1, 3);
    scene.add(point);

    const renderLoop = () => {
      controls.autoRotate = autoRotateRef.current;
      controls.update();
      renderer.render(scene, camera);
      core.raf = requestAnimationFrame(renderLoop);
    };

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    const core = { renderer, scene, camera, controls, raf: 0, figure: null as BuiltFigure | null, ro };
    coreRef.current = core;
    core.raf = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(core.raf);
      ro.disconnect();
      controls.dispose();
      if (core.figure) {
        scene.remove(core.figure.group);
        core.figure.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      coreRef.current = null;
    };
  }, []);

  // rebuild the figure whenever the configuration changes
  useEffect(() => {
    const core = coreRef.current;
    if (!core) return;

    if (core.figure) {
      core.scene.remove(core.figure.group);
      core.figure.dispose();
    }

    const figure = buildFigure(gender, heightCm, size, jerseyName, jerseyNumber);
    core.scene.add(figure.group);
    core.figure = figure;

    const H = heightCm * CM;
    core.camera.position.set(0, H * 0.55, H * 1.7);
    core.controls.target.set(0, figure.targetY, 0);
    core.controls.update();
  }, [gender, heightCm, size, jerseyName, jerseyNumber]);

  return <div ref={mountRef} className={className} />;
}
