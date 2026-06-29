"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { bodyMetrics, type ShopGender, type ShopSize } from "@/lib/shop";

/**
 * Placeholder 3D jersey viewer — vanilla Three.js (NO @react-three/fiber, which
 * crashes under Next 15's React-19 client runtime). A stylised human figure,
 * built with LatheGeometry for a natural torso/limb silhouette and scaled by
 * wearer height + gender, wears a jersey whose chest girth and length come from
 * the selected size — so the drape loosens/tightens as size or body changes.
 *
 * SWAPPING IN A REAL MODEL: replace buildFigure() with a GLTFLoader load and
 * morph/scale the mesh by the same props — renderer, lights, controls stay.
 */

const COLOR = {
  skin: 0xcdb8f0,
  skinDark: 0xb49ee0,
  hair: 0x1a1320,
  jersey: 0x1c1428,
  jerseyTrim: 0xa855f7,
  glow: 0xc77dff,
  short: 0x161019,
};

const CM = 0.01;
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

function makeBackTexture(name: string, number: string): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 512, 512);
  ctx.textAlign = "center";
  // name — auto-fit width
  const cleanName = (name || "").toUpperCase().slice(0, 18);
  if (cleanName) {
    let fs = 72;
    ctx.font = `bold ${fs}px Arial, sans-serif`;
    while (ctx.measureText(cleanName).width > 470 && fs > 28) {
      fs -= 4;
      ctx.font = `bold ${fs}px Arial, sans-serif`;
    }
    ctx.fillStyle = "#ECE7F2";
    ctx.fillText(cleanName, 256, 150);
  }
  const cleanNumber = (number || "").replace(/[^0-9]/g, "").slice(0, 2);
  if (cleanNumber) {
    ctx.fillStyle = "#C77DFF";
    ctx.font = "bold 300px Arial, sans-serif";
    ctx.fillText(cleanNumber, 256, 410);
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

/** Revolve a profile (array of [radius, y] in metres) into a smooth solid. */
function lathe(points: [number, number][], segments = 40): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(Math.max(0.0008, r), y)),
    segments
  );
}

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
  const legLen = 0.47 * H;
  const torsoLen = 0.31 * H;
  const neckLen = 0.05 * H;
  const headR = 0.072 * H;

  const hipY = legLen;
  const shoulderY = legLen + torsoLen;
  const neckTopY = shoulderY + neckLen;
  const headCenterY = neckTopY + headR * 0.92;

  const chestR = circToRadius(m.chest);
  const waistR = chestR * (gender === "female" ? 0.74 : 0.82);
  const hipBodyR = Math.max(circToRadius(m.hip * 2.2), waistR * (gender === "female" ? 1.06 : 0.96));
  const shoulderHalf = m.shoulder * 0.5 * CM;
  const shoulderR = 0.06 * H;
  const armR = 0.045 * H;
  const legR = 0.072 * H;

  const skinMat = track(new THREE.MeshStandardMaterial({ color: COLOR.skin, roughness: 0.62, metalness: 0.04 }));
  const skinDarkMat = track(new THREE.MeshStandardMaterial({ color: COLOR.skinDark, roughness: 0.68, metalness: 0.03 }));
  const hairMat = track(new THREE.MeshStandardMaterial({ color: COLOR.hair, roughness: 0.85, metalness: 0.05 }));
  const shortMat = track(new THREE.MeshStandardMaterial({ color: COLOR.short, roughness: 0.8, metalness: 0.05 }));
  const jerseyMat = track(new THREE.MeshStandardMaterial({ color: COLOR.jersey, roughness: 0.5, metalness: 0.16 }));
  const trimMat = track(
    new THREE.MeshStandardMaterial({
      color: COLOR.jerseyTrim,
      emissive: new THREE.Color(COLOR.jerseyTrim),
      emissiveIntensity: 0.32,
      roughness: 0.4,
      metalness: 0.2,
    })
  );

  const group = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, cast = true) => {
    track(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = cast;
    group.add(mesh);
    return mesh;
  };

  /* ── head + neck + hair ── */
  const head = add(new THREE.SphereGeometry(headR, 28, 28), skinMat);
  head.position.y = headCenterY;
  head.scale.set(0.92, 1.12, 0.96);
  const hair = add(new THREE.SphereGeometry(headR * 1.02, 24, 24), hairMat);
  hair.position.set(0, headCenterY + headR * 0.18, -headR * 0.05);
  hair.scale.set(0.96, 1.05, 1);
  const neck = add(new THREE.CylinderGeometry(headR * 0.5, headR * 0.62, neckLen * 1.4, 18), skinDarkMat);
  neck.position.y = shoulderY + neckLen * 0.55;

  /* ── torso (lathe profile, hip → shoulder) ── */
  const torso = add(
    lathe([
      [hipBodyR * 0.55, hipY - 0.01],
      [hipBodyR * 0.98, hipY + torsoLen * 0.06],
      [hipBodyR, hipY + torsoLen * 0.16],
      [waistR, hipY + torsoLen * 0.44],
      [chestR * 0.99, hipY + torsoLen * 0.74],
      [chestR * 0.9, shoulderY - torsoLen * 0.02],
      [chestR * 0.6, shoulderY + 0.005],
    ]),
    skinMat
  );
  torso.position.y = 0;

  /* ── shoulders + arms ── */
  for (const s of [-1, 1]) {
    const sh = add(new THREE.SphereGeometry(shoulderR, 20, 20), skinMat);
    sh.position.set(s * shoulderHalf, shoulderY - shoulderR * 0.35, 0);
    sh.scale.set(1, 0.9, 1);

    // jersey shoulder cap — dark fabric over the bare shoulder so it reads as clothed
    const cap = add(new THREE.SphereGeometry(shoulderR * 1.16, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), jerseyMat);
    cap.position.set(s * shoulderHalf, shoulderY - shoulderR * 0.2, 0);
    cap.scale.set(1.05, 1, 1.05);

    const armLen = torsoLen * 1.06;
    const arm = add(
      lathe([
        [armR * 1.05, 0],
        [armR, -armLen * 0.42],
        [armR * 0.82, -armLen * 0.55],
        [armR * 0.88, -armLen * 0.9],
        [armR * 0.74, -armLen],
      ]),
      skinDarkMat
    );
    arm.position.set(s * (shoulderHalf + shoulderR * 0.1), shoulderY - shoulderR * 0.45, 0);
    arm.rotation.z = s * 0.1;
    // hand
    const hand = add(new THREE.SphereGeometry(armR * 0.95, 14, 14), skinMat);
    hand.position.set(s * (shoulderHalf + shoulderR * 0.1 + armLen * 0.1), shoulderY - shoulderR * 0.45 - armLen, 0);
    hand.scale.set(0.82, 1.12, 0.62);
  }

  /* ── hips shorts + legs ── */
  const pelvis = add(
    lathe([
      [hipBodyR * 0.6, hipY + 0.005],
      [hipBodyR * 1.02, hipY - torsoLen * 0.04],
      [hipBodyR, hipY - torsoLen * 0.14],
      [hipBodyR * 0.7, hipY - torsoLen * 0.2],
    ]),
    shortMat
  );
  pelvis.position.y = 0;

  for (const s of [-1, 1]) {
    const legTopY = hipY - torsoLen * 0.16;
    const thigh = add(
      lathe([
        [legR * 1.04, 0],
        [legR * 0.92, -legLen * 0.45],
        [legR * 0.7, -legLen * 0.52],
        [legR * 0.72, -legLen * 0.92],
        [legR * 0.5, -legLen],
      ]),
      skinDarkMat
    );
    thigh.position.set(s * hipBodyR * 0.5, legTopY, 0);
    // foot
    const foot = add(new THREE.BoxGeometry(legR * 1.1, legR * 0.7, legR * 2.2), skinMat);
    foot.position.set(s * hipBodyR * 0.5, legTopY - legLen + legR * 0.2, legR * 0.5);
  }

  /* ── jersey (lathe, follows torso but looser/longer per size) ── */
  const garmentR = Math.max(chestR * 1.06, circToRadius(size.chest));
  const garmentWaistR = Math.max(waistR * 1.08, garmentR * 0.9);
  const garmentHipR = Math.max(hipBodyR * 1.05, garmentR * 0.94);
  const jerseyLen = size.length * CM;
  const collarY = shoulderY + 0.01;
  const hemY = collarY - jerseyLen;

  const jersey = add(
    lathe([
      [garmentHipR * 0.86, hemY - 0.005],
      [garmentHipR, hemY + 0.012],
      [garmentHipR * 0.99, hemY + jerseyLen * 0.22],
      [garmentWaistR, hemY + jerseyLen * 0.52],
      [garmentR, hemY + jerseyLen * 0.82],
      [garmentR * 0.9, collarY - 0.01],
      [garmentR * 0.58, collarY],
    ]),
    jerseyMat
  );
  jersey.position.y = 0;

  // collar + hem trims
  const collar = add(new THREE.TorusGeometry(garmentR * 0.6, garmentR * 0.05, 12, 28), trimMat, false);
  collar.position.y = collarY - 0.005;
  collar.rotation.x = Math.PI / 2;
  const hem = add(new THREE.CylinderGeometry(garmentHipR * 1.005, garmentHipR * 1.005, jerseyLen * 0.03, 40), trimMat, false);
  hem.position.y = hemY + jerseyLen * 0.04;

  // short sleeves over the shoulders
  for (const s of [-1, 1]) {
    const sleeveLen = size.sleeve * CM;
    const sleeve = add(
      new THREE.CylinderGeometry(armR * 0.95, garmentR * 0.52, sleeveLen, 22, 1, true),
      jerseyMat
    );
    sleeve.position.set(s * (shoulderHalf + sleeveLen * 0.32), shoulderY - sleeveLen * 0.28, 0);
    sleeve.rotation.z = s * (Math.PI / 2 - 0.42);
  }

  // chest logo placeholder (emissive panel)
  const logo = add(new THREE.BoxGeometry(garmentR * 0.5, jerseyLen * 0.14, 0.004), trimMat, false);
  logo.position.set(0, collarY - jerseyLen * 0.3, garmentR * 0.95);

  // back name + number
  const backTex = makeBackTexture(jerseyName, jerseyNumber);
  if (backTex) {
    track(backTex);
    const backMat = track(new THREE.MeshStandardMaterial({ map: backTex, transparent: true, roughness: 0.6, metalness: 0.05 }));
    const back = new THREE.Mesh(track(new THREE.PlaneGeometry(garmentR * 1.5, jerseyLen * 0.66)), backMat);
    back.position.set(0, collarY - jerseyLen * 0.42, -garmentR * 1.0);
    back.rotation.y = Math.PI;
    group.add(back);
  }

  /* ── ground: shadow catcher + glow ring ── */
  const shadowCatcher = new THREE.Mesh(
    track(new THREE.CircleGeometry(H * 0.7, 48)),
    track(new THREE.ShadowMaterial({ transparent: true, opacity: 0.34 }))
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = hipY - torsoLen * 0.16 - legLen + 0.001;
  shadowCatcher.receiveShadow = true;
  group.add(shadowCatcher);

  const ring = new THREE.Mesh(
    track(new THREE.RingGeometry(H * 0.5, H * 0.55, 64)),
    track(new THREE.MeshBasicMaterial({ color: COLOR.jerseyTrim, transparent: true, opacity: 0.22, side: THREE.DoubleSide }))
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = shadowCatcher.position.y + 0.001;
  group.add(ring);

  // recentre so feet sit near y=0 of the group
  const feetY = hipY - torsoLen * 0.16 - legLen;
  group.position.y = -feetY - H * 0.02;

  return {
    group,
    targetY: H * 0.5,
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
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1, 3);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.85;
    controls.minPolarAngle = Math.PI * 0.34;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.autoRotateSpeed = 1.0;

    const hemi = new THREE.HemisphereLight(0xd9c9ff, 0x140f1c, 0.8);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new THREE.DirectionalLight(COLOR.glow, 1.15);
    rim.position.set(-4, 3, -5);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xb9a6ec, 0.5);
    fill.position.set(-2, 1.5, 4);
    scene.add(fill);

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
    core.camera.position.set(0, H * 0.52, H * 1.65);
    core.controls.target.set(0, figure.targetY, 0);
    core.controls.update();
  }, [gender, heightCm, size, jerseyName, jerseyNumber]);

  return <div ref={mountRef} className={className} />;
}
