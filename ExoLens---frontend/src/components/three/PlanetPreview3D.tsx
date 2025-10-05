import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// OrbitControls lives in the examples directory; import with ts-ignore for compatibility
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import EarthModel from './EarthModel';
import JupiterModel from './JupiterModel';
import SunModel from './SunModel';
import MarsModel from './MarsModel';
import MercuryModel from './MercuryModel';
import NeptuneModel from './NeptuneModel';
import SaturnModel from './SaturnModel';
const earthIcon = new URL('../../assets/earth.svg', import.meta.url).href;

interface PlanetPreviewProps {
  color?: string;
  radius?: number;
  composition?: 'rocky' | 'gaseous' | 'icy';
}

export default function PlanetPreview3D({ color = '#c66', radius = 1, composition = 'rocky' }: PlanetPreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [preset, setPreset] = useState<'custom' | 'earth' | 'jupiter' | 'sun' | 'mars' | 'mercury' | 'neptune' | 'saturn'>('custom');
  const [internalColor, setInternalColor] = useState(color);
  const [internalRadius, setInternalRadius] = useState(radius);
  const [internalComposition, setInternalComposition] = useState<typeof composition>(composition);

  useEffect(() => {
    // apply preset values
    if (preset === 'earth') {
      setInternalColor('#2a66d6');
      setInternalRadius(1.0);
      setInternalComposition('rocky');
    } else {
      setInternalColor(color);
      setInternalRadius(radius);
      setInternalComposition(composition);
    }
  }, [preset, color, radius, composition]);

  useEffect(() => {
    const mount = mountRef.current;
    // if showing the external Earth model, don't initialize the canvas-based preview
    if (preset === 'earth') return;
    if (!mount) return;

  const width = mount.clientWidth || 400;
  const height = mount.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, Math.max(3, radius * 3.5));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // lights
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 5, 5);
    scene.add(dir);

  // planet
  const geometry = new THREE.SphereGeometry(internalRadius, 64, 64);
  let material: THREE.Material | null = null;
  // keep track of any generated texture(s) so we can dispose
  let generatedTexture: THREE.Texture | null = null;
  let generatedBump: THREE.Texture | null = null;
  let atmosphere: THREE.Mesh | null = null;
  let sheenMesh: THREE.Mesh | null = null;

  const makeGasTexture = (base = internalColor) => {
      const w = 2048;
      const h = 1024;
      const cvs = document.createElement('canvas');
      cvs.width = w; cvs.height = h;
      const ctx = cvs.getContext('2d')!;
      // smooth vertical base gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, base);
      g.addColorStop(1, '#ffffff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // layered bands with slight blur-like effect by drawing many thin translucent strokes
      ctx.globalCompositeOperation = 'source-over';
      const bands = 12 + Math.floor(Math.random() * 8);
      for (let i = 0; i < bands; i++) {
        const bandY = (i / bands) * h;
        const amplitude = 12 + Math.random() * 36;
        const thickness = 6 + Math.random() * 24;
        // draw a wavy band across the width
        ctx.beginPath();
        for (let x = 0; x < w; x += 4) {
          const t = x / w * Math.PI * 2 * (1 + Math.random() * 0.5);
          const y = bandY + Math.sin(t + i) * (amplitude * (0.5 + Math.random() * 0.6));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = thickness;
        const r = Math.floor(Math.random() * 60 + 40);
        const gcol = Math.floor(Math.random() * 60 + 40);
        const b = Math.floor(Math.random() * 60 + 40);
        ctx.strokeStyle = `rgba(${r},${gcol},${b},${0.06 + Math.random() * 0.18})`;
        ctx.stroke();
  }

      // add subtle noise overlay for turbulence
      const img = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 16; // small noise
        img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
        img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
        img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
      }
      ctx.putImageData(img, 0, 0);

  const tx = new THREE.CanvasTexture(cvs);
      tx.wrapS = THREE.RepeatWrapping;
      tx.wrapT = THREE.RepeatWrapping;
      tx.repeat.set(2, 1);
      tx.needsUpdate = true;
      (tx as any).encoding = (THREE as any).sRGBEncoding;
      return tx;
    };

    if (internalComposition === 'gaseous') {
      generatedTexture = makeGasTexture(internalColor);
      material = new THREE.MeshStandardMaterial({ map: generatedTexture, roughness: 0.5, metalness: 0.02 });
      // soft atmosphere (thicker for gas giants)
      const atmosphereMat = new THREE.MeshBasicMaterial({ color: internalColor, transparent: true, opacity: 0.08, side: THREE.BackSide });
      atmosphere = new THREE.Mesh(new THREE.SphereGeometry(internalRadius * 1.08, 36, 36), atmosphereMat);
      scene.add(atmosphere);
    } else if (internalComposition === 'icy') {
      // icy: bluish, more specular, subtle gloss map generated from canvas
      const cvs = document.createElement('canvas');
      cvs.width = 1024; cvs.height = 1024;
      const ctx = cvs.getContext('2d')!;
      // base gradient cooler tone
  const g = ctx.createLinearGradient(0, 0, 0, cvs.height);
  g.addColorStop(0, internalColor);
      g.addColorStop(1, '#cfefff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, cvs.width, cvs.height);
      // subtle speckles and vein-like scratches
      for (let i = 0; i < 2500; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.14})`;
        ctx.fillRect(Math.random() * cvs.width, Math.random() * cvs.height, 1, 1);
      }
      // faint veins
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#ffffff';
      for (let v = 0; v < 20; v++) {
        ctx.beginPath();
        const startY = Math.random() * cvs.height;
        ctx.moveTo(0, startY);
        for (let x = 0; x < cvs.width; x += 40) {
          ctx.lineTo(x, startY + Math.sin(x * 0.01 + v) * (6 + Math.random() * 12));
        }
        ctx.stroke();
      }
  generatedTexture = new THREE.CanvasTexture(cvs);
      generatedTexture.wrapS = generatedTexture.wrapT = THREE.RepeatWrapping;
      generatedTexture.repeat.set(1, 1);
      (generatedTexture as any).encoding = (THREE as any).sRGBEncoding;
      // use as both color map and slight bump for icy detail
      generatedBump = generatedTexture.clone();
      generatedBump.needsUpdate = true;
      material = new THREE.MeshStandardMaterial({ map: generatedTexture, color: internalColor, roughness: 0.18, metalness: 0.03, bumpMap: generatedBump, bumpScale: 0.02 });
      // thin ice sheen layer
      const sheen = new THREE.MeshStandardMaterial({ color: '#eaf6ff', transparent: true, opacity: 0.09, roughness: 0.08, metalness: 0.0 });
      sheenMesh = new THREE.Mesh(new THREE.SphereGeometry(internalRadius * 1.02, 32, 32), sheen);
      scene.add(sheenMesh);
    } else {
      // rocky: create a canvas-based marbled texture
      const cvs = document.createElement('canvas');
      cvs.width = 1024; cvs.height = 1024;
      const ctx = cvs.getContext('2d')!;
      // base
  const bg = ctx.createLinearGradient(0, 0, cvs.width, cvs.height);
  bg.addColorStop(0, internalColor);
      bg.addColorStop(1, '#7a5b49');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      // blotches
      for (let i = 0; i < 80; i++) {
        const rx = Math.random() * cvs.width;
        const ry = Math.random() * cvs.height;
        const rr = 20 + Math.random() * 120;
        const rg = ctx.createRadialGradient(rx, ry, rr * 0.1, rx, ry, rr);
        const rc = `rgba(${100 + Math.floor(Math.random() * 80)}, ${60 + Math.floor(Math.random() * 80)}, ${40 + Math.floor(Math.random() * 80)}, ${0.08 + Math.random() * 0.25})`;
        rg.addColorStop(0, rc);
        rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg;
        ctx.fillRect(rx - rr, ry - rr, rr * 2, rr * 2);
      }
      // tiny noise
      const img = ctx.getImageData(0, 0, cvs.width, cvs.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 24;
        img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
        img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
        img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
      }
      ctx.putImageData(img, 0, 0);
  generatedTexture = new THREE.CanvasTexture(cvs);
      generatedTexture.wrapS = generatedTexture.wrapT = THREE.RepeatWrapping;
      generatedTexture.repeat.set(1, 1);
      (generatedTexture as any).encoding = (THREE as any).sRGBEncoding;
      material = new THREE.MeshStandardMaterial({ map: generatedTexture, roughness: 0.7, metalness: 0.02 });
    }

  const sphere = new THREE.Mesh(geometry, material!);
  scene.add(sphere);

  // controls (only rotate on drag)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      // if shader material wants time, update it
      if ((material as any)?.uniforms?.time) {
        (material as any).uniforms.time.value += 0.016;
      }
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
      controls.dispose();

      // remove objects
      try {
        if (atmosphere) {
          scene.remove(atmosphere);
          // @ts-ignore
          if (atmosphere.material) atmosphere.material.dispose();
          (atmosphere.geometry as THREE.BufferGeometry)?.dispose();
        }
        if (sheenMesh) {
          scene.remove(sheenMesh);
          // @ts-ignore
          if (sheenMesh.material) sheenMesh.material.dispose();
          (sheenMesh.geometry as THREE.BufferGeometry)?.dispose();
        }
        scene.remove(sphere);
        (sphere.geometry as THREE.BufferGeometry)?.dispose();
        // dispose generated textures
        if (generatedTexture) generatedTexture.dispose();
        if (generatedBump) generatedBump.dispose();
        // dispose material
        if (material) {
          // @ts-ignore
          if (material.dispose) material.dispose();
        }
      } catch (e) {
        // swallow disposal errors
      }

      renderer.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [internalColor, internalRadius, internalComposition, preset]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {preset === 'earth' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <EarthModel modelPath={undefined} distance={12} height={'100%'} controls={true} />
        </div>
      ) : preset === 'jupiter' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <JupiterModel distance={12} height={'100%'} controls={true} />
        </div>
      ) : preset === 'sun' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <SunModel height={'100%'} controls={true} />
        </div>
      ) : preset === 'mars' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <MarsModel distance={12} height={'100%'} controls={true} />
        </div>
      ) : preset === 'mercury' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <MercuryModel distance={12} height={'100%'} controls={true} />
        </div>
      ) : preset === 'neptune' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <NeptuneModel distance={12} height={'100%'} controls={true} />
        </div>
      ) : preset === 'saturn' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <SaturnModel distance={12} height={'100%'} controls={true} />
        </div>
      ) : (
        <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />
      )}
      <div style={{ position: 'absolute', right: 16, top: 16, width: 200, background: 'rgba(18,20,24,0.52)', color: '#fff', padding: '12px', borderRadius: 12, fontSize: 13, backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(2,6,23,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <img src={earthIcon} alt="Terra" style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.02)', padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Ver planetas</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Preview interativo</div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={() => setPreset('earth')} aria-pressed={preset === 'earth'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: preset === 'earth' ? 'linear-gradient(180deg,#2a66d6,#1e4fb8)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <img src={earthIcon} alt="" style={{ width: 18, height: 18, opacity: 0.98 }} />
            <span style={{ fontWeight: 600 }}>Terra</span>
          </button>
          <button onClick={() => setPreset('jupiter')} aria-pressed={preset === 'jupiter'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: preset === 'jupiter' ? 'linear-gradient(180deg,#d8a24a,#b87f2a)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ width: 18, height: 18, display: 'inline-block', borderRadius: 4, background: 'linear-gradient(90deg,#e1b07a,#d38a2f)' }} />
            <span style={{ fontWeight: 600 }}>Júpiter</span>
          </button>
          <button onClick={() => setPreset('sun')} aria-pressed={preset === 'sun'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: preset === 'sun' ? 'linear-gradient(180deg,#ffd07a,#ffb36b)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ width: 18, height: 18, display: 'inline-block', borderRadius: 18, background: 'radial-gradient(circle at 30% 30%, #fff7df, #ffd07a 40%, #ffb36b 70%)', boxShadow: '0 6px 18px rgba(255,150,50,0.6)' }} />
            <span style={{ fontWeight: 600 }}>Sol</span>
          </button>
          <button onClick={() => setPreset('mars')} aria-pressed={preset === 'mars'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: preset === 'mars' ? 'linear-gradient(180deg,#d86b4a,#b84f32)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ width: 18, height: 18, display: 'inline-block', borderRadius: 4, background: 'linear-gradient(90deg,#d96b4a,#b84f32)' }} />
            <span style={{ fontWeight: 600 }}>Marte</span>
          </button>
          <button onClick={() => setPreset('mercury')} aria-pressed={preset === 'mercury'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: preset === 'mercury' ? 'linear-gradient(180deg,#cfcfcf,#bdbdbd)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ width: 18, height: 18, display: 'inline-block', borderRadius: 4, background: 'linear-gradient(90deg,#e6e6e6,#bdbdbd)' }} />
            <span style={{ fontWeight: 600 }}>Mercúrio</span>
          </button>
          <button onClick={() => setPreset('neptune')} aria-pressed={preset === 'neptune'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: preset === 'neptune' ? 'linear-gradient(180deg,#6fb3ff,#2e88ff)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ width: 18, height: 18, display: 'inline-block', borderRadius: 4, background: 'linear-gradient(90deg,#8bd0ff,#2e88ff)' }} />
            <span style={{ fontWeight: 600 }}>Netuno</span>
          </button>
          <button onClick={() => setPreset('saturn')} aria-pressed={preset === 'saturn'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: preset === 'saturn' ? 'linear-gradient(180deg,#e8d6b0,#caa86f)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ width: 18, height: 18, display: 'inline-block', borderRadius: 4, background: 'linear-gradient(90deg,#f0e0b8,#caa86f)' }} />
            <span style={{ fontWeight: 600 }}>Saturno</span>
          </button>
          <button onClick={() => setPreset('custom')} aria-pressed={preset === 'custom'} style={{ padding: '8px 10px', borderRadius: 8, background: preset === 'custom' ? 'rgba(255,255,255,0.04)' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>Custom</button>
        </div>
      </div>
    </div>
  );
}
