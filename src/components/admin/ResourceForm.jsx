"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { getResource } from "@/lib/admin/resources";
import { adminFetch, firstError } from "./adminFetch";
import { ImageField, ImagesField, RichTextField, RowsField } from "./fields";
import { DeleteButton } from "./DeleteButton";

// <input type="datetime-local"> works in the browser's local time; the API stores ISO (UTC).
const toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function initialValues(resource, row) {
    const values = {};
    for (const f of resource.fields) {
        const v = row ? row[f.name] : undefined;
        if (f.type === "switch") values[f.name] = row ? Boolean(v) : Boolean(f.default);
        else if (f.type === "rows" || f.type === "images") values[f.name] = Array.isArray(v) ? v : [];
        else if (f.type === "datetime") values[f.name] = toLocalInput(v);
        else if (v === null || v === undefined) values[f.name] = row ? "" : (f.default ?? "");
        else values[f.name] = String(v);
    }
    return values;
}

export function ResourceForm({ resourceKey, row, options = {} }) {
    const router = useRouter();
    const resource = getResource(resourceKey);
    const [values, setValues] = useState(() => initialValues(resource, row));
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const tabs = resource.tabs ?? null;
    const [tab, setTab] = useState(tabs?.[0]);

    const errorTabs = useMemo(() => {
        const set = new Set();
        for (const f of resource.fields) {
            if (Object.keys(errors).some((k) => k === f.name || k.startsWith(`${f.name}.`))) set.add(f.tab);
        }
        return set;
    }, [errors, resource.fields]);

    const set = (name, v) => setValues((s) => ({ ...s, [name]: v }));

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setNotice("");
        setErrors({});
        const body = { ...values };
        for (const f of resource.fields) {
            if (f.type === "datetime") body[f.name] = values[f.name] ? new Date(values[f.name]).toISOString() : null;
        }
        const res = await adminFetch(row ? `/api/admin/${resourceKey}/${row.id}` : `/api/admin/${resourceKey}`, {
            method: row ? "PUT" : "POST",
            body,
        });
        setBusy(false);
        if (!res.ok) {
            setErrors(res.errors || {});
            setNotice(firstError(res));
            // Jump to the first tab with a problem.
            if (tabs) {
                const bad = resource.fields.find((f) => Object.keys(res.errors || {}).some((k) => k === f.name || k.startsWith(`${f.name}.`)));
                if (bad) setTab(bad.tab);
            }
            return;
        }
        router.push(`/admin/${resourceKey}`);
        router.refresh();
    }

    const visible = tabs ? resource.fields.filter((f) => f.tab === tab) : resource.fields;

    return (
        <form onSubmit={submit} noValidate className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="font-serif text-3xl text-emerald-royal">
                    {row ? `Edit ${resource.singular}` : `Add ${resource.singular}`}
                </h1>
                <div className="flex gap-2">
                    <Link href={`/admin/${resourceKey}`} className="admin-btn"><ChevronLeft size={16} /> Back</Link>
                    {row && (
                        <DeleteButton
                            resource={resourceKey}
                            id={row.id}
                            label={`this ${resource.singular}`}
                            warning={resourceKey === "categories" ? "Deleting a category also deletes all of its products." : undefined}
                            redirectTo={`/admin/${resourceKey}`}
                        />
                    )}
                </div>
            </div>

            {notice && <p role="alert" className="rounded-lg bg-rose-50 text-rose-700 text-sm font-bold px-4 py-3">{notice}</p>}

            <div className="admin-card">
                {tabs && (
                    <div className="flex gap-1 overflow-x-auto border-b border-stone-200 px-3 pt-2" role="tablist">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                type="button"
                                role="tab"
                                aria-selected={tab === t}
                                onClick={() => setTab(t)}
                                className={`shrink-0 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                                    tab === t ? "border-heritage-gold text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"
                                }`}
                            >
                                {t}
                                {errorTabs.has(t) && <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-rose-500" aria-label="has errors" />}
                            </button>
                        ))}
                    </div>
                )}

                <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-x-5 gap-y-5">
                    {visible.map((f) => {
                        const id = `f-${f.name}`;
                        const err = errors[f.name]?.[0];
                        const wide = !f.half;
                        return (
                            <div key={f.name} className={wide ? "sm:col-span-2" : ""}>
                                {f.type === "switch" ? (
                                    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                                        <input
                                            id={id}
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={values[f.name]}
                                            onChange={(e) => set(f.name, e.target.checked)}
                                        />
                                        <span className="relative w-10 h-6 rounded-full bg-stone-300 peer-checked:bg-emerald-royal transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-heritage-gold" />
                                        <span className="text-sm font-bold text-stone-700">{f.label}</span>
                                    </label>
                                ) : (
                                    <>
                                        <label className="admin-label" htmlFor={id}>
                                            {f.label}{f.required && <span className="text-rose-600"> *</span>}
                                        </label>
                                        <Field field={f} id={id} value={values[f.name]} onChange={(v) => set(f.name, v)} invalid={!!err} options={options[f.name]} folder={resource.folder} errors={errors} />
                                    </>
                                )}
                                {err && <p className="admin-error">{err}</p>}
                                {f.hint && <p className="admin-hint">{f.hint}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Link href={`/admin/${resourceKey}`} className="admin-btn">Cancel</Link>
                <button type="submit" disabled={busy} className="admin-btn-primary">
                    {busy && <Loader2 size={15} className="animate-spin" />} {row ? "Save changes" : `Create ${resource.singular}`}
                </button>
            </div>
        </form>
    );
}

function Field({ field: f, id, value, onChange, invalid, options, folder, errors }) {
    const common = { id, className: "admin-input", "aria-invalid": invalid || undefined };
    switch (f.type) {
        case "textarea":
            return <textarea {...common} rows={f.rows ?? 4} value={value} onChange={(e) => onChange(e.target.value)} />;
        case "richtext":
            return <RichTextField id={id} value={value} onChange={onChange} invalid={invalid} />;
        case "number":
        case "money":
            return (
                <div className="relative">
                    {f.type === "money" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">৳</span>}
                    <input
                        {...common}
                        className={`admin-input ${f.type === "money" ? "pl-7" : ""}`}
                        type="number"
                        inputMode="decimal"
                        step={f.step ?? (f.type === "money" ? "0.01" : "1")}
                        min={f.min}
                        readOnly={f.readOnly}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                </div>
            );
        case "select":
            return (
                <select {...common} value={value} onChange={(e) => onChange(e.target.value)}>
                    {!f.required && <option value="">—</option>}
                    {Object.entries(f.options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
            );
        case "relation":
            return (
                <select {...common} value={value} onChange={(e) => onChange(e.target.value)}>
                    <option value="">{f.required ? `Choose ${f.label.toLowerCase()}…` : "— None —"}</option>
                    {(options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            );
        case "datetime":
            return <input {...common} type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} />;
        case "image":
            return <ImageField id={id} value={value} onChange={onChange} folder={folder} invalid={invalid} />;
        case "images":
            return <ImagesField id={id} value={value} onChange={onChange} folder={folder} />;
        case "rows":
            return <RowsField id={id} name={f.name} value={value} onChange={onChange} columns={f.columns} addLabel={f.addLabel} errors={errors} />;
        default:
            return (
                <input
                    {...common}
                    type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
                    maxLength={f.max}
                    readOnly={f.readOnly}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
    }
}
