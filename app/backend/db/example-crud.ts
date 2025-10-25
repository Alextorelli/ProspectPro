import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { users } from "./schema/users";

async function main() {
  const john: typeof users.$inferInsert = {
    name: "John",
    age: 30,
    email: "john@example.com",
  };

  await db.insert(users).values(john);
  console.log("Inserted user");

  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers);

  await db.update(users).set({ age: 31 }).where(eq(users.email, john.email));
  console.log("Updated user");

  await db.delete(users).where(eq(users.email, john.email));
  console.log("Deleted user");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
