import { TransformControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import { Box3, DoubleSide, Mesh, Vector3 } from "three";
import { useAppStore } from "../store/store";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";

function CropBox() {
  const transformRef = useRef<TransformControlsImpl | null>(null);
  const boxRef = useRef<Mesh | null>(null);
  const cropBox = useAppStore((state) => state.cropBox);
  const setCropBox = useAppStore((state) => state.setCropBox);
  const size = new Vector3().subVectors(cropBox.max, cropBox.min);
  const center = new Vector3()
    .addVectors(cropBox.min, cropBox.max)
    .multiplyScalar(0.5);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (transformRef.current && boxRef.current) {
        transformRef.current.attach(boxRef.current);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleTransformEnd = () => {
    if (!boxRef.current) return;
    const aabb = new Box3().setFromObject(boxRef.current);
    setCropBox({ min: aabb.min, max: aabb.max });
    boxRef.current.scale.set(1, 1, 1);
    boxRef.current.rotation.set(0, 0, 0);
  };  

  return (
    <>
      <TransformControls
        ref={transformRef}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
        onMouseUp={handleTransformEnd}
      />
      <mesh ref={boxRef} position={[center.x, center.y, center.z]}>
        <boxGeometry
          args={[
            Math.max(0.001, size.x),
            Math.max(0.001, size.y),
            Math.max(0.001, size.z),
          ]}
        />
        <meshStandardMaterial color={"white"} side={DoubleSide} wireframe />
      </mesh>
    </>
  );
}

export default CropBox;