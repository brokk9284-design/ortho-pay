# SIVAA GitHub Object Storage Strategy

## Overview
SIVAA uses GitHub as an object storage backend for user-uploaded files (KYC documents, payment receipts). Files are stored in a dedicated GitHub repository using the GitHub Contents API. Each user gets their own folder structure.

## Repository Setup
1. Create a **private** GitHub repository named `sivaa-storage`
2. Generate a GitHub Personal Access Token (PAT) with `repo` scope
3. Set environment variables:
   - `GITHUB_STORAGE_TOKEN` — The PAT
   - `GITHUB_STORAGE_OWNER` — GitHub username or org
   - `GITHUB_STORAGE_REPO` — Repository name (default: `sivaa-storage`)
   - `GITHUB_STORAGE_BRANCH` — Branch name (default: `main`)

## Folder Structure
```
sivaa-storage/
├── README.md
├── storage/
│   ├── {user_id}/
│   │   ├── kyc/
│   │   │   ├── passport_{timestamp}.jpg
│   │   │   ├── drivers_license_{timestamp}.png
│   │   │   ├── utility_bill_{timestamp}.pdf
│   │   │   └── bank_statement_{timestamp}.pdf
│   │   ├── receipts/
│   │   │   ├── {payment_reference}_{timestamp}.jpg
│   │   │   └── {payment_reference}_{timestamp}.png
│   │   └── profile/
│   │       └── avatar_{timestamp}.jpg
│   └── _index.json
```

## File Naming Convention
- **KYC**: `{document_type}_{ISO_timestamp}.{ext}` (e.g., `passport_2025-07-23T12-00-00Z.jpg`)
- **Receipts**: `{payment_reference}_{ISO_timestamp}.{ext}` (e.g., `SIVAA-ABC-12345_2025-07-23T12-00-00Z.png`)
- **Avatars**: `avatar_{ISO_timestamp}.{ext}`

## Access Control
- **Upload**: Only authenticated users can upload their own files. Server-side API routes handle the GitHub API call using the PAT.
- **Read (User)**: Users can read files from their own folder via API routes that proxy GitHub raw content.
- **Read (Admin)**: Admins can read any user's files via admin API routes.
- **Delete**: Only admins can delete files (via admin API routes).

## API Routes
| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/v1/storage/upload` | POST | User | Upload file to user's folder |
| `/api/v1/storage/file` | GET | User/Admin | Retrieve file content (scoped) |
| `/api/v1/storage/list` | GET | User/Admin | List files in a folder (scoped) |
| `/api/v1/kyc` | POST | User | Upload KYC doc (auto-stores on GitHub) |
| `/api/v1/receipts` | POST | User | Upload payment receipt |
| `/api/v1/receipts` | GET | User/Admin | List receipts for a payment |

## Database Integration
- `kyc_documents.file_url` → stores GitHub path: `storage/{user_id}/kyc/{filename}`
- `payment_verifications.receipt_url` → stores GitHub path: `storage/{user_id}/receipts/{filename}`
- API routes resolve these paths to GitHub raw URLs for display

## Security
- GitHub PAT is **never** exposed to the client
- All file operations go through authenticated API routes
- File paths are validated server-side to prevent path traversal
- File size limit: 10MB per file
- Allowed file types: jpg, jpeg, png, pdf, webp
- Repository must be **private**

## Migration Path
When scaling beyond GitHub's limits (100MB per file, soft 1GB repo limit):
1. Migrate to Supabase Storage or AWS S3
2. Update only the storage utility library (`src/lib/github-storage.ts`)
3. Database paths remain the same — only the resolution logic changes
