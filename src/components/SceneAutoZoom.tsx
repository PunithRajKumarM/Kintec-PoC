import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Box3, Vector3, PerspectiveCamera } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAppStore } from "../store/store";

function SceneAutoZoom({
  orbitRef,
}: {
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const meshRefs = useAppStore((s) => s.meshRefs);
  const autoZoomVersion = useAppStore((s) => s.autoZoomVersion);

  useEffect(() => {
    const meshes = Object.values(meshRefs).filter(Boolean);
    if (!meshes.length || !orbitRef.current) return;

    // 1️⃣ Compute bounding box of ALL meshes
    const box = new Box3();
    meshes.forEach((m) => box.expandByObject(m!));

    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    // 2️⃣ Bounding sphere based zoom (BEST METHOD)
    const radius = size.length() * 0.5;

    const cam = camera as PerspectiveCamera;
    const fov = (cam.fov * Math.PI) / 180;

    // 80% screen fit
    const distance = radius / Math.sin(fov / 2);
    const zoomDistance = distance * 0.8;

    // 3️⃣ Move camera
    cam.position.set(
      center.x,
      center.y,
      center.z + zoomDistance
    );

    cam.near = zoomDistance / 100;
    cam.far = zoomDistance * 100;
    cam.updateProjectionMatrix();

    // 4️⃣ Update orbit controls
    orbitRef.current.target.copy(center);
    orbitRef.current.update();
  }, [autoZoomVersion]);

  return null;
}

export default SceneAutoZoom;
