import HomeClient from './components/home/HomeClient';

// Mock data - replace with actual data fetching
const categories = [
  {
    id: 1,
    name: 'Cellular Shades',
    slug: 'cellular-shades',
    image: '/images/categories/cellular-shades.jpg',
    description: 'Energy-efficient window coverings with a distinctive honeycomb design'
  },
  {
    id: 2,
    name: 'Roller Shades',
    slug: 'roller-shades',
    image: '/images/categories/roller-shades.jpg',
    description: 'Clean, modern window treatments with smooth operation'
  },
  {
    id: 3,
    name: 'Wood Blinds',
    slug: 'wood-blinds',
    image: '/images/categories/wood-blinds.jpg',
    description: 'Classic window coverings made from genuine hardwood'
  }
];

const products = [
  {
    product_id: 1,
    name: 'Premium Cellular Shade',
    slug: 'premium-cellular-shade',
    category_name: 'Cellular Shades',
    base_price: 129.99,
    rating: 4.8,
    primary_image: '/images/products/cellular-shade-1.jpg'
  },
  {
    product_id: 2,
    name: 'Deluxe Roller Shade',
    slug: 'deluxe-roller-shade',
    category_name: 'Roller Shades',
    base_price: 89.99,
    rating: 4.7,
    primary_image: '/images/products/roller-shade-1.jpg'
  }
];

export default function Home() {
  return (
    <HomeClient categories={categories} products={products} />
  );
}