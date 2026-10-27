import "dotenv/config";

export type SeedPasswords = { admin: string; manager: string; sales: string };

function read(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is missing. Add it to the crm-backend .env file.`);
  }
  if (value.length < 10) {
    throw new Error(`${name} must be at least 10 characters long.`);
  }
  return value;
}

export function loadSeedPasswords(): SeedPasswords {
  const passwords: SeedPasswords = {
    admin: read("SEED_ADMIN_PASSWORD"),
    manager: read("SEED_MANAGER_PASSWORD"),
    sales: read("SEED_SALES_PASSWORD"),
  };

  if (new Set(Object.values(passwords)).size !== 3) {
    throw new Error("The admin, manager and sales passwords must all be different.");
  }
  return passwords;
}