'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Play, ChevronDown, ChevronUp, ArrowRight, Ruler, Lightbulb, HelpCircle } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

interface EducationalContentSectionProps {
  title?: string;
  subtitle?: string;
}

const BUYING_GUIDES = [
  {
    id: 1,
    title: 'How to Measure Your Windows',
    description: 'Step-by-step guide for accurate measurements',
    icon: Ruler,
    link: '/guides/measuring',
    image: '/images/guides/measuring.jpg',
    readTime: '5 min read'
  },
  {
    id: 2,
    title: 'Choosing the Right Blinds',
    description: 'Find the perfect style for your space',
    icon: Lightbulb,
    link: '/guides/choosing-blinds',
    image: '/images/guides/choosing.jpg',
    readTime: '7 min read'
  },
  {
    id: 3,
    title: 'Inside vs Outside Mount',
    description: 'Learn which mounting option works best',
    icon: BookOpen,
    link: '/guides/mounting',
    image: '/images/guides/mounting.jpg',
    readTime: '4 min read'
  }
];

const VIDEO_TUTORIALS = [
  {
    id: 1,
    title: 'How to Install Roller Blinds',
    thumbnail: '/images/tutorials/roller-install.jpg',
    duration: '3:45',
    link: '#'
  },
  {
    id: 2,
    title: 'Measuring for Perfect Fit',
    thumbnail: '/images/tutorials/measuring.jpg',
    duration: '4:20',
    link: '#'
  },
  {
    id: 3,
    title: 'Setting Up Motorized Blinds',
    thumbnail: '/images/tutorials/motorized.jpg',
    duration: '5:15',
    link: '#'
  }
];

const FAQS = [
  {
    question: 'How long does shipping take?',
    answer: 'Standard shipping typically takes 5-7 business days. Express shipping (2-3 days) is available for an additional fee. Custom-made blinds require an additional 3-5 days for manufacturing.'
  },
  {
    question: 'Can I return custom blinds?',
    answer: 'Yes! We offer a 30-day satisfaction guarantee on all products, including custom blinds. If your blinds don\'t fit due to our manufacturing error, we\'ll remake them for free.'
  },
  {
    question: 'Do you offer professional installation?',
    answer: 'Yes, we partner with certified installers nationwide. Professional installation can be added at checkout, and our team will contact you to schedule a convenient time.'
  },
  {
    question: 'What warranty do you offer?',
    answer: 'All our blinds come with a lifetime warranty on mechanical parts. Motorized blinds include a 5-year warranty on the motor and remote control systems.'
  },
  {
    question: 'Can I get free samples?',
    answer: 'Absolutely! We offer free fabric and material samples so you can see and feel the quality before ordering. Order up to 10 free samples, and they\'ll arrive within 5 business days.'
  }
];

export default function EducationalContentSection({
  title = 'Help & Resources',
  subtitle = 'Everything you need to make the perfect choice'
}: EducationalContentSectionProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <section className="py-16 bg-gradient-to-b from-orange-50 via-red-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-red/10 text-primary-red text-sm font-medium px-4 py-1.5  mb-4">
            <BookOpen className="w-4 h-4" />
            Resources
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 text-lg">{subtitle}</p>
        </ScrollAnimationWrapper>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Buying Guides */}
          <ScrollAnimationWrapper animation="fadeInUp" delay={100} className="lg:col-span-2">
            <div className="bg-white  p-6 shadow-sm border border-gray-100 h-full">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-primary-red to-rose-600 ">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Buying Guides</h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {BUYING_GUIDES.map((guide) => (
                  <Link
                    key={guide.id}
                    href={guide.link}
                    className="group bg-gradient-to-br from-gray-50 to-red-50  overflow-hidden hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-red-100 to-orange-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <guide.icon className="w-10 h-10 text-primary-red/50" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-red transition-colors mb-1">
                        {guide.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">{guide.description}</p>
                      <span className="text-xs text-primary-red font-medium">{guide.readTime}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href="/guides"
                className="inline-flex items-center gap-2 text-primary-red hover:text-primary-dark font-medium mt-6 group"
              >
                View All Guides
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollAnimationWrapper>

          {/* Video Tutorials */}
          <ScrollAnimationWrapper animation="fadeInUp" delay={200}>
            <div className="bg-white  p-6 shadow-sm border border-gray-100 h-full">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 ">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Video Tutorials</h3>
              </div>

              <div className="space-y-3">
                {VIDEO_TUTORIALS.map((video) => (
                  <button
                    key={video.id}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-red-50  hover:from-red-50 hover:to-orange-50 transition-colors text-left group"
                  >
                    <div className="relative w-20 h-14  overflow-hidden bg-gradient-to-br from-red-200 to-orange-200 flex-shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90  flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <Play className="w-4 h-4 text-primary-red ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm group-hover:text-primary-red transition-colors truncate">
                        {video.title}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>

              <Link
                href="/guides/installation"
                className="inline-flex items-center gap-2 text-primary-red hover:text-primary-dark font-medium mt-6 group"
              >
                View Installation Guide
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollAnimationWrapper>
        </div>

        {/* FAQ Section */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={300} className="mt-8">
          <div className="bg-white  p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 ">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200  overflow-hidden hover:border-primary-red/30 transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-red-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-primary-red flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-6 pt-6 border-t border-gray-100">
              <p className="text-gray-600 mb-3">Still have questions?</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-medium px-6 py-3  transition-all shadow-lg hover:shadow-xl"
              >
                Contact Our Experts
              </Link>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
