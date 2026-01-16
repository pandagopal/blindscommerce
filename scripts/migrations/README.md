# Database Migrations

This directory contains all database migration scripts for BlindsCommerce.

---

## Hybrid Database Design Migration (v2.0) - 2026-01-15

### 📁 Files

#### **PRODUCTION_HYBRID_MIGRATION.sql** ⭐
**USE THIS FOR PRODUCTION**

The complete, tested migration script that:
- Migrates vendor_info to use user_id as PRIMARY KEY
- Updates all 29 foreign key references
- Adds security fields to users, vendor_info, sales_staff, products
- Creates audit_log, admin_tasks, archived_vendor_data tables
- Creates views and stored procedures
- Includes verification and automatic backups

**How to Use:**
```bash
# 1. Backup first
mysqldump -u username -p database > backup.sql

# 2. Run migration
mysql -u username -p database < PRODUCTION_HYBRID_MIGRATION.sql
```

---

#### **rollback-hybrid-migration.sql**
Rollback script if migration fails or needs to be reverted.

⚠️ **WARNING:** Only use if migration fails. Cannot rollback after production runs with new structure.

**How to Use:**
```bash
mysql -u username -p database < rollback-hybrid-migration.sql
```

---

#### **MIGRATION_SUMMARY.md**
Complete documentation including:
- What the migration does
- Pre-deployment checklist
- Verification queries
- Post-migration steps
- Troubleshooting guide

**Read this before running migration on production!**

---

## Other Migrations

### cache-settings.sql
Migration for cache settings table (unrelated to hybrid design).

### product-approval-system.sql
Migration for product approval workflow (unrelated to hybrid design).

---

## Migration Process

1. ✅ **Read Documentation**
   - Review `MIGRATION_SUMMARY.md`
   - Review `/docs/IMPLEMENTATION_GUIDE.md`

2. ✅ **Backup Database**
   ```bash
   mysqldump -u username -p database > backup_$(date +%Y%m%d).sql
   ```

3. ✅ **Run Migration**
   ```bash
   mysql -u username -p database < PRODUCTION_HYBRID_MIGRATION.sql
   ```

4. ✅ **Verify Success**
   - Check for `✅ MIGRATION COMPLETED SUCCESSFULLY!`
   - Run verification queries from MIGRATION_SUMMARY.md
   - Test application

5. ✅ **Monitor**
   - Check application logs
   - Monitor database performance
   - Verify no foreign key errors

---

## Support

- **Documentation:** `/docs/DATABASE_STRUCTURE.md`
- **Implementation Guide:** `/docs/IMPLEMENTATION_GUIDE.md`
- **Application Guide:** `/docs/CLAUDE.md`

---

**Last Updated:** 2026-01-15
**Migration Version:** 2.0 (Hybrid Design with Security Layer)
