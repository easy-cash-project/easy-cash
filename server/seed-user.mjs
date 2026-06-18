import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../drizzle/schema.ts";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  
  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { casing: 'snake_case' });
  
  console.log("Creating admin user...");
  try {
    const result = await db.insert(users).values({
      openId: 'BlackSupport',
      name: 'BlackSupport',
      email: 'admin@easycash.club',
      password: 'FGGHJKJoouy58&%^*98785',
      role: 'admin',
      status: 'active',
      loginMethod: 'password',
    }).returning();
    
    console.log("✓ Admin user created successfully!");
    console.log("User:", result[0]);
  } catch (e) {
    console.log("⚠ Error creating user:", e.message);
  }
  
  await client.end();
  process.exit(0);
}

seed();
