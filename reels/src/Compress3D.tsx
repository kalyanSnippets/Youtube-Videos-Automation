import React, { useMemo, useRef, useLayoutEffect } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* Reel 13 3D beat: a big AI model (a lattice of 8x8x8 glowing weight blocks) is compressed into a small dense cube.
   Sizes on screen (about 54 GB down to 7.89 GB) are Saluki 27B's reported sizes. Rendered once to public/b/r13_compress.mp4. */
export const COMPRESS_FRAMES = 165;
const N = 8;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
  }, [gl, scene]);
  return null;
};

const Lattice: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.InstancedMesh>(null);
  const k = interpolate(frame, [40, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colA = useMemo(() => new THREE.Color("#7c3aed"), []), colB = useMemo(() => new THREE.Color("#22d3ee"), []), colC = useMemo(() => new THREE.Color("#fbbf24"), []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    let i = 0; const c = new THREE.Color();
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) {
      const o = (v: number) => v - (N - 1) / 2;
      const jitter = Math.sin(i * 12.9898) * 0.5;
      const spread = 1.0 + (1 - k) * 0.18 * Math.sin(frame / 12 + i);
      const sp = interpolate(k, [0, 1], [0.95, 0.24]) * spread;
      const delay = (x + y + z) / (3 * N);
      const kk = Math.min(1, Math.max(0, (k - delay * 0.35) / 0.65));
      dummy.position.set(o(x) * sp + jitter * (1 - kk) * 0.4, o(y) * sp, o(z) * sp);
      const s = interpolate(kk, [0, 1], [0.42, 0.2]);
      dummy.scale.setScalar(s);
      dummy.rotation.set(frame / 30 + i, frame / 40, 0);
      dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      c.copy(colA).lerp(colB, y / N).lerp(colC, kk * 0.55); m.setColorAt(i, c);
      i++;
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [frame, k, dummy, colA, colB, colC]);
  const rotY = frame / 45, rotX = 0.35 + Math.sin(frame / 50) * 0.15;
  return (
    <group rotation={[rotX, rotY, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, N * N * N]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial metalness={0.6} roughness={0.25} clearcoat={1} emissive="#6d28d9" emissiveIntensity={0.25} />
      </instancedMesh>
    </group>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const d = interpolate(frame, [0, 40, 100, 165], [21, 19, 10, 8.8], { extrapolateRight: "clamp" });
  const a = frame / 160;
  camera.position.set(Math.sin(a) * d * 0.25, 1.2, d);
  camera.lookAt(0, 0, 0);
  const ring = interpolate(frame, [95, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#22d3ee", toneMapped: false }), []);
  return (
    <>
      <Env />
      <ambientLight intensity={0.35} />
      <pointLight position={[-6, 5, 6]} intensity={180} color="#a78bfa" />
      <pointLight position={[6, -3, 5]} intensity={160} color="#22d3ee" />
      <Lattice />
      <mesh rotation={[Math.PI / 2.3, 0, frame / 30]} scale={ring}><torusGeometry args={[2.6, 0.05, 12, 120]} /><primitive object={glow} attach="material" /></mesh>
    </>
  );
};

export const Compress3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = interpolate(frame, [40, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const gb = interpolate(k, [0, 1], [54, 7.89]);
  const done = frame >= 100;
  const flash = interpolate(frame, [98, 102, 116], [0, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #2e1065 0%, #0b0720 55%, #05030f 100%)" }}>
      <ThreeCanvas linear width={width} height={height} gl={{ alpha: true }} camera={{ fov: 40, near: 0.1, far: 100 }}>
        <Scene />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: height * 0.07, textAlign: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ fontWeight: 900, fontSize: height * 0.1, color: done ? "#34D399" : "#fff", letterSpacing: -3, textShadow: "0 8px 30px rgba(0,0,0,0.7)" }}>{done ? "7.89 GB" : k === 0 ? "~54 GB" : `${gb.toFixed(1)} GB`}</div>
        <div style={{ fontWeight: 800, fontSize: height * 0.035, color: "#c4b5fd", letterSpacing: 6 }}>{done ? "COMPRESSED · 1 FILE" : k > 0 ? "COMPRESSING…" : "FULL MODEL"}</div>
      </div>
    </AbsoluteFill>
  );
};
