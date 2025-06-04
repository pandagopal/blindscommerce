import styles from '../styles/explore.module.css';

const brands = [
  'Acadia Living',
  'Blinds.com',
  'Blinds Avenue',
  'Bali',
  'Coolaroo',
  'EZ-A',
  'Eve MotionBlinds',
  'Levolor',
  'MyBlinds',
  'Oasis by Insolroll',
  'SimplyEco',
  'SouthSeas',
  'Veneta',
  'Blinds.com Commercial',
];

export default function BrandsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Brands</h1>
      <div className={styles.grid}>
        {brands.map((brand) => (
          <div key={brand} className={styles.category}>
            <h2>{brand}</h2>
          </div>
        ))}
      </div>
    </div>
  );
} 