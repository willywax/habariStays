import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { api, LoadingSpinner } from "../App";
import { useAuth, useLang } from "../App";

// ================== LOGIN PAGE ==================
export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, user } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const getDashboardPath = (role) => {
    if (role === "admin") return "/admin";
    if (role === "owner") return "/owner";
    if (role === "cashier") return "/cashier";
    return "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(email, password);
      toast.success(lang === "sw" ? "Umeingia kikamilifu!" : "Login successful!");
      navigate(getDashboardPath(userData.role));
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kuingia" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userData = await loginWithGoogle(tokenResponse.access_token);
        toast.success(lang === "sw" ? "Umeingia kikamilifu!" : "Login successful!");
        navigate(getDashboardPath(userData.role));
      } catch (err) {
        toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kuingia" : "Login failed"));
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error(lang === "sw" ? "Google login imeshindikana" : "Google sign-in failed"),
  });

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[#E07B2A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">HS</span>
            </div>
          </Link>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A]">
            {lang === "sw" ? "Karibu Tena!" : "Welcome Back!"}
          </h1>
          <p className="text-[#1A1A1A]/60 mt-2">
            {lang === "sw" ? "Ingia kwenye akaunti yako" : "Sign in to your account"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1A1A1A]/10">
          {/* Google Login */}
          <button
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#1A1A1A]/20 rounded-lg font-medium hover:bg-[#FAFAF7] transition-all mb-6 disabled:opacity-50"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {lang === "sw" ? "Endelea na Google" : "Continue with Google"}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1A1A1A]/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#1A1A1A]/40">
                {lang === "sw" ? "au" : "or"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A] focus:border-transparent"
                required
                data-testid="login-email"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A] focus:border-transparent"
                required
                data-testid="login-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E07B2A] text-white py-3 rounded-lg font-medium hover:bg-[#C96A1F] transition-all disabled:opacity-50"
              data-testid="login-submit"
            >
              {loading ? (lang === "sw" ? "Inaendelea..." : "Loading...") : t("login")}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[#1A1A1A]/60">
          {lang === "sw" ? "Huna akaunti?" : "Don't have an account?"}{" "}
          <Link to="/register" className="text-[#E07B2A] font-medium hover:underline">
            {t("register")}
          </Link>
        </p>
        <p className="text-center mt-2 text-[#1A1A1A]/60">
          {lang === "sw" ? "Una hotel?" : "Own a hotel?"}{" "}
          <Link to="/register-hotel" className="text-[#E07B2A] font-medium hover:underline">
            {t("registerHotel")}
          </Link>
        </p>
      </div>
    </div>
  );
};

// ================== REGISTER PAGE (Travelers) ==================
export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "traveler"
  });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success(lang === "sw" ? "Umesajiliwa kikamilifu!" : "Registration successful!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kusajili" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        toast.success(lang === "sw" ? "Umeingia kikamilifu!" : "Signed in with Google!");
        navigate("/");
      } catch (err) {
        toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kuingia" : "Google sign-in failed"));
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error(lang === "sw" ? "Google login imeshindikana" : "Google sign-in failed"),
  });

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[#E07B2A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">HS</span>
            </div>
          </Link>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A]">
            {lang === "sw" ? "Jisajili" : "Create Account"}
          </h1>
          <p className="text-[#1A1A1A]/60 mt-2">
            {lang === "sw" ? "Fungua akaunti mpya" : "Create a new account"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1A1A1A]/10">
          {/* Google Login */}
          <button
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#1A1A1A]/20 rounded-lg font-medium hover:bg-[#FAFAF7] transition-all mb-6 disabled:opacity-50"
            data-testid="google-register-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {lang === "sw" ? "Jisajili na Google" : "Sign up with Google"}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1A1A1A]/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#1A1A1A]/40">
                {lang === "sw" ? "au" : "or"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("fullName")}</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="register-name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("email")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="register-email"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("phone")} (+255...)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+255712345678"
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="register-phone"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("password")}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="register-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E07B2A] text-white py-3 rounded-lg font-medium hover:bg-[#C96A1F] transition-all disabled:opacity-50"
              data-testid="register-submit"
            >
              {loading ? (lang === "sw" ? "Inaendelea..." : "Loading...") : t("register")}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[#1A1A1A]/60">
          {lang === "sw" ? "Una akaunti tayari?" : "Already have an account?"}{" "}
          <Link to="/login" className="text-[#E07B2A] font-medium hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
};

// ================== REGISTER HOTEL PAGE (Owners) ==================
export const RegisterHotelPage = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "owner"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await register(formData);
      if (!userData.is_verified) {
        setSuccess(true);
      } else {
        navigate("/owner");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === "sw" ? "Imeshindikana kusajili" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[#F4A723]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#F4A723]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A] mb-4">
            {t("pendingVerification")}
          </h1>
          <p className="text-[#1A1A1A]/60 text-lg mb-8">
            {t("pendingMessage")}
          </p>
          <Link
            to="/"
            className="inline-block bg-[#E07B2A] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#C96A1F] transition-all"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[#E07B2A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">HS</span>
            </div>
          </Link>
          <h1 className="font-['Outfit'] text-3xl font-bold text-[#1A1A1A]">
            {lang === "sw" ? "Sajili Hotel Yako" : "List Your Hotel"}
          </h1>
          <p className="text-[#1A1A1A]/60 mt-2">
            {lang === "sw" ? "Jiunge na Habari Stays leo" : "Join Habari Stays today"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1A1A1A]/10">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                {lang === "sw" ? "Jina la Mmiliki" : "Owner Name"}
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="owner-name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("email")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="owner-email"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("phone")} (+255...)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+255712345678"
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="owner-phone"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{t("password")}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#1A1A1A]/20 focus:outline-none focus:ring-2 focus:ring-[#E07B2A]"
                required
                data-testid="owner-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] text-white py-3 rounded-lg font-medium hover:bg-[#143D28] transition-all disabled:opacity-50"
              data-testid="owner-submit"
            >
              {loading ? (lang === "sw" ? "Inaendelea..." : "Loading...") : (lang === "sw" ? "Sajili Sasa" : "Register Now")}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[#1A1A1A]/60">
          {lang === "sw" ? "Una akaunti tayari?" : "Already have an account?"}{" "}
          <Link to="/login" className="text-[#E07B2A] font-medium hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
};
