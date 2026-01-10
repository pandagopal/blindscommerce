import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { FAQJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Motorized Blinds for High Windows - Remote Control Window Treatments',
  description: 'Shop motorized blinds for hard-to-reach high windows. Control with remote, smartphone app, or voice commands. Free shipping. 5-year motor warranty. Easy DIY installation.',
  keywords: [
    'motorized blinds for high windows',
    'motorized blinds hard to reach',
    'remote control blinds',
    'smart blinds high ceiling',
    'automated window blinds',
    'electric blinds for tall windows',
    'motorized shades vaulted ceiling',
  ],
  path: '/motorized-blinds-for-high-windows',
});

export default function MotorizedBlindsHighWindowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQJsonLd
        items={[
          {
            question: 'How do motorized blinds work for high windows?',
            answer: 'Motorized blinds use a quiet motor built into the headrail that raises and lowers the blinds with the push of a button. They can be controlled via remote control, smartphone app, wall switch, or voice commands through smart home devices like Alexa or Google Home.'
          },
          {
            question: 'What power options are available for motorized blinds?',
            answer: 'We offer three power options: hardwired (connected to your home electrical), rechargeable battery (lasts 6-12 months per charge), and solar-powered panels. Battery and solar options are perfect for retrofitting existing windows without electrical work.'
          },
          {
            question: 'Can I install motorized blinds myself?',
            answer: 'Yes! Our motorized blinds come with easy-to-follow installation instructions. Battery-powered options require no electrical work. However, for hardwired installations or very high windows, we recommend our professional installation service.'
          },
          {
            question: 'How much do motorized blinds for high windows cost?',
            answer: 'Motorized blinds typically start at $150-300 per window depending on size and style. For high windows, we recommend roller shades or cellular shades with motorization, which offer the best value. We offer free quotes for custom sizing.'
          }
        ]}
      />
      {children}
    </>
  );
}
