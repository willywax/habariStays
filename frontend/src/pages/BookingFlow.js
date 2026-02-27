import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { api, LoadingSpinner, formatTZS } from "../App";
import { useAuth, useLang } from "../App";
import { ChevronLeft } from "lucide-react";

const BookingFlow = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLang();
  
  const [step, setStep] = useState(1);
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState(null);
  
  const [formData, setFormData] = useState({
    guest_name: user?.full_name || "",
    guest_phone: user?.phone || "",
    confirm_phone: "",
    checkin_date: "",
    checkout_date: "",
    num_guests: 1
  });
  
  const [booking, setBooking] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [hotelId, roomId]);

  useEffect(() => {
    if (booking && booking.expires_at && step === 3) {
      const expiresAt = new Date(booking.expires_at).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setStep(5); // Expired
        }
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      
      return () => clearInterval(timerRef.current);
    }
  }, [booking, step]);

  const fetchData = async () => {
    try {
      const [hotelRes, roomsRes, configRes] = await Promise.all([
        api.get(`/hotels/${hotelId}`),
        api.get(`/room-types?hotel_id=${hotelId}`),
        api.get("/config/payment")
      ]);
      
      setHotel(hotelRes.data);
      const selectedRoom = roomsRes.data.find(r => r.id === roomId);
      setRoom(selectedRoom);
      setPaymentConfig(configRes.data);
      
      if (!selectedRoom || selectedRoom.available_rooms < 1) {
        toast.error(lang === "sw" ? "Chumba hakipatikani" : "Room not available");
        navigate(`/hotel/${hotelId}`);
      }
    } catch (err) {
      toast.error(lang === "sw" ? "Imeshindikana kupata data" : "Failed to load data");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!formData.checkin_date || !formData.checkout_date) return 0;
    const checkin = new Date(formData.checkin_date);
    const checkout = new Date(formData.checkout_date);
    return Math.max(0, Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const totalAmount = room ? nights * room.price_per_night : 0;

  const handleCreateBooking = async () => {
    if (formData.guest_phone !== formData.confirm_phone) {
      toast.error(lang === "sw" ? "Namba za simu hazilingani" : "Phone numbers don't match");
      return;
    }
    
    if (nights < 1) {
      toast.error(lang === "sw" ? "Tafadhali chagua tarehe" : "Please select dates");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post("/bookings", {
        hotel_id: hotelId,
        room_type_id: roomId,
        guest_name: formData.guest_name,
        guest_phone: formData.guest_phone,
        checkin_date: formData.checkin_date,
        checkout_date: formData.checkout_date,
        num_guests: formData.num_guests,
        booking_type: "online",
        payment_method: "mpesa"
      });
      
      setBooking(res.data);
      setStep(3); // Payment step
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kuunda booking" : "Failed to create booking"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    const paymentRef = `MPESA-${Date.now()}`;
    setLoading(true);
    try {
      await api.post(`/bookings/${booking.id}/confirm-payment`, {
        booking_id: booking.id,
        payment_reference: paymentRef
      });
      
      clearInterval(timerRef.current);
      setStep(4); // Confirmation
      toast.success(lang === "sw" ? "Malipo yamethibitishwa!" : "Payment confirmed!");
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kuthibitisha malipo" : "Payment confirmation failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    clearInterval(timerRef.current);
    navigate(`/hotel/${hotelId}`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && !hotel) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <header className="bg-white border-b border-[#1A1A1A]/10 py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#E07B2A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <span className="font-['Outfit'] font-bold text-xl text-[#1A1A1A]">HABARI STAYS</span>
          </Link>
          {step < 4 && (
            <button
              onClick={() => step === 1 ? navigate(`/hotel/${hotelId}`) : setStep(step - 1)}
              className="flex items-center gap-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
              data-testid="booking-back-btn"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{lang === "sw" ? "Rudi" : "Back"}</span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Steps Indicator */}
        {step <= 3 && (
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s ? "bg-[#E07B2A] text-white" : "bg-[#1A1A1A]/10 text-[#1A1A1A]/40"
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${step > s ? "bg-[#E07B2A]" : "bg-[#1A1A1A]/10"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Guest Details */}
            {step === 1 && (
              <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                <h2 className="font-['Outfit'] text-2xl font-semibold text-[#1A1A1A] mb-6">
                  {t("guestDetails")}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      {t("fullName")} *
                    </label>
                    <input
                      type="text"
                      value={formData.guest_name}
                      onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                      required
                      data-testid="guest-name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        {t("phone")} (+255) *
                      </label>
                      <input
                        type="tel"
                        value={formData.guest_phone}
                        onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                        placeholder="+255712345678"
                        className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                        required
                        data-testid="guest-phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        {t("confirmPhone")} *
                      </label>
                      <input
                        type="tel"
                        value={formData.confirm_phone}
                        onChange={(e) => setFormData({ ...formData, confirm_phone: e.target.value })}
                        placeholder="+255712345678"
                        className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                        required
                        data-testid="confirm-phone"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        {t("checkin")} *
                      </label>
                      <input
                        type="date"
                        value={formData.checkin_date}
                        onChange={(e) => setFormData({ ...formData, checkin_date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                        required
                        data-testid="checkin-date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        {t("checkout")} *
                      </label>
                      <input
                        type="date"
                        value={formData.checkout_date}
                        onChange={(e) => setFormData({ ...formData, checkout_date: e.target.value })}
                        min={formData.checkin_date || new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                        required
                        data-testid="checkout-date"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      {t("guests")}
                    </label>
                    <select
                      value={formData.num_guests}
                      onChange={(e) => setFormData({ ...formData, num_guests: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.guest_name || !formData.guest_phone || !formData.confirm_phone || nights < 1}
                  className="w-full mt-6 bg-[#E07B2A] text-white py-4 rounded-lg font-semibold hover:bg-[#C96A1F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="continue-btn"
                >
                  {t("continue")}
                </button>
              </div>
            )}

            {/* Step 2: Booking Summary */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                <h2 className="font-['Outfit'] text-2xl font-semibold text-[#1A1A1A] mb-6">
                  {t("bookingSummary")}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A]/60">{lang === "sw" ? "Mgeni" : "Guest"}</span>
                    <span className="font-medium text-[#1A1A1A]">{formData.guest_name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A]/60">{t("phone")}</span>
                    <span className="font-medium text-[#1A1A1A]">{formData.guest_phone}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A]/60">{t("checkin")}</span>
                    <span className="font-medium text-[#1A1A1A]">
                      {new Date(formData.checkin_date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A]/60">{t("checkout")}</span>
                    <span className="font-medium text-[#1A1A1A]">
                      {new Date(formData.checkout_date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#1A1A1A]/10">
                    <span className="text-[#1A1A1A]/60">{room?.name}</span>
                    <span className="font-medium text-[#1A1A1A]">{formatTZS(room?.price_per_night)} x {nights} {t("nights")}</span>
                  </div>
                  <div className="flex justify-between py-4 text-lg">
                    <span className="font-semibold text-[#1A1A1A]">{t("total")}</span>
                    <span className="font-bold text-[#E07B2A] text-2xl">{formatTZS(totalAmount)}</span>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 border border-[#1A1A1A]/20 rounded-lg font-semibold hover:bg-[#FAFAF7] transition-all"
                  >
                    {lang === "sw" ? "Rudi" : "Back"}
                  </button>
                  <button
                    onClick={handleCreateBooking}
                    disabled={loading}
                    className="flex-1 bg-[#1B4332] text-white py-4 rounded-lg font-semibold hover:bg-[#143D28] transition-all disabled:opacity-50"
                    data-testid="pay-mpesa-btn"
                  >
                    {loading ? "..." : t("payWithMpesa")}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && booking && (
              <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                {/* Timer */}
                <div className={`text-center p-4 rounded-xl mb-6 ${
                  timeLeft <= 30 ? "bg-red-100" : "bg-[#F4A723]/10"
                }`}>
                  <p className="text-sm text-[#1A1A1A]/60 mb-1">{t("timeRemaining")}</p>
                  <p className={`font-['Outfit'] text-4xl font-bold ${
                    timeLeft <= 30 ? "text-red-600" : "text-[#F4A723]"
                  }`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
                
                <h2 className="font-['Outfit'] text-2xl font-semibold text-[#1A1A1A] mb-6">
                  {t("paymentInstructions")}
                </h2>
                
                <div className="bg-[#FAFAF7] rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#E07B2A] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                    <p className="text-[#1A1A1A]">{t("openMpesa")}</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#E07B2A] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                    <p className="text-[#1A1A1A]">{t("selectPayBill")}</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#E07B2A] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                    <p className="text-[#1A1A1A]">{t("enterNumber")}: <strong className="text-[#E07B2A]">{paymentConfig?.selcom_till || "123456"}</strong></p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#E07B2A] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                    <p className="text-[#1A1A1A]">{t("amount")}: <strong className="text-[#E07B2A]">{formatTZS(totalAmount)}</strong></p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#E07B2A] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">5</div>
                    <p className="text-[#1A1A1A]">{t("enterPin")}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={loading}
                    className="w-full bg-[#1B4332] text-white py-4 rounded-lg font-semibold hover:bg-[#143D28] transition-all disabled:opacity-50"
                    data-testid="confirm-payment-btn"
                  >
                    {loading ? "..." : t("completedPayment")}
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    className="w-full py-3 text-red-600 font-medium hover:underline"
                  >
                    {t("cancelBooking")}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && booking && (
              <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-8 text-center">
                <div className="w-20 h-20 bg-[#1B4332]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-[#1B4332]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A] mb-4">
                  {t("bookingConfirmed")}
                </h2>
                
                <div className="bg-[#FAFAF7] rounded-xl p-6 mb-6">
                  <p className="text-[#1A1A1A]/60 text-sm mb-2">Booking Reference</p>
                  <p className="font-['Outfit'] text-3xl font-bold text-[#E07B2A]">
                    {booking.booking_ref}
                  </p>
                </div>
                
                <div className="text-left space-y-3 mb-8">
                  <div className="flex justify-between">
                    <span className="text-[#1A1A1A]/60">{lang === "sw" ? "Hotel" : "Hotel"}</span>
                    <span className="font-medium text-[#1A1A1A]">{booking.hotel_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1A1A]/60">{lang === "sw" ? "Chumba" : "Room"}</span>
                    <span className="font-medium text-[#1A1A1A]">{booking.room_type_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1A1A]/60">{t("checkin")}</span>
                    <span className="font-medium text-[#1A1A1A]">
                      {new Date(booking.checkin_date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1A1A]/60">{t("checkout")}</span>
                    <span className="font-medium text-[#1A1A1A]">
                      {new Date(booking.checkout_date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[#1A1A1A]/10">
                    <span className="font-semibold text-[#1A1A1A]">{t("total")}</span>
                    <span className="font-bold text-[#E07B2A]">{formatTZS(booking.total_amount_tzs)}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-[#E07B2A] text-white py-4 rounded-lg font-semibold hover:bg-[#C96A1F] transition-all"
                  data-testid="go-home-btn"
                >
                  {t("goHome")}
                </button>
              </div>
            )}

            {/* Step 5: Expired */}
            {step === 5 && (
              <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h2 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A] mb-4">
                  {t("bookingExpired")}
                </h2>
                <p className="text-[#1A1A1A]/60 mb-8">
                  {lang === "sw" 
                    ? "Muda wa kulipa umeisha. Tafadhali jaribu tena."
                    : "Payment time has expired. Please try again."
                  }
                </p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate(`/hotel/${hotelId}`)}
                    className="flex-1 py-4 border border-[#1A1A1A]/20 rounded-lg font-semibold hover:bg-[#FAFAF7] transition-all"
                  >
                    {lang === "sw" ? "Rudi Hotel" : "Back to Hotel"}
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      setBooking(null);
                    }}
                    className="flex-1 bg-[#E07B2A] text-white py-4 rounded-lg font-semibold hover:bg-[#C96A1F] transition-all"
                    data-testid="try-again-btn"
                  >
                    {t("tryAgain")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {hotel && room && (
              <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6 sticky top-24">
                <img
                  src={hotel.cover_photo || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"}
                  alt={hotel.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-['Outfit'] text-lg font-semibold text-[#1A1A1A]">{hotel.name}</h3>
                <p className="text-[#1A1A1A]/60 text-sm mb-4">{hotel.city}</p>
                
                <div className="border-t border-[#1A1A1A]/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1A1A1A]/60">{lang === "sw" ? "Chumba" : "Room"}</span>
                    <span className="font-medium text-[#1A1A1A]">{room.name}</span>
                  </div>
                  {nights > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#1A1A1A]/60">{t("nights")}</span>
                        <span className="font-medium text-[#1A1A1A]">{nights}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#1A1A1A]/60">{lang === "sw" ? "Bei" : "Rate"}</span>
                        <span className="font-medium text-[#1A1A1A]">{formatTZS(room.price_per_night)}/{lang === "sw" ? "usiku" : "night"}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-[#1A1A1A]/10">
                        <span className="font-semibold text-[#1A1A1A]">{t("total")}</span>
                        <span className="font-bold text-[#E07B2A]">{formatTZS(totalAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
