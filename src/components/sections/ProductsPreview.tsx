import {
  ArrowRight,
  Package,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getProducts,
} from "../../services/product.service";

import type {
  Product,
} from "../../types/product";


const fallbackProducts: Product[] = [
  {
    id: "demo-1",
    name: "Arduino UNO R3",
    description:
      "Classic development board for electronics, automation and prototyping.",
    category:
      "Development Boards",
    price:
      699,
    currency:
      "INR",
    stock:
      25,
    available:
      true,
    featured:
      true,
    images:
      [],
  },
  {
    id: "demo-2",
    name: "ESP32 Development Board",
    description:
      "Wi-Fi and Bluetooth enabled development board for connected projects.",
    category:
      "Development Boards",
    price:
      499,
    currency:
      "INR",
    stock:
      30,
    available:
      true,
    featured:
      true,
    images:
      [],
  },
  {
    id: "demo-3",
    name: "HC-SR04 Ultrasonic Sensor",
    description:
      "Reliable distance sensing for robotics, Arduino and embedded projects.",
    category:
      "Sensors",
    price:
      149,
    currency:
      "INR",
    stock:
      40,
    available:
      true,
    featured:
      false,
    images:
      [],
  },
];


function getProductImage(
  product: Product,
): string {
  const imageUrl =
    typeof product.imageUrl ===
    "string"
      ? product.imageUrl.trim()
      : "";

  if (imageUrl) {
    return imageUrl;
  }


  const image =
    typeof product.image ===
    "string"
      ? product.image.trim()
      : "";

  if (image) {
    return image;
  }


  if (
    Array.isArray(
      product.images,
    )
  ) {
    const firstImage =
      product.images.find(
        (
          item,
        ) =>
          typeof item ===
            "string" &&
          item.trim().length >
            0,
      );

    if (firstImage) {
      return firstImage;
    }
  }


  return "";
}


function formatPrice(
  price: number | undefined,
): string {
  const safePrice =
    typeof price ===
      "number" &&
    Number.isFinite(
      price,
    )
      ? price
      : 0;

  return safePrice.toLocaleString(
    "en-IN",
  );
}


export function ProductsPreview() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    fallbackProducts,
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    let mounted = true;


    async function loadProducts() {
      try {
        const data =
          await getProducts();


        if (
          !mounted
        ) {
          return;
        }


        /*
         * Only show active/available products on the
         * public homepage.
         */

        const visibleProducts =
          data.filter(
            (
              product,
            ) =>
              product.available !==
                false &&
              product.active !==
                false,
          );


        if (
          visibleProducts.length >
          0
        ) {
          /*
           * Featured products first.
           */

          const ordered =
            [...visibleProducts].sort(
              (
                a,
                b,
              ) =>
                Number(
                  Boolean(
                    b.featured,
                  ),
                ) -
                Number(
                  Boolean(
                    a.featured,
                  ),
                ),
            );


          setProducts(
            ordered.slice(
              0,
              3,
            ),
          );
        }
      } catch (error) {
        console.error(
          "Unable to load homepage products:",
          error,
        );

        /*
         * Keep fallback products if Firebase is temporarily
         * unavailable.
         */
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }


    void loadProducts();


    return () => {
      mounted = false;
    };
  }, []);


  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-28">

      {/* ==================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#D4AF37]/8 blur-3xl" />

      <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-neutral-100 blur-3xl" />


      <div className="container-custom relative">

        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-4 py-2">

              <Sparkles
                size={14}
                className="text-[#D4AF37]"
              />

              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                Featured Products
              </span>

            </div>


            <h2 className="mt-5 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
              Explore our
              <span className="text-[#D4AF37]">
                {" "}solutions.
              </span>
            </h2>


            <p className="mt-5 max-w-2xl leading-8 text-neutral-600">
              Discover development boards, sensors, electronics and
              technology products selected for makers, students,
              engineers and businesses.
            </p>

          </div>


          <Link
            to="/products"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-black text-[#9b7e1d] transition hover:text-[#D4AF37]"
          >
            View all products

            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

        </div>


        {/* ==================================================
            PRODUCTS
        =================================================== */}

        {loading ? (

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-[2rem] border border-neutral-200 bg-white"
                >

                  <div className="h-64 bg-neutral-100" />

                  <div className="space-y-4 p-6">

                    <div className="h-3 w-24 rounded-full bg-neutral-200" />

                    <div className="h-6 w-3/4 rounded-full bg-neutral-200" />

                    <div className="h-4 w-full rounded-full bg-neutral-100" />

                    <div className="h-4 w-2/3 rounded-full bg-neutral-100" />

                  </div>

                </div>
              ),
            )}

          </div>

        ) : (

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {products.map(
              (
                product,
              ) => {
                const image =
                  getProductImage(
                    product,
                  );


                const productPrice =
                  formatPrice(
                    product.price,
                  );


                return (
                  <article
                    key={
                      product.id
                    }
                    className="group overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[0_25px_70px_rgba(30,30,30,0.10)]"
                  >

                    {/* IMAGE */}

                    <Link
                      to={`/products/${product.id}`}
                      className="block"
                    >

                      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-[#faf8f0]">

                        {image ? (

                          <img
                            src={
                              image
                            }
                            alt={
                              product.name
                            }
                            loading="lazy"
                            className="h-full w-full object-contain p-8 transition duration-500 group-hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-950 text-[#D4AF37] shadow-xl">

                            <Package
                              size={38}
                            />

                          </div>

                        )}


                        {/* Featured badge */}

                        {product.featured && (
                          <div className="absolute left-4 top-4 rounded-full bg-[#D4AF37] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                            Featured
                          </div>
                        )}


                        {/* Stock badge */}

                        {product.stock <= 0 && (
                          <div className="absolute right-4 top-4 rounded-full bg-neutral-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                            Out of Stock
                          </div>
                        )}

                      </div>

                    </Link>


                    {/* CONTENT */}

                    <div className="p-7">

                      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                        {product.category}
                      </p>


                      <Link
                        to={`/products/${product.id}`}
                      >

                        <h3 className="mt-3 line-clamp-2 text-xl font-black text-neutral-950 transition group-hover:text-[#9b7e1d]">
                          {product.name}
                        </h3>

                      </Link>


                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
                        {product.description}
                      </p>


                      <div className="mt-7 flex items-center justify-between gap-4">

                        <div>

                          <p className="text-xl font-black text-neutral-950">
                            ₹
                            {
                              productPrice
                            }
                          </p>


                          {product.stock >
                            0 && (
                            <p className="mt-1 text-xs font-semibold text-neutral-400">
                              {product.stock} in stock
                            </p>
                          )}

                        </div>


                        <Link
                          to={`/products/${product.id}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-[#D4AF37]"
                          aria-label={`View ${product.name}`}
                        >
                          <ArrowRight
                            size={17}
                          />
                        </Link>

                      </div>

                    </div>

                  </article>
                );
              },
            )}

          </div>

        )}


        {/* ==================================================
            BOTTOM CTA
        =================================================== */}

        <div className="mt-10 flex flex-col gap-5 rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <Package
                size={22}
              />

            </div>


            <div>

              <p className="font-black text-neutral-950">
                Looking for something specific?
              </p>

              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Browse the full catalog or tell us what you need.
              </p>

            </div>

          </div>


          <div className="flex flex-wrap gap-3">

            <Link
              to="/products"
              className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-black text-white transition hover:bg-neutral-800"
            >
              Browse Catalog
            </Link>


            <Link
              to="/contact"
              className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-black text-neutral-900 transition hover:border-[#D4AF37]"
            >
              Ask Our Team
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}


export default ProductsPreview;