"use client";
/**
 * "Vee", the VetoHealth mascot: a soft capsule character that checks claims with a magnifying glass.
 * Built entirely from primitives (no external models, textures or HDR files), in the brand palette.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const C = {
  burgundy: "#512a35",
  rose: "#854c5c",
  blush: "#c99a9d",
  pale: "#ead9d5",
  body: "#efd3cf",
  cream: "#fdfaf6",
  ink: "#292326",
  success: "#54765e",
};

/** What Vee is doing. The mascot is the progress and result indicator, not decoration. */
export type Mood = "idle" | "typing" | "checking" | "good" | "bad" | "unsure";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** A cylinder stretched between two points (molecule bonds). */
function Bond({ from, to, color = C.blush }: { from: [number, number, number]; to: [number, number, number]; color?: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { position: a.clone().add(b).multiplyScalar(0.5), quaternion: q, length: dir.length() };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.035, 0.035, length, 12]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
}

function Molecule() {
  const atoms: { p: [number, number, number]; r: number; c: string }[] = [
    { p: [0, 0, 0], r: 0.22, c: C.rose },
    { p: [0.45, 0.28, 0.05], r: 0.15, c: C.blush },
    { p: [-0.4, 0.3, -0.05], r: 0.16, c: C.pale },
    { p: [0.1, -0.45, 0.1], r: 0.14, c: C.blush },
  ];
  return (
    <group>
      {atoms.slice(1).map((a) => <Bond key={a.p.join()} from={atoms[0].p} to={a.p} />)}
      {atoms.map((a) => (
        <mesh key={a.p.join()} position={a.p}>
          <sphereGeometry args={[a.r, 32, 32]} />
          <meshPhysicalMaterial color={a.c} roughness={0.35} clearcoat={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Two-tone supplement capsule. */
function Pill({ scale = 1, top = C.burgundy, bottom = C.cream }: { scale?: number; top?: string; bottom?: string }) {
  const r = 0.17 * scale;
  const h = 0.22 * scale;
  return (
    <group>
      <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[r, r, h, 32]} /><meshPhysicalMaterial color={top} roughness={0.25} clearcoat={1} /></mesh>
      <mesh position={[0, h, 0]}><sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial color={top} roughness={0.25} clearcoat={1} /></mesh>
      <mesh position={[0, -h / 2, 0]}><cylinderGeometry args={[r, r, h, 32]} /><meshPhysicalMaterial color={bottom} roughness={0.35} clearcoat={0.8} /></mesh>
      <mesh position={[0, -h, 0]}><sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshPhysicalMaterial color={bottom} roughness={0.35} clearcoat={0.8} /></mesh>
    </group>
  );
}

/** A study "paper" with text lines and a green verdict check. */
function StudyCard() {
  return (
    <group>
      <RoundedBox args={[1.25, 1.6, 0.05]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color={C.cream} roughness={0.7} />
      </RoundedBox>
      {[0.5, 0.36, 0.22, 0.08, -0.06].map((y, i) => (
        <mesh key={y} position={[i === 0 ? -0.12 : -0.05, y, 0.03]}>
          <boxGeometry args={[i === 0 ? 0.75 : 0.9 - (i % 2) * 0.2, i === 0 ? 0.07 : 0.04, 0.01]} />
          <meshStandardMaterial color={i === 0 ? C.burgundy : C.blush} />
        </mesh>
      ))}
      <mesh position={[0.28, -0.42, 0.04]}>
        <circleGeometry args={[0.2, 40]} />
        <meshStandardMaterial color={C.success} />
      </mesh>
      <mesh position={[0.22, -0.44, 0.05]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.03, 0.12, 0.01]} /><meshBasicMaterial color={C.cream} /></mesh>
      <mesh position={[0.32, -0.41, 0.05]} rotation={[0, 0, -Math.PI / 5]}><boxGeometry args={[0.03, 0.22, 0.01]} /><meshBasicMaterial color={C.cream} /></mesh>
    </group>
  );
}

function Vee({ reduced, mood, onPoke }: { reduced: boolean; mood: Mood; onPoke?: () => void }) {
  const root = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const waveArm = useRef<THREE.Group>(null);
  const glassArm = useRef<THREE.Group>(null);
  const moodRef = useRef<Mood>(mood);
  const since = useRef(0);
  const [hover, setHover] = useState(false);
  useEffect(() => { moodRef.current = mood; since.current = -1; }, [mood]);
  useEffect(() => { document.body.style.cursor = hover && onPoke ? "pointer" : ""; return () => { document.body.style.cursor = ""; }; }, [hover, onPoke]);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (since.current < 0) since.current = t;
    const m = moodRef.current;
    const dt = t - since.current; // seconds in the current mood
    const L = THREE.MathUtils.lerp;
    if (root.current) {
      let ty = reduced ? 0 : pointer.x * 0.45;
      let tx = reduced ? 0 : -pointer.y * 0.12;
      let tz = 0;
      let y = 0;
      if (m === "typing") { ty = -0.35; tx = 0.18; }
      if (m === "checking" && !reduced) { ty = Math.sin(t * 2.4) * 0.25; y = Math.sin(t * 6) * 0.03; }
      if (m === "good" && !reduced) y = Math.abs(Math.sin(t * 4.5)) * 0.18 * Math.max(0, 1 - dt / 3);
      if (m === "bad" && !reduced) ty += Math.sin(t * 14) * 0.22 * Math.max(0, 1 - dt / 1.6);
      if (m === "unsure") tz = 0.16;
      root.current.rotation.y = L(root.current.rotation.y, ty, 0.08);
      root.current.rotation.x = L(root.current.rotation.x, tx, 0.08);
      root.current.rotation.z = L(root.current.rotation.z, tz, 0.08);
      root.current.position.y = L(root.current.position.y, y, 0.3);
      const s = hover ? 1.04 : 1;
      root.current.scale.setScalar(L(root.current.scale.x, s, 0.15));
    }
    if (eyes.current) {
      const blink = !reduced && t % 3.6 > 3.45;
      const target = blink ? 0.12 : m === "checking" ? 0.55 : m === "good" ? 0.8 : 1;
      eyes.current.scale.y = L(eyes.current.scale.y, target, 0.35);
    }
    if (mouth.current) {
      // smile (arc down) for good/idle, frown for bad, flat for unsure/checking
      const frown = m === "bad";
      mouth.current.rotation.z = L(mouth.current.rotation.z, frown ? 0 : Math.PI, 0.2);
      const sy = m === "unsure" || m === "checking" ? 0.25 : m === "good" ? 1.35 : 1;
      mouth.current.scale.set(m === "good" ? 1.3 : 1, L(mouth.current.scale.y, sy, 0.2), 1);
      mouth.current.position.y = frown ? -0.4 : -0.33;
    }
    if (waveArm.current && !reduced) {
      const wave = m === "idle" || m === "good";
      waveArm.current.rotation.z = L(waveArm.current.rotation.z, wave ? 0.9 + Math.sin(t * (m === "good" ? 6 : 3.2)) * 0.35 : 0.35, 0.15);
    }
    if (glassArm.current && !reduced) {
      const sweep = m === "checking" ? Math.sin(t * 5) * 0.45 : m === "typing" ? 0.25 : Math.sin(t * 1.3) * 0.06;
      glassArm.current.rotation.z = L(glassArm.current.rotation.z, -0.55 + sweep, 0.2);
    }
  });

  const bodyMat = <meshPhysicalMaterial color={C.body} roughness={0.55} sheen={1} sheenColor="#ffffff" sheenRoughness={0.6} clearcoat={0.25} clearcoatRoughness={0.5} />;
  const capMat = <meshPhysicalMaterial color={C.burgundy} roughness={0.22} clearcoat={1} clearcoatRoughness={0.15} />;

  return (
    <group ref={root} onClick={(e) => { e.stopPropagation(); onPoke?.(); }} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
      {/* body */}
      <mesh>
        <capsuleGeometry args={[0.95, 0.9, 24, 64]} />
        {bodyMat}
      </mesh>
      {/* glossy capsule cap like a beanie */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.975, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {capMat}
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.975, 0.975, 0.3, 64, 1, true]} />
        {capMat}
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.975, 0.035, 16, 96]} />
        <meshStandardMaterial color={C.rose} roughness={0.4} />
      </mesh>

      {/* face */}
      <group ref={eyes} position={[0, -0.12, 0]}>
        {[-0.3, 0.3].map((x) => (
          <group key={x} position={[x, 0, 0.9]}>
            <mesh scale={[1, 1.25, 0.6]}><sphereGeometry args={[0.09, 24, 24]} /><meshStandardMaterial color={C.ink} roughness={0.3} /></mesh>
            <mesh position={[0.03, 0.04, 0.05]}><sphereGeometry args={[0.025, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
          </group>
        ))}
      </group>
      {[-0.52, 0.52].map((x) => (
        <mesh key={x} position={[x, -0.3, 0.8]} rotation={[0, x > 0 ? 0.55 : -0.55, 0]}>
          <circleGeometry args={[0.13, 32]} />
          <meshBasicMaterial color={C.blush} transparent opacity={0.65} />
        </mesh>
      ))}
      <mesh ref={mouth} position={[0, -0.33, 0.93]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.1, 0.022, 12, 32, Math.PI]} />
        <meshStandardMaterial color={C.ink} />
      </mesh>

      {/* waving arm (left of screen) */}
      <group ref={waveArm} position={[-0.95, -0.15, 0]} rotation={[0, 0, 0.9]}>
        <mesh position={[0, 0.32, 0]}><capsuleGeometry args={[0.12, 0.38, 12, 24]} />{bodyMat}</mesh>
      </group>
      {/* arm holding the magnifying glass */}
      <group ref={glassArm} position={[0.95, -0.2, 0.1]} rotation={[0, 0, -0.55]}>
        <mesh position={[0, 0.3, 0]}><capsuleGeometry args={[0.12, 0.36, 12, 24]} />{bodyMat}</mesh>
        <group position={[0.34, 0.95, 0.15]} rotation={[0, -0.25, -0.7]}>
          <mesh position={[0, -0.32, 0]}><cylinderGeometry args={[0.05, 0.05, 0.42, 16]} /><meshPhysicalMaterial color={C.rose} roughness={0.3} clearcoat={1} /></mesh>
          <mesh><torusGeometry args={[0.27, 0.055, 16, 64]} /><meshPhysicalMaterial color={C.burgundy} roughness={0.2} clearcoat={1} /></mesh>
          <mesh><circleGeometry args={[0.25, 48]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.28} roughness={0.05} clearcoat={1} /></mesh>
          <mesh position={[-0.08, 0.08, 0.01]}><circleGeometry args={[0.05, 24]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.8} /></mesh>
        </group>
      </group>

      {/* feet */}
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, -1.42, 0.12]} scale={[1, 0.55, 1.25]}>
          <sphereGeometry args={[0.24, 32, 32]} />
          {capMat}
        </mesh>
      ))}
    </group>
  );
}

function Scene({ reduced, mood, onPoke, compact }: { reduced: boolean; mood: Mood; onPoke?: () => void; compact: boolean }) {
  const speed = reduced ? 0 : 1;
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff6f0", C.blush, 0.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color={C.pale} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="circle" intensity={1.4} position={[-4, 1, 2]} scale={3} color="#ffe9e2" />
        <Lightformer form="rect" intensity={0.8} position={[4, -1, 3]} scale={[3, 3, 1]} color={C.pale} />
      </Environment>

      <Float speed={1.3 * speed} rotationIntensity={0.15 * speed} floatIntensity={0.55 * speed}>
        <group position={[0.25, 0.05, 0]} scale={0.95}>
          <Vee reduced={reduced} mood={mood} onPoke={onPoke} />
        </group>
      </Float>

      {!compact && <>
      <Float speed={1.1 * speed} rotationIntensity={0.5 * speed} floatIntensity={0.8 * speed}>
        <group position={[-1.95, 0.7, -1.2]} rotation={[0.1, 0.45, 0.12]}>
          <StudyCard />
        </group>
      </Float>
      <Float speed={1.8 * speed} rotationIntensity={1.2 * speed} floatIntensity={1 * speed}>
        <group position={[1.85, 1.35, -0.6]} rotation={[0.3, 0.2, 0.8]}><Molecule /></group>
      </Float>
      <Float speed={2.2 * speed} rotationIntensity={1.6 * speed} floatIntensity={1.2 * speed}>
        <group position={[-1.6, -1.05, 0.6]} rotation={[0.4, 0, -0.9]}><Pill scale={1.1} /></group>
      </Float>
      <Float speed={1.9 * speed} rotationIntensity={1.4 * speed} floatIntensity={1 * speed}>
        <group position={[1.7, -0.9, 0.8]} rotation={[0.2, 0.3, 0.6]}><Pill scale={0.8} top={C.rose} bottom={C.pale} /></group>
      </Float>
      </>}

      <ContactShadows position={[0.25, -1.62, 0]} opacity={0.3} scale={7} blur={2.8} far={3} color={C.burgundy} />
    </>
  );
}

/** `mood` drives Vee's reaction; `onPoke` makes Vee clickable; `compact` hides the floating props (small placements). */
export default function HeroScene({ mood = "idle", onPoke, compact = false }: { mood?: Mood; onPoke?: () => void; compact?: boolean }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.1, compact ? 7.6 : 8.6], fov: 32 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <Scene reduced={reduced} mood={mood} onPoke={onPoke} compact={compact} />
      </Canvas>
    </div>
  );
}
