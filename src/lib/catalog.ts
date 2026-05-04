export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageDataUri: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "minimal-sneakers",
    name: "Minimal Sneakers",
    description: "Clean silhouette, everyday comfort, premium finish.",
    priceCents: 8900,
    imageDataUri: "/sneaker.png",
  },
  {
    id: "classic-hoodie",
    name: "Classic Hoodie",
    description: "Heavyweight fleece with a soft brushed interior.",
    priceCents: 7400,
    imageDataUri: "/hoodie.jpg",
  },
  {
    id: "structured-cap",
    name: "Structured Cap",
    description: "Matte hardware, structured crown, subtle branding.",
    priceCents: 3200,
    imageDataUri: "/cap.png",
  },
  {
    id: "everyday-tote",
    name: "Everyday Tote",
    description: "Durable canvas, internal pocket, reinforced handles.",
    priceCents: 2800,
    imageDataUri: "/tote.jpg",
  },
];

export function getProductById(productId: string) {
  return PRODUCTS.find((p) => p.id === productId) ?? null;
}
