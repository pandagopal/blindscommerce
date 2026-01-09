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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">{subtitle}</p>
        </ScrollAnimationWrapper>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px] lg:auto-rows-[180px]">
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
              className={index < 2 ? '' : ''}
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
        <ScrollAnimationWrapper animation="fadeInUp" delay={400} className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary-red hover:text-primary-red-dark font-semibold transition-colors group"
          >
            Browse All Rooms
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}

// Room Card Component with Parallax Tilt Effect
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

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

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
        className="relative h-full overflow-hidden group cursor-pointer transition-all duration-500"
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
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-500" />

        {/* Shine Effect on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: 'translateX(-100%)',
            animation: isHovered ? 'shine 0.7s ease-in-out forwards' : 'none'
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          {/* Product Count Badge */}
          {room.product_count && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-3 py-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {room.product_count} products
            </div>
          )}

          {/* Room Name */}
          <h3 className={`font-bold text-white mb-2 transition-transform duration-300 group-hover:-translate-y-1 ${
            isFeatured ? 'text-3xl' : 'text-xl'
          }`}>
            {room.name}
          </h3>

          {/* Description (Featured Only) */}
          {isFeatured && room.description && (
            <p className="text-white/80 text-sm mb-3 line-clamp-2 max-w-md">
              {room.description}
            </p>
          )}

          {/* Shop Now Link */}
          <div className="flex items-center gap-2 text-white font-medium transition-all duration-300 group-hover:gap-3">
            <span className={isFeatured ? 'text-base' : 'text-sm'}>Shop Now</span>
            <ArrowRight className={`transition-transform duration-300 group-hover:translate-x-1 ${
              isFeatured ? 'w-5 h-5' : 'w-4 h-4'
            }`} />
          </div>
        </div>

        {/* Border Glow Effect */}
        <div
          className={`absolute inset-0 border-2 transition-all duration-500 ${
            isHovered
              ? 'border-white/50 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]'
              : 'border-transparent'
          }`}
        />
      </div>
    </Link>
  );
}
