const mongoose = require('mongoose');
const User = require('../backend/models/User');
const Attendance = require('../backend/models/Attendance');
require('dotenv').config();
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// ✅ Fix indexes first
async function fixIndexes() {
  try {
    console.log('🔧 Fixing attendance collection indexes...');
    
    // Drop all existing indexes except _id
    const indexes = await Attendance.collection.getIndexes();
    console.log('📋 Current indexes:', Object.keys(indexes));
    
    for (const indexName of Object.keys(indexes)) {
      if (indexName !== '_id_') {
        try {
          await Attendance.collection.dropIndex(indexName);
          console.log(`🗑️ Dropped index: ${indexName}`);
        } catch (error) {
          console.log(`⚠️ Could not drop index ${indexName}: ${error.message}`);
        }
      }
    }
    
    // Create the correct compound unique index
    await Attendance.collection.createIndex(
      { employeeId: 1, date: 1 }, 
      { unique: true, name: 'employeeId_date_unique' }
    );
    console.log('✅ Created compound unique index: employeeId + date');
    
    // Create other helpful indexes
    await Attendance.collection.createIndex({ date: 1 }, { name: 'date_1' });
    await Attendance.collection.createIndex({ employeeId: 1 }, { name: 'employeeId_1' });
    await Attendance.collection.createIndex({ status: 1 }, { name: 'status_1' });
    
    console.log('✅ All indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    throw error;
  }
}

// ✅ Enhanced migration with better duplicate handling
async function migrateAttendanceData() {
  try {
    console.log('🚀 Starting attendance data migration...');

    // Clear existing attendance data (optional safety measure)
    const existingCount = await Attendance.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing attendance records`);
      console.log('🧹 Clearing existing data to ensure clean migration...');
      await Attendance.deleteMany({});
      console.log('✅ Existing data cleared');
    }

    const usersWithAttendance = await User.find({
      'attendance.0': { $exists: true }
    }).select('First\ name Last\ name Employee\ Code attendance');

    console.log(`📊 Found ${usersWithAttendance.length} users with attendance data`);

    let totalMigrated = 0;
    let duplicatesSkipped = 0;
    let errors = 0;

    // Prepare bulk operations for better performance
    const bulkOps = [];

    for (const user of usersWithAttendance) {
      console.log(`👤 Processing user: ${user['First name']} ${user['Last name']} (${user['Employee Code']})`);
      
      for (const att of user.attendance) {
        try {
          // Normalize date to ensure consistency
          const normalizedDate = new Date(att.date);
          normalizedDate.setUTCHours(0, 0, 0, 0);

          // Calculate total hours and status
          let totalHours = 0;
          let status = 'Absent';
          
          if (att.checkIn && att.checkOut) {
            const hours = (new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60 * 60);
            totalHours = parseFloat(hours.toFixed(2));
            status = hours >= 8.45 ? 'Present' : hours >= 4 ? 'Half Day' : 'Absent';
          } else if (att.checkIn) {
            status = 'Present';
          }

          // Prepare bulk operation
          bulkOps.push({
            insertOne: {
              document: {
                employeeId: user._id,
                date: normalizedDate,
                checkIn: att.checkIn,
                checkOut: att.checkOut || null,
                checkInLocation: att.checkInLocation || {},
                checkOutLocation: att.checkOutLocation || {},
                totalHours: totalHours,
                status: status,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          });

        } catch (error) {
          console.error(`❌ Error preparing record for ${user['First name']} on ${att.date}:`, error.message);
          errors++;
        }
      }
    }

    // Execute bulk operations in batches
    const batchSize = 100;
    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const batch = bulkOps.slice(i, i + batchSize);
      try {
        const result = await Attendance.collection.bulkWrite(batch, { ordered: false });
        totalMigrated += result.insertedCount;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${result.insertedCount} records migrated`);
      } catch (error) {
        if (error.code === 11000) {
          // Handle duplicate key errors
          const duplicateCount = error.result?.writeErrors?.length || 0;
          duplicatesSkipped += duplicateCount;
          totalMigrated += (batch.length - duplicateCount);
          console.log(`⚠️ Batch ${Math.floor(i/batchSize) + 1}: ${duplicateCount} duplicates skipped`);
        } else {
          console.error(`❌ Batch error:`, error.message);
          errors++;
        }
      }
    }

    console.log('\n🎉 Migration Summary:');
    console.log(`✅ Total records migrated: ${totalMigrated}`);
    console.log(`⚠️ Duplicates skipped: ${duplicatesSkipped}`);
    console.log(`❌ Errors encountered: ${errors}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// ✅ Enhanced verification
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');

    const usersWithAttendance = await User.find({
      'attendance.0': { $exists: true }
    }).select('First\ name Last\ name Employee\ Code attendance');

    let allMatched = true;

    for (const user of usersWithAttendance) {
      const originalCount = user.attendance.length;
      const migratedCount = await Attendance.countDocuments({
        employeeId: user._id
      });

      const status = originalCount === migratedCount ? '✅' : '⚠️';
      console.log(`${status} ${user['First name']} ${user['Last name']}: Original ${originalCount}, Migrated ${migratedCount}`);

      if (originalCount !== migratedCount) {
        allMatched = false;
        
        // Show sample of missing records for debugging
        const migratedDates = await Attendance.find({ employeeId: user._id }).distinct('date');
        const originalDates = user.attendance.map(att => att.date.toISOString().split('T')[0]);
        const migratedDateStrings = migratedDates.map(date => date.toISOString().split('T')[0]);
        
        const missing = originalDates.filter(date => !migratedDateStrings.includes(date));
        if (missing.length > 0) {
          console.log(`   Missing dates: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
        }
      }
    }

    const totalOriginal = await User.aggregate([
      { $match: { 'attendance.0': { $exists: true } } },
      { $project: { attendanceCount: { $size: '$attendance' } } },
      { $group: { _id: null, total: { $sum: '$attendanceCount' } } }
    ]);

    const totalMigrated = await Attendance.countDocuments();

    console.log(`\n📊 Total Original Records: ${totalOriginal[0]?.total || 0}`);
    console.log(`📊 Total Migrated Records: ${totalMigrated}`);
    console.log(`📊 Migration Success Rate: ${((totalMigrated / (totalOriginal[0]?.total || 1)) * 100).toFixed(1)}%`);

    return allMatched;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// ✅ Main execution with proper error handling
async function main() {
  await connectDB();
  
  try {
    // Step 1: Fix indexes
    await fixIndexes();
    
    // Step 2: Migrate data
    await migrateAttendanceData();
    
    // Step 3: Verify migration
    const success = await verifyMigration();
    
    if (success) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration completed with some mismatches. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  main();
}

module.exports = { migrateAttendanceData, verifyMigration, fixIndexes };