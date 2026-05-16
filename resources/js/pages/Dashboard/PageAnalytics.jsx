// PageAnalytics.jsx  ── API version (Laravel backend)
import { useState, useEffect, useRef } from "react";

// ── API config ────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL || "") + "/api";

const api = async (method, path, body = null) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "API error");
    return data;
};

// ── Helpers ───────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return "—";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

const TAGS = [
    "JavaScript",
    "React",
    "CSS",
    "Python",
    "Laravel",
    "AI/ML",
    "Database",
    "DevOps",
    "Design",
    "Math",
    "Other",
];
const TAG_COLORS = {
    JavaScript: {
        color: "#f0c040",
        bg: "rgba(240,192,64,0.12)",
        border: "rgba(240,192,64,0.3)",
    },
    React: {
        color: "#61dafb",
        bg: "rgba(97,218,251,0.12)",
        border: "rgba(97,218,251,0.3)",
    },
    CSS: {
        color: "#ec4899",
        bg: "rgba(236,72,153,0.12)",
        border: "rgba(236,72,153,0.3)",
    },
    Python: {
        color: "#4caf7d",
        bg: "rgba(76,175,125,0.12)",
        border: "rgba(76,175,125,0.3)",
    },
    Laravel: {
        color: "#ff6b6b",
        bg: "rgba(255,107,107,0.12)",
        border: "rgba(255,107,107,0.3)",
    },
    "AI/ML": {
        color: "#a855f7",
        bg: "rgba(168,85,247,0.12)",
        border: "rgba(168,85,247,0.3)",
    },
    Database: {
        color: "#6366f1",
        bg: "rgba(99,102,241,0.12)",
        border: "rgba(99,102,241,0.3)",
    },
    DevOps: {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.12)",
        border: "rgba(245,158,11,0.3)",
    },
    Design: {
        color: "#e879f9",
        bg: "rgba(232,121,249,0.12)",
        border: "rgba(232,121,249,0.3)",
    },
    Math: {
        color: "#38bdf8",
        bg: "rgba(56,189,248,0.12)",
        border: "rgba(56,189,248,0.3)",
    },
    Other: {
        color: "var(--c-text-secondary)",
        bg: "rgba(148,163,184,0.12)",
        border: "rgba(148,163,184,0.3)",
    },
};
const DIFFICULTY = ["Beginner", "Intermediate", "Advanced"];
const DIFF_COLORS = {
    Beginner: {
        color: "#4caf7d",
        bg: "rgba(76,175,125,0.12)",
        border: "rgba(76,175,125,0.3)",
    },
    Intermediate: {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.12)",
        border: "rgba(245,158,11,0.3)",
    },
    Advanced: {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.12)",
        border: "rgba(239,68,68,0.3)",
    },
};

// ── Animated counter ──────────────────────────────────────
function Counter({ value, duration = 800 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.ceil(value / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= value) {
                setDisplay(value);
                clearInterval(timer);
            } else setDisplay(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <>{display}</>;
}

// ── Mini Sparkline ────────────────────────────────────────
function Sparkline({ data, color = "#6366f1", height = 40, width = 120 }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pts = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((v - min) / range) * (height - 6) - 3;
            return `${x},${y}`;
        })
        .join(" ");
    const area = `0,${height} ` + pts + ` ${width},${height}`;
    return (
        <svg width={width} height={height} style={{ overflow: "visible" }}>
            <defs>
                <linearGradient
                    id={`grad-${color.replace("#", "")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={area}
                fill={`url(#grad-${color.replace("#", "")})`}
            />
            <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {(() => {
                const last = pts.split(" ").pop().split(",");
                return <circle cx={last[0]} cy={last[1]} r="3" fill={color} />;
            })()}
        </svg>
    );
}

// ── Note Editor Modal (Textbook Edition) ──────────────────
function NoteEditor({ note, onSave, onClose }) {
    const [title, setTitle] = useState(note?.title ?? "");
    const [tag, setTag] = useState(note?.tag ?? "JavaScript");
    const [difficulty, setDifficulty] = useState(
        note?.difficulty ?? "Beginner",
    );
    const [revision, setRevision] = useState(note?.revision ?? false);
    const [pinned, setPinned] = useState(note?.pinned ?? false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);

    // const [pages, setPages] = useState(() => [
    //     { left: note?.content ?? "", right: "" },
    // ]);

    const [pages, setPages] = useState(() => {
        if (!note?.content) return [{ left: "", right: "" }];

        const pageTexts = note.content.split(/\n*---page---\n*/);
        const parsedPages = [];
        for (let i = 0; i < pageTexts.length; i += 2) {
            parsedPages.push({
                left: pageTexts[i] || "",
                right: pageTexts[i + 1] || "",
            });
        }

        return parsedPages.length > 0 ? parsedPages : [{ left: "", right: "" }];
    });
    const [spread, setSpread] = useState(0);

    const leftRef = useRef(null);
    const rightRef = useRef(null);

    useEffect(() => {
        leftRef.current?.focus();
    }, []);

    const getAllContent = () =>
        pages
            .flatMap((p) => [p.left, p.right])
            .filter(Boolean)
            .join("\n\n---page---\n\n");

    const wordCount = getAllContent()
        .replace(/---page---/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    const flushCurrentSpread = () => {
        const lv = leftRef.current?.value ?? "";
        const rv = rightRef.current?.value ?? "";
        setPages((prev) => {
            const next = [...prev];
            next[spread] = { left: lv, right: rv };
            return next;
        });
        return { left: lv, right: rv };
    };

    const goToSpread = (dir) => {
        const flushed = flushCurrentSpread();
        const nextSpread = spread + dir;
        if (nextSpread < 0) return;
        setPages((prev) => {
            const next = [...prev];
            next[spread] = flushed;
            if (!next[nextSpread]) next[nextSpread] = { left: "", right: "" };
            return next;
        });
        setSpread(nextSpread);
        setTimeout(() => leftRef.current?.focus(), 50);
    };

    const insertText = (before, after = "") => {
        const ta = document.activeElement;
        if (ta !== leftRef.current && ta !== rightRef.current) return;
        const side = ta === leftRef.current ? "left" : "right";
        const s = ta.selectionStart;
        const e = ta.selectionEnd;
        const cur = pages[spread]?.[side] ?? "";
        const sel = cur.slice(s, e);
        const next = cur.slice(0, s) + before + sel + after + cur.slice(e);
        setPages((prev) => {
            const arr = [...prev];
            arr[spread] = { ...arr[spread], [side]: next };
            return arr;
        });
        setTimeout(() => {
            ta.selectionStart = s + before.length;
            ta.selectionEnd = s + before.length + sel.length;
            ta.focus();
        }, 0);
    };

    const TOOLBAR = [
        { label: "B", title: "Bold", action: () => insertText("**", "**") },
        { label: "I", title: "Italic", action: () => insertText("_", "_") },
        { label: "H1", title: "Heading 1", action: () => insertText("# ") },
        { label: "H2", title: "Heading 2", action: () => insertText("## ") },
        {
            label: "{ }",
            title: "Code inline",
            action: () => insertText("`", "`"),
        },
        {
            label: "≡",
            title: "Code block",
            action: () => insertText("```\n", "\n```"),
        },
        { label: "—", title: "Divider", action: () => insertText("\n---\n") },
        { label: "•", title: "List item", action: () => insertText("\n- ") },
        {
            label: "☑",
            title: "Checklist",
            action: () => insertText("\n- [ ] "),
        },
    ];

    const handleSave = async () => {
        flushCurrentSpread();
        if (!title.trim()) {
            setError("Please enter a title.");
            return;
        }
        const content = getAllContent();
        if (!content.replace(/---page---/g, "").trim()) {
            setError("Content cannot be empty.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                title: title.trim(),
                content: content.trim(),
                tag,
                difficulty,
                revision,
                pinned,
                wordCount,
            };
            const data = note?.id
                ? await api("PUT", `/notes/${note.id}`, payload)
                : await api("POST", "/notes", payload);
            onSave(data.note);
        } catch (e) {
            setError(e.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const renderPreview = (text) =>
        text
            .replace(
                /---page---/g,
                '<hr style="border:none;border-top:2px dashed var(--c-border);margin:20px 0"/>',
            )
            .replace(
                /```([\s\S]*?)```/g,
                '<pre style="background:var(--c-bg-input);border:1px solid var(--c-border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#a5b4fc;overflow-x:auto;margin:8px 0">$1</pre>',
            )
            .replace(
                /`([^`]+)`/g,
                '<code style="background:var(--c-bg-input);color:#f472b6;padding:2px 6px;border-radius:4px;font-size:12px">$1</code>',
            )
            .replace(
                /^### (.+)$/gm,
                '<h3 style="color:#a5b4fc;font-size:14px;margin:12px 0 6px;font-family:Syne,sans-serif">$1</h3>',
            )
            .replace(
                /^## (.+)$/gm,
                '<h2 style="color:var(--c-text-primary);font-size:16px;margin:14px 0 8px;font-family:Syne,sans-serif">$1</h2>',
            )
            .replace(
                /^# (.+)$/gm,
                '<h1 style="color:var(--c-text-primary);font-size:20px;margin:16px 0 10px;font-family:Syne,sans-serif;border-bottom:1px solid var(--c-border);padding-bottom:8px">$1</h1>',
            )
            .replace(
                /\*\*(.+?)\*\*/g,
                '<strong style="color:var(--c-text-primary)">$1</strong>',
            )
            .replace(
                /_(.+?)_/g,
                '<em style="color:var(--c-text-secondary)">$1</em>',
            )
            .replace(
                /^---$/gm,
                '<hr style="border:none;border-top:1px solid var(--c-border);margin:16px 0"/>',
            )
            .replace(
                /^- \[ \] (.+)$/gm,
                '<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="color:var(--c-text-dim);font-size:14px">☐</span><span style="color:var(--c-text-secondary);font-size:13px">$1</span></div>',
            )
            .replace(
                /^- \[x\] (.+)$/gm,
                '<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="color:#4caf7d;font-size:14px">☑</span><span style="color:#4caf7d;font-size:13px;text-decoration:line-through">$1</span></div>',
            )
            .replace(
                /^- (.+)$/gm,
                '<div style="display:flex;align-items:flex-start;gap:8px;margin:3px 0"><span style="color:#6366f1;margin-top:2px">▸</span><span style="color:var(--c-text-secondary);font-size:13px">$1</span></div>',
            )
            .replace(/\n/g, "<br/>");

    const curLeft = pages[spread]?.left ?? "";
    const curRight = pages[spread]?.right ?? "";
    const leftPageNum = spread * 2 + 1;
    const rightPageNum = spread * 2 + 2;
    const totalSpreads = pages.length;

    return (
        <>
            <style>{`
                @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
                @keyframes slideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
                .tb-page-left,.tb-page-right {
                    background-image: repeating-linear-gradient(transparent,transparent calc(1.75em - 1px),var(--c-overlay) calc(1.75em - 1px),var(--c-overlay) 1.75em);
                    background-size: 100% 1.75em; background-attachment: local;
                }
                .tb-page-left::placeholder,.tb-page-right::placeholder { color:#2a3a4a; font-style:italic; }
                .tb-page-left:focus,.tb-page-right:focus { outline:none; }
                .tb-toolbar-btn:hover { background:var(--c-border) !important; color:#a5b4fc !important; }
                .tb-nav-btn:hover:not(:disabled) { background:var(--c-overlay) !important; border-color:#6366f1 !important; color:#a5b4fc !important; }
            `}</style>

            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 300,
                    background: "var(--c-overlay)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(16px)",
                    padding: "16px",
                    animation: "fadeIn 0.2s ease",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 960,
                        background: "var(--c-bg-panel)",
                        border: "1px solid var(--c-border)",
                        borderRadius: 20,
                        display: "flex",
                        flexDirection: "column",
                        maxHeight: "96vh",
                        animation: "slideUp 0.25s ease",
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "16px 24px",
                            borderBottom: "1px solid var(--c-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background:
                                "linear-gradient(135deg,var(--c-bg-panel),#0d1117)",
                            flexShrink: 0,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: "#6366f1",
                                    letterSpacing: 2,
                                    marginBottom: 3,
                                    fontFamily: "Syne,sans-serif",
                                }}
                            >
                                {note ? "✏️ EDIT NOTE" : "📝 NEW NOTE"}
                            </div>
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 800,
                                    color: "var(--c-text-primary)",
                                    fontFamily: "Syne,sans-serif",
                                }}
                            >
                                {note
                                    ? "Update your revision note"
                                    : "Create a revision note"}
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <button
                                onClick={() => setPreview((p) => !p)}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    background: preview
                                        ? "var(--c-overlay)"
                                        : "transparent",
                                    border: `1px solid ${preview ? "#6366f1" : "var(--c-border)"}`,
                                    color: preview
                                        ? "#a5b4fc"
                                        : "var(--c-text-muted)",
                                    fontFamily: "Syne,sans-serif",
                                    transition: "all 0.15s",
                                }}
                            >
                                {preview ? "✏️ Editor" : "👁 Preview"}
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    background: "transparent",
                                    border: "1px solid var(--c-border)",
                                    color: "var(--c-text-muted)",
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 15,
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.borderColor = "#ef4444";
                                    e.target.style.color = "#ef4444";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor =
                                        "var(--c-border)";
                                    e.target.style.color =
                                        "var(--c-text-muted)";
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "20px 24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                        }}
                    >
                        {/* Title */}
                        <input
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError("");
                            }}
                            placeholder="Note title..."
                            style={{
                                width: "100%",
                                background: "transparent",
                                border: "none",
                                borderBottom: "2px solid var(--c-border)",
                                color: "var(--c-text-primary)",
                                fontSize: 20,
                                fontWeight: 800,
                                fontFamily: "Syne,sans-serif",
                                padding: "6px 0",
                                outline: "none",
                                letterSpacing: 0.5,
                                boxSizing: "border-box",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={(e) =>
                                (e.target.style.borderBottomColor = "#6366f1")
                            }
                            onBlur={(e) =>
                                (e.target.style.borderBottomColor =
                                    "var(--c-border)")
                            }
                        />

                        {/* Meta row */}
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "var(--c-text-muted)",
                                    }}
                                >
                                    Tag:
                                </span>
                                <select
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    style={{
                                        background: "var(--c-bg-input)",
                                        border: "1px solid var(--c-border)",
                                        color:
                                            TAG_COLORS[tag]?.color ??
                                            "var(--c-text-primary)",
                                        padding: "5px 10px",
                                        borderRadius: 8,
                                        fontSize: 12,
                                        cursor: "pointer",
                                        outline: "none",
                                    }}
                                >
                                    {TAGS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "var(--c-text-muted)",
                                    }}
                                >
                                    Level:
                                </span>
                                <div style={{ display: "flex", gap: 6 }}>
                                    {DIFFICULTY.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            style={{
                                                padding: "4px 10px",
                                                borderRadius: 6,
                                                cursor: "pointer",
                                                fontSize: 11,
                                                background:
                                                    difficulty === d
                                                        ? DIFF_COLORS[d].bg
                                                        : "transparent",
                                                border: `1px solid ${difficulty === d ? DIFF_COLORS[d].border : "var(--c-border)"}`,
                                                color:
                                                    difficulty === d
                                                        ? DIFF_COLORS[d].color
                                                        : "var(--c-text-muted)",
                                                fontWeight:
                                                    difficulty === d
                                                        ? 700
                                                        : 400,
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    onClick={() => setRevision((r) => !r)}
                                    style={{
                                        width: 34,
                                        height: 18,
                                        borderRadius: 9,
                                        position: "relative",
                                        transition: "all 0.2s",
                                        background: revision
                                            ? "#6366f1"
                                            : "var(--c-border)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 2,
                                            left: revision ? 17 : 2,
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            background: "white",
                                            transition: "left 0.2s",
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: revision
                                            ? "#a5b4fc"
                                            : "var(--c-text-muted)",
                                    }}
                                >
                                    📌 Mark for revision
                                </span>
                            </label>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    onClick={() => setPinned((p) => !p)}
                                    style={{
                                        width: 34,
                                        height: 18,
                                        borderRadius: 9,
                                        position: "relative",
                                        transition: "all 0.2s",
                                        background: pinned
                                            ? "#f0c040"
                                            : "var(--c-border)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 2,
                                            left: pinned ? 17 : 2,
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            background: "white",
                                            transition: "left 0.2s",
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: pinned
                                            ? "#f0c040"
                                            : "var(--c-text-muted)",
                                    }}
                                >
                                    ⭐ Pin note
                                </span>
                            </label>
                        </div>

                        {/* Toolbar */}
                        {!preview && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 3,
                                    padding: "7px 10px",
                                    background: "var(--c-bg-input)",
                                    borderRadius: 10,
                                    border: "1px solid var(--c-border)",
                                    flexWrap: "wrap",
                                }}
                            >
                                {TOOLBAR.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={t.action}
                                        title={t.title}
                                        className="tb-toolbar-btn"
                                        style={{
                                            padding: "4px 9px",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                            background: "transparent",
                                            border: "1px solid transparent",
                                            color: "var(--c-text-muted)",
                                            fontSize: 12,
                                            fontFamily: "monospace",
                                            fontWeight: 700,
                                            transition: "all 0.15s",
                                            minWidth: 28,
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                                <div
                                    style={{
                                        marginLeft: "auto",
                                        fontSize: 11,
                                        color: "var(--c-text-dim)",
                                        alignSelf: "center",
                                        fontFamily: "Syne,sans-serif",
                                    }}
                                >
                                    {wordCount} words
                                </div>
                            </div>
                        )}

                        {/* Textbook / Preview */}
                        {preview ? (
                            <div
                                style={{
                                    minHeight: 280,
                                    padding: 20,
                                    background: "var(--c-bg-input)",
                                    borderRadius: 12,
                                    border: "1px solid var(--c-border)",
                                    color: "var(--c-text-secondary)",
                                    fontSize: 14,
                                    lineHeight: 1.8,
                                }}
                                dangerouslySetInnerHTML={{
                                    __html:
                                        renderPreview(getAllContent()) ||
                                        '<span style="color:var(--c-text-dim)">Nothing to preview yet...</span>',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                {/* Book spread */}
                                <div
                                    style={{
                                        display: "flex",
                                        borderRadius: 4,
                                        boxShadow:
                                            "0 12px 48px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.3)",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* LEFT PAGE */}
                                    <div
                                        style={{
                                            flex: 1,
                                            background: "var(--c-bg-input)",
                                            borderRadius: "4px 0 0 4px",
                                            display: "flex",
                                            flexDirection: "column",
                                            border: "1px solid var(--c-border)",
                                            borderRight: "none",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: 3,
                                                background: `linear-gradient(90deg,${TAG_COLORS[tag]?.color ?? "#6366f1"},#6366f1)`,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 3,
                                                bottom: 0,
                                                left: 44,
                                                width: 1,
                                                background:
                                                    "rgba(239,68,68,0.2)",
                                                zIndex: 1,
                                                pointerEvents: "none",
                                            }}
                                        />
                                        <div
                                            style={{
                                                padding: "10px 16px 8px 48px",
                                                borderBottom:
                                                    "1px solid var(--c-border)",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: "var(--c-text-dim)",
                                                    fontFamily:
                                                        "Syne,sans-serif",
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                {tag.toUpperCase()} ·{" "}
                                                {difficulty.toUpperCase()}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "var(--c-text-dim)",
                                                    fontFamily:
                                                        "Syne,sans-serif",
                                                }}
                                            >
                                                {leftPageNum}
                                            </span>
                                        </div>
                                        <textarea
                                            ref={leftRef}
                                            className="tb-page-left"
                                            value={curLeft}
                                            onChange={(e) =>
                                                setPages((prev) => {
                                                    const next = [...prev];
                                                    next[spread] = {
                                                        ...next[spread],
                                                        left: e.target.value,
                                                    };
                                                    return next;
                                                })
                                            }
                                            placeholder={
                                                spread === 0
                                                    ? "Start writing here...\n\nUse the toolbar above for\nmarkdown formatting."
                                                    : "Continue writing..."
                                            }
                                            style={{
                                                flex: 1,
                                                minHeight: 300,
                                                background: "transparent",
                                                border: "none",
                                                color: "var(--c-text-primary)",
                                                padding: "12px 16px 16px 48px",
                                                fontFamily:
                                                    "'Georgia','Times New Roman',serif",
                                                fontSize: 13.5,
                                                lineHeight: "1.75em",
                                                resize: "none",
                                                boxSizing: "border-box",
                                                zIndex: 2,
                                            }}
                                        />
                                    </div>
                                    {/* SPINE */}
                                    <div
                                        style={{
                                            width: 20,
                                            flexShrink: 0,
                                            background: "var(--c-border)",
                                            position: "relative",
                                            zIndex: 5,
                                            boxShadow:
                                                "inset 4px 0 8px rgba(0,0,0,0.4),inset -4px 0 8px rgba(0,0,0,0.4)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background:
                                                    "linear-gradient(to right,rgba(0,0,0,0.5),rgba(99,102,241,0.05),rgba(0,0,0,0.5))",
                                            }}
                                        />
                                    </div>
                                    {/* RIGHT PAGE */}
                                    <div
                                        style={{
                                            flex: 1,
                                            background: "var(--c-bg-input)",
                                            borderRadius: "0 4px 4px 0",
                                            display: "flex",
                                            flexDirection: "column",
                                            border: "1px solid var(--c-border)",
                                            borderLeft: "none",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: 3,
                                                background: `linear-gradient(90deg,#6366f1,${DIFF_COLORS[difficulty]?.color ?? "#ec4899"})`,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 3,
                                                bottom: 0,
                                                right: 44,
                                                width: 1,
                                                background:
                                                    "rgba(239,68,68,0.2)",
                                                zIndex: 1,
                                                pointerEvents: "none",
                                            }}
                                        />
                                        <div
                                            style={{
                                                padding: "10px 48px 8px 16px",
                                                borderBottom:
                                                    "1px solid var(--c-border)",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "var(--c-text-dim)",
                                                    fontFamily:
                                                        "Syne,sans-serif",
                                                }}
                                            >
                                                {rightPageNum}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: "var(--c-text-dim)",
                                                    fontFamily:
                                                        "Syne,sans-serif",
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                {title.trim()
                                                    ? title
                                                          .trim()
                                                          .toUpperCase()
                                                          .slice(0, 24)
                                                    : "UNTITLED"}
                                            </span>
                                        </div>
                                        <textarea
                                            ref={rightRef}
                                            className="tb-page-right"
                                            value={curRight}
                                            onChange={(e) =>
                                                setPages((prev) => {
                                                    const next = [...prev];
                                                    next[spread] = {
                                                        ...next[spread],
                                                        right: e.target.value,
                                                    };
                                                    return next;
                                                })
                                            }
                                            placeholder="Continue on this page..."
                                            style={{
                                                flex: 1,
                                                minHeight: 300,
                                                background: "transparent",
                                                border: "none",
                                                color: "var(--c-text-primary)",
                                                padding: "12px 48px 16px 16px",
                                                fontFamily:
                                                    "'Georgia','Times New Roman',serif",
                                                fontSize: 13.5,
                                                lineHeight: "1.75em",
                                                resize: "none",
                                                boxSizing: "border-box",
                                                zIndex: 2,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Page navigation */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 12,
                                    }}
                                >
                                    <button
                                        className="tb-nav-btn"
                                        onClick={() => goToSpread(-1)}
                                        disabled={spread === 0}
                                        style={{
                                            padding: "7px 18px",
                                            borderRadius: 8,
                                            cursor:
                                                spread === 0
                                                    ? "not-allowed"
                                                    : "pointer",
                                            background: "transparent",
                                            border: `1px solid ${spread === 0 ? "var(--c-border)" : "#2a3a4a"}`,
                                            color:
                                                spread === 0
                                                    ? "#2a3a4a"
                                                    : "var(--c-text-muted)",
                                            fontSize: 12,
                                            fontFamily: "Syne,sans-serif",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        ← Previous
                                    </button>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 6,
                                            alignItems: "center",
                                        }}
                                    >
                                        {pages.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    flushCurrentSpread();
                                                    setSpread(i);
                                                    setTimeout(
                                                        () =>
                                                            leftRef.current?.focus(),
                                                        50,
                                                    );
                                                }}
                                                style={{
                                                    width:
                                                        i === spread ? 20 : 7,
                                                    height: 7,
                                                    borderRadius: 4,
                                                    background:
                                                        i === spread
                                                            ? "#6366f1"
                                                            : "var(--c-border)",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    transition: "all 0.25s",
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="tb-nav-btn"
                                        onClick={() => goToSpread(1)}
                                        style={{
                                            padding: "7px 18px",
                                            borderRadius: 8,
                                            cursor: "pointer",
                                            background:
                                                spread === totalSpreads - 1
                                                    ? "rgba(99,102,241,0.12)"
                                                    : "transparent",
                                            border: `1px solid ${spread === totalSpreads - 1 ? "rgba(99,102,241,0.4)" : "#2a3a4a"}`,
                                            color:
                                                spread === totalSpreads - 1
                                                    ? "#a5b4fc"
                                                    : "var(--c-text-muted)",
                                            fontSize: 12,
                                            fontFamily: "Syne,sans-serif",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {spread === totalSpreads - 1
                                            ? "+ New Page →"
                                            : "Next →"}
                                    </button>
                                </div>
                                <div
                                    style={{
                                        textAlign: "center",
                                        fontSize: 11,
                                        color: "var(--c-text-dim)",
                                        fontFamily: "Syne,sans-serif",
                                    }}
                                >
                                    Pages {leftPageNum}–{rightPageNum} · Spread{" "}
                                    {spread + 1} of {totalSpreads}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div
                                style={{
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    color: "#fca5a5",
                                    padding: "10px 16px",
                                    borderRadius: 8,
                                    fontSize: 13,
                                }}
                            >
                                ⚠️ {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: "14px 24px",
                            borderTop: "1px solid var(--c-border)",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 10,
                            background: "var(--c-bg-panel)",
                            flexShrink: 0,
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                marginRight: "auto",
                                fontSize: 11,
                                color: "var(--c-text-dim)",
                                fontFamily: "Syne,sans-serif",
                            }}
                        >
                            {pages.length} spread{pages.length > 1 ? "s" : ""} ·{" "}
                            {wordCount} words
                        </span>
                        <button
                            onClick={onClose}
                            style={{
                                padding: "9px 20px",
                                borderRadius: 10,
                                cursor: "pointer",
                                background: "transparent",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-muted)",
                                fontFamily: "Syne,sans-serif",
                                fontSize: 14,
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor =
                                    "var(--c-text-dim)";
                                e.target.style.color =
                                    "var(--c-text-secondary)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = "var(--c-border)";
                                e.target.style.color = "var(--c-text-muted)";
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: "9px 26px",
                                borderRadius: 10,
                                cursor: saving ? "not-allowed" : "pointer",
                                background: saving
                                    ? "var(--c-border)"
                                    : "linear-gradient(135deg,#6366f1,#ec4899)",
                                border: "none",
                                color: saving ? "var(--c-text-muted)" : "white",
                                fontFamily: "Syne,sans-serif",
                                fontWeight: 700,
                                fontSize: 14,
                                transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                if (!saving) e.target.style.opacity = "0.85";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.opacity = "1";
                            }}
                        >
                            {saving ? "⏳ Saving..." : "💾 Save Note"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Note Card ─────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onToggleRevision, onTogglePin }) {
    const [expanded, setExpanded] = useState(false);
    const tc = TAG_COLORS[note.tag] ?? TAG_COLORS["Other"];
    const dc = DIFF_COLORS[note.difficulty] ?? DIFF_COLORS["Beginner"];

    const renderPreview = (text) => {
        const short = expanded ? text : text.slice(0, 200);
        return short
            .replace(/```[\s\S]*?```/g, "[code block]")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/^#+\s/gm, "")
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/_(.+?)_/g, "$1")
            .replace(/^- /gm, "• ")
            .replace(/---/g, "─────");
    };

    return (
        <div
            style={{
                background: "var(--c-bg-panel)",
                border: `1px solid ${note.pinned ? "rgba(240,192,64,0.35)" : "var(--c-border)"}`,
                borderRadius: 16,
                overflow: "hidden",
                transition: "all 0.25s",
                position: "relative",
                boxShadow: note.pinned
                    ? "0 0 20px rgba(240,192,64,0.06)"
                    : "none",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = note.pinned
                    ? "rgba(240,192,64,0.5)"
                    : "#2a3a4a";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = note.pinned
                    ? "0 8px 30px rgba(240,192,64,0.1)"
                    : "0 8px 30px rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = note.pinned
                    ? "rgba(240,192,64,0.35)"
                    : "var(--c-border)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = note.pinned
                    ? "0 0 20px rgba(240,192,64,0.06)"
                    : "none";
            }}
        >
            <div
                style={{
                    height: 3,
                    background: `linear-gradient(90deg,${tc.color},${dc.color})`,
                }}
            />
            <div style={{ padding: "18px 20px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                    }}
                >
                    <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                                flexWrap: "wrap",
                            }}
                        >
                            {note.pinned && (
                                <span style={{ fontSize: 12 }}>⭐</span>
                            )}
                            {note.revision && (
                                <span
                                    style={{
                                        fontSize: 10,
                                        background: "rgba(99,102,241,0.15)",
                                        color: "#a5b4fc",
                                        border: "1px solid rgba(99,102,241,0.3)",
                                        padding: "2px 8px",
                                        borderRadius: 20,
                                    }}
                                >
                                    📌 REVISION
                                </span>
                            )}
                            <span
                                style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    fontWeight: 600,
                                    background: tc.bg,
                                    color: tc.color,
                                    border: `1px solid ${tc.border}`,
                                }}
                            >
                                {note.tag}
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    fontWeight: 600,
                                    background: dc.bg,
                                    color: dc.color,
                                    border: `1px solid ${dc.border}`,
                                }}
                            >
                                {note.difficulty}
                            </span>
                        </div>
                        <h3
                            style={{
                                fontFamily: "Syne,sans-serif",
                                fontWeight: 800,
                                fontSize: 15,
                                color: "var(--c-text-primary)",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {note.title}
                        </h3>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                            onClick={() => onTogglePin(note.id)}
                            title="Pin"
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                cursor: "pointer",
                                background: note.pinned
                                    ? "rgba(240,192,64,0.15)"
                                    : "transparent",
                                border: `1px solid ${note.pinned ? "rgba(240,192,64,0.3)" : "var(--c-border)"}`,
                                color: note.pinned
                                    ? "#f0c040"
                                    : "var(--c-text-muted)",
                                fontSize: 12,
                                transition: "all 0.15s",
                            }}
                        >
                            ⭐
                        </button>
                        <button
                            onClick={() => onEdit(note)}
                            title="Edit"
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                cursor: "pointer",
                                background: "transparent",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-muted)",
                                fontSize: 12,
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = "#6366f1";
                                e.target.style.color = "#a5b4fc";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = "var(--c-border)";
                                e.target.style.color = "var(--c-text-muted)";
                            }}
                        >
                            ✏️
                        </button>
                        <button
                            onClick={() => onDelete(note.id)}
                            title="Delete"
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                cursor: "pointer",
                                background: "transparent",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-muted)",
                                fontSize: 12,
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = "#ef4444";
                                e.target.style.color = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = "var(--c-border)";
                                e.target.style.color = "var(--c-text-muted)";
                            }}
                        >
                            🗑
                        </button>
                    </div>
                </div>
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--c-text-muted)",
                        lineHeight: 1.7,
                        margin: "0 0 12px",
                        fontFamily: "'DM Mono','Courier New',monospace",
                        whiteSpace: "pre-line",
                    }}
                >
                    {renderPreview(note.content)}
                    {!expanded && note.content.length > 200 && "..."}
                </p>
                {note.content.length > 200 && (
                    <button
                        onClick={() => setExpanded((e) => !e)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#6366f1",
                            fontSize: 12,
                            cursor: "pointer",
                            padding: 0,
                            marginBottom: 12,
                            fontFamily: "Syne,sans-serif",
                        }}
                    >
                        {expanded ? "▲ Show less" : "▼ Read more"}
                    </button>
                )}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 12,
                        borderTop: "1px solid var(--c-border)",
                    }}
                >
                    <div style={{ display: "flex", gap: 14 }}>
                        <span
                            style={{ fontSize: 11, color: "var(--c-text-dim)" }}
                        >
                            🕒 {timeAgo(note.updated_at)}
                        </span>
                        <span
                            style={{ fontSize: 11, color: "var(--c-text-dim)" }}
                        >
                            📝 {note.wordCount ?? 0} words
                        </span>
                    </div>
                    <button
                        onClick={() => onToggleRevision(note.id)}
                        style={{
                            padding: "4px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 11,
                            background: note.revision
                                ? "rgba(99,102,241,0.15)"
                                : "transparent",
                            border: `1px solid ${note.revision ? "rgba(99,102,241,0.3)" : "var(--c-border)"}`,
                            color: note.revision
                                ? "#a5b4fc"
                                : "var(--c-text-muted)",
                            fontFamily: "Syne,sans-serif",
                            transition: "all 0.15s",
                        }}
                    >
                        {note.revision ? "📌 In revision" : "+ Add to revision"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Revision Book View ────────────────────────────────────
function RevisionBook({ notes, onEdit, onToggleRevision }) {
    const revNotes = notes.filter((n) => n.revision);
    const [page, setPage] = useState(0);
    const total = revNotes.length;

    if (total === 0)
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "50vh",
                    gap: 16,
                }}
            >
                <span style={{ fontSize: 60 }}>📖</span>
                <div
                    style={{
                        fontFamily: "Syne,sans-serif",
                        fontSize: 20,
                        fontWeight: 800,
                        color: "var(--c-text-primary)",
                    }}
                >
                    Revision book is empty
                </div>
                <div style={{ color: "var(--c-text-muted)", fontSize: 14 }}>
                    Mark notes for revision to see them here
                </div>
            </div>
        );

    const note = revNotes[page];
    const tc = TAG_COLORS[note.tag] ?? TAG_COLORS["Other"];
    const dc = DIFF_COLORS[note.difficulty] ?? DIFF_COLORS["Beginner"];

    const renderFull = (text) =>
        text
            .replace(
                /```([\s\S]*?)```/g,
                '<pre style="background:var(--c-bg-input);border:1px solid var(--c-border);border-radius:8px;padding:14px;font-family:monospace;font-size:12px;color:#a5b4fc;overflow-x:auto;margin:10px 0;white-space:pre-wrap">$1</pre>',
            )
            .replace(
                /`([^`]+)`/g,
                '<code style="background:var(--c-bg-input);color:#f472b6;padding:2px 6px;border-radius:4px;font-size:12px">$1</code>',
            )
            .replace(
                /^### (.+)$/gm,
                '<h3 style="color:#a5b4fc;font-size:14px;margin:14px 0 6px;font-family:Syne,sans-serif;letter-spacing:1px">$1</h3>',
            )
            .replace(
                /^## (.+)$/gm,
                '<h2 style="color:#e2e8f0;font-size:17px;margin:16px 0 8px;font-family:Syne,sans-serif">$1</h2>',
            )
            .replace(
                /^# (.+)$/gm,
                '<h1 style="color:var(--c-text-primary);font-size:22px;margin:18px 0 10px;font-family:Syne,sans-serif;border-bottom:1px solid var(--c-border);padding-bottom:10px">$1</h1>',
            )
            .replace(
                /\*\*(.+?)\*\*/g,
                '<strong style="color:var(--c-text-primary);font-weight:700">$1</strong>',
            )
            .replace(
                /_(.+?)_/g,
                '<em style="color:var(--c-text-secondary)">$1</em>',
            )
            .replace(
                /^---$/gm,
                '<hr style="border:none;border-top:1px solid var(--c-border);margin:18px 0"/>',
            )
            .replace(
                /^- \[ \] (.+)$/gm,
                '<div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="color:var(--c-text-dim);font-size:16px">☐</span><span style="color:var(--c-text-secondary);font-size:13px">$1</span></div>',
            )
            .replace(
                /^- \[x\] (.+)$/gm,
                '<div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="color:#4caf7d;font-size:16px">☑</span><span style="color:#4caf7d;font-size:13px;text-decoration:line-through">$1</span></div>',
            )
            .replace(
                /^- (.+)$/gm,
                '<div style="display:flex;align-items:flex-start;gap:8px;margin:4px 0"><span style="color:#6366f1;margin-top:3px">▸</span><span style="color:var(--c-text-secondary);font-size:13px">$1</span></div>',
            )
            .replace(/\n/g, "<br/>");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--c-bg-panel)",
                    border: "1px solid var(--c-border)",
                    borderRadius: 14,
                    padding: "16px 24px",
                }}
            >
                <div style={{ fontFamily: "Syne,sans-serif" }}>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#6366f1",
                            letterSpacing: 2,
                            marginBottom: 4,
                        }}
                    >
                        REVISION BOOK
                    </div>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: "var(--c-text-primary)",
                        }}
                    >
                        Page {page + 1} of {total}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {revNotes.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            style={{
                                width: i === page ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                background:
                                    i === page ? "#6366f1" : "var(--c-border)",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.3s",
                                padding: 0,
                            }}
                        />
                    ))}
                </div>
            </div>
            <div
                style={{
                    background: "var(--c-bg-panel)",
                    border: `1px solid ${tc.border}`,
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: `0 20px 60px ${tc.color}10`,
                    position: "relative",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: `linear-gradient(180deg,${tc.color},${dc.color})`,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: 24,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: "rgba(30,42,58,0.5)",
                    }}
                />
                <div style={{ padding: "32px 40px 32px 44px" }}>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 20,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                padding: "3px 12px",
                                borderRadius: 20,
                                fontWeight: 700,
                                background: tc.bg,
                                color: tc.color,
                                border: `1px solid ${tc.border}`,
                            }}
                        >
                            {note.tag}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                padding: "3px 12px",
                                borderRadius: 20,
                                fontWeight: 700,
                                background: dc.bg,
                                color: dc.color,
                                border: `1px solid ${dc.border}`,
                            }}
                        >
                            {note.difficulty}
                        </span>
                        <span
                            style={{
                                fontSize: 12,
                                color: "var(--c-text-dim)",
                                marginLeft: "auto",
                            }}
                        >
                            {formatDate(note.created_at)} ·{" "}
                            {note.wordCount ?? 0} words
                        </span>
                    </div>
                    <h1
                        style={{
                            fontFamily: "Syne,sans-serif",
                            fontSize: 26,
                            fontWeight: 900,
                            color: "var(--c-text-primary)",
                            marginBottom: 24,
                            lineHeight: 1.2,
                            borderBottom: `2px solid ${tc.border}`,
                            paddingBottom: 16,
                        }}
                    >
                        {note.title}
                    </h1>
                    <div
                        style={{
                            fontSize: 14,
                            color: "var(--c-text-secondary)",
                            lineHeight: 1.9,
                            minHeight: 200,
                        }}
                        dangerouslySetInnerHTML={{
                            __html: renderFull(note.content),
                        }}
                    />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 32,
                            paddingTop: 20,
                            borderTop: "1px solid var(--c-border)",
                        }}
                    >
                        <div
                            style={{ fontSize: 12, color: "var(--c-text-dim)" }}
                        >
                            Last updated: {timeAgo(note.updated_at)}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => onEdit(note)}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    background: "transparent",
                                    border: "1px solid var(--c-border)",
                                    color: "var(--c-text-muted)",
                                    fontFamily: "Syne,sans-serif",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.borderColor = "#6366f1";
                                    e.target.style.color = "#a5b4fc";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor =
                                        "var(--c-border)";
                                    e.target.style.color =
                                        "var(--c-text-muted)";
                                }}
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => onToggleRevision(note.id)}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(239,68,68,0.25)",
                                    color: "#fca5a5",
                                    fontFamily: "Syne,sans-serif",
                                    transition: "all 0.15s",
                                }}
                            >
                                ✕ Remove from revision
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                        padding: "10px 28px",
                        borderRadius: 10,
                        cursor: page === 0 ? "not-allowed" : "pointer",
                        background:
                            page === 0 ? "var(--c-bg-input)" : "transparent",
                        border: `1px solid ${page === 0 ? "var(--c-border)" : "#2a3a4a"}`,
                        color:
                            page === 0
                                ? "var(--c-text-dim)"
                                : "var(--c-text-secondary)",
                        fontSize: 14,
                        fontFamily: "Syne,sans-serif",
                        transition: "all 0.15s",
                    }}
                >
                    ← Previous
                </button>
                <button
                    onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
                    disabled={page === total - 1}
                    style={{
                        padding: "10px 28px",
                        borderRadius: 10,
                        cursor: page === total - 1 ? "not-allowed" : "pointer",
                        background:
                            page === total - 1
                                ? "var(--c-bg-input)"
                                : "linear-gradient(135deg,#6366f1,#ec4899)",
                        border: "none",
                        color:
                            page === total - 1 ? "var(--c-text-dim)" : "white",
                        fontSize: 14,
                        fontFamily: "Syne,sans-serif",
                        transition: "all 0.15s",
                    }}
                >
                    Next →
                </button>
            </div>
        </div>
    );
}

// ── Analytics View ────────────────────────────────────────
function AnalyticsView({ notes }) {
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return {
            day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
            count: notes.filter((n) => n.created_at?.slice(0, 10) === key)
                .length,
        };
    });
    const tagCounts = TAGS.map((t) => ({
        tag: t,
        count: notes.filter((n) => n.tag === t).length,
    }))
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count);
    const maxTag = Math.max(...tagCounts.map((t) => t.count), 1);
    const diffCounts = DIFFICULTY.map((d) => ({
        d,
        count: notes.filter((n) => n.difficulty === d).length,
    }));
    const totalDiff = diffCounts.reduce((s, d) => s + d.count, 0) || 1;
    let streak = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (notes.some((n) => n.created_at?.slice(0, 10) === key)) streak++;
        else break;
    }
    const wordData = [...notes]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((n) => n.wordCount ?? 0);
    const totalWords = notes.reduce((s, n) => s + (n.wordCount ?? 0), 0);
    const avgWords = notes.length ? Math.round(totalWords / notes.length) : 0;

    const MINI_STATS = [
        {
            label: "Total Notes",
            value: notes.length,
            color: "#6366f1",
            sparkData: last7.map((d) => d.count),
        },
        {
            label: "For Revision",
            value: notes.filter((n) => n.revision).length,
            color: "#a855f7",
            sparkData: null,
        },
        {
            label: "Day Streak",
            value: streak,
            color: "#f0c040",
            sparkData: null,
        },
        {
            label: "Total Words",
            value: totalWords,
            color: "#4caf7d",
            sparkData: wordData.slice(-7),
        },
        {
            label: "Avg Words/Note",
            value: avgWords,
            color: "#38bdf8",
            sparkData: null,
        },
        {
            label: "Pinned Notes",
            value: notes.filter((n) => n.pinned).length,
            color: "#ec4899",
            sparkData: null,
        },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
                    gap: 14,
                }}
            >
                {MINI_STATS.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            background: "var(--c-bg-panel)",
                            border: "1px solid var(--c-border)",
                            borderRadius: 14,
                            padding: "18px 20px",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = s.color + "66";
                            e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}12`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                                "var(--c-border)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                color: "var(--c-text-muted)",
                                letterSpacing: 1,
                                marginBottom: 10,
                                fontFamily: "Syne,sans-serif",
                                textTransform: "uppercase",
                            }}
                        >
                            {s.label}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "Syne,sans-serif",
                                    fontSize: 28,
                                    fontWeight: 900,
                                    color: s.color,
                                }}
                            >
                                <Counter value={s.value} />
                            </div>
                            {s.sparkData && s.sparkData.some((v) => v > 0) && (
                                <Sparkline
                                    data={s.sparkData}
                                    color={s.color}
                                    width={70}
                                    height={34}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                }}
            >
                <div
                    style={{
                        background: "var(--c-bg-panel)",
                        border: "1px solid var(--c-border)",
                        borderRadius: 16,
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            fontFamily: "Syne,sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--c-text-primary)",
                            marginBottom: 20,
                            letterSpacing: 1,
                        }}
                    >
                        NOTES CREATED — LAST 7 DAYS
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 8,
                            height: 140,
                            paddingBottom: 8,
                        }}
                    >
                        {last7.map((d, i) => {
                            const maxV = Math.max(
                                ...last7.map((x) => x.count),
                                1,
                            );
                            const pct = (d.count / maxV) * 100;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 6,
                                        height: "100%",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "var(--c-text-muted)",
                                            fontFamily: "Syne,sans-serif",
                                        }}
                                    >
                                        {d.count > 0 ? d.count : ""}
                                    </div>
                                    <div
                                        style={{
                                            width: "100%",
                                            borderRadius: "4px 4px 0 0",
                                            background:
                                                d.count > 0
                                                    ? "linear-gradient(180deg,#6366f1,#a855f7)"
                                                    : "var(--c-border)",
                                            height: `${Math.max(pct, 4)}%`,
                                            transition: "height 0.5s ease",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {d.count > 0 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background:
                                                        "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)",
                                                    animation:
                                                        "shimmer 2s infinite",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "var(--c-text-dim)",
                                            fontFamily: "Syne,sans-serif",
                                        }}
                                    >
                                        {d.day}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div
                    style={{
                        background: "var(--c-bg-panel)",
                        border: "1px solid var(--c-border)",
                        borderRadius: 16,
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            fontFamily: "Syne,sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--c-text-primary)",
                            marginBottom: 20,
                            letterSpacing: 1,
                        }}
                    >
                        DIFFICULTY BREAKDOWN
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 24,
                            alignItems: "center",
                        }}
                    >
                        <svg width={130} height={130} style={{ flexShrink: 0 }}>
                            {(() => {
                                const R = 48,
                                    cx = 65,
                                    cy = 65,
                                    circ = 2 * Math.PI * R,
                                    colors = ["#4caf7d", "#f59e0b", "#ef4444"];
                                let off = 0;
                                return diffCounts.map((d, i) => {
                                    const pct = d.count / totalDiff,
                                        dash = pct * circ;
                                    const el = (
                                        <circle
                                            key={i}
                                            cx={cx}
                                            cy={cy}
                                            r={R}
                                            fill="none"
                                            stroke={colors[i]}
                                            strokeWidth={18}
                                            strokeDasharray={`${dash - 2} ${circ - dash + 2}`}
                                            strokeDashoffset={
                                                -off + circ * 0.25
                                            }
                                            strokeLinecap="round"
                                            style={{
                                                transition:
                                                    "stroke-dasharray 0.8s ease",
                                                opacity: d.count ? 1 : 0.1,
                                            }}
                                        />
                                    );
                                    off += dash;
                                    return el;
                                });
                            })()}
                            <text
                                x="65"
                                y="60"
                                textAnchor="middle"
                                style={{
                                    fill: "var(--c-text-primary)",
                                    fontSize: 18,
                                    fontWeight: 800,
                                    fontFamily: "Syne,sans-serif",
                                }}
                            >
                                {notes.length}
                            </text>
                            <text
                                x="65"
                                y="76"
                                textAnchor="middle"
                                style={{
                                    fill: "var(--c-text-muted)",
                                    fontSize: 10,
                                    fontFamily: "Syne,sans-serif",
                                }}
                            >
                                total
                            </text>
                        </svg>
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {diffCounts.map((d, i) => {
                                const colors = [
                                    "#4caf7d",
                                    "#f59e0b",
                                    "#ef4444",
                                ];
                                return (
                                    <div key={i}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: 4,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: colors[i],
                                                    fontFamily:
                                                        "Syne,sans-serif",
                                                }}
                                            >
                                                {d.d}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--c-text-muted)",
                                                }}
                                            >
                                                {d.count}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                height: 4,
                                                background: "var(--c-bg-input)",
                                                borderRadius: 2,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    borderRadius: 2,
                                                    width: `${(d.count / totalDiff) * 100}%`,
                                                    background: colors[i],
                                                    transition:
                                                        "width 0.8s ease",
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    background: "var(--c-bg-panel)",
                    border: "1px solid var(--c-border)",
                    borderRadius: 16,
                    padding: 24,
                }}
            >
                <div
                    style={{
                        fontFamily: "Syne,sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--c-text-primary)",
                        marginBottom: 20,
                        letterSpacing: 1,
                    }}
                >
                    NOTES BY TOPIC
                </div>
                {tagCounts.length === 0 ? (
                    <div
                        style={{
                            color: "var(--c-text-dim)",
                            fontSize: 13,
                            textAlign: "center",
                            padding: "20px 0",
                        }}
                    >
                        No notes yet
                    </div>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        {tagCounts.map((t, i) => {
                            const tc = TAG_COLORS[t.tag] ?? TAG_COLORS["Other"],
                                pct = Math.round((t.count / maxTag) * 100);
                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 90,
                                            fontSize: 12,
                                            color: tc.color,
                                            fontFamily: "Syne,sans-serif",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {t.tag}
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 8,
                                            background: "var(--c-bg-input)",
                                            borderRadius: 4,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                borderRadius: 4,
                                                width: `${pct}%`,
                                                background: `linear-gradient(90deg,${tc.color}88,${tc.color})`,
                                                transition: "width 0.8s ease",
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: 30,
                                            fontSize: 12,
                                            color: "var(--c-text-muted)",
                                            textAlign: "right",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {t.count}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            padding: "2px 8px",
                                            borderRadius: 10,
                                            flexShrink: 0,
                                            background: tc.bg,
                                            color: tc.color,
                                            border: `1px solid ${tc.border}`,
                                        }}
                                    >
                                        {pct}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div
                style={{
                    background: "var(--c-bg-panel)",
                    border: "1px solid var(--c-border)",
                    borderRadius: 16,
                    padding: 24,
                }}
            >
                <div
                    style={{
                        fontFamily: "Syne,sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--c-text-primary)",
                        marginBottom: 20,
                        letterSpacing: 1,
                    }}
                >
                    ACTIVITY HEATMAP — LAST 28 DAYS
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {Array.from({ length: 28 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (27 - i));
                        const key = d.toISOString().slice(0, 10);
                        const cnt = notes.filter(
                            (n) => n.created_at?.slice(0, 10) === key,
                        ).length;
                        const intensity =
                            cnt === 0
                                ? 0
                                : cnt === 1
                                  ? 0.3
                                  : cnt === 2
                                    ? 0.6
                                    : 1;
                        return (
                            <div
                                key={i}
                                title={`${key}: ${cnt} notes`}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    background:
                                        intensity === 0
                                            ? "var(--c-bg-input)"
                                            : `rgba(99,102,241,${intensity})`,
                                    border: `1px solid ${intensity > 0 ? "rgba(99,102,241,0.3)" : "var(--c-border)"}`,
                                    transition: "all 0.15s",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    color:
                                        intensity > 0.5
                                            ? "white"
                                            : "transparent",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                        "scale(1.2)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                        "scale(1)")
                                }
                            >
                                {cnt > 0 ? cnt : ""}
                            </div>
                        );
                    })}
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 16,
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontSize: 11, color: "var(--c-text-dim)" }}>
                        Less
                    </span>
                    {[0, 0.3, 0.6, 1].map((v, i) => (
                        <div
                            key={i}
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 3,
                                background:
                                    v === 0
                                        ? "var(--c-bg-input)"
                                        : `rgba(99,102,241,${v})`,
                                border: "1px solid var(--c-border)",
                            }}
                        />
                    ))}
                    <span style={{ fontSize: 11, color: "var(--c-text-dim)" }}>
                        More
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function PageAnalytics() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("notes");
    const [showEditor, setShowEditor] = useState(false);
    const [editNote, setEditNote] = useState(null);
    const [search, setSearch] = useState("");
    const [filterTag, setFilterTag] = useState("all");
    const [filterDiff, setFilterDiff] = useState("all");
    const [sortBy, setSortBy] = useState("updated");

    // ── Load notes from API ───────────────────────────────
    const fetchNotes = async () => {
        try {
            const data = await api("GET", "/notes");
            if (data.success) setNotes(data.notes);
        } catch (e) {
            console.error("Failed to fetch notes:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    // ── CRUD handlers ─────────────────────────────────────
    const handleSave = (savedNote) => {
        setNotes((prev) => {
            const exists = prev.find((n) => n.id === savedNote.id);
            return exists
                ? prev.map((n) => (n.id === savedNote.id ? savedNote : n))
                : [savedNote, ...prev];
        });
        setShowEditor(false);
        setEditNote(null);
    };

    const handleEdit = (note) => {
        setEditNote(note);
        setShowEditor(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this note?")) return;
        try {
            await api("DELETE", `/notes/${id}`);
            setNotes((prev) => prev.filter((n) => n.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleRevision = async (id) => {
        try {
            const data = await api("PATCH", `/notes/${id}/revision`);
            if (data.success)
                setNotes((prev) =>
                    prev.map((n) => (n.id === id ? data.note : n)),
                );
        } catch (e) {
            console.error(e);
        }
    };

    const handleTogglePin = async (id) => {
        try {
            const data = await api("PATCH", `/notes/${id}/pin`);
            if (data.success)
                setNotes((prev) =>
                    prev.map((n) => (n.id === id ? data.note : n)),
                );
        } catch (e) {
            console.error(e);
        }
    };

    // ── Filter + sort ─────────────────────────────────────
    const filtered = notes
        .filter((n) => {
            const q = search.toLowerCase();
            return (
                (!q ||
                    n.title.toLowerCase().includes(q) ||
                    n.content.toLowerCase().includes(q)) &&
                (filterTag === "all" || n.tag === filterTag) &&
                (filterDiff === "all" || n.difficulty === filterDiff)
            );
        })
        .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            if (sortBy === "updated")
                return new Date(b.updated_at) - new Date(a.updated_at);
            if (sortBy === "created")
                return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === "words")
                return (b.wordCount ?? 0) - (a.wordCount ?? 0);
            return 0;
        });

    const VIEWS = [
        { id: "notes", icon: "📝", label: "All Notes" },
        { id: "revision", icon: "📖", label: "Revision Book" },
        { id: "analytics", icon: "📊", label: "Analytics" },
    ];

    return (
        <>
            <style>{`
                @keyframes shimmer { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
                @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
                @keyframes slideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
            `}</style>

            {showEditor && (
                <NoteEditor
                    note={editNote}
                    onSave={handleSave}
                    onClose={() => {
                        setShowEditor(false);
                        setEditNote(null);
                    }}
                />
            )}

            <div className="dash__page-header">
                <div>
                    <div
                        className="dash__page-eyebrow"
                        style={{ color: "#6366f1" }}
                    >
                        KNOWLEDGE BASE
                    </div>
                    <h1 className="dash__page-title">
                        NOTE<span style={{ color: "#6366f1" }}>_</span>BOOK
                    </h1>
                    <p className="dash__page-meta">
                        {notes.length} notes ·{" "}
                        {notes.filter((n) => n.revision).length} for revision ·{" "}
                        {notes.filter((n) => n.pinned).length} pinned
                    </p>
                </div>
                <div className="dash__header-actions">
                    <button
                        className="dash__btn dash__btn--ghost"
                        onClick={() => {
                            setShowEditor(true);
                            setEditNote(null);
                        }}
                    >
                        + New Note
                    </button>
                    <button
                        onClick={() => {
                            setShowEditor(true);
                            setEditNote(null);
                        }}
                        style={{
                            padding: "10px 22px",
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg,#6366f1,#ec4899)",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            fontFamily: "Syne,sans-serif",
                            fontWeight: 700,
                            fontSize: 14,
                        }}
                    >
                        📝 Write Note
                    </button>
                </div>
            </div>

            {/* View tabs */}
            <div
                style={{
                    display: "flex",
                    gap: 4,
                    marginBottom: 24,
                    background: "var(--c-bg-panel)",
                    border: "1px solid var(--c-border)",
                    borderRadius: 12,
                    padding: 4,
                    width: "fit-content",
                }}
            >
                {VIEWS.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setView(v.id)}
                        style={{
                            padding: "9px 22px",
                            borderRadius: 9,
                            cursor: "pointer",
                            background:
                                view === v.id
                                    ? "linear-gradient(135deg,#6366f1,#ec4899)"
                                    : "transparent",
                            border: "none",
                            color:
                                view === v.id ? "white" : "var(--c-text-muted)",
                            fontFamily: "Syne,sans-serif",
                            fontWeight: view === v.id ? 700 : 400,
                            fontSize: 13,
                            transition: "all 0.2s",
                        }}
                    >
                        {v.icon} {v.label}
                        {v.id === "revision" &&
                            notes.filter((n) => n.revision).length > 0 && (
                                <span
                                    style={{
                                        marginLeft: 8,
                                        background: "rgba(255,255,255,0.25)",
                                        color: "white",
                                        borderRadius: 10,
                                        padding: "1px 7px",
                                        fontSize: 10,
                                        fontWeight: 700,
                                    }}
                                >
                                    {notes.filter((n) => n.revision).length}
                                </span>
                            )}
                    </button>
                ))}
            </div>

            {/* Notes view */}
            {view === "notes" && (
                <>
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            marginBottom: 20,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                flex: "1 1 220px",
                                minWidth: 180,
                            }}
                        >
                            <span
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--c-text-dim)",
                                    fontSize: 14,
                                }}
                            >
                                🔍
                            </span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search notes..."
                                style={{
                                    width: "100%",
                                    background: "var(--c-bg-panel)",
                                    border: "1px solid var(--c-border)",
                                    borderRadius: 10,
                                    color: "var(--c-text-primary)",
                                    padding: "9px 12px 9px 36px",
                                    fontSize: 13,
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#6366f1")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor =
                                        "var(--c-border)")
                                }
                            />
                        </div>
                        <select
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            style={{
                                background: "var(--c-bg-panel)",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-primary)",
                                padding: "9px 12px",
                                borderRadius: 10,
                                fontSize: 13,
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            <option value="all">All Topics</option>
                            {TAGS.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterDiff}
                            onChange={(e) => setFilterDiff(e.target.value)}
                            style={{
                                background: "var(--c-bg-panel)",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-primary)",
                                padding: "9px 12px",
                                borderRadius: 10,
                                fontSize: 13,
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            <option value="all">All Levels</option>
                            {DIFFICULTY.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                background: "var(--c-bg-panel)",
                                border: "1px solid var(--c-border)",
                                color: "var(--c-text-primary)",
                                padding: "9px 12px",
                                borderRadius: 10,
                                fontSize: 13,
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            <option value="updated">
                                Sort: Recently Updated
                            </option>
                            <option value="created">
                                Sort: Recently Created
                            </option>
                            <option value="words">Sort: Most Words</option>
                        </select>
                        <div
                            style={{
                                fontSize: 12,
                                color: "var(--c-text-dim)",
                                marginLeft: "auto",
                            }}
                        >
                            {filtered.length} of {notes.length} notes
                        </div>
                    </div>

                    {loading ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "40vh",
                                gap: 16,
                                flexDirection: "column",
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    border: "3px solid var(--c-border)",
                                    borderTopColor: "#6366f1",
                                    animation: "spin 0.8s linear infinite",
                                }}
                            />
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            <div
                                style={{
                                    color: "var(--c-text-muted)",
                                    fontFamily: "Syne,sans-serif",
                                    fontSize: 14,
                                }}
                            >
                                Loading notes...
                            </div>
                        </div>
                    ) : notes.length === 0 ? (
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
                            <span style={{ fontSize: 60 }}>📝</span>
                            <div
                                style={{
                                    fontFamily: "Syne,sans-serif",
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: "var(--c-text-primary)",
                                }}
                            >
                                No notes yet
                            </div>
                            <div
                                style={{
                                    color: "var(--c-text-muted)",
                                    fontSize: 14,
                                }}
                            >
                                Start writing your first revision note!
                            </div>
                            <button
                                onClick={() => setShowEditor(true)}
                                style={{
                                    padding: "12px 28px",
                                    borderRadius: 10,
                                    marginTop: 8,
                                    background:
                                        "linear-gradient(135deg,#6366f1,#ec4899)",
                                    border: "none",
                                    color: "white",
                                    cursor: "pointer",
                                    fontFamily: "Syne,sans-serif",
                                    fontWeight: 700,
                                    fontSize: 15,
                                }}
                            >
                                📝 Write First Note
                            </button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "30vh",
                                gap: 12,
                            }}
                        >
                            <span style={{ fontSize: 40 }}>🔍</span>
                            <div
                                style={{
                                    color: "var(--c-text-muted)",
                                    fontSize: 14,
                                }}
                            >
                                No notes match your search
                            </div>
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilterTag("all");
                                    setFilterDiff("all");
                                }}
                                style={{
                                    padding: "8px 20px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    background: "transparent",
                                    border: "1px solid var(--c-border)",
                                    color: "var(--c-text-muted)",
                                    fontSize: 13,
                                }}
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill,minmax(300px,1fr))",
                                gap: 16,
                            }}
                        >
                            {filtered.map((note) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleRevision={handleToggleRevision}
                                    onTogglePin={handleTogglePin}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {view === "revision" && (
                <RevisionBook
                    notes={notes}
                    onEdit={handleEdit}
                    onToggleRevision={handleToggleRevision}
                />
            )}
            {view === "analytics" && <AnalyticsView notes={notes} />}
        </>
    );
}
