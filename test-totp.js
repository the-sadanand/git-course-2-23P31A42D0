import { totp } from "otplib";
import fs from "fs";

// Read the hex seed
const hexSeed = fs.readFileSync("./data/seed.txt", "utf8").trim();
console.log("Hex seed:", hexSeed);

// Convert hex to base32
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
console.log("Base32 seed:", base32Seed);
console.log("Base32 length:", base32Seed.length);

try {
  const code = totp.generate(base32Seed);
  console.log("Generated TOTP code:", code);
} catch (err) {
  console.error("Error generating TOTP:", err.message);
  console.error("Stack:", err.stack);
}
