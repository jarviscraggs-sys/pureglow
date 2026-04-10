"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skin_type: number;
  uv_total_mins: number;
  active_package: string | null;
  active_mins: number | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", skinType: "2", notes: "" });
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
  }, [q]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        skinType: Number(form.skinType),
        notes: form.notes,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", skinType: "2", notes: "" });
    loadCustomers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-white/40 text-sm mt-1">{customers.length} customers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#f97316]/50"
        />
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Name</th>
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Contact</th>
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Active Package</th>
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">UV Mins</th>
              <th className="text-left text-white/40 text-xs px-4 py-3 font-medium uppercase tracking-wider">Skin Type</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/2"}`}>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{c.first_name} {c.last_name}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white/60 text-sm">{c.email || "—"}</p>
                  <p className="text-white/40 text-xs">{c.phone || "—"}</p>
                </td>
                <td className="px-4 py-3">
                  {c.active_package ? (
                    <div>
                      <span className="text-[#f97316] text-sm">{c.active_package}</span>
                      <p className="text-white/40 text-xs">{c.active_mins} mins left</p>
                    </div>
                  ) : (
                    <span className="text-white/30 text-sm">No package</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-white/60 text-sm">{c.uv_total_mins} mins</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white/60 text-sm">Type {c.skin_type}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/customers/${c.id}`}
                    className="text-[#f97316] hover:text-[#ea6c0a] text-sm transition-colors"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-12 text-white/30">No customers found.</div>
        )}
      </div>

      {/* New Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-4">New Customer</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1">First Name</label>
                  <input
                    type="text" required value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Last Name</label>
                  <input
                    type="text" required value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Email</label>
                <input
                  type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Phone</label>
                <input
                  type="text" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Skin Type (1–6)</label>
                <select
                  value={form.skinType}
                  onChange={(e) => setForm({ ...form, skinType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((t) => <option key={t} value={t}>Type {t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 border border-white/10 text-white text-sm py-2 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
                  {saving ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
