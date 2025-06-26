'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductCreationForm from '@/components/products/ProductCreationForm';

export default function ViewProductPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const productId = params.id as string;

  useEffect(() => {
    const checkAuthAndLoadProduct = async () => {
      try {
        // Check authentication
        const authRes = await fetch('/api/v2/auth/me');
        if (!authRes.ok) {
          router.push('/login?redirect=/products/view/' + productId);
          return;
        }
        const authData = await authRes.json();
        setUser(authData.user);

        // Load product data
        await loadProductData(productId);
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadProduct();
  }, [router, productId]);

  const loadProductData = async (id: string) => {
    try {
      
      // Try vendor products API first, then fall back to general products API
      let res = await fetch(`/api/vendor/products/${id}`);
      
      if (!res.ok) {
        // If vendor API fails, try general products API
        res = await fetch(`/api/products/${id}`);
      }
      
      if (res.ok) {
        const data = await res.json();
        
        if (data && data.product) {
          setProductData(data.product);
        } else {
          setError('Product not found');
        }
      } else {
        console.warn('Failed to load product, status:', res.status);
        const errorData = await res.text();
        console.warn('Error response:', errorData);
        setError('Failed to load product');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Failed to load product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Product</h1>
          <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
          <button
            onClick={() => router.back()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <ProductCreationForm 
        userRole={user?.role || 'vendor'} 
        isViewMode={true}
        initialData={productData}
        productId={productId}
      />
    </div>
  );
}