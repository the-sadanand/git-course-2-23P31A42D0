import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { totp } from "otplib";

const app = express();
app.use(express.json());

const PRIVATE_KEY_PATH = "./student_private.pem";
const SEED_FILE_PATH = "./data/seed.txt";

//  Endpoint 1: POST /decrypt-seed >>>>>>>>>>>>.
app.post("/decrypt-seed", (req, res) => {
  try {
    const { encrypted_seed } = req.body;

    if (!encrypted_seed) {
      return res.status(400).json({ error: "Missing encrypted_seed" });
    }

    // 1. Load private key >>>>>
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");

    // 2. Base64 decode >>>>>>>
    const encryptedBuffer = Buffer.from(encrypted_seed, "base64");

    // 3. Decrypt using RSA-OAEP SHA256 >>>>>>>>
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedBuffer
    );

    const seedHex = decrypted.toString("utf8").trim();

    // 4. Validate 64-character hex >>>>>>>
    if (!/^[a-fA-F0-9]{64}$/.test(seedHex)) {
      return res.status(400).json({ error: "Invalid hex seed format" });
    }

    // 5. Ensure directory and write to storage >>>>>>>>
    ensureDataDir();
    fs.writeFileSync(SEED_FILE_PATH, seedHex);

    return res.json({ status: "ok" });

  } catch (err) {
    return res.status(500).json({ error: "Decryption failed" });
  }
});

// ---------- Helper: Load seed ----------
function getStoredSeed() {
  if (!fs.existsSync(SEED_FILE_PATH)) return null;
  return fs.readFileSync(SEED_FILE_PATH, "utf8").trim();
}

// ---------- Convert Hex → Base32 ----------
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

// ---------- Ensure /data directory exists ----------
function ensureDataDir() {
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data", { recursive: true });
  }
}

// ---------- Endpoint 2: GET /generate-2fa ----------
app.get("/generate-2fa", (req, res) => {
  try {
    // Step 1: Get stored hex seed
    const hexSeed = getStoredSeed();
    if (!hexSeed) {
      return res.status(400).json({ error: "Seed not decrypted yet. Call /decrypt-seed first." });
    }

    // Step 2: Convert hex to base32 (required for TOTP)
    const base32Seed = hexToBase32(hexSeed);

    // Step 3: Generate TOTP code
    const code = totp.generate(base32Seed);

    // Step 4: Calculate time remaining (in seconds until next 30-sec window)
    const now = Math.floor(Date.now() / 1000);
    const valid_for = 30 - (now % 30);

    return res.json({ code, valid_for });

  } catch (err) {
    console.error("Error in /generate-2fa:", err.message);
    return res.status(500).json({ error: "Failed to generate TOTP", details: err.message });
  }
});

// ---------- Endpoint 3: POST /verify-2fa ----------
app.post("/verify-2fa", (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const hexSeed = getStoredSeed();
    if (!hexSeed) return res.status(400).json({ error: "Seed not decrypted yet. Call /decrypt-seed first." });

    const base32Seed = hexToBase32(hexSeed);

    // Verify with ±1 time window (allows slight time drift)
    const valid = totp.check(code, base32Seed, { window: 1 });

    return res.json({ valid });

  } catch (err) {
    console.error("Error in /verify-2fa:", err.message);
    return res.status(500).json({ error: "Verification error", details: err.message });
  }
});

// ---------- Start Server ----------
app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
