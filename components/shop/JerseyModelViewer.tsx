"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import { bodyMetrics, type ShopGender, type ShopSize } from "@/lib/shop";

/**
 * Placeholder 3D jersey viewer. A procedural mannequin (built from primitives,
 * scaled by wearer height + gender) wears a jersey whose chest girth and length
 * come straight from the selected size's measurements — so the drape visibly
 * loosens/tightens as the buyer changes size or body. The whole figure orbits
 * 360°.
 *
 * SWAPPING IN A REAL MODEL: drop a `.glb` in /public and replace <Mannequin/> +
 * <Jersey/> with a `useLoader(GLTFLoader, url)` scene. Keep the same props
 * (gender, heightCm, size, name, number) and morph/scale the loaded mesh — the
 * surrounding Canvas, lighting, controls and UI stay untouched.
 */

// Premium Violet Void palette (three needs literal colours, not Tailwind tokens).
const COLOR = {
  body: "#3A2E50",
  bodyDark: "#2A2138",
  skin: "#C9B4F6",
  jersey: "#1C1428",
  jerseyTrim: "#A855F7",
  glow: "#C77DFF",
  text: "#ECE7F2",
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

/* ── orbit controls (imperative — avoids JSX intrinsic typing for <orbitControls/>) ── */
function Controls({ autoRotate, targetY }: { autoRotate: boolean; targetY: number }) {
  const { camera, gl } = useThree();
  const ref = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.85;
    controls.minPolarAngle = Math.PI * 0.32;
    controls.maxPolarAngle = Math.PI * 0.6;
    controls.target.set(0, targetY, 0);
    controls.update();
    ref.current = controls;
    return () => controls.dispose();
  }, [camera, gl, targetY]);

  useEffect(() => {
    if (ref.current) ref.current.autoRotate = autoRotate;
  }, [autoRotate]);
  useEffect(() => {
    if (ref.current) ref.current.autoRotateSpeed = 1.1;
  }, []);

  useFrame(() => ref.current?.update());
  return null;
}

/** Builds a back-panel texture (name + number) on a canvas — no font asset needed. */
function useBackTexture(name: string, number: string) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = COLOR.jersey;
    ctx.fillRect(0, 0, 512, 512);
    ctx.textAlign = "center";
    ctx.fillStyle = COLOR.text;
    ctx.font = "bold 76px Arial, sans-serif";
    const cleanName = (name || "").toUpperCase().slice(0, 12);
    if (cleanName) ctx.fillText(cleanName, 256, 150);
    const cleanNumber = (number || "").replace(/[^0-9]/g, "").slice(0, 2);
    if (cleanNumber) {
      ctx.fillStyle = COLOR.glow;
      ctx.font = "bold 300px Arial, sans-serif";
      ctx.fillText(cleanNumber, 256, 400);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }, [name, number]);
}

function Mannequin({ heightCm, gender }: { heightCm: number; gender: ShopGender }) {
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

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLOR.body, roughness: 0.85, metalness: 0.05 }),
    []
  );
  const limbMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLOR.bodyDark, roughness: 0.9, metalness: 0.04 }),
    []
  );
  const skinMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLOR.skin, roughness: 0.6, metalness: 0.05 }),
    []
  );

  return (
    <group>
      {/* head + neck */}
      <mesh position={[0, headCenterY, 0]} material={skinMat} castShadow>
        <sphereGeometry args={[headR, 24, 24]} />
      </mesh>
      <mesh position={[0, shoulderY + neckLen * 0.5, 0]} material={skinMat} castShadow>
        <cylinderGeometry args={[headR * 0.45, headR * 0.5, neckLen, 16]} />
      </mesh>

      {/* torso (hip → shoulder, tapered) */}
      <mesh position={[0, hipY + torsoLen * 0.5, 0]} material={bodyMat} castShadow>
        <cylinderGeometry args={[chestR, hipR, torsoLen, 28]} />
      </mesh>

      {/* arms */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (shoulderHalf + armR * 0.2), shoulderY - torsoLen * 0.42, 0]}
          material={limbMat}
          castShadow
        >
          <capsuleGeometry args={[armR, torsoLen * 0.9, 6, 14]} />
        </mesh>
      ))}

      {/* legs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * hipR * 0.5, legLen * 0.5, 0]} material={limbMat} castShadow>
          <capsuleGeometry args={[legR, legLen * 0.82, 6, 14]} />
        </mesh>
      ))}
    </group>
  );
}

function Jersey({
  heightCm,
  gender,
  size,
  name,
  number,
}: {
  heightCm: number;
  gender: ShopGender;
  size: ShopSize;
  name: string;
  number: string;
}) {
  const m = bodyMetrics(heightCm, gender);
  const H = heightCm * CM;
  const legLen = 0.46 * H;
  const torsoLen = 0.3 * H;
  const shoulderY = legLen + torsoLen;

  const bodyChestR = circToRadius(m.chest);
  // Garment girth from the size chart; never tighter than the body itself.
  const jerseyR = Math.max(bodyChestR * 1.04, circToRadius(size.chest));
  const jerseyLen = size.length * CM;
  const shoulderHalf = Math.max(m.shoulder, size.shoulder) * 0.5 * CM;
  const sleeveLen = size.sleeve * CM;
  const topY = shoulderY; // collar line
  const centerY = topY - jerseyLen * 0.5;

  const backTex = useBackTexture(name, number);

  const jerseyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLOR.jersey, roughness: 0.55, metalness: 0.15 }),
    []
  );
  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLOR.jerseyTrim,
        emissive: new THREE.Color(COLOR.jerseyTrim),
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.2,
      }),
    []
  );

  return (
    <group>
      {/* main body of the jersey — tapers from shoulders to hem */}
      <mesh position={[0, centerY, 0]} material={jerseyMat} castShadow>
        <cylinderGeometry args={[jerseyR * 0.84, jerseyR, jerseyLen, 30, 1, false]} />
      </mesh>

      {/* shoulder yoke / collar trim */}
      <mesh position={[0, topY, 0]} material={trimMat} castShadow>
        <cylinderGeometry args={[jerseyR * 0.84, jerseyR * 0.86, jerseyLen * 0.05, 30]} />
      </mesh>

      {/* hem trim */}
      <mesh position={[0, centerY - jerseyLen * 0.5, 0]} material={trimMat}>
        <cylinderGeometry args={[jerseyR, jerseyR, jerseyLen * 0.04, 30]} />
      </mesh>

      {/* short sleeves */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (shoulderHalf + sleeveLen * 0.35), topY - sleeveLen * 0.35, 0]}
          rotation={[0, 0, s * 0.5]}
          material={jerseyMat}
          castShadow
        >
          <cylinderGeometry args={[size.sleeve * 0.42 * CM, jerseyR * 0.5, sleeveLen, 18, 1, true]} />
        </mesh>
      ))}

      {/* chest logo placeholder (emissive panel) */}
      <mesh position={[0, topY - jerseyLen * 0.32, jerseyR * 0.86]} material={trimMat}>
        <boxGeometry args={[jerseyR * 0.5, jerseyLen * 0.16, 0.004]} />
      </mesh>

      {/* back name + number panel (canvas texture) */}
      {backTex && (
        <mesh position={[0, topY - jerseyLen * 0.42, -jerseyR * 0.9]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[jerseyR * 1.2, jerseyLen * 0.72]} />
          <meshStandardMaterial map={backTex} roughness={0.6} metalness={0.05} transparent />
        </mesh>
      )}
    </group>
  );
}

function Scene({ gender, heightCm, size, jerseyName, jerseyNumber, autoRotate }: ViewerProps) {
  const H = heightCm * CM;
  const targetY = H * 0.52;

  return (
    <>
      <ambientLight intensity={0.55} color="#b8a6e8" />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
      />
      {/* violet rim light from behind for the esports glow */}
      <directionalLight position={[-4, 3, -5]} intensity={1.1} color={COLOR.glow} />
      <pointLight position={[0, H * 0.6, 3]} intensity={6} color={COLOR.jerseyTrim} distance={9} />

      <group position={[0, -H * 0.06, 0]}>
        <Mannequin heightCm={heightCm} gender={gender} />
        <Jersey heightCm={heightCm} gender={gender} size={size} name={jerseyName} number={jerseyNumber} />

        {/* contact shadow catcher */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[H * 0.7, 48]} />
          <shadowMaterial transparent opacity={0.35} />
        </mesh>
        {/* subtle platform ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry args={[H * 0.55, H * 0.6, 64]} />
          <meshBasicMaterial color={COLOR.jerseyTrim} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <Controls autoRotate={!!autoRotate} targetY={targetY} />
    </>
  );
}

export default function JerseyModelViewer(props: ViewerProps) {
  const H = props.heightCm * CM;
  return (
    <div className={props.className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, H * 0.55, H * 1.7], fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: "pan-y" }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
