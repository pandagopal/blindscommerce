'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductCreationForm from '@/components/products/ProductCreationForm';

export default function VendorViewProductPage() {
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
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login?redirect=/vendor/products/view/' + productId);
          return;
        }
        const authData = await authRes.json();
        if (authData.user.role !== 'vendor' && authData.user.role !== 'admin') {
          router.push('/');
          return;
        }
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
      console.log('Loading product data for ID:', id);
      
      // Try vendor products API first
      const res = await fetch(`/api/vendor/products/${id}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('API Response:', data);
        
        if (data && data.product) {
          console.log('Setting product data:', data.product);
          console.log('Product data structure:', {
            name: data.product.name,
            category_id: data.product.category_id,
            base_price: data.product.base_price,
            full_description: data.product.full_description
          });
          setProductData(data.product);
        } else {
          console.log('No product data in response:', data);
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Product</h1>
        <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
        <button
          onClick={() => router.push('/vendor/products')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="-m-6"> {/* Negative margin to counteract the parent container padding */}
      <ProductCreationForm 
        userRole="vendor" 
        isViewMode={true}
        initialData={productData}
        productId={productId}
        className="bg-transparent" // Remove the gradient background since we're already in the layout
      />
    </div>
  );
}