export interface StlDimensions {
  width: number;
  depth: number;
  height: number;
  volumeCm3: number;
  triangleCount: number;
}


/*
 * ==========================================================
 * READ 32-BIT LITTLE-ENDIAN FLOAT
 * ==========================================================
 */

function readFloat32(
  view: DataView,
  offset: number,
): number {

  return view.getFloat32(
    offset,
    true,
  );
}


/*
 * ==========================================================
 * VECTOR
 * ==========================================================
 */

interface Vector3 {
  x: number;
  y: number;
  z: number;
}


/*
 * ==========================================================
 * CROSS PRODUCT
 * ==========================================================
 */

function cross(
  a: Vector3,
  b: Vector3,
): Vector3 {

  return {
    x:
      a.y * b.z -
      a.z * b.y,

    y:
      a.z * b.x -
      a.x * b.z,

    z:
      a.x * b.y -
      a.y * b.x,
  };
}


/*
 * ==========================================================
 * DOT PRODUCT
 * ==========================================================
 */

function dot(
  a: Vector3,
  b: Vector3,
): number {

  return (
    a.x * b.x +
    a.y * b.y +
    a.z * b.z
  );
}


/*
 * ==========================================================
 * TRIANGLE VOLUME
 * ==========================================================
 *
 * Signed tetrahedron volume.
 *
 * STL coordinates are normally expressed in millimeters.
 */

function triangleSignedVolume(
  a: Vector3,
  b: Vector3,
  c: Vector3,
): number {

  return (
    dot(
      a,
      cross(
        b,
        c,
      ),
    ) /
    6
  );
}


/*
 * ==========================================================
 * DETECT BINARY STL
 * ==========================================================
 */

function isBinaryStl(
  buffer: ArrayBuffer,
): boolean {

  if (
    buffer.byteLength <
    84
  ) {

    return false;
  }


  const view =
    new DataView(
      buffer,
    );


  const triangleCount =
    view.getUint32(
      80,
      true,
    );


  const expectedSize =
    84 +
    triangleCount * 50;


  return (
    expectedSize ===
    buffer.byteLength
  );
}


/*
 * ==========================================================
 * PARSE BINARY STL
 * ==========================================================
 */

function parseBinaryStl(
  buffer: ArrayBuffer,
): StlDimensions {

  const view =
    new DataView(
      buffer,
    );


  const triangleCount =
    view.getUint32(
      80,
      true,
    );


  if (
    triangleCount <=
    0
  ) {

    throw new Error(
      "The STL contains no triangles.",
    );
  }


  let minX =
    Number.POSITIVE_INFINITY;

  let minY =
    Number.POSITIVE_INFINITY;

  let minZ =
    Number.POSITIVE_INFINITY;


  let maxX =
    Number.NEGATIVE_INFINITY;

  let maxY =
    Number.NEGATIVE_INFINITY;

  let maxZ =
    Number.NEGATIVE_INFINITY;


  let signedVolume =
    0;


  for (
    let index = 0;
    index < triangleCount;
    index += 1
  ) {

    /*
     * Each binary STL triangle is 50 bytes.
     *
     * 12 bytes normal
     * 36 bytes vertices
     * 2 bytes attribute
     */

    const base =
      84 +
      index * 50;


    const a: Vector3 = {
      x:
        readFloat32(
          view,
          base + 12,
        ),

      y:
        readFloat32(
          view,
          base + 16,
        ),

      z:
        readFloat32(
          view,
          base + 20,
        ),
    };


    const b: Vector3 = {
      x:
        readFloat32(
          view,
          base + 24,
        ),

      y:
        readFloat32(
          view,
          base + 28,
        ),

      z:
        readFloat32(
          view,
          base + 32,
        ),
    };


    const c: Vector3 = {
      x:
        readFloat32(
          view,
          base + 36,
        ),

      y:
        readFloat32(
          view,
          base + 40,
        ),

      z:
        readFloat32(
          view,
          base + 44,
        ),
    };


    const vertices = [
      a,
      b,
      c,
    ];


    for (
      const vertex of
        vertices
    ) {

      minX =
        Math.min(
          minX,
          vertex.x,
        );

      minY =
        Math.min(
          minY,
          vertex.y,
        );

      minZ =
        Math.min(
          minZ,
          vertex.z,
        );

      maxX =
        Math.max(
          maxX,
          vertex.x,
        );

      maxY =
        Math.max(
          maxY,
          vertex.y,
        );

      maxZ =
        Math.max(
          maxZ,
          vertex.z,
        );
    }


    signedVolume +=
      triangleSignedVolume(
        a,
        b,
        c,
      );
  }


  const volumeMm3 =
    Math.abs(
      signedVolume,
    );


  return {
    width:
      Math.max(
        0,
        maxX - minX,
      ),

    depth:
      Math.max(
        0,
        maxY - minY,
      ),

    height:
      Math.max(
        0,
        maxZ - minZ,
      ),

    volumeCm3:
      volumeMm3 /
      1000,

    triangleCount,
  };
}


/*
 * ==========================================================
 * PARSE ASCII STL
 * ==========================================================
 */

function parseAsciiStl(
  text: string,
): StlDimensions {

  const vertexPattern =
    /vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/gi;


  const vertices:
    Vector3[] =
    [];


  let match:
    RegExpExecArray | null;


  while (
    (
      match =
        vertexPattern.exec(
          text,
        )
    ) !== null
  ) {

    vertices.push({
      x:
        Number(
          match[1],
        ),

      y:
        Number(
          match[2],
        ),

      z:
        Number(
          match[3],
        ),
    });
  }


  if (
    vertices.length <
    3
  ) {

    throw new Error(
      "The STL file could not be parsed.",
    );
  }


  let minX =
    Number.POSITIVE_INFINITY;

  let minY =
    Number.POSITIVE_INFINITY;

  let minZ =
    Number.POSITIVE_INFINITY;

  let maxX =
    Number.NEGATIVE_INFINITY;

  let maxY =
    Number.NEGATIVE_INFINITY;

  let maxZ =
    Number.NEGATIVE_INFINITY;


  let signedVolume =
    0;


  for (
    let index = 0;
    index + 2 <
      vertices.length;
    index += 3
  ) {

    const a =
      vertices[
        index
      ];

    const b =
      vertices[
        index + 1
      ];

    const c =
      vertices[
        index + 2
      ];


    for (
      const vertex of [
        a,
        b,
        c,
      ]
    ) {

      minX =
        Math.min(
          minX,
          vertex.x,
        );

      minY =
        Math.min(
          minY,
          vertex.y,
        );

      minZ =
        Math.min(
          minZ,
          vertex.z,
        );

      maxX =
        Math.max(
          maxX,
          vertex.x,
        );

      maxY =
        Math.max(
          maxY,
          vertex.y,
        );

      maxZ =
        Math.max(
          maxZ,
          vertex.z,
        );
    }


    signedVolume +=
      triangleSignedVolume(
        a,
        b,
        c,
      );
  }


  const triangleCount =
    Math.floor(
      vertices.length / 3,
    );


  return {
    width:
      Math.max(
        0,
        maxX - minX,
      ),

    depth:
      Math.max(
        0,
        maxY - minY,
      ),

    height:
      Math.max(
        0,
        maxZ - minZ,
      ),

    volumeCm3:
      Math.abs(
        signedVolume,
      ) / 1000,

    triangleCount,
  };
}


/*
 * ==========================================================
 * PARSE STL FILE
 * ==========================================================
 */

export async function parseStlFile(
  file: File,
): Promise<StlDimensions> {

  const buffer =
    await file.arrayBuffer();


  if (
    buffer.byteLength <
    3
  ) {

    throw new Error(
      "The STL file is too small to contain a valid model.",
    );
  }


  /*
   * Binary STL first.
   */

  if (
    isBinaryStl(
      buffer,
    )
  ) {

    return parseBinaryStl(
      buffer,
    );
  }


  /*
   * Otherwise treat it as ASCII STL.
   */

  const text =
    new TextDecoder(
      "utf-8",
    ).decode(
      buffer,
    );


  return parseAsciiStl(
    text,
  );
}


/*
 * ==========================================================
 * CHECK A1 BUILD VOLUME
 * ==========================================================
 */

export function validatePrintingDimensions(
  dimensions: StlDimensions,
  buildWidth: number,
  buildDepth: number,
  buildHeight: number,
): void {

  const fitsDirectly =
    dimensions.width <=
      buildWidth &&
    dimensions.depth <=
      buildDepth &&
    dimensions.height <=
      buildHeight;


  const fitsRotated =
    dimensions.width <=
      buildDepth &&
    dimensions.depth <=
      buildWidth &&
    dimensions.height <=
      buildHeight;


  if (
    !fitsDirectly &&
    !fitsRotated
  ) {

    throw new Error(
      `This model is larger than the printer build volume (${buildWidth} × ${buildDepth} × ${buildHeight} mm).`,
    );
  }
}