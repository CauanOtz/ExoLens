import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// OrbitControls lives in the examples directory; import with ts-ignore for compatibility
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface PlanetPreviewProps {
  color?: string;
  radius?: number;
}

export default function PlanetPreview3D({ color = '#c66', radius = 1 }: PlanetPreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
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
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.7 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // subtle atmosphere glow (simple duplicate slightly scaled)
    const atmosphereMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.BackSide });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.06, 32, 32), atmosphereMat);
    scene.add(atmosphere);

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
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [color, radius]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />;
}
