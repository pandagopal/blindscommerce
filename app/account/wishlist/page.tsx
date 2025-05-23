import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WishlistItem {
  id: number;
  productId: number;
  name: string;
  image: string;
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [newProductId, setNewProductId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/account/wishlist')
      .then(res => res.json())
      .then(data => setWishlist(data.wishlist || []))
      .finally(() => setLoading(false));
  }, []);

  const removeItem = async (id: number) => {
    await fetch('/api/account/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setWishlist(wishlist => wishlist.filter(item => item.id !== id));
  };

  // Demo: Add a product by ID (in real app, this would come from product page)
  const addItem = async () => {
    if (!newProductId) return;
    const res = await fetch('/api/account/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: Number(newProductId),
        name: `Product #${newProductId}`,
        image: '/placeholder-product.jpg',
      })
    });
    const data = await res.json();
    setWishlist(wishlist => [...wishlist, data.item]);
    setNewProductId('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="number"
          placeholder="Product ID"
          value={newProductId}
          onChange={(e) => setNewProductId(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={addItem}
          className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark"
        >
          Add Product (Demo)
        </button>
      </div>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : wishlist.length === 0 ? (
        <p className="text-gray-600">Your wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="bg-white border rounded-lg p-4 flex flex-col items-center">
              <img src={item.image} alt={item.name} className="w-32 h-32 object-contain mb-2" />
              <h2 className="font-medium mb-2">{item.name}</h2>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-600 hover:underline mt-2"
              >
                Remove
              </button>
              <Link href={`/products/${item.productId}`} className="text-primary-red hover:underline mt-2">
                View Product
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 