import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface EarthModelProps {
  modelUrl?: string;
  modelPath?: string;
  distance?: number; // distance from origin on Z axis (positive = further away)
  height?: number | string;
  controls?: boolean;
}

export default function EarthModel({ modelUrl, modelPath, distance = 120, height = 520, controls = false }: EarthModelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
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

    // allow dragging to rotate the model itself (rather than orbiting the camera)
    let isPointerDown = false;
    let lastX = 0;
    let lastY = 0;
    const el = renderer.domElement;
    const onPointerDown = (ev: PointerEvent) => {
      // only use primary button / single touch
      isPointerDown = true;
      lastX = ev.clientX;
      lastY = ev.clientY;
      try { el.setPointerCapture?.((ev as any).pointerId); } catch {}
      // temporarily disable orbit rotate while we manually rotate the model
      if (controlsRef.current) controlsRef.current.enableRotate = false;
    };
    const onPointerMove = (ev: PointerEvent) => {
      if (!isPointerDown) return;
      const mx = ev.clientX;
      const my = ev.clientY;
      const dx = mx - lastX;
      const dy = my - lastY;
      lastX = mx; lastY = my;
      const root = modelRootRef.current;
      if (root) {
        // rotate around Y for horizontal drags, X for vertical drags (limited)
        const sensitivity = 0.006;
        root.rotation.y += dx * sensitivity;
        root.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, root.rotation.x + dy * sensitivity));
      }
    };
    const onPointerUp = (ev: PointerEvent) => {
      isPointerDown = false;
      try { el.releasePointerCapture?.((ev as any).pointerId); } catch {}
      if (controlsRef.current) controlsRef.current.enableRotate = true;
    };
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const loader = new GLTFLoader();
    const effectiveUrl = modelPath ? modelPath : (modelUrl || new URL('../../assets/earth/Earth_1_12756.glb', import.meta.url).href);
    let disposed = false;

    loader.load(
      effectiveUrl,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) return;
        modelRootRef.current = root;
        // center and scale
        const box = new THREE.Box3().setFromObject(root);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        root.position.x -= sphere.center.x;
        root.position.y -= sphere.center.y;
        root.position.z -= sphere.center.z;

        // move model to desired distance along Z
        root.position.z = 0; // keep internal origin
        // scale to reasonable world units based on sphere radius
        const scaleFactor = 1 / Math.max(1e-6, sphere.radius) * 6; // make radius ~6 units
        root.scale.setScalar(scaleFactor);
        // then place root at -distance on Z so it sits farther away visually
        root.position.z = -distance;

        root.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
            if (obj.material) obj.material.needsUpdate = true;
          }
        });
        scene.add(root);
      },
      undefined,
      (err) => {
        console.warn('[EarthModel] failed to load', err);
      }
    );

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      controlsRef.current?.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    ro.observe(container);

    return () => {
      disposed = true;
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      controlsRef.current?.dispose();
      // remove pointer handlers
      try {
        el.removeEventListener('pointerdown', onPointerDown);
      } catch {}
      try { window.removeEventListener('pointermove', onPointerMove); } catch {}
      try { window.removeEventListener('pointerup', onPointerUp); } catch {}
      try { window.removeEventListener('pointercancel', onPointerUp); } catch {}
      // dispose scene resources
      try {
        if (modelRootRef.current) {
          scene.remove(modelRootRef.current);
          modelRootRef.current.traverse((obj: any) => {
            if (obj.isMesh) {
              obj.geometry?.dispose?.();
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              mats.forEach((m: any) => { if (m && typeof m.dispose === 'function') m.dispose(); });
            }
          });
        }
      } catch (e) { /* ignore */ }
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [modelUrl, modelPath, distance, controls, height]);

  return <div ref={containerRef} style={{ width: '100%', height, position: 'relative' }} />;
}
