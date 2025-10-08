import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function RealisticSun() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const rotationRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  
  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const sunRef = useRef<THREE.Mesh | undefined>(undefined);
  const sunMaterialRef = useRef<THREE.ShaderMaterial | undefined>(undefined);
  const glowMeshRef = useRef<THREE.Mesh | undefined>(undefined);
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || container.offsetWidth || 1600;
    let height = container.clientHeight || container.offsetHeight || 1600;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup com aspect dinâmico
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 15;
    cameraRef.current = camera;

    // Renderer setup (usa tamanho real do container)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create Sun Geometry
    const geometry = new THREE.SphereGeometry(1.0, 64, 64);
    
    // Sun Material with custom shader
    const sunMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // High-quality 3D noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        // Fractal Brownian Motion for detailed texture
        float fbm(vec3 p, int octaves) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for(int i = 0; i < 8; i++) {
            if(i >= octaves) break;
            value += amplitude * snoise(p * frequency);
            frequency *= 2.17;
            amplitude *= 0.52;
          }
          return value;
        }
        
        void main() {
          // Multiple noise layers for rich texture
          vec3 pos = vPosition * 2.5;
          vec3 animatedPos = pos + vec3(time * 0.02, time * 0.015, time * 0.01);
          
          // Large scale convection cells
          float convection = fbm(animatedPos * 0.8, 4);
          
          // Medium scale granulation (visible texture)
          float granules = fbm(pos * 4.0 + vec3(time * 0.05), 6);
          granules = granules * 0.5 + 0.5; // Normalize to 0-1
          
          // Fine surface detail
          float detail = fbm(pos * 12.0 + vec3(time * 0.08), 5);
          detail = detail * 0.5 + 0.5;
          
          // Sunspots - dark magnetic regions
          float spots = fbm(pos * 1.5 + vec3(time * 0.01), 3);
          spots = smoothstep(0.3, 0.6, spots);
          
          // Bright active regions (faculae)
          float brightRegions = fbm(animatedPos * 3.0, 4);
          brightRegions = pow(max(brightRegions, 0.0), 2.5);
          
          // Limb darkening effect
          float centerDot = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
          float limb = smoothstep(-0.1, 0.8, centerDot);
          
          // Color palette - realistic solar colors
          vec3 darkSpot = vec3(0.25, 0.12, 0.05);       // Dark sunspot
          vec3 coolSurface = vec3(0.95, 0.45, 0.15);    // Cooler surface (orange-red)
          vec3 normalSurface = vec3(1.0, 0.7, 0.25);    // Normal surface (yellow-orange)
          vec3 hotSurface = vec3(1.0, 0.92, 0.7);       // Hot surface (white-yellow)
          vec3 brightFlare = vec3(1.1, 1.05, 0.95);     // Very bright flare
          
          // Build base color from granulation
          vec3 surfaceColor = mix(coolSurface, normalSurface, granules);
          surfaceColor = mix(surfaceColor, hotSurface, detail * 0.6);
          
          // Add convection pattern variation
          surfaceColor = mix(surfaceColor, coolSurface, convection * 0.3);
          
          // Apply sunspots
          surfaceColor = mix(darkSpot, surfaceColor, spots);
          
          // Add bright active regions
          surfaceColor += brightFlare * brightRegions * 0.4;
          
          // Apply limb darkening
          surfaceColor *= 0.5 + limb * 0.7;
          
          // Add subtle color variation based on noise
          float colorShift = snoise(pos * 3.0 + time * 0.03) * 0.08;
          surfaceColor.r += colorShift;
          surfaceColor.g += colorShift * 0.5;
          surfaceColor.b -= colorShift * 0.3;
          
          // Final brightness adjustment
          surfaceColor *= 1.4;
          
          gl_FragColor = vec4(surfaceColor, 1.0);
        }
      `
    });
    sunMaterialRef.current = sunMaterial;

    const sun = new THREE.Mesh(geometry, sunMaterial);
    scene.add(sun);
    sunRef.current = sun;

    // Lights
    const light = new THREE.PointLight(0xffaa33, 5, 100);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Inner Glow
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0xffbb44) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.4 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(glowColor, 1.0) * intensity * 1.5;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);
    glowMeshRef.current = glowMesh;

    // Outer Glow
    const outerGlowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const outerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0xffaa33) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.8;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    scene.add(outerGlowMesh);

    // Animation
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (sunRef.current && sunMaterialRef.current) {
        if (!isDraggingRef.current) {
          sunRef.current.rotation.y += 0.002;
          sunRef.current.rotation.x += 0.001;
        }
        sunMaterialRef.current.uniforms.time.value += 0.01;
      }

      if (glowMeshRef.current) {
        glowMeshRef.current.rotation.y += 0.001;
      }

      if (outerGlowMesh) {
        outerGlowMesh.rotation.y -= 0.0005;
      }

      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver para manter círculo perfeito e evitar distorção
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const cr = entry.contentRect;
      width = cr.width || 1; // evita divisão por zero
      height = cr.height || 1;

      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
      if (rendererRef.current) {
        rendererRef.current.setSize(width, height, false);
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      renderer.dispose();
      geometry.dispose();
      sunMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      outerGlowGeometry.dispose();
      outerGlowMaterial.dispose();
      
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update dragging ref
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sunRef.current) return;

      const deltaX = e.clientX - mouseRef.current.x;
      const deltaY = e.clientY - mouseRef.current.y;

      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;

      sunRef.current.rotation.y = rotationRef.current.y;
      sunRef.current.rotation.x = rotationRef.current.x;

      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    />
  );
}
