#!/usr/bin/env node
/**
 * generate_commit_proof.js
 *
 * Steps:
 * 1) Get latest commit hash (40-char hex)
 * 2) Sign ASCII commit hash with student_private.pem using RSA-PSS (SHA-256)
 *    - padding: PSS
 *    - mgf: MGF1(SHA-256)
 *    - saltLength: maximum (PSS.MAX_LENGTH)
 * 3) Encrypt signature bytes with instructor_public.pem using RSA/OAEP (SHA-256)
 * 4) Base64 encode encrypted signature and print
 *
 * Node: no external deps required (uses built-in crypto)
 */

import { execSync } from "child_process";
import fs from "fs";
import crypto from "crypto";
import path from "path";

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (e) {
    console.error("ERROR: failed to run command:", cmd);
    console.error(e.message || e);
    process.exit(2);
  }
}

function loadPem(filePath, what) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ${what} not found at path: ${filePath}`);
    process.exit(3);
  }
  return fs.readFileSync(filePath, "utf8");
}

function signMessage(message, privateKeyPem) {
  // message: string (ASCII / UTF-8)
  const msgBuf = Buffer.from(message, "utf8");

  // Choose max salt length constant (compat across Node versions)
  const saltLen =
    crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN ??
    crypto.constants.RSA_PSS_SALTLEN_MAX ??
    crypto.constants.RSA_PSS_SALTLEN_AUTO; // fallback (may be undefined)

  // Use crypto.sign with 'sha256' digest and PSS options
  const signature = crypto.sign("sha256", msgBuf, {
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: saltLen,
  });

  return signature; // Buffer
}

function encryptWithPublicKey(dataBuf, publicKeyPem) {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    dataBuf
  );
  return encrypted; // Buffer
}

function main() {
  // 1) Ensure git has at least one commit and get latest hash
  const commitHash = runCmd("git log -1 --format=%H");
  if (!/^[0-9a-f]{40}$/i.test(commitHash)) {
    console.error("ERROR: Commit hash not found or unexpected:", commitHash);
    process.exit(1);
  }
  console.log("Commit Hash:", commitHash);

  // 2) Load student private key
  const studentPrivPath = path.resolve("student_private.pem");
  const studentPrivPem = loadPem(studentPrivPath, "student_private.pem");

  // 3) Sign commit hash (ASCII bytes)
  const signature = signMessage(commitHash, studentPrivPem);

  // 4) Load instructor public key
  const instructorPubPath = path.resolve("instructor_public.pem");
  const instructorPubPem = loadPem(instructorPubPath, "instructor_public.pem");

  // 5) Encrypt signature with instructor public key (OAEP-SHA256)
  const encrypted = encryptWithPublicKey(signature, instructorPubPem);

  // 6) Base64 encode encrypted signature
  const encryptedB64 = encrypted.toString("base64");

  // Output
  console.log("\nEncrypted Signature (Base64):");
  console.log(encryptedB64);
  console.log("\n--- Output (copy this) ---");
  console.log(JSON.stringify({ commit: commitHash, proof: encryptedB64 }));
}

main();
