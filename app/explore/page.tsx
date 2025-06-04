import Link from 'next/link';
import styles from '../styles/explore.module.css';

const categories = [
  {
    name: 'Blinds',
    subcategories: [
      'Wood Blinds',
      'Faux Wood Blinds',
      'Mini Blinds',
      'Vertical Blinds',
      'Vinyl Blinds',
      'Fabric Blinds',
      'Commercial Blinds',
      'Motorized Blinds',
    ],
  },
  {
    name: 'Shades',
    subcategories: [
      'Cellular Shades',
      'Roller Shades',
      'Solar Shades',
      'Bamboo / Woven Wood Shades',
      'Roman Shades',
      'Sheer Shades',
      'Zebra Shades',
      'Pleated Shades',
      'Outdoor Shades',
      'Motorized Shades',
    ],
  },
  {
    name: 'Verticals',
    subcategories: [
      'Vertical Blinds',
      'Vertical Cellular Shades',
      'Sheer Vertical Shades',
      'Panel Track Blinds',
      'Vertical Blind Alternatives',
    ],
  },
  {
    name: 'Draperies',
    subcategories: [
      'Custom Draperies',
      'Drapery Hardware',
      'Valances',
    ],
  },
  {
    name: 'Shutters',
    subcategories: [
      'Wood Shutters',
      'Faux Wood Shutters',
    ],
  },
  {
    name: 'Specialty Products',
    subcategories: [
      'Skylight Shades',
      'Arches',
      'Angle Tops',
      'Cornices',
      'Parts & Accessories',
    ],
  },
  {
    name: 'Outdoor',
    subcategories: [
      'Outdoor Shades',
    ],
  },
];

export default function ExplorePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Explore All Categories</h1>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <div key={cat.name} className={styles.category}>
            <h2>{cat.name}</h2>
            <ul>
              {cat.subcategories.map((sub) => (
                <li key={sub}>
                  <Link href={`/categories/${sub.toLowerCase().replace(/\s|\//g, '-')}`}>{sub}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
} 