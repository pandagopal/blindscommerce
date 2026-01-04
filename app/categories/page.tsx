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

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">All Categories</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-white rounded-xl shadow-lg border border-red-100 p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">{cat.name}</h2>
            <ul className="space-y-2">
              {cat.subcategories.map((sub) => (
                <li key={sub}>
                  <Link 
                    href={`/categories/${sub.toLowerCase().replace(/\s|\//g, '-')}`}
                    className="text-gray-700 hover:text-primary-red font-medium transition-all"
                  >
                    {sub}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
} 