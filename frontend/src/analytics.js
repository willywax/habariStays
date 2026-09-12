import ReactGA from "react-ga4";

const BACKEND_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;

const getSessionId = () => {
  let sid = sessionStorage.getItem("hs_session");
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 14);
    sessionStorage.setItem("hs_session", sid);
  }
  return sid;
};

export const sendBackendEvent = async (event_type, data = {}) => {
  try {
    if (!BACKEND_URL) return;
    await fetch(`${BACKEND_URL.replace(/\/+$/, "")}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        ...data,
        event_type,
        session_id: getSessionId(),
        // An empty selection means all cities; the API requires nonempty strings.
        city: data.city || undefined,
      }),
    });
  } catch {
    // Storage, serialization, and network failures must never interrupt the UI.
  }
};

const GA_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;
const enabled = process.env.NODE_ENV === "production" && !!GA_ID && GA_ID !== "G-XXXXXXXXXX";

export const initGA = () => {
  if (!enabled || ReactGA.isInitialized) return;
  ReactGA.initialize(GA_ID, {
    gaOptions: { anonymize_ip: true },
    gtagOptions: { send_page_view: false },
  });
};

export const trackPageView = (page) => {
  if (!enabled) return;
  ReactGA.send({ hitType: "pageview", page });
};

export const trackEvent = (category, action, label, value, parameters = {}) => {
  if (!enabled) return;
  try {
    ReactGA.event(action, {
      event_category: category,
      ...(label !== undefined && { event_label: label }),
      ...(value !== undefined && { value }),
      ...parameters,
    });
  } catch {
    // GA4 failure must not prevent the companion backend event or user action.
  }
};

export const trackSearch = (city, budget_min, budget_max, results_count) => {
  trackEvent("Search", "hotel_search", city, results_count, {
    city, budget_min, budget_max, results_count,
  });
};

export const trackHotelView = (hotel_id, hotel_name, city) => {
  trackEvent("Hotel", "hotel_view", `${hotel_name} - ${city}`, undefined, {
    hotel_id, hotel_name, city,
  });
};

export const trackWhatsApp = (hotel_id, hotel_name, city) => {
  trackEvent("Conversion", "whatsapp_click", `${hotel_name} - ${city}`, undefined, {
    hotel_id, hotel_name, city,
  });
};

export const trackPhoneView = (hotel_id, hotel_name, city) => {
  trackEvent("Conversion", "phone_revealed", `${hotel_name} - ${city}`, undefined, {
    hotel_id, hotel_name, city,
  });
};

export const trackZeroResults = (city, budget_min, budget_max) => {
  trackEvent("Search", "zero_results", city, undefined, { city, budget_min, budget_max });
};
