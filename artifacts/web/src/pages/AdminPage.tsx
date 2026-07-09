import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileVideo, RefreshCw, Save, Trash2, UploadCloud } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  createLecture,
  deleteLecture,
  requestUploadUrl,
  updateLectureStatus,
  type Lecture,
  type LectureInput,
} from "../api/client";
import { AppShell } from "../components/AppShell";
import { HealthBadge } from "../components/HealthBadge";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLectures } from "../hooks/useLectures";
import { useVideoStats } from "../hooks/useVideoStats";
import { formatLectureDate } from "../lib/format";

const emptyForm: LectureInput = {
  title: "",
  description: "",
  lecturer: "",
  category: "",
  videoUrl: "",
  status: "draft",
};

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function AdminPage() {
  const user = useCurrentUser();
  const isAdmin = user.data?.role === "admin";
  const stats = useVideoStats(isAdmin);
  const lectures = useLectures();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LectureInput>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminLectures = useMemo(() => lectures.data?.lectures ?? [], [lectures.data]);

  async function refreshAdminData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["lectures"] }),
      queryClient.invalidateQueries({ queryKey: ["video-stats"] }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmed = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        lecturer: form.lecturer.trim(),
        category: form.category.trim(),
        videoUrl: form.videoUrl?.trim() ?? "",
      };

      if (!trimmed.title || !trimmed.lecturer || !trimmed.category) {
        throw new Error("Title, lecturer, and category are required.");
      }

      let videoUrl = trimmed.videoUrl;

      if (file) {
        const upload = await requestUploadUrl({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        });

        await uploadFile(upload.uploadURL, file);
        videoUrl = upload.objectPath;
      }

      return createLecture({ ...trimmed, videoUrl });
    },
    async onSuccess(created) {
      setMessage(
        created.videoUrl
          ? `Created "${created.title}" with uploaded video.`
          : `Created metadata-only lecture "${created.title}". Add video storage later before playback.`,
      );
      setError(null);
      setForm(emptyForm);
      setFile(null);
      await refreshAdminData();
    },
    onError(err) {
      setMessage(null);
      setError(messageFrom(err));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lecture["status"] }) => updateLectureStatus(id, status),
    async onSuccess() {
      setError(null);
      await refreshAdminData();
    },
    onError(err) {
      setError(messageFrom(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLecture,
    async onSuccess() {
      setMessage("Lecture deleted.");
      setError(null);
      await refreshAdminData();
    },
    onError(err) {
      setError(messageFrom(err));
    },
  });

  function updateField<K extends keyof LectureInput>(key: K, value: LectureInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    createMutation.mutate();
  }

  if (user.isLoading) {
    return (
      <AppShell eyebrow="Admin workspace" title="Checking access">
        <div className="empty-state">Loading your backend profile from `/api/auth/me`...</div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell eyebrow="Admin workspace" title="Admin access required">
        <section className="admin-summary">
          <HealthBadge />
          <div>
            <strong>{user.data ? "Viewer account" : "Backend profile unavailable"}</strong>
            <p>
              {user.data
                ? "Your authenticated backend profile is not an admin. The API also enforces this on protected admin routes."
                : "The browser is signed in with Clerk, but `/api/auth/me` did not return a usable profile yet."}
            </p>
          </div>
        </section>
        {user.error ? (
          <div className="notice warning">
            `/api/auth/me` returned an error. Confirm the Clerk token is accepted by the API server.
          </div>
        ) : null}
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Admin workspace" title="Lecture dashboard">
      <section className="admin-summary">
        <HealthBadge />
        <div>
          <strong>Backend admin session detected</strong>
          <p>Create lecture records in Neon. File upload uses local development storage or configured object storage.</p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Video statistics">
        <div>
          <strong>{stats.data?.total ?? "-"}</strong>
          <span>Total</span>
        </div>
        <div>
          <strong>{stats.data?.published ?? "-"}</strong>
          <span>Published</span>
        </div>
        <div>
          <strong>{stats.data?.draft ?? "-"}</strong>
          <span>Drafts</span>
        </div>
      </section>

      <form className="admin-form" onSubmit={onSubmit}>
        <div className="notice">
          Metadata-only creation is supported. Select a video file when the API server has local storage or object storage configured.
        </div>
        <label className="field">
          <span>Title</span>
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Lecture title"
            required
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Short lecture description"
            rows={4}
          />
        </label>
        <label className="field">
          <span>Lecturer</span>
          <input
            value={form.lecturer}
            onChange={(event) => updateField("lecturer", event.target.value)}
            placeholder="Lecturer name"
            required
          />
        </label>
        <label className="field">
          <span>Category</span>
          <input
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            placeholder="Course or category"
            required
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as Lecture["status"])}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="field">
          <span>Existing video object path</span>
          <input
            value={form.videoUrl}
            onChange={(event) => updateField("videoUrl", event.target.value)}
            placeholder="/objects/optional-existing-video-path"
          />
        </label>
        <label className={file ? "upload-dropzone active" : "upload-dropzone"}>
          <FileVideo aria-hidden="true" size={30} />
          <span>{file ? file.name : "Optional video file"}</span>
          <small>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB selected`
              : "If storage is not configured, leave this empty and create metadata only."}
          </small>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        {message ? <div className="notice success">{message}</div> : null}
        {error ? <div className="notice warning">{error}</div> : null}

        <div className="button-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => void refreshAdminData()}
            disabled={createMutation.isPending}
          >
            <RefreshCw aria-hidden="true" size={18} />
            Refresh
          </button>
          <button className="button primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <Save aria-hidden="true" size={18} />
                Save lecture
              </>
            )}
          </button>
        </div>
      </form>

      <section className="admin-list" aria-label="Existing lectures">
        <div className="section-heading">
          <h2>Existing lectures</h2>
          <span>{lectures.data?.source === "api" ? "Live database" : "Fallback data"}</span>
        </div>
        {lectures.isLoading ? (
          <div className="empty-state">Loading lectures...</div>
        ) : adminLectures.length === 0 ? (
          <div className="empty-state">No lecture records yet.</div>
        ) : (
          adminLectures.map((lecture) => (
            <article className="admin-lecture" key={lecture.id}>
              <div>
                <p className="category-label">{lecture.category}</p>
                <h3>{lecture.title}</h3>
                <p>{lecture.lecturer} · {formatLectureDate(lecture.createdAt)}</p>
                <p>{lecture.videoUrl ? lecture.videoUrl : "Metadata only: no video file configured"}</p>
              </div>
              <div className="admin-actions">
                <span className={lecture.status === "published" ? "status published" : "status draft"}>
                  {lecture.status}
                </span>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    statusMutation.mutate({
                      id: lecture.id,
                      status: lecture.status === "published" ? "draft" : "published",
                    })
                  }
                  disabled={statusMutation.isPending}
                >
                  {lecture.status === "published" ? "Move to draft" : "Publish"}
                </button>
                <button
                  className="button danger"
                  type="button"
                  onClick={() => deleteMutation.mutate(lecture.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}

async function uploadFile(uploadURL: string, file: File): Promise<void> {
  const response = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  if (!response.ok) {
    throw new Error(`Video upload failed: ${response.status}`);
  }
}
