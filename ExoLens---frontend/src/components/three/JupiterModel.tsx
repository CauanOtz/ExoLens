import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface JupiterModelProps {
  distance?: number;
  height?: number | string;
  controls?: boolean;
  modelUrl?: string;
}

export default function JupiterModel({ distance = 12, height = '100%', controls = true, modelUrl }: JupiterModelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
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

    // Load GLB model for Jupiter. Prefer an explicit modelUrl prop if passed,
    // otherwise try the NASA CDN URL (public) and finally fall back to local asset.
    const loader = new GLTFLoader();
    const nasaUrl = 'https://solarsystem.nasa.gov/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBdDRRIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--a6aec8a66b65f7cc0251efbb84d424e7348718a6/Jupiter_1_142984.glb?disposition=inline';
  const effective = (modelUrl && modelUrl.length > 0) ? modelUrl : (nasaUrl || new URL('../../assets/jupiter/Jupiter_1_142984.glb', import.meta.url).href);
    let disposed = false;
    loader.load(
      effective,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) return;
        // center and scale
        const box = new THREE.Box3().setFromObject(root);
        const sph = new THREE.Sphere();
        box.getBoundingSphere(sph);
        root.position.x -= sph.center.x;
        root.position.y -= sph.center.y;
        root.position.z -= sph.center.z;

        // scale to reasonable size
        const scaleFactor = 1 / Math.max(1e-6, sph.radius) * 6;
        root.scale.setScalar(scaleFactor);
        // place at negative z so it appears further away
        root.position.z = -distance;

        // Improve texture quality: ensure sRGB encoding and anisotropy where applicable
        const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
        root.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: any) => {
              if (!m) return;
              // handle color/metalness/roughness textures
              ['map','roughnessMap','metalnessMap','normalMap','aoMap','emissiveMap'].forEach((k:any) => {
                const tex = m[k];
                if (tex && tex.isTexture) {
                  try {
                    (tex as any).encoding = (THREE as any).sRGBEncoding;
                  } catch {}
                  try { tex.anisotropy = maxAniso; } catch {}
                  tex.needsUpdate = true;
                }
              });
              if (m.needsUpdate !== undefined) m.needsUpdate = true;
            });
          }
        });
        sphereRef.current = root as any;
        scene.add(root);
      },
      // progress callback
      (xhr) => {
        if (xhr && xhr.lengthComputable) {
          // lightweight progress logging; you can hook this to a spinner/UI
          console.debug(`[JupiterModel] load ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
        }
      },
      (err) => {
        console.warn('[JupiterModel] failed to load', err);
      }
    );

    // pointer-driven model rotation (rotate loaded model)
    let down = false; let lastX = 0, lastY = 0;
    const el = renderer.domElement;
    const onDown = (ev: PointerEvent) => { down = true; lastX = ev.clientX; lastY = ev.clientY; try { el.setPointerCapture?.((ev as any).pointerId); } catch {} if (controlsRef.current) controlsRef.current.enableRotate = false; };
    const onMove = (ev: PointerEvent) => {
      if (!down) return;
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;
      lastX = ev.clientX; lastY = ev.clientY;
      const root = sphereRef.current as any;
      if (root) {
        root.rotation.y += dx * 0.006;
        root.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, root.rotation.x + dy * 0.006));
      }
    };
    const onUp = (ev: PointerEvent) => { down = false; try { el.releasePointerCapture?.((ev as any).pointerId); } catch {} if (controlsRef.current) controlsRef.current.enableRotate = true; };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    const animate = () => { rafRef.current = requestAnimationFrame(animate); controlsRef.current?.update(); renderer.render(scene, camera); };
    animate();

    const ro = new ResizeObserver(() => {
      const ww = container.clientWidth; const hh = container.clientHeight; if (ww < 1 || hh < 1) return; camera.aspect = ww/ hh; camera.updateProjectionMatrix(); renderer.setSize(ww, hh, false);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      controlsRef.current?.dispose?.();
      // cleanup
      try {
        el.removeEventListener('pointerdown', onDown);
      } catch {}
      try { window.removeEventListener('pointermove', onMove); } catch {}
      try { window.removeEventListener('pointerup', onUp); } catch {}
      try { window.removeEventListener('pointercancel', onUp); } catch {}
      try {
        // dispose loaded model resources
        if (sphereRef.current) {
          scene.remove(sphereRef.current);
          sphereRef.current.traverse((obj: any) => {
            if (obj.isMesh) {
              obj.geometry?.dispose?.();
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              mats.forEach((m: any) => { if (m && typeof m.dispose === 'function') m.dispose(); });
            }
          });
        }
        disposed = true;
      } catch {}
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [distance, height, controls]);

  return <div ref={containerRef} style={{ width: '100%', height, position: 'relative' }} />;
}
