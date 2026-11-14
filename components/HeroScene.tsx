"use client";
/**
 * "Vee", the VetoHealth mascot: a soft capsule character that checks claims with a magnifying glass.
 * Built entirely from primitives (no external models, textures or HDR files), in the brand palette.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
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

type Live = { gaze: { x: number; y: number }; pokedAt: number; focus: number | null; hover: boolean };

function Vee({ reduced, mood, live, onPoke }: { reduced: boolean; mood: Mood; live: React.MutableRefObject<Live>; onPoke?: () => void }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const brows = useRef<(THREE.Mesh | null)[]>([]);
  const smile = useRef<THREE.Mesh>(null);
  const open = useRef<THREE.Group>(null);
  const cheeks = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const waveArm = useRef<THREE.Group>(null);
  const glassArm = useRef<THREE.Group>(null);
  const moodRef = useRef<Mood>(mood);
  const since = useRef(0);
  const born = useRef(-1);
  const blink = useRef({ next: 1.8, until: 0 });
  const [hover, setHover] = useState(false);
  useEffect(() => { moodRef.current = mood; since.current = -1; }, [mood]);
  useEffect(() => { live.current.hover = hover; document.body.style.cursor = hover && onPoke ? "pointer" : ""; return () => { document.body.style.cursor = ""; }; }, [hover, onPoke, live]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (since.current < 0) since.current = t;
    if (born.current < 0) born.current = t;
    const m = moodRef.current;
    const L = THREE.MathUtils.lerp;
    const { gaze, focus, pokedAt } = live.current;
    const dt = t - since.current; // seconds in the current mood
    const life = t - born.current;
    const poke = pokedAt > 0 ? (performance.now() - pokedAt) / 1000 : 9;
    const happy = m === "good" || hover || poke < 1.1;

    if (root.current && body.current) {
      // look toward the cursor, or toward the post being checked
      let ty = reduced ? 0 : focus !== null ? focus * 0.55 : gaze.x * 0.42;
      let tx = reduced ? 0 : -gaze.y * 0.12;
      let tz = 0, y = 0, sx = 1, sy = 1, spin = 0;
      if (m === "typing") { ty = -0.35; tx = 0.18; }
      if (m === "checking" && !reduced && focus === null) { ty = Math.sin(t * 2.4) * 0.25; y = Math.sin(t * 6) * 0.03; }
      if (m === "good" && !reduced) y = Math.abs(Math.sin(t * 4.5)) * 0.18 * Math.max(0, 1 - dt / 3);
      if (m === "bad" && !reduced) ty += Math.sin(t * 14) * 0.22 * Math.max(0, 1 - dt / 1.6);
      if (m === "unsure") tz = 0.16;
      if (!reduced) {
        // entrance: drop in from above, squash on landing
        if (life < 0.75) { const p = life / 0.75; y = 3.4 * (1 - p * p); sy = 1.08; sx = 0.94; }
        else if (life < 1.15) { const p = Math.sin(((life - 0.75) / 0.4) * Math.PI); sy = 1 - 0.16 * p; sx = 1 + 0.1 * p; }
        // poke: hop and spin
        if (poke < 0.95) { const p = poke / 0.95; y += Math.sin(p * Math.PI) * 0.75; spin = (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2) * Math.PI * 2; const sq = Math.sin(p * Math.PI * 2); sy *= 1 + 0.08 * sq; sx *= 1 - 0.05 * sq; }
      }
      root.current.rotation.y = L(root.current.rotation.y, ty, 0.08);
      root.current.rotation.x = L(root.current.rotation.x, tx, 0.08);
      root.current.rotation.z = L(root.current.rotation.z, tz, 0.08);
      body.current.rotation.y = spin;
      body.current.position.y = life < 0.75 || poke < 0.95 ? y : L(body.current.position.y, y, 0.3);
      const s = hover ? 1.04 : 1;
      body.current.scale.set(L(body.current.scale.x, s * sx, 0.35), L(body.current.scale.y, s * sy, 0.35), L(body.current.scale.z, s * sx, 0.35));
    }
    if (eyes.current) {
      if (!reduced && t > blink.current.next) { blink.current.until = t + 0.13; blink.current.next = t + (Math.random() < 0.2 ? 0.3 : 2.2 + Math.random() * 3); }
      const closed = t < blink.current.until;
      const target = closed ? 0.1 : m === "checking" ? 0.6 : happy ? 0.82 : 1;
      eyes.current.scale.y = L(eyes.current.scale.y, target, 0.4);
      // pupils follow the cursor
      eyes.current.position.x = L(eyes.current.position.x, reduced ? 0 : THREE.MathUtils.clamp(gaze.x, -1, 1) * 0.06, 0.15);
      eyes.current.position.y = L(eyes.current.position.y, -0.1 + (reduced ? 0 : THREE.MathUtils.clamp(gaze.y, -1, 1) * 0.04), 0.15);
    }
    brows.current.forEach((b, i) => {
      if (!b) return;
      const side = i === 0 ? -1 : 1; // -1 = left brow (screen left)
      let rot = 0, lift = 0;
      if (m === "bad") rot = side * 0.4;
      else if (m === "checking") { rot = side * 0.18; lift = -0.02; }
      else if (m === "unsure") { rot = i === 0 ? -0.25 : 0.05; lift = i === 0 ? 0.06 : 0; }
      else if (happy) lift = 0.05;
      b.rotation.z = L(b.rotation.z, rot, 0.2);
      b.position.y = L(b.position.y, 0.2 + lift, 0.2);
    });
    if (smile.current && open.current) {
      const frown = m === "bad";
      smile.current.rotation.z = L(smile.current.rotation.z, frown ? 0 : Math.PI, 0.2);
      smile.current.position.y = frown ? -0.4 : -0.33;
      const flat = m === "unsure" || m === "checking";
      smile.current.scale.y = L(smile.current.scale.y, happy ? 0.001 : flat ? 0.25 : 1, 0.25);
      open.current.scale.setScalar(L(open.current.scale.x, happy && !frown ? 1 : 0.001, 0.25));
    }
    cheeks.current.forEach((c) => { if (c) c.opacity = L(c.opacity, happy ? 0.95 : 0.6, 0.1); });
    if (waveArm.current && !reduced) {
      const wave = m === "idle" || happy;
      waveArm.current.rotation.z = L(waveArm.current.rotation.z, wave ? 0.9 + Math.sin(t * (happy ? 7 : 3.2)) * 0.35 : 0.35, 0.15);
    }
    if (glassArm.current && !reduced) {
      const sweep = m === "checking" ? Math.sin(t * 5) * 0.45 : m === "typing" ? 0.25 : Math.sin(t * 1.3) * 0.06;
      glassArm.current.rotation.z = L(glassArm.current.rotation.z, -0.55 + sweep, 0.2);
    }
  });

  const bodyMat = <meshPhysicalMaterial color={C.body} roughness={0.5} sheen={1} sheenColor="#fff4f0" sheenRoughness={0.5} clearcoat={0.35} clearcoatRoughness={0.4} />;
  const capMat = <meshPhysicalMaterial color={C.burgundy} roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} />;
  const ink = <meshPhysicalMaterial color={C.ink} roughness={0.15} clearcoat={1} />;

  return (
    <group ref={root} onClick={(e) => { e.stopPropagation(); live.current.pokedAt = performance.now(); onPoke?.(); }} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
      <group ref={body}>
        <mesh><capsuleGeometry args={[0.95, 0.9, 24, 64]} />{bodyMat}</mesh>
        {/* glossy capsule cap like a beanie */}
        <mesh position={[0, 0.45, 0]}><sphereGeometry args={[0.975, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />{capMat}</mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.975, 0.975, 0.3, 64, 1, true]} />{capMat}</mesh>
        <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.975, 0.035, 16, 96]} /><meshStandardMaterial color={C.rose} roughness={0.4} /></mesh>
        {/* a little stem on top, like a capsule's tip */}
        <mesh position={[0.12, 1.43, 0]} rotation={[0, 0, -0.35]}><capsuleGeometry args={[0.05, 0.16, 8, 16]} />{capMat}</mesh>
        <mesh position={[0.24, 1.55, 0]} rotation={[0.2, 0, -0.9]} scale={[1, 0.45, 0.7]}><sphereGeometry args={[0.12, 24, 24]} /><meshPhysicalMaterial color={C.success} roughness={0.35} clearcoat={0.6} /></mesh>

        {/* face */}
        <group ref={eyes} position={[0, -0.1, 0]}>
          {[-0.3, 0.3].map((x) => (
            <group key={x} position={[x, 0, 0.9]}>
              <mesh scale={[1, 1.3, 0.55]}><sphereGeometry args={[0.105, 32, 32]} />{ink}</mesh>
              <mesh position={[0.035, 0.055, 0.06]}><sphereGeometry args={[0.032, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
              <mesh position={[-0.03, -0.045, 0.06]}><sphereGeometry args={[0.014, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
            </group>
          ))}
          {[-0.3, 0.3].map((x, i) => (
            <mesh key={`b${x}`} ref={(el) => { brows.current[i] = el; }} position={[x, 0.2, 0.93]} rotation={[0, 0, 0]}>
              <capsuleGeometry args={[0.022, 0.1, 6, 12]} />
              <meshStandardMaterial color={C.burgundy} roughness={0.4} />
            </mesh>
          ))}
        </group>
        {[-0.52, 0.52].map((x, i) => (
          <mesh key={x} position={[x, -0.3, 0.8]} rotation={[0, x > 0 ? 0.55 : -0.55, 0]}>
            <circleGeometry args={[0.14, 32]} />
            <meshBasicMaterial ref={(el) => { cheeks.current[i] = el; }} color={C.blush} transparent opacity={0.6} />
          </mesh>
        ))}
        <mesh ref={smile} position={[0, -0.33, 0.93]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.1, 0.022, 12, 32, Math.PI]} />
          <meshStandardMaterial color={C.ink} />
        </mesh>
        {/* open smile for happy moments */}
        <group ref={open} position={[0, -0.3, 0.935]} scale={0.001}>
          <mesh rotation={[0, 0, Math.PI]}><circleGeometry args={[0.13, 32, 0, Math.PI]} /><meshBasicMaterial color="#3a1a23" /></mesh>
          <mesh position={[0, -0.085, 0.002]} scale={[1, 0.55, 1]}><circleGeometry args={[0.065, 24]} /><meshBasicMaterial color="#d9828f" /></mesh>
        </group>

        {/* waving arm (left of screen) with a mitten */}
        <group ref={waveArm} position={[-0.95, -0.15, 0]} rotation={[0, 0, 0.9]}>
          <mesh position={[0, 0.32, 0]}><capsuleGeometry args={[0.12, 0.38, 12, 24]} />{bodyMat}</mesh>
          <mesh position={[0, 0.66, 0]}><sphereGeometry args={[0.15, 24, 24]} />{bodyMat}</mesh>
        </group>
        {/* arm holding the magnifying glass */}
        <group ref={glassArm} position={[0.95, -0.2, 0.1]} rotation={[0, 0, -0.55]}>
          <mesh position={[0, 0.3, 0]}><capsuleGeometry args={[0.12, 0.36, 12, 24]} />{bodyMat}</mesh>
          <mesh position={[0, 0.62, 0]}><sphereGeometry args={[0.15, 24, 24]} />{bodyMat}</mesh>
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
    </group>
  );
}

function Scene({ reduced, mood, onPoke, compact, live }: { reduced: boolean; mood: Mood; onPoke?: () => void; compact: boolean; live: React.MutableRefObject<Live> }) {
  const speed = reduced ? 0 : 1;
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff6f0", C.blush, 0.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <directionalLight position={[-4, 2, -2]} intensity={0.6} color={C.pale} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="circle" intensity={1.4} position={[-4, 1, 2]} scale={3} color="#ffe9e2" />
        <Lightformer form="rect" intensity={0.8} position={[4, -1, 3]} scale={[3, 3, 1]} color={C.pale} />
      </Environment>

      <Float speed={1.3 * speed} rotationIntensity={0.12 * speed} floatIntensity={0.45 * speed}>
        <group position={[0, 0.05, 0]} scale={0.95}>
          <Vee reduced={reduced} mood={mood} onPoke={onPoke} live={live} />
        </group>
      </Float>

      {!compact && <>
      <Float speed={1.8 * speed} rotationIntensity={1.2 * speed} floatIntensity={1 * speed}>
        <group position={[1.15, 1.95, -2.2]} rotation={[0.3, 0.2, 0.8]} scale={0.8}><Molecule /></group>
      </Float>
      <Float speed={2.2 * speed} rotationIntensity={1.6 * speed} floatIntensity={1.2 * speed}>
        <group position={[-1.35, -1.25, -1.4]} rotation={[0.4, 0, -0.9]}><Pill scale={0.95} /></group>
      </Float>
      <Float speed={1.9 * speed} rotationIntensity={1.4 * speed} floatIntensity={1 * speed}>
        <group position={[1.55, -0.55, -1.8]} rotation={[0.2, 0.3, 0.6]}><Pill scale={0.7} top={C.rose} bottom={C.pale} /></group>
      </Float>
      </>}

      <ContactShadows position={[0, -1.62, 0]} opacity={0.32} scale={7} blur={2.6} far={3.4} color={C.burgundy} />
    </>
  );
}

/**
 * `mood` drives Vee's reaction; `onPoke` makes Vee clickable; `compact` hides the floating props (small placements);
 * `focus` (-1 left … 1 right) turns Vee toward something on the page; Vee's eyes follow the cursor anywhere on the page.
 */
export default function HeroScene({ mood = "idle", onPoke, compact = false, focus = null }: { mood?: Mood; onPoke?: () => void; compact?: boolean; focus?: number | null }) {
  const reduced = usePrefersReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const live = useRef<Live>({ gaze: { x: 0, y: 0 }, pokedAt: 0, focus: null, hover: false });
  useEffect(() => { live.current.focus = focus; }, [focus]);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      live.current.gaze = { x: THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.6, 1.6), y: THREE.MathUtils.clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1.6, 1.6) };
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={box} className="relative h-full w-full" aria-hidden="true">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.1, compact ? 7.6 : 9.6], fov: 32 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <Scene reduced={reduced} mood={mood} onPoke={onPoke} compact={compact} live={live} />
      </Canvas>
    </div>
  );
}
