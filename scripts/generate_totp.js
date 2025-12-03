#!/usr/bin/env node

/**
 * generate_totp.js
 * - Reads /data/seed.txt (hex, 64 chars)
 * - Converts hex -> base32 suitable for otplib
 * - Generates current TOTP (SHA1, 30s, 6 digits)
 * - Logs: "YYYY-MM-DD HH:MM:SS - 2FA code: XXXXXX" to stdout (UTC)
 * - On error: prints meaningful message to stderr and exits non-zero
 */

const fs = require('fs');
const path = require('path');
const { authenticator } = require('otplib');

const SEED_PATH = '/data/seed.txt';

function utcNowFormatted() {
  const d = new Date();
  // Use toISOString and trim milliseconds and 'Z'
  // to get "YYYY-MM-DDTHH:MM:SSZ" then convert T->space and remove Z
  const iso = d.toISOString(); // "2025-12-03T14:30:00.000Z"
  return iso.replace('T', ' ').replace(/\.\d+Z$/, '');
}

function hexToBase32(hex) {
  // convert hex -> Buffer -> base32 using otplib helper
  const buf = Buffer.from(hex, 'hex');
  // otplib's authenticator.encode expects a Buffer or string
  return authenticator.encode(buf);
}

(async function main() {
  try {
    if (!fs.existsSync(SEED_PATH)) {
      console.error('ERROR: seed file not found at /data/seed.txt');
      process.exit(2);
    }

    const hex = fs.readFileSync(SEED_PATH, 'utf8').trim();

    if (!/^[a-fA-F0-9]{64}$/.test(hex)) {
      console.error('ERROR: Invalid seed format in /data/seed.txt (expected 64 hex chars)');
      process.exit(3);
    }

    const base32 = hexToBase32(hex);

    // Configure otplib (defaults are SHA1, step 30, 6 digits)
    authenticator.options = { step: 30, digits: 6, algorithm: 'SHA1' };

    const code = authenticator.generate(base32);

    const ts = utcNowFormatted();
    // Output desired log format to stdout
    console.log(`${ts} - 2FA code: ${code}`);

    // Exit success
    process.exit(0);
  } catch (err) {
    // Print error to stderr (docker will capture in container logs)
    console.error('ERROR: Failed to generate TOTP:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
