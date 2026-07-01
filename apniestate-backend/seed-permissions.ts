import { seedPermissions } from "./src/modules/permissions/permissions.service";

async function run() {
  try {
    await seedPermissions();
    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
