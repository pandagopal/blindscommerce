'use client';

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Star } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
}

interface Product {
  product_id: number;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  rating: number;
  primary_image: string;
}

interface Room {
  id: number;
  name: string;
  image: string;
  link: string;
}

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
}

interface HomeClientProps {
  categories: Category[];
  products: Product[];
  rooms?: Room[];
  reviews?: Review[];
}

export default function HomeClient({ categories, products, rooms = [], reviews = [] }: HomeClientProps) {
  // Fallback rooms if none provided (only for graceful degradation)
  const defaultRooms = [
    { id: 1, name: 'Living Room', image: '/images/rooms/living-room.jpg', link: '/rooms?type=living-room' },
    { id: 2, name: 'Bedroom', image: '/images/rooms/bedroom.jpg', link: '/rooms?type=bedroom' },
    { id: 3, name: 'Kitchen', image: '/images/rooms/kitchen.jpg', link: '/rooms?type=kitchen' },
    { id: 4, name: 'Bathroom', image: '/images/rooms/bathroom.jpg', link: '/rooms?type=bathroom' }
  ];

  const displayRooms = rooms.length > 0 ? rooms : defaultRooms;

  return (      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Hero Section with Multiple Slides */}
        <section className="relative h-[600px]">
          {/* Coming Soon Banner */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-8 py-3 rounded-full shadow-lg animate-pulse">
              <span className="font-bold text-2xl">Coming Soon!</span>
            </div>
          </div>
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            loop={true}
            className="h-full [&_.swiper-pagination-bullet-active]:bg-primary-red [&_.swiper-button-next]:!text-white [&_.swiper-button-prev]:!text-white [&_.swiper-button-next]:!bg-black/50 [&_.swiper-button-prev]:!bg-black/50 [&_.swiper-button-next:hover]:!bg-black/70 [&_.swiper-button-prev:hover]:!bg-black/70"
          >
            <SwiperSlide>
              <div className="relative h-full">
                <Image
                  src="/images/hero/hero-1.jpg"
                  alt="Modern window treatments"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 via-blue-600/70 to-cyan-600/60" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-lg text-white">
                      <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Transform Your Windows</h1>
                      <p className="text-xl mb-8 drop-shadow">Up to 40% off + Free Shipping</p>
                      <div className="flex gap-4">
                        <Link 
                          href="/products" 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                          Shop Now
                        </Link>
                        <Link 
                          href="/measure-install" 
                          className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl"
                        >
                          Get Professional Help
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          <SwiperSlide>
            <div className="relative h-full">
              <Image
                src="/images/hero/hero-2.jpg"
                alt="Luxury window treatments"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-cyan-600/70 to-emerald-600/60" />
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                  <div className="max-w-lg text-white">
                    <h1 className="text-5xl font-bold mb-4">Summer Sale</h1>
                    <p className="text-xl mb-8">Get an Extra 15% Off All Shades</p>
                    <Link href="/products/shades" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-full font-semibold transition-all inline-block">
                      Shop Shades
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>
      {/* Rest of the sections */}        {/* Promotion Banner Strip */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">🚚 Free Shipping</span>
                <span>on orders over $100</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="font-semibold text-lg">⚡️ Flash Sale</span>
                <span>Extra 20% off Cellular Shades</span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <span className="font-semibold text-lg">🎉 Limited Time</span>
                <span>Free Cordless Upgrade</span>
              </div>
            </div>
          </div>
          <div className="absolute left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent"></div>
        </section>        {/* Shop By Room */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Shop By Room</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Find the perfect window treatments for every room in your home</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.isArray(displayRooms) && displayRooms.map((room, index) => (
                <Link href={room.link} key={index} className="group">
                  <div className="relative h-72 rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src={room.image}
                      alt={room.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-start p-6 group-hover:from-black/80 transition-all duration-300">
                      <div>
                        <h3 className="text-white text-2xl font-semibold mb-2">{room.name}</h3>
                        <span className="text-white/90 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Shop Now →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      {/* Featured Categories */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.isArray(categories) && categories.map((category) => (
              <Link href={`/products?category=${category.id}`} key={category.id}>
                <div className="group relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  {category.image && category.image.trim() !== '' ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">🪟</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-white text-xl font-semibold mb-2">{category.name}</h3>
                      <p className="text-white/80 text-sm">{category.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(reviews) && reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">&quot;{review.text}&quot;</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{review.author}</span>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.isArray(products) && products.map((product) => (
              <Link href={`/products/configure/${product.slug}`} key={product.product_id}>
                <div className="group">
                  <div className="relative h-64 rounded-lg overflow-hidden shadow-lg mb-4">
                    {product.primary_image && product.primary_image.trim() !== '' ? (
                      <Image
                        src={product.primary_image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">📦</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-red font-bold">${product.base_price}</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
