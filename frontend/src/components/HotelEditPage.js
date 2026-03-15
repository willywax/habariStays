import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, formatTZS, useAuth } from "../App";
import PhotoManager, { getPhotoUrl } from "./PhotoManager";
import { ChevronLeft, Plus, Trash2, AlertTriangle, Save, X } from "lucide-react";

const HOTEL_AMENITIES = [
  { key: "Breakfast", icon: "\u{1F373}" },
  { key: "Parking", icon: "\u{1F697}" },
  { key: "WiFi", icon: "\u{1F4F6}" },
  { key: "Hot Water", icon: "\u{1F6BF}" },
  { key: "Bar", icon: "\u{1F37A}" },
];

const ROOM_AMENITIES = [
  { key: "A/C", icon: "\u{2744}\u{FE0F}" },
  { key: "Western Toilet", icon: "\u{1F6BD}" },
  { key: "Squat Toilet", icon: "\u{1FAA0}" },
  { key: "En-suite Bathroom", icon: "\u{1F6C1}" },
  { key: "Balcony", icon: "\u{1F305}" },
  { key: "TV", icon: "\u{1F4FA}" },
  { key: "Safe", icon: "\u{1F512}" },
  { key: "Mini Fridge", icon: "\u{1F9CA}" },
  { key: "Hot Shower", icon: "\u{1F6BF}" },
];

const TZ_CITIES = ["Dodoma", "Dar es Salaam", "Arusha", "Zanzibar", "Mwanza", "Mbeya", "Musoma", "Moshi", "Tanga", "Morogoro", "Iringa", "Bukoba", "Kigoma", "Songea"];

const HotelEditPage = ({ basePath = "/admin" }) => {
  const { hotelId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isAdmin = user?.role === "admin";
  const isOwner = user?.role === "owner";
  const isNewHotel = hotelId === "new";

  const fetchHotel = async () => {
    if (isNewHotel) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/hotels/${hotelId}/full`);
      setHotel(res.data);
    } catch (err) {
      toast.error("Imeshindikana kupakia hotel");
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchHotel(); }, [hotelId]);

  if (loading) return <LoadingSpinner />;
  
  // Show create form for new hotels
  if (isNewHotel) {
    return <HotelCreateForm basePath={basePath} />;
  }
  
  if (!hotel) return <div className="text-center py-12 text-[#A1A1AA]">Hotel haipatikani</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`${basePath}/hotels`)} className="p-2 hover:bg-[#F4F4F5] rounded-lg">
          <ChevronLeft className="w-5 h-5 text-[#52525B]" />
        </button>
        <div className="flex-1">
          <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">{hotel.name}</h1>
          <p className="text-sm text-[#A1A1AA]">{hotel.city} &middot; {hotel.hotel_code}</p>
        </div>
        {hotel.status && (
          <StatusBadge status={hotel.status} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Hotel Details */}
        <div className="lg:col-span-2 space-y-6">
          <HotelBasicInfo hotel={hotel} isAdmin={isAdmin} onSave={fetchHotel} />
          <HotelAmenitiesEditor hotel={hotel} onSave={fetchHotel} />
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-4">Picha za Hotel</h3>
            <PhotoManager photos={hotel.photos || []} entityType="hotel" entityId={hotelId}
              maxPhotos={10} canUpload={true} onPhotosChange={fetchHotel} />
          </div>
        </div>

        {/* RIGHT: Room Types */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">Aina za Vyumba</h2>
            <button onClick={() => { setShowAddRoom(true); setEditingRoom(null); }}
              className="flex items-center gap-1 bg-[#1B4332] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#143D28]"
              data-testid="add-room-type-btn">
              <Plus className="w-4 h-4" /> Ongeza
            </button>
          </div>

          {hotel.has_default_rooms && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2" data-testid="default-room-warning">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700">Chumba cha Standard kimeundwa kiotomatiki. Tafadhali sasisha bei na maelezo.</p>
            </div>
          )}

          {hotel.room_types?.map(room => (
            <RoomTypeCard key={room.id} room={room}
              onEdit={() => { setEditingRoom(room); setShowAddRoom(false); }}
              onDelete={() => setDeleteConfirm(room)} />
          ))}

          {hotel.room_types?.length === 0 && (
            <div className="text-center py-8 text-[#A1A1AA] bg-white rounded-xl border border-border">
              <p>Hakuna vyumba. Ongeza aina ya chumba.</p>
            </div>
          )}
        </div>
      </div>

      {/* Room Form (Add/Edit) */}
      {(showAddRoom || editingRoom) && (
        <RoomTypeForm
          hotelId={hotelId}
          room={editingRoom}
          onClose={() => { setShowAddRoom(false); setEditingRoom(null); }}
          onSave={() => { setShowAddRoom(false); setEditingRoom(null); fetchHotel(); }}
        />
      )}

      {/* Delete Room Confirm */}
      {deleteConfirm && (
        <DeleteRoomModal room={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onDeleted={() => { setDeleteConfirm(null); fetchHotel(); }}
        />
      )}
    </div>
  );
};

// ── Status Badge ──
const StatusBadge = ({ status }) => {
  const map = {
    verified: { bg: "bg-green-100", text: "text-green-700", label: "Imethibitishwa" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Inasubiri" },
    imported: { bg: "bg-blue-100", text: "text-blue-700", label: "Imeingizwa" },
    suspended: { bg: "bg-red-100", text: "text-red-700", label: "Imesimamishwa" },
  };
  const s = map[status] || map.pending;
  return <span className={`px-3 py-1 ${s.bg} ${s.text} text-sm font-medium rounded-full`}>{s.label}</span>;
};

// ── Hotel Basic Info ──
const HotelBasicInfo = ({ hotel, isAdmin, onSave }) => {
  const [form, setForm] = useState({
    name: hotel.name || "",
    description: hotel.description || "",
    address: hotel.address || "",
    city: hotel.city || "",
    phone_number: hotel.phone_number || "",
    whatsapp_number: hotel.whatsapp_number || "",
    website: hotel.website || "",
    google_maps_url: hotel.google_maps_url || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/hotels/${hotel.id}`, form);
      toast.success("Taarifa zimehifadhiwa!");
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana");
    } finally { setSaving(false); }
  };

  const f = (field, value) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-4">
      <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B]">Taarifa za Hotel</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#52525B] mb-1">Jina la Hotel</label>
          {isAdmin ? (
            <input type="text" value={form.name} onChange={e => f("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="edit-hotel-name" />
          ) : (
            <div>
              <input type="text" value={form.name} disabled className="w-full px-3 py-2 rounded-lg border border-border bg-[#F4F4F5] text-[#A1A1AA]" />
              <p className="text-xs text-[#A1A1AA] mt-1">Ili kubadilisha jina la hoteli, wasiliana na msaada: support@habaristays.com</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#52525B] mb-1">Mji</label>
          {isAdmin ? (
            <select value={form.city} onChange={e => f("city", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="edit-hotel-city">
              <option value="">Chagua...</option>
              {TZ_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input type="text" value={form.city} disabled className="w-full px-3 py-2 rounded-lg border border-border bg-[#F4F4F5] text-[#A1A1AA]" />
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#52525B] mb-1">Anwani</label>
          <input type="text" value={form.address} onChange={e => f("address", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="edit-hotel-address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#52525B] mb-1">Simu</label>
          <input type="tel" value={form.phone_number} onChange={e => f("phone_number", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="edit-hotel-phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#52525B] mb-1">WhatsApp</label>
          <input type="tel" value={form.whatsapp_number} onChange={e => f("whatsapp_number", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="edit-hotel-whatsapp" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#52525B] mb-1">Website</label>
          <input type="text" value={form.website} onChange={e => f("website", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#52525B] mb-1">Google Maps URL</label>
          <input type="text" value={form.google_maps_url} onChange={e => f("google_maps_url", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#52525B] mb-1">Maelezo</label>
          <textarea value={form.description} onChange={e => f("description", e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="edit-hotel-description" />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-[#9A3324] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#7A2A1D] disabled:opacity-50"
        data-testid="save-hotel-info-btn">
        <Save className="w-4 h-4" /> {saving ? "Inahifadhi..." : "Hifadhi Mabadiliko"}
      </button>
    </div>
  );
};

// ── Hotel Amenities Editor ──
const HotelAmenitiesEditor = ({ hotel, onSave }) => {
  const [selected, setSelected] = useState(hotel.amenities || []);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/hotels/${hotel.id}`, { amenities: selected });
      toast.success("Vifaa vimehifadhiwa!");
      onSave();
    } catch (err) { toast.error("Imeshindikana"); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-4">Vifaa vya Hotel</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {HOTEL_AMENITIES.map(a => (
          <label key={a.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
              selected.includes(a.key) ? "bg-[#1B4332] text-white border-[#1B4332]" : "bg-white text-[#52525B] border-border hover:border-[#9A3324]"
            }`} data-testid={`hotel-amenity-${a.key.toLowerCase().replace(/\s/g, "-")}`}>
            <input type="checkbox" checked={selected.includes(a.key)} onChange={() => toggle(a.key)} className="sr-only" />
            <span>{a.icon}</span>
            <span className="text-sm font-medium">{a.key}</span>
          </label>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-[#0F4C5C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0D3E4D] disabled:opacity-50"
        data-testid="save-hotel-amenities-btn">
        <Save className="w-4 h-4" /> {saving ? "..." : "Hifadhi Vifaa"}
      </button>
    </div>
  );
};

// ── Room Type Card ──
const RoomTypeCard = ({ room, onEdit, onDelete }) => (
  <div className={`bg-white rounded-xl border ${room.is_default ? "border-yellow-300" : "border-border"} p-4 space-y-3`}
    data-testid={`room-card-${room.id}`}>
    {room.is_default && (
      <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
        <AlertTriangle className="w-3 h-3" /> Chumba cha kiotomatiki - sasisha
      </div>
    )}
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-semibold text-[#18181B]">{room.name}</h4>
        <p className="text-lg font-bold text-[#E07B2A]">{formatTZS(room.price_per_night)} <span className="text-xs text-[#A1A1AA] font-normal">/ usiku</span></p>
      </div>
      <div className="text-right">
        <p className="text-sm text-[#52525B]">{room.available_rooms}/{room.total_rooms}</p>
        <p className="text-xs text-[#A1A1AA]">vinapatikana</p>
      </div>
    </div>
    {room.amenities?.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {room.amenities.map(a => {
          const am = ROOM_AMENITIES.find(ra => ra.key === a);
          return <span key={a} className="text-xs bg-[#F4F4F5] text-[#52525B] px-2 py-0.5 rounded">{am?.icon} {a}</span>;
        })}
      </div>
    )}
    <div className="flex gap-2 pt-1">
      <button onClick={onEdit} className="flex-1 py-1.5 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0D3E4D]" data-testid={`edit-room-${room.id}`}>
        Hariri
      </button>
      <button onClick={onDelete} className="py-1.5 px-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200" data-testid={`delete-room-${room.id}`}>
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ── Room Type Form (Add/Edit) ──
const RoomTypeForm = ({ hotelId, room, onClose, onSave }) => {
  const isEdit = !!room;
  const [form, setForm] = useState({
    name: room?.name || "",
    description: room?.description || "",
    price_per_night: room?.price_per_night || 50000,
    capacity: room?.capacity || 2,
    total_rooms: room?.total_rooms || 1,
    available_rooms: room?.available_rooms || 1,
    amenities: room?.amenities || [],
  });
  const [saving, setSaving] = useState(false);

  const toggleAmenity = (key) => {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(key) ? p.amenities.filter(a => a !== key) : [...p.amenities, key]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Jina la chumba linahitajika"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/room-types/${room.id}`, form);
        toast.success("Chumba kimesasishwa!");
      } else {
        await api.post(`/hotels/${hotelId}/room-types`, form);
        toast.success("Chumba kimeongezwa!");
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="room-type-form">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Outfit'] text-xl font-semibold text-[#18181B]">
            {isEdit ? `Hariri: ${room.name}` : "Ongeza Chumba Kipya"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[#F4F4F5] rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {isEdit && room?.is_default && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2" data-testid="default-room-notice">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">Hii ni chumba kilichoundwa kiotomatiki. Tafadhali sasisha bei na maelezo sahihi.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#52525B] mb-1">Jina</label>
              <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="room-name-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-1">Bei kwa Usiku (TZS)</label>
              <input type="number" required min={0} value={form.price_per_night}
                onChange={e => setForm(p => ({ ...p, price_per_night: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="room-price-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-1">Uwezo (watu)</label>
              <input type="number" min={1} value={form.capacity}
                onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-1">Vyumba Jumla</label>
              <input type="number" min={1} value={form.total_rooms}
                onChange={e => setForm(p => ({ ...p, total_rooms: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="room-total-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-1">Vinapatikana</label>
              <input type="number" min={0} max={form.total_rooms} value={form.available_rooms}
                onChange={e => setForm(p => ({ ...p, available_rooms: Math.min(parseInt(e.target.value) || 0, p.total_rooms) }))}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" data-testid="room-available-input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-2">Vifaa vya Chumba</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_AMENITIES.map(a => (
                <label key={a.key}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${
                    form.amenities.includes(a.key) ? "bg-[#0F4C5C] text-white border-[#0F4C5C]" : "bg-white text-[#52525B] border-border hover:border-[#0F4C5C]"
                  }`} data-testid={`room-amenity-${a.key.toLowerCase().replace(/[\s/]/g, "-")}`}>
                  <input type="checkbox" checked={form.amenities.includes(a.key)} onChange={() => toggleAmenity(a.key)} className="sr-only" />
                  <span>{a.icon}</span><span>{a.key}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Maelezo</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]" />
          </div>

          {isEdit && room.photos?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-2">Picha za Chumba</label>
              <PhotoManager photos={room.photos} entityType="room" entityId={room.id}
                maxPhotos={5} canUpload={true} onPhotosChange={onSave} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">Ghairi</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#9A3324] text-white rounded-lg font-medium hover:bg-[#7A2A1D] disabled:opacity-50"
              data-testid="save-room-type-btn">
              {saving ? "..." : isEdit ? "Sasisha" : "Ongeza Chumba"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Room Modal ──
const DeleteRoomModal = ({ room, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/room-types/${room.id}`);
      toast.success("Chumba kimefutwa");
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana kufuta");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="delete-room-modal">
      <div className="bg-white rounded-xl w-full max-w-sm p-6">
        <h3 className="font-['Outfit'] text-lg font-semibold text-[#18181B] mb-2">Futa Chumba?</h3>
        <p className="text-sm text-[#52525B] mb-4">
          Je, una uhakika unataka kufuta <strong>{room.name}</strong>? Bookings zilizopo hazitaathiriwa.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">Ghairi</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
            data-testid="confirm-delete-room">
            {loading ? "..." : "Futa"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Hotel Create Form ──
const HotelCreateForm = ({ basePath }) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    phone_number: "",
    whatsapp_number: "",
    website: "",
    google_maps_url: "",
    status: "verified",
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Jina la hotel linahitajika");
      return;
    }
    if (!form.city) {
      toast.error("Chagua mji");
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.post("/admin/hotels", form);
      toast.success("Hotel imeundwa!");
      navigate(`${basePath}/hotels/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Imeshindikana kuunda hotel");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`${basePath}/hotels`)} className="p-2 hover:bg-[#F4F4F5] rounded-lg">
          <ChevronLeft className="w-5 h-5 text-[#52525B]" />
        </button>
        <h1 className="font-['Outfit'] text-2xl font-bold text-[#18181B]">Unda Hotel Mpya</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Jina la Hotel *</label>
            <input type="text" value={form.name} onChange={e => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              placeholder="Kwa mfano: Grand Hotel" data-testid="create-hotel-name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Mji *</label>
            <select value={form.city} onChange={e => handleChange("city", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              data-testid="create-hotel-city">
              <option value="">Chagua mji...</option>
              {TZ_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#52525B] mb-1">Anwani</label>
            <input type="text" value={form.address} onChange={e => handleChange("address", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              placeholder="Kwa mfano: Karibu na Shoppers Plaza" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Simu</label>
            <input type="text" value={form.phone_number} onChange={e => handleChange("phone_number", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              placeholder="+255 xxx xxx xxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">WhatsApp</label>
            <input type="text" value={form.whatsapp_number} onChange={e => handleChange("whatsapp_number", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              placeholder="+255 xxx xxx xxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Website</label>
            <input type="text" value={form.website} onChange={e => handleChange("website", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#52525B] mb-1">Google Maps URL</label>
            <input type="text" value={form.google_maps_url} onChange={e => handleChange("google_maps_url", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              placeholder="https://maps.google.com/..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#52525B] mb-1">Maelezo</label>
            <textarea value={form.description} onChange={e => handleChange("description", e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#9A3324]"
              placeholder="Maelezo mafupi ya hotel..." />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => navigate(`${basePath}/hotels`)}
            className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-[#F4F4F5]">
            Ghairi
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#143D28] disabled:opacity-50"
            data-testid="submit-create-hotel">
            <Save className="w-4 h-4" />
            {saving ? "Inaunda..." : "Unda Hotel"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HotelEditPage;
