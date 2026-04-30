import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:9000/api";

// ── Status config matching your existing design ───────────
const STATUS_CONFIG = {
    completed: {
        color: "#22c55e",
        bg: "rgba(34,197,94,0.1)",
        border: "rgba(34,197,94,0.25)",
        label: "✓ Completed",
        dot: "#22c55e",
    },
    processing: {
        color: "#6366f1",
        bg: "rgba(99,102,241,0.1)",
        border: "rgba(99,102,241,0.3)",
        label: "⟳ Processing",
        dot: "#6366f1",
    },
    pending: {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
        border: "rgba(245,158,11,0.25)",
        label: "◎ Pending",
        dot: "#f59e0b",
    },
    failed: {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.1)",
        border: "rgba(239,68,68,0.25)",
        label: "✕ Failed",
        dot: "#ef4444",
    },
};

// ── Relative time helper ──────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return "—";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Generate Video Modal ──────────────────────────────────
function GenerateModal({ onClose, onGenerated }) {
    const [script, setScript] = useState("");
    const [language, setLanguage] = useState("hi");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const EXAMPLE = `Scene 1: Introduction (0:00 - 1:00)
Hindi Voiceover: "Namaste dosto! Aaj hum JavaScript seekhenge."
Visual Prompt (Paste into Luma/Kling):
Cinematic shot of a futuristic glass house being built. 4k, high detail.

Scene 2: Variables (1:00 - 2:30)
Hindi Voiceover: "Sabse pehle aate hain Variables."
Visual Prompt (Paste into Luma/Kling):
A 3D animation of a warehouse with boxes labeled LET and CONST.`;

    const handleGenerate = async () => {
        if (!script.trim()) {
            setError("Please enter your script first.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`${API_BASE}/generate-video`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ script, language }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || "Failed to start generation.");
                return;
            }
            onGenerated(data);
            onClose();
        } catch (e) {
            setError(
                "Cannot connect to server. Make sure Laravel is running on port 8000.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                background: "var(--c-overlay)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                animation: "fadeIn 0.2s ease",
                padding: 20,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 640,
                    background: "var(--c-bg-panel)",
                    border: "1px solid var(--c-border)",
                    borderRadius: 16,
                    padding: 32,
                    animation: "slideUp 0.25s ease",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 24,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                color: "#6366f1",
                                letterSpacing: 2,
                                marginBottom: 6,
                                textTransform: "uppercase",
                                fontFamily: "Syne, sans-serif",
                            }}
                        >
                            AI VIDEO STUDIO
                        </div>
                        <h2
                            style={{
                                fontFamily: "Syne, sans-serif",
                                fontSize: 22,
                                fontWeight: 800,
                                color: "var(--c-text-primary)",
                            }}
                        >
                            Generate New Video
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "1px solid var(--c-border)",
                            color: "var(--c-text-muted)",
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 16,
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = "#ef4444";
                            e.target.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = "#1e2a3a";
                            e.target.style.color = "var(--c-text-muted)";
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Language */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 14,
                    }}
                >
                    <label style={{ fontSize: 13, color: "var(--c-text-muted)" }}>
                        Voiceover Language:
                    </label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{
                            background: "var(--c-bg-input)",
                            border: "1px solid var(--c-border)",
                            color: "var(--c-text-primary)",
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        <option value="hi">🇮🇳 Hindi</option>
                        <option value="en">🇬🇧 English</option>
                    </select>
                </div>

                {/* Script textarea */}
                <div style={{ marginBottom: 16 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <label style={{ fontSize: 13, color: "var(--c-text-muted)" }}>
                            Your Script
                        </label>
                        <button
                            onClick={() => setScript(EXAMPLE)}
                            style={{
                                background: "transparent",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-muted)",
                                padding: "4px 12px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                            }}
                        >
                            Load Example
                        </button>
                    </div>
                    <textarea
                        value={script}
                        onChange={(e) => {
                            setScript(e.target.value);
                            setError("");
                        }}
                        placeholder={`Scene 1: Title (0:00 - 1:00)\nHindi Voiceover: "Your voiceover..."\nVisual Prompt:\nDescribe visuals here...`}
                        rows={10}
                        style={{
                            width: "100%",
                            background: "var(--c-bg-input)",
                            border: "1px solid var(--c-border)",
                            borderRadius: 10,
                            color: "var(--c-text-primary)",
                            padding: 16,
                            fontFamily: "'DM Mono', 'Courier New', monospace",
                            fontSize: 12,
                            lineHeight: 1.7,
                            resize: "vertical",
                            outline: "none",
                            transition: "border-color 0.2s",
                            boxSizing: "border-box",
                        }}
                        onFocus={(e) =>
                            (e.target.style.borderColor = "#6366f1")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
                    />
                    <div
                        style={{
                            fontSize: 11,
                            color: "var(--c-text-dim)",
                            marginTop: 6,
                            textAlign: "right",
                        }}
                    >
                        {script.length} characters
                    </div>
                </div>

                {/* Info chips */}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 20,
                    }}
                >
                    {[
                        "🆓 100% Free",
                        "🎙️ Hindi Voice",
                        "🎬 Auto Video",
                        "⏱️ ~20 min/video",
                    ].map((chip, i) => (
                        <span
                            key={i}
                            style={{
                                background: "rgba(99,102,241,0.1)",
                                border: "1px solid rgba(99,102,241,0.2)",
                                color: "#a5b4fc",
                                padding: "4px 12px",
                                borderRadius: 20,
                                fontSize: 12,
                            }}
                        >
                            {chip}
                        </span>
                    ))}
                </div>

                {error && (
                    <div
                        style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#fca5a5",
                            padding: "12px 16px",
                            borderRadius: 8,
                            fontSize: 13,
                            marginBottom: 16,
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}

                {/* Generate button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !script.trim()}
                    style={{
                        width: "100%",
                        padding: "14px",
                        background:
                            loading || !script.trim()
                                ? "#1e2a3a"
                                : "linear-gradient(135deg, #6366f1, #ec4899)",
                        border: "none",
                        borderRadius: 10,
                        color: loading || !script.trim() ? "#64748b" : "white",
                        fontFamily: "Syne, sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor:
                            script.trim() && !loading
                                ? "pointer"
                                : "not-allowed",
                        transition: "opacity 0.2s",
                    }}
                >
                    {loading
                        ? "⏳ Starting generation..."
                        : "🚀 Generate Video"}
                </button>
            </div>
        </div>
    );
}

// ── Video Card ────────────────────────────────────────────
function VideoCard({ video, onDelete }) {
    const cfg = STATUS_CONFIG[video.status] ?? STATUS_CONFIG.pending;
    const isProcessing = ["processing", "pending"].includes(video.status);

    return (
        <div
            style={{
                background: "#111827",
                border: `1px solid ${isProcessing ? cfg.border : "#1e2a3a"}`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "all 0.2s",
                position: "relative",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = cfg.border;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 30px ${cfg.color}18`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isProcessing
                    ? cfg.border
                    : "#1e2a3a";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Thumbnail / Preview area */}
            <div
                style={{
                    height: 150,
                    position: "relative",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #0e1422, #0d1117)",
                    borderBottom: "1px solid #1e2a3a",
                }}
            >
                {/* Shimmer for processing */}
                {isProcessing && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(90deg, transparent 0%, ${cfg.color}12 50%, transparent 100%)`,
                            animation: "shimmer 2s infinite",
                        }}
                    />
                )}

                {/* Video player if completed */}
                {video.status === "completed" && video.final_video_url ? (
                    <video
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                        src={`http://localhost:9000${video.final_video_url}`}
                        muted
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => {
                            e.target.pause();
                            e.target.currentTime = 0;
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                        }}
                    >
                        <div style={{ fontSize: 40 }}>
                            {video.status === "completed"
                                ? "🎬"
                                : video.status === "failed"
                                  ? "❌"
                                  : video.status === "processing"
                                    ? "⚙️"
                                    : "⏳"}
                        </div>
                        {isProcessing && (
                            <div
                                style={{
                                    fontSize: 12,
                                    color: cfg.color,
                                    fontFamily: "Syne, sans-serif",
                                }}
                            >
                                {video.current_step ?? "Processing..."}
                            </div>
                        )}
                    </div>
                )}

                {/* Scenes badge */}
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "rgba(8,12,20,0.85)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid #1e2a3a",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 11,
                        color: "#94a3b8",
                    }}
                >
                    {video.scenes_total ?? "—"} scenes
                </div>

                {/* Status badge */}
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 11,
                        color: cfg.color,
                        fontWeight: 600,
                    }}
                >
                    {cfg.label}
                </div>
            </div>

            {/* Progress bar for processing */}
            {isProcessing && (
                <div style={{ height: 3, background: "#0e1422" }}>
                    <div
                        style={{
                            height: "100%",
                            width: `${video.progress ?? 0}%`,
                            background: `linear-gradient(90deg, #6366f1, #ec4899)`,
                            transition: "width 0.5s ease",
                            animation: "pulse 1.5s ease-in-out infinite",
                        }}
                    />
                </div>
            )}

            {/* Card body */}
            <div style={{ padding: "16px 18px" }}>
                {/* Title */}
                <div
                    style={{
                        fontFamily: "Syne, sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#f1f5f9",
                        marginBottom: 6,
                    }}
                >
                    Video · {video.job_id?.slice(0, 8)}...
                </div>

                {/* Progress text */}
                {isProcessing && (
                    <div
                        style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginBottom: 10,
                        }}
                    >
                        Scene {video.scenes_done ?? 0} of{" "}
                        {video.scenes_total ?? "?"} — {video.progress ?? 0}%
                        complete
                    </div>
                )}

                {/* Meta row */}
                <div
                    style={{
                        display: "flex",
                        gap: 14,
                        marginBottom: 14,
                        flexWrap: "wrap",
                    }}
                >
                    {[
                        video.duration && `⏱ ${video.duration}`,
                        `🕒 ${timeAgo(video.created_at)}`,
                    ]
                        .filter(Boolean)
                        .map((meta, i) => (
                            <span
                                key={i}
                                style={{ fontSize: 12, color: "#64748b" }}
                            >
                                {meta}
                            </span>
                        ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                    {video.status === "completed" && video.final_video_url && (
                        <a
                            href={`http://localhost:9000${video.final_video_url}`}
                            download="generated-video.mp4"
                            style={{
                                flex: 1,
                                padding: "8px 0",
                                borderRadius: 8,
                                textAlign: "center",
                                background:
                                    "linear-gradient(135deg, #6366f1, #ec4899)",
                                color: "white",
                                textDecoration: "none",
                                fontFamily: "Syne, sans-serif",
                                fontWeight: 600,
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                            }}
                        >
                            ⬇️ Download
                        </a>
                    )}
                    <button
                        onClick={() => onDelete(video.job_id)}
                        style={{
                            flex: video.status === "completed" ? 0 : 1,
                            padding: "8px 14px",
                            borderRadius: 8,
                            background: "transparent",
                            border: "1px solid #1e2a3a",
                            color: "#64748b",
                            cursor: "pointer",
                            fontSize: 12,
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = "#ef4444";
                            e.target.style.color = "#ef4444";
                            e.target.style.background = "rgba(239,68,68,0.08)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = "#1e2a3a";
                            e.target.style.color = "#64748b";
                            e.target.style.background = "transparent";
                        }}
                    >
                        🗑 Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function PageProjects() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const pollRef = useRef(null);

    // ── Fetch all videos ──────────────────────────────────
    const fetchVideos = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`${API_BASE}/videos`, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = await res.json();
            if (data.success) setVideos(data.videos ?? []);
        } catch (e) {
            console.error("Failed to fetch videos:", e);
        } finally {
            setLoading(false);
        }
    };

    // ── Poll status for in-progress videos ───────────────
    const pollInProgress = async (videoList) => {
        const inProgress = videoList.filter((v) =>
            ["processing", "pending"].includes(v.status),
        );
        if (!inProgress.length) return;

        for (const video of inProgress) {
            try {
                const token = localStorage.getItem("auth_token");
                const res = await fetch(
                    `${API_BASE}/video-status/${video.job_id}`,
                    {
                        headers: {
                            Accept: "application/json",
                            ...(token
                                ? { Authorization: `Bearer ${token}` }
                                : {}),
                        },
                    },
                );
                const data = await res.json();
                if (data.success) {
                    setVideos((prev) =>
                        prev.map((v) =>
                            v.job_id === video.job_id ? { ...v, ...data } : v,
                        ),
                    );
                }
            } catch (e) {
                /* silent */
            }
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    // ── Auto-poll while any video is processing ───────────
    useEffect(() => {
        const hasActive = videos.some((v) =>
            ["processing", "pending"].includes(v.status),
        );
        if (hasActive) {
            pollRef.current = setInterval(() => pollInProgress(videos), 5000);
        } else {
            clearInterval(pollRef.current);
        }
        return () => clearInterval(pollRef.current);
    }, [videos]);

    const handleDelete = async (jobId) => {
        if (!confirm("Delete this video?")) return;
        try {
            const token = localStorage.getItem("auth_token");
            await fetch(`${API_BASE}/videos/${jobId}`, {
                method: "DELETE",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            setVideos((prev) => prev.filter((v) => v.job_id !== jobId));
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerated = (data) => {
        // Add new job to list immediately
        setVideos((prev) => [
            {
                job_id: data.job_id,
                status: "pending",
                scenes_total: data.scenes_found,
                scenes_done: 0,
                progress: 0,
                created_at: new Date().toISOString(),
            },
            ...prev,
        ]);
    };

    // ── Filter videos ─────────────────────────────────────
    const FILTERS = ["all", "completed", "processing", "pending", "failed"];
    const filtered =
        filter === "all" ? videos : videos.filter((v) => v.status === filter);

    // ── Stats ─────────────────────────────────────────────
    const stats = {
        total: videos.length,
        completed: videos.filter((v) => v.status === "completed").length,
        processing: videos.filter((v) =>
            ["processing", "pending"].includes(v.status),
        ).length,
        failed: videos.filter((v) => v.status === "failed").length,
    };

    return (
        <>
            <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>

            {showModal && (
                <GenerateModal
                    onClose={() => setShowModal(false)}
                    onGenerated={handleGenerated}
                />
            )}

            {/* Page header */}
            <div className="dash__page-header">
                <div>
                    <div
                        className="dash__page-eyebrow"
                        style={{ color: "#6366f1" }}
                    >
                        AI VIDEO STUDIO
                    </div>
                    <h1 className="dash__page-title">
                        MY<span style={{ color: "#6366f1" }}>_</span>VIDEOS
                    </h1>
                    <p className="dash__page-meta">
                        {stats.total} videos · {stats.processing} processing ·{" "}
                        {stats.completed} ready
                    </p>
                </div>
                <div className="dash__header-actions">
                    <button
                        className="dash__btn dash__btn--ghost"
                        onClick={fetchVideos}
                    >
                        ↻ Refresh
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            padding: "10px 22px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, #6366f1, #ec4899)",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            fontFamily: "Syne, sans-serif",
                            fontWeight: 700,
                            fontSize: 14,
                            transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
                        onMouseLeave={(e) => (e.target.style.opacity = "1")}
                    >
                        🚀 Generate Video
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    marginBottom: 24,
                }}
            >
                {[
                    {
                        label: "Total Videos",
                        value: stats.total,
                        color: "#f1f5f9",
                        bg: "rgba(241,245,249,0.05)",
                    },
                    {
                        label: "Completed",
                        value: stats.completed,
                        color: "#22c55e",
                        bg: "rgba(34,197,94,0.07)",
                    },
                    {
                        label: "Processing",
                        value: stats.processing,
                        color: "#6366f1",
                        bg: "rgba(99,102,241,0.07)",
                    },
                    {
                        label: "Failed",
                        value: stats.failed,
                        color: "#ef4444",
                        bg: "rgba(239,68,68,0.07)",
                    },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            background: s.bg,
                            border: "1px solid #1e2a3a",
                            borderRadius: 12,
                            padding: "16px 20px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                color: "#64748b",
                                letterSpacing: 1,
                                marginBottom: 8,
                                textTransform: "uppercase",
                                fontFamily: "Syne, sans-serif",
                            }}
                        >
                            {s.label}
                        </div>
                        <div
                            style={{
                                fontFamily: "Syne, sans-serif",
                                fontSize: 28,
                                fontWeight: 800,
                                color: s.color,
                            }}
                        >
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 24,
                    flexWrap: "wrap",
                }}
            >
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "7px 16px",
                            borderRadius: 8,
                            cursor: "pointer",
                            background:
                                filter === f
                                    ? "linear-gradient(135deg, #6366f1, #ec4899)"
                                    : "transparent",
                            border: `1px solid ${filter === f ? "transparent" : "#1e2a3a"}`,
                            color: filter === f ? "white" : "#64748b",
                            fontFamily: "Syne, sans-serif",
                            fontWeight: filter === f ? 700 : 400,
                            fontSize: 13,
                            transition: "all 0.15s",
                            textTransform: "capitalize",
                        }}
                        onMouseEnter={(e) => {
                            if (filter !== f) {
                                e.target.style.borderColor = "#6366f1";
                                e.target.style.color = "#a5b4fc";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (filter !== f) {
                                e.target.style.borderColor = "#1e2a3a";
                                e.target.style.color = "#64748b";
                            }
                        }}
                    >
                        {f === "all"
                            ? `All (${videos.length})`
                            : `${f.charAt(0).toUpperCase() + f.slice(1)} (${videos.filter((v) => v.status === f).length})`}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "40vh",
                        gap: 16,
                    }}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: "3px solid #1e2a3a",
                            borderTopColor: "#6366f1",
                            animation: "spin 0.8s linear infinite",
                        }}
                    />
                    <div
                        style={{
                            color: "#64748b",
                            fontFamily: "Syne, sans-serif",
                            fontSize: 14,
                        }}
                    >
                        Loading videos...
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : filtered.length === 0 ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "40vh",
                        gap: 16,
                    }}
                >
                    <span style={{ fontSize: 60 }}>🎬</span>
                    <div
                        style={{
                            fontFamily: "Syne, sans-serif",
                            fontSize: 20,
                            fontWeight: 800,
                            color: "#f1f5f9",
                        }}
                    >
                        {filter === "all"
                            ? "No videos yet"
                            : `No ${filter} videos`}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 14 }}>
                        {filter === "all"
                            ? "Generate your first AI video!"
                            : "Try a different filter"}
                    </div>
                    {filter === "all" && (
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                padding: "12px 28px",
                                borderRadius: 10,
                                background:
                                    "linear-gradient(135deg, #6366f1, #ec4899)",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                fontFamily: "Syne, sans-serif",
                                fontWeight: 700,
                                fontSize: 15,
                                marginTop: 8,
                            }}
                        >
                            🚀 Generate First Video
                        </button>
                    )}
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(290px, 1fr))",
                        gap: 18,
                    }}
                >
                    {filtered.map((video) => (
                        <VideoCard
                            key={video.job_id}
                            video={video}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
