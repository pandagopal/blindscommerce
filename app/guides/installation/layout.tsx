import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { HowToJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Install Blinds - DIY Installation Guide',
  description: 'Complete guide to installing blinds yourself. Learn professional installation techniques for all blind types including inside mount and outside mount installations.',
  keywords: [
    'how to install blinds',
    'blinds installation guide',
    'DIY blinds installation',
    'mount blinds',
    'hang blinds',
    'install window shades',
  ],
  path: '/guides/installation',
});

export default function InstallationGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HowToJsonLd
        name="How to Install Window Blinds"
        description="Professional step-by-step guide to installing window blinds and shades in your home."
        totalTime="PT30M"
        steps={[
          {
            name: "Unpack and Inspect",
            text: "Carefully unpack your blinds and check all parts against the packing list. Ensure no damage occurred during shipping."
          },
          {
            name: "Mark Bracket Positions",
            text: "Use a level to mark where your brackets will go. For inside mount, place brackets near the front of the window frame."
          },
          {
            name: "Install Mounting Brackets",
            text: "Pre-drill holes if needed, then screw the brackets into place. Make sure they're level and secure."
          },
          {
            name: "Mount the Headrail",
            text: "Snap or slide the headrail into the mounted brackets according to your bracket type."
          },
          {
            name: "Test Operation",
            text: "Test raising, lowering, and tilting functions to ensure smooth operation before finishing."
          }
        ]}
      />
      {children}
    </>
  );
}
