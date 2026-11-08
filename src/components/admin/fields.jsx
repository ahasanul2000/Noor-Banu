"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Plus, Quote, Trash2, X } from "lucide-react";
import { getOptimizedImage } from "@/lib/utils";
import { uploadImage } from "./uploadImage";

// ---------- Images ----------

export function ImageField({ id, value, onChange, folder, invalid }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function pick(e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setBusy(true);
        setError("");
        try {
            onChange(await uploadImage(file, folder));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <div className={`flex items-center gap-4 rounded-xl border border-dashed p-3 ${invalid ? "border-rose-400" : "border-stone-300"}`}>
                {value ? (
                    <img src={getOptimizedImage(value)} alt="" className="w-20 h-24 rounded-lg object-cover bg-stone-100" />
                ) : (
                    <span className="w-20 h-24 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400"><ImagePlus size={22} /></span>
                )}
                <div className="flex flex-wrap gap-2">
                    <label className="admin-btn cursor-pointer">
                        {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                        {value ? "Replace" : "Upload image"}
                        <input id={id} type="file" accept="image/*" className="sr-only" onChange={pick} disabled={busy} />
                    </label>
                    {value && (
                        <button type="button" className="admin-btn-danger" onClick={() => onChange("")}><X size={15} /> Remove</button>
                    )}
                </div>
            </div>
            {error && <p className="admin-error">{error}</p>}
        </div>
    );
}

export function ImagesField({ id, value, onChange, folder }) {
    const images = Array.isArray(value) ? value : [];
    const [busy, setBusy] = useState(0);
    const [error, setError] = useState("");
    const latest = useRef(images);
    latest.current = images;

    async function pick(e) {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        setError("");
        setBusy(files.length);
        // One request per file, in order.
        for (const file of files) {
            try {
                const path = await uploadImage(file, folder);
                onChange([...latest.current, path]);
                latest.current = [...latest.current, path];
            } catch (err) {
                setError(`${file.name}: ${err.message}`);
            }
            setBusy((n) => n - 1);
        }
    }

    const move = (i, d) => {
        const next = [...images];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        onChange(next);
    };

    return (
        <div>
            <div className="flex flex-wrap gap-3">
                {images.map((src, i) => (
                    <figure key={`${src}-${i}`} className="relative w-24">
                        <img src={getOptimizedImage(src)} alt="" className="w-24 h-28 rounded-lg object-cover bg-stone-100" />
                        <figcaption className="flex justify-between mt-1">
                            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 text-stone-500 disabled:opacity-30" aria-label="Move left"><ArrowLeft size={14} /></button>
                            <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="p-1 text-rose-600" aria-label="Remove image"><Trash2 size={14} /></button>
                            <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="p-1 text-stone-500 disabled:opacity-30" aria-label="Move right"><ArrowRight size={14} /></button>
                        </figcaption>
                    </figure>
                ))}
                <label className="w-24 h-28 rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-xs font-bold text-stone-500 cursor-pointer hover:border-stone-400">
                    {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                    {busy ? `${busy} left` : "Add photos"}
                    <input id={id} type="file" accept="image/*" multiple className="sr-only" onChange={pick} disabled={busy > 0} />
                </label>
            </div>
            {error && <p className="admin-error">{error}</p>}
        </div>
    );
}

// ---------- Repeating rows (sizes, colours, details) ----------

export function RowsField({ id, value, onChange, columns, addLabel = "Add row", errors = {}, name }) {
    const rows = Array.isArray(value) ? value : [];
    const blankRow = () => Object.fromEntries(columns.map((c) => [c.key, c.type === "number" ? 0 : ""]));
    const setCell = (i, key, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));

    return (
        <div id={id} className="space-y-2">
            {rows.length > 0 && (
                <div className="hidden sm:grid gap-2 text-xs font-bold text-stone-500" style={{ gridTemplateColumns: `${columns.map((c) => (c.type === "number" ? "8rem" : "1fr")).join(" ")} 2.5rem` }}>
                    {columns.map((c) => <span key={c.key}>{c.label}</span>)}
                </div>
            )}
            {rows.map((row, i) => (
                <div key={i} className="grid gap-2 items-start" style={{ gridTemplateColumns: `${columns.map((c) => (c.type === "number" ? "8rem" : "1fr")).join(" ")} 2.5rem` }}>
                    {columns.map((c) => (
                        <div key={c.key}>
                            <input
                                className="admin-input"
                                type={c.type === "number" ? "number" : "text"}
                                min={c.type === "number" ? 0 : undefined}
                                value={row[c.key] ?? ""}
                                placeholder={c.label}
                                aria-label={c.label}
                                aria-invalid={!!errors[`${name}.${i}.${c.key}`]}
                                onChange={(e) => setCell(i, c.key, e.target.value)}
                            />
                            {errors[`${name}.${i}.${c.key}`] && <p className="admin-error">{errors[`${name}.${i}.${c.key}`][0]}</p>}
                        </div>
                    ))}
                    <button type="button" className="admin-btn-danger !px-2.5 justify-center h-[2.4rem]" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove row">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" className="admin-btn" onClick={() => onChange([...rows, blankRow()])}><Plus size={15} /> {addLabel}</button>
        </div>
    );
}

// ---------- Rich text (blog) ----------

const TOOLS = [
    { cmd: "bold", icon: Bold, label: "Bold" },
    { cmd: "italic", icon: Italic, label: "Italic" },
    { cmd: "formatBlock", arg: "H2", icon: Heading2, label: "Heading" },
    { cmd: "formatBlock", arg: "H3", icon: Heading3, label: "Subheading" },
    { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
    { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
    { cmd: "formatBlock", arg: "BLOCKQUOTE", icon: Quote, label: "Quote" },
];

export function RichTextField({ id, value, onChange, invalid }) {
    const ref = useRef(null);
    const [html, setHtml] = useState(false);

    // Load the initial HTML once; after that the editor owns its content.
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== (value || "")) ref.current.innerHTML = value || "";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [html]);

    const run = (cmd, arg) => {
        ref.current?.focus();
        document.execCommand(cmd, false, arg);
        onChange(ref.current?.innerHTML ?? "");
    };

    return (
        <div className={`rounded-xl border bg-white overflow-hidden ${invalid ? "border-rose-400" : "border-stone-300"}`}>
            <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50 px-2 py-1.5">
                {!html && TOOLS.map((t) => (
                    <button key={t.label} type="button" title={t.label} aria-label={t.label} className="p-1.5 rounded hover:bg-stone-200 text-stone-600" onMouseDown={(e) => e.preventDefault()} onClick={() => run(t.cmd, t.arg)}>
                        <t.icon size={16} />
                    </button>
                ))}
                {!html && (
                    <button type="button" title="Link" aria-label="Link" className="p-1.5 rounded hover:bg-stone-200 text-stone-600" onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { const url = prompt("Link address (https://…)"); if (url) run("createLink", url); }}>
                        <Link2 size={16} />
                    </button>
                )}
                <button type="button" className="ml-auto text-xs font-bold text-stone-500 hover:text-stone-800 px-2" onClick={() => setHtml((h) => !h)}>
                    {html ? "Visual editor" : "Edit HTML"}
                </button>
            </div>
            {html ? (
                <textarea id={id} className="w-full min-h-72 p-4 font-mono text-xs focus:outline-none" value={value || ""} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <div
                    id={id}
                    ref={ref}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    className="admin-prose min-h-72 p-4 focus:outline-none text-sm leading-relaxed"
                    onInput={(e) => onChange(e.currentTarget.innerHTML)}
                />
            )}
        </div>
    );
}
