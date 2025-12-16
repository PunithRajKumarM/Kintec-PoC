import { TransformControls } from "@react-three/drei";
import type { Mesh } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RefObject } from "react";
import { useAppStore } from "../store/store";
import type { Camera } from "@react-three/fiber";
import { TransformControls as TransformControlsImpl } from "three-stdlib";

function TransformControlsWrapper({
  transformRef,
  meshRefs,
  orbitRef,
}: {
  transformRef: React.RefObject<TransformControlsImpl<Camera> | null>;
  meshRefs: React.RefObject<Mesh[]>;
  orbitRef: RefObject<OrbitControlsImpl | null>;
}) {
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const updateModel = useAppStore((state) => state.updateModel);
  const models = useAppStore((state) => state.models);
  const transformMode = useAppStore((state) => state.transformMode);

  const selectedIndex = models.findIndex((f) => f.id === selectedModelID);
  const selectedMesh =
    selectedIndex !== -1 ? meshRefs.current?.[selectedIndex] : null;

  if (!selectedMesh || !transformMode) return null;

  return (
    <TransformControls
      ref={transformRef}
      object={selectedMesh}
      mode={transformMode}
      onMouseUp={() => {
        if (!orbitRef.current || !selectedModelID) return;
        orbitRef.current.enabled = true;
        updateModel(selectedModelID, {
          position: {
            x: selectedMesh.position.x,
            y: selectedMesh.position.y,
            z: selectedMesh.position.z,
          },
          rotation: {
            x: selectedMesh.rotation.x,
            y: selectedMesh.rotation.y,
            z: selectedMesh.rotation.z,
          },
          scale: {
            x: selectedMesh.scale.x,
            y: selectedMesh.scale.y,
            z: selectedMesh.scale.z,
          },
        });
      }}
      onMouseDown={() => {
        if (!orbitRef.current) return;
        orbitRef.current.enabled = false;
      }}
    />
  );
}

export default TransformControlsWrapper;
