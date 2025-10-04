import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Import estático do loader/controls para evitar falhas de caminho (já que agora adicionamos three ao package.json)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SunModelProps {
  /** Caminho glTF dentro de src/assets via import URL ou passado manualmente */
  modelUrl?: string;
  /** Caminho público (public/) começando com /  */
  modelPath?: string;
  /** Altura do container */
  height?: number | string;
  /** Se true, habilita controles orbitais */
  controls?: boolean;
  /** Ativa/desativa sombras (custo de performance) */
  shadows?: boolean;
  /** Auto rotação lenta do modelo */
  autoRotate?: boolean;
  /** Intensidade da rotação (radianos/segundo) */
  autoRotateSpeed?: number;
  /** Limita pixel ratio para performance em dispositivos fracos */
  maxPixelRatio?: number;
}

export default function SunModel({
  modelUrl,
  modelPath,
  height = 520,
  controls = true,
  shadows = true,
  autoRotate = false,
  autoRotateSpeed = 0.2,
  maxPixelRatio = 2
}: SunModelProps) {
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

    // Dimensões iniciais robustas
    let width = container.clientWidth || container.parentElement?.clientWidth || window.innerWidth;
    let heightPx = container.clientHeight || 520;

    // Cena + background transparente (aproveita o gradient atrás)
    const scene = new THREE.Scene();
    scene.background = null; // manter transparente

  // Camera com FOV moderado para evitar distorção e clipping próximo adequado
  // near pequeno para permitir aproximação sem clipping
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.01, 5000);
    camera.position.set(0, 0, 30);
    cameraRef.current = camera;

    // Renderer configurado para performance
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(width, heightPx, false);
    if (shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Luzes
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(-120, 160, 200);
    if (shadows) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 1000;
      const cam = dirLight.shadow.camera as THREE.OrthographicCamera;
      cam.left = -200; cam.right = 200; cam.top = 200; cam.bottom = -200;
    }
    scene.add(dirLight);

    // Controles
    if (controls) {
      controlsRef.current = new OrbitControls(camera, renderer.domElement);
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.08;
      controlsRef.current.enablePan = false;
      // permitir aproximação maior para deixar o sol maior na tela
      controlsRef.current.minDistance = 0.5;
      controlsRef.current.maxDistance = 400;
    }

    // Loader glTF
    const loader = new GLTFLoader();
    const effectiveUrl = modelPath ? modelPath : (modelUrl || new URL('../../assets/sun/scene.gltf', import.meta.url).href);
    console.log('[SunModel] carregando glTF:', effectiveUrl);

    const frameModel = (root: THREE.Object3D) => {
      // compute bounding box and sphere in world space
      const box = new THREE.Box3().setFromObject(root);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);

      // recenter model so its bounding sphere center is at origin
      root.position.x -= sphere.center.x;
      root.position.y -= sphere.center.y;
      root.position.z -= sphere.center.z;

      // account for renderer/canvas aspect
      const aspect = camera.aspect || (container.clientWidth / Math.max(1, container.clientHeight));
      const vFOV = (camera.fov * Math.PI) / 180;
      // horizontal fov
      const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * aspect);

      // required distance so the bounding sphere fits in vertical/horizontal fov
      const radius = sphere.radius * (root.scale ? Math.max(root.scale.x, root.scale.y, root.scale.z) : 1);
      const distV = radius / Math.sin(vFOV / 2);
      const distH = radius / Math.sin(hFOV / 2);
  // increase padding so the whole sun fits (avoid top being cut)
  const paddingMultiplier = 0.95; // larger => camera further
  const dist = Math.max(distV, distH) * paddingMultiplier;

  // position camera a bit higher and further back for safe composition
  camera.position.set(0, radius * 0.25, dist * 1.05);
      camera.lookAt(0, 0, 0);
      // ensure near is small relative to dist to avoid clipping
      camera.near = Math.max(0.001, dist * 0.001);
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };

    let disposed = false;
    loader.load(
      effectiveUrl,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) return;
        modelRootRef.current = root;
        // Ativa sombras e preserva emissive do material
        root.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = shadows;
            obj.receiveShadow = shadows;
            if (obj.material) {
              // garantir que emissiveIntensity esteja presente
              if ('emissive' in obj.material && obj.material.emissive) {
                obj.material.emissiveIntensity = obj.material.emissiveIntensity ?? 1.0;
              }
              obj.material.needsUpdate = true;
            }
          }
        });
        scene.add(root);
        frameModel(root);
        // Animações
        if (gltf.animations && gltf.animations.length) {
          mixerRef.current = new THREE.AnimationMixer(root);
          const action = mixerRef.current.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (err) => {
        console.warn('[SunModel] Falha ao carregar glTF', err);
        const fallback = new THREE.Mesh(
          new THREE.SphereGeometry(10, 64, 64),
          new THREE.MeshStandardMaterial({ color: 0xffcc55, emissive: 0xff9900, emissiveIntensity: 1.6 })
        );
        scene.add(fallback);
        frameModel(fallback);
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
  }, [modelUrl, modelPath, controls, shadows, autoRotate, autoRotateSpeed, maxPixelRatio]);

  return <div ref={containerRef} style={{ width: '100%', height, position: 'relative' }} />;
}
