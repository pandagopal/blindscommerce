'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCreationForm from '@/components/products/ProductCreationForm';

export default function VendorAddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const productId = searchParams.get('edit');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/vendor/products/new');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'vendor' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);

        // If we have a product ID, we're in edit mode
        if (productId) {
          setIsEditMode(true);
          await loadProductData(productId);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/vendor/products/new');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, productId]);

  const loadProductData = async (id: string) => {
    try {
      console.log('Loading product data for ID:', id);
      const res = await fetch(`/api/vendor/products/${id}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('API Response:', data);
        console.log('Product data:', data.product);
        
        if (data && data.product) {
          console.log('Setting product data:', data.product);
          setProductData(data.product);
        } else {
          // Handle case where API returns success but no product data
          console.warn('No product data in response');
          setIsEditMode(false);
        }
      } else {
        // Handle API errors gracefully - don't redirect, just switch to create mode
        console.warn('Failed to load product, status:', res.status);
        const errorData = await res.text();
        console.warn('Error response:', errorData);
        setIsEditMode(false);
      }
    } catch (error) {
      // Handle network/parsing errors gracefully
      console.error('Error loading product:', error);
      setIsEditMode(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <ProductCreationForm 
        userRole="vendor" 
        isEditMode={isEditMode}
        initialData={productData}
        productId={productId}
      />
    </div>
  );
}