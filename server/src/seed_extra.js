const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  console.error("CRITICAL: MONGODB_URI or MONGO_URI env variable is missing!");
  process.exit(1);
}

async function seedExtra() {
  try {
    console.log("Connecting to MongoDB database for extra collections seeding...");
    await mongoose.connect(uri, { dbName: 'goicuocviettel' });
    console.log("Connected successfully to goicuocviettel!");

    const db = mongoose.connection.db;
    const Decimal128 = mongoose.mongo.Decimal128 || mongoose.Types.Decimal128;

    // 1. Fetch valid package_ids from goi_cuoc collection
    console.log("Fetching packages to link subscriptions...");
    const packages = await db.collection('goi_cuoc').find({}).toArray();
    const packageIds = packages
      .map(p => p.package_id)
      .filter(id => id !== undefined && id !== null);

    if (packageIds.length === 0) {
      console.warn("WARNING: No package_id found in goi_cuoc! Defaulting package_id to 1.");
      packageIds.push(1);
    } else {
      console.log(`Found ${packageIds.length} packages in DB. Valid package_id range: ${JSON.stringify(packageIds.slice(0, 10))}...`);
    }

    // 2. Clear existing collections
    console.log("Cleaning accounts, user_subscriptions, and deposits collections...");
    await db.collection('accounts').deleteMany({});
    await db.collection('user_subscriptions').deleteMany({});
    await db.collection('deposits').deleteMany({});

    // 3. Seed accounts (2 customers, 1 admin)
    console.log("Seeding accounts collection...");
    const accountsData = [
      {
        user_id: 1,
        fullname: "Nguyễn Văn A",
        phone_number: "0987654321",
        password: "password123",
        balance: 150000,
        role: "user",
        subscription_type: "tra_truoc",
        is_loyal_customer: false,
        status: "active",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 2,
        fullname: "Trần Thị B",
        phone_number: "0962345678",
        password: "password123",
        balance: 500000,
        role: "user",
        subscription_type: "tra_sau",
        is_loyal_customer: true,
        status: "active",
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 3,
        fullname: "Lê Văn Quản Trị",
        phone_number: "0970000001",
        password: "admin123",
        balance: 0,
        role: "admin",
        subscription_type: "tra_truoc",
        is_loyal_customer: true,
        status: "active",
        created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    await db.collection('accounts').insertMany(accountsData);
    console.log("Successfully seeded 3 accounts (2 user, 1 admin).");

    // 4. Seed 15 Subscriptions
    console.log("Seeding user_subscriptions collection...");
    const subscriptionsData = [];
    for (let i = 1; i <= 15; i++) {
      const userId = (i % 2) === 1 ? 1 : 2;
      const packageId = packageIds[i % packageIds.length] || 1;
      const daysAgo = (15 - i) * 2;
      const registeredDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const expiredDate = new Date(registeredDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      subscriptionsData.push({
        userId: userId,
        packageId: packageId,
        registeredAt: registeredDate,
        activatedAt: registeredDate,
        startedAt: registeredDate,
        expiresAt: expiredDate,
        status: expiredDate.getTime() < Date.now() ? "EXPIRED" : "ACTIVE",
        autoRenew: i % 3 !== 0,
        cycle: 'MONTH'
      });
    }
    await db.collection('user_subscriptions').insertMany(subscriptionsData);
    console.log("Successfully seeded 15 user_subscriptions.");

    // 5. Seed 15 Deposits
    console.log("Seeding deposits collection...");
    const networks = ['BSC', 'ETH', 'TRON'];
    const statuses = ['success', 'success', 'success', 'pending', 'failed'];
    const depositsData = [];

    for (let i = 1; i <= 15; i++) {
      const userId = (i % 2) === 1 ? 1 : 2;
      const network = networks[i % networks.length];
      const status = statuses[i % statuses.length];
      const amountVal = (0.005 * (i * 11)).toFixed(4); // e.g. 0.055, 0.11 etc
      // Approx rate: 1 unit crypto = 80,000,000 VND
      const fiatEquivalentVal = (parseFloat(amountVal) * 80000000).toFixed(2);

      depositsData.push({
        deposit_id: i,
        user_id: userId,
        amount: Decimal128.fromString(amountVal),
        fiat_equivalent: Decimal128.fromString(fiatEquivalentVal),
        tx_hash: `0x${Buffer.from(`tx_hash_seed_${i}_${Date.now()}`).toString('hex').padEnd(64, 'e').substring(0, 64)}`,
        network: network,
        status: status,
        created_at: new Date(Date.now() - (15 - i) * 3 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    await db.collection('deposits').insertMany(depositsData);
    console.log("Successfully seeded 15 deposits.");

    console.log("All collections seeded successfully!");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (err) {
    console.error("Database seeding error:", err);
    process.exit(1);
  }
}

seedExtra();
