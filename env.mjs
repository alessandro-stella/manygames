import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().min(1000).max(65535).default(8000),
  SITE_URL: z
    .string()
    .regex(/^https?:\/\//, { message: "Must start with http:// o https://" })
    .default(`http://localhost:${process.env.PORT || 8000}`),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");

  parsed.error.issues.forEach((issue) => {
    const fieldName = issue.path.join(".");
    console.error(`  - ${fieldName}: ${issue.message}`);
  });

  process.exit(1);
}

export const env = parsed.data;
