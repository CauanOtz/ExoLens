import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ModelProps {
  distance?: number;
  height?: number | string;
  controls?: boolean;
  modelUrl?: string;
}

export default function NeptuneModel({ distance = 12, height = '100%', controls = true, modelUrl }: ModelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let w = container.clientWidth || 400;
    let h = typeof height === 'number' ? height : (container.clientHeight || 400);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, w / Math.max(1, h), 0.01, 5000);
    camera.position.set(0, 0, distance);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(50, 50, 80);
    scene.add(dir);

    if (controls) {
      controlsRef.current = new OrbitControls(camera, renderer.domElement);
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.08;
      controlsRef.current.enablePan = false;
      controlsRef.current.enableZoom = true;
    }

    const loader = new GLTFLoader();
    const local = new URL('../../assets/neptune/Neptune_1_49528.glb', import.meta.url).href;
    const effective = (modelUrl && modelUrl.length > 0) ? modelUrl : local;
    let disposed = false;

    loader.load(
      effective,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) return;
        modelRef.current = root;
        const box = new THREE.Box3().setFromObject(root);
        const sph = new THREE.Sphere();
        box.getBoundingSphere(sph);
        root.position.x -= sph.center.x;
        root.position.y -= sph.center.y;
        root.position.z -= sph.center.z;
        const scaleFactor = 1 / Math.max(1e-6, sph.radius) * 6;
        root.scale.setScalar(scaleFactor);
        root.position.z = -distance;

        const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
        root.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: any) => {
              if (!m) return;
              ['map','roughnessMap','normalMap','aoMap','emissiveMap'].forEach((k:any) => {
                const tex = m[k];
                if (tex && tex.isTexture) {
                  try { (tex as any).encoding = (THREE as any).sRGBEncoding; } catch {}
                  try { tex.anisotropy = maxAniso; } catch {}
                  tex.needsUpdate = true;
                }
              });
              if (m.needsUpdate !== undefined) m.needsUpdate = true;
            });
          }
        });

        scene.add(root);
      },
      (xhr) => { if (xhr && xhr.lengthComputable) console.debug(`[NeptuneModel] load ${Math.round((xhr.loaded / xhr.total) * 100)}%`); },
      (err) => { console.warn('[NeptuneModel] failed to load', err); }
    );

    // pointer rotation
    let down = false; let lx = 0, ly = 0;
    const el = renderer.domElement;
    const onDown = (ev: PointerEvent) => { down = true; lx = ev.clientX; ly = ev.clientY; try { el.setPointerCapture?.((ev as any).pointerId); } catch {} if (controlsRef.current) controlsRef.current.enableRotate = false; };
    const onMove = (ev: PointerEvent) => { if (!down) return; const dx = ev.clientX - lx; const dy = ev.clientY - ly; lx = ev.clientX; ly = ev.clientY; const r = modelRef.current as any; if (r) { r.rotation.y += dx * 0.006; r.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, r.rotation.x + dy * 0.006)); } };
    const onUp = (ev: PointerEvent) => { down = false; try { el.releasePointerCapture?.((ev as any).pointerId); } catch {} if (controlsRef.current) controlsRef.current.enableRotate = true; };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    const animate = () => { rafRef.current = requestAnimationFrame(animate); controlsRef.current?.update(); renderer.render(scene, camera); };
    animate();

    const ro = new ResizeObserver(() => { const ww = container.clientWidth; const hh = container.clientHeight; if (ww < 1 || hh < 1) return; camera.aspect = ww / hh; camera.updateProjectionMatrix(); renderer.setSize(ww, hh, false); });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      controlsRef.current?.dispose?.();
      try { el.removeEventListener('pointerdown', onDown); } catch {}
      try { window.removeEventListener('pointermove', onMove); } catch {}
      try { window.removeEventListener('pointerup', onUp); } catch {}
      try { window.removeEventListener('pointercancel', onUp); } catch {}
      try {
        if (modelRef.current) {
          scene.remove(modelRef.current);
          modelRef.current.traverse((obj: any) => {
            if (obj.isMesh) {
              obj.geometry?.dispose?.();
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              mats.forEach((m: any) => { if (m && typeof m.dispose === 'function') m.dispose(); });
            }
          });
        }
      } catch (e) {}
      disposed = true;
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [distance, height, controls, modelUrl]);

  return <div ref={containerRef} style={{ width: '100%', height, position: 'relative' }} />;
}
