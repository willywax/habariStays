import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getPhotoUrl, getCoverUrl } from "./components/PhotoManager";
import "@/App.css";

// Context
const AuthContext = createContext(null);
const LanguageContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export const useLang = () => useContext(LanguageContext);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API helper
const api = axios.create({ baseURL: API, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

// Translations
const translations = {
  sw: {
    home: "Nyumbani",
    explore: "Tafuta",
    about: "Kuhusu",
    listHotel: "Sajili Hotel Yako",
    login: "Ingia",
    register: "Jisajili",
    logout: "Toka",
    searchHotels: "Tafuta Hoteli",
    city: "Mji",
    checkin: "Check-in",
    checkout: "Check-out",
    guests: "Wageni",
    search: "Tafuta",
    popularCities: "Miji Maarufu",
    featuredHotels: "Hoteli Bora",
    whyUs: "Kwa Nini Habari Stays?",
    mpesaPayment: "Lipa kwa M-Pesa",
    instantConfirm: "Uthibitishaji wa Papo Hapo",
    realPrices: "Bei Halisi za TZS",
    perNight: "kwa usiku",
    roomsAvailable: "Vyumba vinapatikana",
    viewMore: "Angalia Zaidi",
    bookNow: "Hifadhi Sasa",
    guestDetails: "Taarifa za Mgeni",
    fullName: "Jina Kamili",
    phone: "Simu",
    confirmPhone: "Thibitisha Simu",
    continue: "Endelea",
    bookingSummary: "Muhtasari wa Booking",
    nights: "Usiku",
    total: "Jumla",
    payWithMpesa: "Lipa na M-Pesa",
    payment: "Malipo",
    paymentInstructions: "Maelekezo ya M-Pesa",
    openMpesa: "Fungua M-Pesa",
    selectPayBill: "Chagua Lipa Bili",
    enterNumber: "Ingiza namba",
    amount: "Kiasi",
    enterPin: "PIN yako",
    completedPayment: "Nimemaliza Kulipa",
    cancelBooking: "Ghairi Booking",
    bookingConfirmed: "Booking Yako Imethibitishwa!",
    bookingExpired: "Booking imeisha muda",
    tryAgain: "Jaribu Tena",
    goHome: "Rudi Nyumbani",
    dashboard: "Dashibodi",
    bookings: "Bukini",
    myHotels: "Hoteli Zangu",
    roomTypes: "Aina za Vyumba",
    staff: "Wasimamizi",
    revenue: "Mapato",
    settings: "Mipangilio",
    reviews: "Maoni",
    amenities: "Huduma",
    photos: "Picha",
    description: "Maelezo",
    address: "Anwani",
    whatsapp: "WhatsApp",
    call: "Piga Simu",
    noRoomsAvailable: "Hakuna vyumba",
    filterByPrice: "Chuja kwa Bei",
    filterByAmenities: "Chuja kwa Huduma",
    sortBy: "Panga kwa",
    priceLowHigh: "Bei (Chini-Juu)",
    priceHighLow: "Bei (Juu-Chini)",
    rating: "Upimaji",
    hotelsFound: "hoteli zimepatikana",
    pendingVerification: "Akaunti yako inasubiri uthibitishaji",
    pendingMessage: "Utapigiwa simu ndani ya masaa 24",
    timeRemaining: "Muda uliobaki",
    password: "Neno la Siri",
    email: "Barua pepe",
    forgotPassword: "Umesahau neno la siri?",
    registerHotel: "Sajili hotel yako",
    orContinueWith: "au endelea na",
    google: "Google",
    tagline: "Karibu. Lala Vizuri.",
    // Dashboard shared
    save: "Hifadhi", cancel: "Ghairi", confirm: "Thibitisha", delete: "Futa",
    edit: "Hariri", add: "Ongeza", back: "Rudi", close: "Funga", status: "Hali",
    active: "Hai", inactive: "Imezimwa", name: "Jina", actions: "Vitendo",
    // Cashier dashboard
    todayCheckins: "Check-ins Leo", walkIn: "Walk-in Booking", activeGuests: "Wageni Waliopo",
    shiftSummary: "Muhtasari wa Shift", verifyBooking: "Thibitisha Booking",
    confirmArrival: "Thibitisha Kuwasili", confirmDeparture: "Thibitisha Kuondoka",
    awaiting: "Inasubiri", arrived: "Amewasili", departed: "Ameondoka",
    guestName: "Jina la Mgeni", guestPhone: "Simu ya Mgeni", roomType: "Aina ya Chumba",
    amountPaid: "Kiasi Kilicholipwa", selectRoom: "Chagua Chumba",
    guestInfo: "Taarifa za Mgeni", confirmRecord: "Thibitisha na Rekodi",
    paymentMethod: "Njia ya Malipo", cash: "Cash", card: "Kadi", notes: "Maelezo",
    printReceipt: "Chapisha Risiti", newWalkin: "Walk-in Nyingine",
    printSummary: "Chapisha Muhtasari", noCheckins: "Hakuna check-ins za leo kwa sasa.",
    noGuests: "Hakuna wageni waliopo sasa hivi.", noRooms: "Hakuna vyumba vinavyopatikana sasa hivi.",
    walkinRecorded: "Walk-in Imerekodishwa", checkinConfirmed: "Check-in Imethibitishwa",
    checkoutProcessed: "Checkout Imefanywa", totalRevenue: "Jumla ya Mapato Leo",
    walkinsToday: "Walk-ins Leo", onlineCheckins: "Check-ins Confirmed", checkouts: "Checkouts",
    cashCollected: "Cash", mpesaCollected: "M-Pesa", cardCollected: "Card",
    todayActivity: "Shughuli za Leo", noActivity: "Hakuna shughuli bado.",
    bookingNotFound: "Booking haikupatikana.", searchBooking: "Tafuta booking...",
    nightsLeft: "Usiku Zilizobaki", bookingType: "Aina ya Booking", ref: "Ref#",
    all: "Zote", unpaid: "Haijalipiwa", paid: "Imelipwa",
    // Admin dashboard
    allHotels: "Hoteli Zote", importHotels: "Ingiza Hoteli", cashiers: "Weka Hazina",
    owners: "Wamiliki", ownerApproval: "Thibitisha Wamiliki",
    addCashier: "Ongeza Mweka Hazina", resetPassword: "Weka Upya Neno la Siri",
    deactivate: "Zima", reactivate: "Washa", performance: "Utendaji",
    newPasswordLabel: "Neno la Siri Jipya", copyPassword: "Nakili",
    smsSent: "SMS imetumwa", hotelAssignment: "Hotel",
    // Owner dashboard
    myHotelsLabel: "Hoteli Zangu", editHotel: "Hariri Hotel",
    roomCount: "Aina za Vyumba", updateNeeded: "Sasisha",
  },
  en: {
    home: "Home",
    explore: "Explore",
    about: "About",
    listHotel: "List Your Hotel",
    login: "Login",
    register: "Register",
    logout: "Logout",
    searchHotels: "Search Hotels",
    city: "City",
    checkin: "Check-in",
    checkout: "Check-out",
    guests: "Guests",
    search: "Search",
    popularCities: "Popular Cities",
    featuredHotels: "Featured Hotels",
    whyUs: "Why Habari Stays?",
    mpesaPayment: "Pay with M-Pesa",
    instantConfirm: "Instant Confirmation",
    realPrices: "Real TZS Prices",
    perNight: "per night",
    roomsAvailable: "rooms available",
    viewMore: "View More",
    bookNow: "Book Now",
    guestDetails: "Guest Details",
    fullName: "Full Name",
    phone: "Phone",
    confirmPhone: "Confirm Phone",
    continue: "Continue",
    bookingSummary: "Booking Summary",
    nights: "Nights",
    total: "Total",
    payWithMpesa: "Pay with M-Pesa",
    payment: "Payment",
    paymentInstructions: "M-Pesa Instructions",
    openMpesa: "Open M-Pesa",
    selectPayBill: "Select Pay Bill",
    enterNumber: "Enter number",
    amount: "Amount",
    enterPin: "Your PIN",
    completedPayment: "I've Completed Payment",
    cancelBooking: "Cancel Booking",
    bookingConfirmed: "Your Booking is Confirmed!",
    bookingExpired: "Booking expired",
    tryAgain: "Try Again",
    goHome: "Go Home",
    dashboard: "Dashboard",
    bookings: "Bookings",
    myHotels: "My Hotels",
    roomTypes: "Room Types",
    staff: "Staff",
    revenue: "Revenue",
    settings: "Settings",
    reviews: "Reviews",
    amenities: "Amenities",
    photos: "Photos",
    description: "Description",
    address: "Address",
    whatsapp: "WhatsApp",
    call: "Call",
    noRoomsAvailable: "No rooms available",
    filterByPrice: "Filter by Price",
    filterByAmenities: "Filter by Amenities",
    sortBy: "Sort by",
    priceLowHigh: "Price (Low-High)",
    priceHighLow: "Price (High-Low)",
    rating: "Rating",
    hotelsFound: "hotels found",
    pendingVerification: "Your account is pending verification",
    pendingMessage: "You will receive a call within 24 hours",
    timeRemaining: "Time remaining",
    password: "Password",
    email: "Email",
    forgotPassword: "Forgot password?",
    registerHotel: "Register your hotel",
    orContinueWith: "or continue with",
    google: "Google",
    tagline: "Welcome. Sleep Well.",
    // Dashboard shared
    save: "Save", cancel: "Cancel", confirm: "Confirm", delete: "Delete",
    edit: "Edit", add: "Add", back: "Back", close: "Close", status: "Status",
    active: "Active", inactive: "Inactive", name: "Name", actions: "Actions",
    // Cashier dashboard
    todayCheckins: "Today's Check-ins", walkIn: "Walk-in Booking", activeGuests: "Active Guests",
    shiftSummary: "Shift Summary", verifyBooking: "Verify Booking",
    confirmArrival: "Confirm Arrival", confirmDeparture: "Confirm Departure",
    awaiting: "Awaiting", arrived: "Checked In", departed: "Checked Out",
    guestName: "Guest Name", guestPhone: "Guest Phone", roomType: "Room Type",
    amountPaid: "Amount Paid", selectRoom: "Select Room",
    guestInfo: "Guest Details", confirmRecord: "Confirm & Record",
    paymentMethod: "Payment Method", cash: "Cash", card: "Card", notes: "Notes",
    printReceipt: "Print Receipt", newWalkin: "New Walk-in",
    printSummary: "Print Summary", noCheckins: "No check-ins for today.",
    noGuests: "No active guests right now.", noRooms: "No rooms available right now.",
    walkinRecorded: "Walk-in Recorded", checkinConfirmed: "Check-in Confirmed",
    checkoutProcessed: "Checkout Processed", totalRevenue: "Total Revenue Today",
    walkinsToday: "Walk-ins Today", onlineCheckins: "Online Check-ins", checkouts: "Checkouts",
    cashCollected: "Cash", mpesaCollected: "M-Pesa", cardCollected: "Card",
    todayActivity: "Today's Activity", noActivity: "No activity yet.",
    bookingNotFound: "Booking not found.", searchBooking: "Search booking...",
    nightsLeft: "Nights Left", bookingType: "Booking Type", ref: "Ref#",
    all: "All", unpaid: "Unpaid", paid: "Paid",
    // Admin dashboard
    allHotels: "All Hotels", importHotels: "Import Hotels", cashiers: "Cashiers",
    owners: "Owners", ownerApproval: "Approve Owners",
    addCashier: "Add Cashier", resetPassword: "Reset Password",
    deactivate: "Deactivate", reactivate: "Reactivate", performance: "Performance",
    newPasswordLabel: "New Password", copyPassword: "Copy",
    smsSent: "SMS sent", hotelAssignment: "Hotel",
    // Owner dashboard
    myHotelsLabel: "My Hotels", editHotel: "Edit Hotel",
    roomCount: "Room Types", updateNeeded: "Update Needed",
  }
};

// Language Provider
const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  
  const t = useCallback((key) => translations[lang][key] || key, [lang]);
  
  const toggleLang = () => {
    const newLang = lang === "sw" ? "en" : "sw";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };
  
  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Language Toggle Pill Component
const LanguageToggle = () => {
  const { lang, toggleLang } = useLang();
  return (
    <div className="flex bg-[#F4F4F5] rounded-full p-0.5 cursor-pointer" onClick={toggleLang} data-testid="language-toggle">
      <span className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${lang === "sw" ? "bg-[#0F4C5C] text-white" : "text-[#52525B]"}`}>SW</span>
      <span className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${lang === "en" ? "bg-[#0F4C5C] text-white" : "text-[#52525B]"}`}>EN</span>
    </div>
  );
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
      return;
    }

    // Try to get user from session
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch {
      // Not authenticated
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const response = await api.post("/auth/register", data);
    const { access_token, user: userData } = response.data;
    if (access_token) {
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
    return userData;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const loginWithGoogle = async (accessToken) => {
    const response = await api.post("/auth/google", { access_token: accessToken });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const setUserData = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loginWithGoogle, loading, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Loading Spinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E07B2A] border-t-transparent"></div>
  </div>
);

// Format TZS
const formatTZS = (amount) => `TZS ${amount?.toLocaleString() || 0}`;

// ================== NAVBAR ==================
const Navbar = ({ transparent = false }) => {
  const { user, logout } = useAuth();
  const { lang, t, toggleLang } = useLang();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const navBg = transparent && !scrolled ? "bg-transparent" : "bg-white/95 backdrop-blur-md shadow-sm";
  const textColor = transparent && !scrolled ? "text-white" : "text-[#1A1A1A]";
  
  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };
  
  const closeMobile = () => setMobileMenuOpen(false);
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#E07B2A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <div className="hidden sm:block">
              <span className={`font-['Outfit'] font-bold text-xl ${textColor}`}>HABARI STAYS</span>
            </div>
          </Link>
          
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`${textColor} hover:text-[#E07B2A] transition-colors font-medium`}>
              {t("home")}
            </Link>
            <Link to="/search" className={`${textColor} hover:text-[#E07B2A] transition-colors font-medium`}>
              {t("explore")}
            </Link>
          </div>
          
          {/* Desktop right section */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className={`px-3 py-1 rounded-full border ${transparent && !scrolled ? "border-white/50 text-white" : "border-[#1A1A1A]/20 text-[#1A1A1A]"} text-sm font-medium hover:bg-[#E07B2A] hover:text-white hover:border-[#E07B2A] transition-all`}
              data-testid="lang-toggle"
            >
              {lang === "sw" ? "EN" : "SW"}
            </button>
            
            {user ? (
              <>
                <Link 
                  to={user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner" : user.role === "cashier" ? "/cashier" : "/"}
                  className={`${textColor} hover:text-[#E07B2A] transition-colors font-medium`}
                  data-testid="dashboard-link"
                >
                  {t("dashboard")}
                </Link>
                <button
                  onClick={handleLogout}
                  className={`${textColor} hover:text-[#E07B2A] transition-colors font-medium`}
                  data-testid="logout-btn"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${textColor} hover:text-[#E07B2A] transition-colors font-medium`} data-testid="login-link">
                  {t("login")}
                </Link>
                <Link to="/register" className={`${textColor} hover:text-[#E07B2A] transition-colors font-medium`} data-testid="register-link">
                  {t("register")}
                </Link>
                <Link 
                  to="/register-hotel" 
                  className="bg-[#E07B2A] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#C96A1F] transition-all"
                  data-testid="list-hotel-btn"
                >
                  {t("listHotel")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile: language toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLang}
              className={`px-2.5 py-1 rounded-full border ${transparent && !scrolled ? "border-white/50 text-white" : "border-[#1A1A1A]/20 text-[#1A1A1A]"} text-xs font-medium`}
              data-testid="lang-toggle-mobile"
            >
              {lang === "sw" ? "EN" : "SW"}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${transparent && !scrolled ? "text-white" : "text-[#1A1A1A]"}`}
              aria-label="Toggle menu"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#1A1A1A]/10 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <Link to="/" onClick={closeMobile} className="block px-4 py-3 text-[#1A1A1A] hover:bg-[#F4F4F5] rounded-lg font-medium">{t("home")}</Link>
            <Link to="/search" onClick={closeMobile} className="block px-4 py-3 text-[#1A1A1A] hover:bg-[#F4F4F5] rounded-lg font-medium">{t("explore")}</Link>
            <hr className="border-[#1A1A1A]/10 my-2" />
            {user ? (
              <>
                <Link 
                  to={user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner" : user.role === "cashier" ? "/cashier" : "/"}
                  onClick={closeMobile}
                  className="block px-4 py-3 text-[#1A1A1A] hover:bg-[#F4F4F5] rounded-lg font-medium"
                >
                  {t("dashboard")}
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-[#1A1A1A] hover:bg-[#F4F4F5] rounded-lg font-medium">
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobile} className="block px-4 py-3 text-[#1A1A1A] hover:bg-[#F4F4F5] rounded-lg font-medium">{t("login")}</Link>
                <Link to="/register" onClick={closeMobile} className="block px-4 py-3 text-[#1A1A1A] hover:bg-[#F4F4F5] rounded-lg font-medium">{t("register")}</Link>
                <Link to="/register-hotel" onClick={closeMobile} className="block px-4 py-3 bg-[#E07B2A] text-white rounded-lg font-medium text-center">{t("listHotel")}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// ================== FOOTER ==================
const Footer = () => {
  const { t } = useLang();
  return (
    <footer className="bg-[#1B4332] text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#E07B2A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">HS</span>
              </div>
              <span className="font-['Outfit'] font-bold text-xl">HABARI STAYS</span>
            </div>
            <p className="text-white/70 text-sm">{t("tagline")}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link to="/" className="hover:text-[#E07B2A]">{t("home")}</Link></li>
              <li><Link to="/search" className="hover:text-[#E07B2A]">{t("explore")}</Link></li>
              <li><Link to="/register-hotel" className="hover:text-[#E07B2A]">{t("listHotel")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Cities</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><Link to="/search?city=Dodoma" className="hover:text-[#E07B2A]">Dodoma</Link></li>
              <li><Link to="/search?city=Dar es Salaam" className="hover:text-[#E07B2A]">Dar es Salaam</Link></li>
              <li><Link to="/search?city=Arusha" className="hover:text-[#E07B2A]">Arusha</Link></li>
              <li><Link to="/search?city=Zanzibar" className="hover:text-[#E07B2A]">Zanzibar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-white/70 text-sm">habaristays.com</p>
            <p className="text-white/70 text-sm">info@habaristays.com</p>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/50 text-sm">
          © 2024 Habari Stays. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

// ================== LANDING PAGE ==================
const LandingPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [searchData, setSearchData] = useState({
    city: "",
    checkin: "",
    checkout: "",
    guests: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hotelsRes, citiesRes] = await Promise.all([
        api.get("/hotels?verified_only=true"),
        api.get("/hotels/cities")
      ]);
      setHotels(hotelsRes.data.slice(0, 6));
      setCities(citiesRes.data.slice(0, 6));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchData.city) params.set("city", searchData.city);
    if (searchData.checkin) params.set("checkin", searchData.checkin);
    if (searchData.checkout) params.set("checkout", searchData.checkout);
    if (searchData.guests) params.set("guests", searchData.guests);
    navigate(`/search?${params.toString()}`);
  };

  const defaultCities = [
    { city: "Dodoma", hotel_count: 0 },
    { city: "Dar es Salaam", hotel_count: 0 },
    { city: "Arusha", hotel_count: 0 },
    { city: "Mwanza", hotel_count: 0 },
    { city: "Mbeya", hotel_count: 0 }
  ];

  const cityImages = {
    "Dodoma": "https://images.unsplash.com/photo-1635398939735-3c3522b457e8?w=400&h=300&fit=crop",
    "Dar es Salaam": "https://images.unsplash.com/photo-1654941348480-217757d5f933?w=400&h=300&fit=crop",
    "Arusha": "https://images.unsplash.com/photo-1673667618122-359046273a77?w=400&h=300&fit=crop",
    "Mwanza": "https://images.unsplash.com/photo-1736091852588-668e092d1e9f?w=400&h=300&fit=crop",
    "Mbeya": "https://images.unsplash.com/photo-1500549158481-49dcc08a37ab?w=400&h=300&fit=crop",
    "Musoma": "https://images.unsplash.com/photo-1736091852588-668e092d1e9f?w=400&h=300&fit=crop",
    "Shinyanga": "https://images.unsplash.com/photo-1500549158481-49dcc08a37ab?w=400&h=300&fit=crop",
    "Kambarage Area": "https://images.unsplash.com/photo-1500549158481-49dcc08a37ab?w=400&h=300&fit=crop",
  };

  const displayCities = (cities.length > 0 ? cities : defaultCities).filter(c => c.city !== "Zanzibar");

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <title>Book Hotels in Tanzania | Habari Stays</title>
      <meta name="description" content="Find and book the best hotels across Tanzania. Compare prices, read reviews and book instantly. Hotels in Dar es Salaam, Arusha, Zanzibar, Moshi and more." />
      <link rel="canonical" href="https://habaristays.com/" />
      <meta property="og:title" content="Book Hotels in Tanzania | Habari Stays" />
      <meta property="og:description" content="Find and book the best hotels across Tanzania. Compare prices, read reviews and book instantly." />
      <meta property="og:url" content="https://habaristays.com/" />
      <Navbar transparent />

      {/* Hero */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1920')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/60 to-[#1B4332]/80" />
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="font-['Outfit'] text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight">
            HABARI STAYS
          </h1>
          <p className="text-2xl md:text-3xl text-[#F4A723] mb-2 font-light italic">
            {t("tagline")}
          </p>
          <p className="text-lg text-white/80 mb-12">
            {lang === "sw" ? "Hoteli bora Tanzania - Dodoma, Dar, Arusha, Zanzibar" : "Best hotels in Tanzania - Dodoma, Dar, Arusha, Zanzibar"}
          </p>
          
          {/* Search Form */}
          <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-[#1A1A1A]/60 mb-1 text-left">{t("city")}</label>
                <select
                  value={searchData.city}
                  onChange={(e) => setSearchData({ ...searchData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#FAFAF7] border border-[#1A1A1A]/10 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                  data-testid="search-city"
                >
                  <option value="">{lang === "sw" ? "Chagua Mji" : "Select City"}</option>
                  {displayCities.map(c => (
                    <option key={c.city} value={c.city}>{c.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#1A1A1A]/60 mb-1 text-left">{t("checkin")}</label>
                <input
                  type="date"
                  value={searchData.checkin}
                  onChange={(e) => setSearchData({ ...searchData, checkin: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-lg bg-[#FAFAF7] border border-[#1A1A1A]/10 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                  data-testid="search-checkin"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1A1A1A]/60 mb-1 text-left">{t("checkout")}</label>
                <input
                  type="date"
                  value={searchData.checkout}
                  onChange={(e) => setSearchData({ ...searchData, checkout: e.target.value })}
                  min={searchData.checkin || new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-lg bg-[#FAFAF7] border border-[#1A1A1A]/10 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                  data-testid="search-checkout"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1A1A1A]/60 mb-1 text-left">&nbsp;</label>
                <button 
                  onClick={handleSearch}
                  className="w-full bg-[#E07B2A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#C96A1F] transition-all"
                  data-testid="search-btn"
                >
                  {lang === "sw" ? "Tafuta Hoteli" : "Search Hotels"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A] mb-10 text-center">
            {t("popularCities")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayCities.map((city) => (
              <Link
                key={city.city}
                to={`/search?city=${encodeURIComponent(city.city)}`}
                className="group relative h-44 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                data-testid={`city-${city.city}`}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={cityImages[city.city] || "https://images.unsplash.com/photo-1500549158481-49dcc08a37ab?w=400&h=300&fit=crop"}
                    alt={city.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg, #E07B2A, #1B4332)'; }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                  <h3 className="font-['Outfit'] font-bold text-white text-lg">{city.city}</h3>
                  <span className="px-2.5 py-1 bg-[#E07B2A] text-white text-xs font-bold rounded-full whitespace-nowrap">
                    {city.hotel_count >= 50 ? "50+" : city.hotel_count >= 20 ? "20+" : city.hotel_count >= 10 ? "10+" : city.hotel_count} {lang === "sw" ? "Hoteli" : "Hotels"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      {hotels.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A] mb-10 text-center">
              {t("featuredHotels")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Habari Stays */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A] mb-16 text-center">
            {t("whyUs")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#E07B2A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#E07B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-['Outfit'] text-xl font-semibold text-[#1A1A1A] mb-3">{t("mpesaPayment")}</h3>
              <p className="text-[#1A1A1A]/60">{lang === "sw" ? "Malipo rahisi na salama kupitia M-Pesa" : "Easy and secure payment via M-Pesa"}</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#1B4332]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#1B4332]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-['Outfit'] text-xl font-semibold text-[#1A1A1A] mb-3">{t("instantConfirm")}</h3>
              <p className="text-[#1A1A1A]/60">{lang === "sw" ? "Booking yako inathibitishwa mara moja" : "Your booking is confirmed instantly"}</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#F4A723]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#F4A723]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-['Outfit'] text-xl font-semibold text-[#1A1A1A] mb-3">{t("realPrices")}</h3>
              <p className="text-[#1A1A1A]/60">{lang === "sw" ? "Bei wazi bila gharama za ziada" : "Transparent pricing with no hidden fees"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#E07B2A]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-['Outfit'] text-4xl font-bold text-white mb-6">
            {lang === "sw" ? "Una Hotel? Jiunge Nasi!" : "Own a Hotel? Join Us!"}
          </h2>
          <p className="text-white/80 text-xl mb-10">
            {lang === "sw" ? "Ongeza hotel yako kwenye Habari Stays na upate wateja zaidi" : "Add your hotel to Habari Stays and get more customers"}
          </p>
          <Link 
            to="/register-hotel" 
            className="inline-block bg-white text-[#E07B2A] px-10 py-4 rounded-xl font-semibold hover:bg-[#FAFAF7] transition-all text-lg"
            data-testid="cta-register"
          >
            {t("listHotel")}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// ================== HOTEL CARD ==================
const HotelCard = ({ hotel, onSaveScroll }) => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const isImported = hotel.status === "imported";
  const isVerified = hotel.status === "verified" || hotel.status === "owner_attached";

  const handleClick = () => {
    if (onSaveScroll) onSaveScroll();
    navigate(`/hotel/${hotel.id}`);
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-[#1A1A1A]/5 cursor-pointer"
      onClick={handleClick}
      data-testid={`hotel-card-${hotel.id}`}
    >
      <div className="h-56 overflow-hidden relative">
        <img
          src={getCoverUrl(hotel.photos, "thumb") || hotel.cover_photo || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {isVerified && (
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#1B4332] text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg" data-testid={`verified-badge-${hotel.id}`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-2.108-2.108 3 3 0 01-5.304 0 3 3 0 00-2.108 2.108 3 3 0 010 5.304 3 3 0 002.108 2.108 3 3 0 015.304 0 3 3 0 002.108-2.108zM11 12.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586z" clipRule="evenodd"/></svg>
            {lang === "sw" ? "Imethibitishwa" : "Verified"}
          </div>
        )}
        {!isVerified && !isImported && (
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#71717A] text-white px-2.5 py-1 rounded-full text-xs font-medium">
            {lang === "sw" ? "Bado Haijathibitishwa" : "Not Verified"}
          </div>
        )}
        {isImported && (
          <div className="absolute top-4 left-4 bg-[#F4A723] text-white px-3 py-1 rounded-full text-sm font-medium">
            {lang === "sw" ? "Wasiliana Moja kwa Moja" : "Contact Directly"}
          </div>
        )}
        {!isImported && hotel.available_rooms > 0 && (
          <div className="absolute top-4 right-4 bg-[#1B4332] text-white px-3 py-1 rounded-full text-sm font-medium">
            {hotel.available_rooms} {t("roomsAvailable")}
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-[#E07B2A]/10 text-[#E07B2A] text-xs font-medium rounded">
            {hotel.city}
          </span>
          {(hotel.average_rating > 0 || hotel.google_rating > 0) && (
            <span className="flex items-center gap-1 text-[#F4A723] text-sm">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
              {(hotel.average_rating || hotel.google_rating || 0).toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="font-['Outfit'] text-xl font-semibold text-[#1A1A1A] mb-2">
          {hotel.name}
        </h3>
        <p className="text-[#1A1A1A]/60 text-sm line-clamp-2 mb-4">
          {hotel.description}
        </p>
        <div className="flex items-center justify-between">
          {isImported ? (
            <div className="flex gap-2">
              {hotel.phone_number && (
                <a href={`tel:${hotel.phone_number}`} onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#143D28]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {lang === "sw" ? "Piga Simu" : "Call"}
                </a>
              )}
              {hotel.whatsapp_number && (
                <a href={`https://wa.me/${(hotel.whatsapp_number || "").replace(/\+/g, '')}?text=Habari%2C%20nimeona%20hoteli%20yenu%20kwenye%20Habari%20Stays.%20Nataka%20kujua%20upatikanaji%20wa%20chumba.`} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#20BD5A]">
                  WhatsApp
                </a>
              )}
            </div>
          ) : (
            <>
              <div>
                {hotel.min_price ? (
                  <>
                    <span className="text-[#1A1A1A]/40 text-xs">{lang === "sw" ? "Kuanzia" : "From"}</span>
                    <p className="font-['Outfit'] text-xl font-bold text-[#E07B2A]">{formatTZS(hotel.min_price)}</p>
                    <span className="text-[#1A1A1A]/40 text-xs">/{t("perNight")}</span>
                  </>
                ) : (
                  <span className="text-[#1A1A1A]/40 text-xs italic">{lang === "sw" ? "Bei itaongezwa hivi karibuni" : "Price coming soon"}</span>
                )}
              </div>
              <button className="bg-[#1B4332] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#143D28] transition-all">
                {t("viewMore")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ================== SEARCH PAGE ==================
const SearchPage = () => {
  const { t, lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("hs_search_state");
    if (saved && !searchParams.get("city") && !searchParams.get("checkin")) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      city: searchParams.get("city") || "",
      minPrice: "", maxPrice: "", amenities: "", sortBy: "rating",
      checkin: searchParams.get("checkin") || "",
      checkout: searchParams.get("checkout") || "",
      guests: searchParams.get("guests") || ""
    };
  });

  useEffect(() => { api.get("/hotels/cities").then(r => setCities(r.data.filter(c => c.city !== "Zanzibar"))).catch(() => {}); }, []);

  // Initial fetch on mount only
  useEffect(() => { fetchHotels(); }, []);

  // Sync URL + session state on every filter change (no fetch)
  useEffect(() => {
    sessionStorage.setItem("hs_search_state", JSON.stringify(filters));
    const params = {};
    if (filters.city) params.city = filters.city;
    if (filters.checkin) params.checkin = filters.checkin;
    if (filters.checkout) params.checkout = filters.checkout;
    if (filters.guests) params.guests = filters.guests;
    setSearchParams(params, { replace: true });
  }, [filters]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("hs_scroll_pos");
    if (savedScroll && !loading) {
      setTimeout(() => { window.scrollTo(0, parseInt(savedScroll)); sessionStorage.removeItem("hs_scroll_pos"); }, 100);
    }
  }, [loading]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      let url = "/hotels?verified_only=true";
      if (filters.city) url += `&city=${encodeURIComponent(filters.city)}`;
      if (filters.minPrice) url += `&min_price=${filters.minPrice}`;
      if (filters.maxPrice) url += `&max_price=${filters.maxPrice}`;
      if (filters.sortBy) url += `&sort_by=${filters.sortBy}`;
      if (filters.checkin) url += `&checkin=${encodeURIComponent(filters.checkin)}`;
      if (filters.checkout) url += `&checkout=${encodeURIComponent(filters.checkout)}`;
      const res = await api.get(url);
      setHotels(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const saveScrollPos = () => { sessionStorage.setItem("hs_scroll_pos", window.scrollY.toString()); };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <title>{filters.city ? `Hotels in ${filters.city}, Tanzania | Habari Stays` : "Hotels in Tanzania | Habari Stays"}</title>
      <meta name="description" content={filters.city ? `Find and book hotels in ${filters.city}, Tanzania. ${hotels.length} hotels available. Best prices guaranteed on Habari Stays.` : `Browse ${hotels.length} hotels across Tanzania. Compare prices, read reviews and book instantly.`} />
      <link rel="canonical" href={`https://habaristays.com/search${filters.city ? `?city=${encodeURIComponent(filters.city)}` : ''}`} />
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A]">
              {filters.city ? `${lang === "sw" ? "Hoteli katika" : "Hotels in"} ${filters.city}` : t("searchHotels")}
            </h1>
            <p className="text-[#1A1A1A]/60">{hotels.length} {t("hotelsFound")}</p>
            {filters.checkin && filters.checkout && (
              <p className="mt-3 inline-block text-sm font-medium text-[#1B4332] bg-[#1B4332]/10 border border-[#1B4332]/20 rounded-lg px-4 py-2" data-testid="search-dates-banner">
                {lang === "sw"
                  ? `Inaonyesha hoteli kwa ${filters.checkin} → ${filters.checkout}`
                  : `Showing hotels for ${filters.checkin} → ${filters.checkout}`}
              </p>
            )}
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6 sticky top-24">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">{lang === "sw" ? "Chuja" : "Filters"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#1A1A1A]/60 mb-2">{t("city")}</label>
                    <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#1A1A1A]/10 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]" data-testid="filter-city">
                      <option value="">{lang === "sw" ? "Miji Yote" : "All Cities"}</option>
                      {cities.map(c => <option key={c.city} value={c.city}>{c.city} ({c.hotel_count})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#1A1A1A]/60 mb-2">{t("filterByPrice")}</label>
                    <div className="space-y-2">
                      <select
                        value={filters.minPrice}
                        onChange={(e) => {
                          const newMin = e.target.value;
                          setFilters({
                            ...filters,
                            minPrice: newMin,
                            maxPrice: newMin === "100001" ? "" : (filters.maxPrice && Number(filters.maxPrice) <= Number(newMin) ? "" : filters.maxPrice)
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#1A1A1A]/10 focus:outline-none focus:ring-2 focus:ring-[#E07B2A] text-sm"
                      >
                        <option value="">{lang === "sw" ? "Bei yoyote (chini)" : "Any min price"}</option>
                        {[20000,30000,40000,50000,60000,70000,80000,90000,100000].map(p => (
                          <option key={p} value={p}>TZS {p.toLocaleString()}</option>
                        ))}
                        <option value="100001">{lang === "sw" ? "Zaidi ya 100,000" : "Over 100,000"}</option>
                      </select>
                      {filters.minPrice !== "100001" && (
                        <select
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#1A1A1A]/10 focus:outline-none focus:ring-2 focus:ring-[#E07B2A] text-sm"
                        >
                          <option value="">{lang === "sw" ? "Bei yoyote (juu)" : "Any max price"}</option>
                          {[20000,30000,40000,50000,60000,70000,80000,90000,100000]
                            .filter(p => !filters.minPrice || p > Number(filters.minPrice))
                            .map(p => (
                              <option key={p} value={p}>TZS {p.toLocaleString()}</option>
                            ))
                          }
                        </select>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#1A1A1A]/60 mb-2">{t("sortBy")}</label>
                    <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#1A1A1A]/10 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]">
                      <option value="rating">{t("rating")}</option>
                      <option value="price_low">{t("priceLowHigh")}</option>
                      <option value="price_high">{t("priceHighLow")}</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchHotels}
                    disabled={loading}
                    className="w-full py-3 bg-[#E07B2A] text-white font-semibold rounded-lg hover:bg-[#C96A1F] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                    data-testid="search-btn"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    )}
                    {lang === "sw" ? "Tafuta" : "Search"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E07B2A] border-t-transparent"></div></div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-20"><p className="text-[#1A1A1A]/60 text-lg">{lang === "sw" ? "Hakuna hoteli zilizopatikana" : "No hotels found"}</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} onSaveScroll={saveScrollPos} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// ================== HOTEL DETAIL PAGE ==================
const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [hotelRes, roomsRes, reviewsRes] = await Promise.all([
        api.get(`/hotels/${id}`),
        api.get(`/room-types?hotel_id=${id}`),
        api.get(`/reviews?hotel_id=${id}`)
      ]);
      setHotel(hotelRes.data);
      setRooms(roomsRes.data);
      setReviews(reviewsRes.data);
    } catch (err) {
      toast.error(lang === "sw" ? "Imeshindikana kupata hotel" : "Failed to load hotel");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center">{lang === "sw" ? "Hotel haipatikani" : "Hotel not found"}</div>;

  const isImported = hotel.status === "imported";
  const isVerified = hotel.status === "verified" || hotel.status === "owner_attached";

  const handleGetDirections = () => {
    const destination = encodeURIComponent(`${hotel.name}, ${hotel.city}, Tanzania`);
    const mapsUrl = hotel.google_maps_url
      ? hotel.google_maps_url
      : `https://www.google.com/maps/search/?api=1&query=${destination}`;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}`,
            "_blank"
          );
        },
        () => {
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
            "_blank"
          );
        }
      );
    } else {
      window.open(mapsUrl, "_blank");
    }
  };

  const coverImage = getCoverUrl(hotel.photos, "web") || hotel.cover_photo || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920";
  const minPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.price_per_night)) : null;
  const metaDescription = `Book ${hotel.name} in ${hotel.city}, Tanzania.${hotel.description ? " " + hotel.description.slice(0, 100) + "." : ""}${minPrice ? ` From TZS ${minPrice.toLocaleString()}/night.` : ""} Best rates on Habari Stays.`;

  const hotelSchema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": hotel.name,
    "description": hotel.description || `Hotel in ${hotel.city}, Tanzania`,
    "url": `https://habaristays.com/hotel/${hotel.id}`,
    "image": coverImage,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": hotel.city,
      "addressRegion": hotel.city,
      "addressCountry": "TZ"
    },
    ...(minPrice && { "priceRange": `From TZS ${minPrice.toLocaleString()}/night` }),
    ...(hotel.rating && { "aggregateRating": { "@type": "AggregateRating", "ratingValue": hotel.rating, "bestRating": "5", "ratingCount": hotel.review_count || 1 } })
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <title>{`${hotel.name} – Hotel in ${hotel.city}, Tanzania | Habari Stays`}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={`https://habaristays.com/hotel/${hotel.id}`} />
      <meta property="og:type" content="place" />
      <meta property="og:title" content={`${hotel.name} | ${hotel.city} Hotel | Habari Stays`} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={coverImage} />
      <meta property="og:url" content={`https://habaristays.com/hotel/${hotel.id}`} />
      <script type="application/ld+json">{JSON.stringify(hotelSchema)}</script>
      <Navbar />

      {/* Hero */}
      <div className="relative h-96 pt-16">
        <img
          src={getCoverUrl(hotel.photos, "web") || hotel.cover_photo || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920"}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {/* Back Arrow */}
        <button onClick={() => navigate(-1)} className="absolute top-20 left-4 md:left-8 flex items-center gap-2 text-white/80 hover:text-white transition-all bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg" data-testid="back-to-search">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-sm font-medium">{lang === "sw" ? "Matokeo ya Utafutaji" : "Search Results"}</span>
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-3 py-1 bg-[#E07B2A] text-white text-sm font-medium rounded-full">{hotel.city}</span>
              {isVerified && (
                <span className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg" data-testid="hotel-verified-badge" title={lang === "sw" ? "Hoteli hii imethibitishwa na Habari Stays" : "This hotel is verified by Habari Stays"}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-2.108-2.108 3 3 0 01-5.304 0 3 3 0 00-2.108 2.108 3 3 0 010 5.304 3 3 0 002.108 2.108 3 3 0 015.304 0 3 3 0 002.108-2.108zM11 12.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586z" clipRule="evenodd"/></svg>
                  {lang === "sw" ? "Imethibitishwa" : "Verified"}
                </span>
              )}
              {isImported && (
                <span className="px-3 py-1 bg-[#F4A723] text-white text-sm font-medium rounded-full">
                  {lang === "sw" ? "Wasiliana Moja kwa Moja" : "Contact Directly"}
                </span>
              )}
              {(hotel.average_rating > 0 || hotel.google_rating > 0) && (
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4 fill-[#F4A723]" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                  {(hotel.average_rating || hotel.google_rating || 0).toFixed(1)} ({hotel.review_count || hotel.google_review_count || 0})
                </span>
              )}
              {hotel.min_price && (
                <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                  {lang === "sw" ? "Kuanzia" : "From"} <span className="font-bold text-[#F4A723]">{formatTZS(hotel.min_price)}</span> /{t("perNight")}
                </span>
              )}
            </div>
            <h1 className="font-['Outfit'] text-4xl md:text-5xl font-bold text-white">{hotel.name}</h1>
          </div>
        </div>
      </div>

      {/* Unverified Warning Banner */}
      {!isVerified && !isImported && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            {lang === "sw" ? "Hoteli hii bado haijathibitishwa na Habari Stays. Unaweza kuwasiliana nao moja kwa moja." : "This hotel is not yet verified by Habari Stays. You can contact them directly."}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
              <h2 className="font-['Outfit'] text-2xl font-semibold text-[#1A1A1A] mb-4">
                {lang === "sw" ? "Kuhusu Hotel" : "About Hotel"}
              </h2>
              <p className="text-[#1A1A1A]/70 leading-relaxed">{hotel.description}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[#1A1A1A]/40 text-sm">{t("address")}</span>
                  <p className="text-[#1A1A1A]">{hotel.address}</p>
                </div>
                <div>
                  <span className="text-[#1A1A1A]/40 text-sm">{t("phone")}</span>
                  <p className="text-[#1A1A1A]">{hotel.phone_number}</p>
                </div>
              </div>

              {/* Contact Buttons — visible to all visitors */}
              <div className="flex gap-3 mt-6">
                {hotel.whatsapp_number && (
                  <a href={`https://wa.me/${hotel.whatsapp_number.replace(/\+/g, '')}?text=Habari%2C%20nimeona%20hoteli%20yenu%20kwenye%20Habari%20Stays.%20Nataka%20kujua%20upatikanaji%20wa%20chumba.`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#20BD5A] transition-all">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t("whatsapp")}
                  </a>
                )}
                <a href={`tel:${hotel.phone_number}`}
                  className="flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#143D28] transition-all" data-testid="hotel-call-btn">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {hotel.phone_number}
                </a>
              </div>

              {/* Hotel Amenities */}
              {hotel.amenities?.length > 0 && (
                <div className="mt-6">
                  <span className="text-[#1A1A1A]/40 text-sm">{lang === "sw" ? "Huduma za Hotel" : "Property Amenities"}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hotel.amenities.map((a, i) => {
                      const icons = {"Breakfast":"\u{1F373}","Parking":"\u{1F697}","WiFi":"\u{1F4F6}","Hot Water":"\u{1F6BF}","Bar":"\u{1F37A}"};
                      return (
                        <span key={i} className="px-3 py-1.5 bg-[#1B4332]/5 text-[#1B4332] text-sm rounded-lg border border-[#1B4332]/10 flex items-center gap-1.5">
                          <span>{icons[a] || ""}</span>{a}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Photo Gallery */}
            {hotel.photos && hotel.photos.length > 0 && hotel.photos.some(p => typeof p === 'object') && (
              <div>
                <h2 className="font-['Outfit'] text-2xl font-semibold text-[#1A1A1A] mb-6">
                  {lang === "sw" ? "Picha" : "Photos"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hotel.photos
                    .filter(p => typeof p === 'object')
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((photo, idx) => (
                    <div key={photo.id || idx} className="relative aspect-[3/2] rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => setActivePhoto(getPhotoUrl(photo, "hd") || getPhotoUrl(photo, "web") || getPhotoUrl(photo, "mobile"))}
                      data-testid={`photo-${photo.id || idx}`}>
                      <img src={getPhotoUrl(photo, "mobile")} alt={`${hotel.name} ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      {photo.is_primary && (
                        <span className="absolute top-2 left-2 bg-[#F4A723] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types */}
            <div>
              <h2 className="font-['Outfit'] text-2xl font-semibold text-[#1A1A1A] mb-6">
                {t("roomTypes")}
              </h2>
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div 
                    key={room.id}
                    className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6"
                    data-testid={`room-${room.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-['Outfit'] text-xl font-semibold text-[#1A1A1A]">{room.name}</h3>
                        <p className="text-[#1A1A1A]/60 mt-1">{room.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {room.amenities?.map((a, i) => {
                            const icons = {"A/C":"\u{2744}\u{FE0F}","Western Toilet":"\u{1F6BD}","Squat Toilet":"\u{1FAA0}","En-suite Bathroom":"\u{1F6C1}","Balcony":"\u{1F305}","TV":"\u{1F4FA}","Safe":"\u{1F512}","Mini Fridge":"\u{1F9CA}","Hot Shower":"\u{1F6BF}"};
                            return (
                              <span key={i} className="px-2 py-0.5 bg-[#E07B2A]/10 text-[#E07B2A] text-xs rounded flex items-center gap-1">
                                <span>{icons[a] || ""}</span>{a}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-sm text-[#1A1A1A]/40 mt-2">
                          {room.available_rooms} {lang === "sw" ? "vinapatikana" : "available"} / {room.total_rooms} {lang === "sw" ? "jumla" : "total"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-['Outfit'] text-2xl font-bold text-[#E07B2A]">
                            {formatTZS(room.price_per_night)}
                          </p>
                          <p className="text-[#1A1A1A]/40 text-sm">/{t("perNight")}</p>
                        </div>
                        {isImported ? (
                          <div className="flex flex-col gap-2">
                            <a href={`tel:${hotel.phone_number}`}
                              className="bg-[#1B4332] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#143D28] transition-all text-center"
                              data-testid={`room-call-link-${room.id}`}>
                              {lang === "sw" ? "Piga Simu" : "Call"}
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/booking/${hotel.id}/${room.id}`)}
                            disabled={room.available_rooms < 1}
                            className="bg-[#E07B2A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#C96A1F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid={`book-room-${room.id}`}
                          >
                            {room.available_rooms < 1 ? t("noRoomsAvailable") : t("bookNow")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="font-['Outfit'] text-2xl font-semibold text-[#1A1A1A] mb-6">
                  {t("reviews")} ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-[#1A1A1A]">{review.guest_name}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? "fill-[#F4A723]" : "fill-[#1A1A1A]/20"}`} 
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-[#1A1A1A]/70">{review.comment}</p>
                      <p className="text-[#1A1A1A]/40 text-sm mt-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Directly CTA for imported hotels */}
            {isImported && (
              <div className="bg-[#F4A723]/10 border border-[#F4A723]/30 rounded-xl p-6 mb-6">
                <h3 className="font-['Outfit'] text-lg font-semibold text-[#1A1A1A] mb-3">
                  {lang === "sw" ? "Wasiliana na Hotel" : "Contact Hotel"}
                </h3>
                <p className="text-[#1A1A1A]/60 text-sm mb-4">
                  {lang === "sw" 
                    ? "Hotel hii bado haijasajiliwa kikamilifu. Wasiliana nao moja kwa moja kuhifadhi chumba." 
                    : "This hotel hasn't fully registered yet. Contact them directly to book."}
                </p>
                <div className="space-y-2">
                  {hotel.phone_number && (
                    <a href={`tel:${hotel.phone_number}`}
                      className="flex items-center gap-2 w-full bg-[#1B4332] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#143D28] transition-all justify-center"
                      data-testid="contact-call-btn">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {hotel.phone_number}
                    </a>
                  )}
                  {hotel.whatsapp_number && (
                    <a href={`https://wa.me/${(hotel.whatsapp_number || "").replace(/\+/g, '')}?text=Habari%2C%20nimeona%20hoteli%20yenu%20kwenye%20Habari%20Stays.%20Nataka%20kujua%20upatikanaji%20wa%20chumba.`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full bg-[#25D366] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#20BD5A] transition-all justify-center"
                      data-testid="contact-whatsapp-btn">
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6 sticky top-24">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">{lang === "sw" ? "Mahali" : "Location"}</h3>
              <div className="bg-[#FAFAF7] rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#E07B2A]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-[#E07B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    {hotel.address && <p className="text-[#1A1A1A] text-sm">{hotel.address}</p>}
                    <p className="font-semibold text-[#1A1A1A]">{hotel.city}, Tanzania</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleGetDirections}
                className="w-full flex items-center justify-center gap-2 bg-[#E07B2A] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#C96A1F] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {lang === "sw" ? "Pata Maelekezo" : "Get Directions"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Photo Lightbox */}
      {activePhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setActivePhoto(null)} data-testid="photo-lightbox">
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute -top-3 -right-3 bg-white text-[#1A1A1A] rounded-full p-2 shadow-lg hover:bg-[#F4F4F5]"
              aria-label="Close photo viewer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={activePhoto} alt="Hotel detail" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

// Lazy load dashboard components
const OwnerDashboard = React.lazy(() => import("./pages/OwnerDashboard"));
const CashierDashboard = React.lazy(() => import("./pages/CashierDashboard"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const BookingFlow = React.lazy(() => import("./pages/BookingFlow"));
const LoginPage = React.lazy(() => import("./pages/AuthPages").then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import("./pages/AuthPages").then(m => ({ default: m.RegisterPage })));
const RegisterHotelPage = React.lazy(() => import("./pages/AuthPages").then(m => ({ default: m.RegisterHotelPage })));

// ================== APP ROUTER ==================
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/hotel/:id" element={<HotelDetailPage />} />
      <Route path="/hotels/:city/:slug" element={<HotelDetailPage />} />
      <Route path="/login" element={<React.Suspense fallback={<LoadingSpinner />}><LoginPage /></React.Suspense>} />
      <Route path="/register" element={<React.Suspense fallback={<LoadingSpinner />}><RegisterPage /></React.Suspense>} />
      <Route path="/register-hotel" element={<React.Suspense fallback={<LoadingSpinner />}><RegisterHotelPage /></React.Suspense>} />
      <Route path="/booking/:hotelId/:roomId" element={<React.Suspense fallback={<LoadingSpinner />}><BookingFlow /></React.Suspense>} />
      
      {/* Owner Routes */}
      <Route
        path="/owner/*"
        element={
          <ProtectedRoute roles={["owner"]}>
            <React.Suspense fallback={<LoadingSpinner />}>
              <OwnerDashboard />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      {/* Cashier Routes */}
      <Route
        path="/cashier/*"
        element={
          <ProtectedRoute roles={["cashier"]}>
            <React.Suspense fallback={<LoadingSpinner />}>
              <CashierDashboard />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={["admin"]}>
            <React.Suspense fallback={<LoadingSpinner />}>
              <AdminDashboard />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// ================== APP ==================
function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}>
      <LanguageProvider>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
export { api, LoadingSpinner, formatTZS, LanguageToggle };
