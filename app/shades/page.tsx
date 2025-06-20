import { redirect } from 'next/navigation';

export default function ShadesPage() {
  // Redirect to products page with the main Shades category (ID: 1)
  redirect('/products?category=1');
}