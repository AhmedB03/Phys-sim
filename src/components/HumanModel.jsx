import React, { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import "./HumanModel.css";

function Model({ scenario, severity }) {
    const group = useRef();
    // useGLTF will load the model from public/models/Xbot.glb
    // Wrap the component in <Suspense> and provide a placeholder when missing
    let scene = null;
    try {
        const loaded = useGLTF("/models/Xbot.glb");
        scene = loaded.scene || null;
    } catch (err) {
        // if loading fails (e.g., file missing) we'll fall back to placeholder geometry
        scene = null;
    }

    // Map scenario -> target mesh name(s)
    // Note: hemorrhage includes Brain so we can show a head-bleed effect when present
    const targetMeshes = {
        stroke: ["Brain"], // replace with actual mesh names
        hemorrhage: ["Brain", "Abdomen"],
        hypertension: ["Heart"],
        seizure: ["Brain"],
    };

    // particle system state (small red droplets)
    const particleGroupRef = useRef();
    const haloRef = useRef();
    const [particleCount] = useState(() => Math.max(12, Math.floor(severity * 12)));
    const particles = useMemo(() => {
        // initial random offsets around origin (will be positioned relative to mesh)
        const arr = [];
        for (let i = 0; i < particleCount; i++) {
            arr.push({
                x: (Math.random() - 0.5) * 0.4,
                y: Math.random() * 0.4 + 0.1,
                z: (Math.random() - 0.5) * 0.4,
                vy: Math.random() * 0.002 + 0.002,
            });
        }
        return arr;
    }, [particleCount]);

    useFrame((state, delta) => {
        const targets = targetMeshes[scenario] || [];
        // find first present mesh to attach visual effects to
        let targetMesh = null;
        for (let name of targets) {
            const m = scene.getObjectByName(name);
            if (m) {
                targetMesh = m;
                // subtle emissive pulse for highlighted mesh
                if (m.material && m.material.emissive) {
                    m.material.emissive.setHex(0xff0000);
                    m.material.emissiveIntensity = 0.2 + 0.8 * Math.abs(Math.sin(state.clock.elapsedTime * severity));
                }
                break;
            }
        }

        if (targetMesh) {
            // compute world position of target mesh
            const worldPos = new THREE.Vector3();
            targetMesh.getWorldPosition(worldPos);

            // place halo at the mesh position
            if (haloRef.current) {
                haloRef.current.position.copy(worldPos);
                const baseScale = 0.6 + severity * 0.2;
                haloRef.current.scale.setScalar(baseScale * (1 + 0.15 * Math.sin(state.clock.elapsedTime * 3)));
            }

            // animate particles around the mesh
            if (particleGroupRef.current) {
                particleGroupRef.current.children.forEach((child, idx) => {
                    // update position relative to initial offset
                    const p = particles[idx];
                    // apply simple falling motion
                    p.y -= p.vy * (1 + severity * 0.5) * (delta * 60);
                    p.x += (Math.random() - 0.5) * 0.002 * delta * 60;
                    p.z += (Math.random() - 0.5) * 0.002 * delta * 60;
                    // reset when below a threshold to simulate continuous bleeding
                    if (p.y < -0.6) {
                        p.y = Math.random() * 0.4 + 0.2;
                        p.x = (Math.random() - 0.5) * 0.4;
                        p.z = (Math.random() - 0.5) * 0.4;
                    }
                    child.position.set(worldPos.x + p.x, worldPos.y + p.y, worldPos.z + p.z);
                    // fade out slightly based on y
                    if (child.material) child.material.opacity = Math.max(0.15, Math.min(1, 0.9 + p.y));
                });
            }
        }
    });

    // Render the loaded scene plus overlay effects (halo + particles)
    return (
        <>
            {scene ? (
                <primitive ref={group} object={scene} />
            ) : (
                // placeholder: a simple stylized head box so we still show something
                <group ref={group}>
                    <mesh position={[0, 1.2, 0]}>
                        <sphereGeometry args={[0.6, 32, 32]} />
                        <meshStandardMaterial color={0x888888} metalness={0.2} roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[1.2, 1.6, 0.6]} />
                        <meshStandardMaterial color={0x666666} metalness={0.1} roughness={0.9} />
                    </mesh>
                </group>
            )}

            {/* halo: translucent red sphere placed at target mesh */}
            {scenario === "hemorrhage" && (
                <group>
                    <mesh ref={haloRef}>
                        <sphereGeometry args={[0.5, 24, 24]} />
                        <meshStandardMaterial color={0xff0000} transparent opacity={0.12} depthWrite={false} />
                    </mesh>

                    {/* particle group: small droplets that fall around the target */}
                    <group ref={particleGroupRef}>
                        {particles.map((p, i) => (
                            <mesh key={i} position={[p.x, p.y, p.z]}>
                                <sphereGeometry args={[0.03, 8, 8]} />
                                <meshStandardMaterial color={0x8b0000} emissive={0x8b0000} transparent opacity={0.9} />
                            </mesh>
                        ))}
                    </group>
                </group>
            )}
        </>
    );
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
