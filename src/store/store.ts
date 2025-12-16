import {
  BufferGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Mesh,
  Quaternion,
  Vector3,
  type TypedArray,
} from "three";
import { create } from "zustand";

export type CropType = "auto crop" | "box";
export type TransformType = "translate" | "rotate" | "scale";
export type TransformUiType = "slider" | "gizmo";

export interface Model {
  id: string;
  name: string;
  scale: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  geometry: BufferGeometry;
  opacity: number;
  wireframe: boolean;
}

interface HistoryState {
  models: Model[];
  selectedModelId: string | null;
}

export interface AppState {
  models: Model[];
  selectedModelID: string | null;
  selectedModel: Model | null;
  history: HistoryState[];
  historyIndex: number;
  cropUndoStacks: Record<string, BufferGeometry[]>;
  cropRedoStacks: Record<string, BufferGeometry[]>;

  cropBox: { min: Vector3; max: Vector3 };
  isCropEnabled: boolean;
  cropType: CropType;
  transformUiType: TransformUiType;
  transformMode: TransformType | null;

  autoZoomVersion: number;
  meshRefs: Record<string, Mesh | null>;
  setMeshRef: (id: string, mesh: Mesh | null) => void;

  setCropType: (type: CropType) => void;
  setModels: (model: Model) => void;
  deleteModel: (id: string) => void;
  updateModel: (id: string, data: Partial<Model>) => void;
  setSelectedModelId: (id: string | null) => void;
  updateModelGeometry: (id: string, geometry: BufferGeometry) => void;
  setCropBox: (box: { min: Vector3; max: Vector3 }) => void;
  setEnableCrop: (enabled: boolean) => void;
  applyCrop: (id: string) => void;
  autoCrop: (id: string, resolution?: number) => void;
  setTransformUiType: (type: TransformUiType) => void;
  setTransformMode: (mode: TransformType | null) => void;
  fitInsoleToFoot: (footId: string, insoleId: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  cropUndo: (id: string) => void;
  cropRedo: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  models: [],
  selectedModelID: null,
  selectedModel: null,
  cropBox: { min: new Vector3(-50, -50, -50), max: new Vector3(50, 50, 50) },
  isCropEnabled: false,
  cropType: "box",
  transformUiType: "slider",
  transformMode: null,
  history: [],
  historyIndex: -1,
  cropUndoStacks: {},
  cropRedoStacks: {},

  autoZoomVersion: 0,
  meshRefs: {},
  // setMeshRef: (id, mesh) =>
  //   set((state) => ({
  //     meshRefs: {
  //       ...state.meshRefs,
  //       [id]: mesh,
  //     },
  //   })),

  setMeshRef: (id, mesh) =>
    set((state) => {
      const wasEmpty = Object.keys(state.meshRefs).length === 0;
      console.log("wasEmpty", wasEmpty);
      const nextRefs = {
        ...state.meshRefs,
        [id]: mesh,
      };

      return {
        meshRefs: nextRefs,
        autoZoomVersion:
          wasEmpty && mesh ? state.autoZoomVersion + 1 : state.autoZoomVersion,
      };
    }),

  setEnableCrop: (enabled) => set({ isCropEnabled: enabled }),
  setModels: (model: Model) =>
    set((state) => {
      const existingModel = state.models.find((m) => m.name === model.name);
      if (existingModel) return state;
      return {
        models: [...state.models, model],
        autoZoomVersion: state.autoZoomVersion + 1,
      };
    }),
  updateModel: (id, data) =>
    set((state) => {
      const model = state.models.find((m) => m.id === id);
      if (!model) return state;
      return {
        models: state.models.map((m) => (m.id === id ? { ...m, ...data } : m)),
      };
    }),
  deleteModel: (id) =>
    set((state) => ({
      models: state.models.filter((m) => m.id !== id),
    })),
  setSelectedModelId: (id: string | null) =>
    set((state) => {
      if (state.selectedModelID === id) {
        return state;
      } else if (id === null) return { selectedModelID: null };
      return { selectedModelID: id };
    }),
  updateModelGeometry: (id, geometry) =>
    set((state) => ({
      models: state.models.map((model) =>
        model.id === id ? { ...model, geometry } : model
      ),
    })),
  // setCropBox: (box) => set({ cropBox: { min: box.min, max: box.max } }),
  setCropBox: (box) =>
    set({
      cropBox: {
        min: box.min.clone(),
        max: box.max.clone(),
      },
    }),

  undo: () =>
    set((state: AppState) => {
      if (state.historyIndex > 0) {
        return { historyIndex: state.historyIndex - 1 };
      }
      return state;
    }),

  redo: () =>
    set((state: AppState) => {
      if (state.historyIndex < state.history.length - 1) {
        return { historyIndex: state.historyIndex + 1 };
      }
      return state;
    }),

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  cropUndo: (id: string) =>
    set((state: AppState) => {
      const modelIndex = state.models.findIndex((m) => m.id === id);
      if (modelIndex === -1) return state;

      const undoStack = state.cropUndoStacks[id] ?? [];
      if (undoStack.length === 0) return state;

      const redoStack = state.cropRedoStacks[id] ?? [];

      // Take last undo geometry
      const previousGeometry = undoStack[undoStack.length - 1].clone();

      // Push current geometry into redo
      const currentGeometry = state.models[modelIndex].geometry.clone();

      return {
        models: state.models.map((model, index) =>
          index === modelIndex
            ? {
                ...model,
                geometry: previousGeometry,
              }
            : model
        ),

        cropUndoStacks: {
          ...state.cropUndoStacks,
          [id]: undoStack.slice(0, -1),
        },

        cropRedoStacks: {
          ...state.cropRedoStacks,
          [id]: [...redoStack, currentGeometry],
        },
      };
    }),

  cropRedo: (id: string) =>
    set((state: AppState) => {
      const modelIndex = state.models.findIndex((m) => m.id === id);
      if (modelIndex === -1) return state;

      const redoStack = state.cropRedoStacks[id] ?? [];
      if (redoStack.length === 0) return state;

      const undoStack = state.cropUndoStacks[id] ?? [];

      // Take last redo geometry
      const nextGeometry = redoStack[redoStack.length - 1].clone();

      // Save current geometry into undo stack
      const currentGeometry = state.models[modelIndex].geometry.clone();

      return {
        models: state.models.map((model, index) =>
          index === modelIndex
            ? {
                ...model,
                geometry: nextGeometry,
              }
            : model
        ),

        cropUndoStacks: {
          ...state.cropUndoStacks,
          [id]: [...undoStack, currentGeometry],
        },

        cropRedoStacks: {
          ...state.cropRedoStacks,
          [id]: redoStack.slice(0, -1),
        },
      };
    }),

  setCropType: (type) => set({ cropType: type }),

  setTransformUiType: (type) => set({ transformUiType: type }),
  setTransformMode: (mode) => set({ transformMode: mode }),

  fitInsoleToFoot: (footId, insoleId) =>
    set((state) => {
      const foot = state.models.find((m) => m.id === footId);
      const insole = state.models.find((m) => m.id === insoleId);
      if (!foot || !insole) return state;

      // ---- FOOT SIZE ----
      const footGeom = foot.geometry.clone();
      footGeom.computeBoundingBox();
      if (!footGeom.boundingBox) return state;

      const footSize = new Vector3();
      footGeom.boundingBox.getSize(footSize);
      footSize.multiply(new Vector3(foot.scale.x, foot.scale.y, foot.scale.z));

      // ---- INSOLE SIZE ----
      const insoleGeom = insole.geometry.clone();
      insoleGeom.computeBoundingBox();
      if (!insoleGeom.boundingBox) return state;

      const insoleSize = new Vector3();
      insoleGeom.boundingBox.getSize(insoleSize);

      // ---- SCALE FACTORS ----
      const scaleX = footSize.x / insoleSize.x;
      const scaleZ = footSize.z / insoleSize.z;
      const scaleY = footSize.y / insoleSize.y;

      // ---- ALIGN CENTERS ----
      // Foot center in world space
      const footLocalCenter = footGeom.boundingBox.getCenter(new Vector3());
      const footCenter = footLocalCenter
        .multiply(new Vector3(foot.scale.x, foot.scale.y, foot.scale.z))
        .add(new Vector3(foot.position.x, foot.position.y, foot.position.z));

      // Insole center in its local space (unscaled)
      const insoleLocalCenter = insoleGeom.boundingBox.getCenter(new Vector3());

      // Calculate new position so insole center aligns with foot center
      const newPosition = {
        x: footCenter.x - insoleLocalCenter.x * scaleX,
        y: footCenter.y - insoleLocalCenter.y * scaleY,
        z: footCenter.z - insoleLocalCenter.z * scaleZ,
      };

      return {
        models: state.models.map((m) =>
          m.id === insoleId
            ? {
                ...m,
                scale: { x: scaleX, y: scaleY, z: 1 },
                position: newPosition,
                rotation: { ...foot.rotation },
              }
            : m
        ),
      };
    }),

  applyCrop: (id) =>
    set((state) => {
      const modelIndex = state.models.findIndex((m) => m.id === id);
      if (modelIndex === -1) return state;

      const model = state.models[modelIndex];

      // ensure undo/redo stacks exist for this model
      if (!state.cropUndoStacks[id]) state.cropUndoStacks[id] = [];
      if (!state.cropRedoStacks[id]) state.cropRedoStacks[id] = [];

      // push current geometry onto undo stack and clear redo
      try {
        state.cropUndoStacks[id].push(model.geometry.clone());
      } catch (e) {
        // ignore cloning errors
      }
      state.cropRedoStacks[id] = [];

      const mPos = model.position ?? { x: 0, y: 0, z: 0 };
      const mRot = model.rotation ?? { x: 0, y: 0, z: 0 };
      const mScale = model.scale ?? { x: 1, y: 1, z: 1 };

      /* --------------------------------------------------
       1. CLONE & BAKE TRANSFORMS INTO GEOMETRY
    -------------------------------------------------- */
      const geom = model.geometry.clone();
      const posAttr: any = geom.getAttribute("position");
      if (!posAttr) return state;

      const bakeEuler = new Euler(mRot.x, mRot.y, mRot.z, "XYZ");
      const bakeQuat = new Quaternion().setFromEuler(bakeEuler);

      // bake rotation
      geom.applyQuaternion(bakeQuat);

      // ✅ bake scale
      geom.scale(mScale.x, mScale.y, mScale.z);

      // bake translation
      geom.translate(mPos.x, mPos.y, mPos.z);

      /* --------------------------------------------------
       2. USE WORLD-SPACE CROP BOX DIRECTLY
    -------------------------------------------------- */
      const worldMin = state.cropBox.min.clone();
      const worldMax = state.cropBox.max.clone();

      const EPS = 1e-9;

      function intersectEdge(
        a: Vector3,
        b: Vector3,
        axis: "x" | "y" | "z",
        value: number
      ) {
        const da = a[axis];
        const db = b[axis];
        const denom = db - da;
        if (Math.abs(denom) < 1e-12) return null;
        const t = (value - da) / denom;
        if (!isFinite(t)) return null;
        return new Vector3().copy(b).sub(a).multiplyScalar(t).add(a);
      }

      function clipPolygon(
        polygon: Vector3[],
        axis: "x" | "y" | "z",
        value: number,
        keepGreater: boolean
      ) {
        const out: Vector3[] = [];
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i];
          const b = polygon[(i + 1) % polygon.length];
          const aIn = keepGreater
            ? a[axis] >= value - EPS
            : a[axis] <= value + EPS;
          const bIn = keepGreater
            ? b[axis] >= value - EPS
            : b[axis] <= value + EPS;

          if (aIn && bIn) out.push(b.clone());
          else if (aIn && !bIn) {
            const ip = intersectEdge(a, b, axis, value);
            if (ip) out.push(ip);
          } else if (!aIn && bIn) {
            const ip = intersectEdge(a, b, axis, value);
            if (ip) out.push(ip);
            out.push(b.clone());
          }
        }
        return out;
      }

      const triangulate = (poly: Vector3[]) => {
        const out: number[] = [];
        for (let i = 1; i < poly.length - 1; i++) {
          out.push(
            poly[0].x,
            poly[0].y,
            poly[0].z,
            poly[i].x,
            poly[i].y,
            poly[i].z,
            poly[i + 1].x,
            poly[i + 1].y,
            poly[i + 1].z
          );
        }
        return out;
      };

      const positions: number[] = [];
      const indexAttr = geom.index;

      const planes = [
        { axis: "x" as const, value: worldMin.x, keep: true },
        { axis: "x" as const, value: worldMax.x, keep: false },
        { axis: "y" as const, value: worldMin.y, keep: true },
        { axis: "y" as const, value: worldMax.y, keep: false },
        { axis: "z" as const, value: worldMin.z, keep: true },
        { axis: "z" as const, value: worldMax.z, keep: false },
      ];

      const a = new Vector3(),
        b = new Vector3(),
        c = new Vector3();

      const readTri = (i0: number, i1: number, i2: number) => {
        a.set(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
        b.set(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
        c.set(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));
      };

      if (indexAttr) {
        const idx = indexAttr.array as any;
        for (let i = 0; i < idx.length; i += 3) {
          readTri(idx[i], idx[i + 1], idx[i + 2]);
          let poly = [a.clone(), b.clone(), c.clone()];
          for (const p of planes) {
            poly = clipPolygon(poly, p.axis, p.value, p.keep);
            if (poly.length < 3) break;
          }
          if (poly.length >= 3) positions.push(...triangulate(poly));
        }
      } else {
        for (let i = 0; i < posAttr.count; i += 3) {
          readTri(i, i + 1, i + 2);
          let poly = [a.clone(), b.clone(), c.clone()];
          for (const p of planes) {
            poly = clipPolygon(poly, p.axis, p.value, p.keep);
            if (poly.length < 3) break;
          }
          if (poly.length >= 3) positions.push(...triangulate(poly));
        }
      }

      if (!positions.length) return state;

      /* --------------------------------------------------
       3. BUILD NEW GEOMETRY & RECENTER
    -------------------------------------------------- */
      const newGeom = new BufferGeometry();
      newGeom.setAttribute(
        "position",
        new Float32BufferAttribute(positions, 3)
      );
      newGeom.computeVertexNormals();
      newGeom.computeBoundingBox();

      const center = new Vector3();
      newGeom.boundingBox!.getCenter(center);
      newGeom.translate(-center.x, -center.y, -center.z);

      /* --------------------------------------------------
       4. RESET MODEL TRANSFORM (NEW ORIGINAL)
    -------------------------------------------------- */
      model.geometry.dispose();

      const newModels = state.models.map((m, idx) =>
        idx === modelIndex
          ? {
              ...m,
              geometry: newGeom,
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            }
          : m
      );

      return { models: newModels, autoZoomVersion: state.autoZoomVersion + 1 };
    }),

  // autoCrop: unchanged from your version (keeps world-space voxelization)
  autoCrop: (id, resolution = 64) =>
    set((state) => {
      const modelIndex = state.models.findIndex((m) => m.id === id);
      if (modelIndex === -1) return state;
      const model = state.models[modelIndex];
      const geom = model.geometry;
      const posAttr: any = geom.getAttribute("position");
      if (!posAttr) return state;

      const mPos = model.position ?? { x: 0, y: 0, z: 0 };
      const mRot = model.rotation ?? { x: 0, y: 0, z: 0 };
      const mScale = model.scale ?? { x: 1, y: 1, z: 1 };

      const mat = new Matrix4();
      const euler = new Euler(mRot.x, mRot.y, mRot.z, "XYZ");
      const q = new Quaternion().setFromEuler(euler);
      mat.compose(
        new Vector3(mPos.x, mPos.y, mPos.z),
        q,
        new Vector3(mScale.x, mScale.y, mScale.z)
      );

      const worldVerts: Vector3[] = [];
      const tmp = new Vector3();
      const indexAttr = geom.index;
      if (indexAttr) {
        const indexArray: TypedArray = indexAttr.array;
        for (let i = 0; i < indexArray.length; i++) {
          const vi = indexArray[i];
          tmp.set(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi));
          tmp.applyMatrix4(mat);
          worldVerts.push(tmp.clone());
        }
      } else {
        const vertCount = posAttr.count;
        for (let i = 0; i < vertCount; i++) {
          tmp.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
          tmp.applyMatrix4(mat);
          worldVerts.push(tmp.clone());
        }
      }

      if (worldVerts.length === 0) return state;

      const wMin = new Vector3(Infinity, Infinity, Infinity);
      const wMax = new Vector3(-Infinity, -Infinity, -Infinity);
      for (const v of worldVerts) {
        wMin.min(v);
        wMax.max(v);
      }

      // guard
      const eps = 1e-6;
      if (wMax.x - wMin.x < eps) wMax.x = wMin.x + 1;
      if (wMax.y - wMin.y < eps) wMax.y = wMin.y + 1;
      if (wMax.z - wMin.z < eps) wMax.z = wMin.z + 1;

      const nx = Math.max(8, Math.min(128, Math.floor(resolution)));
      const extent = new Vector3().subVectors(wMax, wMin);
      const maxExtent = Math.max(extent.x, extent.y, extent.z);
      const voxelSize = maxExtent / nx;
      const gx = Math.max(1, Math.ceil(extent.x / voxelSize));
      const gy = Math.max(1, Math.ceil(extent.y / voxelSize));
      const gz = Math.max(1, Math.ceil(extent.z / voxelSize));

      const gridSize = gx * gy * gz;
      const voxels = new Uint8Array(gridSize);

      const idxOf = (ix: number, iy: number, iz: number) =>
        ix + iy * gx + iz * gx * gy;

      for (const v of worldVerts) {
        const ix = Math.min(
          gx - 1,
          Math.max(0, Math.floor((v.x - wMin.x) / voxelSize))
        );
        const iy = Math.min(
          gy - 1,
          Math.max(0, Math.floor((v.y - wMin.y) / voxelSize))
        );
        const iz = Math.min(
          gz - 1,
          Math.max(0, Math.floor((v.z - wMin.z) / voxelSize))
        );
        voxels[idxOf(ix, iy, iz)] = 1;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              const nxix = ix + dx;
              const nyiy = iy + dy;
              const nziy = iz + dz;
              if (
                nxix >= 0 &&
                nxix < gx &&
                nyiy >= 0 &&
                nyiy < gy &&
                nziy >= 0 &&
                nziy < gz
              ) {
                voxels[idxOf(nxix, nyiy, nziy)] = 1;
              }
            }
          }
        }
      }

      const compId = new Int32Array(gridSize).fill(-1);
      let currentComp = 0;
      const compsCount: number[] = [];
      const compsTouchFloor: boolean[] = [];
      const stack: number[] = [];

      for (let i = 0; i < gridSize; i++) {
        if (voxels[i] === 0 || compId[i] !== -1) continue;
        let count = 0;
        let touchesFloor = false;
        stack.push(i);
        compId[i] = currentComp;
        while (stack.length > 0) {
          const idx = stack.pop()!;
          count++;
          const iz = Math.floor(idx / (gx * gy));
          const rem = idx - iz * gx * gy;
          const iy = Math.floor(rem / gx);
          const ix = rem % gx;
          // NOTE: world Y is 'iy' here (we prefer iy === 0 as touching the bottom)
          if (iy === 0) touchesFloor = true;
          const neighs = [
            [ix - 1, iy, iz],
            [ix + 1, iy, iz],
            [ix, iy - 1, iz],
            [ix, iy + 1, iz],
            [ix, iy, iz - 1],
            [ix, iy, iz + 1],
          ];
          for (const [nxix, nyiy, nziy] of neighs) {
            if (
              nxix >= 0 &&
              nxix < gx &&
              nyiy >= 0 &&
              nyiy < gy &&
              nziy >= 0 &&
              nziy < gz
            ) {
              const nidx = idxOf(nxix, nyiy, nziy);
              if (voxels[nidx] && compId[nidx] === -1) {
                compId[nidx] = currentComp;
                stack.push(nidx);
              }
            }
          }
        }
        compsCount.push(count);
        compsTouchFloor.push(touchesFloor);
        currentComp++;
      }

      if (currentComp === 0) {
        return state;
      }

      // prefer components touching the bottom (iy === 0). fallback to largest component.
      let chosenComp = -1;
      let bestCount = -1;
      for (let cid = 0; cid < currentComp; cid++) {
        if (!compsTouchFloor[cid]) continue;
        if (compsCount[cid] > bestCount) {
          bestCount = compsCount[cid];
          chosenComp = cid;
        }
      }
      if (chosenComp === -1) {
        for (let cid = 0; cid < currentComp; cid++) {
          if (compsCount[cid] > bestCount) {
            bestCount = compsCount[cid];
            chosenComp = cid;
          }
        }
      }

      if (chosenComp === -1) return state;

      const compMin = new Vector3(gx, gy, gz);
      const compMax = new Vector3(-1, -1, -1);
      for (let iz = 0; iz < gz; iz++) {
        for (let iy = 0; iy < gy; iy++) {
          for (let ix = 0; ix < gx; ix++) {
            const iidx = idxOf(ix, iy, iz);
            if (compId[iidx] === chosenComp) {
              compMin.min(new Vector3(ix, iy, iz));
              compMax.max(new Vector3(ix, iy, iz));
            }
          }
        }
      }

      const pad = voxelSize * 0.5;
      const worldMinComp = new Vector3(
        wMin.x + compMin.x * voxelSize - pad,
        wMin.y + compMin.y * voxelSize - pad,
        wMin.z + compMin.z * voxelSize - pad
      );
      const worldMaxComp = new Vector3(
        wMin.x + (compMax.x + 1) * voxelSize + pad,
        wMin.y + (compMax.y + 1) * voxelSize + pad,
        wMin.z + (compMax.z + 1) * voxelSize + pad
      );

      worldMinComp.max(wMin);
      worldMaxComp.min(wMax);

      const newCropBox = { min: worldMinComp, max: worldMaxComp };
      return { ...state, cropBox: newCropBox };
    }),
}));
