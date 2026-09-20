export interface Homepage3DModel {
  id: "current";

  enabled: boolean;

  title: string;

  description: string;

  fileUrl: string;

  storagePath: string;

  originalFileName: string;

  rotationEnabled: boolean;

  rotationSpeed: number;

  zoomEnabled: boolean;

  zoomLevel: number;

  updatedAt?: unknown;
}

export const defaultHomepage3DModel: Homepage3DModel = {
  id: "current",

  enabled: false,

  title: "Nexletronics 3D Model",

  description:
    "Interactive 3D printed model.",

  fileUrl: "",

  storagePath: "",

  originalFileName: "",

  rotationEnabled: true,

  rotationSpeed: 0.7,

  zoomEnabled: true,

  zoomLevel: 1,

  updatedAt: undefined,
};