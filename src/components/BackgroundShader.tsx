"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  varying vec2 vUv;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    
    // Smooth mouse interaction
    float dist = distance(uv, uMouse);
    float mouseEffect = smoothstep(0.4, 0.0, dist) * 0.2;
    
    // Multi-layered noise
    float n1 = snoise(uv * 2.0 + uTime * 0.1) * 0.5 + 0.5;
    float n2 = snoise(uv * 4.0 - uTime * 0.15 + vec2(uMouse.x, uMouse.y)*2.0) * 0.5 + 0.5;
    float n3 = snoise(uv * 1.5 + vec2(sin(uTime*0.2), cos(uTime*0.2))) * 0.5 + 0.5;
    
    // Combine noise
    float finalNoise = mix(n1, n2, n3 + mouseEffect);
    
    // Color mixing
    vec3 color = mix(uColor1, uColor2, finalNoise);
    color = mix(color, uColor3, n3 * 0.5 + mouseEffect);
    
    // Soft opacity gradient towards edges
    float alpha = smoothstep(1.0, 0.2, length(uv - 0.5) * 1.5);
    
    gl_FragColor = vec4(color, alpha * 0.4); // Subtle overall opacity
  }
`;

function ShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();
  const [mouse, setMouse] = useState(new THREE.Vector2(0.5, 0.5));
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColor1: { value: new THREE.Color("#10b981") }, // Emerald
      uColor2: { value: new THREE.Color("#3b82f6") }, // Blue
      uColor3: { value: new THREE.Color("#fcd34d") }, // Amber/Yellow
    }),
    [size]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to 0-1 for UV space
      targetMouse.current.set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Lerp mouse for smooth following
      mouse.lerp(targetMouse.current, 0.05);
      materialRef.current.uniforms.uMouse.value.copy(mouse);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function BackgroundShader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-multiply">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
