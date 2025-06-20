import { redirect } from 'next/navigation';

export default function BlindsPage() {
  // Redirect to products page with Venetian Blinds category (ID: 23)
  redirect('/products?category=23');
}