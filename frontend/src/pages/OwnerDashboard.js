import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, useAuth, LanguageToggle } from "../App";
import HotelEditPage from "../components/HotelEditPage";
import { 
  LayoutDashboard, Building2, BedDouble, Calendar, Users, 
  TrendingUp, Settings, LogOut, ChevronDown, Plus, Eye,
  DollarSign, UserCheck, ArrowUpRight, ArrowDownRight,
  Pencil, AlertTriangle, X
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await api.get("/owner/hotels");
      setHotels(res.data);
      if (res.data.length > 0 && !selectedHotel) {
        setSelectedHotel(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { path: "/owner", icon: LayoutDashboard, label: "Dashibodi", exact: true },
    { path: "/owner/hotels", icon: Building2, label: "Hoteli Zangu" },
    { path: "/owner/rooms", icon: BedDouble, label: "Vyumba" },
    { path: "/owner/bookings", icon: Calendar, label: "Bukini" },
    { path: "/owner/staff", icon: Users, label: "Wasimamizi" },
    { path: "/owner/revenue", icon: TrendingUp, label: "Mapato" },
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border fixed h-full">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#0F4C5C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <span className="font-['Outfit'] font-bold text-lg text-[#0F4C5C]">Habari Stays</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path, item.exact)
                  ? "bg-[#0F4C5C] text-white"
                  : "text-[#52525B] hover:bg-[#F4F4F5]"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="mb-3 px-1 flex items-center justify-between">
            <p className="text-xs text-[#A1A1AA]">{user?.full_name}</p>
            <LanguageToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-[#52525B] hover:bg-[#F4F4F5] rounded-lg transition-all"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Toka</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-border px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            {/* Hotel Selector */}
            <div className="relative">
              <button
                onClick={() => setShowHotelDropdown(!showHotelDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-[#F4F4F5] rounded-lg hover:bg-[#E4E4E7] transition-all"
                data-testid="hotel-selector"
              >
                <Building2 className="w-4 h-4 text-[#52525B]" />
                <span className="font-medium text-[#18181B]">
                  {selectedHotel ? `Unaangalia: ${selectedHotel.name}` : "Chagua Hotel"}
                </span>
                <ChevronDown className="w-4 h-4 text-[#52525B]" />
              </button>
              
              {showHotelDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-border z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedHotel(null);
                        setShowHotelDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left rounded-lg hover:bg-[#F4F4F5] transition-all ${
                        !selectedHotel ? "bg-[#0F4C5C]/10 text-[#0F4C5C]" : ""
                      }`}
                      data-testid="view-all-hotels"
                    >
                      <span className="font-medium">Angalia Zote</span>
                      <p className="text-sm text-[#A1A1AA]">Takwimu za hoteli zote</p>
                    </button>
                    {hotels.map((hotel) => (
                      <button
                        key={hotel.id}
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setShowHotelDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left rounded-lg hover:bg-[#F4F4F5] transition-all ${
                          selectedHotel?.id === hotel.id ? "bg-[#0F4C5C]/10 text-[#0F4C5C]" : ""
                        }`}
                        data-testid={`select-hotel-${hotel.id}`}
                      >
                        <span className="font-medium">{hotel.name}</span>
                        <p className="text-sm text-[#A1A1AA]">{hotel.city}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium text-[#18181B]">{user?.full_name}</p>
                <p className="text-sm text-[#A1A1AA]">Mmiliki</p>
              </div>
              <div className="w-10 h-10 bg-[#0F4C5C] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{user?.full_name?.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Routes */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<OwnerHome hotels={hotels} selectedHotel={selectedHotel} />} />
            <Route path="/hotels" element={<MyHotels hotels={hotels} fetchHotels={fetchHotels} />} />
            <Route path="/hotels/:hotelId" element={<HotelEditPage basePath="/owner" />} />
            <Route path="/rooms" element={<RoomsManagement hotels={hotels} selectedHotel={selectedHotel} />} />
            <Route path="/bookings" element={<BookingsManagement selectedHotel={selectedHotel} />} />
            <Route path="/staff" element={<StaffManagement hotels={hotels} selectedHotel={selectedHotel} />} />
            <Route path="/revenue" element={<RevenueAnalytics selectedHotel={selectedHotel} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// ================== OWNER HOME ==================
const OwnerHome = ({ hotels, selectedHotel }) => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedHotel]);

  const fetchStats = async () => {
    try {
      const hotelParam = selectedHotel ? `?hotel_id=${selectedHotel.id}` : "";
      const [revenueRes] = await Promise.all([
        api.get(`/analytics/revenue${hotelParam}&period=month`)
      ]);
      
      setStats({
        total_revenue: revenueRes.data.total_revenue,
        online_revenue: revenueRes.data.online_revenue,
        walkin_revenue: revenueRes.data.walkin_revenue,
        bookings_count: revenueRes.data.bookings_count
      });
      setRevenueData(revenueRes.data.daily_breakdown || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      title: "Mapato (Mwezi)",
      value: `TZS ${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "#0F4C5C",
      change: "+12%"
    },
    {
      title: "Bukini",
      value: stats?.bookings_count || 0,
      icon: Calendar,
      color: "#E3B505",
      change: "+8%"
    },
    {
      title: "Online",
      value: `TZS ${(stats?.online_revenue || 0).toLocaleString()}`,
      icon: ArrowUpRight,
      color: "#10B981",
      change: ""
    },
    {
      title: "Walk-in",
      value: `TZS ${(stats?.walkin_revenue || 0).toLocaleString()}`,
      icon: UserCheck,
      color: "#F59E0B",
      change: ""
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">
            {selectedHotel ? selectedHotel.name : "Hoteli Zote"}
          </h1>
          <p className="text-[#52525B]">
            {selectedHotel ? `Takwimu za ${selectedHotel.name}` : `Takwimu za hoteli ${hotels.length}`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-border p-6 shadow-sm" data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}10` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              {stat.change && (
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
              )}
            </div>
            <p className="text-[#A1A1AA] text-sm mb-1">{stat.title}</p>
            <p className="font-['Outfit'] text-2xl font-bold text-[#18181B]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">Mapato ya Mwezi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `TZS ${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="online" stackId="1" stroke="#0F4C5C" fill="#0F4C5C" fillOpacity={0.6} name="Online" />
                <Area type="monotone" dataKey="walkin" stackId="1" stroke="#E3B505" fill="#E3B505" fillOpacity={0.6} name="Walk-in" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Split Pie */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">Mgawanyo wa Mapato</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Online", value: stats?.online_revenue || 0 },
                    { name: "Walk-in", value: stats?.walkin_revenue || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#0F4C5C" />
                  <Cell fill="#E3B505" />
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => `TZS ${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hotels Performance (when viewing all) */}
      {!selectedHotel && hotels.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">Utendaji wa Hoteli</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotels.map(h => ({
                name: h.name.length > 15 ? h.name.slice(0, 15) + '...' : h.name,
                revenue: h.revenue_this_month,
                bookings: h.bookings_this_month
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `TZS ${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#0F4C5C" name="Mapato" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== MY HOTELS ==================
const MyHotels = ({ hotels, fetchHotels }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Hoteli Zangu</h1>
          <p className="text-[#52525B]">Simamia hoteli zako zote</p>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <div key={hotel.id} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm" data-testid={`hotel-item-${hotel.id}`}>
            <div className="h-40 bg-[#F4F4F5] relative cursor-pointer" onClick={() => navigate(`/owner/hotels/${hotel.id}`)}>
              <img
                src={hotel.cover_photo || hotel.photos?.[0]?.cloudinary_thumb || hotel.images?.[0] || "https://images.unsplash.com/photo-1741506131058-533fcf894483"}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                {hotel.status === "verified" ? (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">Imethibitishwa</span>
                ) : hotel.status === "imported" ? (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">Imeingizwa</span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">Inasubiri</span>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#A1A1AA] font-mono">{hotel.hotel_code}</span>
                <span className="px-2 py-0.5 bg-[#F4F4F5] text-[#52525B] text-xs rounded">{hotel.city}</span>
              </div>
              <h3 className="font-['Outfit'] text-xl font-semibold text-[#18181B] mb-2">{hotel.name}</h3>
              
              {hotel.has_default_rooms && (
                <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3" data-testid={`owner-default-warning-${hotel.id}`}>
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-700">Chumba cha Standard kinahitaji kusasishwa</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-border">
                <div className="text-center">
                  <p className="font-bold text-[#18181B]">{hotel.room_type_count || 0}</p>
                  <p className="text-xs text-[#A1A1AA]">Aina</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#18181B]">{hotel.bookings_this_month}</p>
                  <p className="text-xs text-[#A1A1AA]">Bukini</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#0F4C5C]">{((hotel.revenue_this_month || 0)/1000).toFixed(0)}k</p>
                  <p className="text-xs text-[#A1A1AA]">TZS</p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/owner/hotels/${hotel.id}`)}
                className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 bg-[#0F4C5C] text-white rounded-lg font-medium hover:bg-[#0A3844] transition-all"
                data-testid={`edit-hotel-${hotel.id}`}
              >
                <Pencil className="w-4 h-4" /> Hariri Hotel
              </button>
            </div>
          </div>
        ))}
      </div>

      {hotels.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <Building2 className="w-12 h-12 text-[#A1A1AA] mx-auto mb-3" />
          <p className="text-[#A1A1AA]">Huna hoteli bado. Wasiliana na admin kuongeza hoteli.</p>
        </div>
      )}
    </div>
  );
};

// ================== ROOMS MANAGEMENT ==================
const RoomsManagement = ({ hotels, selectedHotel }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    hotel_id: "",
    name: "",
    description: "",
    price_per_night: "",
    capacity: 2,
    total_rooms: 1,
    available_rooms: 1,
    amenities: []
  });

  useEffect(() => {
    if (selectedHotel) {
      fetchRooms();
    } else if (hotels.length > 0) {
      fetchAllRooms();
    }
  }, [selectedHotel, hotels]);

  const fetchRooms = async () => {
    try {
      const res = await api.get(`/room-types?hotel_id=${selectedHotel.id}`);
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const allRooms = [];
      for (const hotel of hotels) {
        const res = await api.get(`/room-types?hotel_id=${hotel.id}`);
        allRooms.push(...res.data.map(r => ({ ...r, hotel_name: hotel.name })));
      }
      setRooms(allRooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/room-types", {
        ...formData,
        price_per_night: parseFloat(formData.price_per_night),
        hotel_id: formData.hotel_id || selectedHotel?.id
      });
      toast.success("Aina ya chumba imeongezwa!");
      setShowAddModal(false);
      setFormData({ hotel_id: "", name: "", description: "", price_per_night: "", capacity: 2, total_rooms: 1, available_rooms: 1, amenities: [] });
      selectedHotel ? fetchRooms() : fetchAllRooms();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana kuongeza");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Vyumba</h1>
          <p className="text-[#52525B]">Simamia aina za vyumba</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#0F4C5C] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0A3844] transition-all"
          data-testid="add-room-btn"
        >
          <Plus className="w-5 h-5" />
          Ongeza Aina ya Chumba
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl border border-border p-6 shadow-sm" data-testid={`room-item-${room.id}`}>
            {room.hotel_name && (
              <span className="text-xs text-[#A1A1AA] mb-2 block">{room.hotel_name}</span>
            )}
            <h3 className="font-['Outfit'] text-xl font-semibold text-[#18181B] mb-2">{room.name}</h3>
            <p className="text-[#52525B] text-sm mb-4 line-clamp-2">{room.description}</p>
            
            <div className="flex items-center justify-between py-4 border-t border-border">
              <div>
                <p className="text-sm text-[#A1A1AA]">Bei kwa Usiku</p>
                <p className="font-bold text-[#0F4C5C]">TZS {room.price_per_night.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#A1A1AA]">Vinapatikana</p>
                <p className="font-bold text-[#18181B]">{room.available_rooms} / {room.total_rooms}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Ongeza Aina ya Chumba</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!selectedHotel && (
                <div>
                  <label className="block text-sm font-medium text-[#18181B] mb-2">Hotel</label>
                  <select
                    value={formData.hotel_id}
                    onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    required
                  >
                    <option value="">Chagua Hotel</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#18181B] mb-2">Jina la Aina</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mfano: Deluxe Double"
                  className="w-full px-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  required
                  data-testid="room-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#18181B] mb-2">Maelezo</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#18181B] mb-2">Bei kwa Usiku (TZS)</label>
                  <input
                    type="number"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    required
                    data-testid="room-price-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#18181B] mb-2">Uwezo (watu)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#18181B] mb-2">Vyumba Jumla</label>
                  <input
                    type="number"
                    value={formData.total_rooms}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      total_rooms: parseInt(e.target.value),
                      available_rooms: parseInt(e.target.value)
                    })}
                    min={1}
                    className="w-full px-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    required
                    data-testid="room-total-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#18181B] mb-2">Vinapatikana</label>
                  <input
                    type="number"
                    value={formData.available_rooms}
                    onChange={(e) => setFormData({ ...formData, available_rooms: parseInt(e.target.value) })}
                    min={0}
                    max={formData.total_rooms}
                    className="w-full px-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-[#F4F4F5] transition-all"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0F4C5C] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#0A3844] transition-all"
                  data-testid="submit-room-btn"
                >
                  Ongeza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== BOOKINGS MANAGEMENT ==================
const BookingsManagement = ({ selectedHotel }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: "", status: "" });

  useEffect(() => {
    fetchBookings();
  }, [selectedHotel, filter]);

  const fetchBookings = async () => {
    try {
      let url = "/bookings?";
      if (selectedHotel) url += `hotel_id=${selectedHotel.id}&`;
      if (filter.type) url += `booking_type=${filter.type}&`;
      if (filter.status) url += `checkin_status=${filter.status}&`;
      
      const res = await api.get(url);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Bukini</h1>
          <p className="text-[#52525B]">Orodha ya bukini zote</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            data-testid="filter-type"
          >
            <option value="">Aina Zote</option>
            <option value="online">Online</option>
            <option value="walkin">Walk-in</option>
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            data-testid="filter-status"
          >
            <option value="">Hali Zote</option>
            <option value="not_checked_in">Hajaingizwa</option>
            <option value="checked_in">Ameingizwa</option>
            <option value="checked_out">Ametoka</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Ref</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Mgeni</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Chumba</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Tarehe</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Kiasi</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Aina</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Hali</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Processed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-[#F4F4F5]/50" data-testid={`booking-row-${booking.id}`}>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-[#0F4C5C]">{booking.booking_ref}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-[#18181B]">{booking.guest_name}</p>
                  <p className="text-sm text-[#A1A1AA]">{booking.guest_phone}</p>
                </td>
                <td className="px-6 py-4 text-[#52525B]">{booking.room_type_name}</td>
                <td className="px-6 py-4 text-sm text-[#52525B]">
                  {booking.check_in_date} - {booking.check_out_date}
                </td>
                <td className="px-6 py-4 font-medium text-[#18181B]">
                  TZS {booking.total_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.booking_type === "online" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {booking.booking_type === "online" ? "ONLINE" : "WALK-IN"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.checkin_status === "checked_in" 
                      ? "bg-green-100 text-green-700"
                      : booking.checkin_status === "checked_out"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {booking.checkin_status === "checked_in" ? "Ameingizwa" 
                      : booking.checkin_status === "checked_out" ? "Ametoka" 
                      : "Hajaingizwa"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#52525B]">
                  {booking.created_by_name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <div className="text-center py-12 text-[#A1A1AA]">
            Hakuna bukini
          </div>
        )}
      </div>
    </div>
  );
};

// ================== STAFF MANAGEMENT ==================
const StaffManagement = ({ hotels, selectedHotel }) => {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [toggleModal, setToggleModal] = useState(null);
  const [newPassword, setNewPassword] = useState(null);
  const [formData, setFormData] = useState({ full_name: "", phone: "", email: "", hotel_id: "" });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => { fetchCashiers(); }, [selectedHotel]);
  const fetchCashiers = async () => {
    try {
      let url = "/cashiers";
      if (selectedHotel) url += `?hotel_id=${selectedHotel.id}`;
      const res = await api.get(url);
      setCashiers(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddCashier = async (e) => {
    e.preventDefault(); setSubmitLoading(true);
    try {
      await api.post("/cashiers", { ...formData, hotel_id: formData.hotel_id || selectedHotel?.id });
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Wasimamizi</h1>
          <p className="text-[#52525B]">Weka hazina na wafanyakazi</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#0F4C5C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0A3844] transition-all" data-testid="add-cashier-btn">
          <Plus className="w-4 h-4" /> Ongeza Mweka Hazina
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="owner-cashiers-table">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Jina</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Simu</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Hotel</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Hali</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B]">Vitendo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cashiers.map(c => (
              <tr key={c.id} className="hover:bg-[#F4F4F5]/50" data-testid={`cashier-row-${c.id}`}>
                <td className="px-4 py-3 text-sm font-medium text-[#18181B]">{c.full_name}</td>
                <td className="px-4 py-3 text-sm text-[#52525B]">{c.phone}</td>
                <td className="px-4 py-3 text-sm text-[#52525B]">{c.email}</td>
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
        {cashiers.length === 0 && <div className="text-center py-12 text-[#A1A1AA]">Hakuna wasimamizi</div>}
      </div>

      {/* Add Cashier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-border"><h2 className="font-['Outfit'] text-lg font-bold">Ongeza Mweka Hazina</h2><p className="text-xs text-[#A1A1AA] mt-1">Neno la siri la muda litatumwa kwa SMS</p></div>
            <form onSubmit={handleAddCashier} className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Jina Kamili</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="cashier-name-input" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Simu (+255)</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0712345678" className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="cashier-phone-input" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required data-testid="cashier-email-input" /></div>
              {!selectedHotel && (
                <div><label className="block text-xs font-medium text-[#52525B] mb-1">Hotel</label>
                  <select value={formData.hotel_id} onChange={e => setFormData({...formData, hotel_id: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required>
                    <option value="">Chagua Hotel</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844] disabled:opacity-50" data-testid="submit-cashier-btn">{submitLoading ? "..." : "Ongeza"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-border"><h2 className="font-['Outfit'] text-lg font-bold">Hariri Mweka Hazina</h2></div>
            <form onSubmit={handleEditCashier} className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Email</label><input type="email" value={editModal.email} disabled className="w-full px-3 py-2.5 rounded-lg border border-input text-sm bg-[#F4F4F5] text-[#A1A1AA]" /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Jina Kamili</label><input type="text" value={editModal.full_name} onChange={e => setEditModal({...editModal, full_name: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Simu</label><input type="tel" value={editModal.phone} onChange={e => setEditModal({...editModal, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]" required /></div>
              <div><label className="block text-xs font-medium text-[#52525B] mb-1">Hotel</label>
                <select value={editModal.assigned_hotel_id} onChange={e => setEditModal({...editModal, assigned_hotel_id: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]">
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844] disabled:opacity-50">{submitLoading ? "..." : "Hifadhi"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            {!newPassword ? (
              <>
                <h3 className="font-['Outfit'] text-lg font-bold">Weka Upya Neno la Siri</h3>
                <p className="text-sm text-[#52525B]">Je, una uhakika unataka kuweka upya neno la siri la <span className="font-bold">{resetModal.full_name}</span>?</p>
                <div className="flex gap-3">
                  <button onClick={() => setResetModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
                  <button onClick={handleResetPassword} className="flex-1 py-2.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0A3844]">Thibitisha</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-['Outfit'] text-lg font-bold">Neno la Siri Jipya</h3>
                <div className="bg-[#F4F4F5] rounded-lg p-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-bold">{newPassword}</span>
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
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-['Outfit'] text-lg font-bold">{toggleModal.is_active ? "Zima Akaunti" : "Washa Akaunti"}</h3>
            <p className="text-sm text-[#52525B]">
              {toggleModal.is_active
                ? `Kuzima akaunti ya ${toggleModal.full_name} kutazuia uwezo wake wa kuingia.`
                : `Washa akaunti ya ${toggleModal.full_name}?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setToggleModal(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#F4F4F5]">Ghairi</button>
              <button onClick={handleToggle}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white ${toggleModal.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                {toggleModal.is_active ? "Zima" : "Washa"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================== REVENUE ANALYTICS ==================
const RevenueAnalytics = ({ selectedHotel }) => {
  const [data, setData] = useState(null);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchData();
  }, [selectedHotel, period]);

  const fetchData = async () => {
    try {
      const hotelParam = selectedHotel ? `&hotel_id=${selectedHotel.id}` : "";
      const [revenueRes, cashierRes] = await Promise.all([
        api.get(`/analytics/revenue?period=${period}${hotelParam}`),
        api.get(`/analytics/cashier-performance${selectedHotel ? `?hotel_id=${selectedHotel.id}` : ""}`)
      ]);
      setData(revenueRes.data);
      setCashierPerformance(cashierRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#18181B]">Mapato</h1>
          <p className="text-[#52525B]">Uchambuzi wa mapato na utendaji</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          data-testid="period-select"
        >
          <option value="week">Wiki</option>
          <option value="month">Mwezi</option>
          <option value="year">Mwaka</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <p className="text-[#A1A1AA] text-sm mb-2">Jumla ya Mapato</p>
          <p className="font-['Outfit'] text-3xl font-bold text-[#18181B]">
            TZS {(data?.total_revenue || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <p className="text-[#A1A1AA] text-sm mb-2">Online Bookings</p>
          <p className="font-['Outfit'] text-3xl font-bold text-[#0F4C5C]">
            TZS {(data?.online_revenue || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <p className="text-[#A1A1AA] text-sm mb-2">Walk-in Bookings</p>
          <p className="font-['Outfit'] text-3xl font-bold text-[#E3B505]">
            TZS {(data?.walkin_revenue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-6">Mapato kwa Siku</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.daily_breakdown || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `TZS ${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="online" stackId="1" stroke="#0F4C5C" fill="#0F4C5C" fillOpacity={0.6} name="Online" />
              <Area type="monotone" dataKey="walkin" stackId="1" stroke="#E3B505" fill="#E3B505" fillOpacity={0.6} name="Walk-in" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cashier Performance */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">Utendaji wa Weka Hazina</h3>
        </div>
        <table className="w-full">
          <thead className="bg-[#F4F4F5]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Jina</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Walk-ins Leo</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Walk-ins Mwezi</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Cash Leo</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[#52525B]">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cashierPerformance.map((cashier) => (
              <tr key={cashier.cashier_id} className="hover:bg-[#F4F4F5]/50">
                <td className="px-6 py-4 font-medium text-[#18181B]">{cashier.cashier_name}</td>
                <td className="px-6 py-4 text-[#52525B]">{cashier.walkins_today}</td>
                <td className="px-6 py-4 text-[#52525B]">{cashier.walkins_month}</td>
                <td className="px-6 py-4 font-medium text-[#0F4C5C]">
                  TZS {cashier.cash_collected_today.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-[#A1A1AA]">
                  {cashier.last_active ? new Date(cashier.last_active).toLocaleString() : "Hajaingia"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cashierPerformance.length === 0 && (
          <div className="text-center py-12 text-[#A1A1AA]">
            Hakuna weka hazina
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
