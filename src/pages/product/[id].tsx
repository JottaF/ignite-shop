import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  ImageContainer,
  ProductContainer,
  ProductDetail,
} from "@/styles/pages/product";
import { GetStaticProps } from "next";
import Image from "next/image";
import axios from "axios";
import { useState } from "react";
import Head from "next/head";

interface ProductProps {
  product: {
    id: number;
    title: string;
    price: string;
    imageUrl: string;
    description: string;
    defaultPriceId: string;
  };
}

export default function Product({ product }: ProductProps) {
  const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] =
    useState(false);

  async function handleBuyProduct() {
    try {
      setIsCreatingCheckoutSession(true);

      const response = await axios.post("/api/checkout", {
        priceId: product.defaultPriceId,
      });

      const { checkoutUrl } = response.data;

      window.location.href = checkoutUrl;
    } catch (error) {
      //TODO conectar a uma ferramenta de observabilidade (Datadog / Sentry)
      alert("Falha ao redirecionar ao checkout!");
    }
  }
  return (
    <>
      <Head>
        <title>{product.title} | Ignite Shop</title>
      </Head>
      <ProductContainer>
        <ImageContainer>
          <Image src={product.imageUrl} alt="" width={520} height={480} />
        </ImageContainer>
        <ProductDetail>
          <h1>{product.title}</h1>
          <span>{product.price}</span>

          <p>{product.description}</p>
          <button
            disabled={isCreatingCheckoutSession}
            onClick={handleBuyProduct}
          >
            Comprar agora
          </button>
        </ProductDetail>
      </ProductContainer>
    </>
  );
}

export async function getStaticPaths() {
  const response = await stripe.products.list();

  const paths = response.data.map((product) => {
    return {
      params: { id: product.id },
    };
  });

  return { paths, fallback: true };
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({
  params,
}) => {
  const productId = params!.id;

  const product = await stripe.products.retrieve(productId, {
    expand: ["default_price"],
  });

  const price = product.default_price as Stripe.Price;

  return {
    props: {
      product: {
        id: product.id,
        title: product.name,
        price: Intl.NumberFormat("pt-br", {
          currency: "BRL",
          style: "currency",
        }).format(price.unit_amount! / 100),
        imageUrl: product.images[0],
        description: product.description,
        defaultPriceId: price.id,
      },
    },
    revalidate: 60 * 60 * 1, // 1 hour
  };
};
