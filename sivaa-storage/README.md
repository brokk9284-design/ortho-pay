# SIVAA Storage

This repository (or folder) serves as the object storage backend for SIVAA.

## Structure
```
storage/
├── {user_id}/
│   ├── kyc/          — KYC verification documents
│   ├── receipts/     — Payment receipt uploads
│   └── profile/      — Profile avatars
```

## Important
- Do not manually edit files in the `storage/` directory
- All file operations are handled by the SIVAA API
- Files are managed via the GitHub Contents API
- See `/STORAGE_STRATEGY.md` for full documentation
