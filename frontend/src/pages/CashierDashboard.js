import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, useAuth, useLang, LanguageToggle } from "../App";
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
  const { lang } = useLang();
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

  const locale = lang === "sw" ? "sw-TZ" : "en-TZ";
  const handleLogout = () => { sessionStorage.removeItem("shift_start"); logout(); navigate("/"); };

  const navItems = [
    { path: "/cashier", icon: Calendar, label: lang === "sw" ? "Check-ins Leo" : "Today's Check-ins", shortLabel: lang === "sw" ? "Leo" : "Today", exact: true },
    { path: "/cashier/verify", icon: ShieldCheck, label: lang === "sw" ? "Thibitisha Booking" : "Verify Booking", shortLabel: lang === "sw" ? "Thibitisha" : "Verify" },
    { path: "/cashier/walkin", icon: UserCheck, label: "Walk-in Booking", shortLabel: "Walk-in" },
    { path: "/cashier/guests", icon: Users, label: lang === "sw" ? "Wageni Sasa" : "Current Guests", shortLabel: lang === "sw" ? "Wageni" : "Guests" },
    { path: "/cashier/shift", icon: ClipboardList, label: lang === "sw" ? "Muhtasari wa Shift" : "Shift Summary", shortLabel: lang === "sw" ? "Zamu" : "Shift" },
  ];

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path) && path !== "/cashier";

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border fixed h-full flex-col" data-testid="cashier-sidebar">
        <div className="p-5 border-b border-border">
          <h2 className="font-['Outfit'] text-lg font-bold text-[#0F4C5C]">Habari Stays</h2>
          <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Mweka Hazina" : "Cashier"}</p>
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
            <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Mweka Hazina" : "Cashier"}</p>
            <p className="font-medium text-sm text-[#18181B]">{user?.full_name}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-[#52525B] hover:bg-[#F4F4F5] rounded-lg transition-all" data-testid="logout-btn">
            <LogOut className="w-5 h-5" /><span className="font-medium text-sm">{lang === "sw" ? "Toka" : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        {/* Header */}
        <header className="bg-white border-b border-border px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between sticky top-0 z-10" data-testid="cashier-header">
          <div className="min-w-0 flex-1">
            <p className="font-['Outfit'] font-bold text-[#0F4C5C] text-sm md:text-base truncate leading-tight">{hotel?.name || "..."}</p>
            <p className="text-[10px] text-[#A1A1AA] truncate leading-tight">{user?.full_name}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-5 flex-shrink-0">
            <div className="text-right">
              <p className="text-[#18181B] font-mono font-bold text-xs md:text-sm leading-tight" data-testid="live-clock">
                {currentTime.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-[#A1A1AA] text-[10px] leading-tight hidden sm:block">
                {currentTime.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
            <LanguageToggle />
          </div>
        </header>

        <div className="px-3 py-4 md:p-6">
          <Routes>
            <Route path="/" element={<TodayCheckins hotel={hotel} />} />
            <Route path="/verify" element={<VerifyBooking hotel={hotel} />} />
            <Route path="/walkin" element={<WalkinBooking hotel={hotel} user={user} />} />
            <Route path="/guests" element={<ActiveGuests hotel={hotel} />} />
            <Route path="/shift" element={<ShiftSummary user={user} hotel={hotel} shiftStart={shiftStart} />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20 px-1 py-1 safe-area-bottom" data-testid="mobile-tab-bar">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const active = isActive(item.path, item.exact);
            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center py-1.5 px-2 rounded-lg min-w-[56px] ${active ? "text-[#E07B2A]" : "text-[#A1A1AA]"}`}
                data-testid={`mob-${item.path.replace("/cashier/", "").replace("/cashier", "checkins")}`}>
                <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[9px] font-medium mt-0.5 truncate max-w-[52px]">{item.shortLabel}</span>
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
  const { lang } = useLang();
  const locale = lang === "sw" ? "sw-TZ" : "en-TZ";
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
      toast.success(lang === "sw" ? `${b.guest_name} amethibitishwa` : `${b.guest_name} checked in`);
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed")); }
  };
  const handleCheckout = async (b) => {
    try {
      await api.post(`/cashier/confirm-checkout/${b.id}`);
      toast.success(lang === "sw" ? `${b.guest_name} ameondoka. Chumba kimerudishwa.` : `${b.guest_name} checked out. Room released.`);
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed")); }
  };

  const filtered = bookings.filter(b => {
    const matchSearch = b.guest_name.toLowerCase().includes(search.toLowerCase()) || b.booking_ref.toLowerCase().includes(search.toLowerCase());
    if (filter === "awaiting") return matchSearch && b.checkin_status === "not_checked_in";
    if (filter === "checked_in") return matchSearch && b.checkin_status === "checked_in";
    if (filter === "checked_out") return matchSearch && b.checkin_status === "checked_out";
    return matchSearch;
  });

  if (loading) return <LoadingSpinner />;

  const filterTabs = [
    ["all", lang === "sw" ? "Zote" : "All"],
    ["awaiting", lang === "sw" ? "Inasubiri" : "Awaiting"],
    ["checked_in", lang === "sw" ? "Amewasili" : "In"],
    ["checked_out", lang === "sw" ? "Ameondoka" : "Out"],
  ];

  return (
    <div className="space-y-4" data-testid="todays-checkins-page">
      {/* Page title */}
      <div>
        <h1 className="font-['Outfit'] text-xl font-bold text-[#18181B]">{lang === "sw" ? "Check-ins Leo" : "Today's Check-ins"}</h1>
        <p className="text-xs text-[#52525B] mt-0.5">{new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Search + filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
          <input type="text" placeholder={lang === "sw" ? "Tafuta kwa jina au Ref..." : "Search by name or Ref..."} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white" data-testid="search-checkins" />
        </div>
        {/* Scrollable filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {filterTabs.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-full transition-all border ${
                filter === val
                  ? "bg-[#0F4C5C] text-white border-[#0F4C5C]"
                  : "bg-white text-[#52525B] border-border"
              }`}
              data-testid={`filter-${val}`}>{label}
              {val !== "all" && (
                <span className="ml-1.5 opacity-70">
                  ({bookings.filter(b => val === "awaiting" ? b.checkin_status === "not_checked_in" : b.checkin_status === val).length})
                </span>
              )}
              {val === "all" && <span className="ml-1.5 opacity-70">({bookings.length})</span>}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Calendar className="w-10 h-10 text-[#D4D4D8] mx-auto mb-3" />
          <p className="text-[#A1A1AA] text-sm">{lang === "sw" ? "Hakuna check-ins za leo kwa sasa." : "No check-ins today yet."}</p>
        </div>
      ) : (
        <>
          {/* Mobile-first cards (shown always, table hidden on mobile) */}
          <div className="space-y-3 md:hidden">
            {filtered.map(b => (
              <div key={b.id} className={`bg-white rounded-2xl border border-border p-4 space-y-3 ${b.checkin_status === "checked_out" ? "opacity-50" : ""}`} data-testid={`checkin-card-${b.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[#18181B] text-base truncate">{b.guest_name}</p>
                    <p className="text-xs text-[#52525B]">{b.guest_phone}</p>
                  </div>
                  <StatusBadge status={b.checkin_status} lang={lang} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Chumba" : "Room"}</p>
                    <p className="text-sm font-medium text-[#18181B]">{b.room_type_name} · {b.nights}n</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#A1A1AA]">Ref</p>
                    <p className="text-xs font-mono text-[#0F4C5C] font-bold">{b.booking_ref}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <p className="font-bold text-[#18181B]">TZS {(b.total_amount_tzs || 0).toLocaleString()}</p>
                  {b.payment_status === "paid" && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">{lang === "sw" ? "Imelipwa" : "Paid"}</span>
                  )}
                </div>
                {b.checkin_status === "not_checked_in" && b.payment_status === "paid" && (
                  <button onClick={() => setModal({type:"checkin", booking: b})}
                    className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
                    data-testid={`checkin-btn-${b.id}`}>{lang === "sw" ? "Thibitisha Kuwasili" : "Confirm Check-in"}</button>
                )}
                {b.checkin_status === "not_checked_in" && b.payment_status !== "paid" && (
                  <div className="flex items-center gap-2 py-2.5 px-3 bg-yellow-50 rounded-xl text-xs text-yellow-700 font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />{lang === "sw" ? "Haijalipiwa" : "Not Paid"}
                  </div>
                )}
                {b.checkin_status === "checked_in" && (
                  <button onClick={() => setModal({type:"checkout", booking: b})}
                    className="w-full py-3.5 bg-[#52525B] text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
                    data-testid={`checkout-btn-${b.id}`}>{lang === "sw" ? "Thibitisha Kuondoka" : "Confirm Check-out"}</button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full" data-testid="checkins-table">
              <thead className="bg-[#F4F4F5]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Ref#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Mgeni" : "Guest"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Simu" : "Phone"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Chumba" : "Room"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Usiku" : "Nights"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Kiasi" : "Amount"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Hali" : "Status"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Kitendo" : "Action"}</th>
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
                    <td className="px-4 py-3"><StatusBadge status={b.checkin_status} lang={lang} /></td>
                    <td className="px-4 py-3">
                      {b.checkin_status === "not_checked_in" && b.payment_status === "paid" && (
                        <button onClick={() => setModal({type:"checkin", booking: b})}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all"
                          data-testid={`checkin-btn-${b.id}`}>{lang === "sw" ? "Thibitisha Kuwasili" : "Confirm Check-in"}</button>
                      )}
                      {b.checkin_status === "not_checked_in" && b.payment_status !== "paid" && (
                        <span className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{lang === "sw" ? "Haijalipiwa" : "Not Paid"}</span>
                      )}
                      {b.checkin_status === "checked_in" && (
                        <button onClick={() => setModal({type:"checkout", booking: b})}
                          className="px-3 py-1.5 bg-[#52525B] text-white text-xs font-medium rounded-lg hover:bg-[#3F3F46] transition-all"
                          data-testid={`checkout-btn-${b.id}`}>{lang === "sw" ? "Thibitisha Kuondoka" : "Confirm Check-out"}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confirm modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 space-y-4" data-testid="confirm-modal">
            <div className="w-10 h-1 bg-[#E4E4E7] rounded-full mx-auto mb-2 md:hidden" />
            <h3 className="font-['Outfit'] text-lg font-bold text-[#18181B]">
              {modal.type === "checkin"
                ? (lang === "sw" ? `Thibitisha kwamba ${modal.booking.guest_name} amewasili?` : `Confirm ${modal.booking.guest_name} has arrived?`)
                : (lang === "sw" ? `Thibitisha kwamba ${modal.booking.guest_name} ameondoka?` : `Confirm ${modal.booking.guest_name} has checked out?`)}
            </h3>
            <div className="bg-[#F4F4F5] rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-[#52525B]">Ref:</span><span className="font-mono font-bold text-[#0F4C5C]">{modal.booking.booking_ref}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">{lang === "sw" ? "Chumba:" : "Room:"}</span><span className="font-medium">{modal.booking.room_type_name}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">{lang === "sw" ? "Tarehe:" : "Dates:"}</span><span className="text-xs">{modal.booking.checkin_date} → {modal.booking.checkout_date}</span></div>
              <div className="flex justify-between items-center pt-1 border-t border-border"><span className="text-[#52525B]">{lang === "sw" ? "Kiasi:" : "Amount:"}</span><span className="font-bold text-lg text-[#18181B]">TZS {(modal.booking.total_amount_tzs || 0).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 py-3.5 border border-border rounded-xl font-semibold text-sm text-[#52525B]">{lang === "sw" ? "Ghairi" : "Cancel"}</button>
              <button onClick={() => modal.type === "checkin" ? handleCheckin(modal.booking) : handleCheckout(modal.booking)}
                className={`flex-[2] py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-all ${modal.type === "checkin" ? "bg-green-600" : "bg-[#0F4C5C]"}`}
                data-testid="confirm-action-btn"><Check className="w-4 h-4" />{lang === "sw" ? "Thibitisha" : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════ BOOKING VERIFICATION ════════════════
const VerifyBooking = ({ hotel }) => {
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.post("/cashier/verify-booking", { search: search.trim() });
      setResult(res.data);
    } catch (err) { toast.error(lang === "sw" ? "Imeshindikana kutafuta" : "Search failed"); } finally { setLoading(false); }
  };

  const handleCheckin = async () => {
    if (!result?.id) return;
    try {
      await api.post(`/cashier/confirm-checkin/${result.id}`);
      toast.success(lang === "sw" ? `${result.guest_name} amethibitishwa` : `${result.guest_name} checked in`);
      setResult(null); setSearch("");
    } catch (err) { toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed")); }
  };

  return (
    <div className="space-y-4" data-testid="verify-booking-page">
      <div>
        <h1 className="font-['Outfit'] text-xl font-bold text-[#18181B]">{lang === "sw" ? "Thibitisha Booking" : "Verify Booking"}</h1>
        <p className="text-xs text-[#52525B] mt-0.5">{lang === "sw" ? "Tafuta kwa namba, simu, au jina la mgeni" : "Search by ref number, phone, or guest name"}</p>
      </div>

      {/* Search — stacked on mobile */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
          <input type="text" placeholder={lang === "sw" ? "HS-2026-XXXX, 07XX, au jina..." : "HS-2026-XXXX, 07XX, or name..."} value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white"
            data-testid="verify-search-input" />
        </div>
        <button onClick={handleSearch} disabled={loading || !search.trim()}
          className="w-full py-3.5 bg-[#0F4C5C] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          data-testid="verify-search-btn">
          {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? (lang === "sw" ? "Inatafuta..." : "Searching...") : (lang === "sw" ? "Tafuta Booking" : "Search Booking")}
        </button>
      </div>

      {result && !result.found && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3" data-testid="verify-not-found">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="font-medium text-red-800 text-sm">{result.message}</p>
        </div>
      )}

      {result && result.found && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden" data-testid="verify-result-card">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[#0F4C5C] font-bold text-base">{result.booking_ref}</p>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${result.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {result.payment_status === "paid" ? (lang === "sw" ? "IMELIPWA" : "PAID") : (lang === "sw" ? "HAIJALIPIWA" : "UNPAID")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 bg-[#F4F4F5] rounded-xl p-3">
                <p className="text-[#A1A1AA] text-xs mb-0.5">{lang === "sw" ? "Mgeni" : "Guest"}</p>
                <p className="font-bold text-[#18181B]">{result.guest_name}</p>
                <p className="text-xs text-[#52525B]">{result.guest_phone}</p>
              </div>
              <div><p className="text-[#A1A1AA] text-xs">{lang === "sw" ? "Chumba" : "Room"}</p><p className="font-medium">{result.room_type_name}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">{lang === "sw" ? "Usiku" : "Nights"}</p><p className="font-medium">{result.nights}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">Check-in</p><p className="font-medium text-sm">{result.checkin_date}</p></div>
              <div><p className="text-[#A1A1AA] text-xs">Check-out</p><p className="font-medium text-sm">{result.checkout_date}</p></div>
            </div>
            <div className="bg-[#F4F4F5] rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm text-[#52525B]">{lang === "sw" ? "Jumla ya Kiasi" : "Total Amount"}</p>
              <p className="text-xl font-bold text-[#18181B]">TZS {(result.total_amount_tzs || 0).toLocaleString()}</p>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-2">
                {result.errors.map((err, i) => (
                  <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                    err.type === "unpaid" ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"
                  }`}>
                    {err.type === "unpaid" ? <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <p className={err.type === "unpaid" ? "text-yellow-800" : "text-red-800"}>{err.message}</p>
                  </div>
                ))}
              </div>
            )}
            {result.can_checkin && (
              <button onClick={handleCheckin}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
                data-testid="verify-confirm-checkin-btn">
                <CheckCircle2 className="w-5 h-5" /> {lang === "sw" ? "Thibitisha Kuwasili" : "Confirm Check-in"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════ PAGE 2: WALK-IN BOOKING (mobile-first) ════════════════
const WalkinBooking = ({ hotel, user }) => {
  const { lang } = useLang();
  const locale = lang === "sw" ? "sw-TZ" : "en-TZ";
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
      toast.success(lang === "sw" ? "Walk-in imerekodishwa!" : "Walk-in recorded!");
    } catch (err) { toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed")); } finally { setSubmitting(false); }
  };

  const resetFlow = () => {
    setStep(1); setSelectedRoom(null); setConfirmation(null);
    setForm({ guest_name: "", guest_phone: "", checkin_date: new Date().toISOString().split("T")[0], checkout_date: "", payment_method: "cash", notes: "" });
  };

  if (loading) return <LoadingSpinner />;

  // ── Confirmation screen ──
  if (confirmation) return (
    <div className="space-y-5" data-testid="walkin-confirmation">
      {/* Success hero */}
      <div className="bg-green-50 rounded-2xl p-6 text-center space-y-3">
        <div className="bg-green-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <Check className="w-8 h-8 text-white stroke-[3]" />
        </div>
        <div>
          <h2 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">{lang === "sw" ? "Imefanikiwa!" : "Recorded!"}</h2>
          <p className="text-sm text-[#52525B]">{lang === "sw" ? "Walk-in imerekodishwa" : "Walk-in has been recorded"}</p>
        </div>
        <div className="bg-white rounded-xl px-6 py-3 inline-block">
          <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wide">Booking Ref</p>
          <p className="font-mono text-2xl font-bold text-[#0F4C5C]" data-testid="walkin-booking-ref">{confirmation.booking_ref}</p>
        </div>
      </div>

      {/* Receipt summary */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-2.5 text-sm">
        <div className="flex justify-between"><span className="text-[#A1A1AA]">{lang === "sw" ? "Mgeni" : "Guest"}</span><span className="font-semibold">{confirmation.guest_name}</span></div>
        <div className="flex justify-between"><span className="text-[#A1A1AA]">{lang === "sw" ? "Simu" : "Phone"}</span><span>{confirmation.guest_phone}</span></div>
        <div className="flex justify-between"><span className="text-[#A1A1AA]">{lang === "sw" ? "Chumba" : "Room"}</span><span className="font-semibold">{confirmation.room_type_name}</span></div>
        <div className="flex justify-between"><span className="text-[#A1A1AA]">Check-in</span><span>{confirmation.checkin_date}</span></div>
        <div className="flex justify-between"><span className="text-[#A1A1AA]">Check-out</span><span>{confirmation.checkout_date}</span></div>
        <div className="flex justify-between"><span className="text-[#A1A1AA]">{lang === "sw" ? "Usiku" : "Nights"}</span><span>{confirmation.nights}</span></div>
        <div className="flex justify-between border-t border-border pt-2.5 items-center">
          <span className="text-[#A1A1AA]">{lang === "sw" ? "Malipo" : "Payment"}</span>
          <span className="font-medium">{confirmation.payment_method === "cash" ? "Cash" : confirmation.payment_method === "mpesa" ? "M-Pesa" : "Card"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#18181B]">{lang === "sw" ? "Jumla" : "Total"}</span>
          <span className="font-bold text-xl text-[#0F4C5C]">TZS {(confirmation.total_amount_tzs || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button onClick={() => window.print()} className="w-full py-3.5 border border-border rounded-xl font-semibold text-sm text-[#52525B] flex items-center justify-center gap-2 bg-white" data-testid="print-receipt-btn">
          <Printer className="w-4 h-4" /> {lang === "sw" ? "Chapisha Risiti" : "Print Receipt"}
        </button>
        <button onClick={resetFlow} className="w-full py-3.5 bg-[#0F4C5C] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all" data-testid="new-walkin-btn">
          <UserCheck className="w-4 h-4" /> {lang === "sw" ? "Walk-in Nyingine" : "New Walk-in"}
        </button>
      </div>

      {/* Print template */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-8 print:z-[9999]">
        <div className="max-w-sm mx-auto font-mono text-sm space-y-2">
          <div className="text-center border-b-2 border-black pb-2">
            <p className="font-bold text-lg">HABARI STAYS</p>
            <p className="text-xs">habaristays.com</p>
          </div>
          <p className="font-bold text-center">{confirmation.hotel_name}</p>
          <p className="text-center text-xs">{confirmation.hotel_address}</p>
          <div className="border-t border-dashed border-black pt-2">
            <p className="font-bold text-center">{lang === "sw" ? "RISITI YA MALIPO" : "PAYMENT RECEIPT"}</p>
          </div>
          <p>Ref: {confirmation.booking_ref}</p>
          <p>{lang === "sw" ? "Tarehe" : "Date"}: {new Date(confirmation.created_at).toLocaleString(locale)}</p>
          <div className="border-t border-dashed border-black pt-2">
            <p>{lang === "sw" ? "Mgeni" : "Guest"}: {confirmation.guest_name}</p>
            <p>{lang === "sw" ? "Simu" : "Phone"}: {confirmation.guest_phone}</p>
            <p>{lang === "sw" ? "Chumba" : "Room"}: {confirmation.room_type_name}</p>
            <p>Check-in: {confirmation.checkin_date}</p>
            <p>Check-out: {confirmation.checkout_date}</p>
            <p>{lang === "sw" ? "Usiku" : "Nights"}: {confirmation.nights}</p>
          </div>
          <div className="border-t-2 border-black pt-2 text-center">
            <p className="font-bold text-lg">{lang === "sw" ? "Jumla" : "Total"}: TZS {(confirmation.total_amount_tzs || 0).toLocaleString()}</p>
            <p>{lang === "sw" ? "Malipo" : "Payment"}: {confirmation.payment_method === "cash" ? "Cash" : confirmation.payment_method === "mpesa" ? "M-Pesa" : "Card"}</p>
          </div>
          <div className="border-t border-dashed border-black pt-2">
            <p>{lang === "sw" ? "Mweka Hazina" : "Cashier"}: {confirmation.cashier_name}</p>
          </div>
          <div className="text-center pt-2 border-t border-dashed border-black">
            <p className="text-xs">{lang === "sw" ? "Asante kwa kuchagua" : "Thank you for choosing"}</p>
            <p className="font-bold">{confirmation.hotel_name}</p>
            <p className="text-xs">Powered by Habari Stays</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step indicator ──
  const StepBar = () => (
    <div className="flex items-center justify-center gap-0 mb-5">
      {[
        { n: 1, label: lang === "sw" ? "Chumba" : "Room" },
        { n: 2, label: lang === "sw" ? "Taarifa" : "Details" },
        { n: 3, label: lang === "sw" ? "Thibitisha" : "Confirm" },
      ].map(({ n, label }, idx) => (
        <React.Fragment key={n}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              step > n ? "bg-[#0F4C5C] border-[#0F4C5C] text-white" :
              step === n ? "bg-[#0F4C5C] border-[#0F4C5C] text-white" :
              "bg-white border-[#D4D4D8] text-[#A1A1AA]"
            }`}>
              {step > n ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : n}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${step >= n ? "text-[#0F4C5C]" : "text-[#A1A1AA]"}`}>{label}</span>
          </div>
          {idx < 2 && (
            <div className={`w-10 h-0.5 mx-1 mb-4 ${step > n ? "bg-[#0F4C5C]" : "bg-[#D4D4D8]"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Selected room compact chip (shown on steps 2 & 3) ──
  const RoomChip = () => selectedRoom ? (
    <div className="flex items-center justify-between bg-[#0F4C5C]/5 border border-[#0F4C5C]/20 rounded-xl px-4 py-2.5 mb-4">
      <div className="flex items-center gap-2">
        <BedDouble className="w-4 h-4 text-[#0F4C5C] flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-[#0F4C5C]">{selectedRoom.name}</p>
          <p className="text-[10px] text-[#52525B]">TZS {(selectedRoom.price_per_night || 0).toLocaleString()}/{lang === "sw" ? "usiku" : "night"}</p>
        </div>
      </div>
      <button onClick={() => { setStep(1); setSelectedRoom(null); }} className="text-[10px] text-[#E07B2A] font-semibold underline">{lang === "sw" ? "Badilisha" : "Change"}</button>
    </div>
  ) : null;

  return (
    <div className="space-y-0" data-testid="walkin-booking-page">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-['Outfit'] text-xl font-bold text-[#18181B]">Walk-in Booking</h1>
        <p className="text-xs text-[#52525B] mt-0.5">{lang === "sw" ? "Rekodi mgeni aliyekuja moja kwa moja" : "Record a guest who arrived directly"}</p>
      </div>

      <StepBar />

      {/* ── STEP 1: Room selection ── */}
      {step === 1 && (
        <div className="space-y-3" data-testid="walkin-step-1">
          <h2 className="font-['Outfit'] text-base font-bold text-[#18181B]">{lang === "sw" ? "Chagua Chumba" : "Select a Room"}</h2>
          {rooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-10 text-center">
              <BedDouble className="w-10 h-10 text-[#D4D4D8] mx-auto mb-3" />
              <p className="text-[#A1A1AA] text-sm">{lang === "sw" ? "Hakuna vyumba vinavyopatikana sasa hivi." : "No rooms available right now."}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rooms.map(room => {
                const isSelected = selectedRoom?.id === room.id;
                const isFull = room.available_rooms < 1;
                return (
                  <div key={room.id}
                    className={`bg-white rounded-2xl border-2 p-4 transition-all ${
                      isSelected ? "border-[#0F4C5C] shadow-sm" :
                      isFull ? "border-border opacity-50" :
                      "border-border active:border-[#0F4C5C]/40"
                    } ${isFull ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !isFull && setSelectedRoom(room)}
                    data-testid={`room-card-${room.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#18181B]">{room.name}</h3>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${room.available_rooms > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {room.available_rooms > 0
                              ? `${room.available_rooms} ${lang === "sw" ? "vinapatikana" : "available"}`
                              : (lang === "sw" ? "Hakuna" : "Full")}
                          </span>
                        </div>
                        <p className="text-[#0F4C5C] font-bold text-lg mt-1">
                          TZS {(room.price_per_night || 0).toLocaleString()}
                          <span className="text-xs font-normal text-[#A1A1AA] ml-1">/ {lang === "sw" ? "usiku" : "night"}</span>
                        </p>
                        {room.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.amenities.slice(0, 4).map(a => (
                              <span key={a} className="px-2 py-0.5 bg-[#F4F4F5] text-[#52525B] text-[10px] rounded-full">{a}</span>
                            ))}
                            {room.amenities.length > 4 && (
                              <span className="text-[10px] text-[#A1A1AA]">+{room.amenities.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ml-3 mt-0.5 flex items-center justify-center transition-all ${isSelected ? "bg-[#0F4C5C] border-[#0F4C5C]" : "border-[#D4D4D8]"}`}>
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {selectedRoom && (
            <button onClick={() => setStep(2)} className="w-full py-4 bg-[#0F4C5C] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm" data-testid="walkin-next-step2">
              {lang === "sw" ? "Endelea" : "Continue"} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── STEP 2: Guest details ── */}
      {step === 2 && (
        <div className="space-y-4" data-testid="walkin-step-2">
          <RoomChip />
          <h2 className="font-['Outfit'] text-base font-bold text-[#18181B]">{lang === "sw" ? "Taarifa za Mgeni" : "Guest Details"}</h2>
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#52525B] mb-1.5">{lang === "sw" ? "Jina Kamili *" : "Full Name *"}</label>
              <input type="text" value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})}
                className="w-full px-4 py-3.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white"
                placeholder="e.g. John Doe" data-testid="walkin-guest-name" />
            </div>
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#52525B] mb-1.5">{lang === "sw" ? "Namba ya Simu *" : "Phone Number *"}</label>
              <input type="tel" value={form.guest_phone} onChange={e => setForm({...form, guest_phone: e.target.value})}
                className="w-full px-4 py-3.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white"
                placeholder="07XX XXX XXX" data-testid="walkin-guest-phone" />
            </div>
            {/* Dates — side by side */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#52525B] mb-1.5">Check-in</label>
                <input type="date" value={form.checkin_date} onChange={e => setForm({...form, checkin_date: e.target.value})}
                  className="w-full px-3 py-3.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white" data-testid="walkin-checkin-date" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#52525B] mb-1.5">Check-out *</label>
                <input type="date" value={form.checkout_date} onChange={e => setForm({...form, checkout_date: e.target.value})}
                  min={form.checkin_date} className="w-full px-3 py-3.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white" data-testid="walkin-checkout-date" />
              </div>
            </div>
            {/* Nights banner */}
            {nights > 0 && (
              <div className="bg-[#0F4C5C]/5 border border-[#0F4C5C]/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-[#52525B] font-medium">{lang === "sw" ? "Jumla ya Usiku" : "Total nights"}</span>
                <span className="font-bold text-[#0F4C5C]">{nights} {lang === "sw" ? "usiku" : "night(s)"}</span>
              </div>
            )}
            {/* Payment method */}
            <div>
              <label className="block text-xs font-semibold text-[#52525B] mb-2">{lang === "sw" ? "Njia ya Malipo *" : "Payment Method *"}</label>
              <div className="grid grid-cols-3 gap-2">
                {[["cash","Cash",Banknote],["mpesa","M-Pesa",Smartphone],["card","Card",CreditCard]].map(([val,label,Icon]) => (
                  <button key={val} onClick={() => setForm({...form, payment_method: val})}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      form.payment_method === val ? "border-[#0F4C5C] bg-[#0F4C5C] text-white" : "border-border text-[#52525B] bg-white"
                    }`} data-testid={`payment-${val}`}>
                    <Icon className="w-5 h-5" />{label}
                  </button>
                ))}
              </div>
            </div>
            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#52525B] mb-1.5">{lang === "sw" ? "Maelezo (si lazima)" : "Notes (optional)"}</label>
              <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full px-4 py-3.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white"
                placeholder={lang === "sw" ? "Mfano: chumba kimya" : "e.g. requested quiet room"} data-testid="walkin-notes" />
            </div>
          </div>
          {/* Navigation */}
          <div className="flex gap-2.5 pt-1">
            <button onClick={() => setStep(1)} className="flex-1 py-3.5 border border-border rounded-xl font-semibold text-sm text-[#52525B] bg-white flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> {lang === "sw" ? "Rudi" : "Back"}
            </button>
            <button onClick={() => setStep(3)} disabled={!form.guest_name || !form.guest_phone || nights < 1}
              className="flex-[2] py-3.5 bg-[#0F4C5C] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all" data-testid="walkin-next-step3">
              {lang === "sw" ? "Endelea" : "Continue"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirm & record ── */}
      {step === 3 && (
        <div className="space-y-4" data-testid="walkin-step-3">
          <RoomChip />
          <h2 className="font-['Outfit'] text-base font-bold text-[#18181B]">{lang === "sw" ? "Thibitisha na Rekodi" : "Confirm & Record"}</h2>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-[#F4F4F5] border-b border-border">
              <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">{lang === "sw" ? "Muhtasari wa Booking" : "Booking Summary"}</p>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">{lang === "sw" ? "Mgeni" : "Guest"}</span>
                <span className="font-bold text-[#18181B]">{form.guest_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">{lang === "sw" ? "Simu" : "Phone"}</span>
                <span className="text-[#18181B]">{form.guest_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">{lang === "sw" ? "Chumba" : "Room"}</span>
                <span className="font-semibold text-[#18181B]">{selectedRoom?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Check-in</span>
                <span>{form.checkin_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Check-out</span>
                <span>{form.checkout_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">{lang === "sw" ? "Malipo" : "Payment"}</span>
                <span className="font-medium">{form.payment_method === "cash" ? "Cash" : form.payment_method === "mpesa" ? "M-Pesa" : "Card"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">{lang === "sw" ? "Mweka Hazina" : "Cashier"}</span>
                <span>{user?.full_name}</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <div>
                  <p className="text-xs text-[#A1A1AA]">{nights} {lang === "sw" ? "usiku" : "night(s)"} × TZS {(selectedRoom?.price_per_night || 0).toLocaleString()}</p>
                </div>
                <p className="text-2xl font-bold text-[#0F4C5C]">TZS {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2.5">
            <button onClick={() => setStep(2)} className="flex-1 py-3.5 border border-border rounded-xl font-semibold text-sm text-[#52525B] bg-white flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> {lang === "sw" ? "Rudi" : "Back"}
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-[2] py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm" data-testid="walkin-confirm-btn">
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              {lang === "sw" ? "Rekodi Walk-in" : "Record Walk-in"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════ PAGE 3: ACTIVE GUESTS ════════════════
const ActiveGuests = ({ hotel }) => {
  const { lang } = useLang();
  const locale = lang === "sw" ? "sw-TZ" : "en-TZ";
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
      toast.success(lang === "sw" ? `${g.guest_name} ameondoka. Chumba kimerudishwa.` : `${g.guest_name} checked out. Room released.`);
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed")); }
  };

  const filtered = guests.filter(g =>
    g.guest_name.toLowerCase().includes(search.toLowerCase()) || g.booking_ref.toLowerCase().includes(search.toLowerCase())
  );

  const nightsColor = (n) => n >= 2 ? "text-green-600" : n === 1 ? "text-amber-500" : "text-red-500";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4" data-testid="active-guests-page">
      <div>
        <h1 className="font-['Outfit'] text-xl font-bold text-[#18181B]">{lang === "sw" ? "Wageni Waliopo" : "Current Guests"}</h1>
        <p className="text-xs text-[#52525B] mt-0.5">{guests.length} {lang === "sw" ? "wageni waliopo sasa hivi" : "guests currently staying"}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
        <input type="text" placeholder={lang === "sw" ? "Tafuta kwa jina au Ref..." : "Search by name or Ref..."} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white" data-testid="search-guests" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Users className="w-10 h-10 text-[#D4D4D8] mx-auto mb-3" />
          <p className="text-[#A1A1AA] text-sm">{lang === "sw" ? "Hakuna wageni waliopo sasa hivi." : "No guests currently staying."}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map(g => (
              <div key={g.id} className="bg-white rounded-2xl border border-border p-4 space-y-3" data-testid={`guest-card-${g.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[#18181B] text-base truncate">{g.guest_name}</p>
                    <p className="text-xs text-[#52525B]">{g.guest_phone}</p>
                  </div>
                  <span className={`text-lg font-bold flex-shrink-0 ${nightsColor(g.nights_left)}`}>
                    {g.nights_left}n
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Chumba" : "Room"}</p>
                    <p className="font-medium text-[#18181B]">{g.room_type_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#A1A1AA]">Ref</p>
                    <p className="text-xs font-mono text-[#0F4C5C] font-bold">{g.booking_ref}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A1A1AA]">{g.checkin_date} → {g.checkout_date}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${g.booking_type === "online" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                    {g.booking_type === "online" ? "ONLINE" : "WALK-IN"}
                  </span>
                </div>
                <button onClick={() => setModal(g)}
                  className="w-full py-3.5 bg-[#52525B] text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
                  data-testid={`checkout-guest-${g.id}`}>{lang === "sw" ? "Thibitisha Kuondoka" : "Confirm Check-out"}</button>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full" data-testid="guests-table">
              <thead className="bg-[#F4F4F5]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Ref#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Mgeni" : "Guest"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Simu" : "Phone"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Chumba" : "Room"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Ameingia" : "Checked In"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Ataondoka" : "Check-out"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Usiku" : "Nights Left"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Aina" : "Type"}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Kitendo" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(g => (
                  <tr key={g.id} data-testid={`guest-row-${g.id}`}>
                    <td className="px-4 py-3 text-xs font-mono text-[#0F4C5C]">{g.booking_ref}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#18181B]">{g.guest_name}</td>
                    <td className="px-4 py-3 text-xs text-[#52525B]">{g.guest_phone}</td>
                    <td className="px-4 py-3 text-sm text-[#52525B]">{g.room_type_name}</td>
                    <td className="px-4 py-3 text-xs text-[#52525B]">{g.actual_checkin_time ? new Date(g.actual_checkin_time).toLocaleString(locale, {hour:"2-digit",minute:"2-digit"}) : g.checkin_date}</td>
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
                        data-testid={`checkout-guest-${g.id}`}>{lang === "sw" ? "Thibitisha Kuondoka" : "Confirm Check-out"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Checkout modal — bottom sheet on mobile */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 space-y-4" data-testid="checkout-modal">
            <div className="w-10 h-1 bg-[#E4E4E7] rounded-full mx-auto mb-2 md:hidden" />
            <h3 className="font-['Outfit'] text-lg font-bold text-[#18181B]">
              {lang === "sw" ? `Thibitisha kwamba ${modal.guest_name} ameondoka?` : `Confirm ${modal.guest_name} has checked out?`}
            </h3>
            <div className="bg-[#F4F4F5] rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-[#52525B]">{lang === "sw" ? "Chumba:" : "Room:"}</span><span className="font-medium">{modal.room_type_name}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Check-in:</span><span>{modal.checkin_date}</span></div>
              <div className="flex justify-between"><span className="text-[#52525B]">Check-out:</span><span>{modal.checkout_date}</span></div>
              <div className="flex justify-between items-center pt-1 border-t border-border"><span className="text-[#52525B]">{lang === "sw" ? "Kiasi:" : "Amount:"}</span><span className="font-bold text-lg">TZS {(modal.total_amount_tzs || 0).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 py-3.5 border border-border rounded-xl font-semibold text-sm text-[#52525B]">{lang === "sw" ? "Ghairi" : "Cancel"}</button>
              <button onClick={() => handleCheckout(modal)}
                className="flex-[2] py-3.5 bg-[#0F4C5C] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                data-testid="confirm-checkout-btn"><Check className="w-4 h-4" />{lang === "sw" ? "Thibitisha" : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════ PAGE 4: SHIFT SUMMARY ════════════════
const ShiftSummary = ({ user, hotel, shiftStart }) => {
  const { lang } = useLang();
  const locale = lang === "sw" ? "sw-TZ" : "en-TZ";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/cashier/shift-summary-full").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-[#A1A1AA]">{lang === "sw" ? "Imeshindikana kupakia" : "Failed to load"}</p>;

  const stats = [
    { label: lang === "sw" ? "Walk-ins" : "Walk-ins", value: data.walkins_count, color: "bg-green-50 text-green-700", sub: `TZS ${(data.walkins_total || 0).toLocaleString()}` },
    { label: lang === "sw" ? "Check-ins" : "Check-ins", value: data.online_checkins_count, color: "bg-blue-50 text-blue-700", sub: "" },
    { label: "Checkouts", value: data.checkouts_count, color: "bg-gray-50 text-gray-700", sub: "" },
    { label: "Cash", value: `TZS ${(data.cash_total || 0).toLocaleString()}`, color: "bg-emerald-50 text-emerald-700", sub: "" },
    { label: "M-Pesa", value: `TZS ${(data.mpesa_total || 0).toLocaleString()}`, color: "bg-blue-50 text-blue-700", sub: "" },
    { label: "Card", value: `TZS ${(data.card_total || 0).toLocaleString()}`, color: "bg-purple-50 text-purple-700", sub: "" },
  ];

  const actionLabel = (type) => {
    if (type === "walkin_recorded") return lang === "sw" ? "Walk-in Imerekodishwa" : "Walk-in Recorded";
    if (type === "checkin_confirmed") return lang === "sw" ? "Check-in Imethibitishwa" : "Check-in Confirmed";
    return lang === "sw" ? "Checkout Imefanywa" : "Checkout Processed";
  };
  const actionDot = (type) => {
    if (type === "walkin_recorded") return "bg-green-500";
    if (type === "checkin_confirmed") return "bg-blue-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-4" data-testid="shift-summary-page">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-['Outfit'] text-xl font-bold text-[#18181B]">{lang === "sw" ? "Muhtasari wa Zamu" : "Shift Summary"}</h1>
          <p className="text-xs text-[#52525B] mt-0.5">{data.date} · {user?.full_name}</p>
        </div>
        <button onClick={() => window.print()} className="flex-shrink-0 p-2.5 border border-border rounded-xl text-[#52525B] bg-white" data-testid="print-shift-btn">
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Total revenue hero */}
      <div className="bg-[#0F4C5C] rounded-2xl p-5 text-white">
        <p className="text-xs opacity-70 uppercase tracking-wide">{lang === "sw" ? "Jumla ya Mapato Leo" : "Total Revenue Today"}</p>
        <p className="text-3xl font-bold font-mono mt-1" data-testid="total-revenue">TZS {(data.total_revenue || 0).toLocaleString()}</p>
        <p className="text-xs opacity-60 mt-1">{lang === "sw" ? "Zamu ilianza" : "Shift started"}: {shiftStart?.toLocaleTimeString(locale, {hour:"2-digit",minute:"2-digit"})}</p>
      </div>

      {/* Stats grid — 2 cols on mobile, 3 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {stats.map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4`}>
            <p className="text-xs opacity-70 font-medium">{s.label}</p>
            <p className="text-lg font-bold mt-1 leading-tight">{s.value}</p>
            {s.sub && <p className="text-[10px] opacity-70 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-['Outfit'] font-semibold text-sm text-[#18181B]">{lang === "sw" ? "Shughuli za Leo" : "Today's Activity"}</h3>
          <span className="text-xs text-[#A1A1AA]">{data.activity_log.length}</span>
        </div>
        {data.activity_log.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#A1A1AA]">{lang === "sw" ? "Hakuna shughuli bado." : "No activity yet."}</div>
        ) : (
          <>
            {/* Mobile activity cards */}
            <div className="divide-y divide-border md:hidden">
              {data.activity_log.map(l => (
                <div key={l.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${actionDot(l.action_type)}`} />
                      <span className="text-xs font-semibold text-[#18181B]">{actionLabel(l.action_type)}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A1A1AA]">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString(locale, {hour:"2-digit",minute:"2-digit"}) : ""}</span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <p className="text-xs text-[#52525B]">{l.guest_name} · {l.room_type_name}</p>
                    {l.amount_tzs ? <p className="text-xs font-bold text-[#18181B]">TZS {l.amount_tzs.toLocaleString()}</p> : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="w-full hidden md:table" data-testid="activity-log-table">
              <thead className="bg-[#F4F4F5]">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Saa" : "Time"}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Kitendo" : "Action"}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Mgeni" : "Guest"}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Chumba" : "Room"}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Kiasi" : "Amount"}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Njia" : "Method"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.activity_log.map(l => (
                  <tr key={l.id}>
                    <td className="px-4 py-2 text-xs font-mono text-[#52525B]">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString(locale, {hour:"2-digit",minute:"2-digit"}) : ""}</td>
                    <td className="px-4 py-2 text-xs flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${actionDot(l.action_type)}`} />{actionLabel(l.action_type)}</td>
                    <td className="px-4 py-2 text-xs text-[#18181B]">{l.guest_name}</td>
                    <td className="px-4 py-2 text-xs text-[#52525B]">{l.room_type_name}</td>
                    <td className="px-4 py-2 text-xs font-medium">{l.amount_tzs ? `TZS ${l.amount_tzs.toLocaleString()}` : "-"}</td>
                    <td className="px-4 py-2 text-xs text-[#52525B]">{l.payment_method || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Print template */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-8 print:z-[9999]">
        <div className="max-w-md mx-auto font-mono text-sm space-y-2">
          <p className="font-bold text-center text-lg">HABARI STAYS - {lang === "sw" ? "MUHTASARI WA ZAMU" : "SHIFT SUMMARY"}</p>
          <p className="text-center">{data.hotel_name}</p>
          <p className="text-center text-xs">{data.hotel_address}</p>
          <div className="border-t border-dashed border-black pt-2">
            <p>{lang === "sw" ? "Tarehe" : "Date"}: {data.date}</p>
            <p>{lang === "sw" ? "Mweka Hazina" : "Cashier"}: {data.cashier_name}</p>
            <p>{lang === "sw" ? "Zamu ilianza" : "Shift started"}: {shiftStart?.toLocaleTimeString(locale, {hour:"2-digit",minute:"2-digit"})}</p>
          </div>
          <div className="border-t border-dashed border-black pt-2">
            <p>Walk-ins: {data.walkins_count} - TZS {(data.walkins_total || 0).toLocaleString()}</p>
            <p>Check-ins: {data.online_checkins_count}</p>
            <p>Checkouts: {data.checkouts_count}</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold">{lang === "sw" ? "PESA ILIYOKUSANYWA:" : "MONEY COLLECTED:"}</p>
            <p>Cash: TZS {(data.cash_total || 0).toLocaleString()}</p>
            <p>M-Pesa: TZS {(data.mpesa_total || 0).toLocaleString()}</p>
            <p>Card: TZS {(data.card_total || 0).toLocaleString()}</p>
            <p className="font-bold text-lg mt-2">{lang === "sw" ? "JUMLA" : "TOTAL"}: TZS {(data.total_revenue || 0).toLocaleString()}</p>
          </div>
          <div className="border-t border-dashed border-black pt-4 mt-4">
            <p>{lang === "sw" ? "Sahihi" : "Signature"}: _______________</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════ SHARED COMPONENTS ════════════════
const StatusBadge = ({ status, lang }) => {
  if (status === "not_checked_in") return <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">{lang === "sw" ? "Inasubiri" : "Awaiting"}</span>;
  if (status === "checked_in") return <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">{lang === "sw" ? "Amewasili" : "Checked In"}</span>;
  if (status === "checked_out") return <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">{lang === "sw" ? "Ameondoka" : "Checked Out"}</span>;
  return null;
};

export default CashierDashboard;
