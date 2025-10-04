import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MiniPlanetProps {
  type: 'mars' | 'earth' | 'jupiter';
  size?: number;
  isHovered?: boolean;
}

const planetConfigs = {
  mars: {
    baseColor: new THREE.Color(0xcd5c5c),
    secondaryColor: new THREE.Color(0x8b4513),
    atmosphereColor: new THREE.Color(0xff6347),
  },
  earth: {
    baseColor: new THREE.Color(0x4169e1),
    secondaryColor: new THREE.Color(0x228b22),
    atmosphereColor: new THREE.Color(0x87ceeb),
  },
  jupiter: {
    baseColor: new THREE.Color(0xdaa520),
    secondaryColor: new THREE.Color(0xd2691e),
    atmosphereColor: new THREE.Color(0xffa500),
  },
};

export function MiniPlanet({ type, size = 52, isHovered = false }: MiniPlanetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config = planetConfigs[type];
    const actualSize = isHovered ? size * 1.3 : size;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 2;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(actualSize, actualSize);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Create Planet
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    
    const planetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: config.baseColor },
        secondaryColor: { value: config.secondaryColor },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 secondaryColor;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          float n = noise(vUv * 10.0 + time * 0.1);
          vec3 color = mix(baseColor, secondaryColor, n);
          
          // Add lighting
          float light = max(dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))), 0.3);
          color *= light;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const planet = new THREE.Mesh(geometry, planetMaterial);
    scene.add(planet);

    // Add atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(0.55, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: config.atmosphereColor },
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      planet.rotation.y += 0.003;
      if (planetMaterial.uniforms) {
        planetMaterial.uniforms.time.value += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      planetMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
    };
  }, [type, size, isHovered]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${isHovered ? size * 1.3 : size}px`,
        height: `${isHovered ? size * 1.3 : size}px`,
        transition: 'all 0.3s ease',
      }}
    />
  );
}
