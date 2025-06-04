import styles from '../styles/explore.module.css';

const rooms = [
  'Living Room',
  'Home Office',
  'Kitchen',
  'Bathroom',
  'Bedroom',
  'Home Theater',
  'Patio & Porches',
  'RV',
  'Nursery',
];

export default function RoomsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Rooms</h1>
      <div className={styles.grid}>
        {rooms.map((room) => (
          <div key={room} className={styles.category}>
            <h2>{room}</h2>
          </div>
        ))}
      </div>
    </div>
  );
} 