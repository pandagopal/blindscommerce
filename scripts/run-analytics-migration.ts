import { readFileSync } from 'fs';
import { getPool } from '@/lib/db';

async function runAnalyticsMigration() {
  try {
    console.log('🚀 Starting analytics tables migration...');
    
    const pool = await getPool();
    
    // Read the migration SQL file
    const migrationSQL = readFileSync('./migrations/add_analytics_tables.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toUpperCase().includes('SELECT ')) {
        // Skip SELECT statements (like success messages)
        continue;
      }
      
      try {
        await pool.execute(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error: any) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log(`⚠️  Table already exists - skipping statement ${i + 1}`);
          continue;
        }
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        throw error;
      }
    }
    
    // Verify tables were created
    const [tables] = await pool.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'blindscommerce' 
      AND table_name LIKE 'analytics_%'
    `);
    
    console.log('📊 Analytics tables created:');
    (tables as any[]).forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    console.log('🎉 Analytics migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runAnalyticsMigration().then(() => {
  console.log('✨ Migration script finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});