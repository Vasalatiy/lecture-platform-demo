export type HealthStatus = {
  status: string;
};

export type UserProfile = {
  id: string;
  clerkId: string;
  email: string;
  role: "admin" | "viewer";
  createdAt: string;
};

export type Lecture = {
  id: string;
  title: string;
  description: string;
  lecturer: string;
  category: string;
  videoUrl: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt?: string;
  uploadedBy?: string;
};

export type LectureInput = {
  title: string;
  description: string;
  lecturer: string;
  category: string;
  videoUrl?: string;
  status: "draft" | "published";
};

export type StreamUrlResponse = {
  url: string;
};

export type VideoStats = {
  total: number;
  published: number;
  draft: number;
  categories: string[];
};

export type UploadUrlRequest = {
  name: string;
  size: number;
  contentType: string;
};

export type UploadUrlResponse = {
  uploadURL: string;
  objectPath: string;
};

export type AuthTokenGetter = () => Promise<string | null> | string | null;

let authTokenGetter: AuthTokenGetter | null = null;

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  authTokenGetter = getter;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requestJson<T>(path: `/api/${string}`, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (authTokenGetter && !headers.has("Authorization")) {
    const token = await authTokenGetter();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

async function requestNoContent(path: `/api/${string}`, init?: RequestInit): Promise<void> {
  const headers = new Headers(init?.headers);

  if (authTokenGetter && !headers.has("Authorization")) {
    const token = await authTokenGetter();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }
}

function jsonInit(method: string, data: unknown): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown; message?: unknown };
    const message = typeof data.error === "string" ? data.error : data.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  } catch {
    // Fall through to a generic status message.
  }

  return `Request failed: ${response.status}`;
}

export function getHealth(): Promise<HealthStatus> {
  return requestJson<HealthStatus>("/api/healthz");
}

export function getMe(): Promise<UserProfile> {
  return requestJson<UserProfile>("/api/auth/me");
}

export function getLectures(): Promise<Lecture[]> {
  return requestJson<Lecture[]>("/api/videos");
}

export function getLecture(id: string): Promise<Lecture> {
  return requestJson<Lecture>(`/api/videos/${encodeURIComponent(id)}` as `/api/${string}`);
}

export function getLectureStreamUrl(id: string): Promise<StreamUrlResponse> {
  return requestJson<StreamUrlResponse>(
    `/api/videos/${encodeURIComponent(id)}/stream-url` as `/api/${string}`,
  );
}

export function getVideoStats(): Promise<VideoStats> {
  return requestJson<VideoStats>("/api/videos/stats");
}

export function createLecture(data: LectureInput): Promise<Lecture> {
  return requestJson<Lecture>("/api/videos", jsonInit("POST", data));
}

export function updateLecture(id: string, data: LectureInput): Promise<Lecture> {
  return requestJson<Lecture>(`/api/videos/${encodeURIComponent(id)}` as `/api/${string}`, jsonInit("PUT", data));
}

export function updateLectureStatus(id: string, status: Lecture["status"]): Promise<Lecture> {
  return requestJson<Lecture>(
    `/api/videos/${encodeURIComponent(id)}/status` as `/api/${string}`,
    jsonInit("PATCH", { status }),
  );
}

export function deleteLecture(id: string): Promise<void> {
  return requestNoContent(`/api/videos/${encodeURIComponent(id)}` as `/api/${string}`, { method: "DELETE" });
}

export function requestUploadUrl(data: UploadUrlRequest): Promise<UploadUrlResponse> {
  return requestJson<UploadUrlResponse>("/api/storage/uploads/request-url", jsonInit("POST", data));
}
