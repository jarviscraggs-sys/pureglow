"use client";
import { useEffect, useState, useCallback } from "react";

interface Bed {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface Booking {
  id: number;
  customer_id: number;
  bed_id: number;
  first_name: string;
  last_name: string;
  bed_name: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  status: string;
  package_name: string | null;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  active_package: string | null;
  active_mins: number | null;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9am–9pm
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/80",
  in_progress: "bg-[#f97316]/80",
  completed: "bg-emerald-600/80",
  cancelled: "bg-red-600/60 line-through",
  no_show: "bg-gray-600/60",
};

function timeToMinutes(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

const SLOT_HEIGHT = 48; // px per hour
const DAY_START = 9 * 60; // 9:00

export default function BookingsPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ customerId: "", bedId: "", startTime: "", durationMins: "9", notes: "" });
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/bookings?date=${date}`);
    const d = await res.json();
    setBookings(d.bookings || []);
    setBeds(d.beds || []);
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (showForm) {
      fetch(`/api/customers?q=${customerSearch}`).then((r) => r.json()).then(setCustomers);
    }
  }, [showForm, customerSearch]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const startIso = `${date}T${form.startTime}:00`;
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: Number(form.customerId),
        bedId: Number(form.bedId),
        startTime: startIso,
        durationMins: Number(form.durationMins),
        notes: form.notes,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ customerId: "", bedId: "", startTime: "", durationMins: "9", notes: "" });
    loadData();
  }

  async function cancelBooking(id: number) {
    if (!confirm("Cancel this booking?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    loadData();
  }

  const totalHeight = SLOT_HEIGHT * HOURS.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-white/40 text-sm mt-1">Daily calendar view</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316]/50"
          />
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-auto">
        <div className="flex" style={{ minWidth: beds.length * 160 + 60 }}>
          {/* Time column */}
          <div className="w-14 flex-shrink-0">
            <div className="h-10 border-b border-white/10 bg-white/5" />
            <div style={{ height: totalHeight }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: SLOT_HEIGHT }}
                  className="border-b border-white/5 px-2 flex items-start pt-1"
                >
                  <span className="text-white/30 text-xs">{h}:00</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bed columns */}
          {beds.map((bed) => {
            const bedBookings = bookings.filter((b) => b.bed_id === bed.id);
            return (
              <div key={bed.id} className="flex-1 min-w-36 border-l border-white/10">
                <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-2">
                  <div>
                    <p className="text-white text-xs font-medium truncate">{bed.name}</p>
                    <p className="text-white/30 text-xs">{bed.type}</p>
                  </div>
                </div>
                <div style={{ height: totalHeight, position: "relative" }}>
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{ top: (h - 9) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      className="absolute w-full border-b border-white/5"
                    />
                  ))}
                  {/* Bookings */}
                  {bedBookings.map((bk) => {
                    const startMins = timeToMinutes(bk.start_time) - DAY_START;
                    const endMins = timeToMinutes(bk.end_time) - DAY_START;
                    const top = (startMins / 60) * SLOT_HEIGHT;
                    const height = Math.max(((endMins - startMins) / 60) * SLOT_HEIGHT, 20);
                    return (
                      <div
                        key={bk.id}
                        style={{ top, height, left: 2, right: 2, position: "absolute" }}
                        className={`rounded p-1 cursor-pointer text-white text-xs overflow-hidden ${statusColors[bk.status] || "bg-gray-600/50"}`}
                        onClick={() => cancelBooking(bk.id)}
                        title={`${bk.first_name} ${bk.last_name} — ${bk.duration_mins} mins. Click to cancel.`}
                      >
                        <p className="font-semibold truncate">{bk.first_name} {bk.last_name}</p>
                        <p className="opacity-80 text-xs">{bk.duration_mins}m</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Booking Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-4">New Booking</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-white/60 text-sm mb-1">Customer</label>
                <input
                  type="text"
                  placeholder="Search customers…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:outline-none"
                />
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} {c.active_package ? `(${c.active_package})` : "(No package)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Bed</label>
                <select
                  value={form.bedId}
                  onChange={(e) => setForm({ ...form, bedId: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                >
                  <option value="">Select bed…</option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Duration (mins)</label>
                  <select
                    value={form.durationMins}
                    onChange={(e) => setForm({ ...form, durationMins: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  >
                    {[6, 9, 12, 15, 20, 30, 45, 60, 100].map((m) => (
                      <option key={m} value={m}>{m} mins</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  placeholder="Optional…"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-white/5 border border-white/10 text-white text-sm py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
                >
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
