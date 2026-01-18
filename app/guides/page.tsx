"use client";

import Link from "next/link";

export default function GuidesPage() {
  const guides = [
    {
      title: "How to Measure Your Windows",
      description: "Step-by-step instructions for measuring windows for blinds and shades. Learn about inside vs outside mount and get accurate measurements.",
      href: "/guides/measuring",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Installation Guide",
      description: "Learn how to install your blinds and shades like a pro. Includes tips for different mount types and window treatments.",
      href: "/guides/installation",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: "Inside vs Outside Mount",
      description: "Learn the differences between inside and outside mounting to choose the best option for your windows.",
      href: "/guides/mounting",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      title: "Choosing the Right Blinds",
      description: "Not sure which window treatment is right for you? Our guide helps you choose based on light control, privacy, and style.",
      href: "/guides/choosing-blinds",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Care & Maintenance",
      description: "Keep your blinds and shades looking their best with our cleaning and maintenance tips for different materials.",
      href: "/guides/care-maintenance",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-8 md:p-10 mb-10 shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white leading-tight">
            Help & Guides
          </h1>
          <p className="text-base md:text-lg text-white/90 leading-relaxed">
            Everything you need to know about measuring, installing, and caring for your window treatments.
            Our comprehensive guides will help you every step of the way.
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-12">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-xl hover:border-primary-red/30 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-red-50 rounded-lg flex items-center justify-center text-primary-red group-hover:bg-primary-red group-hover:text-white transition-all duration-300 shadow-sm">
                {guide.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-primary-red transition-colors leading-tight">
                  {guide.title}
                </h2>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{guide.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Professional Services CTA */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-8 md:p-10 text-center shadow-md border border-gray-200">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Prefer Professional Help?</h2>
        <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
          Our expert team offers professional measuring and installation services
          to ensure your window treatments fit perfectly.
        </p>
        <Link
          href="/measure-install"
          className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block"
        >
          Book a Service
        </Link>
      </div>
    </div>
  );
}
