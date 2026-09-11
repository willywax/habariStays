import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, useAuth, LanguageToggle, useLang } from "../App";
import PhotoManager, { getPhotoUrl, getCoverUrl } from "../components/PhotoManager";
import HotelEditPage from "../components/HotelEditPage";
import {
  LayoutDashboard, Building2, Users, LogOut, Upload, UserCheck,
  Check, X, AlertTriangle, Search, Phone, Mail, Image, ChevronLeft,
  Camera, Plus, Pencil, Trash2
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  const handleLogout = () => { logout(); navigate("/"); };

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: translate("Dashboard", "Dashibodi"), exact: true },
    { path: "/admin/hotels", icon: Building2, label: translate("Hotels", "Hoteli") },
    { path: "/admin/owners", icon: UserCheck, label: translate("Owners", "Wamiliki") },
    { path: "/admin/cashiers", icon: Users, label: translate("Cashiers", "Weka Hazina") },
    { path: "/admin/import", icon: Upload, label: translate("Import Hotels", "Ingiza Hoteli") },
    { path: "/admin/users", icon: Users, label: translate("Users", "Watumiaji") },
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      <aside className="w-64 bg-white border-r border-border fixed h-full z-10">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#9A3324] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <span className="font-['Outfit'] font-bold text-lg text-[#9A3324]">{translate("Admin Panel", "Paneli ya Admin")}</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path, item.exact) ? "bg-[#9A3324] text-white" : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`} data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
              <item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="mb-3 px-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A1A1AA]">{translate("Admin", "Msimamizi")}</p>
              <p className="font-medium text-[#18181B]">{user?.full_name}</p>
            </div>
            <LanguageToggle />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-[#52525B] hover:bg-[#F4F4F5] rounded-lg" data-testid="admin-logout-btn">
            <LogOut className="w-5 h-5" /><span className="font-medium">{t("logout")}</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-6">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/hotels" element={<AdminHotels />} />
          <Route path="/hotels/:hotelId" element={<HotelEditPage basePath="/admin" />} />
          <Route path="/hotels/:hotelId/photos" element={<AdminHotelPhotos />} />
          <Route path="/owners" element={<AdminOwners />} />
          <Route path="/cashiers" element={<AdminCashiers />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/import" element={<AdminImport />} />
        </Routes>
      </main>
    </div>
  );
};

// ================== ADMIN HOME ==================
const AdminHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  useEffect(() => { fetchStats(); }, []);
  const fetchStats = async () => {
    try { const res = await api.get("/admin/stats"); setStats(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const bookingData = [
    { name: translate("Online", "Online"), value: stats?.online_bookings || 0 },
    { name: translate("Walk-in", "Walk-in"), value: stats?.walkin_bookings || 0 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">{translate("Admin Dashboard", "Dashibodi ya Admin")}</h1>
        <p className="text-[#52525B]">{translate("Full platform overview", "Muhtasari wa platform nzima")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: translate("Total Hotels", "Hoteli Jumla"),
            value: stats?.total_hotels,
            sub: `${stats?.verified_hotels || 0} ${translate("Verified", "Zilizothibitishwa")}`,
            color: "text-[#18181B]",
            id: "stat-hotels"
          },
          {
            label: translate("Total Bookings", "Bukini Jumla"),
            value: stats?.total_bookings,
            sub: `${stats?.online_bookings || 0} ${translate("Online", "Online")}, ${stats?.walkin_bookings || 0} ${translate("Walk-in", "Walk-in")}`,
            color: "text-[#18181B]",
            id: "stat-bookings"
          },
          {
            label: translate("Pending Owners", "Wamiliki Wapya"),
            value: stats?.pending_owners,
            sub: translate("Awaiting verification", "Wanasubiri uthibitishaji"),
            color: stats?.pending_owners > 0 ? "text-[#E07B2A]" : "text-[#18181B]",
            id: "stat-pending"
          },
          {
            label: translate("Total Revenue", "Mapato Jumla"),
            value: `TZS ${(stats?.total_revenue || 0).toLocaleString()}`,
            sub: `${translate("Commission", "Commission")}: TZS ${(stats?.commission_10_percent || 0).toLocaleString()}`,
            color: "text-[#0F4C5C]",
            id: "stat-revenue"
          },
        ].map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-border p-6 shadow-sm" data-testid={s.id}>
            <p className="text-[#A1A1AA] text-sm mb-2">{s.label}</p>
            <p className={`font-['Outfit'] text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-[#52525B] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">{translate("Online vs Walk-in", "Online dhidi ya Walk-in")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="#0F4C5C" /><Cell fill="#E3B505" />
                </Pie><Legend /><Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">{translate("Revenue by City", "Mapato kwa Mji")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenue_by_city || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="city" /><YAxis /><Tooltip />
                <Bar dataKey="revenue" fill="#0F4C5C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================== ADMIN HOTELS ==================
const AdminHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [attachModal, setAttachModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  useEffect(() => { fetchHotels(); }, []);
  const fetchHotels = async () => {
    try { const res = await api.get("/admin/all-hotels"); setHotels(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const verifyHotel = async (hotelId) => {
    try { await api.put(`/admin/hotels/${hotelId}/verify`); toast.success(translate("Hotel verified!", "Hotel imethibitishwa!")); fetchHotels(); }
    catch (err) { toast.error(translate("Failed", "Imeshindikana")); }
  };
  const suspendHotel = async (hotelId) => {
    try { await api.put(`/admin/hotels/${hotelId}/suspend`); toast.success(translate("Hotel suspended", "Hotel imesimamishwa")); fetchHotels(); }
    catch (err) { toast.error(translate("Failed", "Imeshindikana")); }
  };
  const deleteHotel = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/hotels/${deleteConfirm.id}`);
      toast.success(translate(`Hotel '${deleteConfirm.name}' deleted`, `Hotel '${deleteConfirm.name}' imefutwa`));
      setDeleteConfirm(null); fetchHotels();
    } catch (err) { toast.error(err.response?.data?.detail || translate("Failed to delete", "Imeshindikana kufuta")); }
  };

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(filter.toLowerCase()) || h.city.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  const statusBadge = (status) => {
    const map = {
      verified: { bg: "bg-green-100", text: "text-green-700", label: translate("Verified", "Imethibitishwa") },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: translate("Pending", "Inasubiri") },
      imported: { bg: "bg-blue-100", text: "text-blue-700", label: translate("Imported", "Imeingizwa") },
      suspended: { bg: "bg-red-100", text: "text-red-700", label: translate("Suspended", "Imesimamishwa") }
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-1 ${s.bg} ${s.text} text-xs font-medium rounded`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">{translate("All Hotels", "Hoteli Zote")}</h1>
          <p className="text-[#52525B]">{translate(`${hotels.length} hotels on the platform`, `${hotels.length} hoteli kwenye platform`)}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/admin/hotels/new")} className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#143D28]" data-testid="create-hotel-btn">
            <Plus className="w-4 h-4" /> {translate("Add Hotel", "Ongeza Hotel")}
          </button>
          <Link to="/admin/import" className="flex items-center gap-2 bg-[#9A3324] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#7A2A1D]" data-testid="import-hotels-btn">
            <Upload className="w-4 h-4" /> {translate("Import Hotels", "Ingiza Hoteli")}
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
        <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder={translate("Search hotels by name or city...", "Tafuta hotel kwa jina au mji...")}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
          data-testid="search-hotels-input" />
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Hotel", "Hotel")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("City", "Mji")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Owner", "Mmiliki")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Room Types", "Vyumba")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Photos", "Picha")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{t("status")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredHotels.map((hotel) => (
              <tr key={hotel.id} className="hover:bg-[#F4F4F5]/50" data-testid={`hotel-row-${hotel.id}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/hotels/${hotel.id}`)}>
                    {hotel.cover_photo ? (
                      <img src={hotel.cover_photo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#F4F4F5] flex items-center justify-center">
                        <Image className="w-5 h-5 text-[#A1A1AA]" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[#18181B] hover:text-[#9A3324]">{hotel.name}</p>
                      <p className="text-xs text-[#A1A1AA]">{hotel.hotel_code} {hotel.data_source === "bulk_import" ? "· IMPORTED" : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-[#52525B]">{hotel.city}</td>
                <td className="px-4 py-4">
                  {hotel.owner_name ? (
                    <div><p className="text-sm font-medium text-[#18181B]">{hotel.owner_name}</p><p className="text-xs text-[#A1A1AA]">{hotel.owner_email}</p></div>
                  ) : (
                    <button onClick={() => setAttachModal(hotel)} className="text-sm text-[#9A3324] hover:underline font-medium" data-testid={`attach-owner-${hotel.id}`}>
                      + {translate("Attach Owner", "Weka Mmiliki")}
                    </button>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[#52525B]" data-testid={`room-count-${hotel.id}`}>{hotel.room_type_count || 0} {translate("types", "aina")}</span>
                    {hotel.has_default_rooms && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-medium rounded" data-testid={`needs-update-${hotel.id}`}>
                        <AlertTriangle className="w-3 h-3" /> {translate("Update", "Sasisha")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <button onClick={() => navigate(`/admin/hotels/${hotel.id}/photos`)}
                    className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#9A3324]"
                    data-testid={`manage-photos-${hotel.id}`}>
                    <Camera className="w-4 h-4" />
                    <span>{hotel.photo_count || 0}</span>
                  </button>
                </td>
                <td className="px-4 py-4">{statusBadge(hotel.status)}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {hotel.status !== "verified" && hotel.status !== "suspended" && (
                      <button onClick={() => verifyHotel(hotel.id)} className="flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-green-600" data-testid={`verify-hotel-${hotel.id}`}>
                        <Check className="w-3 h-3" /> {translate("Verify", "Thibitisha")}
                      </button>
                    )}
                    <button onClick={() => navigate(`/admin/hotels/${hotel.id}`)} className="flex items-center gap-1 bg-[#0F4C5C] text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-[#0D3E4D]" data-testid={`edit-hotel-${hotel.id}`}>
                      <Pencil className="w-3 h-3" /> {t("edit")}
                    </button>
                    {hotel.status !== "suspended" && (
                      <button onClick={() => suspendHotel(hotel.id)} className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-yellow-200" data-testid={`suspend-hotel-${hotel.id}`}>
                        {translate("Suspend", "Simamisha")}
                      </button>
                    )}
                    <button onClick={() => setDeleteConfirm(hotel)} className="flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-red-200" data-testid={`delete-hotel-${hotel.id}`}>
                      <Trash2 className="w-3 h-3" /> {t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredHotels.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">{translate("No hotels found", "Hakuna hoteli")}</div>}
      </div>
      {attachModal && <AttachOwnerModal hotel={attachModal} onClose={() => setAttachModal(null)} onSuccess={() => { setAttachModal(null); fetchHotels(); }} />}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="delete-hotel-modal">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-2">{translate("Delete hotel?", "Futa Hotel?")}</h3>
            <p className="text-sm text-[#52525B] mb-4">
              {translate(`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`, `Una uhakika unataka kufuta ${deleteConfirm.name}? Kitendo hiki hakiwezi kutenduliwa.`)}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">{t("cancel")}</button>
              <button onClick={deleteHotel} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600" data-testid="confirm-delete-hotel">{t("delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== ADMIN HOTEL PHOTOS ==================
const AdminHotelPhotos = () => {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { lang } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  const fetchData = async () => {
    try {
      const [hotelRes, photosRes] = await Promise.all([
        api.get(`/hotels/${hotelId}`),
        api.get(`/hotels/${hotelId}/photos`)
      ]);
      setHotel(hotelRes.data);
      setPhotos(photosRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [hotelId]);

  if (loading) return <LoadingSpinner />;
  if (!hotel) return <div className="text-center py-12">{translate("Hotel not found", "Hotel haipatikani")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/admin/hotels")} className="p-2 hover:bg-[#F4F4F5] rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">{hotel.name}</h1>
          <p className="text-[#52525B]">{translate(`Manage hotel photos (${photos.length} photos)`, `Simamia picha za hotel (${photos.length} picha)`)}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-border p-6">
        <PhotoManager
          photos={photos}
          entityType="hotel"
          entityId={hotelId}
          maxPhotos={10}
          canUpload={true}
          onPhotosChange={fetchData}
        />
      </div>
    </div>
  );
};

// ================== ATTACH OWNER MODAL ==================
const AttachOwnerModal = ({ hotel, onClose, onSuccess }) => {
  const [form, setForm] = useState({ owner_name: "", owner_phone: "", owner_email: "" });
  const [loading, setLoading] = useState(false);
  const { lang, t } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/admin/hotels/${hotel.id}/attach-owner`, form);
      toast.success(translate(`Owner attached to ${hotel.name}`, `Mmiliki amewekwa kwa ${hotel.name}`));
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.detail || translate("Failed", "Imeshindikana")); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="attach-owner-modal">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="font-['Outfit'] text-xl font-semibold text-[#18181B] mb-2">{translate("Attach Owner", "Weka Mmiliki")}</h3>
        <p className="text-sm text-[#A1A1AA] mb-6">{translate("Hotel", "Hotel")}: {hotel.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-1">{translate("Full Name", "Jina Kamili")}</label>
            <input type="text" required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="owner-name-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-1">{translate("Phone (+255...)", "Simu (+255...)")}</label>
            <input type="tel" required value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="owner-phone-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-1">Email</label>
            <input type="email" required value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="owner-email-input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">{t("cancel")}</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-[#9A3324] text-white rounded-lg font-medium hover:bg-[#7A2A1D] disabled:opacity-50" data-testid="submit-attach-owner">
              {loading ? "..." : translate("Attach Owner", "Weka Mmiliki")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================== ADMIN OWNERS ==================
const AdminOwners = () => {
  const [pendingOwners, setPendingOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { const res = await api.get("/admin/pending-owners"); setPendingOwners(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const approveOwner = async (userId) => {
    try { await api.put(`/admin/users/${userId}/verify`); toast.success(translate("Owner approved!", "Mmiliki amethibitishwa!")); fetchData(); }
    catch (err) { toast.error(translate("Failed", "Imeshindikana")); }
  };
  const rejectOwner = async (userId) => {
    try { await api.put(`/admin/users/${userId}/reject`); toast.success(translate("Owner rejected", "Mmiliki amekataliwa")); fetchData(); }
    catch (err) { toast.error(translate("Failed", "Imeshindikana")); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">{translate("Hotel Owners", "Wamiliki wa Hoteli")}</h1>
        <p className="text-[#52525B]">{translate("Approve and manage owners", "Thibitisha na simamia wamiliki")}</p>
      </div>
      {pendingOwners.length > 0 ? (
        <div className="bg-[#FEF3C7] rounded-xl border border-yellow-300 p-4">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {translate(`${pendingOwners.length} owners awaiting approval`, `Wamiliki ${pendingOwners.length} Wanasubiri Uthibitishaji`)}
          </h3>
          <div className="space-y-3">
            {pendingOwners.map((owner) => (
              <div key={owner.id} className="bg-white rounded-lg p-4 flex items-center justify-between" data-testid={`pending-owner-${owner.id}`}>
                <div>
                  <p className="font-medium text-[#18181B]">{owner.full_name}</p>
                  <div className="flex items-center gap-4 text-sm text-[#52525B]">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{owner.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{owner.phone}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveOwner(owner.id)} className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600" data-testid={`approve-owner-${owner.id}`}>
                    <Check className="w-4 h-4" /> {translate("Approve", "Thibitisha")}
                  </button>
                  <button onClick={() => rejectOwner(owner.id)} className="flex items-center gap-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200" data-testid={`reject-owner-${owner.id}`}>
                    <X className="w-4 h-4" /> {translate("Reject", "Kataa")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">{translate("No pending owners", "Hakuna wamiliki wanaosubiri uthibitishaji")}</p>
        </div>
      )}
    </div>
  );
};

// ================== ADMIN CASHIERS ==================
const AdminCashiers = () => {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [toggleModal, setToggleModal] = useState(null);
  const [perfModal, setPerfModal] = useState(null);
  const [newPassword, setNewPassword] = useState(null);
  const [formData, setFormData] = useState({ full_name: "", phone: "", email: "", hotel_id: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const { lang, t } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  useEffect(() => { fetchCashiers(); fetchHotels(); }, []);
  const fetchCashiers = async () => {
    try { const res = await api.get("/cashiers"); setCashiers(res.data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  const fetchHotels = async () => {
    try { const res = await api.get("/admin/all-hotels"); setHotels(res.data); } catch {}
  };

  const handleAddCashier = async (e) => {
    e.preventDefault(); setSubmitLoading(true);
    try {
      await api.post("/cashiers", formData);
      toast.success(translate("Cashier added! SMS sent.", "Mweka Hazina ameongezwa! SMS imetumwa."));
      setShowAddModal(false); setFormData({ full_name: "", phone: "", email: "", hotel_id: "" }); fetchCashiers();
    } catch (err) { toast.error(err.response?.data?.detail || translate("Failed", "Imeshindikana")); } finally { setSubmitLoading(false); }
  };

  const handleEditCashier = async (e) => {
    e.preventDefault(); setSubmitLoading(true);
    try {
      const body = {};
      if (editModal.full_name !== editModal._orig_name) body.full_name = editModal.full_name;
      if (editModal.phone !== editModal._orig_phone) body.phone = editModal.phone;
      if (editModal.assigned_hotel_id !== editModal._orig_hotel) body.assigned_hotel_id = editModal.assigned_hotel_id;
      await api.patch(`/cashiers/${editModal.id}`, body);
      toast.success(translate("Cashier updated", "Cashier amesasishwa")); setEditModal(null); fetchCashiers();
    } catch (err) { toast.error(err.response?.data?.detail || translate("Failed", "Imeshindikana")); } finally { setSubmitLoading(false); }
  };

  const handleResetPassword = async () => {
    try {
      const res = await api.post(`/cashiers/${resetModal.id}/reset-password`);
      setNewPassword(res.data.new_password); toast.success(translate("Password reset + SMS sent", "Neno la siri limewekwa upya + SMS imetumwa"));
    } catch (err) { toast.error(err.response?.data?.detail || translate("Failed", "Imeshindikana")); }
  };

  const handleToggle = async () => {
    try {
      await api.put(`/cashiers/${toggleModal.id}/toggle-status-sms`);
      toast.success(translate("Status updated + SMS sent", "Hali imebadilishwa + SMS imetumwa")); setToggleModal(null); fetchCashiers();
    } catch (err) { toast.error(err.response?.data?.detail || translate("Failed", "Imeshindikana")); }
  };

  const handleViewPerformance = async (cashier) => {
    try {
      const res = await api.get(`/cashiers/${cashier.id}/performance`);
      setPerfModal(res.data);
    } catch (err) { toast.error(translate("Failed to load", "Imeshindikana kupakia")); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">{translate("All Cashiers", "Weka Hazina Wote")}</h1>
          <p className="text-[#52525B]">{translate("Manage every cashier on the platform", "Simamia cashier wote kwenye platform")}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#0F4C5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0A3844] transition-all" data-testid="admin-add-cashier-btn">
          <Plus className="w-4 h-4" /> {translate("Add Cashier", "Ongeza Mweka Hazina")}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="admin-cashiers-table">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{translate("Name", "Jina")}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{translate("Phone", "Simu")}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Hotel</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{t("status")}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cashiers.map(c => (
              <tr key={c.id} className="hover:bg-[#F4F4F5]/50" data-testid={`cashier-row-${c.id}`}>
                <td className="px-4 py-3">
                  <button onClick={() => handleViewPerformance(c)} className="font-medium text-[#0F4C5C] hover:underline text-sm" data-testid={`view-perf-${c.id}`}>{c.full_name}</button>
                </td>
                <td className="px-4 py-3 text-sm text-[#52525B]">{c.email}</td>
                <td className="px-4 py-3 text-sm text-[#52525B]">{c.phone}</td>
                <td className="px-4 py-3 text-sm text-[#52525B]">{c.assigned_hotel_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {c.is_active ? translate("Active", "Hai") : translate("Inactive", "Imezimwa")}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={() => setEditModal({...c, _orig_name: c.full_name, _orig_phone: c.phone, _orig_hotel: c.assigned_hotel_id})}
                    className="px-2 py-1 text-xs font-medium text-[#0F4C5C] hover:bg-[#F4F4F5] rounded" data-testid={`edit-cashier-${c.id}`}>{t("edit")}</button>
                  <button onClick={() => { setResetModal(c); setNewPassword(null); }}
                    className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded" data-testid={`reset-pwd-${c.id}`}>{translate("Reset", "Weka Upya")}</button>
                  <button onClick={() => setToggleModal(c)}
                    className={`px-2 py-1 text-xs font-medium rounded ${c.is_active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                    data-testid={`toggle-cashier-${c.id}`}>{c.is_active ? translate("Deactivate", "Zima") : translate("Activate", "Washa")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cashiers.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">{translate("No cashiers", "Hakuna weka hazina")}</div>}
      </div>

      {/* Add Cashier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md" data-testid="add-cashier-modal">
            <div className="p-5 border-b border-border"><h2 className="font-['Outfit'] text-lg font-bold">{translate("Add Cashier", "Ongeza Mweka Hazina")}</h2><p className="text-xs text-[#A1A1AA] mt-1">{translate("A temporary password will be sent via SMS", "Neno la siri la muda litatumwa kwa SMS")}</p></div>
            <form onSubmit={handleAddCashier} className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">{translate("Full Name", "Jina Kamili")}</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="new-cashier-name" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="new-cashier-email" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">{translate("Phone (+255)", "Simu (+255)")}</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0712345678" className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="new-cashier-phone" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Hotel</label>
                <select value={formData.hotel_id} onChange={e => setFormData({...formData, hotel_id: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required>
                  <option value="">{translate("Select Hotel", "Chagua Hotel")}</option>
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">{t("cancel")}</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844] disabled:opacity-50" data-testid="submit-add-cashier">{submitLoading ? "..." : translate("Add", "Ongeza")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cashier Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md" data-testid="edit-cashier-modal">
            <div className="p-5 border-b border-border"><h2 className="font-['Outfit'] text-lg font-bold">{t("edit")} {translate("Cashier", "Mweka Hazina")}</h2><p className="text-xs text-[#A1A1AA] mt-1">{translate("Email cannot be changed", "Email haiwezi kubadilishwa")}</p></div>
            <form onSubmit={handleEditCashier} className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Email</label><input type="email" value={editModal.email} disabled className="w-full px-3 py-2.5 rounded-lg border border-input text-sm bg-[#F4F4F5] text-[#A1A1AA]" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">{translate("Full Name", "Jina Kamili")}</label><input type="text" value={editModal.full_name} onChange={e => setEditModal({...editModal, full_name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="edit-cashier-name" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">{translate("Phone", "Simu")}</label><input type="tel" value={editModal.phone} onChange={e => setEditModal({...editModal, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="edit-cashier-phone" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Hotel</label>
                <select value={editModal.assigned_hotel_id} onChange={e => setEditModal({...editModal, assigned_hotel_id: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]">
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">{t("cancel")}</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844] disabled:opacity-50" data-testid="submit-edit-cashier">{submitLoading ? "..." : t("save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" data-testid="reset-pwd-modal">
            {!newPassword ? (
              <>
                <h3 className="font-['Outfit'] text-lg font-bold">{translate("Reset Password", "Weka Upya Neno la Siri")}</h3>
                <p className="text-sm text-[#52525B]">{translate(
                  `Are you sure you want to reset ${resetModal.full_name}'s password?`,
                  `Je, una uhakika unataka kuweka upya neno la siri la ${resetModal.full_name}?`
                )}</p>
                <div className="flex gap-3">
                  <button onClick={() => setResetModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">{t("cancel")}</button>
                  <button onClick={handleResetPassword} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844]" data-testid="confirm-reset-btn">{translate("Confirm", "Thibitisha")}</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-['Outfit'] text-lg font-bold">{translate("New Password", "Neno la Siri Jipya")}</h3>
                <p className="text-sm text-[#52525B]">{translate("Copy and share with the cashier:", "Nakili na umpe mweka hazina:")}</p>
                <div className="bg-[#F4F4F5] rounded-lg p-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-[#18181B]" data-testid="new-password-display">{newPassword}</span>
                  <button onClick={() => { navigator.clipboard.writeText(newPassword); toast.success(translate("Copied", "Imenakiliwa!")); }} className="px-3 py-1 bg-[#0F4C5C] text-white text-xs rounded-lg">{translate("Copy", "Nakili")}</button>
                </div>
                <p className="text-xs text-[#A1A1AA]">{translate("SMS sent to cashier as well.", "SMS imetumwa kwa cashier pia.")}</p>
                <button onClick={() => { setResetModal(null); setNewPassword(null); }} className="w-full py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">{translate("Close", "Funga")}</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle Status Modal */}
      {toggleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" data-testid="toggle-status-modal">
            <h3 className="font-['Outfit'] text-lg font-bold">{toggleModal.is_active ? translate("Deactivate Account", "Zima Akaunti") : translate("Activate Account", "Washa Akaunti")}</h3>
            <p className="text-sm text-[#52525B]">
              {toggleModal.is_active
                ? translate(
                  `Deactivating ${toggleModal.full_name}'s account will block access. Continue?`,
                  `Kuzima akaunti ya ${toggleModal.full_name} kutazuia uwezo wake wa kuingia. Je, unataka kuendelea?`
                )
                : translate(
                  `Activate ${toggleModal.full_name}'s account?`,
                  `Washa akaunti ya ${toggleModal.full_name}?`
                )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setToggleModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">{t("cancel")}</button>
              <button onClick={handleToggle}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white ${toggleModal.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                data-testid="confirm-toggle-btn">{toggleModal.is_active ? translate("Deactivate", "Zima Akaunti") : translate("Activate", "Washa Akaunti")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {perfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="perf-modal">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setPerfModal(null)} className="p-1.5 hover:bg-[#F4F4F5] rounded-lg" data-testid="perf-back-btn">
                  <ChevronLeft className="w-5 h-5 text-[#52525B]" />
                </button>
                <div>
                  <h2 className="font-['Outfit'] text-lg font-bold">{perfModal.cashier?.full_name}</h2>
                  <p className="text-xs text-[#A1A1AA]">{perfModal.cashier?.email} | {perfModal.cashier?.assigned_hotel_name}</p>
                </div>
              </div>
              <button onClick={() => setPerfModal(null)} className="p-1 hover:bg-[#F4F4F5] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-600">{translate("Walk-ins", "Walk-ins")}</p><p className="text-xl font-bold text-green-700">{perfModal.this_month?.walkins_recorded}</p></div>
                <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-600">{translate("Check-ins", "Check-ins")}</p><p className="text-xl font-bold text-blue-700">{perfModal.this_month?.checkins_confirmed}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-600">{translate("Checkouts", "Checkouts")}</p><p className="text-xl font-bold text-gray-700">{perfModal.this_month?.checkouts_processed}</p></div>
                <div className="bg-[#0F4C5C]/10 rounded-lg p-3"><p className="text-xs text-[#0F4C5C]">{translate("Revenue", "Mapato")}</p><p className="text-xl font-bold text-[#0F4C5C]">TZS {(perfModal.this_month?.total_revenue || 0).toLocaleString()}</p></div>
              </div>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold">{translate("Activity (This Month)", "Shughuli (Mwezi Huu)")}</h3></div>
                {perfModal.activity_log?.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-[#F4F4F5]"><tr>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Date", "Tarehe")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Action", "Kitendo")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Guest", "Mgeni")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Room", "Chumba")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Amount", "Kiasi")}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {perfModal.activity_log.slice(0, 50).map(l => (
                        <tr key={l.id}>
                          <td className="px-3 py-2 text-[10px] text-[#52525B]">{l.timestamp ? new Date(l.timestamp).toLocaleDateString() : ""}</td>
                          <td className="px-3 py-2 text-[10px]">{l.action_type?.replace("_", " ")}</td>
                          <td className="px-3 py-2 text-[10px]">{l.guest_name}</td>
                          <td className="px-3 py-2 text-[10px]">{l.room_type_name}</td>
                          <td className="px-3 py-2 text-[10px] font-medium">{l.amount_tzs ? `TZS ${l.amount_tzs.toLocaleString()}` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="p-6 text-center text-sm text-[#A1A1AA]">{translate("No activity this month", "Hakuna shughuli mwezi huu")}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("traveler");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState(null);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "traveler",
    assigned_hotel_id: ""
  });
  const [saving, setSaving] = useState(false);
  const { lang, t } = useLang();
  const translate = (en, sw) => (lang === "sw" ? sw : en);

  useEffect(() => { fetchUsers(); fetchHotels(); }, [filterRole, search]);

  const translateRole = (role) => {
    const map = {
      traveler: translate("Customer", "Mteja"),
      owner: translate("Owner", "Mmiliki"),
      cashier: translate("Cashier", "Mweka Hazina"),
      admin: translate("Admin", "Msimamizi")
    };
    return map[role] || role;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { search: search || undefined };
      if (filterRole && filterRole !== "all") params.role = filterRole;
      const res = await api.get("/admin/users", { params });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const res = await api.get("/admin/all-hotels");
      setHotels(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);
    await fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const body = {
        ...newUser,
        assigned_hotel_id: newUser.assigned_hotel_id || null
      };
      const res = await api.post("/admin/users", body);
      setCreatedTempPassword(res.data.temp_password);
      toast.success(translate("User created successfully", "Mtumiaji ameundwa kwa mafanikio"));
      setNewUser({ full_name: "", email: "", phone: "", role: "traveler", assigned_hotel_id: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || translate("Failed to create user", "Imeshindikana kuunda mtumiaji"));
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    search.trim().length === 0 ||
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.phone.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">{translate("Users", "Watumiaji")}</h1>
          <p className="text-[#52525B]">{translate("View registered customers and system users", "Tazama wateja waliojisajili na watumiaji wa mfumo")}</p>
        </div>
        <button onClick={() => { setShowCreateModal(true); setCreatedTempPassword(null); }}
          className="flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#143D28]"
          data-testid="admin-add-user-btn">
          <Plus className="w-4 h-4" /> {translate("Create User", "Unda Mtumiaji")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.8fr] gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.target.value)}
            placeholder={translate("Search users by name, email or phone...", "Tafuta watumiaji kwa jina, email au simu...")}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
            data-testid="search-users-input" />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
          data-testid="filter-role-select">
          <option value="all">{translate("All Roles", "Majukumu Yote")}</option>
          <option value="traveler">{translate("Customers", "Wateja")}</option>
          <option value="owner">{translate("Owners", "Wamiliki")}</option>
          <option value="cashier">{translate("Cashiers", "Weka Hazina")}</option>
          <option value="admin">{translate("Admins", "Wasimamizi")}</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Name", "Jina")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Email</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Phone", "Simu")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Role", "Jukumu")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Hotel", "Hotel")}</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">{translate("Status", "Hali")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-[#F4F4F5]/50" data-testid={`user-row-${user.id}`}>
                <td className="px-4 py-4 font-medium text-[#18181B]">{user.full_name}</td>
                <td className="px-4 py-4 text-sm text-[#52525B]">{user.email}</td>
                <td className="px-4 py-4 text-sm text-[#52525B]">{user.phone}</td>
                <td className="px-4 py-4 text-sm text-[#52525B]">{translateRole(user.role)}</td>
                <td className="px-4 py-4 text-sm text-[#52525B]">{user.assigned_hotel_name || "-"}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.is_active ? translate("Active", "Hai") : translate("Inactive", "Imezimwa")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">{translate("No users found", "Hakuna watumiaji")}</div>}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-['Outfit'] text-xl font-bold text-[#18181B]">{translate("Create New User", "Unda Mtumiaji Mpya")}</h2>
                <p className="text-sm text-[#52525B]">{translate("Create customers, owners, cashiers, or admin accounts.", "Unda wateja, wamiliki, cashiers, au wasimamizi.")}</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); setCreatedTempPassword(null); }} className="p-2 rounded-lg hover:bg-[#F4F4F5]">
                <X className="w-5 h-5 text-[#52525B]" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#52525B] mb-1">{translate("Full Name", "Jina Kamili")}</label>
                  <input type="text" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" required data-testid="create-user-name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#52525B] mb-1">Email</label>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" required data-testid="create-user-email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#52525B] mb-1">{translate("Phone", "Simu")}</label>
                  <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" required data-testid="create-user-phone" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#52525B] mb-1">{translate("Role", "Jukumu")}</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="create-user-role">
                    <option value="traveler">{translate("Customer", "Mteja")}</option>
                    <option value="owner">{translate("Owner", "Mmiliki")}</option>
                    <option value="cashier">{translate("Cashier", "Mweka Hazina")}</option>
                    <option value="admin">{translate("Admin", "Msimamizi")}</option>
                  </select>
                </div>
              </div>

              {(newUser.role === "cashier" || newUser.role === "owner") && (
                <div>
                  <label className="block text-sm font-medium text-[#52525B] mb-1">{translate("Assign Hotel", "Weka Hotel")}</label>
                  <select value={newUser.assigned_hotel_id} onChange={(e) => setNewUser({...newUser, assigned_hotel_id: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
                    data-testid="create-user-hotel">
                    <option value="">{translate("No hotel assigned", "Hakuna hotel imewekwa")}</option>
                    {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
                  </select>
                </div>
              )}

              {createdTempPassword && (
                <div className="bg-[#F4F4F5] rounded-lg p-4 border border-border text-sm text-[#18181B]">
                  <p className="font-medium mb-2">{translate("Temporary password", "Neno la siri la muda")}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[#0F4C5C]">{createdTempPassword}</span>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(createdTempPassword); toast.success(translate("Copied", "Imenakiliwa!")); }}
                      className="px-3 py-2 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium">{translate("Copy", "Nakili")}</button>
                  </div>
                  <p className="text-xs text-[#52525B] mt-2">{translate("Share this temporary password with the user after creation.", "Shirikisha neno hili la siri la muda kwa mtumiaji baada ya kuunda.")}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); setCreatedTempPassword(null); }}
                  className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">{t("cancel")}</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-[#1B4332] text-white rounded-lg font-medium hover:bg-[#143D28] disabled:opacity-50"
                  data-testid="submit-create-user">
                  {saving ? "..." : translate("Create User", "Unda Mtumiaji")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== ADMIN IMPORT ==================
      {perfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="perf-modal">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setPerfModal(null)} className="p-1.5 hover:bg-[#F4F4F5] rounded-lg" data-testid="perf-back-btn">
                  <ChevronLeft className="w-5 h-5 text-[#52525B]" />
                </button>
                <div>
                  <h2 className="font-['Outfit'] text-lg font-bold">{perfModal.cashier?.full_name}</h2>
                  <p className="text-xs text-[#A1A1AA]">{perfModal.cashier?.email} | {perfModal.cashier?.assigned_hotel_name}</p>
                </div>
              </div>
              <button onClick={() => setPerfModal(null)} className="p-1 hover:bg-[#F4F4F5] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-600">{translate("Walk-ins", "Walk-ins")}</p><p className="text-xl font-bold text-green-700">{perfModal.this_month?.walkins_recorded}</p></div>
                <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-600">{translate("Check-ins", "Check-ins")}</p><p className="text-xl font-bold text-blue-700">{perfModal.this_month?.checkins_confirmed}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-600">{translate("Checkouts", "Checkouts")}</p><p className="text-xl font-bold text-gray-700">{perfModal.this_month?.checkouts_processed}</p></div>
                <div className="bg-[#0F4C5C]/10 rounded-lg p-3"><p className="text-xs text-[#0F4C5C]">{translate("Revenue", "Mapato")}</p><p className="text-xl font-bold text-[#0F4C5C]">TZS {(perfModal.this_month?.total_revenue || 0).toLocaleString()}</p></div>
              </div>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold">{translate("Activity (This Month)", "Shughuli (Mwezi Huu)")}</h3></div>
                {perfModal.activity_log?.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-[#F4F4F5]"><tr>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Date", "Tarehe")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Action", "Kitendo")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Guest", "Mgeni")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Room", "Chumba")}</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">{translate("Amount", "Kiasi")}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {perfModal.activity_log.slice(0, 50).map(l => (
                        <tr key={l.id}>
                          <td className="px-3 py-2 text-[10px] text-[#52525B]">{l.timestamp ? new Date(l.timestamp).toLocaleDateString() : ""}</td>
                          <td className="px-3 py-2 text-[10px]">{l.action_type?.replace("_", " ")}</td>
                          <td className="px-3 py-2 text-[10px]">{l.guest_name}</td>
                          <td className="px-3 py-2 text-[10px]">{l.room_type_name}</td>
                          <td className="px-3 py-2 text-[10px] font-medium">{l.amount_tzs ? `TZS ${l.amount_tzs.toLocaleString()}` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="p-6 text-center text-sm text-[#A1A1AA]">{translate("No activity this month", "Hakuna shughuli mwezi huu")}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== ADMIN IMPORT ==================
const AdminImport = () => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [cityOverride, setCityOverride] = useState("");
  const [batches, setBatches] = useState([]);

  useEffect(() => { fetchBatches(); }, []);
  const fetchBatches = async () => {
    try { const res = await api.get("/admin/import/batches"); setBatches(res.data); }
    catch (err) { /* ignore */ }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Tafadhali pakia file ya Excel (.xlsx)");
      return;
    }
    setUploading(true); setPreview(null); setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/admin/import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPreview(res.data);
      toast.success(`${res.data.total_rows} hoteli zimepatikana kwenye file`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana kusoma file");
    } finally { setUploading(false); }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const res = await api.post("/admin/import/execute", {
        preview_id: preview.preview_id,
        batch_name: batchName,
        city_override: cityOverride,
        skip_duplicates: true
      });
      setResult(res.data);
      setPreview(null);
      toast.success(`Hoteli ${res.data.imported} zimeingizwa!`);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana kuingiza");
    } finally { setImporting(false); }
  };

  const getRowBg = (status) => {
    if (status === "valid") return "bg-green-50";
    if (status === "warning") return "bg-yellow-50";
    if (status === "duplicate") return "bg-red-50";
    if (status === "error") return "bg-red-50";
    return "";
  };

  const photoStatus = (count) => {
    if (count >= 2) return <span className="text-green-600 font-medium">{count} picha</span>;
    if (count === 1) return <span className="text-yellow-600 font-medium">{count} picha</span>;
    return <span className="text-red-500 font-medium">Hakuna picha</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Import Hotels</h1>
        <p className="text-[#52525B]">Ingiza hoteli kutoka Excel file na picha za Cloudinary</p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-border p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#9A3324]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-[#9A3324]" />
          </div>
          <h3 className="font-['Outfit'] text-xl font-semibold text-[#18181B] mb-2">Pakia Excel File</h3>
          <p className="text-[#A1A1AA] text-sm mb-2 max-w-lg mx-auto">
            Picha zitachukuliwa moja kwa moja kutoka Cloudinary &mdash; hakuna ZIP inayohitajika
          </p>
          <p className="text-[#D4D4D8] text-xs mb-6 max-w-lg mx-auto">
            Columns: #, Name, Address, Phone, Website, Rating, # Reviews, Price Level, Status, Lat, Lng, Types, Summary, Google Maps URL, P1-P3 (Local, Original, Thumb, Mobile, Web, HD)
          </p>
          <input type="file" ref={fileRef} accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" data-testid="excel-file-input" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-2 bg-[#9A3324] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#7A2A1D] disabled:opacity-50"
            data-testid="upload-excel-btn">
            <Upload className="w-5 h-5" />
            {uploading ? "Inasomwa..." : "Chagua File"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
          <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-['Outfit'] text-xl font-semibold text-green-800 mb-2">Import Imekamilika!</h3>
          <p className="text-green-700">{result.imported} hoteli zimeingizwa, {result.skipped} zimepitishwa</p>
          {result.errors?.length > 0 && (
            <p className="text-yellow-700 mt-2">{result.errors.length} makosa</p>
          )}
          <Link to="/admin/hotels" className="inline-block mt-4 text-[#9A3324] font-medium hover:underline">Angalia Hoteli Zote</Link>
        </div>
      )}

      {/* Preview Table */}
      {preview && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-['Outfit'] text-xl font-semibold text-[#18181B]">Preview</h3>
                <div className="flex gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full" /> {preview.valid} ready to import
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" /> {preview.warnings} missing data
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full" /> {preview.duplicates} duplicates (skipped)
                  </span>
                </div>
                {preview.has_photo_columns && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Cloudinary photo columns detected
                  </p>
                )}
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#52525B] mb-1">Batch Name</label>
                  <input type="text" value={batchName} onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Musoma Hotels"
                    className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
                    data-testid="batch-name-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52525B] mb-1">City Override</label>
                  <select value={cityOverride} onChange={(e) => setCityOverride(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
                    data-testid="city-override-select">
                    <option value="">Auto-detect</option>
                    {["Dodoma", "Dar es Salaam", "Arusha", "Zanzibar", "Mwanza", "Mbeya", "Musoma", "Moshi", "Tanga", "Morogoro", "Iringa", "Bukoba"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleConfirmImport} disabled={importing || (preview.valid + preview.warnings) === 0}
                  className="flex items-center gap-2 bg-[#1B4332] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#143D28] disabled:opacity-50"
                  data-testid="confirm-import-btn">
                  <Check className="w-5 h-5" />
                  {importing ? "Inaingiza..." : `Ingiza Sasa (${preview.valid + preview.warnings})`}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F4F5]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">#</th>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">City</th>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">Rating</th>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">Photos</th>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#52525B]">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.preview.map((row, i) => (
                  <tr key={i} className={getRowBg(row.status)} data-testid={`preview-row-${i}`}>
                    <td className="px-4 py-3 text-[#A1A1AA]">{row.row}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.photos?.[0] && (
                          <img src={getPhotoUrl(row.photos[0], "thumb")} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="font-medium text-[#18181B]">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#52525B]">{row.city || "-"}</td>
                    <td className="px-4 py-3 text-[#52525B]">{row.phone || "-"}</td>
                    <td className="px-4 py-3 text-[#52525B]">{row.rating ? `${row.rating}/5` : "-"}</td>
                    <td className="px-4 py-3">{photoStatus(row.photo_count)}</td>
                    <td className="px-4 py-3">
                      {row.status === "valid" && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Valid</span>}
                      {row.status === "warning" && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">Warning</span>}
                      {row.status === "duplicate" && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">Duplicate</span>}
                      {row.status === "error" && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">Error</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A1A1AA]">{row.issues.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import History */}
      {batches.length > 0 && !preview && !result && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-4">Import History</h3>
          <div className="space-y-2">
            {batches.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-[#F4F4F5] rounded-lg" data-testid={`batch-${b.id}`}>
                <div>
                  <p className="font-medium text-[#18181B]">{b.name}</p>
                  <p className="text-xs text-[#A1A1AA]">{new Date(b.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#18181B]">{b.imported} imported, {b.skipped} skipped</p>
                  {b.errors?.length > 0 && <p className="text-xs text-red-500">{b.errors.length} errors</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
