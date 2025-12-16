import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { DoubleSide, Mesh } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAppStore, type Model } from "../store/store";
import CropBox from "./CropBox";
import SceneAutoZoom from "./SceneAutoZoom";

function ModelMesh({ model }: { model: Model }) {
  const { id, geometry, scale, rotation, position, wireframe, opacity } = model;
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const setSelectedModelId = useAppStore((state) => state.setSelectedModelId);
  const { x: scaleX, y: scaleY, z: scaleZ } = scale;
  const { x: rotationX, y: rotationY, z: rotationZ } = rotation;
  const { x: positionX, y: positionY, z: positionZ } = position;
  const meshRef = useRef<Mesh | null>(null);
  const setMeshRef = useAppStore((s) => s.setMeshRef);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    setMeshRef(model.id, meshRef.current);

    return () => {
      setMeshRef(model.id, null);
    };
  }, [model.id]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      scale={[scaleX, scaleY, scaleZ]}
      rotation={[rotationX, rotationY, rotationZ]}
      position={[positionX, positionY, positionZ]}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        setSelectedModelId(model.id);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <meshStandardMaterial
        wireframe={wireframe}
        color={id === selectedModelID ? "red" : "Bisque"}
        side={DoubleSide}
        transparent={true}
        opacity={opacity}
        roughness={0.6}
        metalness={0.0}
      />
    </mesh>
  );
}

function Scene() {
  const models = useAppStore((state) => state.models);
  const isCropEnabled = useAppStore((state) => state.isCropEnabled);
  const cropType = useAppStore((state) => state.cropType);
  const orbitRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        shadows
        camera={{ position: [0, 250, 450], fov: 50, far: 100000 }}
        performance={{ min: 0.5 }}
      >
        <Grid
          side={DoubleSide}
          args={[1000, 1000]}
          cellSize={1000}
          cellThickness={1}
          sectionSize={100}
          sectionThickness={1}
          cellColor="#444"
          sectionColor="#666"
          fadeDistance={Infinity}
          fadeStrength={0}
          position={[0, -0.01, 0]}
        />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 50, 0]} intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={3} />
        <pointLight position={[-3, -3, 2]} />
        <hemisphereLight args={["#ffffff", "#444444", 0.6]} />
        <OrbitControls
          dampingFactor={0.05}
          minDistance={0.01}
          makeDefault
          ref={orbitRef}
          maxDistance={Infinity}
        />
        <SceneAutoZoom orbitRef={orbitRef} />
        {isCropEnabled && cropType === "box" && <CropBox />}
        {models.map((model) => (
          <group key={model.id}>
            <ModelMesh model={model} />
          </group>
        ))}
      </Canvas>
    </div>
  );
}

export default Scene;
