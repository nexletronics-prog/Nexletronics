import {
  ArrowRight,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
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
    category: "Development Boards",
    description:
      "Classic Arduino development board for electronics projects.",
    price: 699,
    currency: "INR",
    stock: 25,
    available: true,
    featured: true,
    images: [],
  },
  {
    id: "demo-2",
    name: "ESP32 Development Board",
    category: "Development Boards",
    description:
      "Wi-Fi and Bluetooth enabled development board.",
    price: 499,
    currency: "INR",
    stock: 30,
    available: true,
    featured: true,
    images: [],
  },
  {
    id: "demo-3",
    name: "HC-SR04 Ultrasonic Sensor",
    category: "Sensors",
    description:
      "Distance sensor for Arduino and robotics projects.",
    price: 149,
    currency: "INR",
    stock: 40,
    available: true,
    featured: false,
    images: [],
  },
];


function getProductImage(
  product: Product,
): string {
  const imageUrl =
    typeof product.imageUrl === "string"
      ? product.imageUrl.trim()
      : "";

  if (imageUrl) {
    return imageUrl;
  }


  const image =
    typeof product.image === "string"
      ? product.image.trim()
      : "";

  if (image) {
    return image;
  }


  if (
    Array.isArray(product.images)
  ) {
    const firstImage =
      product.images.find(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0,
      );

    if (firstImage) {
      return firstImage;
    }
  }


  return "";
}


function formatPrice(
  value: number | undefined,
): string {
  const price =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : 0;

  return price.toLocaleString("en-IN");
}


export default function Products() {
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


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    category,
    setCategory,
  ] = useState("All");


  const [
    showFilters,
    setShowFilters,
  ] = useState(false);


  useEffect(() => {
    let mounted = true;


    async function loadProducts() {
      try {
        const data =
          await getProducts();


        if (!mounted) {
          return;
        }


        const visibleProducts =
          data.filter(
            (product) =>
              product.available !== false &&
              product.active !== false,
          );


        if (
          visibleProducts.length > 0
        ) {
          setProducts(
            visibleProducts,
          );
        }
      } catch (error) {
        console.error(
          "Unable to load products:",
          error,
        );
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


  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          products
            .map(
              (product) =>
                product.category,
            )
            .filter(Boolean),
        ),
      ),
    ],
    [products],
  );


  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();


      return products.filter(
        (product) => {
          const matchesSearch =
            !query ||
            product.name
              .toLowerCase()
              .includes(query) ||
            product.description
              .toLowerCase()
              .includes(query) ||
            product.category
              .toLowerCase()
              .includes(query);


          const matchesCategory =
            category === "All" ||
            product.category === category;


          return (
            matchesSearch &&
            matchesCategory
          );
        },
      );
    }, [
      products,
      search,
      category,
    ]);


  return (
    <div className="bg-white">

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative overflow-hidden bg-[#faf9f5] py-20 sm:py-24">

        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-neutral-200/50 blur-3xl" />


        <div className="container-custom relative">

          <div className="max-w-4xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-white px-4 py-2">

              <Sparkles
                size={14}
                className="text-[#D4AF37]"
              />

              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
                Nexletronics Store
              </span>

            </div>


            <h1 className="mt-6 text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl lg:text-7xl">
              Technology for the
              <span className="text-[#D4AF37]">
                {" "}next generation.
              </span>
            </h1>


            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              Explore development boards, sensors, electronics,
              modules and technology products for makers,
              students, engineers and businesses.
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <section className="sticky top-20 z-30 border-b border-neutral-200 bg-white/95 py-5 backdrop-blur">

        <div className="container-custom">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-xl">

              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />


              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search products..."
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-11 text-sm outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
              />


              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-800"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}

            </div>


            <div className="hidden items-center gap-2 overflow-x-auto lg:flex">

              {categories.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setCategory(item)
                    }
                    className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-black transition ${
                      category === item
                        ? "bg-[#D4AF37] text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#D4AF37]/50 hover:text-[#9b7e1d]"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

            </div>


            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (current) =>
                    !current,
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-sm font-bold lg:hidden"
            >

              <SlidersHorizontal
                size={17}
              />

              Filters

              {category !== "All" && (
                <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] text-white">
                  1
                </span>
              )}

            </button>

          </div>


          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">

              {categories.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCategory(item);
                      setShowFilters(false);
                    }}
                    className={`rounded-full px-4 py-2.5 text-xs font-black ${
                      category === item
                        ? "bg-[#D4AF37] text-white"
                        : "border border-neutral-200 text-neutral-600"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

            </div>
          )}

        </div>

      </section>


      {/* ==================================================
          PRODUCT GRID
      ================================================== */}

      <section className="section">

        <div className="container-custom">

          <div className="mb-8 flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-black text-neutral-950">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "product"
                  : "products"}
              </p>


              {category !== "All" && (
                <p className="mt-1 text-xs text-neutral-500">
                  Category:{" "}
                  <span className="font-bold text-[#9b7e1d]">
                    {category}
                  </span>
                </p>
              )}

            </div>


            {search && (
              <p className="text-xs text-neutral-400">
                Searching for &quot;
                {search}
                &quot;
              </p>
            )}

          </div>


          {loading ? (

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white"
                  >

                    <div className="h-64 animate-pulse bg-neutral-100" />

                    <div className="space-y-4 p-6">

                      <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-200" />

                      <div className="h-6 w-3/4 animate-pulse rounded-full bg-neutral-200" />

                      <div className="h-4 w-full animate-pulse rounded-full bg-neutral-100" />

                      <div className="h-4 w-2/3 animate-pulse rounded-full bg-neutral-100" />

                    </div>

                  </div>
                ),
              )}

            </div>

          ) : filteredProducts.length > 0 ? (

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {filteredProducts.map(
                (product) => {
                  const image =
                    getProductImage(
                      product,
                    );


                  return (
                    <article
                      key={product.id}
                      className="group overflow-hidden rounded-[2rem] border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[0_25px_70px_rgba(30,30,30,0.10)]"
                    >

                      <Link
                        to={`/products/${product.id}`}
                        className="block"
                      >

                        <div className="relative flex h-64 items-center justify-center overflow-hidden bg-[#faf8f0]">

                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              loading="lazy"
                              className="h-full w-full object-contain p-8 transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-950 text-[#D4AF37] shadow-lg">
                              <Package size={38} />
                            </div>
                          )}


                          {product.featured && (
                            <span className="absolute left-4 top-4 rounded-full bg-[#D4AF37] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                              Featured
                            </span>
                          )}


                          {product.stock <= 0 && (
                            <span className="absolute right-4 top-4 rounded-full bg-neutral-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                              Out of Stock
                            </span>
                          )}

                        </div>

                      </Link>


                      <div className="p-6">

                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                          {product.category}
                        </p>


                        <Link
                          to={`/products/${product.id}`}
                        >

                          <h2 className="mt-2 line-clamp-2 text-xl font-black text-neutral-950 transition group-hover:text-[#9b7e1d]">
                            {product.name}
                          </h2>

                        </Link>


                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-500">
                          {product.description}
                        </p>


                        <div className="mt-6 flex items-end justify-between gap-4">

                          <div>

                            <p className="text-xl font-black text-neutral-950">
                              ₹{formatPrice(product.price)}
                            </p>


                            <p className="mt-1 text-xs font-semibold text-neutral-400">
                              {product.stock > 0
                                ? `${product.stock} in stock`
                                : "Currently unavailable"}
                            </p>

                          </div>


                          <Link
                            to={`/products/${product.id}`}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-[#D4AF37]"
                            aria-label={`View ${product.name}`}
                          >
                            <ArrowRight size={16} />
                          </Link>

                        </div>

                      </div>

                    </article>
                  );
                },
              )}

            </div>

          ) : (

            <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-neutral-50 px-6 py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Package size={28} />
              </div>


              <h2 className="mt-6 text-2xl font-black text-neutral-950">
                No products found
              </h2>


              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Try a different search term or choose another category.
              </p>


              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="mt-6 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-white"
              >
                Clear Filters
              </button>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}