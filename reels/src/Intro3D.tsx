import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import fontJson from "three/examples/fonts/helvetiker_bold.typeface.json";

/* A real 3D YouTube intro made with Remotion + Three.js: it is what Reel 11 shows as the result of
   "Create a 3D-style animated intro for my YouTube video". Chrome letters fly in from depth one by one,
   the camera dollies and orbits, a glowing ring spins behind, chrome spheres and a particle field drift. */
export const INTRO_FRAMES = 165;
const font = new FontLoader().parse(fontJson as any);
const ease = Easing.bezier(0.16, 1, 0.3, 1);

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.35;
  }, [gl, scene]);
  return null;
};

const Camera: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const k = interpolate(frame, [0, INTRO_FRAMES], [0, 1], { extrapolateRight: "clamp" });
  const ang = interpolate(k, [0, 1], [-0.55, 0.32], { easing: Easing.inOut(Easing.cubic) });
  const dist = interpolate(frame, [0, 70], [17, 11.2], { extrapolateRight: "clamp", easing: ease });
  camera.position.set(Math.sin(ang) * dist, 0.9 + Math.sin(frame / 40) * 0.25, Math.cos(ang) * dist);
  camera.lookAt(0, 0.1, 0);
  return null;
};

const Word: React.FC<{ text: string; y: number; size: number; start: number; mat: THREE.Material }> = ({ text, y, size, start, mat }) => {
  const frame = useCurrentFrame();
  const letters = useMemo(() => {
    let x = 0;
    const out: { g: TextGeometry; x: number; w: number }[] = [];
    for (const ch of text) {
      if (ch === " ") { x += size * 0.45; continue; }
      const g = new TextGeometry(ch, { font, size, depth: size * 0.42, curveSegments: 10, bevelEnabled: true, bevelThickness: size * 0.06, bevelSize: size * 0.035, bevelSegments: 6 });
      g.computeBoundingBox();
      const w = g.boundingBox!.max.x - g.boundingBox!.min.x;
      g.translate(-w / 2, 0, -size * 0.21);
      out.push({ g, x: x + w / 2, w });
      x += w + size * 0.09;
    }
    const total = x - size * 0.09;
    return out.map((l) => ({ ...l, x: l.x - total / 2 }));
  }, [text, size]);
  return (
    <group position={[0, y, 0]}>
      {letters.map((l, i) => {
        const t0 = start + i * 3;
        const p = interpolate(frame, [t0, t0 + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
        const wob = Math.sin((frame - t0) / 14 + i) * 0.04 * p;
        return (
          <mesh key={i} geometry={l.g} material={mat} position={[l.x, (1 - p) * 2.2, (1 - p) * -14]} rotation={[(1 - p) * -1.6 + wob, (1 - p) * 2.4, 0]} scale={Math.max(0.001, p)} />
        );
      })}
    </group>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const chrome = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e9ecf5", metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 }), []);
  const gold = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffb36b", metalness: 1, roughness: 0.22, clearcoat: 1 }), []);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#8b5cf6", toneMapped: false }), []);
  const glow2 = useMemo(() => new THREE.MeshBasicMaterial({ color: "#22d3ee", toneMapped: false }), []);
  const parts = useMemo(() => {
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 6 + ((i * 7919) % 1000) / 1000 * 18, a = i * 2.39996, h = (((i * 104729) % 1000) / 1000 - 0.5) * 16;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = h; pos[i * 3 + 2] = Math.sin(a) * r - 6;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); return g;
  }, []);
  const ringIn = interpolate(frame, [10, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const flash = interpolate(frame, [62, 70, 95], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spheres: [number, number, number, number, THREE.Material][] = [[-5.2, 2.4, -2, 0.55, chrome], [5.4, -1.9, -1.5, 0.75, gold], [4.6, 2.9, -4, 0.4, chrome], [-4.4, -2.6, -3, 0.48, gold], [0.2, 3.6, -6, 0.3, chrome]];
  return (
    <>
      <fog attach="fog" args={["#05030f", 14, 34]} />
      <Env />
      <Camera />
      <ambientLight intensity={0.35} color="#c4b5fd" />
      <hemisphereLight args={["#a78bfa", "#0e7490", 0.6]} />
      <pointLight position={[-6, 4, 6]} intensity={160 + flash * 400} color="#a78bfa" />
      <pointLight position={[6, -2, 5]} intensity={140 + flash * 300} color="#22d3ee" />
      <spotLight position={[0, 8, 10]} angle={0.5} penumbra={0.8} intensity={260} color="#ffffff" />
      <group rotation={[0.35, 0, 0]} position={[0, 0.2, -3.5]} scale={ringIn}>
        <mesh rotation={[0, 0, frame / 40]}><torusGeometry args={[5.4, 0.07, 16, 160]} /><primitive object={glow} attach="material" /></mesh>
        <mesh rotation={[0, 0, -frame / 55]}><torusGeometry args={[6.1, 0.03, 12, 160]} /><primitive object={glow2} attach="material" /></mesh>
        <mesh rotation={[0, 0, frame / 70]}><torusGeometry args={[4.7, 0.16, 32, 160]} /><primitive object={chrome} attach="material" /></mesh>
      </group>
      <Word text="AI WITH" y={0.75} size={1.05} start={6} mat={chrome} />
      <Word text="KALYAN" y={-1.05} size={1.55} start={26} mat={gold} />
      {spheres.map(([x, y, z, r, m], i) => (
        <mesh key={i} position={[x + Math.sin(frame / 30 + i) * 0.3, y + Math.cos(frame / 26 + i * 2) * 0.35, z]} material={m} scale={interpolate(frame, [20 + i * 6, 44 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}>
          <sphereGeometry args={[r, 48, 48]} />
        </mesh>
      ))}
      <points geometry={parts} rotation={[0, frame / 300, 0]}>
        <pointsMaterial size={0.06} color="#c4b5fd" transparent opacity={0.85} sizeAttenuation />
      </points>
    </>
  );
};

export const Intro3D: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [70, 110], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sub = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <AbsoluteFill style={{ background: "#05030f" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at 50% 52%, rgba(124,58,237,${0.55 + Math.sin(frame / 12) * 0.08}) 0%, rgba(30,27,75,0.6) 45%, #05030f 80%)` }} />
      <ThreeCanvas linear gl={{ alpha: true }} width={width} height={height} camera={{ fov: 40, near: 0.1, far: 100 }}>
        <Scene />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${sweep - 12}%, rgba(255,255,255,0.13) ${sweep}%, transparent ${sweep + 12}%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: height * 0.1, textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: 14, fontSize: height * 0.034, color: "#e9e4ff", opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>REAL AI EXPERIMENTS · EXPLAINED SIMPLY</div>
    </AbsoluteFill>
  );
};
