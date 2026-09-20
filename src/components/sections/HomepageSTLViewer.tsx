import {
  Component,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import * as THREE from "three";

import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface HomepageSTLViewerProps {
  url: string;

  autoRotate?: boolean;

  rotationSpeed?: number;

  zoomEnabled?: boolean;

  zoomLevel?: number;

  className?: string;

  showLoadingLabel?: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class STLViewerErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  public componentDidCatch(
    error: Error,
  ): void {
    console.error(
      "Homepage STL viewer failed:",
      error,
    );
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-0 items-center justify-center bg-neutral-950 px-6 text-center">
          <div>
            <p className="text-sm font-bold text-white">
              3D model unavailable
            </p>

            <p className="mt-2 text-xs text-neutral-400">
              Please try another STL model.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const BASE_CAMERA_DISTANCE = 4.8;

const MIN_CAMERA_DISTANCE = 2.2;

const MAX_CAMERA_DISTANCE = 10;

const MIN_ZOOM_LEVEL = 0.5;

const MAX_ZOOM_LEVEL = 2;

function clampZoomLevel(
  value: number,
): number {
  return Math.min(
    MAX_ZOOM_LEVEL,
    Math.max(
      MIN_ZOOM_LEVEL,
      Number.isFinite(value)
        ? value
        : 1,
    ),
  );
}

function getCameraDistance(
  zoomLevel: number,
): number {
  const safeZoom =
    clampZoomLevel(
      zoomLevel,
    );

  return Math.min(
    MAX_CAMERA_DISTANCE,
    Math.max(
      MIN_CAMERA_DISTANCE,
      BASE_CAMERA_DISTANCE /
        safeZoom,
    ),
  );
}

export default function HomepageSTLViewer({
  url,
  autoRotate = true,
  rotationSpeed = 0.7,
  zoomEnabled = true,
  zoomLevel = 1,
  className = "",
  showLoadingLabel = true,
}: HomepageSTLViewerProps) {
  const mountRef =
    useRef<HTMLDivElement>(
      null,
    );

  const cameraRef =
    useRef<THREE.PerspectiveCamera | null>(
      null,
    );

  const controlsRef =
    useRef<OrbitControls | null>(
      null,
    );

  const modelGroupRef =
    useRef<THREE.Group | null>(
      null,
    );

  const autoRotateRef =
    useRef(autoRotate);

  const rotationSpeedRef =
    useRef(rotationSpeed);

  const zoomEnabledRef =
    useRef(zoomEnabled);

  /*
   * =========================================================
   * LIVE PROP VALUES
   * =========================================================
   */

  useEffect(() => {
    autoRotateRef.current =
      autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    rotationSpeedRef.current =
      rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    zoomEnabledRef.current =
      zoomEnabled;

    if (controlsRef.current) {
      controlsRef.current.enableZoom =
        zoomEnabled;
    }
  }, [zoomEnabled]);

  /*
   * =========================================================
   * CHANGE DEFAULT ZOOM LIVE
   * =========================================================
   */

  useEffect(() => {
    const camera =
      cameraRef.current;

    const controls =
      controlsRef.current;

    if (!camera) {
      return;
    }

    const distance =
      getCameraDistance(
        zoomLevel,
      );

    /*
     * Keep the current viewing direction
     * while changing the zoom level.
     */

    const direction =
      camera.position.clone();

    if (
      direction.lengthSq() <
      0.0001
    ) {
      direction.set(
        0,
        0,
        1,
      );
    } else {
      direction.normalize();
    }

    camera.position.copy(
      direction.multiplyScalar(
        distance,
      ),
    );

    camera.updateProjectionMatrix();

    controls?.update();
  }, [zoomLevel]);

  /*
   * =========================================================
   * CREATE VIEWER
   * =========================================================
   */

  useEffect(() => {
    const container =
      mountRef.current;

    if (!container || !url) {
      return;
    }

    /*
     * =======================================================
     * SCENE
     * =======================================================
     */

    const scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(
        "#0b0b0b",
      );

    /*
     * =======================================================
     * CAMERA
     * =======================================================
     */

    const camera =
      new THREE.PerspectiveCamera(
        40,
        1,
        0.1,
        100,
      );

    const initialDistance =
      getCameraDistance(
        zoomLevel,
      );

    camera.position.set(
      0,
      0,
      initialDistance,
    );

    cameraRef.current =
      camera;

    /*
     * =======================================================
     * RENDERER
     * =======================================================
     */

    const renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2,
      ),
    );

    renderer.setSize(
      container.clientWidth,
      container.clientHeight,
    );

    renderer.shadowMap.enabled =
      true;

    renderer.shadowMap.type =
      THREE.PCFShadowMap;

    container.appendChild(
      renderer.domElement,
    );

    /*
     * =======================================================
     * LIGHTS
     * =======================================================
     */

    const ambientLight =
      new THREE.AmbientLight(
        0xffffff,
        1.8,
      );

    scene.add(
      ambientLight,
    );

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        3.8,
      );

    directionalLight.position.set(
      4,
      6,
      5,
    );

    directionalLight.castShadow =
      true;

    scene.add(
      directionalLight,
    );

    const secondaryLight =
      new THREE.DirectionalLight(
        0xffffff,
        2.1,
      );

    secondaryLight.position.set(
      -4,
      2,
      1,
    );

    scene.add(
      secondaryLight,
    );

    const pointLight =
      new THREE.PointLight(
        0xffffff,
        1.4,
      );

    pointLight.position.set(
      0,
      -1,
      4,
    );

    scene.add(
      pointLight,
    );

    /*
     * =======================================================
     * MODEL GROUP
     * =======================================================
     */

    const modelGroup =
      new THREE.Group();

    modelGroupRef.current =
      modelGroup;

    scene.add(
      modelGroup,
    );

    /*
     * =======================================================
     * CONTROLS
     * =======================================================
     */

    const controls =
      new OrbitControls(
        camera,
        renderer.domElement,
      );

    controls.enablePan =
      false;

    controls.enableDamping =
      true;

    controls.dampingFactor =
      0.08;

    controls.enableZoom =
      zoomEnabledRef.current;

    controls.minDistance =
      MIN_CAMERA_DISTANCE;

    controls.maxDistance =
      MAX_CAMERA_DISTANCE;

    controls.rotateSpeed =
      0.7;

    controls.zoomSpeed =
      0.8;

    controlsRef.current =
      controls;

    /*
     * =======================================================
     * STL LOADER
     * =======================================================
     */

    const loader =
      new STLLoader();

    let geometry:
      THREE.BufferGeometry | null =
      null;

    let material:
      THREE.MeshStandardMaterial | null =
      null;

    let mesh:
      THREE.Mesh | null =
      null;

    let disposed = false;

    loader.load(
      url,

      (loadedGeometry) => {
        if (disposed) {
          loadedGeometry.dispose();
          return;
        }

        geometry =
          loadedGeometry;

        geometry.computeVertexNormals();

        geometry.computeBoundingBox();

        const box =
          geometry.boundingBox ??
          new THREE.Box3();

        const center =
          new THREE.Vector3();

        const size =
          new THREE.Vector3();

        box.getCenter(
          center,
        );

        box.getSize(
          size,
        );

        /*
         * Center model
         */

        geometry.translate(
          -center.x,
          -center.y,
          -center.z,
        );

        /*
         * Normalize model size
         */

        const largestDimension =
          Math.max(
            size.x,
            size.y,
            size.z,
            0.001,
          );

        const scale =
          2.8 /
          largestDimension;

        geometry.scale(
          scale,
          scale,
          scale,
        );

        /*
         * Material
         */

        material =
          new THREE.MeshStandardMaterial({
            color: "#d4af37",
            metalness: 0.72,
            roughness: 0.27,
          });

        /*
         * Mesh
         */

        mesh =
          new THREE.Mesh(
            geometry,
            material,
          );

        mesh.castShadow =
          true;

        mesh.receiveShadow =
          true;

        modelGroup.add(
          mesh,
        );
      },

      undefined,

      (error) => {
        console.error(
          "Failed to load STL:",
          error,
        );
      },
    );

    /*
     * =======================================================
     * RESIZE
     * =======================================================
     */

    const resize = () => {
      if (!container) {
        return;
      }

      const width =
        container.clientWidth;

      const height =
        container.clientHeight;

      if (
        width <= 0 ||
        height <= 0
      ) {
        return;
      }

      camera.aspect =
        width / height;

      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height,
        false,
      );
    };

    resize();

    const resizeObserver =
      new ResizeObserver(
        resize,
      );

    resizeObserver.observe(
      container,
    );

    /*
     * =======================================================
     * ANIMATION
     * =======================================================
     */

    let animationFrameId = 0;

    let previousTime =
      performance.now();

    const animate = (
      currentTime: number,
    ) => {
      if (disposed) {
        return;
      }

      const delta =
        Math.min(
          (currentTime -
            previousTime) /
            1000,
          0.05,
        );

      previousTime =
        currentTime;

      if (
        autoRotateRef.current &&
        modelGroupRef.current
      ) {
        modelGroupRef.current.rotation.y +=
          delta *
          Math.min(
            2.5,
            Math.max(
              0.1,
              rotationSpeedRef.current,
            ),
          );
      }

      controls.update();

      renderer.render(
        scene,
        camera,
      );

      animationFrameId =
        requestAnimationFrame(
          animate,
        );
    };

    animationFrameId =
      requestAnimationFrame(
        animate,
      );

    /*
     * =======================================================
     * CLEANUP
     * =======================================================
     */

    return () => {
      disposed = true;

      cancelAnimationFrame(
        animationFrameId,
      );

      resizeObserver.disconnect();

      controls.dispose();

      if (mesh) {
        modelGroup.remove(
          mesh,
        );
      }

      geometry?.dispose();

      material?.dispose();

      renderer.dispose();

      if (
        container.contains(
          renderer.domElement,
        )
      ) {
        container.removeChild(
          renderer.domElement,
        );
      }

      cameraRef.current =
        null;

      controlsRef.current =
        null;

      modelGroupRef.current =
        null;
    };
  }, [url]);

  if (!url) {
    return null;
  }

  return (
    <STLViewerErrorBoundary>
      <div
        className={`relative h-full w-full overflow-hidden ${className}`}
      >

        <div
          ref={mountRef}
          className="h-full w-full"
        />

        {showLoadingLabel && (
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-300 backdrop-blur">
            3D Model
          </div>
        )}

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs backdrop-blur">

          <span className="font-bold text-neutral-200">
            Drag to rotate
            {zoomEnabled
              ? " • Scroll to zoom"
              : ""}
          </span>

          <span className="font-black text-[#D4AF37]">
            {autoRotate
              ? "AUTO"
              : "MANUAL"}
          </span>

        </div>

      </div>
    </STLViewerErrorBoundary>
  );
}