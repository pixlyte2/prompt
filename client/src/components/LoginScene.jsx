import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function NeuralNetwork() {
  const groupRef = useRef();
  const pulseRef = useRef();

  const { nodes, connections } = useMemo(() => {
    const nodePositions = [];
    const lines = [];

    const NODE_COUNT = 50;
    const MAX_DISTANCE = 2.8;

    for (let i = 0; i < NODE_COUNT; i++) {
      nodePositions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        )
      );
    }

    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (
          nodePositions[i].distanceTo(nodePositions[j]) <
          MAX_DISTANCE
        ) {
          lines.push([nodePositions[i], nodePositions[j]]);
        }
      }
    }

    return { nodes: nodePositions, connections: lines };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Mouse parallax + rotation
    groupRef.current.rotation.y += 0.0015;
    groupRef.current.rotation.x = state.mouse.y * 0.3;
    groupRef.current.rotation.y += state.mouse.x * 0.3;

    // Node pulse animation
    const scale =
      1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    if (pulseRef.current) {
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Glowing Nodes */}
      <Points
        ref={pulseRef}
        positions={new Float32Array(
          nodes.flatMap((v) => [v.x, v.y, v.z])
        )}
        stride={3}
      >
        <PointMaterial
          color="#00ffff"
          size={0.1}
          sizeAttenuation
          depthWrite={false}
          transparent
        />
      </Points>

      {/* Neon Connections */}
      {connections.map((line, index) => (
        <Line
          key={index}
          points={line}
          color="#ff00ff"
          lineWidth={1}
          transparent
          opacity={0.4}
        />
      ))}
    </group>
  );
}

export default function LoginScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8] }}>
      <color attach="background" args={["#0f0f1a"]} />
      <ambientLight intensity={0.6} />
      <NeuralNetwork />
    </Canvas>
  );
}
