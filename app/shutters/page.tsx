import { redirect } from 'next/navigation';

export default function ShuttersPage() {
  // Redirect to products page with a search for shutters
  redirect('/products?search=shutters&message=category-not-found');
}