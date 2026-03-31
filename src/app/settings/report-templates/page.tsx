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
  const [form, setForm] = useState({ name: "", fields: DEFAULT_FIELDS, isDefault: false });

  useEffect(() => {
    fetch("/api/report-templates")
      .then((res) => res.json())
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    await fetch("/api/report-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setLoading(true);
    fetch("/api/report-templates")
      .then((res) => res.json())
      .then(setTemplates)
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Report Templates</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <button
            onClick={() => setShowForm(true)}
            className="mb-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            New Template
          </button>
          <ul className="space-y-4">
            {templates.map((tpl) => (
              <li key={tpl.id} className="border rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{tpl.name}</span>
                  {tpl.isDefault && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Default</span>}
                </div>
                <div className="text-xs text-slate-500">Fields: {tpl.fields.join(", ")}</div>
                {/* TODO: Add edit/delete buttons */}
              </li>
            ))}
          </ul>
        </>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Template</h2>
            <input
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="Template Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="Fields (comma separated)"
              value={form.fields.join(", ")}
              onChange={(e) => setForm({ ...form, fields: e.target.value.split(",").map(f => f.trim()).filter(Boolean) })}
            />
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Set as default
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
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
