import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import LoadingSpinner from "../../components/common/LoadingSpinner";

import {
  getProductById,
} from "../../services/product.service";

import type {
  Product,
} from "../../types/product";

import {
  db,
} from "../../firebase/config";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  useCart,
} from "../../contexts/CartContext";


/*
 * ==========================================================
 * REVIEW TYPE
 * ==========================================================
 */

interface ProductReview {
  id: string;

  productId: string;

  userId: string;

  userName: string;

  rating: number;

  comment: string;

  createdAt?: unknown;

  updatedAt?: unknown;
}


/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function getProductImages(
  product: Product,
): string[] {

  const images: string[] = [];


  /*
   * Full gallery.
   */

  if (
    Array.isArray(
      product.images,
    )
  ) {

    for (
      const image of
        product.images
    ) {

      if (
        typeof image ===
          "string" &&
        image.trim()
      ) {

        const cleanImage =
          image.trim();


        if (
          !images.includes(
            cleanImage,
          )
        ) {

          images.push(
            cleanImage,
          );
        }
      }
    }
  }


  /*
   * Thumbnail.
   */

  if (
    typeof product.thumbnailImage ===
      "string" &&
    product.thumbnailImage.trim()
  ) {

    const thumbnail =
      product.thumbnailImage.trim();


    if (
      !images.includes(
        thumbnail,
      )
    ) {

      images.unshift(
        thumbnail,
      );
    }
  }


  /*
   * Legacy imageUrl.
   */

  if (
    typeof product.imageUrl ===
      "string" &&
    product.imageUrl.trim()
  ) {

    const imageUrl =
      product.imageUrl.trim();


    if (
      !images.includes(
        imageUrl,
      )
    ) {

      images.push(
        imageUrl,
      );
    }
  }


  /*
   * Legacy image.
   */

  if (
    typeof product.image ===
      "string" &&
    product.image.trim()
  ) {

    const image =
      product.image.trim();


    if (
      !images.includes(
        image,
      )
    ) {

      images.push(
        image,
      );
    }
  }


  return [
    ...new Set(
      images,
    ),
  ].slice(
    0,
    10,
  );
}


function formatPrice(
  value: number,
): string {

  return value.toLocaleString(
    "en-IN",
  );
}


function formatRating(
  value: number,
): string {

  return value.toFixed(
    1,
  );
}


function getTimestampMilliseconds(
  value: unknown,
): number {

  if (
    value &&
    typeof value ===
      "object" &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate ===
      "function"
  ) {

    return (
      (
        value as {
          toDate: () => Date;
        }
      ).toDate()
        .getTime()
    );
  }


  if (
    value instanceof
      Date
  ) {

    return value.getTime();
  }


  if (
    value &&
    typeof value ===
      "object" &&
    "seconds" in value &&
    typeof (
      value as {
        seconds?: unknown;
      }
    ).seconds ===
      "number"
  ) {

    return (
      (
        value as {
          seconds: number;
        }
      ).seconds *
      1000
    );
  }


  return 0;
}


function formatReviewDate(
  value: unknown,
): string {

  const milliseconds =
    getTimestampMilliseconds(
      value,
    );


  if (
    milliseconds <=
    0
  ) {

    return "";
  }


  return new Date(
    milliseconds,
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}


/*
 * ==========================================================
 * PRODUCT DETAILS
 * ==========================================================
 */

export default function ProductDetails() {

  /*
   * Supports both:
   *
   * /products/:id
   * /products/:productId
   */

  const params =
    useParams<{
      id?: string;
      productId?: string;
    }>();


  const productId =
    params.id ??
    params.productId ??
    "";


  /*
   * ========================================================
   * AUTH
   * ========================================================
   */

  const {
    user,
  } = useAuth();


  /*
   * ========================================================
   * CART
   * ========================================================
   */

  const {
    addToCart,
  } = useCart();


  /*
   * ========================================================
   * PRODUCT
   * ========================================================
   */

  const [
    product,
    setProduct,
  ] = useState<Product | null>(
    null,
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );


  const [
    error,
    setError,
  ] = useState(
    "",
  );


  /*
   * ========================================================
   * IMAGE
   * ========================================================
   */

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(
    "",
  );


  /*
   * ========================================================
   * CART STATE
   * ========================================================
   */

  const [
    quantity,
    setQuantity,
  ] = useState(
    1,
  );


  const [
    added,
    setAdded,
  ] = useState(
    false,
  );


  /*
   * ========================================================
   * REVIEWS
   * ========================================================
   */

  const [
    reviews,
    setReviews,
  ] = useState<ProductReview[]>(
    [],
  );


  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(
    false,
  );


  const [
    reviewError,
    setReviewError,
  ] = useState(
    "",
  );


  const [
    reviewRating,
    setReviewRating,
  ] = useState(
    0,
  );


  const [
    reviewComment,
    setReviewComment,
  ] = useState(
    "",
  );


  const [
    submittingReview,
    setSubmittingReview,
  ] = useState(
    false,
  );


  const [
    reviewSubmitted,
    setReviewSubmitted,
  ] = useState(
    false,
  );


  /*
   * ========================================================
   * LOAD PRODUCT
   * ========================================================
   */

  useEffect(() => {

    let mounted =
      true;


    async function loadProduct() {

      try {

        if (
          mounted
        ) {

          setLoading(
            true,
          );

          setError(
            "",
          );
        }


        if (
          !productId
        ) {

          if (
            mounted
          ) {

            setError(
              "Product ID is missing.",
            );
          }


          return;
        }


        const data =
          await getProductById(
            productId,
          );


        if (
          !mounted
        ) {

          return;
        }


        if (
          !data
        ) {

          setProduct(
            null,
          );

          setError(
            "Product not found.",
          );


          return;
        }


        setProduct(
          data,
        );


        setQuantity(
          1,
        );


        const images =
          getProductImages(
            data,
          );


        const initialImage =
          typeof data.thumbnailImage ===
              "string" &&
            data.thumbnailImage.trim()
            ? data.thumbnailImage.trim()
            : images[0] ??
              "";


        setSelectedImage(
          initialImage,
        );

      } catch (
        loadError
      ) {

        console.error(
          "Unable to load product:",
          loadError,
        );


        if (
          mounted
        ) {

          setProduct(
            null,
          );


          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load this product.",
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
    productId,
  ]);


  /*
   * ========================================================
   * LOAD REVIEWS
   * ========================================================
   */

  useEffect(() => {

    let mounted =
      true;


    async function loadReviews() {

      if (
        !productId
      ) {

        return;
      }


      try {

        setReviewsLoading(
          true,
        );


        setReviewError(
          "",
        );


        const reviewsQuery =
          query(
            collection(
              db,
              "productReviews",
            ),
            where(
              "productId",
              "==",
              productId,
            ),
          );


        const snapshot =
          await getDocs(
            reviewsQuery,
          );


        if (
          !mounted
        ) {

          return;
        }


        const loadedReviews:
          ProductReview[] =
          snapshot.docs.map(
            (
              document,
            ) => {

              const data =
                document.data();


              const rawRating =
                data.rating;


              const rating =
                typeof rawRating ===
                    "number" &&
                  Number.isFinite(
                    rawRating,
                  )
                  ? Math.max(
                      1,
                      Math.min(
                        5,
                        Math.round(
                          rawRating,
                        ),
                      ),
                    )
                  : 0;


              return {
                id:
                  document.id,

                productId:
                  typeof data.productId ===
                    "string"
                    ? data.productId
                    : productId,

                userId:
                  typeof data.userId ===
                    "string"
                    ? data.userId
                    : "",

                userName:
                  typeof data.userName ===
                    "string"
                    ? data.userName
                    : "Customer",

                rating,

                comment:
                  typeof data.comment ===
                    "string"
                    ? data.comment
                    : "",

                createdAt:
                  data.createdAt,

                updatedAt:
                  data.updatedAt,
              };
            },
          );


        loadedReviews.sort(
          (
            first,
            second,
          ) =>
            getTimestampMilliseconds(
              second.createdAt,
            ) -
            getTimestampMilliseconds(
              first.createdAt,
            ),
        );


        setReviews(
          loadedReviews,
        );

      } catch (
        reviewLoadError
      ) {

        console.error(
          "Unable to load product reviews:",
          reviewLoadError,
        );


        if (
          mounted
        ) {

          setReviewError(
            "Reviews could not be loaded right now.",
          );
        }

      } finally {

        if (
          mounted
        ) {

          setReviewsLoading(
            false,
          );
        }
      }
    }


    void loadReviews();


    return () => {

      mounted =
        false;
    };

  }, [
    productId,
  ]);


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (
      <section className="bg-white">

        <div className="container-custom flex min-h-[65vh] items-center justify-center">

          <LoadingSpinner />

        </div>

      </section>
    );
  }


  /*
   * ========================================================
   * NOT FOUND
   * ========================================================
   */

  if (
    product === null
  ) {

    return (
      <section className="bg-white">

        <div className="container-custom flex min-h-[65vh] items-center justify-center">

          <div className="max-w-lg text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <Package
                size={36}
              />

            </div>


            <h1 className="mt-7 text-3xl font-black text-neutral-950">
              Product not found
            </h1>


            <p className="mt-3 text-sm leading-7 text-neutral-500">
              {
                error ||
                "This product could not be loaded."
              }
            </p>


            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 font-black text-white transition hover:bg-[#b99622]"
            >

              <ArrowLeft
                size={17}
              />

              Back to Products

            </Link>

          </div>

        </div>

      </section>
    );
  }


  /*
   * ========================================================
   * IMPORTANT TYPE NARROWING
   * ========================================================
   *
   * From this point onward, currentProduct is guaranteed
   * to be a Product, never null.
   */

  const currentProduct:
    Product =
    product;


  /*
   * ========================================================
   * PRODUCT DATA
   * ========================================================
   */

  const productImages =
    getProductImages(
      currentProduct,
    );


  const activeImage =
    productImages.includes(
      selectedImage,
    )
      ? selectedImage
      : productImages[0] ??
        "";


  const stock =
    typeof currentProduct.stock ===
        "number" &&
      Number.isFinite(
        currentProduct.stock,
      )
      ? Math.max(
          0,
          Math.floor(
            currentProduct.stock,
          ),
        )
      : 0;


  const available =
    currentProduct.available !==
      false &&
    currentProduct.active !==
      false &&
    stock > 0;


  const price =
    typeof currentProduct.price ===
        "number" &&
      Number.isFinite(
        currentProduct.price,
      )
      ? currentProduct.price
      : 0;


  /*
   * ========================================================
   * RATING
   * ========================================================
   */

  const totalReviews =
    reviews.length;


  const ratingTotal =
    reviews.reduce(
      (
        total,
        review,
      ) =>
        total +
        review.rating,
      0,
    );


  const averageRating =
    totalReviews > 0
      ? ratingTotal /
        totalReviews
      : 0;


  const ratingCounts:
    Record<
      number,
      number
    > = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };


  for (
    const review of
      reviews
  ) {

    if (
      review.rating >=
        1 &&
      review.rating <=
        5
    ) {

      ratingCounts[
        review.rating
      ] += 1;
    }
  }


  /*
   * ========================================================
   * REVIEW STATUS
   * ========================================================
   */

  const hasReviewed =
    user !== null &&
    reviews.some(
      (
        review,
      ) =>
        review.userId ===
        user.uid,
    );


  /*
   * ========================================================
   * QUANTITY
   * ========================================================
   */

  function decreaseQuantity() {

    setQuantity(
      (
        current,
      ) =>
        Math.max(
          1,
          current - 1,
        ),
    );
  }


  function increaseQuantity() {

    setQuantity(
      (
        current,
      ) =>
        Math.min(
          stock,
          current + 1,
        ),
    );
  }


  function handleQuantityInput(
    value: string,
  ) {

    if (
      value ===
      ""
    ) {

      setQuantity(
        1,
      );


      return;
    }


    const numericValue =
      Number(
        value,
      );


    if (
      !Number.isFinite(
        numericValue,
      )
    ) {

      return;
    }


    setQuantity(
      Math.max(
        1,
        Math.min(
          stock || 1,
          Math.floor(
            numericValue,
          ),
        ),
      ),
    );
  }


  /*
   * ========================================================
   * ADD TO CART
   * ========================================================
   */

  function handleAddToCart() {

    if (
      !available
    ) {

      return;
    }


    addToCart(
      currentProduct,
      quantity,
    );


    setAdded(
      true,
    );


    window.setTimeout(
      () => {

        setAdded(
          false,
        );
      },
      1800,
    );
  }


  /*
   * ========================================================
   * SUBMIT REVIEW
   * ========================================================
   */

  async function handleSubmitReview() {

    setReviewError(
      "",
    );


    setReviewSubmitted(
      false,
    );


    if (
      !user
    ) {

      setReviewError(
        "Please sign in before submitting a review.",
      );


      return;
    }


    if (
      reviewRating <
        1 ||
      reviewRating >
        5
    ) {

      setReviewError(
        "Please select a rating from 1 to 5 stars.",
      );


      return;
    }


    const cleanComment =
      reviewComment.trim();


    if (
      cleanComment.length <
      3
    ) {

      setReviewError(
        "Please write a short review.",
      );


      return;
    }


    if (
      cleanComment.length >
      1000
    ) {

      setReviewError(
        "Your review must be 1000 characters or less.",
      );


      return;
    }


    if (
      hasReviewed
    ) {

      setReviewError(
        "You have already reviewed this product.",
      );


      return;
    }


    try {

      setSubmittingReview(
        true,
      );


      const userName =
        user.displayName?.trim() ||
        user.email?.split(
          "@",
        )[0] ||
        "Customer";


      const document =
        await addDoc(
          collection(
            db,
            "productReviews",
          ),
          {
            productId:
              currentProduct.id,

            userId:
              user.uid,

            userName,

            rating:
              reviewRating,

            comment:
              cleanComment,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
        );


      const newReview:
        ProductReview = {
        id:
          document.id,

        productId:
          currentProduct.id,

        userId:
          user.uid,

        userName,

        rating:
          reviewRating,

        comment:
          cleanComment,

        createdAt:
          new Date(),
      };


      setReviews(
        (
          current,
        ) => [
          newReview,
          ...current,
        ],
      );


      setReviewRating(
        0,
      );


      setReviewComment(
        "",
      );


      setReviewSubmitted(
        true,
      );

    } catch (
      submitError
    ) {

      console.error(
        "Failed to submit review:",
        submitError,
      );


      setReviewError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to submit your review.",
      );

    } finally {

      setSubmittingReview(
        false,
      );
    }
  }


  /*
   * ========================================================
   * MAIN UI
   * ========================================================
   */

  return (
    <section className="bg-white py-10 sm:py-14">

      <div className="container-custom">

        {/* ==================================================
            BACK
        =================================================== */}

        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 transition hover:text-[#9b7e1d]"
        >

          <ArrowLeft
            size={17}
          />

          Back to Products

        </Link>


        {/* ==================================================
            PRODUCT
        =================================================== */}

        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start">

          {/* =================================================
              GALLERY
          ================================================== */}

          <div className="lg:sticky lg:top-28">

            <div className="overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-[#faf8f0] shadow-sm">

              <div className="relative flex min-h-[440px] items-center justify-center sm:min-h-[560px]">

                {activeImage ? (

                  <img
                    src={
                      activeImage
                    }
                    alt={
                      currentProduct.name
                    }
                    className="max-h-[560px] w-full object-contain p-10 transition duration-500 hover:scale-[1.02]"
                  />

                ) : (

                  <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-neutral-950 text-[#D4AF37] shadow-xl">

                    <Package
                      size={54}
                    />

                  </div>

                )}


                {currentProduct.featured && (

                  <span className="absolute left-6 top-6 rounded-full bg-[#D4AF37] px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white">
                    Featured
                  </span>

                )}

              </div>

            </div>


            {productImages.length >
              0 && (

              <div className="mt-5">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
                    Product Images
                  </p>


                  <p className="text-xs font-bold text-neutral-400">
                    {
                      productImages.length
                    }{" "}
                    {
                      productImages.length ===
                      1
                        ? "image"
                        : "images"
                    }
                  </p>

                </div>


                <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">

                  {productImages.map(
                    (
                      image,
                      index,
                    ) => {

                      const active =
                        image ===
                        activeImage;


                      return (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() =>
                            setSelectedImage(
                              image,
                            )
                          }
                          aria-label={`View ${currentProduct.name} image ${
                            index + 1
                          }`}
                          aria-pressed={
                            active
                          }
                          className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-[#faf8f0] transition ${
                            active
                              ? "border-[#D4AF37] shadow-md"
                              : "border-neutral-200 hover:border-[#D4AF37]/50"
                          }`}
                        >

                          <img
                            src={
                              image
                            }
                            alt={`${currentProduct.name} image ${
                              index + 1
                            }`}
                            className="h-full w-full object-contain p-2"
                          />


                          {active && (

                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-2 py-1 text-[8px] font-black uppercase text-white">
                              Selected
                            </span>

                          )}

                        </button>
                      );
                    },
                  )}

                </div>

              </div>

            )}


            <div className="mt-5 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-neutral-200 p-4">

                <ShieldCheck
                  size={20}
                  className="text-[#D4AF37]"
                />


                <p className="mt-3 text-xs font-black text-neutral-900">
                  Quality focused
                </p>

              </div>


              <div className="rounded-2xl border border-neutral-200 p-4">

                <Truck
                  size={20}
                  className="text-[#D4AF37]"
                />


                <p className="mt-3 text-xs font-black text-neutral-900">
                  Ready to ship
                </p>

              </div>


              <div className="rounded-2xl border border-neutral-200 p-4">

                <Check
                  size={20}
                  className="text-[#D4AF37]"
                />


                <p className="mt-3 text-xs font-black text-neutral-900">
                  Project ready
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              DETAILS
          ================================================== */}

          <div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
              {
                currentProduct.category
              }
            </p>


            <h1 className="mt-4 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
              {
                currentProduct.name
              }
            </h1>


            {currentProduct.sku && (

              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
                SKU:{" "}
                {
                  currentProduct.sku
                }
              </p>

            )}


            {/* Rating */}

            <div className="mt-5 flex flex-wrap items-center gap-3">

              <div className="flex items-center gap-1">

                {[1, 2, 3, 4, 5].map(
                  (
                    star,
                  ) => (

                    <Star
                      key={
                        star
                      }
                      size={18}
                      className={
                        star <=
                        Math.round(
                          averageRating,
                        )
                          ? "fill-[#D4AF37] text-[#D4AF37]"
                          : "text-neutral-300"
                      }
                    />

                  ),
                )}

              </div>


              <span className="text-sm font-bold text-neutral-600">
                {totalReviews >
                0
                  ? `${formatRating(
                      averageRating,
                    )} · ${totalReviews} ${
                      totalReviews ===
                      1
                        ? "review"
                        : "reviews"
                    }`
                  : "No reviews yet"}
              </span>

            </div>


            {/* Price */}

            <div className="mt-7">

              <p className="text-4xl font-black text-neutral-950">

                ₹
                {
                  formatPrice(
                    price,
                  )
                }

              </p>


              {currentProduct.compareAtPrice &&
                currentProduct.compareAtPrice >
                  price && (

                <p className="mt-1 text-sm font-bold text-neutral-400 line-through">

                  ₹
                  {
                    formatPrice(
                      currentProduct.compareAtPrice,
                    )
                  }

                </p>

              )}

            </div>


            {/* Stock */}

            <div className="mt-5">

              {available ? (

                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-black text-green-700">

                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  {
                    stock
                  }{" "}
                  in stock

                </span>

              ) : (

                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700">

                  <span className="h-2 w-2 rounded-full bg-red-500" />

                  Currently unavailable

                </span>

              )}

            </div>


            {/* Description */}

            <div className="mt-8 border-t border-neutral-200 pt-7">

              <h2 className="text-lg font-black text-neutral-950">
                Product Description
              </h2>


              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-neutral-600">
                {
                  currentProduct.description
                }
              </p>

            </div>


            {/* Specifications */}

            {currentProduct.specifications &&
              Object.keys(
                currentProduct.specifications,
              ).length >
                0 && (

              <div className="mt-8">

                <h2 className="text-lg font-black text-neutral-950">
                  Specifications
                </h2>


                <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">

                  {Object.entries(
                    currentProduct.specifications,
                  ).map(
                    (
                      [key, value],
                      index,
                    ) => (

                      <div
                        key={
                          key
                        }
                        className={`grid grid-cols-[0.8fr_1.2fr] gap-4 px-5 py-4 text-sm ${
                          index %
                            2 ===
                          0
                            ? "bg-neutral-50"
                            : "bg-white"
                        }`}
                      >

                        <span className="font-bold text-neutral-700">
                          {
                            key
                          }
                        </span>


                        <span className="text-neutral-500">
                          {
                            String(
                              value,
                            )
                          }
                        </span>

                      </div>

                    ),
                  )}

                </div>

              </div>

            )}


            {/* Purchase */}

            <div className="mt-9 rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-6 sm:p-7">

              <p className="text-sm font-black text-neutral-950">
                Quantity
              </p>


              <div className="mt-4 flex flex-wrap items-center gap-4">

                <div className="flex h-12 items-center rounded-full border border-neutral-300 bg-white">

                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      !available ||
                      quantity <=
                        1
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >

                    <Minus
                      size={17}
                    />

                  </button>


                  <input
                    value={
                      quantity
                    }
                    onChange={(
                      event,
                    ) =>
                      handleQuantityInput(
                        event.target.value,
                      )
                    }
                    disabled={
                      !available
                    }
                    inputMode="numeric"
                    aria-label="Quantity"
                    className="w-12 bg-transparent text-center text-sm font-black outline-none"
                  />


                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      !available ||
                      quantity >=
                        stock
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase quantity"
                  >

                    <Plus
                      size={17}
                    />

                  </button>

                </div>


                <button
                  type="button"
                  onClick={
                    handleAddToCart
                  }
                  disabled={
                    !available
                  }
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none sm:flex-none"
                >

                  {added ? (

                    <>
                      <Check
                        size={18}
                      />

                      Added to Cart
                    </>

                  ) : (

                    <>
                      <ShoppingCart
                        size={18}
                      />

                      Add to Cart
                    </>

                  )}

                </button>

              </div>


              {available && (

                <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-5">

                  <span className="text-sm text-neutral-500">
                    Selected total
                  </span>


                  <span className="text-lg font-black text-neutral-950">

                    ₹
                    {
                      formatPrice(
                        price *
                          quantity,
                      )
                    }

                  </span>

                </div>

              )}

            </div>


            <Link
              to="/cart"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#9b7e1d] transition hover:text-[#D4AF37]"
            >

              View your cart

              <ArrowRight
                size={16}
              />

            </Link>

          </div>

        </div>


        {/* ==================================================
            REVIEWS
        =================================================== */}

        <section className="mt-20 border-t border-neutral-200 pt-14">

          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">

            {/* =================================================
                SUMMARY
            ================================================== */}

            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                Customer Feedback
              </p>


              <h2 className="mt-3 text-3xl font-black text-neutral-950">
                Reviews & Ratings
              </h2>


              <div className="mt-7 rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-6">

                <div className="flex items-center gap-5">

                  <div>

                    <p className="text-5xl font-black text-neutral-950">
                      {
                        totalReviews >
                        0
                          ? formatRating(
                              averageRating,
                            )
                          : "—"
                      }
                    </p>


                    <div className="mt-2 flex items-center gap-1">

                      {[1, 2, 3, 4, 5].map(
                        (
                          star,
                        ) => (

                          <Star
                            key={
                              star
                            }
                            size={17}
                            className={
                              star <=
                              Math.round(
                                averageRating,
                              )
                                ? "fill-[#D4AF37] text-[#D4AF37]"
                                : "text-neutral-300"
                            }
                          />

                        ),
                      )}

                    </div>

                  </div>


                  <div>

                    <p className="font-black text-neutral-950">
                      {
                        totalReviews
                      }{" "}
                      {
                        totalReviews ===
                        1
                          ? "review"
                          : "reviews"
                      }
                    </p>


                    <p className="mt-1 text-sm text-neutral-500">
                      Customer rating
                    </p>

                  </div>

                </div>


                <div className="mt-7 space-y-2">

                  {[5, 4, 3, 2, 1].map(
                    (
                      stars,
                    ) => {

                      const count =
                        ratingCounts[
                          stars
                        ];


                      const percentage =
                        totalReviews >
                        0
                          ? (
                              count /
                              totalReviews
                            ) *
                            100
                          : 0;


                      return (
                        <div
                          key={
                            stars
                          }
                          className="flex items-center gap-3 text-xs"
                        >

                          <span className="w-10 font-bold text-neutral-500">
                            {
                              stars
                            }{" "}
                            ★
                          </span>


                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">

                            <div
                              className="h-full rounded-full bg-[#D4AF37]"
                              style={{
                                width:
                                  `${percentage}%`,
                              }}
                            />

                          </div>


                          <span className="w-6 text-right text-neutral-400">
                            {
                              count
                            }
                          </span>

                        </div>
                      );
                    },
                  )}

                </div>

              </div>

            </div>


            {/* =================================================
                REVIEW FORM
            ================================================== */}

            <div>

              <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

                <h3 className="text-2xl font-black text-neutral-950">
                  Write a Review
                </h3>


                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Share your experience with this product.
                </p>


                {!user ? (

                  <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-[#faf9f5] p-5">

                    <p className="text-sm text-neutral-600">
                      Please sign in to leave a rating or review.
                    </p>


                    <Link
                      to="/login"
                      state={{
                        from:
                          `/products/${currentProduct.id}`,
                      }}
                      className="mt-4 inline-flex rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black text-white"
                    >
                      Sign In
                    </Link>

                  </div>

                ) : hasReviewed ? (

                  <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">

                    <p className="text-sm font-bold text-green-700">
                      You have already reviewed this product.
                    </p>

                  </div>

                ) : (

                  <div className="mt-6">

                    <p className="text-sm font-bold text-neutral-800">
                      Your rating
                    </p>


                    <div className="mt-3 flex items-center gap-2">

                      {[1, 2, 3, 4, 5].map(
                        (
                          star,
                        ) => (

                          <button
                            key={
                              star
                            }
                            type="button"
                            onClick={() =>
                              setReviewRating(
                                star,
                              )
                            }
                            aria-label={`Rate ${star} out of 5`}
                            className="rounded-lg p-1"
                          >

                            <Star
                              size={28}
                              className={
                                star <=
                                reviewRating
                                  ? "fill-[#D4AF37] text-[#D4AF37]"
                                  : "text-neutral-300 hover:text-[#D4AF37]"
                              }
                            />

                          </button>

                        ),
                      )}

                    </div>


                    <div className="mt-6">

                      <label
                        htmlFor="product-review"
                        className="mb-2 block text-sm font-bold text-neutral-800"
                      >
                        Your review
                      </label>


                      <textarea
                        id="product-review"
                        value={
                          reviewComment
                        }
                        onChange={(
                          event,
                        ) =>
                          setReviewComment(
                            event.target.value,
                          )
                        }
                        rows={5}
                        maxLength={
                          1000
                        }
                        placeholder="Tell other customers what you think..."
                        className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm leading-6 outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />


                      <p className="mt-2 text-right text-xs text-neutral-400">
                        {
                          reviewComment.length
                        }
                        /1000
                      </p>

                    </div>


                    {reviewError && (

                      <div
                        role="alert"
                        className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        {
                          reviewError
                        }
                      </div>

                    )}


                    {reviewSubmitted && (

                      <div
                        role="status"
                        className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                      >
                        Your review was submitted successfully.
                      </div>

                    )}


                    <button
                      type="button"
                      onClick={() =>
                        void handleSubmitReview()
                      }
                      disabled={
                        submittingReview
                      }
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {submittingReview && (

                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                      )}


                      {
                        submittingReview
                          ? "Submitting..."
                          : "Submit Review"
                      }

                    </button>

                  </div>

                )}

              </div>

            </div>

          </div>


          {/* =================================================
              REVIEW LIST
          ================================================== */}

          <div className="mt-12">

            <div className="flex items-center justify-between">

              <h3 className="text-2xl font-black text-neutral-950">
                Customer Reviews
              </h3>


              {reviewsLoading && (

                <span className="text-xs font-bold text-neutral-400">
                  Loading...
                </span>

              )}

            </div>


            {!reviewsLoading &&
              reviews.length ===
                0 && (

              <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">

                <Star
                  className="mx-auto text-[#D4AF37]"
                  size={32}
                />


                <p className="mt-3 font-bold text-neutral-700">
                  No reviews yet
                </p>


                <p className="mt-1 text-sm text-neutral-500">
                  Be the first customer to review this product.
                </p>

              </div>

            )}


            {!reviewsLoading &&
              reviews.length >
                0 && (

              <div className="mt-5 space-y-4">

                {reviews.map(
                  (
                    review,
                  ) => (

                    <article
                      key={
                        review.id
                      }
                      className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <p className="font-black text-neutral-950">
                            {
                              review.userName
                            }
                          </p>


                          <div className="mt-2 flex items-center gap-1">

                            {[1, 2, 3, 4, 5].map(
                              (
                                star,
                              ) => (

                                <Star
                                  key={
                                    star
                                  }
                                  size={15}
                                  className={
                                    star <=
                                    review.rating
                                      ? "fill-[#D4AF37] text-[#D4AF37]"
                                      : "text-neutral-300"
                                  }
                                />

                              ),
                            )}

                          </div>

                        </div>


                        <span className="text-xs text-neutral-400">
                          {
                            formatReviewDate(
                              review.createdAt,
                            )
                          }
                        </span>

                      </div>


                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-600">
                        {
                          review.comment
                        }
                      </p>

                    </article>

                  ),
                )}

              </div>

            )}

          </div>

        </section>

      </div>

    </section>
  );
}