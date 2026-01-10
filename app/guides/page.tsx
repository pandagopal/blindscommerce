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
      <div className="bg-gray-100 rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Help & Guides
          </h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about measuring, installing, and caring for your window treatments.
            Our comprehensive guides will help you every step of the way.
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-red transition-all group"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-primary-red group-hover:bg-primary-red group-hover:text-white transition-colors">
                {guide.icon}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary-red transition-colors">
                  {guide.title}
                </h2>
                <p className="text-gray-600">{guide.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Professional Services CTA */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Prefer Professional Help?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
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
