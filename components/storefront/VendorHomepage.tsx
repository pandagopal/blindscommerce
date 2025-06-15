'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Eye, ArrowRight } from 'lucide-react';
import VendorReviews from '@/components/vendor/VendorReviews';

interface PageData {
  pageId: number;
  pageType: string;
  pageSlug: string;
  pageTitle: string;
  pageContent: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  displayOrder: number;
}

interface FeaturedProduct {
  productId: number;
  name: string;
  slug: string;
  shortDescription: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  vendorPrice: number | null;
}

interface StorefrontInfo {
  storefrontId: number;
  vendorId: number;
  storefrontName: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  aboutSection: string | null;
  featuredProducts: any;
  companyName: string;
}

interface VendorHomepageProps {
  homepage: PageData | null;
  featuredProducts: FeaturedProduct[];
  storefront: StorefrontInfo;
  subdomain: string;
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  const displayPrice = product.vendorPrice || product.basePrice;

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-4xl text-gray-400">🏠</div>
          </div>
        )}
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <Button size="sm" variant="secondary" className="shadow-lg">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm" className="shadow-lg vendor-bg-primary">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
        
        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold vendor-primary">
              ${displayPrice.toFixed(2)}
            </span>
            {product.vendorPrice && product.vendorPrice !== product.basePrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.basePrice.toFixed(2)}
              </span>
            )}
          </div>
          <Badge variant="secondary" className="vendor-bg-primary text-white">
            Popular
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VendorHomepage({ 
  homepage, 
  featuredProducts, 
  storefront, 
  subdomain 
}: VendorHomepageProps) {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center max-w-4xl mx-auto">
          {homepage ? (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: homepage.pageContent }}
            />
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 vendor-primary">
                Welcome to {storefront.storefrontName}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {storefront.description || 'Discover our premium selection of blinds and window treatments, crafted with quality and designed for your home.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="vendor-bg-primary hover:opacity-90">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="vendor-border-primary vendor-hover-primary">
                  View Catalog
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 vendor-primary">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our most popular blinds and window treatments, carefully selected for quality and style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="vendor-border-primary vendor-hover-primary"
              asChild
            >
              <Link href="/products">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* About Section */}
      {storefront.aboutSection && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 vendor-primary">
                About {storefront.storefrontName}
              </h2>
              <div
                className="prose prose-lg max-w-none text-center"
                dangerouslySetInnerHTML={{ __html: storefront.aboutSection }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 vendor-primary">
            Why Choose {storefront.storefrontName}?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're committed to providing the highest quality window treatments with exceptional service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-16 h-16 vendor-bg-primary rounded-full flex items-center justify-center text-white text-2xl mb-4">
                🏆
              </div>
              <CardTitle className="vendor-primary">Premium Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We source only the finest materials and work with trusted manufacturers to ensure lasting quality.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-16 h-16 vendor-bg-primary rounded-full flex items-center justify-center text-white text-2xl mb-4">
                🎨
              </div>
              <CardTitle className="vendor-primary">Custom Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Every window is unique. We offer custom sizing and personalization options for the perfect fit.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-16 h-16 vendor-bg-primary rounded-full flex items-center justify-center text-white text-2xl mb-4">
                🚚
              </div>
              <CardTitle className="vendor-primary">Fast Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Quick turnaround times and reliable shipping to get your new window treatments installed fast.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="container mx-auto px-4">
        <VendorReviews 
          vendorId={storefront.vendorId} 
          vendorName={storefront.storefrontName}
        />
      </section>

      {/* Call to Action */}
      <section className="vendor-bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Windows?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get started with a free consultation and discover the perfect window treatments for your space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
              Get Free Quote
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}