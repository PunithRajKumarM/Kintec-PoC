import { useRef, type ChangeEvent } from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import Controllers from "./components/Controllers";
import Navbar from "./components/Navbar";
import Scene from "./components/Scene";
import { useAppStore, type Model } from "./store/store";

function App() {
  const setModels = useAppStore((state) => state.setModels);
  const inputRef = useRef<HTMLInputElement>(null);
  const models = useAppStore((state) => state.models);


  const loadSTLFile = (e: ChangeEvent<HTMLInputElement>) => {
    // const filePath = await window.electronAPI.openFile();
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (!content) return;
      const geometry = new STLLoader().parse(content as ArrayBuffer);

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();
      geometry.center();
      if (!geometry.boundingBox) return;
      const box = geometry.boundingBox;
      const yOffset = box.min.y;
      geometry.translate(0, -yOffset, 0);
      const newModel: Model = {
        id: Date.now().toString(),
        name: file.name,
        scale: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        geometry,
        opacity: 1,
        wireframe: false,
      };
      setModels(newModel);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Navbar loadStl={loadSTLFile} inputRef={inputRef} />
      <div
        style={{
          display: "flex",
          width: "100%",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: "400px",
            minWidth: "300px",
            borderBottom: "1px solid #333",
            borderLeft: "1px solid #333",
            borderRight: "1px solid #333",
            backgroundColor: "#000",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Hide scrollbar for Webkit browsers (Chrome, Safari) */}
          <style>{`
            div[style*="overflowY: auto"]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {models.length ? (
            <Controllers />
          ) : (
            <div style={{ textAlign: "center", margin: "20px" }}>
              There is no model selected
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Scene />
        </div>
      </div>
    </div>
  );
}
export default App;
