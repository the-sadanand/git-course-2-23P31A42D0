# PKI-Based 2FA Microservice

This repository contains a secure PKI-based 2FA microservice implemented with Node.js and Docker. The service supports generating and verifying TOTP codes using an encrypted seed, along with cron-based logging of codes.  

---

## Project Overview

The microservice implements:

1. **RSA key pair generation**  
2. **Encrypted seed decryption**  
3. **TOTP generation & verification** (SHA-1, 6 digits, 30-second period)  
4. **Cron job to log TOTP codes every minute**  
5. **Dockerized multi-stage build**  
6. **Docker Compose configuration with persistent volumes**  
7. **Commit proof generation** using RSA-PSS and RSA-OAEP  

---

## GitHub Repository

- URL: [https://github.com/the-sadanand/git-course-2-23P31A42D0](https://github.com/the-sadanand/git-course-2-23P31A42D0)

---

## Submission Information

| Field | Value |
|-------|-------|
| **Commit Hash** | `REPLACE_WITH_YOUR_COMMIT_HASH` |
| **Encrypted Commit Signature (Base64)** | `REPLACE_WITH_YOUR_BASE64_SIGNATURE` |
| **Student Public Key (single line for API)** | `"-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuR7r/in1NQZNFnmw+x8k\nWeLroP9MuOnmiguX4IHaVuiRoewuLV1LNM3ShVKxxtjsEzyythXRZWCRgI/XB25p\nAWTzzuR52s5EhvbF+ZpyUiohyMDEG5I2DP8cqaIkRQ8wrJ1trU47qU8oOcWBVVKH\nMNoRTixi4u4/aaoAfPYMUKqpjh7tLhuilM01JxyPNW07p/WX/hAV4KTIqpA56SLb\nBgP9aZIs5BCiQ1o6i9K+B5j4xbvsXzNIH+7qqYsBoj1v9teh06MQEBAPDcpAhc1+\n8rfWb/2LaEExOITYUNKeY71vZBsVJnE7RgVkrUVqDJhWya7IHwFKsx+8LUgLdMuF\nhE6+hGmf7FFsvx5hmImQjouZbgOdJmVAUV40NycNnUl5C1JwWKK7S+XnVo9wv08k\nTQkPGGUB7kkhMKgtfa5jdeDpkYFTdr9lodVyK5IRY9+CxpZA9NNkYdBtkCEyYfJ/\nNjrjGw966Ow5JWRgDvuvyRyxDXLmIENJh4owUhBoZX1AJapCWSVworezHif41kPJ\nh4Eu/2h20f8tuz2XOjnz8EkKRriii4Vsvo++ybEmojjwmqNuvHny1W2PhJynuGrD\ndaM8qubEpXl762VIaqChgF3CE2+c8ll3PorbTIUK0vwQAR3JcXhYf6/DM7Mk4u3uT\nFW64Tb3K2vF9mL1HMnxkC7UCAwEAAQ==\n-----END PUBLIC KEY-----"` |
| **Encrypted Seed (Base64, single line)** | `REPLACE_WITH_ENCRYPTED_SEED` |
| **Docker Image URL** | `docker.io/the-sadanand/pki-2fa:latest` |

---

## How to Build and Run Locally

### Build Docker Image

```bash
docker build -t pki-2fa .
