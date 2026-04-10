"use client";
import { useEffect, useState } from "react";

interface Location {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours_mon: string;
  hours_tue: string;
  hours_wed: string;
  hours_thu: string;
  hours_fri: string;
  hours_sat: string;
  hours_sun: string;
  uv_daily_limit: number;
}

const DAYS = [
  { key: "hours_mon", label: "Monday" },
  { key: "hours_tue", label: "Tuesday" },
  { key: "hours_wed", label: "Wednesday" },
  { key: "hours_thu", label: "Thursday" },
  { key: "hours_fri", label: "Friday" },
  { key: "hours_sat", label: "Saturday" },
  { key: "hours_sun", label: "Sunday" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Location | null>(null);
  const [form, setForm] = useState<Partial<Location>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d); setForm(d); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, address: form.address, phone: form.phone, email: form.email,
        hoursMon: form.hours_mon, hoursTue: form.hours_tue, hoursWed: form.hours_wed,
        hoursThu: form.hours_thu, hoursFri: form.hours_fri, hoursSat: form.hours_sat,
        hoursSun: form.hours_sun, uvDailyLimit: form.uv_daily_limit,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSettings({ ...settings!, ...form } as Location);
  }

  if (!settings) return <div className="text-white/40 p-8">Loading…</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Location details and configuration</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Location Details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Location Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">Business Name</label>
              <input type="text" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#f97316]/50" />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-1">Address</label>
              <input type="text" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#f97316]/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-1">Phone</label>
                <input type="text" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#f97316]/50" />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Email</label>
                <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#f97316]/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Opening Hours</h2>
          <div className="space-y-3">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-white/60 text-sm w-24">{label}</span>
                <input
                  type="text"
                  value={(form as Record<string, string | number>)[key] as string || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="09:00-21:00 or Closed"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316]/50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* UV Limits */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">UV Limits</h2>
          <div>
            <label className="block text-white/60 text-sm mb-1">Default Daily UV Limit (minutes)</label>
            <input
              type="number"
              value={form.uv_daily_limit || ""}
              onChange={(e) => setForm({ ...form, uv_daily_limit: Number(e.target.value) })}
              className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#f97316]/50"
            />
            <p className="text-white/30 text-xs mt-1">Maximum UV minutes allowed per customer per day</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <span className="text-emerald-400 text-sm">✓ Saved successfully</span>}
        </div>
      </form>
    </div>
  );
}
