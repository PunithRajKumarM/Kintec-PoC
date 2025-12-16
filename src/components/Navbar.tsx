import React, { type ChangeEvent } from "react";
import { Download, Redo, Undo, Upload } from "lucide-react";
import { useAppStore } from "../store/store";
import { BufferGeometry, Vector3 } from "three";

function Navbar({
  loadStl,
  inputRef,
}: {
  loadStl: (e: ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const cropUndo = useAppStore((state) => state.cropUndo);
  const cropRedo = useAppStore((state) => state.cropRedo);
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const models = useAppStore((state) => state.models);
  const cropUndoStacks = useAppStore((state) => state.cropUndoStacks);
  const cropRedoStacks = useAppStore((state) => state.cropRedoStacks);

  const handleUndoCrop = () => {
    if (!selectedModelID) return;
    cropUndo(selectedModelID);
  };

  const handleRedoCrop = () => {
    if (!selectedModelID) return;
    cropRedo(selectedModelID);
  };

  const disabledUndo = !(
    cropUndoStacks[selectedModelID!] &&
    cropUndoStacks[selectedModelID!].length > 0
  );

  const disableRedo = !(
    cropRedoStacks[selectedModelID!] &&
    cropRedoStacks[selectedModelID!].length > 0
  );

  // Function to generate G-code from geometry
  const generateGCode = (geometry: BufferGeometry, modelName: string) => {
    // Simple slicer parameters (you can make these configurable)
    const layerHeight = 0.2; // mm
    const extrusionWidth = 0.4; // mm
    const filamentDiameter = 1.75; // mm
    const bedTemperature = 60; // °C
    const nozzleTemperature = 210; // °C
    const printSpeed = 60; // mm/s
    const travelSpeed = 120; // mm/s
    const retractionDistance = 1.0; // mm
    const retractionSpeed = 45; // mm/s
    
    // Get vertices from geometry
    const positions = geometry.getAttribute('position');
    const vertices: Vector3[] = [];
    
    for (let i = 0; i < positions.count; i++) {
      vertices.push(new Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      ));
    }
    
    // Calculate bounding box for bed centering
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    if (!bbox) return "";
    
    const center = new Vector3();
    bbox.getCenter(center);
    
    // Start G-code generation
    let gcode = `; G-code generated from: ${modelName}\n`;
    gcode += `; Layer height: ${layerHeight}mm\n`;
    gcode += `; Extrusion width: ${extrusionWidth}mm\n\n`;
    
    // Start G-code
    gcode += "M104 S" + nozzleTemperature + " ; Set nozzle temperature\n";
    gcode += "M140 S" + bedTemperature + " ; Set bed temperature\n";
    gcode += "M190 S" + bedTemperature + " ; Wait for bed temperature\n";
    gcode += "M109 S" + nozzleTemperature + " ; Wait for nozzle temperature\n\n";
    
    gcode += "G28 ; Home all axes\n";
    gcode += "G29 ; Auto bed leveling\n";
    gcode += "G92 E0 ; Reset extruder\n";
    gcode += "G1 Z2.0 F3000 ; Move Z up\n\n";
    
    // Purge line
    gcode += "; Purge line\n";
    gcode += "G1 X10 Y10 Z0.2 F" + travelSpeed * 60 + "\n";
    gcode += "G1 X100 E10 F" + printSpeed * 60 + "\n";
    gcode += "G92 E0\n\n";
    
    // Calculate layers based on model height
    const modelHeight = bbox.max.y - bbox.min.y;
    const numLayers = Math.ceil(modelHeight / layerHeight);
    
    // Simplified slicing: For each layer, create a bounding rectangle
    for (let layer = 0; layer < numLayers; layer++) {
      const layerZ = bbox.min.y + (layer * layerHeight) + layerHeight/2;
      
      // Filter vertices in this layer (simplified)
      const layerVertices = vertices.filter(v => 
        Math.abs(v.y - layerZ) < layerHeight
      );
      
      if (layerVertices.length === 0) continue;
      
      gcode += `; Layer ${layer + 1}, Z = ${(layer * layerHeight).toFixed(2)}mm\n`;
      
      if (layer === 0) {
        // First layer: slower
        gcode += `G1 Z${(layer * layerHeight + layerHeight).toFixed(2)} F${printSpeed * 60 * 0.5}\n`;
      } else {
        gcode += `G1 Z${(layer * layerHeight + layerHeight).toFixed(2)} F${printSpeed * 60}\n`;
      }
      
      // Generate perimeter for this layer (simplified - just a rectangle)
      // In a real implementation, you'd use a proper slicer algorithm
      const minX = Math.min(...layerVertices.map(v => v.x));
      const maxX = Math.max(...layerVertices.map(v => v.x));
      const minZ = Math.min(...layerVertices.map(v => v.z));
      const maxZ = Math.max(...layerVertices.map(v => v.z));
      
      // Create a simple rectangular path
      const path = [
        {x: minX, z: minZ},
        {x: maxX, z: minZ},
        {x: maxX, z: maxZ},
        {x: minX, z: maxZ},
        {x: minX, z: minZ}
      ];
      
      // Extrude along the path
      let isFirstPoint = true;
      for (const point of path) {
        if (isFirstPoint) {
          gcode += `G1 X${point.x.toFixed(3)} Y${point.z.toFixed(3)} F${travelSpeed * 60}\n`;
          isFirstPoint = false;
        } else {
          // Calculate extrusion amount (simplified)
          const extrusionAmount = 0.04; // mm
          gcode += `G1 X${point.x.toFixed(3)} Y${point.z.toFixed(3)} E${extrusionAmount.toFixed(5)} F${printSpeed * 60}\n`;
        }
      }
      
      gcode += "\n";
    }
    
    // End G-code
    gcode += "; End G-code\n";
    gcode += "G91 ; Relative positioning\n";
    gcode += "G1 Z+5 E-2.5 F3000 ; Lift nozzle and retract filament\n";
    gcode += "G90 ; Absolute positioning\n";
    gcode += "G1 X0 Y220 F3000 ; Move to park position\n";
    gcode += "M104 S0 ; Turn off nozzle heater\n";
    gcode += "M140 S0 ; Turn off bed heater\n";
    gcode += "M84 ; Disable steppers\n";
    
    return gcode;
  };

  const handleExportGCode = () => {
    if (!selectedModelID) {
      alert("Please select a model first");
      return;
    }
    
    const selectedModel = models.find(m => m.id === selectedModelID);
    if (!selectedModel) {
      alert("Model not found");
      return;
    }
    
    try {
      // Generate G-code
      const gcode = generateGCode(selectedModel.geometry, selectedModel.name);
      
      // Create a Blob and download link
      const blob = new Blob([gcode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedModel.name.replace('.stl', '')}.gcode`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("G-code exported successfully");
    } catch (error) {
      console.error("Error exporting G-code:", error);
      alert("Error exporting G-code. Check console for details.");
    }
  };

  return (
    <div
      style={{
        padding: "12px 20px",
        background: "#000",
        border: "1px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Project Name */}
      <div
        style={{
          color: "#fff",
          fontSize: "18px",
          fontWeight: "600",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        3D Model Editor
      </div>
      
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        {/* Undo/Redo Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            disabled={disabledUndo}
            style={{
              opacity: !disabledUndo ? 1 : 0.4,
              cursor: !disabledUndo ? "pointer" : "not-allowed",
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              padding: "6px",
              borderRadius: "4px",
            }}
            onClick={handleUndoCrop}
            title="Undo Crop"
          >
            <Undo color="#fff" size={18} />
          </button>
          <button
            disabled={disableRedo}
            style={{
              opacity: !disableRedo ? 1 : 0.4,
              cursor: !disableRedo ? "pointer" : "not-allowed",
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              padding: "6px",
              borderRadius: "4px",
            }}
            onClick={handleRedoCrop}
            title="Redo Crop"
          >
            <Redo color="#fff" size={18} />
          </button>
        </div>

        {/* Export G-code Button */}
        <button
          onClick={handleExportGCode}
          disabled={!selectedModelID}
          style={{
            background: selectedModelID ? "#10b981" : "#6b7280",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: selectedModelID ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => selectedModelID && (e.currentTarget.style.background = "#059669")}
          onMouseOut={(e) => selectedModelID && (e.currentTarget.style.background = "#10b981")}
          title={selectedModelID ? "Export to G-code" : "Select a model to export"}
        >
          <Download size={16} color="#fff" />
          <span style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>
            Export G-code
          </span>
        </button>

        {/* Import Button */}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".stl"
            hidden
            onChange={(e) => loadStl(e)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              background: "#2563eb",
              border: "none",
              borderRadius: "6px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
            title="Import STL"
          >
            <Upload size={18} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;