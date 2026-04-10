"use client";
import { useEffect, useState, useCallback } from "react";

interface Deal {
  id: number;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  is_active: number;
}

function formatDate(s: string) {
  return s ? new Date(s).toLocaleDateString("en-GB") : "—";
}

function isExpired(until: string) {
  return until && new Date(until) < new Date();
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", discountType: "percent", discountValue: "", validFrom: "", validUntil: "" });
  const [saving, setSaving] = useState(false);

  const loadDeals = useCallback(async () => {
    const res = await fetch("/api/deals");
    setDeals(await res.json());
  }, []);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, discountValue: Number(form.discountValue) }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", description: "", discountType: "percent", discountValue: "", validFrom: "", validUntil: "" });
    loadDeals();
  }

  async function toggleDeal(id: number, isActive: number) {
    await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadDeals();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Deals & Promotions</h1>
          <p className="text-white/40 text-sm mt-1">{deals.filter((d) => d.is_active).length} active deals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          + New Deal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal) => {
          const expired = isExpired(deal.valid_until);
          return (
            <div key={deal.id} className={`bg-white/5 border rounded-xl p-5 ${deal.is_active && !expired ? "border-[#f97316]/30" : "border-white/10 opacity-60"}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-semibold">{deal.name}</h3>
                {deal.discount_value && (
                  <span className="bg-[#f97316]/20 text-[#f97316] text-sm font-bold px-2 py-0.5 rounded">
                    {deal.discount_type === "percent" ? `${deal.discount_value}% OFF` : `£${deal.discount_value} OFF`}
                  </span>
                )}
              </div>
              {deal.description && <p className="text-white/60 text-sm mb-3">{deal.description}</p>}
              <div className="text-xs text-white/40 space-y-0.5 mb-3">
                {deal.valid_from && <p>From: {formatDate(deal.valid_from)}</p>}
                {deal.valid_until && (
                  <p className={expired ? "text-red-400" : ""}>Until: {formatDate(deal.valid_until)} {expired ? "(Expired)" : ""}</p>
                )}
              </div>
              <button
                onClick={() => toggleDeal(deal.id, deal.is_active)}
                className={`text-xs px-3 py-1 rounded border transition-colors ${
                  deal.is_active
                    ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                {deal.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          );
        })}
      </div>

      {deals.length === 0 && (
        <div className="text-center py-16 text-white/30">No deals yet. Create your first promotion!</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-4">New Deal</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-white/60 text-sm mb-1">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Discount Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Value</label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Valid From</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Valid Until</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 border border-white/10 text-white text-sm py-2 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#f97316] text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
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
