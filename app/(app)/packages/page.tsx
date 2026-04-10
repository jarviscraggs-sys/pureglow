"use client";
import { useEffect, useState, useCallback } from "react";

interface Package {
  id: number;
  name: string;
  price: number;
  minutes: number;
  bed_type: string;
  is_unlimited: number;
  daily_limit_mins: number;
  duration_days: number;
  is_active: number;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseForm, setPurchaseForm] = useState({ customerId: "", packageId: "" });
  const [form, setForm] = useState({ name: "", price: "", minutes: "", bedType: "all", isUnlimited: false, dailyLimitMins: "9", durationDays: "365" });
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const loadPackages = useCallback(async () => {
    const res = await fetch("/api/packages");
    setPackages(await res.json());
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);

  useEffect(() => {
    if (showPurchase) {
      fetch(`/api/customers?q=${customerSearch}`).then((r) => r.json()).then(setCustomers);
    }
  }, [showPurchase, customerSearch]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, price: Number(form.price), minutes: Number(form.minutes),
        bedType: form.bedType, isUnlimited: form.isUnlimited,
        dailyLimitMins: Number(form.dailyLimitMins), durationDays: Number(form.durationDays),
      }),
    });
    setSaving(false);
    setShowForm(false);
    loadPackages();
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/packages/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: Number(purchaseForm.customerId), packageId: Number(purchaseForm.packageId) }),
    });
    setSaving(false);
    setShowPurchase(false);
    alert("Package assigned successfully!");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Packages</h1>
          <p className="text-white/40 text-sm mt-1">Tanning packages & pricing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPurchase(true)}
            className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Assign Package
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Package
          </button>
        </div>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#f97316]/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-semibold">{pkg.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.bed_type === "all" ? "bg-[#f97316]/20 text-[#f97316]" : "bg-blue-500/20 text-blue-400"}`}>
                {pkg.bed_type === "all" ? "All Beds" : "Stand-up"}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">£{pkg.price}</p>
            <div className="mt-3 space-y-1 text-sm">
              {pkg.is_unlimited ? (
                <>
                  <p className="text-white/60">Unlimited · {pkg.daily_limit_mins} mins/day</p>
                  <p className="text-white/40">{pkg.duration_days} day validity</p>
                </>
              ) : (
                <>
                  <p className="text-white/60">{pkg.minutes} minutes total</p>
                  <p className="text-white/40">{pkg.duration_days} day validity</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Package Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-4">New Package</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-white/60 text-sm mb-1">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Price (£)</label>
                  <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Total Minutes</label>
                  <input type="number" required value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Bed Access</label>
                <select value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="all">All Beds</option>
                  <option value="standup">Stand-up Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="unlimited" checked={form.isUnlimited} onChange={(e) => setForm({ ...form, isUnlimited: e.target.checked })}
                  className="accent-[#f97316]" />
                <label htmlFor="unlimited" className="text-white/60 text-sm">Unlimited (daily limit applies)</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Daily Limit (mins)</label>
                  <input type="number" value={form.dailyLimitMins} onChange={(e) => setForm({ ...form, dailyLimitMins: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Validity (days)</label>
                  <input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
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

      {/* Purchase Modal */}
      {showPurchase && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-4">Assign Package to Customer</h2>
            <form onSubmit={handlePurchase} className="space-y-3">
              <div>
                <label className="block text-white/60 text-sm mb-1">Customer</label>
                <input type="text" placeholder="Search…" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:outline-none" />
                <select required value={purchaseForm.customerId} onChange={(e) => setPurchaseForm({ ...purchaseForm, customerId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Package</label>
                <select required value={purchaseForm.packageId} onChange={(e) => setPurchaseForm({ ...purchaseForm, packageId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="">Select package…</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{p.name} — £{p.price}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPurchase(false)} className="flex-1 bg-white/5 border border-white/10 text-white text-sm py-2 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#f97316] text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
                  {saving ? "Assigning…" : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
