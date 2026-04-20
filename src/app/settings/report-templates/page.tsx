"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ReportTemplate {
  id: string;
  name: string;
  fields: string[];
  isDefault: boolean;
  userId?: string;
}

const DEFAULT_FIELDS = [
  "chiefComplaint",
  "symptoms",
  "medicalHistory",
  "examination",
  "assessment",
  "diagnosis",
  "treatmentPlan",
  "medications",
  "followUp",
];

export default function ReportTemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", fields: DEFAULT_FIELDS, isDefault: false });

  const fetchTemplates = () => {
    setLoading(true);
    fetch("/api/report-templates")
      .then((res) => res.json())
      .then(setTemplates)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async () => {
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/report-templates/${editingId}` : "/api/report-templates";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", fields: DEFAULT_FIELDS, isDefault: false });
    fetchTemplates();
  };

  const handleEdit = (tpl: ReportTemplate) => {
    setEditingId(tpl.id);
    setForm({ name: tpl.name, fields: tpl.fields, isDefault: tpl.isDefault });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    await fetch(`/api/report-templates/${id}`, {
      method: "DELETE",
    });
    fetchTemplates();
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ name: "", fields: DEFAULT_FIELDS, isDefault: false });
    setShowForm(true);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Report Templates</h1>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm font-medium"
        >
          New Template
        </button>
      </div>

      {loading && templates.length === 0 ? (
        <div className="py-10 text-center text-slate-500">Loading templates...</div>
      ) : (
        <ul className="space-y-4">
          {templates.map((tpl) => (
            <li key={tpl.id} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{tpl.name}</span>
                    {tpl.isDefault && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">
                    Fields: {tpl.fields.join(", ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(tpl)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
          {!loading && templates.length === 0 && (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              No templates found. Create one to get started.
            </div>
          )}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-5 text-slate-800">
              {editingId ? "Edit Template" : "New Template"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Standard Consultation"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fields (comma separated)</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition h-32"
                  placeholder="chiefComplaint, symptoms, diagnosis..."
                  value={form.fields.join(", ")}
                  onChange={(e) => setForm({ ...form, fields: e.target.value.split(",").map(f => f.trim()).filter(Boolean) })}
                />
                <p className="text-[10px] text-slate-400 mt-1">These fields will be used by the AI to structure the medical report.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition">Set as default template</span>
              </label>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold shadow-md"
              >
                {editingId ? "Save Changes" : "Create Template"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
