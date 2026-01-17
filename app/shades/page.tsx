'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Star, Shield, Truck, Phone } from 'lucide-react';

interface Product {
  product_id: number;
  name: string;
  slug: string;
  short_description: string;
  base_price: number;
  vendor_price?: number;
  category_name: string;
  category_slug: string;
  primary_image_url?: string;
}

interface Category {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function ShadesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Shade-related category slugs
  const shadeCategorySlugs = [
    'shades',
    'roller-shades', 
    'roman-shades',
    'cellular-shades',
    'pleated-shades',
    'sheer-shades',
    'zebra-shades',
    'outdoor-shades',
    'motorized-shades',
    'bamboo-woven-wood-shades'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories first
        const categoriesResponse = await fetch('/api/v2/commerce/categories');
        const categoriesData = await categoriesResponse.json();
        const allCategories = categoriesData.data?.categories || [];
        
        // Filter to shade-related categories
        const shadeCategories = allCategories.filter((cat: Category) => 
          shadeCategorySlugs.includes(cat.slug)
        );
        setCategories(shadeCategories);

        // Fetch products for shade categories
        const categoryIds = shadeCategories.map((cat: Category) => cat.category_id);
        const productPromises = categoryIds.map(id => 
          fetch(`/api/v2/commerce/products?categoryId=${id}&limit=50`)
            .then(res => res.json())
            .then(data => data.data?.data || [])
        );

        const productArrays = await Promise.all(productPromises);
        const allProducts = productArrays.flat();
        
        // Remove duplicates and sort
        const uniqueProducts = allProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.product_id === product.product_id)
        );
        
        setProducts(uniqueProducts);
      } catch (error) {
        console.error('Error fetching shade data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category_slug === selectedCategory);

  const getCategoryProducts = (categorySlug: string) => {
    return products.filter(product => product.category_slug === categorySlug);
  };

  const benefits = [
    {
      icon: <Shield className="h-8 w-8 text-primary-red" />,
      title: 'Child Safety',
      description: 'Cordless and motorized options for maximum safety'
    },
    {
      icon: <Star className="h-8 w-8 text-primary-red" />,
      title: 'Energy Efficiency',
      description: 'Reduce heating and cooling costs by up to 25%'
    },
    {
      icon: <Truck className="h-8 w-8 text-primary-red" />,
      title: 'Free Installation',
      description: 'Professional installation included with purchase'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shade products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Premium Window Shades
              </h1>
              <p className="text-xl md:text-2xl mb-2 text-white/90">
                Custom Made to Your Exact Specifications
              </p>
              <p className="text-lg mb-8 text-white/80">
                Transform your home with our collection of custom window shades. 
                From energy-efficient cellular shades to elegant romans, find the 
                perfect style for every room.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href={`/products/shades`}
                  className="bg-primary-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                >
                  Shop All Shades
                </Link>
                <Link 
                  href="/consultation"
                  className="bg-white/90 backdrop-blur hover:bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                >
                  Free Consultation
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">Why Choose Smart Blinds?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-red-300 mr-2" />
                    Free samples and consultation
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-red-300 mr-2" />
                    Professional installation included
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-red-300 mr-2" />
                    Lifetime warranty on all products
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-red-300 mr-2" />
                    Custom sizing at no extra charge
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Categories */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Shop Window Shades by Type
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our complete collection of custom window shades, each designed 
            to meet specific needs for light control, privacy, and style.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Shades ({products.length})
          </button>
          {categories.slice(0, 5).map((category) => {
            const categoryProducts = getCategoryProducts(category.slug);
            if (categoryProducts.length === 0) return null;
            
            return (
              <button
                key={category.category_id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name.replace(' Shades', '')} ({categoryProducts.length})
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.product_id} className="bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 bg-gray-200">
                  {product.primary_image_url ? (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">🪟</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {product.category_name}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.short_description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-primary-red">
                      ${(product.vendor_price || product.base_price).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">Starting price</span>
                  </div>
                  <Link
                    href={`/products/configure/${product.slug}`}
                    className="w-full bg-primary-red text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block"
                  >
                    Configure {product.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-xl">No products found in this category.</p>
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose Smart Blinds Window Shades?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 text-lg">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-red to-red-700 text-white py-20">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Windows?
          </h2>
          <p className="text-xl mb-8 text-red-100 max-w-3xl mx-auto">
            Get started with a free consultation and see why thousands choose Smart Blinds.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-primary-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Schedule Free Consultation
            </Link>
            <Link
              href="/samples"
              className="bg-white/90 backdrop-blur hover:bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Order Free Samples
            </Link>
            <a
              href="tel:+1-316-530-2635"
              className="flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-red transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call (316) 530-2635
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}