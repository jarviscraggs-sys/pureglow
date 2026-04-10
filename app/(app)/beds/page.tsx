"use client";
import { useEffect, useState, useCallback } from "react";

interface Bed {
  id: number;
  name: string;
  type: string;
  status: string;
  minutes_remaining: number;
  sort_order: number;
}

const STATUS_OPTIONS = ["available", "in_use", "maintenance", "offline"];
const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_use: "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30",
  maintenance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  offline: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "laydown" });
  const [saving, setSaving] = useState(false);

  const loadBeds = useCallback(async () => {
    const res = await fetch("/api/beds");
    setBeds(await res.json());
  }, []);

  useEffect(() => { loadBeds(); }, [loadBeds]);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/beds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadBeds();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/beds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", type: "laydown" });
    loadBeds();
  }

  const laydownBeds = beds.filter((b) => b.type === "laydown");
  const standupBeds = beds.filter((b) => b.type === "standup");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Beds</h1>
          <p className="text-white/40 text-sm mt-1">{beds.length} beds · {beds.filter((b) => b.status === "available").length} available</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          + Add Bed
        </button>
      </div>

      <div className="space-y-6">
        {[["Lay-down Beds", laydownBeds], ["Stand-up Beds", standupBeds]].map(([label, group]) => (
          <div key={label as string}>
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-3">{label as string}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(group as Bed[]).map((bed) => (
                <div key={bed.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">{bed.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[bed.status]}`}>
                      {bed.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mb-3">{bed.type === "laydown" ? "Lay-down" : "Stand-up"}</p>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(bed.id, s)}
                        disabled={bed.status === s}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          bed.status === s
                            ? "bg-white/10 border-white/20 text-white/60 cursor-default"
                            : "bg-transparent border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Bed Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold text-lg mb-4">Add Bed</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-white/60 text-sm mb-1">Bed Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" placeholder="e.g. Ergoline 600" />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="laydown">Lay-down</option>
                  <option value="standup">Stand-up</option>
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
