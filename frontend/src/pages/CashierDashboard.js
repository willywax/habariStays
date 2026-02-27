import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, useAuth, LanguageToggle } from "../App";
import {
  Calendar, UserCheck, Users, ClipboardList, LogOut,
  Search, Check, X, Printer, DollarSign, Clock, ArrowRight,
  ArrowLeft, BedDouble, Phone, FileText, AlertTriangle,
  CheckCircle2, XCircle, ChevronRight, Banknote, CreditCard,
  Smartphone, ShieldCheck
} from "lucide-react";

// ════════════════ MAIN DASHBOARD SHELL ════════════════
const CashierDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftStart] = useState(() => {
    const saved = sessionStorage.getItem("shift_start");
    if (saved) return new Date(saved);
    const now = new Date();
    sessionStorage.setItem("shift_start", now.toISOString());
    return now;
  });

  useEffect(() => {
    if (user?.assigned_hotel_id) {
      api.get(`/hotels/${user.assigned_hotel_id}`).then(r => setHotel(r.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { sessionStorage.removeItem("shift_start"); logout(); navigate("/"); };

  const navItems = [
    { path: "/cashier", icon: Calendar, label: "Check-ins Leo", shortLabel: "Check-ins", exact: true },
    { path: "/cashier/verify", icon: ShieldCheck, label: "Thibitisha Booking", shortLabel: "Thibitisha" },
    { path: "/cashier/walkin", icon: UserCheck, label: "Walk-in Booking", shortLabel: "Walk-in" },
    { path: "/cashier/guests", icon: Users, label: "Wageni Sasa", shortLabel: "Wageni" },
    { path: "/cashier/shift", icon: ClipboardList, label: "Muhtasari wa Shift", shortLabel: "Zamu" },
  ];

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path) && path !== "/cashier";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border fixed h-full flex-col" data-testid="cashier-sidebar">
        <div className="p-5 border-b border-border">
          <h2 className="font-['Outfit'] text-lg font-bold text-[#0F4C5C]">Habari Stays</h2>
          <p className="text-xs text-[#A1A1AA]">Mweka Hazina</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path, item.exact)
                  ? "bg-[#0F4C5C] text-white"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
              data-testid={`nav-${item.path.replace("/cashier/", "").replace("/cashier", "checkins")}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 px-1">
            <p className="text-xs text-[#A1A1AA]">Mweka Hazina</p>
            <p className="font-medium text-sm text-[#18181B]">{user?.full_name}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-[#52525B] hover:bg-[#F4F4F5] rounded-lg transition-all" data-testid="logout-btn">
            <LogOut className="w-5 h-5" /><span className="font-medium text-sm">Toka</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Top Header — compact on mobile */}
        <header className="bg-white border-b border-border px-4 md:px-6 py-2 md:py-3 flex items-center justify-between sticky top-0 z-10" data-testid="cashier-header">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="min-w-0">
              <p className="font-['Outfit'] font-semibold text-[#18181B] text-sm md:text-base truncate">{hotel?.name || "..."}</p>
              <p className="text-[10px] md:text-xs text-[#A1A1AA] truncate">{user?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 text-sm flex-shrink-0">
            <div className="text-right">
              <p className="text-[#18181B] font-mono font-semibold text-xs md:text-sm" data-testid="live-clock">
                {currentTime.toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-[#A1A1AA] text-[10px] md:text-xs hidden sm:block">
                {currentTime.toLocaleDateString("sw-TZ", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="text-right border-l border-border pl-3 md:pl-4 hidden sm:block">
              <p className="text-[10px] md:text-xs text-[#A1A1AA]">Zamu</p>
              <p className="font-mono text-[#0F4C5C] font-medium text-xs md:text-sm">
                {shiftStart.toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <LanguageToggle />
          </div>
        </header>

        <div className="p-4 md:p-6">
          <Routes>
            <Route path="/" element={<TodayCheckins hotel={hotel} />} />
            <Route path="/verify" element={<VerifyBooking hotel={hotel} />} />
            <Route path="/walkin" element={<WalkinBooking hotel={hotel} user={user} />} />
            <Route path="/guests" element={<ActiveGuests hotel={hotel} />} />
            <Route path="/shift" element={<ShiftSummary user={user} hotel={hotel} shiftStart={shiftStart} />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20 px-1 py-1 safe-area-bottom" data-testid="mobile-tab-bar">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const active = isActive(item.path, item.exact);
            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center py-1.5 px-2 rounded-lg min-w-[56px] ${active ? "text-[#E07B2A]" : "text-[#A1A1AA]"}`}
                data-testid={`mob-${item.path.replace("/cashier/", "").replace("/cashier", "checkins")}`}>
                <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[9px] font-medium mt-0.5 truncate max-w-[52px]">{item.shortLabel || item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// ════════════════ PAGE 1: TODAY'S CHECK-INS ════════════════
const TodayCheckins = ({ hotel }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);

  const fetch = useCallback(async () => {
    if (!hotel) return;
    try {
      const res = await api.get("/cashier/todays-checkins");
      setBookings(res.data);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [hotel]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCheckin = async (b) => {
    try {
      await api.post(`/cashier/confirm-checkin/${b.id}`);
      toast.success(`${b.guest_name} amethibitishwa`);
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); }
  };
  const handleCheckout = async (b) => {
    try {
      await api.post(`/cashier/confirm-checkout/${b.id}`);
      toast.success(`${b.guest_name} ameondoka. Chumba kimerudishwa.`);
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); }
  };

  const filtered = bookings.filter(b => {
    const matchSearch = b.guest_name.toLowerCase().includes(search.toLowerCase()) || b.booking_ref.toLowerCase().includes(search.toLowerCase());
    if (filter === "awaiting") return matchSearch && b.checkin_status === "not_checked_in";
    if (filter === "checked_in") return matchSearch && b.checkin_status === "checked_in";
    if (filter === "checked_out") return matchSearch && b.checkin_status === "checked_out";
    return matchSearch;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5" data-testid="todays-checkins-page">
      <div>
        <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Check-ins Leo</h1>
        <p className="text-sm text-[#52525B]">{new Date().toLocaleDateString("sw-TZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
          <input type="text" placeholder="Tafuta kwa jina au Ref..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="search-checkins" />
        </div>
        <div className="flex bg-[#F4F4F5] rounded-lg p-0.5">
          {[["all","Zote"],["awaiting","Inasubiri"],["checked_in","Amewasili"],["checked_out","Ameondoka"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === val ? "bg-white shadow-sm text-[#18181B]" : "text-[#52525B]"}`}
              data-testid={`filter-${val}`}>{label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Calendar className="w-10 h-10 text-[#D4D4D8] mx-auto mb-3" />
          <p className="text-[#A1A1AA] text-sm">Hakuna check-ins za leo kwa sasa.</p>
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full" data-testid="checkins-table">
            <thead className="bg-[#F4F4F5]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Ref#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Mgeni</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Simu</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Chumba</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Usiku</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Kiasi</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Hali</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(b => (
                <tr key={b.id} className={b.checkin_status === "checked_out" ? "opacity-50" : ""} data-testid={`checkin-row-${b.id}`}>
                  <td className="px-4 py-3 text-xs font-mono text-[#0F4C5C]">{b.booking_ref}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#18181B]">{b.guest_name}</td>
                  <td className="px-4 py-3 text-xs text-[#52525B]">{b.guest_phone}</td>
                  <td className="px-4 py-3 text-sm text-[#52525B]">{b.room_type_name}</td>
                  <td className="px-4 py-3 text-sm text-[#52525B]">{b.nights}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#18181B]">TZS {(b.total_amount_tzs || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.checkin_status} /></td>
                  <td className="px-4 py-3">
                    {b.checkin_status === "not_checked_in" && b.payment_status === "paid" && (
                      <button onClick={() => setModal({type:"checkin", booking: b})}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all"
                        data-testid={`checkin-btn-${b.id}`}>Thibitisha Kuwasili</button>
                    )}
                    {b.checkin_status === "not_checked_in" && b.payment_status !== "paid" && (
                      <span className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Haijalipiwa</span>
                    )}
                    {b.checkin_status === "checked_in" && (
                      <button onClick={() => setModal({type:"checkout", booking: b})}
                        className="px-3 py-1.5 bg-[#52525B] text-white text-xs font-medium rounded-lg hover:bg-[#3F3F46] transition-all"
                        data-testid={`checkout-btn-${b.id}`}>Thibitisha Kuondoka</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(b => (
            <div key={b.id} className={`bg-white rounded-xl border border-border p-4 space-y-3 ${b.checkin_status === "checked_out" ? "opacity-50" : ""}`} data-testid={`checkin-card-${b.id}`}>
              <div className="flex items-center justify-between">
                <StatusBadge status={b.checkin_status} />
                <span className="text-xs font-mono text-[#0F4C5C]">{b.booking_ref}</span>
              </div>
              <div>
                <p className="font-semibold text-[#18181B]">{b.guest_name}</p>
                <p className="text-xs text-[#52525B]">{b.guest_phone}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#52525B]">{b.room_type_name} · {b.nights} usiku</span>
                <span className="font-bold text-[#18181B]">TZS {(b.total_amount_tzs || 0).toLocaleString()}</span>
              </div>
              {b.payment_status === "paid" && <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">Imelipwa</span>}
              {b.checkin_status === "not_checked_in" && b.payment_status === "paid" && (
                <button onClick={() => setModal({type:"checkin", booking: b})}
                  className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 text-sm"
                  data-testid={`checkin-btn-${b.id}`}>Thibitisha Kuwasili</button>
              )}
              {b.checkin_status === "not_checked_in" && b.payment_status !== "paid" && (
                <div className="text-xs text-yellow-600 flex items-center gap-1 py-2"><AlertTriangle className="w-3 h-3" />Haijalipiwa</div>
              )}
              {b.checkin_status === "checked_in" && (
                <button onClick={() => setModal({type:"checkout", booking: b})}
                  className="w-full py-3 bg-[#52525B] text-white font-medium rounded-lg hover:bg-[#3F3F46] text-sm"
                  data-testid={`checkout-btn-${b.id}`}>Thibitisha Kuondoka</button>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      {/* Confirm Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" data-testid="confirm-modal">
            <h3 className="font-['Outfit'] text-lg font-bold text-[#18181B]">
              {modal.type === "checkin" ? `Thibitisha kwamba ${modal.booking.guest_name} amewasili?` : `Thibitisha kwamba ${modal.booking.guest_name} ameondoka?`}
            </h3>
            <div className="bg-[#F4F4F5] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#52525B]">Ref:</span><span className="font-mono">{modal.booking.booking_ref}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Chumba:</span><span>{modal.booking.room_type_name}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Tarehe:</span><span>{modal.booking.checkin_date} - {modal.booking.checkout_date}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Kiasi:</span><span className="font-bold">TZS {(modal.booking.total_amount_tzs || 0).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-[#F4F4F5]">Ghairi</button>
              <button onClick={() => modal.type === "checkin" ? handleCheckin(modal.booking) : handleCheckout(modal.booking)}
                className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg font-medium text-sm hover:bg-[#0A3844] flex items-center justify-center gap-2"
                data-testid="confirm-action-btn"><Check className="w-4 h-4" />Thibitisha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════ BOOKING VERIFICATION ════════════════
const VerifyBooking = ({ hotel }) => {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.post("/cashier/verify-booking", { search: search.trim() });
      setResult(res.data);
    } catch (err) { toast.error("Imeshindikana kutafuta"); } finally { setLoading(false); }
  };

  const handleCheckin = async () => {
    if (!result?.id) return;
    try {
      await api.post(`/cashier/confirm-checkin/${result.id}`);
      toast.success(`${result.guest_name} amethibitishwa`);
      setResult(null); setSearch("");
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); }
  };

  return (
    <div className="space-y-5" data-testid="verify-booking-page">
      <div>
        <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Thibitisha Booking</h1>
        <p className="text-sm text-[#52525B]">Tafuta booking kwa namba, simu, au jina la mgeni</p>
      </div>

      <div className="flex gap-3 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
          <input type="text" placeholder="HS-2026-XXXX, 07XX, au jina..." value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            data-testid="verify-search-input" />
        </div>
        <button onClick={handleSearch} disabled={loading || !search.trim()}
          className="px-6 py-3 bg-[#0F4C5C] text-white rounded-lg font-medium text-sm hover:bg-[#0A3844] disabled:opacity-50 transition-all"
          data-testid="verify-search-btn">{loading ? "..." : "Tafuta"}</button>
      </div>

      {result && !result.found && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3 max-w-xl" data-testid="verify-not-found">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800 text-sm">{result.message}</p>
          </div>
        </div>
      )}

      {result && result.found && (
        <div className="bg-white rounded-xl border border-border max-w-xl overflow-hidden" data-testid="verify-result-card">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[#0F4C5C] font-bold">{result.booking_ref}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${result.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {result.payment_status === "paid" ? "PAID" : "UNPAID"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[#A1A1AA] text-xs">Mgeni</p><p className="font-medium">{result.guest_name}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">Simu</p><p className="font-medium">{result.guest_phone}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">Chumba</p><p className="font-medium">{result.room_type_name}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">Usiku</p><p className="font-medium">{result.nights}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">Check-in</p><p className="font-medium">{result.checkin_date}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">Check-out</p><p className="font-medium">{result.checkout_date}</p></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#A1A1AA]">Kiasi</p>
              <p className="text-xl font-bold text-[#18181B]">TZS {(result.total_amount_tzs || 0).toLocaleString()}</p>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                {result.errors.map((err, i) => (
                  <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    err.type === "wrong_hotel" ? "bg-red-50 border border-red-200" :
                    err.type === "unpaid" ? "bg-yellow-50 border border-yellow-200" :
                    "bg-red-50 border border-red-200"
                  }`}>
                    {err.type === "unpaid" ? <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <p className={err.type === "unpaid" ? "text-yellow-800" : "text-red-800"}>{err.message}</p>
                  </div>
                ))}
              </div>
            )}

            {result.can_checkin && (
              <button onClick={handleCheckin}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-all"
                data-testid="verify-confirm-checkin-btn">
                <CheckCircle2 className="w-5 h-5" /> Thibitisha Kuwasili
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════ PAGE 2: WALK-IN BOOKING ════════════════
const WalkinBooking = ({ hotel, user }) => {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [form, setForm] = useState({
    guest_name: "", guest_phone: "",
    checkin_date: new Date().toISOString().split("T")[0],
    checkout_date: "", payment_method: "cash", notes: ""
  });

  useEffect(() => {
    if (!hotel) return;
    api.get(`/hotels/${hotel.id}/full`).then(r => {
      setRooms(r.data.room_types || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [hotel]);

  const nights = (() => {
    if (!form.checkin_date || !form.checkout_date) return 0;
    const d = (new Date(form.checkout_date) - new Date(form.checkin_date)) / 86400000;
    return Math.max(0, Math.floor(d));
  })();
  const totalAmount = nights * (selectedRoom?.price_per_night || 0);

  const handleSubmit = async () => {
    if (!selectedRoom || !form.guest_name || !form.guest_phone || nights < 1) return;
    setSubmitting(true);
    try {
      const res = await api.post("/cashier/walkin", {
        room_type_id: selectedRoom.id, guest_name: form.guest_name,
        guest_phone: form.guest_phone, checkin_date: form.checkin_date,
        checkout_date: form.checkout_date, payment_method: form.payment_method,
        notes: form.notes
      });
      setConfirmation(res.data);
      toast.success("Walk-in imerekodishwa!");
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); } finally { setSubmitting(false); }
  };

  const resetFlow = () => { setStep(1); setSelectedRoom(null); setConfirmation(null); setForm({ guest_name: "", guest_phone: "", checkin_date: new Date().toISOString().split("T")[0], checkout_date: "", payment_method: "cash", notes: "" }); };

  if (loading) return <LoadingSpinner />;

  // ── CONFIRMATION SCREEN ──
  if (confirmation) return (
    <div className="max-w-lg mx-auto space-y-6 text-center" data-testid="walkin-confirmation">
      <div className="bg-green-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Imefanikiwa!</h2>
        <p className="text-[#52525B] text-sm mt-1">Walk-in imerekodishwa</p>
      </div>
      <div className="bg-[#F4F4F5] rounded-xl p-4">
        <p className="text-xs text-[#A1A1AA]">Booking Reference</p>
        <p className="font-mono text-2xl font-bold text-[#0F4C5C]" data-testid="walkin-booking-ref">{confirmation.booking_ref}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => window.print()} className="flex-1 py-3 border border-border rounded-lg font-medium text-sm hover:bg-[#F4F4F5] flex items-center justify-center gap-2" data-testid="print-receipt-btn">
          <Printer className="w-4 h-4" /> Chapisha Risiti
        </button>
        <button onClick={resetFlow} className="flex-1 py-3 bg-[#0F4C5C] text-white rounded-lg font-medium text-sm hover:bg-[#0A3844] flex items-center justify-center gap-2" data-testid="new-walkin-btn">
          <UserCheck className="w-4 h-4" /> Walk-in Nyingine
        </button>
      </div>

      {/* Printable Receipt (hidden on screen, shown on print) */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-8 print:z-[9999]">
        <div className="max-w-sm mx-auto font-mono text-sm space-y-2">
          <div className="text-center border-b-2 border-black pb-2">
            <p className="font-bold text-lg">HABARI STAYS</p>
            <p className="text-xs">habaristays.com</p>
          </div>
          <p className="font-bold text-center">{confirmation.hotel_name}</p>
          <p className="text-center text-xs">{confirmation.hotel_address}</p>
          <div className="border-t border-dashed border-black pt-2">
            <p className="font-bold text-center">RISITI YA MALIPO</p>
          </div>
          <p>Ref: {confirmation.booking_ref}</p>
          <p>Tarehe: {new Date(confirmation.created_at).toLocaleString("sw-TZ")}</p>
          <div className="border-t border-dashed border-black pt-2">
            <p>Mgeni: {confirmation.guest_name}</p>
            <p>Simu: {confirmation.guest_phone}</p>
            <p>Chumba: {confirmation.room_type_name}</p>
            <p>Check-in: {confirmation.checkin_date}</p>
            <p>Check-out: {confirmation.checkout_date}</p>
            <p>Usiku: {confirmation.nights}</p>
          </div>
          <div className="border-t-2 border-black pt-2 text-center">
            <p className="font-bold text-lg">Jumla: TZS {(confirmation.total_amount_tzs || 0).toLocaleString()}</p>
            <p>Malipo: {confirmation.payment_method === "cash" ? "Cash" : confirmation.payment_method === "mpesa" ? "M-Pesa" : "Card"}</p>
          </div>
          <div className="border-t border-dashed border-black pt-2">
            <p>Mweka Hazina: {confirmation.cashier_name}</p>
          </div>
          <div className="text-center pt-2 border-t border-dashed border-black">
            <p className="text-xs">Asante kwa kuchagua</p>
            <p className="font-bold">{confirmation.hotel_name}</p>
            <p className="text-xs">Powered by Habari Stays</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5" data-testid="walkin-booking-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Walk-in Booking</h1>
          <p className="text-sm text-[#52525B]">Rekodi mgeni aliyekuja moja kwa moja</p>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1,2,3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-[#0F4C5C] text-white" : "bg-[#F4F4F5] text-[#A1A1AA]"}`}>{s}</div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-[#0F4C5C]" : "bg-[#E4E4E7]"}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* STEP 1 - SELECT ROOM */}
          {step === 1 && (
            <div className="space-y-4" data-testid="walkin-step-1">
              <h2 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">Chagua Chumba</h2>
              {rooms.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-12 text-center">
                  <BedDouble className="w-10 h-10 text-[#D4D4D8] mx-auto mb-3" />
                  <p className="text-[#A1A1AA] text-sm">Hakuna vyumba vinavyopatikana sasa hivi.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.map(room => (
                    <div key={room.id} className={`bg-white rounded-xl border-2 p-5 transition-all cursor-pointer ${
                      selectedRoom?.id === room.id ? "border-[#0F4C5C] shadow-md" : room.available_rooms < 1 ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-[#0F4C5C]/50"
                    }`} onClick={() => room.available_rooms > 0 && setSelectedRoom(room)} data-testid={`room-card-${room.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-[#18181B]">{room.name}</h3>
                          <p className="text-[#0F4C5C] font-bold mt-1">TZS {(room.price_per_night || 0).toLocaleString()} <span className="text-xs font-normal text-[#A1A1AA]">/ usiku</span></p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${room.available_rooms > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {room.available_rooms > 0 ? `${room.available_rooms} vinapatikana` : "Hakuna"}
                        </span>
                      </div>
                      {room.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.map(a => <span key={a} className="px-2 py-0.5 bg-[#F4F4F5] text-[#52525B] text-[10px] rounded">{a}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedRoom && (
                <div className="flex justify-end">
                  <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-[#0F4C5C] text-white rounded-lg font-medium text-sm hover:bg-[#0A3844] flex items-center gap-2" data-testid="walkin-next-step2">
                    Endelea <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 - GUEST DETAILS */}
          {step === 2 && (
            <div className="space-y-4" data-testid="walkin-step-2">
              <h2 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">Taarifa za Mgeni</h2>
              <div className="bg-white rounded-xl border border-border p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#52525B] mb-1.5">Jina Kamili *</label>
                    <input type="text" value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                      placeholder="John Doe" data-testid="walkin-guest-name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#52525B] mb-1.5">Simu +255 *</label>
                    <input type="tel" value={form.guest_phone} onChange={e => setForm({...form, guest_phone: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                      placeholder="07XX XXX XXX" data-testid="walkin-guest-phone" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#52525B] mb-1.5">Check-in</label>
                    <input type="date" value={form.checkin_date} onChange={e => setForm({...form, checkin_date: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="walkin-checkin-date" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#52525B] mb-1.5">Check-out *</label>
                    <input type="date" value={form.checkout_date} onChange={e => setForm({...form, checkout_date: e.target.value})}
                      min={form.checkin_date} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="walkin-checkout-date" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#52525B] mb-1.5">Usiku</label>
                    <div className="px-3 py-2.5 rounded-lg bg-[#F4F4F5] text-sm font-bold text-[#18181B]">{nights}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52525B] mb-2">Njia ya Malipo *</label>
                  <div className="flex gap-3">
                    {[["cash","Cash",Banknote],["mpesa","M-Pesa",Smartphone],["card","Card",CreditCard]].map(([val,label,Icon]) => (
                      <button key={val} onClick={() => setForm({...form, payment_method: val})}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          form.payment_method === val ? "border-[#0F4C5C] bg-[#0F4C5C]/5 text-[#0F4C5C]" : "border-border text-[#52525B] hover:border-[#A1A1AA]"
                        }`} data-testid={`payment-${val}`}><Icon className="w-4 h-4" />{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52525B] mb-1.5">Maelezo (si lazima)</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    placeholder="Mfano: requested quiet room" data-testid="walkin-notes" />
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-[#F4F4F5] flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Rudi
                </button>
                <button onClick={() => setStep(3)} disabled={!form.guest_name || !form.guest_phone || nights < 1}
                  className="px-6 py-2.5 bg-[#0F4C5C] text-white rounded-lg font-medium text-sm hover:bg-[#0A3844] disabled:opacity-50 flex items-center gap-2" data-testid="walkin-next-step3">
                  Endelea <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 - CONFIRM */}
          {step === 3 && (
            <div className="space-y-4" data-testid="walkin-step-3">
              <h2 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">Thibitisha na Rekodi</h2>
              <div className="bg-white rounded-xl border border-border p-5 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[#A1A1AA] text-xs">Mgeni</p><p className="font-medium">{form.guest_name}</p></div>
                  <div><p className="text-[#A1A1AA] text-xs">Simu</p><p className="font-medium">{form.guest_phone}</p></div>
                  <div><p className="text-[#A1A1AA] text-xs">Chumba</p><p className="font-medium">{selectedRoom?.name}</p></div>
                  <div><p className="text-[#A1A1AA] text-xs">Hotel</p><p className="font-medium">{hotel?.name}</p></div>
                  <div><p className="text-[#A1A1AA] text-xs">Check-in</p><p className="font-medium">{form.checkin_date}</p></div>
                  <div><p className="text-[#A1A1AA] text-xs">Check-out</p><p className="font-medium">{form.checkout_date}</p></div>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-[#A1A1AA]">{nights} usiku x TZS {(selectedRoom?.price_per_night || 0).toLocaleString()}</p>
                    <p className="text-xs text-[#A1A1AA]">Malipo: {form.payment_method === "cash" ? "Cash" : form.payment_method === "mpesa" ? "M-Pesa" : "Card"}</p>
                  </div>
                  <p className="text-2xl font-bold text-[#0F4C5C]">TZS {totalAmount.toLocaleString()}</p>
                </div>
                <p className="text-xs text-[#A1A1AA]">Mweka Hazina: {user?.full_name}</p>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="px-4 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-[#F4F4F5] flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Rudi Nyuma
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-lg" data-testid="walkin-confirm-btn">
                  <Check className="w-5 h-5" /> Thibitisha na Rekodi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar room summary - visible in steps 2 & 3 */}
        {selectedRoom && step > 1 && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-border p-4 sticky top-24 space-y-3" data-testid="walkin-room-summary">
              <h3 className="font-['Outfit'] font-semibold text-[#18181B] text-sm">Chumba Kilichochaguliwa</h3>
              <div className="bg-[#F4F4F5] rounded-lg p-3">
                <p className="font-medium text-[#18181B]">{selectedRoom.name}</p>
                <p className="text-xs text-[#52525B]">{hotel?.name}</p>
                <p className="text-[#0F4C5C] font-bold mt-2">TZS {(selectedRoom.price_per_night || 0).toLocaleString()} <span className="text-xs font-normal text-[#A1A1AA]">/ usiku</span></p>
              </div>
              {nights > 0 && (
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-xs text-[#52525B]"><span>{nights} usiku</span><span>TZS {totalAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-sm mt-1"><span>Jumla</span><span className="text-[#0F4C5C]">TZS {totalAmount.toLocaleString()}</span></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════ PAGE 3: ACTIVE GUESTS ════════════════
const ActiveGuests = ({ hotel }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const fetch = useCallback(async () => {
    if (!hotel) return;
    try {
      const res = await api.get("/cashier/active-guests");
      setGuests(res.data);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [hotel]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCheckout = async (g) => {
    try {
      await api.post(`/cashier/confirm-checkout/${g.id}`);
      toast.success(`${g.guest_name} ameondoka. Chumba kimerudishwa.`);
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); }
  };

  const filtered = guests.filter(g =>
    g.guest_name.toLowerCase().includes(search.toLowerCase()) || g.booking_ref.toLowerCase().includes(search.toLowerCase())
  );

  const nightsColor = (n) => n >= 2 ? "text-green-600" : n === 1 ? "text-amber-600" : "text-red-600";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5" data-testid="active-guests-page">
      <div>
        <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Wageni Waliopo</h1>
        <p className="text-sm text-[#52525B]">{guests.length} wageni waliopo sasa hivi</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
        <input type="text" placeholder="Tafuta kwa jina au Ref..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="search-guests" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Users className="w-10 h-10 text-[#D4D4D8] mx-auto mb-3" />
          <p className="text-[#A1A1AA] text-sm">Hakuna wageni waliopo sasa hivi.</p>
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full" data-testid="guests-table">
            <thead className="bg-[#F4F4F5]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Ref#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Mgeni</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Simu</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Chumba</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Ameingia</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Ataondoka</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Usiku</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Aina</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(g => (
                <tr key={g.id} data-testid={`guest-row-${g.id}`}>
                  <td className="px-4 py-3 text-xs font-mono text-[#0F4C5C]">{g.booking_ref}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#18181B]">{g.guest_name}</td>
                  <td className="px-4 py-3 text-xs text-[#52525B]">{g.guest_phone}</td>
                  <td className="px-4 py-3 text-sm text-[#52525B]">{g.room_type_name}</td>
                  <td className="px-4 py-3 text-xs text-[#52525B]">{g.actual_checkin_time ? new Date(g.actual_checkin_time).toLocaleString("sw-TZ", {hour:"2-digit",minute:"2-digit"}) : g.checkin_date}</td>
                  <td className="px-4 py-3 text-xs text-[#52525B]">{g.checkout_date}</td>
                  <td className={`px-4 py-3 text-sm font-bold ${nightsColor(g.nights_left)}`}>{g.nights_left}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${g.booking_type === "online" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                      {g.booking_type === "online" ? "ONLINE" : "WALK-IN"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setModal(g)}
                      className="px-3 py-1.5 bg-[#52525B] text-white text-xs font-medium rounded-lg hover:bg-[#3F3F46] transition-all"
                      data-testid={`checkout-guest-${g.id}`}>Thibitisha Kuondoka</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-border p-4 space-y-3" data-testid={`guest-card-${g.id}`}>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${g.booking_type === "online" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                  {g.booking_type === "online" ? "ONLINE" : "WALK-IN"}
                </span>
                <span className={`text-lg font-bold ${nightsColor(g.nights_left)}`}>{g.nights_left} usiku</span>
              </div>
              <div>
                <p className="font-semibold text-[#18181B]">{g.guest_name}</p>
                <p className="text-xs text-[#52525B]">{g.guest_phone}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-[#52525B]">
                <span>{g.room_type_name}</span>
                <span className="text-xs">{g.checkin_date} → {g.checkout_date}</span>
              </div>
              <button onClick={() => setModal(g)}
                className="w-full py-3 bg-[#52525B] text-white font-medium rounded-lg hover:bg-[#3F3F46] text-sm"
                data-testid={`checkout-guest-${g.id}`}>Thibitisha Kuondoka</button>
            </div>
          ))}
        </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" data-testid="checkout-modal">
            <h3 className="font-['Outfit'] text-lg font-bold text-[#18181B]">Thibitisha kwamba {modal.guest_name} ameondoka?</h3>
            <div className="bg-[#F4F4F5] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#52525B]">Chumba:</span><span>{modal.room_type_name}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Check-in:</span><span>{modal.checkin_date}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Check-out:</span><span>{modal.checkout_date}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Kiasi:</span><span className="font-bold">TZS {(modal.total_amount_tzs || 0).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-[#F4F4F5]">Ghairi</button>
              <button onClick={() => handleCheckout(modal)}
                className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg font-medium text-sm hover:bg-[#0A3844] flex items-center justify-center gap-2"
                data-testid="confirm-checkout-btn"><Check className="w-4 h-4" />Thibitisha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════ PAGE 4: SHIFT SUMMARY ════════════════
const ShiftSummary = ({ user, hotel, shiftStart }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/cashier/shift-summary-full").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-[#A1A1AA]">Imeshindikana kupakia</p>;

  const stats = [
    { label: "Walk-ins Leo", value: data.walkins_count, color: "bg-green-50 text-green-700" },
    { label: "Check-ins Confirmed", value: data.online_checkins_count, color: "bg-blue-50 text-blue-700" },
    { label: "Checkouts", value: data.checkouts_count, color: "bg-gray-50 text-gray-700" },
    { label: "Cash", value: `TZS ${(data.cash_total || 0).toLocaleString()}`, color: "bg-emerald-50 text-emerald-700" },
    { label: "M-Pesa", value: `TZS ${(data.mpesa_total || 0).toLocaleString()}`, color: "bg-blue-50 text-blue-700" },
    { label: "Card", value: `TZS ${(data.card_total || 0).toLocaleString()}`, color: "bg-purple-50 text-purple-700" },
  ];

  const actionIcon = (type) => {
    if (type === "walkin_recorded") return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />;
    if (type === "checkin_confirmed") return <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />;
    return <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />;
  };
  const actionLabel = (type) => {
    if (type === "walkin_recorded") return "Walk-in Recorded";
    if (type === "checkin_confirmed") return "Check-in Confirmed";
    return "Checkout Processed";
  };

  return (
    <div className="space-y-5" data-testid="shift-summary-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Muhtasari wa Zamu</h1>
          <p className="text-sm text-[#52525B]">{data.date} - {user?.full_name}</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 border border-border rounded-lg font-medium text-sm hover:bg-[#F4F4F5] flex items-center gap-2" data-testid="print-shift-btn">
          <Printer className="w-4 h-4" /> Chapisha Muhtasari
        </button>
      </div>

      {/* Total Revenue */}
      <div className="bg-[#0F4C5C] rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Jumla ya Mapato Leo</p>
        <p className="text-3xl font-bold font-mono" data-testid="total-revenue">TZS {(data.total_revenue || 0).toLocaleString()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-4`}>
            <p className="text-xs opacity-70">{s.label}</p>
            <p className="text-lg font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-['Outfit'] font-semibold text-sm text-[#18181B]">Shughuli za Leo</h3>
        </div>
        {data.activity_log.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#A1A1AA]">Hakuna shughuli bado.</div>
        ) : (
          <table className="w-full" data-testid="activity-log-table">
            <thead className="bg-[#F4F4F5]">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">Saa</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">Kitendo</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">Mgeni</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">Chumba</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">Kiasi</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">Njia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.activity_log.map(l => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-xs font-mono text-[#52525B]">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString("sw-TZ", {hour:"2-digit",minute:"2-digit"}) : ""}</td>
                  <td className="px-4 py-2 text-xs flex items-center gap-2">{actionIcon(l.action_type)} {actionLabel(l.action_type)}</td>
                  <td className="px-4 py-2 text-xs text-[#18181B]">{l.guest_name}</td>
                  <td className="px-4 py-2 text-xs text-[#52525B]">{l.room_type_name}</td>
                  <td className="px-4 py-2 text-xs font-medium">{l.amount_tzs ? `TZS ${l.amount_tzs.toLocaleString()}` : "-"}</td>
                  <td className="px-4 py-2 text-xs text-[#52525B]">{l.payment_method || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Printable Shift Summary */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-8 print:z-[9999]">
        <div className="max-w-md mx-auto font-mono text-sm space-y-2">
          <p className="font-bold text-center text-lg">HABARI STAYS - MUHTASARI WA ZAMU</p>
          <p className="text-center">{data.hotel_name}</p>
          <p className="text-center text-xs">{data.hotel_address}</p>
          <div className="border-t border-dashed border-black pt-2">
            <p>Tarehe: {data.date}</p>
            <p>Mweka Hazina: {data.cashier_name}</p>
            <p>Zamu ilianza: {shiftStart?.toLocaleTimeString("sw-TZ", {hour:"2-digit",minute:"2-digit"})}</p>
          </div>
          <div className="border-t border-dashed border-black pt-2">
            <p>Walk-ins: {data.walkins_count} - TZS {(data.walkins_total || 0).toLocaleString()}</p>
            <p>Check-ins: {data.online_checkins_count}</p>
            <p>Checkouts: {data.checkouts_count}</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold">PESA ILIYOKUSANYWA:</p>
            <p>Cash: TZS {(data.cash_total || 0).toLocaleString()}</p>
            <p>M-Pesa: TZS {(data.mpesa_total || 0).toLocaleString()}</p>
            <p>Card: TZS {(data.card_total || 0).toLocaleString()}</p>
            <p className="font-bold text-lg mt-2">JUMLA: TZS {(data.total_revenue || 0).toLocaleString()}</p>
          </div>
          <div className="border-t border-dashed border-black pt-4 mt-4">
            <p>Sahihi: _______________</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════ SHARED COMPONENTS ════════════════
const StatusBadge = ({ status }) => {
  if (status === "not_checked_in") return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-medium rounded">Inasubiri</span>;
  if (status === "checked_in") return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">Amewasili</span>;
  if (status === "checked_out") return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">Ameondoka</span>;
  return null;
};

export default CashierDashboard;
