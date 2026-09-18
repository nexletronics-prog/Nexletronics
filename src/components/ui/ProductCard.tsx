import {
  Package,
  ShoppingCart,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useCart,
} from "../../contexts/CartContext";

import type {
  Product,
} from "../../types/product";


interface ProductCardProps {
  product: Product;
}


export default function ProductCard({
  product,
}: ProductCardProps) {
  const {
    addToCart,
  } = useCart();


  const image =
    product.imageUrl ||
    product.image ||
    product.images?.[0];


  function handleAddToCart() {
    if (
      !product.available ||
      product.stock <= 0
    ) {
      return;
    }

    addToCart(
      product,
      1,
    );
  }


  return (
    <article className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl">

      {/* Image */}

      <Link
        to={`/products/${product.id}`}
        className="block"
      >

        <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-[#fffdf7] to-[#f3eee0]">

          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain p-7 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-lg">
              <Package
                className="text-[#D4AF37]"
                size={42}
              />
            </div>
          )}


          {product.featured && (
            <span className="absolute left-4 top-4 rounded-full bg-[#D4AF37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Featured
            </span>
          )}

        </div>

      </Link>


      {/* Content */}

      <div className="p-5">

        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
          {product.category}
        </p>

        <Link
          to={`/products/${product.id}`}
        >
          <h2 className="mt-2 line-clamp-2 min-h-[56px] text-lg font-black text-neutral-950 transition-colors group-hover:text-[#a48621]">
            {product.name}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
          {product.shortDescription ||
            product.description}
        </p>


        {/* Price */}

        <div className="mt-5 flex items-end justify-between gap-3">

          <div>

            <p className="text-xl font-black text-neutral-950">
              ₹
              {product.price.toLocaleString(
                "en-IN",
              )}
            </p>

            {product.compareAtPrice &&
              product.compareAtPrice >
                product.price && (
                <p className="text-xs text-neutral-400 line-through">
                  ₹
                  {product.compareAtPrice.toLocaleString(
                    "en-IN",
                  )}
                </p>
              )}

          </div>


          <button
            type="button"
            onClick={
              handleAddToCart
            }
            disabled={
              !product.available ||
              product.stock <= 0
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-[#D4AF37] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart
              size={18}
            />
          </button>

        </div>


        {/* Stock */}

        <div className="mt-4 text-xs font-medium">

          {product.available &&
          product.stock > 0 ? (
            <span className="text-green-600">
              {product.stock} in stock
            </span>
          ) : (
            <span className="text-red-500">
              Out of stock
            </span>
          )}

        </div>

      </div>

    </article>
  );
}