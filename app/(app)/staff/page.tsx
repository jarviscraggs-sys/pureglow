"use client";
import { useEffect, useState, useCallback } from "react";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30",
  manager: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  staff: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });
  const [saving, setSaving] = useState(false);

  const loadStaff = useCallback(async () => {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  async function toggleActive(id: number, isActive: number) {
    await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadStaff();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "staff" });
      loadStaff();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff</h1>
          <p className="text-white/40 text-sm mt-1">{staff.length} team members</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          + Add Staff
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Name</th>
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Email</th>
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Role</th>
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f97316]/20 flex items-center justify-center text-[#f97316] text-sm font-bold">
                      {s.name[0]}
                    </div>
                    <span className="text-white font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/60 text-sm">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${ROLE_COLORS[s.role] || ROLE_COLORS.staff}`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${s.is_active ? "text-emerald-400" : "text-red-400"}`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    className="text-white/40 hover:text-white/70 text-sm transition-colors"
                  >
                    {s.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold text-lg mb-4">Add Staff Member</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-white/60 text-sm mb-1">Full Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Password</label>
                <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 border border-white/10 text-white text-sm py-2 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#f97316] text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
                  {saving ? "Saving…" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
