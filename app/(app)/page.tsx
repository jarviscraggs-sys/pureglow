"use client";
import { useEffect, useState } from "react";

interface Bed {
  id: number;
  name: string;
  type: string;
  status: string;
  minutes_remaining: number;
}

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  bed_name: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  status: string;
}

interface Stats {
  todayBookings: number;
  activeCustomers: { c: number };
  totalCustomers: { c: number };
}

const statusColors: Record<string, string> = {
  available: "bg-emerald-500",
  in_use: "bg-[#f97316]",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  in_use: "In Use",
  maintenance: "Maintenance",
  offline: "Offline",
};

const bookingColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  no_show: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const [data, setData] = useState<{ todayBookings: Booking[]; bedStatus: Bed[]; stats: Stats } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
    const interval = setInterval(() => {
      fetch("/api/dashboard").then((r) => r.json()).then(setData);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40">Loading…</div>
      </div>
    );
  }

  const { todayBookings, bedStatus, stats } = data;
  const laydownBeds = bedStatus.filter((b) => b.type === "laydown");
  const standupBeds = bedStatus.filter((b) => b.type === "standup");
  const inUseCount = bedStatus.filter((b) => b.status === "in_use").length;
  const availableCount = bedStatus.filter((b) => b.status === "available").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Bookings", value: stats.todayBookings, color: "text-[#f97316]" },
          { label: "Beds Available", value: availableCount, color: "text-emerald-400" },
          { label: "Beds In Use", value: inUseCount, color: "text-[#f97316]" },
          { label: "Total Customers", value: stats.totalCustomers?.c || 0, color: "text-blue-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-white/50 text-sm">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bed Status */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Live Bed Status</h2>

          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Lay-down Beds</p>
          <div className="space-y-2 mb-4">
            {laydownBeds.map((bed) => (
              <div key={bed.id} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white text-sm">{bed.name}</span>
                <div className="flex items-center gap-2">
                  {bed.status === "in_use" && bed.minutes_remaining > 0 && (
                    <span className="text-white/40 text-xs">{bed.minutes_remaining}m left</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[bed.status]} text-white`}>
                    {statusLabels[bed.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Stand-up Beds</p>
          <div className="space-y-2">
            {standupBeds.map((bed) => (
              <div key={bed.id} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white text-sm">{bed.name}</span>
                <div className="flex items-center gap-2">
                  {bed.status === "in_use" && bed.minutes_remaining > 0 && (
                    <span className="text-white/40 text-xs">{bed.minutes_remaining}m left</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[bed.status]} text-white`}>
                    {statusLabels[bed.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Bookings */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Today&apos;s Bookings</h2>
          {todayBookings.length === 0 ? (
            <p className="text-white/30 text-sm">No bookings today.</p>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {b.first_name} {b.last_name}
                    </p>
                    <p className="text-white/40 text-xs">{b.bed_name} · {formatTime(b.start_time)} – {formatTime(b.end_time)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${bookingColors[b.status]}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
