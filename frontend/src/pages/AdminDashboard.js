import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, useAuth, LanguageToggle } from "../App";
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

  const handleLogout = () => { logout(); navigate("/"); };

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashibodi", exact: true },
    { path: "/admin/hotels", icon: Building2, label: "Hoteli" },
    { path: "/admin/owners", icon: UserCheck, label: "Wamiliki" },
    { path: "/admin/cashiers", icon: Users, label: "Weka Hazina" },
    { path: "/admin/import", icon: Upload, label: "Import Hotels" },
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
            <span className="font-['Outfit'] font-bold text-lg text-[#9A3324]">Admin Panel</span>
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
              <p className="text-sm text-[#A1A1AA]">Admin</p>
              <p className="font-medium text-[#18181B]">{user?.full_name}</p>
            </div>
            <LanguageToggle />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-[#52525B] hover:bg-[#F4F4F5] rounded-lg" data-testid="admin-logout-btn">
            <LogOut className="w-5 h-5" /><span className="font-medium">Toka</span>
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

  useEffect(() => { fetchStats(); }, []);
  const fetchStats = async () => {
    try { const res = await api.get("/admin/stats"); setStats(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const bookingData = [
    { name: "Online", value: stats?.online_bookings || 0 },
    { name: "Walk-in", value: stats?.walkin_bookings || 0 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Admin Dashboard</h1>
        <p className="text-[#52525B]">Muhtasari wa platform nzima</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Hoteli Jumla", value: stats?.total_hotels, sub: `${stats?.verified_hotels || 0} Zilizothibitishwa`, color: "text-[#18181B]", id: "stat-hotels" },
          { label: "Bukini Jumla", value: stats?.total_bookings, sub: `${stats?.online_bookings || 0} Online, ${stats?.walkin_bookings || 0} Walk-in`, color: "text-[#18181B]", id: "stat-bookings" },
          { label: "Wamiliki Wapya", value: stats?.pending_owners, sub: "Wanasubiri uthibitishaji", color: stats?.pending_owners > 0 ? "text-[#E07B2A]" : "text-[#18181B]", id: "stat-pending" },
          { label: "Mapato Jumla", value: `TZS ${(stats?.total_revenue || 0).toLocaleString()}`, sub: `Commission: TZS ${(stats?.commission_10_percent || 0).toLocaleString()}`, color: "text-[#0F4C5C]", id: "stat-revenue" },
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
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">Online vs Walk-in</h3>
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
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">Revenue by City</h3>
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

  useEffect(() => { fetchHotels(); }, []);
  const fetchHotels = async () => {
    try { const res = await api.get("/admin/all-hotels"); setHotels(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const verifyHotel = async (hotelId) => {
    try { await api.put(`/admin/hotels/${hotelId}/verify`); toast.success("Hotel imethibitishwa!"); fetchHotels(); }
    catch (err) { toast.error("Imeshindikana"); }
  };
  const suspendHotel = async (hotelId) => {
    try { await api.put(`/admin/hotels/${hotelId}/suspend`); toast.success("Hotel imesimamishwa"); fetchHotels(); }
    catch (err) { toast.error("Imeshindikana"); }
  };
  const deleteHotel = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/hotels/${deleteConfirm.id}`);
      toast.success(`Hotel '${deleteConfirm.name}' imefutwa`);
      setDeleteConfirm(null); fetchHotels();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana kufuta"); }
  };

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(filter.toLowerCase()) || h.city.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  const statusBadge = (status) => {
    const map = {
      verified: { bg: "bg-green-100", text: "text-green-700", label: "Imethibitishwa" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Inasubiri" },
      imported: { bg: "bg-blue-100", text: "text-blue-700", label: "Imeingizwa" },
      suspended: { bg: "bg-red-100", text: "text-red-700", label: "Imesimamishwa" }
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-1 ${s.bg} ${s.text} text-xs font-medium rounded`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Hoteli Zote</h1>
          <p className="text-[#52525B]">{hotels.length} hoteli kwenye platform</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/admin/hotels/new")} className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#143D28]" data-testid="create-hotel-btn">
            <Plus className="w-4 h-4" /> Ongeza Hotel
          </button>
          <Link to="/admin/import" className="flex items-center gap-2 bg-[#9A3324] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#7A2A1D]" data-testid="import-hotels-btn">
            <Upload className="w-4 h-4" /> Import Hotels
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
        <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Tafuta hotel kwa jina au mji..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
          data-testid="search-hotels-input" />
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Hotel</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Mji</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Mmiliki</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Vyumba</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Picha</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Hali</th>
              <th className="text-left px-4 py-4 text-sm font-medium text-[#52525B]">Kitendo</th>
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
                      + Weka Mmiliki
                    </button>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[#52525B]" data-testid={`room-count-${hotel.id}`}>{hotel.room_type_count || 0} aina</span>
                    {hotel.has_default_rooms && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-medium rounded" data-testid={`needs-update-${hotel.id}`}>
                        <AlertTriangle className="w-3 h-3" /> Sasisha
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
                        <Check className="w-3 h-3" /> Thibitisha
                      </button>
                    )}
                    <button onClick={() => navigate(`/admin/hotels/${hotel.id}`)} className="flex items-center gap-1 bg-[#0F4C5C] text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-[#0D3E4D]" data-testid={`edit-hotel-${hotel.id}`}>
                      <Pencil className="w-3 h-3" /> Hariri
                    </button>
                    {hotel.status !== "suspended" && (
                      <button onClick={() => suspendHotel(hotel.id)} className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-yellow-200" data-testid={`suspend-hotel-${hotel.id}`}>
                        Simamisha
                      </button>
                    )}
                    <button onClick={() => setDeleteConfirm(hotel)} className="flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-red-200" data-testid={`delete-hotel-${hotel.id}`}>
                      <Trash2 className="w-3 h-3" /> Futa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredHotels.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">Hakuna hoteli</div>}
      </div>
      {attachModal && <AttachOwnerModal hotel={attachModal} onClose={() => setAttachModal(null)} onSuccess={() => { setAttachModal(null); fetchHotels(); }} />}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="delete-hotel-modal">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-2">Futa Hotel?</h3>
            <p className="text-sm text-[#52525B] mb-4">
              Una uhakika unataka kufuta <strong>{deleteConfirm.name}</strong>? Kitendo hiki hakiwezi kutenduliwa.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">Ghairi</button>
              <button onClick={deleteHotel} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600" data-testid="confirm-delete-hotel">Futa</button>
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
  if (!hotel) return <div className="text-center py-12">Hotel haipatikani</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/admin/hotels")} className="p-2 hover:bg-[#F4F4F5] rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">{hotel.name}</h1>
          <p className="text-[#52525B]">Simamia picha za hotel ({photos.length} picha)</p>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/admin/hotels/${hotel.id}/attach-owner`, form);
      toast.success(`Mmiliki amewekwa kwa ${hotel.name}`);
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="attach-owner-modal">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="font-['Outfit'] text-xl font-semibold text-[#18181B] mb-2">Weka Mmiliki</h3>
        <p className="text-sm text-[#A1A1AA] mb-6">Hotel: {hotel.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-1">Jina Kamili</label>
            <input type="text" required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="owner-name-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-1">Simu (+255...)</label>
            <input type="tel" required value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="owner-phone-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-1">Email</label>
            <input type="email" required value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="owner-email-input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">Ghairi</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-[#9A3324] text-white rounded-lg font-medium hover:bg-[#7A2A1D] disabled:opacity-50" data-testid="submit-attach-owner">
              {loading ? "..." : "Weka Mmiliki"}
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

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { const res = await api.get("/admin/pending-owners"); setPendingOwners(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const approveOwner = async (userId) => {
    try { await api.put(`/admin/users/${userId}/verify`); toast.success("Mmiliki amethibitishwa!"); fetchData(); }
    catch (err) { toast.error("Imeshindikana"); }
  };
  const rejectOwner = async (userId) => {
    try { await api.put(`/admin/users/${userId}/reject`); toast.success("Mmiliki amekataliwa"); fetchData(); }
    catch (err) { toast.error("Imeshindikana"); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Wamiliki wa Hoteli</h1>
        <p className="text-[#52525B]">Thibitisha na simamia wamiliki</p>
      </div>
      {pendingOwners.length > 0 ? (
        <div className="bg-[#FEF3C7] rounded-xl border border-yellow-300 p-4">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Wamiliki {pendingOwners.length} Wanasubiri Uthibitishaji
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
                    <Check className="w-4 h-4" /> Thibitisha
                  </button>
                  <button onClick={() => rejectOwner(owner.id)} className="flex items-center gap-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200" data-testid={`reject-owner-${owner.id}`}>
                    <X className="w-4 h-4" /> Kataa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">Hakuna wamiliki wanaosubiri uthibitishaji</p>
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
      toast.success("Mweka Hazina ameongezwa! SMS imetumwa.");
      setShowAddModal(false); setFormData({ full_name: "", phone: "", email: "", hotel_id: "" }); fetchCashiers();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); } finally { setSubmitLoading(false); }
  };

  const handleEditCashier = async (e) => {
    e.preventDefault(); setSubmitLoading(true);
    try {
      const body = {};
      if (editModal.full_name !== editModal._orig_name) body.full_name = editModal.full_name;
      if (editModal.phone !== editModal._orig_phone) body.phone = editModal.phone;
      if (editModal.assigned_hotel_id !== editModal._orig_hotel) body.assigned_hotel_id = editModal.assigned_hotel_id;
      await api.patch(`/cashiers/${editModal.id}`, body);
      toast.success("Cashier amesasishwa"); setEditModal(null); fetchCashiers();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); } finally { setSubmitLoading(false); }
  };

  const handleResetPassword = async () => {
    try {
      const res = await api.post(`/cashiers/${resetModal.id}/reset-password`);
      setNewPassword(res.data.new_password); toast.success("Neno la siri limewekwa upya + SMS imetumwa");
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); }
  };

  const handleToggle = async () => {
    try {
      await api.put(`/cashiers/${toggleModal.id}/toggle-status-sms`);
      toast.success("Hali imebadilishwa + SMS imetumwa"); setToggleModal(null); fetchCashiers();
    } catch (err) { toast.error(err.response?.data?.detail || "Imeshindikana"); }
  };

  const handleViewPerformance = async (cashier) => {
    try {
      const res = await api.get(`/cashiers/${cashier.id}/performance`);
      setPerfModal(res.data);
    } catch (err) { toast.error("Imeshindikana kupakia"); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Weka Hazina Wote</h1>
          <p className="text-[#52525B]">Simamia cashier wote kwenye platform</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#0F4C5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0A3844] transition-all" data-testid="admin-add-cashier-btn">
          <Plus className="w-4 h-4" /> Ongeza Mweka Hazina
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="admin-cashiers-table">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Jina</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Simu</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Hotel</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Hali</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Vitendo</th>
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
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={() => setEditModal({...c, _orig_name: c.full_name, _orig_phone: c.phone, _orig_hotel: c.assigned_hotel_id})}
                    className="px-2 py-1 text-xs font-medium text-[#0F4C5C] hover:bg-[#F4F4F5] rounded" data-testid={`edit-cashier-${c.id}`}>Hariri</button>
                  <button onClick={() => { setResetModal(c); setNewPassword(null); }}
                    className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded" data-testid={`reset-pwd-${c.id}`}>Weka Upya</button>
                  <button onClick={() => setToggleModal(c)}
                    className={`px-2 py-1 text-xs font-medium rounded ${c.is_active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                    data-testid={`toggle-cashier-${c.id}`}>{c.is_active ? "Zima" : "Washa"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cashiers.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">Hakuna weka hazina</div>}
      </div>

      {/* Add Cashier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md" data-testid="add-cashier-modal">
            <div className="p-5 border-b border-border"><h2 className="font-['Outfit'] text-lg font-bold">Ongeza Mweka Hazina</h2><p className="text-xs text-[#A1A1AA] mt-1">Neno la siri la muda litatumwa kwa SMS</p></div>
            <form onSubmit={handleAddCashier} className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Jina Kamili</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="new-cashier-name" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="new-cashier-email" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Simu (+255)</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0712345678" className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="new-cashier-phone" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Hotel</label>
                <select value={formData.hotel_id} onChange={e => setFormData({...formData, hotel_id: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required>
                  <option value="">Chagua Hotel</option>
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844] disabled:opacity-50" data-testid="submit-add-cashier">{submitLoading ? "..." : "Ongeza"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cashier Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md" data-testid="edit-cashier-modal">
            <div className="p-5 border-b border-border"><h2 className="font-['Outfit'] text-lg font-bold">Hariri Mweka Hazina</h2><p className="text-xs text-[#A1A1AA] mt-1">Email haiwezi kubadilishwa</p></div>
            <form onSubmit={handleEditCashier} className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Email</label><input type="email" value={editModal.email} disabled className="w-full px-3 py-2.5 rounded-lg border border-input text-sm bg-[#F4F4F5] text-[#A1A1AA]" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Jina Kamili</label><input type="text" value={editModal.full_name} onChange={e => setEditModal({...editModal, full_name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="edit-cashier-name" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Simu</label><input type="tel" value={editModal.phone} onChange={e => setEditModal({...editModal, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="edit-cashier-phone" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Hotel</label>
                <select value={editModal.assigned_hotel_id} onChange={e => setEditModal({...editModal, assigned_hotel_id: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]">
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844] disabled:opacity-50" data-testid="submit-edit-cashier">{submitLoading ? "..." : "Hifadhi"}</button>
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
                <h3 className="font-['Outfit'] text-lg font-bold">Weka Upya Neno la Siri</h3>
                <p className="text-sm text-[#52525B]">Je, una uhakika unataka kuweka upya neno la siri la <span className="font-bold">{resetModal.full_name}</span>?</p>
                <div className="flex gap-3">
                  <button onClick={() => setResetModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
                  <button onClick={handleResetPassword} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844]" data-testid="confirm-reset-btn">Thibitisha</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-['Outfit'] text-lg font-bold">Neno la Siri Jipya</h3>
                <p className="text-sm text-[#52525B]">Nakili na umpe mweka hazina:</p>
                <div className="bg-[#F4F4F5] rounded-lg p-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-[#18181B]" data-testid="new-password-display">{newPassword}</span>
                  <button onClick={() => { navigator.clipboard.writeText(newPassword); toast.success("Imenakiliwa!"); }} className="px-3 py-1 bg-[#0F4C5C] text-white text-xs rounded-lg">Nakili</button>
                </div>
                <p className="text-xs text-[#A1A1AA]">SMS imetumwa kwa cashier pia.</p>
                <button onClick={() => { setResetModal(null); setNewPassword(null); }} className="w-full py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Funga</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle Status Modal */}
      {toggleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" data-testid="toggle-status-modal">
            <h3 className="font-['Outfit'] text-lg font-bold">{toggleModal.is_active ? "Zima Akaunti" : "Washa Akaunti"}</h3>
            <p className="text-sm text-[#52525B]">
              {toggleModal.is_active
                ? `Kuzima akaunti ya ${toggleModal.full_name} kutazuia uwezo wake wa kuingia. Je, unataka kuendelea?`
                : `Washa akaunti ya ${toggleModal.full_name}?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setToggleModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
              <button onClick={handleToggle}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white ${toggleModal.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                data-testid="confirm-toggle-btn">{toggleModal.is_active ? "Zima Akaunti" : "Washa Akaunti"}</button>
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
                <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-600">Walk-ins</p><p className="text-xl font-bold text-green-700">{perfModal.this_month?.walkins_recorded}</p></div>
                <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-600">Check-ins</p><p className="text-xl font-bold text-blue-700">{perfModal.this_month?.checkins_confirmed}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-600">Checkouts</p><p className="text-xl font-bold text-gray-700">{perfModal.this_month?.checkouts_processed}</p></div>
                <div className="bg-[#0F4C5C]/10 rounded-lg p-3"><p className="text-xs text-[#0F4C5C]">Mapato</p><p className="text-xl font-bold text-[#0F4C5C]">TZS {(perfModal.this_month?.total_revenue || 0).toLocaleString()}</p></div>
              </div>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold">Shughuli (Mwezi Huu)</h3></div>
                {perfModal.activity_log?.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-[#F4F4F5]"><tr>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">Tarehe</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">Kitendo</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">Mgeni</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">Chumba</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-[#52525B]">Kiasi</th>
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
                ) : <div className="p-6 text-center text-sm text-[#A1A1AA]">Hakuna shughuli mwezi huu</div>}
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
