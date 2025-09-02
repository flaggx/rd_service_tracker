import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { api } from "../fetch";

// Client-side schema for validation
const TicketSchema = z.object({
    accountName: z.string().min(1, "Account Name is required"),
    city: z.string().min(1, "City is required"),
    contactPerson: z.string().optional(),
    contactInfo: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    workType: z.enum(["INSTALL", "REMOVAL"]).optional().or(z.literal("").transform(() => undefined)),
    lease: z.boolean().optional(),
    underWarranty: z.boolean().optional(),
    machineModelOrType: z.string().optional(),
    issueDescription: z.string().optional(),
    requestingTechName: z.string().optional(),
    pictures: z.array(z.string().url("Each picture URL must be a valid URL")).optional()
});

const initialState = {
    accountName: "",
    city: "",
    contactPerson: "",
    contactInfo: "",
    priority: "LOW",
    workType: "",
    lease: false,
    underWarranty: false,
    machineModelOrType: "",
    issueDescription: "",
    requestingTechName: "",
    picturesText: "" // comma or newline separated URLs
};

export default function CreateTicketForm({ onCreated }) {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [notice, setNotice] = useState({ type: "", text: "" });

    // Drag & drop previews (UI only)
    const [droppedFiles, setDroppedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pictures = useMemo(() => {
        if (!form.picturesText.trim()) return [];
        return form.picturesText
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(Boolean);
    }, [form.picturesText]);

    function buildPayload() {
        const payload = {
            accountName: form.accountName.trim(),
            city: form.city.trim(),
            contactPerson: form.contactPerson.trim() || undefined,
            contactInfo: form.contactInfo.trim() || undefined,
            priority: form.priority || undefined,
            workType: form.workType || undefined,
            lease: !!form.lease,
            underWarranty: !!form.underWarranty,
            machineModelOrType: form.machineModelOrType.trim() || undefined,
            issueDescription: form.issueDescription.trim() || undefined,
            requestingTechName: form.requestingTechName.trim() || undefined,
            pictures
        };
        return payload;
    }

    function mapServerErrorsToFields(serverErrors = []) {
        const fieldErrors = {};
        for (const er of serverErrors) {
            const rawPath = typeof er.path === "string" ? er.path : (Array.isArray(er.path) ? er.path.join(".") : "");
            let key = rawPath.replace(/^body\./, "").replace(/^params\./, "").replace(/^query\./, "");
            if (key.startsWith("pictures.")) key = "pictures";
            if (key && !fieldErrors[key]) {
                fieldErrors[key] = er.message || "Invalid value";
            }
        }
        return fieldErrors;
    }

    function validateAll() {
        const payload = buildPayload();
        const result = TicketSchema.safeParse(payload);
        if (result.success) {
            setErrors({});
            return { ok: true, data: payload };
        }
        const fieldErrors = {};
        for (const issue of result.error.issues) {
            const key = String(issue.path[0]);
            fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return { ok: false, errors: fieldErrors };
    }

    function updateField(name, value) {
        setForm(prev => ({ ...prev, [name]: value }));
    }

    function onFieldBlur() {
        validateAll();
    }

    async function handleUploadImages() {
        if (droppedFiles.length === 0) {
            setNotice({ type: "warn", text: "Drop or choose images before uploading." });
            return;
        }
        setUploading(true);
        setNotice({ type: "", text: "" });
        try {
            const fd = new FormData();
            droppedFiles.forEach(f => fd.append("files", f, f.name));
            // Use the API helper's raw fetch with credentials baked in
            const res = await fetch("/api/uploads", {
                method: "POST",
                body: fd,
                credentials: "include"
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message || "Upload failed");
            const urls = (json?.uploaded || []).map(u => u.url);
            const merged = [...pictures, ...urls];
            updateField("picturesText", merged.join(", "));
            setNotice({ type: "success", text: `Uploaded ${urls.length} file(s)` });
            setDroppedFiles([]);
        } catch (err) {
            console.error("Upload failed:", err);
            setNotice({ type: "error", text: err?.message || "Upload failed" });
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setNotice({ type: "", text: "" });

        const { ok, data } = validateAll();
        if (!ok) {
            setNotice({ type: "error", text: "Please fix the highlighted issues." });
            return;
        }

        setSubmitting(true);
        try {
            const created = await api.tickets.create(data);
            setNotice({ type: "success", text: `Ticket #${created.id} created` });
            setForm(initialState);
            setDroppedFiles([]);
            setErrors({});
            onCreated?.(created);
        } catch (err) {
            if (err?.status === 400 && Array.isArray(err?.body?.errors)) {
                const fieldErrors = mapServerErrorsToFields(err.body.errors);
                setErrors(fieldErrors);
                setNotice({ type: "error", text: err?.body?.message || "Validation error" });
            } else {
                console.error("Create ticket failed:", err);
                setNotice({ type: "error", text: err?.body?.message || "Failed to create ticket" });
            }
        } finally {
            setSubmitting(false);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        setIsDragging(true);
    }
    function handleDragLeave(e) {
        e.preventDefault();
        setIsDragging(false);
    }
    function handleDrop(e) {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        const images = files.filter(f => f.type.startsWith("image/"));
        if (images.length > 0) {
            setDroppedFiles(prev => [...prev, ...images]);
            setNotice({
                type: "info",
                text: "Images added locally for preview. Click 'Upload images' to store and get URLs."
            });
        }
    }
    function handleFileInput(e) {
        const files = Array.from(e.target.files || []);
        const images = files.filter(f => f.type.startsWith("image/"));
        if (images.length > 0) {
            setDroppedFiles(prev => [...prev, ...images]);
            setNotice({
                type: "info",
                text: "Images added locally for preview. Click 'Upload images' to store and get URLs."
            });
        }
        e.target.value = "";
    }
    function removeDroppedFile(idx) {
        setDroppedFiles(prev => prev.filter((_, i) => i !== idx));
    }

    const previews = useMemo(
        () =>
            droppedFiles.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file),
                sizeKB: Math.round(file.size / 1024)
            })),
        [droppedFiles]
    );

    useEffect(() => {
        return () => {
            previews.forEach(p => URL.revokeObjectURL(p.url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fieldStyle = { display: "flex", flexDirection: "column", gap: 4 };
    const errStyle = { color: "#c0392b", fontSize: "0.85em" };

    return (
        <form onSubmit={handleSubmit} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Create Ticket</h3>

            {notice.text && (
                <div
                    style={{
                        marginBottom: 8,
                        padding: 8,
                        color: "white",
                        background:
                            notice.type === "success" ? "#27ae60" :
                                notice.type === "warn"    ? "#f39c12" :
                                    notice.type === "error"   ? "#c0392b" : "#2980b9"
                    }}
                >
                    {notice.text}
                </div>
            )}

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <label style={fieldStyle}>
                    <span>Account Name *</span>
                    <input
                        value={form.accountName}
                        onChange={e => updateField("accountName", e.target.value)}
                        onBlur={onFieldBlur}
                        placeholder="Acme Corp"
                        aria-invalid={!!errors.accountName}
                        aria-describedby={errors.accountName ? "err-accountName" : undefined}
                        required
                    />
                    {errors.accountName && <span id="err-accountName" style={errStyle}>{errors.accountName}</span>}
                </label>

                <label style={fieldStyle}>
                    <span>City *</span>
                    <input
                        value={form.city}
                        onChange={e => updateField("city", e.target.value)}
                        onBlur={onFieldBlur}
                        placeholder="Springfield"
                        aria-invalid={!!errors.city}
                        aria-describedby={errors.city ? "err-city" : undefined}
                        required
                    />
                    {errors.city && <span id="err-city" style={errStyle}>{errors.city}</span>}
                </label>

                <label style={fieldStyle}>
                    <span>Contact Person</span>
                    <input
                        value={form.contactPerson}
                        onChange={e => updateField("contactPerson", e.target.value)}
                        placeholder="Jane Doe"
                    />
                </label>

                <label style={fieldStyle}>
                    <span>Contact Info</span>
                    <input
                        value={form.contactInfo}
                        onChange={e => updateField("contactInfo", e.target.value)}
                        placeholder="jane@example.com, (555) 123-4567"
                    />
                </label>

                <label style={fieldStyle}>
                    <span>Priority</span>
                    <select
                        value={form.priority}
                        onChange={e => updateField("priority", e.target.value)}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </select>
                </label>

                <label style={fieldStyle}>
                    <span>Work Type</span>
                    <select
                        value={form.workType}
                        onChange={e => updateField("workType", e.target.value)}
                    >
                        <option value="">(Select)</option>
                        <option value="INSTALL">Install</option>
                        <option value="REMOVAL">Removal</option>
                    </select>
                    {errors.workType && <span style={errStyle}>{errors.workType}</span>}
                </label>

                <label style={{ ...fieldStyle, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <input
                        type="checkbox"
                        checked={form.lease}
                        onChange={e => updateField("lease", e.target.checked)}
                    />
                    <span>Lease?</span>
                </label>

                <label style={{ ...fieldStyle, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <input
                        type="checkbox"
                        checked={form.underWarranty}
                        onChange={e => updateField("underWarranty", e.target.checked)}
                    />
                    <span>Under Warranty?</span>
                </label>

                <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                    <span>Machine Model / Serial or Type</span>
                    <input
                        value={form.machineModelOrType}
                        onChange={e => updateField("machineModelOrType", e.target.value)}
                        placeholder="Model X / SN 123456"
                    />
                </label>

                <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                    <span>Description of Issue</span>
                    <textarea
                        value={form.issueDescription}
                        onChange={e => updateField("issueDescription", e.target.value)}
                        placeholder="Describe the issue..."
                        rows={3}
                    />
                </label>

                <label style={fieldStyle}>
                    <span>Requesting Tech Name</span>
                    <input
                        value={form.requestingTechName}
                        onChange={e => updateField("requestingTechName", e.target.value)}
                        placeholder="John Smith"
                    />
                </label>

                <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                    <span>Pictures of Issue (URLs, comma or newline separated)</span>
                    <textarea
                        value={form.picturesText}
                        onChange={e => updateField("picturesText", e.target.value)}
                        onBlur={onFieldBlur}
                        placeholder="https://.../image1.jpg, https://.../image2.jpg"
                        rows={3}
                        aria-invalid={!!errors.pictures}
                        aria-describedby={errors.pictures ? "err-pictures" : undefined}
                    />
                    {errors.pictures && <span id="err-pictures" style={errStyle}>{errors.pictures}</span>}
                </label>
            </div>

            {/* Drag & Drop area with upload action */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    marginTop: 12,
                    padding: 12,
                    border: `2px dashed ${isDragging ? "#2980b9" : "#ccc"}`,
                    borderRadius: 6,
                    background: isDragging ? "#ecf6fe" : "#fafafa"
                }}
            >
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Drag & drop images here</div>
                <div style={{ fontSize: "0.9em", color: "#555", marginBottom: 8 }}>
                    Click "Upload images" to store them and insert URLs automatically.
                </div>
                <input type="file" accept="image/*" multiple onChange={handleFileInput} />
                {previews.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                        {previews.map((p, idx) => (
                            <div key={p.url} style={{ width: 120, border: "1px solid #eee", borderRadius: 4, padding: 6 }}>
                                <img src={p.url} alt={p.name} style={{ width: "100%", height: 80, objectFit: "cover" }} />
                                <div title={p.name} style={{ fontSize: "0.8em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {p.name}
                                </div>
                                <div style={{ fontSize: "0.75em", color: "#888" }}>{p.sizeKB} KB</div>
                                <button type="button" onClick={() => removeDroppedFile(idx)} style={{ marginTop: 4, width: "100%" }}>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button type="button" onClick={handleUploadImages} disabled={uploading || droppedFiles.length === 0}>
                        {uploading ? "Uploading..." : "Upload images"}
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Ticket"}
                </button>
            </div>
        </form>
    );
}