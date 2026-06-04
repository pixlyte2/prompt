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

    const NODE_COUNT = 40;
    const MAX_DISTANCE = 2.5;

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

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.05 + state.mouse.x * 0.03;
    groupRef.current.rotation.x = state.mouse.y * 0.04;

    const scale = 1 + Math.sin(t * 0.9) * 0.06;
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
          size={0.08}
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
          color="#3b82f6"
          lineWidth={1}
          transparent
          opacity={0.28}
        />
      ))}
    </group>
  );
}

export default function LoginScene() {
  return (
    <Canvas className="!h-full !w-full" camera={{ position: [0, 0, 8] }}>
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.6} />
      <NeuralNetwork />
    </Canvas>
  );
}
