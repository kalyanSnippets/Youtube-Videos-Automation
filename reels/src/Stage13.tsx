import React, { useMemo, useRef, useLayoutEffect } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* Reel 13 v2: the 3D beats, rendered once each into public/b/r13_3d_<scene>.mp4 (1080x960, the split-screen top half).
   Frame 0 of each scene = the start time noted in R13.tsx. Text labels are drawn in the main composition. */
const FPS = 30;
const e = Easing.bezier(0.65, 0, 0.35, 1);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (fr: number, a: number, b: number, ez = e) => interpolate(fr, [a * FPS, b * FPS], [0, 1], { ...cl, easing: ez });

const Env: React.FC<{ exposure?: number }> = ({ exposure = 1.15 }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = exposure;
  }, [gl, scene, exposure]);
  return null;
};
const Cam: React.FC<{ pos: [number, number, number]; look?: [number, number, number] }> = ({ pos, look = [0, 0, 0] }) => {
  const { camera } = useThree();
  camera.position.set(...pos); camera.lookAt(...look);
  return null;
};

/* text on a canvas texture, redrawn when the text changes */
function useLabel(lines: { t: string; c: string; s: number }[], w = 512, h = 320, bg = "#0b1020") {
  const key = JSON.stringify(lines) + bg;
  return useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d")!; g.fillStyle = bg; g.fillRect(0, 0, w, h);
    let y = h / 2 - (lines.length - 1) * 0.5 * lines[0].s * 1.25;
    for (const l of lines) { g.fillStyle = l.c; g.font = `800 ${l.s}px Inter, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(l.t, w / 2, y); y += l.s * 1.25; }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/* procedural laptop: aluminium base, keyboard well, hinged lid with an emissive screen */
const Laptop: React.FC<{ screen: THREE.Texture; glow?: string; open?: number; position?: [number, number, number]; rotY?: number; scale?: number }> = ({ screen, glow = "#60a5fa", open = 1, position = [0, 0, 0], rotY = 0, scale = 1 }) => (
  <group position={position} rotation={[0, rotY, 0]} scale={scale}>
    <mesh position={[0, 0.06, 0]}><boxGeometry args={[3.2, 0.12, 2.2]} /><meshPhysicalMaterial color="#c9ced6" metalness={0.9} roughness={0.28} clearcoat={0.6} /></mesh>
    <mesh position={[0, 0.125, 0.15]}><boxGeometry args={[2.8, 0.01, 1.2]} /><meshStandardMaterial color="#1c2027" roughness={0.8} /></mesh>
    <mesh position={[0, 0.125, 0.92]}><boxGeometry args={[1.1, 0.01, 0.55]} /><meshStandardMaterial color="#aab0b9" metalness={0.7} roughness={0.35} /></mesh>
    <group position={[0, 0.12, -1.08]} rotation={[-0.22 + (1 - open) * 1.3, 0, 0]}>
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[3.2, 2.1, 0.08]} /><meshPhysicalMaterial color="#c9ced6" metalness={0.9} roughness={0.28} /></mesh>
      <mesh position={[0, 1.07, 0.045]}><planeGeometry args={[2.95, 1.85]} /><meshBasicMaterial map={screen} toneMapped={false} /></mesh>
      <pointLight position={[0, 1.1, 0.9]} intensity={6} distance={4} color={glow} />
    </group>
  </group>
);

/* a voxel "AI model": instanced glowing cubes */
const Voxels: React.FC<{ nx: number; ny: number; nz: number; gap: number; size: number; colA: string; colB: string; spin?: number; jitter?: number }> = ({ nx, ny, nz, gap, size, colA, colB, spin = 0, jitter = 0 }) => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.InstancedMesh>(null);
  const d = useMemo(() => new THREE.Object3D(), []);
  const A = useMemo(() => new THREE.Color(colA), [colA]), B = useMemo(() => new THREE.Color(colB), [colB]);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return; let i = 0; const c = new THREE.Color();
    for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) {
      const j = Math.sin(i * 12.99 + frame / 9) * jitter;
      d.position.set((x - (nx - 1) / 2) * gap + j, (y - (ny - 1) / 2) * gap, (z - (nz - 1) / 2) * gap - j);
      d.rotation.set(spin * (frame / 30 + i), spin * frame / 40, 0); d.scale.setScalar(size * (0.85 + 0.15 * Math.sin(i + frame / 14)));
      d.updateMatrix(); m.setMatrixAt(i, d.matrix); c.copy(A).lerp(B, y / Math.max(1, ny - 1)); m.setColorAt(i, c); i++;
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [frame, nx, ny, nz, gap, size, A, B, d, spin, jitter]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, nx * ny * nz]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial metalness={0.55} roughness={0.25} emissive="#5b21b6" emissiveIntensity={0.35} />
    </instancedMesh>
  );
};

/* a RAM stick: green PCB, black chips, gold contacts, a label */
const RamStick: React.FC<{ label: string; heat?: number; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }> = ({ label, heat = 0, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const tex = useLabel([{ t: label, c: "#ffffff", s: 120 }], 512, 180, "#0f5132");
  const chip = useMemo(() => new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.5, metalness: 0.3 }), []);
  const pcb = new THREE.Color("#127a46").lerp(new THREE.Color("#b91c1c"), heat);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh><boxGeometry args={[3.4, 0.9, 0.06]} /><meshPhysicalMaterial color={pcb} roughness={0.45} clearcoat={0.6} emissive={heat > 0 ? "#ff2d2d" : "#000"} emissiveIntensity={heat * 0.8} /></mesh>
      {[-1.2, -0.4, 0.4, 1.2].map((x) => <mesh key={x} position={[x, 0.08, 0.05]} material={chip}><boxGeometry args={[0.6, 0.42, 0.05]} /></mesh>)}
      <mesh position={[0, -0.4, 0.035]}><boxGeometry args={[3.2, 0.12, 0.01]} /><meshPhysicalMaterial color="#d4a017" metalness={1} roughness={0.2} /></mesh>
      <mesh position={[0, 0.34, 0.045]}><planeGeometry args={[1.3, 0.3]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
};

const Sparks: React.FC<{ on: number; color?: string }> = ({ on, color = "#ff7a45" }) => {
  const frame = useCurrentFrame();
  const g = useMemo(() => new THREE.BufferGeometry(), []);
  const n = 160, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = ((frame * 0.03 + i * 0.137) % 1), a = i * 2.4;
    pos[i * 3] = Math.cos(a) * (0.4 + t * 2.4); pos[i * 3 + 1] = 0.6 + t * 2.2 - t * t * 2.4; pos[i * 3 + 2] = Math.sin(a) * (0.4 + t * 2.4) * 0.6;
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return <points geometry={g}><pointsMaterial size={0.07} color={color} transparent opacity={on} toneMapped={false} /></points>;
};

const Floor: React.FC<{ color?: string }> = ({ color = "#7c3aed" }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><circleGeometry args={[40, 64]} /><meshStandardMaterial color="#0b0a1f" metalness={0.8} roughness={0.35} emissive={color} emissiveIntensity={0.06} /></mesh>
);

/* ---- scene 1: hook (0.0-3.8s) ---- */
const Hook: React.FC = () => {
  const fr = useCurrentFrame();
  const shrink = ramp(fr, 0.82, 2.2), fly = ramp(fr, 2.55, 3.45);
  const scr = useLabel(fly > 0.95 ? [{ t: "✓ RUNNING", c: "#34d399", s: 64 }, { t: "locally", c: "#a7f3d0", s: 40 }] : [{ t: "normal laptop", c: "#94a3b8", s: 52 }]);
  const s = 1 - shrink * 0.72;
  return (
    <>
      <Cam pos={[Math.sin(fr / 140) * 1.6, 3.2, 12.5 - shrink * 1.5]} look={[0, 1.9, 0]} />
      <ambientLight intensity={0.3} /><pointLight position={[-5, 6, 5]} intensity={160} color="#a78bfa" /><pointLight position={[5, 3, 4]} intensity={120} color="#22d3ee" />
      <Floor />
      <group position={[-2.3 + fly * 4.6, 0.02 + s * 2.6 + fly * 1.1, -0.4 - fly * 1.4]} scale={0.85 * s * (1 - fly * 0.8)} rotation={[0, fr / 50, 0]}>
        <Voxels nx={5} ny={9} nz={5} gap={0.68} size={0.5} colA="#7c3aed" colB="#22d3ee" spin={0.1} />
      </group>
      <Laptop screen={scr} glow={fly > 0.95 ? "#34d399" : "#60a5fa"} position={[2.4, 0, 0.8]} rotY={-0.4} scale={1.05} />
    </>
  );
};

/* ---- scene 2: the RAM problem (starts 5.9s) ---- */
const Problem: React.FC = () => {
  const fr = useCurrentFrame(); const t0 = 5.9; const T = (x: number) => x - t0;
  const drop = ramp(fr, T(9.84), T(10.9)), hot = ramp(fr, T(11.26), T(12.3));
  const pct = Math.round(drop * 100);
  const scr = useLabel(hot > 0.5 ? [{ t: "OUT OF MEMORY", c: "#ff4d4d", s: 58 }, { t: "✕ can't load model", c: "#fca5a5", s: 34 }] : drop > 0 ? [{ t: `downloading ${pct}%`, c: "#e5e7eb", s: 46 }, { t: "model.gguf", c: "#93c5fd", s: 34 }] : [{ t: "ready", c: "#94a3b8", s: 52 }], 512, 320, hot > 0.5 ? "#2a0b0e" : "#0b1020");
  const fileTex = useLabel([{ t: "~54 GB", c: "#ffffff", s: 110 }, { t: "open-source AI model", c: "#e9d5ff", s: 38 }], 512, 384, "#4c1d95");
  const bob = Math.sin(fr / 16) * 0.12;
  return (
    <>
      <Cam pos={[Math.sin(fr / 90) * 1.4, 3.4, 9.2]} look={[0, 1.5, 0]} />
      <ambientLight intensity={0.3} /><pointLight position={[-5, 6, 5]} intensity={150} color="#a78bfa" /><pointLight position={[4, 3, 5]} intensity={120 + hot * 200} color={hot > 0.3 ? "#ff3b3b" : "#22d3ee"} />
      <Floor color={hot > 0.3 ? "#ff2d2d" : "#7c3aed"} />
      <Laptop screen={scr} glow={hot > 0.5 ? "#ff3b3b" : "#60a5fa"} position={[0, 0, 0.4]} />
      {drop < 1 && (
        <group position={[0, 3.0 + bob - drop * 1.6, -0.4 - drop * 0.2]} scale={0.8 * (1 - drop * 0.75)} rotation={[0.25, fr / 40, 0]}>
          <mesh><boxGeometry args={[1.8, 1.8, 1.8]} /><meshPhysicalMaterial color="#6d28d9" metalness={0.5} roughness={0.25} clearcoat={1} emissive="#4c1d95" emissiveIntensity={0.4} /></mesh>
          <mesh position={[0, 0, 0.91]}><planeGeometry args={[1.7, 1.27]} /><meshBasicMaterial map={fileTex} toneMapped={false} /></mesh>
        </group>
      )}
      <RamStick label="16 GB" heat={hot} position={[-3.1, 0.9 + Math.sin(fr / 20) * 0.1, 0.9]} rotation={[0.1, 0.6, Math.sin(fr / 25) * 0.05]} scale={0.7} />
      <RamStick label="RAM" heat={hot} position={[3.1, 1.0 + Math.cos(fr / 22) * 0.1, 0.8]} rotation={[0.1, -0.6, 0]} scale={0.7} />
      <Sparks on={hot} />
    </>
  );
};

/* ---- scene 3: compression (starts 16.8s): Qwen3.8-27B lattice crushed into Saluki ---- */
const Compress: React.FC = () => {
  const fr = useCurrentFrame(); const t0 = 16.8; const T = (x: number) => x - t0;
  const k = ramp(fr, T(19.6), T(20.9));
  const ring = ramp(fr, T(20.7), T(21.2), Easing.out(Easing.back(1.6)));
  return (
    <>
      <Cam pos={[Math.sin(fr / 70) * 3, 2.2, 12 - k * 3]} look={[0, 0, 0]} />
      <ambientLight intensity={0.35} /><pointLight position={[-6, 5, 6]} intensity={180} color="#a78bfa" /><pointLight position={[6, -3, 5]} intensity={160} color="#22d3ee" />
      <group rotation={[0.35, fr / 45, 0]}>
        <Voxels nx={8} ny={8} nz={8} gap={interpolate(k, [0, 1], [0.95, 0.26])} size={interpolate(k, [0, 1], [0.42, 0.22])} colA="#7c3aed" colB={k > 0.9 ? "#34d399" : "#22d3ee"} spin={0.15 * (1 - k)} jitter={0.18 * (1 - k)} />
      </group>
      <mesh rotation={[Math.PI / 2.3, 0, fr / 25]} scale={ring}><torusGeometry args={[2.4, 0.05, 12, 120]} /><meshBasicMaterial color="#34d399" toneMapped={false} /></mesh>
    </>
  );
};

/* ---- scene 4: the RAM poll (starts 38.1s) ---- */
const Poll: React.FC = () => {
  const fr = useCurrentFrame(); const t0 = 38.1; const T = (x: number) => x - t0;
  const sticks: [string, number, number][] = [["8 GB", 41.08, -3.6], ["16 GB", 41.72, 0], ["32 GB", 42.46, 3.6]];
  const win = useLabel([{ t: "⊞ Windows", c: "#ffffff", s: 76 }], 512, 200, "#2563eb");
  const mac = useLabel([{ t: " Mac", c: "#111111", s: 80 }], 512, 200, "#f3f4f6");
  const tiles: [THREE.Texture, number, number][] = [[win, 44.54, -2.1], [mac, 45.06, 2.1]];
  return (
    <>
      <Cam pos={[Math.sin(fr / 110) * 1.2, 2.4, 12.5]} look={[0, 1.3, 0]} />
      <ambientLight intensity={0.35} /><pointLight position={[-5, 6, 6]} intensity={160} color="#a78bfa" /><pointLight position={[5, 2, 6]} intensity={140} color="#22d3ee" />
      <Floor color="#22d3ee" />
      {sticks.map(([l, at, x]) => {
        const p = ramp(fr, T(at) - 0.15, T(at) + 0.45, Easing.out(Easing.back(1.4)));
        return <RamStick key={l} label={l} position={[x * 0.85, -1.4 + p * 3.8 + Math.sin(fr / 18 + x) * 0.08, -0.6]} rotation={[0.1, (1 - p) * 2.5 + Math.sin(fr / 30 + x) * 0.25, 0]} scale={0.82} />;
      })}
      {tiles.map(([tx, at, x], i) => {
        const p = ramp(fr, T(at) - 0.2, T(at) + 0.35, Easing.out(Easing.back(1.6)));
        return (
          <group key={i} position={[x, 0.85, 1.8]} scale={p} rotation={[0, Math.sin(fr / 26 + i) * 0.2, 0]}>
            <mesh><boxGeometry args={[3.2, 1.25, 0.18]} /><meshPhysicalMaterial color={i ? "#e5e7eb" : "#2563eb"} metalness={0.2} roughness={0.3} clearcoat={1} /></mesh>
            <mesh position={[0, 0, 0.1]}><planeGeometry args={[3.0, 1.17]} /><meshBasicMaterial map={tx} toneMapped={false} /></mesh>
          </group>
        );
      })}
    </>
  );
};

const SCENES = { hook: Hook, problem: Problem, compress: Compress, poll: Poll } as const;
export const STAGE13_FRAMES = { hook: 120, problem: 210, compress: 150, poll: 225 } as const;
export const Stage13: React.FC<{ scene: keyof typeof SCENES }> = ({ scene }) => {
  const { width, height } = useVideoConfig();
  const S = SCENES[scene];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #241a52 0%, #0b0720 55%, #05030f 100%)" }}>
      <ThreeCanvas linear width={width} height={height} gl={{ alpha: true }} camera={{ fov: 40, near: 0.1, far: 100 }}>
        <Env />
        <S />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
