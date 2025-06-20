import { redirect } from 'next/navigation';

export default function MotorizedPage() {
  // Redirect to products page with category 22 (motorized)
  redirect('/products?category=22');
}