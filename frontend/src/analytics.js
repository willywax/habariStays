import ReactGA from "react-ga4";

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
  ReactGA.event(action, {
    event_category: category,
    ...(label !== undefined && { event_label: label }),
    ...(value !== undefined && { value }),
    ...parameters,
  });
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
