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
  {
    id: "bmw-x6-model",
    name: "BMW X6 Scale Model",
    description: "Die-cast detail, premium finish, display-ready build.",
    priceCents: 21900,
    imageDataUri: "/bmw-m4-coupe.png",
  },
  {
    id: "gle63-model",
    name: "AMG GLE 63 Scale Model",
    description: "Aggressive stance, crisp panel lines, collector edition.",
    priceCents: 24900,
    imageDataUri: "/benz-gle63.jpg",
  },
  {
    id: "lambo-model",
    name: "Lamborghini Supercar Model",
    description: "High-gloss paint, detailed interior, shelf statement piece.",
    priceCents: 29900,
    imageDataUri: "/lambo.jpg",
  },
  {
    id: "rolls-royce-model",
    name: "Rolls‑Royce Luxury Model",
    description: "Elegant proportions, premium finish, museum-style presence.",
    priceCents: 34900,
    imageDataUri: "/rolls-royce.jpg",
  },
];

export function getProductById(productId: string) {
  return PRODUCTS.find((p) => p.id === productId) ?? null;
}
