import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Import estático do loader/controls para evitar falhas de caminho (já que agora adicionamos three ao package.json)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SunModelProps {
  modelUrl?: string;
  modelPath?: string;
  distance?: number;
  height?: number | string;
  controls?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export default function SunModel({ modelUrl, modelPath, distance = 8, height = '100%', controls = false, autoRotate = false, autoRotateSpeed = 0.02 }: SunModelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRootRef = useRef<THREE.Object3D | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let heightPx = typeof height === 'number' ? height : container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / Math.max(1, heightPx), 0.01, 5000);
    camera.position.set(0, 0, distance);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, heightPx, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(50, 50, 80);
    scene.add(dir);

    if (controls) {
      controlsRef.current = new OrbitControls(camera, renderer.domElement);
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.08;
      controlsRef.current.enablePan = false;
      controlsRef.current.minDistance = 1;
      controlsRef.current.maxDistance = 1000;
    }

    // pointer-driven model rotation (rotate loaded model)
    let isPointerDown = false;
    let lastX = 0;
    let lastY = 0;
    const el = renderer.domElement;
    const onPointerDown = (ev: PointerEvent) => { isPointerDown = true; lastX = ev.clientX; lastY = ev.clientY; try { el.setPointerCapture?.((ev as any).pointerId); } catch {}; if (controlsRef.current) controlsRef.current.enableRotate = false; };
    const onPointerMove = (ev: PointerEvent) => {
      if (!isPointerDown) return;
      const dx = ev.clientX - lastX; const dy = ev.clientY - lastY; lastX = ev.clientX; lastY = ev.clientY;
      const root = modelRootRef.current;
      if (root) {
        root.rotation.y += dx * 0.006;
        root.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, root.rotation.x + dy * 0.006));
      }
    };
    const onPointerUp = (ev: PointerEvent) => { isPointerDown = false; try { el.releasePointerCapture?.((ev as any).pointerId); } catch {}; if (controlsRef.current) controlsRef.current.enableRotate = true; };
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const loader = new GLTFLoader();
    const nasaUrl = 'https://solarsystem.nasa.gov/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBblVRIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--abda6331ea1271cb16bf7b8b08f42b0ad49115b2/Sun_1_1391000.glb?disposition=inline';
    const defaultLocal = new URL('../../assets/sun/Sun_1_1391000.glb', import.meta.url).href;
    const effectiveUrl = (modelPath && modelPath.length > 0) ? modelPath : (modelUrl && modelUrl.length > 0) ? modelUrl : (nasaUrl || defaultLocal);
    let disposed = false;

    loader.load(
      effectiveUrl,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) return;
        modelRootRef.current = root;
        // center and scale similar to EarthModel
        const box = new THREE.Box3().setFromObject(root);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        root.position.x -= sphere.center.x;
        root.position.y -= sphere.center.y;
        root.position.z -= sphere.center.z;

        // scale to reasonable world units based on sphere radius
        const scaleFactor = 1 / Math.max(1e-6, sphere.radius) * 6; // make radius ~6 units
        root.scale.setScalar(scaleFactor);
        // then place root at -distance on Z so it sits farther away visually
        root.position.z = -distance;

        // Improve texture quality: sRGB encoding and anisotropy
        const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
        root.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: any) => {
              if (!m) return;
              ['map','roughnessMap','metalnessMap','normalMap','aoMap','emissiveMap'].forEach((k:any) => {
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
      // progress
      (xhr) => { if (xhr && xhr.lengthComputable) console.debug(`[SunModel] load ${Math.round((xhr.loaded / xhr.total) * 100)}%`); },
      (err) => {
        console.warn('[SunModel] failed to load', err);
      }
    );

    // Loop de animação
    const clock = new THREE.Clock();
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      if (mixerRef.current) mixerRef.current.update(dt);
      if (autoRotate && modelRootRef.current) {
        modelRootRef.current.rotation.y += autoRotateSpeed * dt;
      }
      controlsRef.current?.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer mais robusto
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      controlsRef.current?.dispose();
      mixerRef.current?.stopAllAction();
      // Dispose resources
      scene.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            if (m && typeof m.dispose === 'function') m.dispose();
          });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, modelPath, distance, controls, height]);

  return <div ref={containerRef} style={{ width: '100%', height: height, position: 'relative' }} />;
}
