import { HomeContainer, Product } from "@/styles/pages/home";
import Image from "next/image";
import Head from "next/head";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { GetStaticProps } from "next";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import Link from "next/link";

interface HomeProps {
  products: {
    id: number;
    title: string;
    price: string;
    imageUrl: string;
  }[];
}

export default function Home({ products }: HomeProps) {
  const [sliderRef] = useKeenSlider({
    slides: {
      perView: 3,
      spacing: 48,
    },
  });

  return (
    <>
      <Head>
        <title>Home | Ignite Shop</title>
      </Head>

      <HomeContainer ref={sliderRef} className="keen-slider">
        {products.map((product) => {
          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              prefetch={false}
            >
              <Product className="keen-slider__slide">
                <Image
                  src={product.imageUrl}
                  width={520}
                  height={480}
                  alt=""
                  placeholder="empty"
                />

                <footer>
                  <strong>{product.title}</strong>
                  <span>{product.price}</span>
                </footer>
              </Product>
            </Link>
          );
        })}
      </HomeContainer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const response = await stripe.products.list({
    expand: ["data.default_price"],
  });

  const products = response.data.map((product) => {
    const price = product.default_price as Stripe.Price;

    return {
      id: product.id,
      title: product.name,
      price: Intl.NumberFormat("pt-br", {
        currency: "BRL",
        style: "currency",
      }).format(price.unit_amount! / 100),
      imageUrl: product.images[0],
    };
  });

  return {
    props: {
      products: products,
    },
    revalidate: 60 * 60 * 2, // 2 hours
  };
};
