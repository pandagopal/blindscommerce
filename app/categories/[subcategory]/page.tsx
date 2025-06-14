import { notFound } from 'next/navigation';
import styles from '../../styles/explore.module.css';

const subcategoryData: Record<string, { name: string; description: string }> = {
  'wood-blinds': {
    name: 'Wood Blinds',
    description: 'Classic and elegant, wood blinds bring warmth and natural beauty to any room.',
  },
  'faux-wood-blinds': {
    name: 'Faux Wood Blinds',
    description: 'Durable and moisture-resistant, faux wood blinds are perfect for kitchens and bathrooms.',
  },
  'mini-blinds': {
    name: 'Mini Blinds',
    description: 'Affordable and versatile, mini blinds are a great choice for any window.',
  },
  'vertical-blinds': {
    name: 'Vertical Blinds',
    description: 'Ideal for large windows and sliding doors, vertical blinds offer easy light control.',
  },
  'vinyl-blinds': {
    name: 'Vinyl Blinds',
    description: 'Easy to clean and maintain, vinyl blinds are a practical window covering solution.',
  },
  'fabric-blinds': {
    name: 'Fabric Blinds',
    description: 'Soft and stylish, fabric blinds add a touch of luxury to your home.',
  },
  'commercial-blinds': {
    name: 'Commercial Blinds',
    description: 'Designed for offices and businesses, commercial blinds are functional and durable.',
  },
  'motorized-blinds': {
    name: 'Motorized Blinds',
    description: 'Enjoy convenience and modern living with motorized blinds you can control remotely.',
  },
  'cellular-shades': {
    name: 'Cellular Shades',
    description: 'Energy-efficient and insulating, cellular shades help regulate room temperature.',
  },
  'roller-shades': {
    name: 'Roller Shades',
    description: 'Simple and sleek, roller shades are easy to use and fit any decor.',
  },
  'solar-shades': {
    name: 'Solar Shades',
    description: 'Block UV rays and reduce glare while preserving your view with solar shades.',
  },
  'bamboo-woven-wood-shades': {
    name: 'Bamboo / Woven Wood Shades',
    description: 'Bring nature indoors with eco-friendly bamboo and woven wood shades.',
  },
  'roman-shades': {
    name: 'Roman Shades',
    description: 'Elegant and timeless, roman shades add sophistication to any space.',
  },
  'sheer-shades': {
    name: 'Sheer Shades',
    description: 'Diffuse light beautifully with soft, sheer shades.',
  },
  'zebra-shades': {
    name: 'Zebra Shades',
    description: 'Modern and versatile, zebra shades offer adjustable light control.',
  },
  'pleated-shades': {
    name: 'Pleated Shades',
    description: 'Add texture and style to your windows with pleated shades.',
  },
  'outdoor-shades': {
    name: 'Outdoor Shades',
    description: 'Enjoy your outdoor spaces with shades designed for patios and porches.',
  },
  'motorized-shades': {
    name: 'Motorized Shades',
    description: 'Control your shades with the touch of a button for ultimate convenience.',
  },
  'vertical-cellular-shades': {
    name: 'Vertical Cellular Shades',
    description: 'Combine energy efficiency with vertical operation for large windows.',
  },
  'sheer-vertical-shades': {
    name: 'Sheer Vertical Shades',
    description: 'Soft vertical vanes for elegant light diffusion.',
  },
  'panel-track-blinds': {
    name: 'Panel Track Blinds',
    description: 'Perfect for wide windows and sliding doors, panel tracks are modern and functional.',
  },
  'vertical-blind-alternatives': {
    name: 'Vertical Blind Alternatives',
    description: 'Explore alternative solutions for vertical window coverings.',
  },
  'custom-draperies': {
    name: 'Custom Draperies',
    description: 'Tailored to your style, custom draperies elevate any room.',
  },
  'drapery-hardware': {
    name: 'Drapery Hardware',
    description: 'Find the perfect hardware to complement your draperies.',
  },
  'valances': {
    name: 'Valances',
    description: 'Add a decorative touch to your windows with valances.',
  },
  'wood-shutters': {
    name: 'Wood Shutters',
    description: 'Classic wood shutters for timeless beauty and privacy.',
  },
  'faux-wood-shutters': {
    name: 'Faux Wood Shutters',
    description: 'Durable and stylish, faux wood shutters are great for any room.',
  },
  'skylight-shades': {
    name: 'Skylight Shades',
    description: 'Control light and heat from above with skylight shades.',
  },
  'arches': {
    name: 'Arches',
    description: 'Specialty window coverings for arched windows.',
  },
  'angle-tops': {
    name: 'Angle Tops',
    description: 'Custom solutions for angled windows.',
  },
  'cornices': {
    name: 'Cornices',
    description: 'Decorative cornices for a finished window look.',
  },
  'parts-accessories': {
    name: 'Parts & Accessories',
    description: 'Find all the parts and accessories you need for your window treatments.',
  },
};

export default async function SubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  const { subcategory } = await params;
  const data = subcategoryData[subcategory];
  if (!data) return notFound();
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{data.name}</h1>
      <img src="/images/placeholder.jpg" alt={data.name} style={{ maxWidth: '400px', width: '100%', borderRadius: '12px', margin: '2rem auto' }} />
      <p style={{ fontSize: '1.2rem', marginTop: '1.5rem', textAlign: 'center' }}>{data.description}</p>
    </div>
  );
} 