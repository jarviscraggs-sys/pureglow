"use client";
import { useEffect, useState, use } from "react";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skin_type: number;
  uv_total_mins: number;
  notes: string;
  date_of_birth: string;
  created_at: string;
}

interface CustomerPackage {
  id: number;
  package_name: string;
  bed_type: string;
  is_unlimited: number;
  minutes_remaining: number;
  expires_at: string;
  purchased_at: string;
  is_active: number;
}

interface Booking {
  id: number;
  bed_name: string;
  bed_type: string;
  start_time: string;
  duration_mins: number;
  status: string;
  package_name: string | null;
}

const statusColors: Record<string, string> = {
  scheduled: "text-blue-400",
  in_progress: "text-[#f97316]",
  completed: "text-emerald-400",
  cancelled: "text-red-400",
  no_show: "text-gray-400",
};

function formatDate(s: string) {
  return s ? new Date(s).toLocaleDateString("en-GB") : "—";
}
function formatTime(s: string) {
  return s ? new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ customer: Customer; packages: CustomerPackage[]; bookings: Booking[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({});

  useEffect(() => {
    fetch(`/api/customers/${id}`).then((r) => r.json()).then((d) => {
      setData(d);
      setForm(d.customer);
    });
  }, [id]);

  async function saveEdit() {
    await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.first_name, lastName: form.last_name,
        email: form.email, phone: form.phone,
        skinType: form.skin_type, notes: form.notes,
      }),
    });
    setEditing(false);
    fetch(`/api/customers/${id}`).then((r) => r.json()).then(setData);
  }

  if (!data) return <div className="text-white/40 p-8">Loading…</div>;

  const { customer, packages, bookings } = data;
  const activePackage = packages.find((p) => p.is_active);
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;

  return (
    <div>
      <div className="mb-6">
        <a href="/customers" className="text-white/40 hover:text-white text-sm transition-colors">← Customers</a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Profile</h2>
            <button onClick={() => setEditing(!editing)} className="text-[#f97316] text-sm hover:text-[#ea6c0a]">
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/50 text-xs">First Name</label>
                  <input value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm mt-0.5 focus:outline-none" />
                </div>
                <div>
                  <label className="text-white/50 text-xs">Last Name</label>
                  <input value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm mt-0.5 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs">Email</label>
                <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm mt-0.5 focus:outline-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs">Phone</label>
                <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm mt-0.5 focus:outline-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs">Notes</label>
                <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm mt-0.5 focus:outline-none" rows={3} />
              </div>
              <button onClick={saveEdit} className="w-full bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f97316]/20 flex items-center justify-center text-[#f97316] font-bold text-lg mb-4">
                {customer.first_name[0]}{customer.last_name[0]}
              </div>
              <h3 className="text-white text-xl font-bold">{customer.first_name} {customer.last_name}</h3>
              <div className="space-y-2 mt-3">
                {[
                  ["Email", customer.email],
                  ["Phone", customer.phone],
                  ["Date of Birth", formatDate(customer.date_of_birth)],
                  ["Skin Type", `Type ${customer.skin_type}`],
                  ["Member Since", formatDate(customer.created_at)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white">{val || "—"}</span>
                  </div>
                ))}
              </div>
              {customer.notes && (
                <div className="mt-3 bg-white/5 rounded-lg p-3 text-white/60 text-sm">{customer.notes}</div>
              )}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 space-y-6">
          {/* UV & Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total UV Mins", value: customer.uv_total_mins, color: "text-[#f97316]" },
              { label: "Total Bookings", value: totalBookings, color: "text-blue-400" },
              { label: "Completed", value: completedBookings, color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white/40 text-xs">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Active Package */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Active Package</h3>
            {activePackage ? (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#f97316] font-semibold">{activePackage.package_name}</p>
                  <p className="text-white/60 text-sm mt-1">{activePackage.minutes_remaining} mins remaining</p>
                  <p className="text-white/40 text-xs mt-1">
                    Expires: {formatDate(activePackage.expires_at)} · Beds: {activePackage.bed_type === "all" ? "All beds" : "Stand-up only"}
                  </p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">
                  Active
                </div>
              </div>
            ) : (
              <p className="text-white/30">No active package.</p>
            )}
          </div>

          {/* Package History */}
          {packages.length > 1 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Package History</h3>
              <div className="space-y-2">
                {packages.filter(p => !p.is_active || p !== activePackage).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-white/60">{p.package_name}</span>
                    <span className="text-white/40">{formatDate(p.purchased_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking History */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Booking History</h3>
            {bookings.length === 0 ? (
              <p className="text-white/30 text-sm">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <p className="text-white text-sm font-medium">{b.bed_name}</p>
                      <p className="text-white/40 text-xs">{formatTime(b.start_time)} · {b.duration_mins} mins</p>
                    </div>
                    <span className={`text-xs capitalize ${statusColors[b.status]}`}>{b.status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
