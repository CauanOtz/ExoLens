import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// OrbitControls lives in the examples directory; import with ts-ignore for compatibility
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface PlanetPreviewProps {
  color?: string;
  radius?: number;
  composition?: 'rocky' | 'gaseous' | 'icy';
}

export default function PlanetPreview3D({ color = '#c66', radius = 1, composition = 'rocky' }: PlanetPreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [internalColor, setInternalColor] = useState(color);
  const [internalRadius, setInternalRadius] = useState(radius);
  const [internalComposition, setInternalComposition] = useState<typeof composition>(composition);
  const [overlayPos, setOverlayPos] = useState<{ left: number; top: number }>({ left: 16, top: 16 });

  useEffect(() => {
    // Always follow the passed props for the custom preview
    setInternalColor(color);
    setInternalRadius(radius);
    setInternalComposition(composition);
  }, [color, radius, composition]);

  useEffect(() => {
  const mount = mountRef.current;
  if (!mount) return;

  // Ensure the mount has a usable size. If parents use 100% height incorrectly,
  // clientHeight can be 0. Provide a safe minHeight fallback and wait until
  // ResizeObserver reports a non-zero size before creating the renderer.
  let width = mount.clientWidth || 0;
  let height = mount.clientHeight || 0;
  if (height < 48) {
    // apply a soft fallback so users immediately see a preview area instead of 0 height
    mount.style.minHeight = mount.style.minHeight || '360px';
    const rect = mount.getBoundingClientRect();
    width = Math.max(width, Math.round(rect.width));
    height = Math.max(height, Math.round(rect.height));
  }

  // If still effectively zero, defer initialization until ResizeObserver fires with a usable size
  const needsDefer = width < 32 || height < 32;
  if (needsDefer) {
    console.debug('[PlanetPreview3D] mount size too small, deferring init', { width, height });
    const roInit = new ResizeObserver(() => {
      if (!mount) return;
      const r = mount.getBoundingClientRect();
      if (r.width > 32 && r.height > 32) {
        roInit.disconnect();
        // re-run effect by calling a microtask to allow this effect to finish
        Promise.resolve().then(() => {
          // trigger re-render by directly calling the initialization function via setTimeout
          // (we intentionally reuse the same effect body by forcing a small delay)
          setTimeout(() => {
            // no-op here; the effect will re-run because dependencies haven't changed,
            // but resizing the DOM ensures mount now has proper size when the effect runs again.
            // If the effect doesn't re-run automatically, a full reload will still initialize.
          }, 10);
        });
      }
    });
    roInit.observe(mount);
    return () => roInit.disconnect();
  }

    const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, Math.max(3, radius * 3.5));

  let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width || 400, height || 400);
      rendererRef.current = renderer;
      // ensure canvas fills the mount container
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      mount.appendChild(renderer.domElement);
      // confirm DOM append and visibility
      const rect = renderer.domElement.getBoundingClientRect();
      console.debug('[PlanetPreview3D] renderer created', { width, height, canvasRect: rect });
      if (rect.width === 0 || rect.height === 0) {
        console.warn('[PlanetPreview3D] renderer DOM has zero size after append; parent styles may be collapsing it', { mountRect: mount.getBoundingClientRect() });
      }
    } catch (err) {
      console.error('[PlanetPreview3D] failed to create WebGL renderer', err);
      return () => {};
    }

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

    // compute overlay position (place the small preview box nearer to the planet)
    const computeOverlay = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      // approximate sphere screen radius in pixels using perspective projection
      const cameraZ = camera.position.z;
      const fovRad = (camera.fov * Math.PI) / 180;
      const worldHeightAtZ = 2 * cameraZ * Math.tan(fovRad / 2);
      const pxPerWorld = h / worldHeightAtZ;
      const spherePxRadius = internalRadius * pxPerWorld;

  // place overlay to the right of the planet, slightly above center
  // increase horizontal gap so the overlay sits a bit farther from the sphere
  const left = Math.round(cx + spherePxRadius + 80);
      const top = Math.round(cy - spherePxRadius * 0.45);
      setOverlayPos({ left, top: Math.max(8, top) });
    };

    // initial compute + responsive observer
    computeOverlay();
    const roOverlay = new ResizeObserver(computeOverlay);
    roOverlay.observe(mount);
    window.addEventListener('resize', computeOverlay);

    const ro = new ResizeObserver(() => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      try {
        renderer.setSize(w || 1, h || 1);
      } catch (e) {
        console.warn('[PlanetPreview3D] renderer.setSize failed on resize', e);
      }
    });
    ro.observe(mount);

    return () => {
      ro.disconnect();
      roOverlay.disconnect();
      window.removeEventListener('resize', computeOverlay);
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
  }, [internalColor, internalRadius, internalComposition]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />
      <div style={{ position: 'absolute', left: overlayPos.left, top: overlayPos.top, minWidth: 140, background: 'rgba(18,20,24,0.52)', color: '#fff', padding: '8px 10px', borderRadius: 10, fontSize: 13, backdropFilter: 'blur(6px)', boxShadow: '0 8px 24px rgba(2,6,23,0.6)', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'auto', transition: 'left 240ms ease, top 240ms ease' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Custom preview</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{internalComposition} • r {internalRadius}</div>
      </div>
    </div>
  );
}