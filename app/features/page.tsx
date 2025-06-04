import styles from '../styles/explore.module.css';

const features = [
  'Blackout',
  'Cordless',
  'Odd-Shaped Windows',
  'Top Down Bottom Up',
  'Motorized',
  'Outdoor',
  'Eco',
  'Expedited Production',
  'Insulating',
  'Door Blinds',
];

export default function FeaturesPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Features</h1>
      <div className={styles.grid}>
        {features.map((feature) => (
          <div key={feature} className={styles.category}>
            <h2>{feature}</h2>
          </div>
        ))}
      </div>
    </div>
  );
} 