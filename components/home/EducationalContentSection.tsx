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
  subtitle = 'Everything you need to make the perfect choice'
}: EducationalContentSectionProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-14">
          <div className="inline-flex items-center gap-4 mb-6">
            <span className="w-12 h-px bg-primary-red" />
            <span className="text-primary-red text-sm font-medium tracking-[0.3em] uppercase">Resources</span>
            <span className="w-12 h-px bg-primary-red" />
          </div>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
            <span className="font-light">Help &</span>{' '}
            <span className="font-semibold">Resources</span>
          </h2>
          <p className="text-gray-500 text-lg font-light">{subtitle}</p>
        </ScrollAnimationWrapper>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Buying Guides */}
          <ScrollAnimationWrapper animation="fadeInUp" delay={100} className="lg:col-span-2">
            <div className="bg-white border border-gray-100 p-8 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary-red/10 border border-primary-red/20">
                  <BookOpen className="w-5 h-5 text-primary-red" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 tracking-wide">Buying Guides</h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                {BUYING_GUIDES.map((guide) => (
                  <Link
                    key={guide.id}
                    href={guide.link}
                    className="group bg-gray-50 overflow-hidden hover:shadow-md transition-all duration-500"
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <guide.icon className="w-10 h-10 text-primary-red/30" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 group-hover:text-primary-red transition-colors mb-1.5 tracking-wide">
                        {guide.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2 font-light">{guide.description}</p>
                      <span className="text-xs text-primary-red font-medium tracking-wide">{guide.readTime}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href="/guides"
                className="inline-flex items-center gap-2 text-gray-900 hover:text-primary-red font-medium mt-8 group transition-all duration-500"
              >
                <span className="uppercase tracking-wider text-sm">View All Guides</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollAnimationWrapper>

          {/* Video Tutorials */}
          <ScrollAnimationWrapper animation="fadeInUp" delay={200}>
            <div className="bg-white border border-gray-100 p-8 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary-red/10 border border-primary-red/20">
                  <Play className="w-5 h-5 text-primary-red" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 tracking-wide">Video Tutorials</h3>
              </div>

              <div className="space-y-4">
                {VIDEO_TUTORIALS.map((video) => (
                  <button
                    key={video.id}
                    className="w-full flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 transition-all duration-500 text-left group"
                  >
                    <div className="relative w-20 h-14 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary-red flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 font-light">
                        {video.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm group-hover:text-primary-red transition-colors truncate tracking-wide">
                        {video.title}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>

              <Link
                href="/tutorials"
                className="inline-flex items-center gap-2 text-gray-900 hover:text-primary-red font-medium mt-8 group transition-all duration-500"
              >
                <span className="uppercase tracking-wider text-sm">Watch More Videos</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollAnimationWrapper>
        </div>

        {/* FAQ Section */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={300} className="mt-10">
          <div className="bg-white border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary-red/10 border border-primary-red/20">
                <HelpCircle className="w-5 h-5 text-primary-red" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 tracking-wide">Frequently Asked Questions</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-all duration-500"
                  >
                    <span className="font-medium text-gray-900 pr-4 tracking-wide">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-primary-red flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed font-light">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-10 pt-8 border-t border-gray-100">
              <p className="text-gray-500 mb-4 font-light">Still have questions?</p>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 bg-gray-900 text-white font-medium px-8 py-4 transition-all duration-500 hover:bg-primary-red"
              >
                <span className="uppercase tracking-wider text-sm">Contact Our Experts</span>
              </Link>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
