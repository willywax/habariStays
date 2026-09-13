import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, useAuth, useLang, LanguageToggle } from "../App";
import PhotoManager from "../components/PhotoManager";
import {
  Building2, LogOut, Search, MapPin, Save, Plus, Trash2, Pencil, ChevronLeft
} from "lucide-react";

const HOTEL_AMENITIES = ["Breakfast", "Parking", "WiFi", "Hot Water", "Bar"];

const CALL_STATUS_STYLES = {
  pending: { bg: "bg-gray-100", text: "text-gray-600", en: "Pending", sw: "Inasubiri" },
  called: { bg: "bg-blue-100", text: "text-blue-700", en: "Called", sw: "Imepigiwa" },
  verified: { bg: "bg-green-100", text: "text-green-700", en: "Verified", sw: "Imethibitishwa" },
  unreachable: { bg: "bg-red-100", text: "text-red-700", en: "Unreachable", sw: "Haipatikani" },
};

const CallStatusBadge = ({ status, lang }) => {
  const s = CALL_STATUS_STYLES[status] || CALL_STATUS_STYLES.pending;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
      {lang === "sw" ? s.sw : s.en}
    </span>
  );
};

// ════════════════ MAIN DASHBOARD SHELL ════════════════
const BackofficeDashboard = () => {
  const { user, logout } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/"); };
  const isHotelsActive = !location.pathname.includes("/edit") || location.pathname === "/backoffice";

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border fixed h-full flex-col" data-testid="backoffice-sidebar">
        <div className="p-5 border-b border-border">
          <h2 className="font-['Outfit'] text-lg font-bold text-[#0F4C5C]">Habari Stays</h2>
          <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Ofisi ya Nyuma" : "Backoffice"}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/backoffice/hotels"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isHotelsActive ? "bg-[#0F4C5C] text-white" : "text-[#52525B] hover:bg-[#F4F4F5]"
            }`}
            data-testid="nav-hotels"
          >
            <Building2 className="w-5 h-5" />
            <span className="font-medium text-sm">{lang === "sw" ? "Hoteli" : "Hotels"}</span>
          </Link>
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 px-1">
            <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Ofisi ya Nyuma" : "Backoffice"}</p>
            <p className="font-medium text-sm text-[#18181B]">{user?.full_name}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-[#52525B] hover:bg-[#F4F4F5] rounded-lg transition-all" data-testid="logout-btn">
            <LogOut className="w-5 h-5" /><span className="font-medium text-sm">{lang === "sw" ? "Toka" : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        <header className="bg-white border-b border-border px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between sticky top-0 z-10" data-testid="backoffice-header">
          <div className="min-w-0 flex-1">
            <p className="font-['Outfit'] font-bold text-[#0F4C5C] text-sm md:text-base truncate leading-tight">
              {lang === "sw" ? "Ofisi ya Nyuma" : "Backoffice"}
            </p>
            <p className="text-[10px] text-[#A1A1AA] truncate leading-tight">{user?.full_name}</p>
          </div>
          <LanguageToggle />
        </header>

        <div className="px-3 py-4 md:p-6">
          <Routes>
            <Route path="/" element={<BackofficeHotelList />} />
            <Route path="/hotels" element={<BackofficeHotelList />} />
            <Route path="/hotels/:hotelId/edit" element={<BackofficeHotelEdit />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20 px-1 py-1 safe-area-bottom" data-testid="mobile-tab-bar">
        <div className="flex items-center justify-around">
          <Link to="/backoffice/hotels" className={`flex flex-col items-center py-1.5 px-2 rounded-lg min-w-[56px] ${isHotelsActive ? "text-[#E07B2A]" : "text-[#A1A1AA]"}`}>
            <Building2 className={`w-5 h-5 ${isHotelsActive ? "stroke-[2.5]" : ""}`} />
            <span className="text-[9px] font-medium mt-0.5">{lang === "sw" ? "Hoteli" : "Hotels"}</span>
          </Link>
          <button onClick={handleLogout} className="flex flex-col items-center py-1.5 px-2 rounded-lg min-w-[56px] text-[#A1A1AA]">
            <LogOut className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">{lang === "sw" ? "Toka" : "Logout"}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// ════════════════ HOTEL LIST ════════════════
const BackofficeHotelList = () => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/hotels/cities").then((r) => setCities(r.data)).catch(() => {});
    api.get("/backoffice/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchHotels(); }, [page, city, callStatus, search]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (city) params.city = city;
      if (callStatus) params.call_status = callStatus;
      if (search) params.search = search;
      const res = await api.get("/backoffice/hotels", { params });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Outfit'] text-2xl md:text-3xl font-bold text-[#18181B]">
          {lang === "sw" ? "Hoteli za Kupigia Simu" : "Hotels to Call"}
        </h1>
        <p className="text-[#52525B] text-sm">
          {lang === "sw" ? "Thibitisha na sasisha taarifa za hoteli kwa simu" : "Verify and update hotel details by phone"}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="backoffice-stats-bar">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-[#18181B]">{stats.total_hotels}</p>
            <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Jumla ya Hoteli" : "Total Hotels"}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-gray-500">{stats.pending}</p>
            <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Zinasubiri" : "Pending Calls"}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.called_today}</p>
            <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Zimepigiwa Leo" : "Called Today"}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            <p className="text-xs text-[#A1A1AA]">{lang === "sw" ? "Zimethibitishwa" : "Verified"}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={lang === "sw" ? "Tafuta kwa jina la hoteli..." : "Search by hotel name..."}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] text-sm"
            data-testid="backoffice-search-input"
          />
        </div>
        <select
          value={city}
          onChange={(e) => { setCity(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] text-sm"
          data-testid="backoffice-city-filter"
        >
          <option value="">{lang === "sw" ? "Miji Yote" : "All Cities"}</option>
          {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
        </select>
        <select
          value={callStatus}
          onChange={(e) => { setCallStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] text-sm"
          data-testid="backoffice-callstatus-filter"
        >
          <option value="">{lang === "sw" ? "Hali Zote" : "All Call Statuses"}</option>
          <option value="pending">{lang === "sw" ? "Inasubiri" : "Pending"}</option>
          <option value="called">{lang === "sw" ? "Imepigiwa" : "Called"}</option>
          <option value="verified">{lang === "sw" ? "Imethibitishwa" : "Verified"}</option>
          <option value="unreachable">{lang === "sw" ? "Haipatikani" : "Unreachable"}</option>
        </select>
        <button type="submit" className="bg-[#0F4C5C] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#0D3E4D]" data-testid="backoffice-search-btn">
          {lang === "sw" ? "Tafuta" : "Search"}
        </button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F4F4F5]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Jina" : "Name"}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Mji" : "City"}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Simu" : "Phone"}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Hali" : "Status"}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Hali ya Simu" : "Call Status"}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{lang === "sw" ? "Ilisasishwa" : "Last Updated"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((h) => (
                    <tr key={h.id} data-testid={`backoffice-hotel-row-${h.id}`}>
                      <td className="px-4 py-3 font-medium text-[#18181B]">{h.name}</td>
                      <td className="px-4 py-3 text-sm text-[#52525B]">{h.city}</td>
                      <td className="px-4 py-3 text-sm text-[#52525B]">{h.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm text-[#52525B] capitalize">{h.status}</td>
                      <td className="px-4 py-3"><CallStatusBadge status={h.call_status} lang={lang} /></td>
                      <td className="px-4 py-3 text-sm text-[#A1A1AA]">{h.last_updated ? new Date(h.last_updated).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/backoffice/hotels/${h.id}/edit`)}
                          className="bg-[#0F4C5C] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#0D3E4D]"
                          data-testid={`backoffice-update-btn-${h.id}`}
                        >
                          {lang === "sw" ? "Sasisha" : "Update"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">{lang === "sw" ? "Hakuna hoteli" : "No hotels found"}</div>}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border border-border p-4" data-testid={`backoffice-hotel-card-${h.id}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-[#18181B] truncate">{h.name}</p>
                    <p className="text-xs text-[#A1A1AA] truncate">{h.city} &middot; {h.phone || "-"}</p>
                  </div>
                  <CallStatusBadge status={h.call_status} lang={lang} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-[#A1A1AA]">{h.last_updated ? new Date(h.last_updated).toLocaleDateString() : "-"}</p>
                  <button
                    onClick={() => navigate(`/backoffice/hotels/${h.id}/edit`)}
                    className="bg-[#0F4C5C] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#0D3E4D]"
                    data-testid={`backoffice-update-btn-mobile-${h.id}`}
                  >
                    {lang === "sw" ? "Sasisha" : "Update"}
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">{lang === "sw" ? "Hakuna hoteli" : "No hotels found"}</div>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                data-testid="backoffice-prev-page"
              >
                {lang === "sw" ? "Iliyopita" : "Previous"}
              </button>
              <span className="text-sm text-[#52525B]">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                data-testid="backoffice-next-page"
              >
                {lang === "sw" ? "Inayofuata" : "Next"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ════════════════ ROOM TYPES (inline add/edit/delete) ════════════════
// Keep the wrapper identity stable so input state updates do not remount its children.
const RoomRow = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_140px_auto] gap-2 items-center">{children}</div>
);

export const RoomTypesSection = ({ hotelId, rooms, onChange, lang }) => {
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", total_rooms: 1, price_per_night: 50000 });
  const [saving, setSaving] = useState(false);

  const startEdit = (room) => {
    setEditingId(room.id);
    setForm({ name: room.name, total_rooms: room.total_rooms, price_per_night: room.price_per_night });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAdding(false);
    setForm({ name: "", total_rooms: 1, price_per_night: 50000 });
  };

  const saveEdit = async (roomId) => {
    if (!form.name.trim()) { toast.error(lang === "sw" ? "Jina la chumba linahitajika" : "Room name is required"); return; }
    setSaving(true);
    try {
      await api.patch(`/rooms/${roomId}`, {
        name: form.name,
        total_rooms: parseInt(form.total_rooms) || 1,
        price_per_night: parseInt(form.price_per_night) || 0,
      });
      toast.success(lang === "sw" ? "Chumba kimesasishwa" : "Room type updated");
      cancelEdit();
      onChange();
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed"));
    } finally {
      setSaving(false);
    }
  };

  const saveNew = async () => {
    if (!form.name.trim()) { toast.error(lang === "sw" ? "Jina la chumba linahitajika" : "Room name is required"); return; }
    setSaving(true);
    try {
      const count = parseInt(form.total_rooms) || 1;
      await api.post("/rooms", {
        hotel_id: hotelId,
        name: form.name,
        description: "",
        price_per_night: parseInt(form.price_per_night) || 0,
        capacity: 2,
        total_rooms: count,
        available_rooms: count,
        amenities: [],
        photos: [],
      });
      toast.success(lang === "sw" ? "Chumba kimeongezwa" : "Room type added");
      cancelEdit();
      onChange();
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed"));
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm(lang === "sw" ? "Futa chumba hiki?" : "Delete this room type?")) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      toast.success(lang === "sw" ? "Chumba kimefutwa" : "Room type deleted");
      onChange();
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kufuta" : "Failed to delete"));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">{lang === "sw" ? "Aina za Vyumba" : "Room Types"}</h3>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setEditingId(null); setForm({ name: "", total_rooms: 1, price_per_night: 50000 }); }}
            className="flex items-center gap-1 bg-[#0F4C5C] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#0D3E4D]"
            data-testid="add-room-type-btn"
          >
            <Plus className="w-4 h-4" /> {lang === "sw" ? "Ongeza" : "Add"}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div key={room.id} className="border border-border rounded-lg p-3">
            {editingId === room.id ? (
              <RoomRow>
                <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-border text-sm" placeholder={lang === "sw" ? "Jina la chumba" : "Room name"}
                  data-testid={`edit-room-name-${room.id}`} />
                <input type="number" min={0} value={form.total_rooms} onChange={(e) => setForm(prev => ({ ...prev, total_rooms: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-border text-sm" placeholder={lang === "sw" ? "Idadi" : "Rooms"} />
                <input type="number" min={0} value={form.price_per_night} onChange={(e) => setForm(prev => ({ ...prev, price_per_night: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-border text-sm" placeholder="TZS" />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(room.id)} disabled={saving} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50" data-testid={`save-room-${room.id}`}>
                    {lang === "sw" ? "Hifadhi" : "Save"}
                  </button>
                  <button onClick={cancelEdit} className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-[#F4F4F5]">
                    {lang === "sw" ? "Ghairi" : "Cancel"}
                  </button>
                </div>
              </RoomRow>
            ) : (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-medium text-[#18181B]">{room.name}</p>
                  <p className="text-sm text-[#52525B]">
                    {room.total_rooms} {lang === "sw" ? "vyumba" : "rooms"} &middot; TZS {(room.price_per_night || 0).toLocaleString()}/{lang === "sw" ? "usiku" : "night"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(room)} className="p-2 rounded-lg hover:bg-[#F4F4F5]" data-testid={`edit-room-${room.id}`}>
                    <Pencil className="w-4 h-4 text-[#52525B]" />
                  </button>
                  <button onClick={() => deleteRoom(room.id)} className="p-2 rounded-lg hover:bg-red-50" data-testid={`delete-room-${room.id}`}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {rooms.length === 0 && !adding && (
          <p className="text-sm text-[#A1A1AA] text-center py-4">{lang === "sw" ? "Hakuna vyumba" : "No room types yet"}</p>
        )}

        {adding && (
          <div className="border border-[#0F4C5C]/30 bg-[#0F4C5C]/5 rounded-lg p-3">
            <RoomRow>
              <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-border text-sm" placeholder={lang === "sw" ? "Jina la chumba" : "Room name"}
                data-testid="new-room-name" />
              <input type="number" min={0} value={form.total_rooms} onChange={(e) => setForm(prev => ({ ...prev, total_rooms: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-border text-sm" placeholder={lang === "sw" ? "Idadi" : "Rooms"}
                data-testid="new-room-count" />
              <input type="number" min={0} value={form.price_per_night} onChange={(e) => setForm(prev => ({ ...prev, price_per_night: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-border text-sm" placeholder="TZS"
                data-testid="new-room-price" />
              <div className="flex gap-2">
                <button onClick={saveNew} disabled={saving} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50" data-testid="save-new-room-btn">
                  {lang === "sw" ? "Ongeza" : "Add"}
                </button>
                <button onClick={cancelEdit} className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-[#F4F4F5]">
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
              </div>
            </RoomRow>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════ HOTEL EDIT ════════════════
const BackofficeHotelEdit = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [callLogs, setCallLogs] = useState([]);

  const [callStatus, setCallStatus] = useState("called");
  const [callNotes, setCallNotes] = useState("");
  const [calledAt, setCalledAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [savingCall, setSavingCall] = useState(false);

  const fetchHotel = async () => {
    try {
      const res = await api.get(`/hotels/${hotelId}`);
      setHotel(res.data);
      setForm({
        name: res.data.name || "",
        city: res.data.city || "",
        address: res.data.address || "",
        phone_number: res.data.phone_number || "",
        whatsapp_number: res.data.whatsapp_number || "",
        website: res.data.website || "",
        google_maps_url: res.data.google_maps_url || "",
        latitude: res.data.latitude ?? "",
        longitude: res.data.longitude ?? "",
        description: res.data.description || "",
        amenities: res.data.amenities || [],
      });
    } catch (err) {
      toast.error(lang === "sw" ? "Imeshindikana kupakia hotel" : "Failed to load hotel");
    } finally {
      setLoading(false);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const res = await api.get(`/backoffice/hotels/${hotelId}/call-logs`);
      setCallLogs(res.data);
    } catch (err) { /* non-critical */ }
  };

  useEffect(() => { fetchHotel(); fetchCallLogs(); /* eslint-disable-next-line */ }, [hotelId]);

  if (loading || !form) return <LoadingSpinner />;
  if (!hotel) return <div className="text-center py-12 text-[#A1A1AA]">{lang === "sw" ? "Hotel haipatikani" : "Hotel not found"}</div>;

  const f = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const toggleAmenity = (key) =>
    setForm((p) => ({ ...p, amenities: p.amenities.includes(key) ? p.amenities.filter((a) => a !== key) : [...p.amenities, key] }));

  const handleSaveHotel = async () => {
    setSaving(true);
    try {
      await api.patch(`/hotels/${hotelId}`, {
        ...form,
        latitude: form.latitude === "" ? null : parseFloat(form.latitude),
        longitude: form.longitude === "" ? null : parseFloat(form.longitude),
      });
      toast.success(lang === "sw" ? "Taarifa za hoteli zimehifadhiwa!" : "Hotel details saved!");
      fetchHotel();
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana" : "Failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCallLog = async (e) => {
    e.preventDefault();
    setSavingCall(true);
    try {
      await api.patch(`/backoffice/hotels/${hotelId}/call-log`, {
        call_status: callStatus,
        call_notes: callNotes,
        called_at: new Date(calledAt).toISOString(),
      });
      toast.success(lang === "sw" ? "Rekodi ya simu imehifadhiwa!" : "Call log saved!");
      setCallNotes("");
      fetchCallLogs();
      fetchHotel();
    } catch (err) {
      toast.error(lang === "sw" ? "Imeshindikana" : "Failed to save call log");
    } finally {
      setSavingCall(false);
    }
  };

  const mapsHref = form.latitude !== "" && form.longitude !== ""
    ? `https://www.google.com/maps?q=${form.latitude},${form.longitude}`
    : "https://www.google.com/maps";

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/backoffice/hotels")} className="p-2 hover:bg-[#F4F4F5] rounded-lg" data-testid="back-to-list-btn">
          <ChevronLeft className="w-5 h-5 text-[#52525B]" />
        </button>
        <div className="min-w-0">
          <h1 className="font-['Outfit'] text-xl md:text-2xl font-bold text-[#18181B] truncate">{hotel.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#A1A1AA] capitalize">{hotel.status}</span>
            <CallStatusBadge status={hotel.call_status} lang={lang} />
          </div>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <div className="bg-white rounded-xl border border-border p-4 md:p-6 space-y-4">
        <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">{lang === "sw" ? "Taarifa za Msingi" : "Basic Info"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Jina la Hotel" : "Hotel Name"}</label>
            <input value={form.name} onChange={(e) => f("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Mji" : "City"}</label>
            <input value={form.city} onChange={(e) => f("city", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-city" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Anwani" : "Street Address"}</label>
            <input value={form.address} onChange={(e) => f("address", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Simu" : "Phone Number"}</label>
            <input value={form.phone_number} onChange={(e) => f("phone_number", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-phone" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">WhatsApp</label>
            <input value={form.whatsapp_number} onChange={(e) => f("whatsapp_number", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-whatsapp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Website</label>
            <input value={form.website} onChange={(e) => f("website", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-website" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Google Maps URL</label>
            <input value={form.google_maps_url} onChange={(e) => f("google_maps_url", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-maps-url" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Latitude</label>
            <input type="number" step="any" value={form.latitude} onChange={(e) => f("latitude", e.target.value)}
              placeholder="-6.7924" className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-latitude" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Longitude</label>
            <input type="number" step="any" value={form.longitude} onChange={(e) => f("longitude", e.target.value)}
              placeholder="39.2083" className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-longitude" />
          </div>
          <div className="md:col-span-2 -mt-2">
            <a href={mapsHref} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#0F4C5C] hover:underline" data-testid="bo-open-in-maps">
              <MapPin className="w-3.5 h-3.5" /> {lang === "sw" ? "Fungua kwenye Maps" : "Open in Maps"}
            </a>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Maelezo" : "Description"}</label>
            <textarea value={form.description} onChange={(e) => f("description", e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="bo-hotel-description" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#52525B] mb-2">{lang === "sw" ? "Huduma" : "Amenities"}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HOTEL_AMENITIES.map((a) => (
              <label key={a}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${
                  form.amenities.includes(a) ? "bg-[#0F4C5C] text-white border-[#0F4C5C]" : "bg-white text-[#52525B] border-border hover:border-[#0F4C5C]"
                }`}
                data-testid={`bo-amenity-${a.toLowerCase().replace(/\s/g, "-")}`}
              >
                <input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} className="sr-only" />
                {a}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Room Types */}
      <RoomTypesSection hotelId={hotelId} rooms={hotel.room_types || []} onChange={fetchHotel} lang={lang} />

      {/* Section 3: Photos */}
      <div className="bg-white rounded-xl border border-border p-4 md:p-6">
        <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-4">{lang === "sw" ? "Picha" : "Photos"}</h3>
        <PhotoManager photos={hotel.photos || []} entityType="hotel" entityId={hotelId} maxPhotos={10} canUpload={true} onPhotosChange={fetchHotel} />
      </div>

      {/* Section 4: Call Log */}
      <div className="bg-white rounded-xl border border-border p-4 md:p-6 space-y-4">
        <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">{lang === "sw" ? "Rekodi ya Simu" : "Call Log"}</h3>
        <form onSubmit={handleSaveCallLog} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Hali ya Simu" : "Call Status"}</label>
              <select value={callStatus} onChange={(e) => setCallStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="call-status-select">
                <option value="pending">{lang === "sw" ? "Inasubiri" : "Pending"}</option>
                <option value="called">{lang === "sw" ? "Imepigiwa" : "Called"}</option>
                <option value="verified">{lang === "sw" ? "Imethibitishwa" : "Verified"}</option>
                <option value="unreachable">{lang === "sw" ? "Haipatikani" : "Unreachable"}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Tarehe ya Simu" : "Called At"}</label>
              <input type="datetime-local" value={calledAt} onChange={(e) => setCalledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="called-at-input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">{lang === "sw" ? "Hoteli ilisema nini?" : "What did the hotel say?"}</label>
            <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" data-testid="call-notes-input" />
          </div>
          <button type="submit" disabled={savingCall}
            className="bg-[#0F4C5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0D3E4D] disabled:opacity-50" data-testid="save-call-log-btn">
            {savingCall ? "..." : (lang === "sw" ? "Hifadhi Rekodi ya Simu" : "Save Call Log")}
          </button>
        </form>

        {callLogs.length > 0 && (
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-medium text-[#52525B]">{lang === "sw" ? "Historia ya Simu" : "Call History"}</p>
            {callLogs.map((log) => (
              <div key={log.id} className="bg-[#F4F4F5] rounded-lg p-3" data-testid={`call-log-${log.id}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <CallStatusBadge status={log.call_status} lang={lang} />
                  <span className="text-xs text-[#A1A1AA]">{new Date(log.called_at).toLocaleString()}</span>
                </div>
                {log.call_notes && <p className="text-sm text-[#52525B]">{log.call_notes}</p>}
                <p className="text-xs text-[#A1A1AA] mt-1">{lang === "sw" ? "Aliyepiga" : "Called by"}: {log.backoffice_user_name || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Save */}
      <button onClick={handleSaveHotel} disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#E07B2A] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#C96A1F] disabled:opacity-50"
        data-testid="save-hotel-details-btn">
        <Save className="w-5 h-5" /> {saving ? (lang === "sw" ? "Inahifadhi..." : "Saving...") : (lang === "sw" ? "Hifadhi Taarifa za Hotel" : "Save Hotel Details")}
      </button>
    </div>
  );
};

export default BackofficeDashboard;
