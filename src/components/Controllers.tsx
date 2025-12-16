import { Grid3x3, Move3d, Rotate3d, Scale3d, X } from "lucide-react";
import { useState } from "react";
import { MathUtils, Vector3 } from "three";
import { useAppStore, type CropType } from "../store/store";
import { styles, styleTag } from "../styles/styles";

function OpacityController() {
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const selectedModel = useAppStore((state) =>
    state.models.find((m) => m.id === selectedModelID)
  );
  const updateModel = useAppStore((state) => state.updateModel);
  if (!selectedModel) return null;
  const { opacity } = selectedModel;

  const handleOpacityChange = (value: number) => {
    updateModel(selectedModel.id, { opacity: value });
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>Opacity</div>
      <div style={styles.controlRow}>
        <input
          type="range"
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          min="0"
          max="1"
          step="0.01"
          className="controller-slider"
        />
        <div style={styles.value}>{opacity.toFixed(2)}</div>
      </div>
    </div>
  );
}

function ScaleController() {
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const selectedModel = useAppStore((state) =>
    state.models.find((m) => m.id === selectedModelID)
  );
  const updateModel = useAppStore((state) => state.updateModel);
  if (!selectedModel) return null;
  const { scale } = selectedModel;

  const handleScaleChange = (axis: keyof typeof scale, value: number) => {
    updateModel(selectedModel.id, { scale: { ...scale, [axis]: value } });
  };

  const axes = ["x", "y", "z"] as (keyof typeof scale)[];

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>Scale</div>
      {axes.map((axis) => (
        <div key={axis} style={styles.controlRow}>
          <div style={styles.label}>{axis.toUpperCase()}</div>
          <input
            type="range"
            value={scale[axis]}
            onChange={(e) => handleScaleChange(axis, Number(e.target.value))}
            min="0.01"
            max="3"
            step="0.1"
            className="controller-slider"
          />
          <div style={styles.value}>{scale[axis].toFixed(1)}</div>
        </div>
      ))}
      <button
        className="controller-button"
        style={{ marginTop: 6 }}
        onClick={() =>
          updateModel(selectedModel.id, { scale: { x: 1, y: 1, z: 1 } })
        }
      >
        Reset
      </button>
    </div>
  );
}

function PositionController() {
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const selectedModel = useAppStore((state) =>
    state.models.find((m) => m.id === selectedModelID)
  );
  const updateModel = useAppStore((state) => state.updateModel);
  if (!selectedModel) return null;
  const { position } = selectedModel;

  const handlePositionChange = (axis: keyof typeof position, value: number) => {
    updateModel(selectedModel.id, { position: { ...position, [axis]: value } });
  };

  const axes = ["x", "y", "z"] as (keyof typeof position)[];

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>Position</div>
      {axes.map((axis) => (
        <div key={axis} style={styles.controlRow}>
          <div style={styles.label}>{axis.toUpperCase()}</div>
          <input
            type="range"
            value={position[axis]}
            onChange={(e) => handlePositionChange(axis, Number(e.target.value))}
            min="-150"
            max="150"
            step="1"
            className="controller-slider"
          />
          <div style={styles.value}>{position[axis].toFixed(1)}</div>
        </div>
      ))}
      <button
        className="controller-button"
        style={{ marginTop: 6 }}
        onClick={() =>
          updateModel(selectedModel.id, { position: { x: 0, y: 0, z: 0 } })
        }
      >
        Reset
      </button>
    </div>
  );
}

function RotationController() {
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const selectedModel = useAppStore((state) =>
    state.models.find((m) => m.id === selectedModelID)
  );
  const updateModel = useAppStore((state) => state.updateModel);
  if (!selectedModel) return null;
  const { rotation } = selectedModel;

  const rotationInDegrees = {
    x: MathUtils.radToDeg(rotation.x),
    y: MathUtils.radToDeg(rotation.y),
    z: MathUtils.radToDeg(rotation.z),
  };

  const handleRotationChange = (
    axis: keyof typeof rotation,
    degrees: number
  ) => {
    const radians = MathUtils.degToRad(degrees);
    updateModel(selectedModel.id, {
      rotation: { ...rotation, [axis]: radians },
    });
  };

  const axes = ["x", "y", "z"] as (keyof typeof rotation)[];

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>Rotation</div>
      {axes.map((axis) => (
        <div key={axis} style={styles.controlRow}>
          <div style={styles.label}>{axis.toUpperCase()}</div>
          <input
            type="range"
            value={rotationInDegrees[axis]}
            onChange={(e) => handleRotationChange(axis, Number(e.target.value))}
            min="-180"
            max="180"
            step="1"
            className="controller-slider"
          />
          <div style={styles.value}>{rotationInDegrees[axis].toFixed(0)}°</div>
        </div>
      ))}
      <button
        className="controller-button"
        style={{ marginTop: 6 }}
        onClick={() =>
          updateModel(selectedModel.id, { rotation: { x: 0, y: 0, z: 0 } })
        }
      >
        Reset
      </button>
    </div>
  );
}

function CropBoxController() {
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const applyCrop = useAppStore((state) => state.applyCrop);
  type axis = "x" | "y" | "z";
  const cropBox = useAppStore((state) => state.cropBox);
  const setCropBox = useAppStore((state) => state.setCropBox);
  const setEnableCrop = useAppStore((state) => state.setEnableCrop);
  const setCropType = useAppStore((state) => state.setCropType);
  const max = Object.keys(cropBox.max) as axis[];
  const min = Object.keys(cropBox.min) as axis[];

  // const handleCropChange = (type: "max" | "min", axis: axis, value: number) => {
  //   const newBox = { ...cropBox, [type]: { ...cropBox[type], [axis]: value } };
  //   setCropBox(newBox);
  // };
  const handleCropChange = (
    type: "min" | "max",
    axis: "x" | "y" | "z",
    value: number
  ) => {
    const newMin = cropBox.min.clone();
    const newMax = cropBox.max.clone();

    if (type === "min") newMin[axis] = value;
    else newMax[axis] = value;

    setCropBox({ min: newMin, max: newMax });
  };

  const handleApplyCrop = () => {
    if (!selectedModelID) return;
    applyCrop(selectedModelID);
    setEnableCrop(false);
    setCropBox({
      min: new Vector3(-50, -50, -50),
      max: new Vector3(50, 50, 50),
    });
    setCropType("box");
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>Crop Box</div>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* Max Section */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              ...styles.sectionTitle,
              textAlign: "center",
              fontSize: "11px",
            }}
          >
            Max
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {max.map((axis: axis) => (
              <div key={axis} style={styles.controlRow}>
                <div style={styles.label}>{axis.toUpperCase()}</div>
                <input
                  type="number"
                  value={cropBox.max[axis]}
                  step={1}
                  onChange={(e) => {
                    handleCropChange("max", axis, parseFloat(e.target.value));
                  }}
                  className="controller-input"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Min Section */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              ...styles.sectionTitle,
              textAlign: "center",
              fontSize: "11px",
            }}
          >
            Min
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {min.map((axis: axis) => (
              <div key={axis} style={styles.controlRow}>
                <div style={styles.label}>{axis.toUpperCase()}</div>
                <input
                  type="number"
                  value={cropBox.min[axis]}
                  step={1}
                  onChange={(e) => {
                    handleCropChange("min", axis, parseFloat(e.target.value));
                  }}
                  className="controller-input"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <button className="controller-button" onClick={() => handleApplyCrop()}>
        Apply crop
      </button>
    </div>
  );
}

const ListModels = () => {
  const models = useAppStore((state) => state.models);
  const deleteModel = useAppStore((state) => state.deleteModel);
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const setEnableCrop = useAppStore((state) => state.setEnableCrop);
  const setSelectedModelId = useAppStore((state) => state.setSelectedModelId);
  const updateModel = useAppStore((state) => state.updateModel);

  if (!models.length) return null;

  const handleDeleteModel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click
    deleteModel(id);
    setEnableCrop(false);
    // if the deleted model was selected, clear selection
    if (selectedModelID === id) setSelectedModelId(null);
  };

  const handleEnableWireframe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetedModel = models.find((m) => m.id === id);
    if (!targetedModel) return;
    updateModel(id, { wireframe: !targetedModel.wireframe });
  };

  const handleSelectModel = (id: string) => {
    if (id === selectedModelID) return;
    setSelectedModelId(id);
  };

  return (
    <div
      style={{
        ...styles.section,
        padding: "10px",
        borderTop: "1px solid #333",
      }}
    >
      <div
        style={{ ...styles.sectionTitle, fontSize: "14px", marginBottom: 10 }}
      >
        Models
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {models.map((model) => {
          const isSelected = model.id === selectedModelID;
          return (
            <div
              key={model.id}
              onClick={() => handleSelectModel(model.id)}
              role="button"
              aria-pressed={isSelected}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                background: isSelected ? "#0f1720" : "transparent",
                border: isSelected ? "1px solid #333" : "1px solid transparent",
                cursor: "pointer",
                transition: "background 0.12s, border 0.12s",
              }}
            >
              <div
                style={{
                  color: "#fff",
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "220px",
                }}
              >
                {model.name.split(".")[0]}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={(e) => handleEnableWireframe(model.id, e)}
                  style={{
                    background: model.wireframe ? "#0ea5e9" : "#2563eb",
                    border: "none",
                    color: "#fff",
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    lineHeight: 1,
                    boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.15)",
                  }}
                  title="Wireframe"
                >
                  <Grid3x3
                    size={16}
                    strokeWidth={2}
                    color={model.wireframe ? "#fff" : "#fff"}
                  />
                </button>

                <button
                  onClick={(e) => handleDeleteModel(model.id, e)}
                  style={{
                    background: "#b91c1c",
                    border: "none",
                    color: "#fff",
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    lineHeight: 1,
                    boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.15)",
                  }}
                  title="Delete model"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function Controllers() {
  const models = useAppStore((state) => state.models);
  const fitInsoleToFoot = useAppStore((state) => state.fitInsoleToFoot);
  const selectedModelID = useAppStore((state) => state.selectedModelID);
  const isCropEnabled = useAppStore((state) => state.isCropEnabled);
  const setCropBox = useAppStore((state) => state.setCropBox);
  const setEnableCrop = useAppStore((state) => state.setEnableCrop);
  const applyCrop = useAppStore((state) => state.applyCrop);
  const autoCrop = useAppStore((state) => state.autoCrop);
  const updateModel = useAppStore((state) => state.updateModel);
  const cropType = useAppStore((state) => state.cropType);
  const setCropType = useAppStore((state) => state.setCropType);
  const transformUiType = useAppStore((state) => state.transformUiType);
  const setTransformUiType = useAppStore((state) => state.setTransformUiType);
  const [gizmoMode, setGizmoMode] = useState<"translate" | "rotate" | "scale">(
    "translate"
  );
  const handleCropChange = () => {
    setEnableCrop(!isCropEnabled);
  };

  const handleCropTypeChange = (type: CropType) => {
    setCropType(type);
  };

  const handleAutoCropChange = () => {
    const selectedModel = useAppStore
      .getState()
      .models.find((m) => m.id === selectedModelID);
    if (!selectedModel || !selectedModelID) return;
    const savedRot = { ...selectedModel.rotation };
    updateModel(selectedModelID, { rotation: { x: 0, y: 0, z: 0 } });
    setTimeout(() => {
      autoCrop(selectedModelID, 96);
      setTimeout(() => updateModel(selectedModelID, { rotation: savedRot }), 0);
      applyCrop(selectedModelID);
      setEnableCrop(false);
      setCropBox({
        min: new Vector3(-50, -50, -50),
        max: new Vector3(50, 50, 50),
      });
      setCropType("box");
    }, 0);
  };

  const handleGizmoChange = (mode: "translate" | "rotate" | "scale") => {
    setGizmoMode(mode);
  };

  return (
    <div style={styles.container}>
      <style>{styleTag}</style>
      <div
        style={{
          ...styles.sectionTitle,
          marginBottom: "16px",
          fontSize: "20px",
          textAlign: "center",
        }}
      >
        Controllers
      </div>
      <ListModels />
      {selectedModelID && (
        <div
          style={!isCropEnabled ? { ...styles.section } : { border: "none" }}
        >
          <label
            onClick={handleCropChange}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              marginBottom: "12px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#fff",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={isCropEnabled}
              onChange={handleCropChange}
              style={{
                width: "14px",
                height: "14px",
                accentColor: "#2563eb",
                cursor: "pointer",
              }}
            />
            Enable Crop
          </label>
        </div>
      )}

      {isCropEnabled && (
        <div
          style={{
            ...styles.section,
            padding: "10px",
            borderTop: "1px solid #333",
            background: "#000",
            marginTop: 12,
          }}
        >
          <div
            style={{
              ...styles.sectionTitle,
              fontSize: "14px",
              marginBottom: 10,
            }}
          >
            Crop Mode
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["box", "auto crop"] as const).map((type) => {
              const active = cropType === type;
              return (
                <div
                  key={type}
                  onClick={() => handleCropTypeChange(type)}
                  role="button"
                  aria-pressed={active}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: active ? "#0f1720" : "transparent",
                    border: active ? "1px solid #333" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "background 0.12s, border 0.12s",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        display: "inline-block",
                        boxSizing: "border-box",
                        border: active ? "4px solid #2563eb" : "2px solid #777",
                        background: active ? "#2563eb" : "transparent",
                      }}
                    />
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 13,
                        letterSpacing: 0.2,
                        textTransform: "none",
                      }}
                    >
                      {type}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCropEnabled && cropType === "auto crop" && (
        <button className="controller-button" onClick={handleAutoCropChange}>
          Apply Auto Cropping
        </button>
      )}
      {isCropEnabled && cropType === "box" && <CropBoxController />}

      <OpacityController />

      {selectedModelID && (
        <div style={{ ...styles.section, borderBottom: "none" }}>
          <div style={styles.sectionTitle}>Transform Mode</div>
          <div
            role="tablist"
            aria-label="Transform mode"
            style={{
              display: "flex",
              gap: 4,
              padding: 2,
              borderRadius: 999,
              background: "#020617",
              border: "1px solid #333",
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={transformUiType === "slider"}
              onClick={() => setTransformUiType("slider")}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 999,
                border: "none",
                background:
                  transformUiType === "slider" ? "#2563eb" : "transparent",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
                letterSpacing: 0.3,
                textTransform: "none",
                transition: "background 0.15s",
              }}
            >
              Sliders
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={transformUiType === "gizmo"}
              onClick={() => setTransformUiType("gizmo")}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 999,
                border: "none",
                background:
                  transformUiType === "gizmo" ? "#2563eb" : "transparent",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
                letterSpacing: 0.3,
                textTransform: "none",
                transition: "background 0.15s",
              }}
            >
              Gizmo
            </button>
          </div>
        </div>
      )}

      {selectedModelID ? (
        transformUiType === "slider" ? (
          <>
            <PositionController />
            <RotationController />
            <ScaleController />
            {models.length === 2 && (
              <button
                className="controller-button"
                onClick={() => fitInsoleToFoot(models[0].id, models[1].id)}
              >
                Preset dimensions
              </button>
            )}
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <Move3d
              color={gizmoMode === "translate" ? "#2563eb" : "white"}
              style={{ cursor: "pointer" }}
              onClick={() => handleGizmoChange("translate")}
            />
            <Rotate3d
              color={gizmoMode === "rotate" ? "#2563eb" : "white"}
              style={{ cursor: "pointer" }}
              onClick={() => handleGizmoChange("rotate")}
            />
            <Scale3d
              color={gizmoMode === "scale" ? "#2563eb" : "white"}
              style={{ cursor: "pointer" }}
              onClick={() => handleGizmoChange("scale")}
            />
          </div>
        )
      ) : null}
    </div>
  );
}

export default Controllers;
