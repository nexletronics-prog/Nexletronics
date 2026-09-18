import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ImagePlus,
  Upload,
  X,
} from "lucide-react";

import {
  createProduct,
  getProductById,
  updateProduct,
} from "../../../services/product.service";

import {
  uploadProductImage,
} from "../../../services/supabaseStorage.service";

import type {
  Product,
} from "../../../types/product";


/*
 * ==========================================================
 * CATEGORIES
 * ==========================================================
 */

const categories = [
  "Arduino Boards",
  "Development Boards",
  "Sensors",
  "Modules",
  "Electronic Components",
  "Tools",
  "Project Kits",
  "3D Printing",
  "Custom Projects",
  "Software",
] as const;


type ProductCategory =
  (typeof categories)[number];


/*
 * ==========================================================
 * IMAGE SETTINGS
 * ==========================================================
 */

const MAX_IMAGES =
  10;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];


/*
 * ==========================================================
 * IMAGE ITEM
 * ==========================================================
 */

interface ProductImageItem {
  id: string;

  url: string;

  file?: File;

  isExisting: boolean;
}


/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function toStringValue(
  value: unknown,
): string {

  return typeof value ===
    "string"
    ? value
    : "";
}


function toNumberValue(
  value: unknown,
): number {

  return typeof value ===
    "number" &&
    Number.isFinite(
      value,
    )
    ? value
    : 0;
}


function toBooleanValue(
  value: unknown,
  fallback: boolean,
): boolean {

  return typeof value ===
    "boolean"
    ? value
    : fallback;
}


function toCategory(
  value: unknown,
): ProductCategory {

  if (
    typeof value ===
      "string" &&
    categories.includes(
      value as ProductCategory,
    )
  ) {

    return value as ProductCategory;
  }


  return "Arduino Boards";
}


function createSlug(
  value: string,
): string {

  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "");
}


/*
 * ==========================================================
 * ERROR MESSAGE
 * ==========================================================
 */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {

  if (
    error &&
    typeof error ===
      "object" &&
    "message" in error
  ) {

    const message =
      (
        error as {
          message?: unknown;
        }
      ).message;


    if (
      typeof message ===
        "string" &&
      message.trim()
    ) {

      return message;
    }
  }


  if (
    error instanceof Error &&
    error.message.trim()
  ) {

    return error.message;
  }


  return fallback;
}


/*
 * ==========================================================
 * PRODUCT FORM
 * ==========================================================
 */

export default function ProductForm() {

  const navigate =
    useNavigate();


  const params =
    useParams<{
      productId?: string;
    }>();


  const editId:
    string | null =
    typeof params.productId ===
      "string" &&
    params.productId.trim()
      ? params.productId
      : null;


  /*
   * ========================================================
   * FILE INPUT
   * ========================================================
   */

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  /*
   * ========================================================
   * FORM STATE
   * ========================================================
   */

  const [
    loading,
    setLoading,
  ] = useState<boolean>(
    editId !== null,
  );


  const [
    saving,
    setSaving,
  ] = useState<boolean>(
    false,
  );


  const [
    uploading,
    setUploading,
  ] = useState<boolean>(
    false,
  );


  const [
    error,
    setError,
  ] = useState<string>(
    "",
  );


  const [
    success,
    setSuccess,
  ] = useState<string>(
    "",
  );


  const [
    name,
    setName,
  ] = useState<string>(
    "",
  );


  const [
    category,
    setCategory,
  ] = useState<ProductCategory>(
    "Arduino Boards",
  );


  const [
    description,
    setDescription,
  ] = useState<string>(
    "",
  );


  const [
    price,
    setPrice,
  ] = useState<string>(
    "",
  );


  const [
    stock,
    setStock,
  ] = useState<string>(
    "",
  );


  const [
    featured,
    setFeatured,
  ] = useState<boolean>(
    false,
  );


  const [
    active,
    setActive,
  ] = useState<boolean>(
    true,
  );


  /*
   * ========================================================
   * PRODUCT IMAGES
   * ========================================================
   */

  const [
    productImages,
    setProductImages,
  ] = useState<
    ProductImageItem[]
  >([]);


  const [
    thumbnailId,
    setThumbnailId,
  ] = useState<string | null>(
    null,
  );


  /*
   * ========================================================
   * LOAD EXISTING PRODUCT
   * ========================================================
   */

  useEffect(() => {

    if (
      editId ===
      null
    ) {

      setLoading(
        false,
      );

      return;
    }


    const productId =
      editId;


    let mounted =
      true;


    async function loadProduct() {

      try {

        setLoading(
          true,
        );


        setError(
          "",
        );


        const product =
          await getProductById(
            productId,
          );


        if (
          !mounted
        ) {

          return;
        }


        if (
          !product
        ) {

          setError(
            "Product not found.",
          );


          return;
        }


        /*
         * Basic fields.
         */

        setName(
          toStringValue(
            product.name,
          ),
        );


        setCategory(
          toCategory(
            product.category,
          ),
        );


        setDescription(
          toStringValue(
            product.description,
          ),
        );


        setPrice(
          String(
            toNumberValue(
              product.price,
            ),
          ),
        );


        setStock(
          String(
            toNumberValue(
              product.stock,
            ),
          ),
        );


        setFeatured(
          toBooleanValue(
            product.featured,
            false,
          ),
        );


        setActive(
          toBooleanValue(
            product.available,
            toBooleanValue(
              product.active,
              true,
            ),
          ),
        );


        /*
         * ==================================================
         * EXISTING GALLERY
         * ==================================================
         */

        let urls: string[] =
          [];


        if (
          Array.isArray(
            product.images,
          )
        ) {

          urls =
            product.images
              .filter(
                (
                  item,
                ): item is string =>
                  typeof item ===
                    "string" &&
                  item.trim().length >
                    0,
              )
              .slice(
                0,
                MAX_IMAGES,
              );
        }


        /*
         * Backward compatibility.
         */

        const legacyImageUrl =
          toStringValue(
            product.imageUrl,
          );


        const legacyImage =
          toStringValue(
            product.image,
          );


        if (
          legacyImageUrl &&
          !urls.includes(
            legacyImageUrl,
          )
        ) {

          urls.unshift(
            legacyImageUrl,
          );
        }


        if (
          legacyImage &&
          !urls.includes(
            legacyImage,
          )
        ) {

          urls.push(
            legacyImage,
          );
        }


        urls =
          [
            ...new Set(
              urls,
            ),
          ].slice(
            0,
            MAX_IMAGES,
          );


        const loadedImages:
          ProductImageItem[] =
          urls.map(
            (
              url,
            ) => ({

              id:
                crypto.randomUUID(),

              url,

              isExisting:
                true,

            }),
          );


        setProductImages(
          loadedImages,
        );


        /*
         * ==================================================
         * THUMBNAIL
         * ==================================================
         */

        const storedThumbnail =
          toStringValue(
            product.thumbnailImage,
          );


        const preferred =
          storedThumbnail ||
          legacyImageUrl ||
          legacyImage ||
          loadedImages[0]?.url ||
          "";


        const thumbnail =
          loadedImages.find(
            (
              image,
            ) =>
              image.url ===
              preferred,
          );


        setThumbnailId(
          thumbnail?.id ??
            loadedImages[0]?.id ??
            null,
        );

      } catch (
        loadError
      ) {

        console.error(
          "Failed to load product:",
          loadError,
        );


        if (
          mounted
        ) {

          setError(
            getErrorMessage(
              loadError,
              "Unable to load product.",
            ),
          );
        }

      } finally {

        if (
          mounted
        ) {

          setLoading(
            false,
          );
        }
      }
    }


    void loadProduct();


    return () => {

      mounted =
        false;

    };

  }, [
    editId,
  ]);


  /*
   * ========================================================
   * FILE PICKER
   * ========================================================
   */

  function openFilePicker() {

    fileInputRef.current?.click();

  }


  /*
   * ========================================================
   * SELECT MULTIPLE IMAGES
   * ========================================================
   */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {

    setError(
      "",
    );


    setSuccess(
      "",
    );


    const files =
      Array.from(
        event.target.files ??
          [],
      );


    if (
      files.length ===
      0
    ) {

      return;
    }


    const remaining =
      MAX_IMAGES -
      productImages.length;


    if (
      remaining <=
      0
    ) {

      setError(
        "Maximum 10 images allowed.",
      );


      event.target.value =
        "";


      return;
    }


    const selectedFiles =
      files.slice(
        0,
        remaining,
      );


    for (
      const file of
        selectedFiles
    ) {

      if (
        !ALLOWED_TYPES.includes(
          file.type,
        )
      ) {

        setError(
          `${file.name}: JPG, PNG and WEBP images only.`,
        );


        event.target.value =
          "";


        return;
      }


      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {

        setError(
          `${file.name} is larger than 5 MB.`,
        );


        event.target.value =
          "";


        return;
      }
    }


    const newImages:
      ProductImageItem[] =
      selectedFiles.map(
        (
          file,
        ) => ({

          id:
            crypto.randomUUID(),

          url:
            URL.createObjectURL(
              file,
            ),

          file,

          isExisting:
            false,

        }),
      );


    setProductImages(
      (
        current,
      ) => [
        ...current,
        ...newImages,
      ],
    );


    /*
     * Automatically select the first uploaded image as
     * thumbnail if none has been selected.
     */

    if (
      thumbnailId ===
        null &&
      newImages.length >
        0
    ) {

      setThumbnailId(
        newImages[0].id,
      );
    }


    event.target.value =
      "";
  }


  /*
   * ========================================================
   * SELECT THUMBNAIL
   * ========================================================
   */

  function selectThumbnail(
    imageId: string,
  ) {

    const exists =
      productImages.some(
        (
          image,
        ) =>
          image.id ===
          imageId,
      );


    if (
      !exists
    ) {

      return;
    }


    setThumbnailId(
      imageId,
    );
  }


  /*
   * ========================================================
   * REMOVE IMAGE
   * ========================================================
   */

  function removeImage(
    imageId: string,
  ) {

    const target =
      productImages.find(
        (
          image,
        ) =>
          image.id ===
          imageId,
      );


    if (
      !target
    ) {

      return;
    }


    if (
      !target.isExisting &&
      target.url.startsWith(
        "blob:",
      )
    ) {

      URL.revokeObjectURL(
        target.url,
      );
    }


    const remaining =
      productImages.filter(
        (
          image,
        ) =>
          image.id !==
          imageId,
      );


    setProductImages(
      remaining,
    );


    if (
      thumbnailId ===
      imageId
    ) {

      setThumbnailId(
        remaining[0]?.id ??
          null,
      );
    }
  }


  /*
   * ========================================================
   * VALIDATE
   * ========================================================
   */

  function validateForm():
    string | null {

    if (
      name.trim().length <
      2
    ) {

      return (
        "Product name must contain at least 2 characters."
      );
    }


    if (
      description.trim().length <
      5
    ) {

      return (
        "Please enter a proper product description."
      );
    }


    const numericPrice =
      Number(
        price,
      );


    if (
      !Number.isFinite(
        numericPrice,
      ) ||
      numericPrice <
        0
    ) {

      return (
        "Please enter a valid price."
      );
    }


    const numericStock =
      Number(
        stock,
      );


    if (
      !Number.isInteger(
        numericStock,
      ) ||
      numericStock <
        0
    ) {

      return (
        "Please enter a valid stock quantity."
      );
    }


    if (
      productImages.length <
      1
    ) {

      return (
        "Please upload at least 1 image."
      );
    }


    if (
      productImages.length >
      MAX_IMAGES
    ) {

      return (
        "Maximum 10 images allowed."
      );
    }


    if (
      thumbnailId ===
      null
    ) {

      return (
        "Please select a thumbnail."
      );
    }


    if (
      !productImages.some(
        (
          image,
        ) =>
          image.id ===
          thumbnailId,
      )
    ) {

      return (
        "Selected thumbnail is invalid."
      );
    }


    return null;
  }


  /*
   * ========================================================
   * SAVE PRODUCT
   * ========================================================
   */

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    setError(
      "",
    );


    setSuccess(
      "",
    );


    const validationError =
      validateForm();


    if (
      validationError !==
      null
    ) {

      setError(
        validationError,
      );


      return;
    }


    const cleanName =
      name.trim();


    const cleanDescription =
      description.trim();


    const numericPrice =
      Number(
        price,
      );


    const numericStock =
      Number(
        stock,
      );


    const slug =
      createSlug(
        cleanName,
      );


    if (
      !slug
    ) {

      setError(
        "Unable to create a valid product slug.",
      );


      return;
    }


    /*
     * New product gets a temporary stable folder ID.
     *
     * Existing product uses its Firestore ID.
     */

    const storageProductId =
      editId ??
      crypto.randomUUID();


    try {

      setSaving(
        true,
      );


      setUploading(
        true,
      );


      /*
       * ======================================================
       * UPLOAD ALL NEW IMAGES
       * ======================================================
       */

      const finalUrls =
        new Map<
          string,
          string
        >();


      for (
        const image of
          productImages
      ) {

        /*
         * Existing image:
         * retain its URL.
         */

        if (
          image.isExisting ||
          !image.file
        ) {

          finalUrls.set(
            image.id,
            image.url,
          );


          continue;
        }


        /*
         * New image:
         * upload to Supabase.
         */

        const uploadedUrl =
          await uploadProductImage(
            image.file,
            storageProductId,
          );


        finalUrls.set(
          image.id,
          uploadedUrl,
        );
      }


      /*
       * ======================================================
       * BUILD FINAL ARRAY
       * ======================================================
       */

      const imageUrls =
        productImages
          .map(
            (
              image,
            ) =>
              finalUrls.get(
                image.id,
              ),
          )
          .filter(
            (
              url,
            ): url is string =>
              Boolean(url),
          )
          .slice(
            0,
            MAX_IMAGES,
          );


      if (
        imageUrls.length <
        1
      ) {

        throw new Error(
          "At least one image is required.",
        );
      }


      /*
       * ======================================================
       * THUMBNAIL
       * ======================================================
       */

      if (
        thumbnailId ===
        null
      ) {

        throw new Error(
          "Please select a thumbnail.",
        );
      }


      const thumbnailUrl =
        finalUrls.get(
          thumbnailId,
        );


      if (
        !thumbnailUrl
      ) {

        throw new Error(
          "The selected thumbnail could not be found.",
        );
      }


      setUploading(
        false,
      );


      /*
       * ======================================================
       * PRODUCT OBJECT
       * ======================================================
       */

      const product:
        Omit<Product, "id"> =
        {

          name:
            cleanName,

          slug,

          category,

          description:
            cleanDescription,

          shortDescription:
            cleanDescription.slice(
              0,
              140,
            ),

          price:
            numericPrice,

          currency:
            "INR",

          stock:
            numericStock,

          available:
            active,

          active,

          featured,

          bestSeller:
            false,

          trending:
            false,

          /*
           * Backward-compatible primary image.
           */

          image:
            thumbnailUrl,

          imageUrl:
            thumbnailUrl,

          /*
           * Full gallery.
           */

          images:
            imageUrls,

          /*
           * Explicit thumbnail.
           */

          thumbnailImage:
            thumbnailUrl,
        };


      /*
       * ======================================================
       * FIRESTORE
       * ======================================================
       */

      if (
        editId !==
        null
      ) {

        await updateProduct(
          editId,
          product,
        );


        setSuccess(
          "Product updated successfully.",
        );

      } else {

        await createProduct(
          product,
        );


        setSuccess(
          "Product created successfully.",
        );
      }


      /*
       * Navigate after the realtime write has completed.
       */

      window.setTimeout(
        () => {

          navigate(
            "/admin/products",
          );

        },
        700,
      );

    } catch (
      saveError
    ) {

      console.error(
        "Product save failed:",
        saveError,
      );


      setError(
        getErrorMessage(
          saveError,
          "Unable to save the product.",
        ),
      );

    } finally {

      setUploading(
        false,
      );


      setSaving(
        false,
      );
    }
  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (
      <div className="flex min-h-[400px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-neutral-200 border-t-[#D4AF37]" />

          <p className="mt-4 text-sm text-neutral-500">
            Loading product...
          </p>

        </div>

      </div>
    );
  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div className="mx-auto max-w-4xl">

      <Link
        to="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-[#D4AF37]"
      >
        ← Back to Products
      </Link>


      <div className="mb-8">

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          Store Management
        </p>


        <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
          {editId !==
          null
            ? "Edit Product"
            : "Add Product"}
        </h1>


        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Add products to your Nexletronics catalogue.
        </p>

      </div>


      {error && (

        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>

      )}


      {success && (

        <div
          role="status"
          className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700"
        >
          {success}
        </div>

      )}


      <form
        onSubmit={
          submit
        }
        className="space-y-6"
      >

        {/* ==================================================
            PRODUCT INFORMATION
        =================================================== */}

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-black text-neutral-950">
            Product Information
          </h2>


          <p className="mt-1 text-sm text-neutral-500">
            Basic information customers will see.
          </p>


          <div className="mt-7 space-y-5">

            {/* NAME */}

            <div>

              <label
                htmlFor="product-name"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Product Name
              </label>


              <input
                id="product-name"
                type="text"
                value={
                  name
                }
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Arduino UNO R3"
                required
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
              />

            </div>


            {/* CATEGORY + PRICE */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="product-category"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Category
                </label>


                <select
                  id="product-category"
                  value={
                    category
                  }
                  onChange={(
                    event,
                  ) =>
                    setCategory(
                      event.target.value as ProductCategory,
                    )
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
                >

                  {categories.map(
                    (
                      item,
                    ) => (

                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>

                    ),
                  )}

                </select>

              </div>


              <div>

                <label
                  htmlFor="product-price"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Price (INR)
                </label>


                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    price
                  }
                  onChange={(
                    event,
                  ) =>
                    setPrice(
                      event.target.value,
                    )
                  }
                  placeholder="499"
                  required
                  className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
                />

              </div>

            </div>


            {/* STOCK */}

            <div>

              <label
                htmlFor="product-stock"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Stock
              </label>


              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={
                  stock
                }
                onChange={(
                  event,
                ) =>
                  setStock(
                    event.target.value,
                  )
                }
                placeholder="10"
                required
                className="w-full rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>


            {/* =================================================
                IMAGE GALLERY
            ================================================== */}

            <div>

              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-sm font-bold text-neutral-800">
                    Product Images
                  </p>


                  <p className="mt-1 text-xs leading-5 text-neutral-400">
                    Upload 1–10 images and select one as the thumbnail.
                  </p>

                </div>


                <span className="w-fit rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#8f741d]">
                  {
                    productImages.length
                  }
                  /
                  {MAX_IMAGES}
                </span>

              </div>


              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={
                  handleImageChange
                }
                className="hidden"
              />


              <button
                type="button"
                onClick={
                  openFilePicker
                }
                disabled={
                  saving ||
                  uploading ||
                  productImages.length >=
                    MAX_IMAGES
                }
                className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#D4AF37]/40 bg-[#fffdf5] px-5 py-4 text-sm font-bold text-[#8f741d] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <Upload
                  size={20}
                />


                {productImages.length >=
                MAX_IMAGES
                  ? "Maximum 10 Images Reached"
                  : uploading
                    ? "Uploading..."
                    : "Choose Images From Device"}

              </button>


              <p className="mt-2 text-xs text-neutral-400">
                JPG, PNG or WEBP · Maximum 5 MB per image
              </p>


              {productImages.length >
                0 && (

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

                  {productImages.map(
                    (
                      image,
                      index,
                    ) => {

                      const isThumbnail =
                        image.id ===
                        thumbnailId;


                      return (
                        <div
                          key={
                            image.id
                          }
                          className={[
                            "group relative overflow-hidden rounded-2xl border-2 bg-[#faf8f0]",

                            isThumbnail
                              ? "border-[#D4AF37]"
                              : "border-neutral-200",
                          ].join(
                            " ",
                          )}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              selectThumbnail(
                                image.id,
                              )
                            }
                            disabled={
                              saving ||
                              uploading
                            }
                            className="block aspect-square w-full"
                            title="Set as thumbnail"
                          >

                            <img
                              src={
                                image.url
                              }
                              alt={`Product image ${
                                index + 1
                              }`}
                              className="h-full w-full object-contain p-2 transition group-hover:scale-105"
                            />

                          </button>


                          {isThumbnail && (

                            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#D4AF37] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow">
                              Thumbnail
                            </div>

                          )}


                          <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-neutral-950/80 px-2 py-1 text-[9px] font-bold text-white">
                            {index + 1}
                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                image.id,
                              )
                            }
                            disabled={
                              saving ||
                              uploading
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-50 disabled:opacity-50"
                            title="Remove image"
                          >

                            <X
                              size={14}
                            />

                          </button>

                        </div>
                      );
                    },
                  )}

                </div>

              )}


              {productImages.length ===
                0 && (

                <div className="mt-5 flex min-h-[190px] items-center justify-center rounded-2xl border border-neutral-200 bg-[#faf8f0]">

                  <div className="text-center">

                    <ImagePlus
                      size={36}
                      className="mx-auto text-[#D4AF37]"
                    />


                    <p className="mt-3 text-sm font-semibold text-neutral-500">
                      No images selected
                    </p>


                    <p className="mt-1 text-xs text-neutral-400">
                      At least 1 image is required.
                    </p>

                  </div>

                </div>

              )}

            </div>


            {/* DESCRIPTION */}

            <div>

              <label
                htmlFor="product-description"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                Description
              </label>


              <textarea
                id="product-description"
                value={
                  description
                }
                onChange={(
                  event,
                ) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="Describe the product..."
                rows={7}
                required
                className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-3.5 text-sm leading-7 outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
              />

            </div>

          </div>

        </section>


        {/* ==================================================
            VISIBILITY
        =================================================== */}

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-black text-neutral-950">
            Store Visibility
          </h2>


          <p className="mt-1 text-sm text-neutral-500">
            Control how this product appears in your store.
          </p>


          <div className="mt-7 grid gap-4 sm:grid-cols-2">

            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-neutral-200 p-5">

              <input
                type="checkbox"
                checked={
                  active
                }
                onChange={(
                  event,
                ) =>
                  setActive(
                    event.target.checked,
                  )
                }
                disabled={
                  saving
                }
                className="mt-0.5 h-5 w-5 accent-[#D4AF37]"
              />


              <div>

                <p className="font-bold text-neutral-900">
                  Product is active
                </p>


                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Customers can see and purchase this product.
                </p>

              </div>

            </label>


            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-neutral-200 p-5">

              <input
                type="checkbox"
                checked={
                  featured
                }
                onChange={(
                  event,
                ) =>
                  setFeatured(
                    event.target.checked,
                  )
                }
                disabled={
                  saving
                }
                className="mt-0.5 h-5 w-5 accent-[#D4AF37]"
              />


              <div>

                <p className="font-bold text-neutral-900">
                  Featured product
                </p>


                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Mark this product as featured.
                </p>

              </div>

            </label>

          </div>

        </section>


        {/* ==================================================
            ACTIONS
        =================================================== */}

        <div className="flex flex-col-reverse gap-3 pb-10 sm:flex-row sm:justify-end">

          <Link
            to="/admin/products"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-7 py-3.5 text-sm font-bold text-neutral-700"
          >
            Cancel
          </Link>


          <button
            type="submit"
            disabled={
              saving ||
              uploading
            }
            className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-50"
          >

            {saving ||
            uploading ? (

              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                {
                  uploading
                    ? "Uploading Images..."
                    : "Saving..."
                }
              </>

            ) : editId !==
              null ? (

              "Update Product"

            ) : (

              "Create Product"

            )}

          </button>

        </div>

      </form>

    </div>
  );
}