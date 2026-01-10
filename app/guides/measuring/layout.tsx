import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { HowToJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Measure Windows for Blinds - Complete Guide',
  description: 'Step-by-step guide to measuring windows for custom blinds and shades. Learn inside mount vs outside mount measuring, common mistakes to avoid, and get professional tips.',
  keywords: [
    'how to measure blinds',
    'window measuring guide',
    'measure for blinds',
    'inside mount measuring',
    'outside mount measuring',
    'blind measurement',
  ],
  path: '/guides/measuring',
});

export default function MeasuringGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HowToJsonLd
        name="How to Measure Windows for Blinds"
        description="Learn how to accurately measure your windows for custom blinds and shades with our comprehensive step-by-step guide."
        totalTime="PT15M"
        steps={[
          {
            name: "Gather Your Tools",
            text: "Get a steel measuring tape, pencil, and paper. Avoid using cloth tapes as they can stretch."
          },
          {
            name: "Decide Mount Type",
            text: "Choose between inside mount (inside the window frame) or outside mount (on the wall or trim outside the frame)."
          },
          {
            name: "Measure Width",
            text: "For inside mount, measure the width at the top, middle, and bottom. Use the narrowest measurement."
          },
          {
            name: "Measure Height",
            text: "For inside mount, measure the height on the left, center, and right. Use the longest measurement."
          },
          {
            name: "Double Check Measurements",
            text: "Measure each window at least twice to ensure accuracy. Write down all measurements clearly."
          }
        ]}
      />
      {children}
    </>
  );
}
