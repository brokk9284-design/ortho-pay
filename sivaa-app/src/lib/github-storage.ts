const GITHUB_TOKEN = process.env.GITHUB_STORAGE_TOKEN || "";
const GITHUB_OWNER = process.env.GITHUB_STORAGE_OWNER || "";
const GITHUB_REPO = process.env.GITHUB_STORAGE_REPO || "sivaa-storage";
const GITHUB_BRANCH = process.env.GITHUB_STORAGE_BRANCH || "main";

const GITHUB_API = "https://api.github.com";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadResult {
  path: string;
  url: string;
  sha: string;
  size: number;
}

interface GitHubContentResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  encoding: string;
  content: string;
  download_url: string;
  type: string;
}

function validatePath(path: string): void {
  if (path.includes("..") || path.includes("//") || path.startsWith("/")) {
    throw new Error("Invalid path: path traversal detected");
  }
}

function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
}

function validateExtension(filename: string): void {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`);
  }
}

function sanitizeTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "jpg";
}

function buildPath(userId: string, category: "kyc" | "receipts" | "profile" | "chat-files", filename: string): string {
  return `storage/${userId}/${category}/${filename}`;
}

async function githubRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, { ...options, headers });
}

export async function uploadFile(
  userId: string,
  category: "kyc" | "receipts" | "profile" | "chat-files",
  filename: string,
  fileBuffer: Buffer,
  customName?: string
): Promise<UploadResult> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER) {
    throw new Error("GitHub storage not configured. Set GITHUB_STORAGE_TOKEN and GITHUB_STORAGE_OWNER.");
  }

  validateFileSize(fileBuffer.length);
  validateExtension(filename);

  const ext = getExtension(filename);
  const finalName = customName || `${sanitizeTimestamp()}.${ext}`;
  const path = buildPath(userId, category, finalName);
  validatePath(path);

  const base64Content = fileBuffer.toString("base64");

  const body = JSON.stringify({
    message: `Upload ${category}/${finalName} for user ${userId}`,
    content: base64Content,
    branch: GITHUB_BRANCH,
  });

  const response = await githubRequest(path, {
    method: "PUT",
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub upload failed: ${response.status} ${error}`);
  }

  const data = await response.json() as { content: GitHubContentResponse };
  return {
    path: data.content.path,
    url: data.content.download_url,
    sha: data.content.sha,
    size: data.content.size,
  };
}

export async function getFile(path: string): Promise<{ content: Buffer; metadata: GitHubContentResponse }> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER) {
    throw new Error("GitHub storage not configured.");
  }

  validatePath(path);

  const response = await githubRequest(path, {
    method: "GET",
    headers: { "Accept": "application/vnd.github.raw+json" },
  });

  if (!response.ok) {
    throw new Error(`GitHub file not found: ${response.status}`);
  }

  const metadataResponse = await githubRequest(path, {
    method: "GET",
  });

  const metadata = await metadataResponse.json() as GitHubContentResponse;
  const content = Buffer.from(await response.arrayBuffer());

  return { content, metadata };
}

export async function getFileUrl(path: string): Promise<string> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER) {
    throw new Error("GitHub storage not configured.");
  }

  validatePath(path);

  const response = await githubRequest(path, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`GitHub file not found: ${response.status}`);
  }

  const data = await response.json() as GitHubContentResponse;
  return data.download_url;
}

export async function listFiles(userId: string, category?: "kyc" | "receipts" | "profile" | "chat-files"): Promise<GitHubContentResponse[]> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER) {
    throw new Error("GitHub storage not configured.");
  }

  const basePath = category
    ? `storage/${userId}/${category}`
    : `storage/${userId}`;
  validatePath(basePath);

  const response = await githubRequest(basePath, {
    method: "GET",
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`GitHub list failed: ${response.status}`);
  }

  const data = await response.json() as GitHubContentResponse[];
  return Array.isArray(data) ? data : [];
}

export async function deleteFile(path: string): Promise<void> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER) {
    throw new Error("GitHub storage not configured.");
  }

  validatePath(path);

  const getResponse = await githubRequest(path, {
    method: "GET",
  });

  if (!getResponse.ok) {
    throw new Error(`File not found: ${getResponse.status}`);
  }

  const fileData = await getResponse.json() as GitHubContentResponse;

  const body = JSON.stringify({
    message: `Delete ${path}`,
    sha: fileData.sha,
    branch: GITHUB_BRANCH,
  });

  const response = await githubRequest(path, {
    method: "DELETE",
    body,
  });

  if (!response.ok) {
    throw new Error(`GitHub delete failed: ${response.status}`);
  }
}

export function buildReceiptFilename(paymentReference: string, originalFilename: string): string {
  const ext = getExtension(originalFilename);
  return `${paymentReference}_${sanitizeTimestamp()}.${ext}`;
}

export function buildKycFilename(documentType: string, originalFilename: string): string {
  const ext = getExtension(originalFilename);
  return `${documentType}_${sanitizeTimestamp()}.${ext}`;
}

export function buildStoragePath(userId: string, category: "kyc" | "receipts" | "profile" | "chat-files", filename: string): string {
  return buildPath(userId, category, filename);
}

export function isStorageConfigured(): boolean {
  return !!(GITHUB_TOKEN && GITHUB_OWNER);
}
