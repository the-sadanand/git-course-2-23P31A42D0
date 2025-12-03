#!/usr/bin/env node

import fs from "fs";
import crypto from "crypto";
import { totp } from "otplib";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to seed file (works both in Docker /data/ and locally ./data/)
const SEED_PATH = process.env.SEED_PATH || path.join(__dirname, "../data/seed.txt");
const LOG_TIMEZONE = "UTC";

try {
  if (!fs.existsSync(SEED_PATH)) {
    console.error(`[ERROR] Seed file not found: ${SEED_PATH}`);
    process.exit(1);
  }

  const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();

  // Convert Hex → Base32 (proper RFC 4648 base32)
  function hexToBase32(hex) {
    const bytes = Buffer.from(hex, "hex");
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let base32 = "";
    let bits = 0;
    let value = 0;

    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        base32 += base32Chars[(value >> bits) & 31];
      }
    }

    if (bits > 0) {
      base32 += base32Chars[(value << (5 - bits)) & 31];
    }

    return base32;
  }

  const base32Seed = hexToBase32(hexSeed);

  const code = totp.generate(base32Seed);

  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

  console.log(`${timestamp} - 2FA Code: ${code}`);

} catch (err) {
  console.error(`[CRON ERROR] ${err.message}`);
  process.exit(1);
}
