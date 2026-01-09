'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

interface Room {
  room_type_id?: number;
  id?: number;
  name: string;
  image?: string;
  image_url?: string;
  link?: string;
  description?: string;
  product_count?: number;
}

interface EnhancedRoomsSectionProps {
  rooms: Room[];
  title?: string;
  subtitle?: string;
}

export default function EnhancedRoomsSection({
  rooms,
  title = 'Shop By Room',
  subtitle = 'Find the perfect window treatments for every space in your home'
}: EnhancedRoomsSectionProps) {
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);

  if (rooms.length === 0) return null;

  // Select featured room (first one or the one with most products)
  const featuredRoom = rooms[0];
  const otherRooms = rooms.slice(1, 7); // Limit to 6 additional rooms

  const getImageUrl = (room: Room): string => {
    const url = room.image_url || room.image;
    if (!url) return '/images/rooms/default-room.jpg';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
    return `/uploads/${url}`;
  };

  const getRoomLink = (room: Room): string => {
    return room.link || `/products?room=${encodeURIComponent(room.name.toLowerCase().replace(/\s+/g, '-'))}`;
  };

  return (
    <section className="py-20 bg-white relative">
      {/* Subtle Top Accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-14">
          <div className="inline-flex items-center gap-4 mb-6">
            <span className="w-12 h-px bg-primary-red" />
            <span className="text-primary-red text-sm font-medium tracking-[0.3em] uppercase">Explore Spaces</span>
            <span className="w-12 h-px bg-primary-red" />
          </div>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
            <span className="font-light">{title.split(' ').slice(0, 2).join(' ')}</span>{' '}
            <span className="font-semibold">{title.split(' ').slice(2).join(' ')}</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">{subtitle}</p>
        </ScrollAnimationWrapper>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[220px] lg:auto-rows-[200px]">
          {/* Featured Room - Large Card */}
          <ScrollAnimationWrapper
            animation="fadeInUp"
            delay={0}
            className="md:col-span-2 md:row-span-2"
          >
            <RoomCard
              room={featuredRoom}
              isHovered={hoveredRoom === (featuredRoom.room_type_id || featuredRoom.id)}
              onHover={setHoveredRoom}
              isFeatured={true}
              getImageUrl={getImageUrl}
              getRoomLink={getRoomLink}
            />
          </ScrollAnimationWrapper>

          {/* Other Rooms */}
          {otherRooms.map((room, index) => (
            <ScrollAnimationWrapper
              key={room.room_type_id || room.id || index}
              animation="fadeInUp"
              delay={(index + 1) * 100}
            >
              <RoomCard
                room={room}
                isHovered={hoveredRoom === (room.room_type_id || room.id)}
                onHover={setHoveredRoom}
                isFeatured={false}
                getImageUrl={getImageUrl}
                getRoomLink={getRoomLink}
              />
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* View All Rooms Link */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={400} className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 text-gray-900 hover:text-primary-red font-medium transition-all duration-500 group"
          >
            <span className="uppercase tracking-wider text-sm">Browse All Rooms</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
          </Link>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}

// Room Card Component with Parallax Tilt Effect - Luxury Styled
function RoomCard({
  room,
  isHovered,
  onHover,
  isFeatured,
  getImageUrl,
  getRoomLink
}: {
  room: Room;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  isFeatured: boolean;
  getImageUrl: (room: Room) => string;
  getRoomLink: (room: Room) => string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: '' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: '' });
    onHover(null);
  };

  const roomId = room.room_type_id || room.id || 0;

  return (
    <Link href={getRoomLink(room)}>
      <div
        ref={cardRef}
        className="relative h-full overflow-hidden group cursor-pointer transition-all duration-700"
        style={tiltStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => onHover(roomId)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Image */}
        <Image
          src={getImageUrl(room)}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
        />

        {/* Gradient Overlay - Charcoal instead of black */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/25 to-transparent transition-opacity duration-500" />

        {/* Red Accent Line on Hover */}
        <div className={`absolute bottom-0 left-0 h-1 bg-primary-red transition-all duration-700 ${
          isHovered ? 'w-full' : 'w-0'
        }`} />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          {/* Product Count Badge - Elegant */}
          {room.product_count && (
            <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-medium px-4 py-2 flex items-center gap-2 tracking-wide">
              <Package className="w-3.5 h-3.5 text-primary-red" />
              {room.product_count} products
            </div>
          )}

          {/* Room Name */}
          <h3 className={`font-semibold text-white mb-2 transition-transform duration-500 group-hover:-translate-y-1 tracking-wide ${
            isFeatured ? 'text-3xl' : 'text-xl'
          }`}>
            {room.name}
          </h3>

          {/* Description (Featured Only) */}
          {isFeatured && room.description && (
            <p className="text-white/70 text-sm mb-4 line-clamp-2 max-w-md font-light">
              {room.description}
            </p>
          )}

          {/* Shop Now Link - Elegant */}
          <div className="flex items-center gap-2 text-white font-medium transition-all duration-500 group-hover:text-primary-red">
            <span className={`uppercase tracking-wider ${isFeatured ? 'text-sm' : 'text-xs'}`}>Shop Now</span>
            <ArrowRight className={`transition-transform duration-500 group-hover:translate-x-2 ${
              isFeatured ? 'w-5 h-5' : 'w-4 h-4'
            }`} />
          </div>
        </div>

        {/* Shine Effect on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: 'translateX(-100%)',
            animation: isHovered ? 'shine 0.8s ease-in-out forwards' : 'none'
          }}
        />
      </div>
    </Link>
  );
}
