import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import "./HumanModel.css";

function Model({ scenario, severity }) {
    const group = useRef();
    const { scene } = useGLTF("/models/Xbot.glb");

    // Map scenario -> target mesh name
    const targetMeshes = {
        stroke: ["Brain"],          // replace with actual mesh names
        hemorrhage: ["Abdomen"],
        hypertension: ["Heart"]
    };

    useFrame((state, delta) => {
        const targets = targetMeshes[scenario] || [];
        targets.forEach(name => {
            const mesh = scene.getObjectByName(name);
            if (mesh) {
                mesh.material.emissive.setHex(0xff0000); // temporary red glow
                mesh.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * severity);
            }
        });
    });

    return <primitive ref={group} object={scene} />;
}

export default function HumanModel({ scenario, severity }) {
    return (
        <Canvas camera={{ position: [0, 2, 4] }}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Model scenario={scenario} severity={severity} />
            <OrbitControls enablePan={false} enableZoom={true} />
        </Canvas>
    );
}
