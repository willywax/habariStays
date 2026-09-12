jest.mock("react-ga4", () => ({
  __esModule: true,
  default: { initialize: jest.fn(), event: jest.fn(), send: jest.fn() },
}));

const originalEnv = { ...process.env };
afterEach(() => { process.env = { ...originalEnv }; });

const loadAnalytics = (environment, measurementId) => {
  jest.resetModules();
  process.env.NODE_ENV = environment;
  process.env.REACT_APP_GA_MEASUREMENT_ID = measurementId;
  return { analytics: require("./analytics"), ga: require("react-ga4").default };
};

test.each([["development", "G-TEST123"], ["production", ""], ["production", "G-XXXXXXXXXX"]])(
  "does not initialize or emit events in %s with ID %s",
  (environment, measurementId) => {
    const { analytics, ga } = loadAnalytics(environment, measurementId);
    analytics.initGA();
    analytics.trackPageView("/search");
    analytics.trackEvent("Test", "test");
    analytics.trackSearch("Arusha", 20000, 50000, 0);
    analytics.trackZeroResults("Arusha", 20000, 50000);
    analytics.trackHotelView("1", "Hotel", "Arusha");
    analytics.trackWhatsApp("1", "Hotel", "Arusha");
    analytics.trackPhoneView("1", "Hotel", "Arusha");
    expect(ga.initialize).not.toHaveBeenCalled();
    expect(ga.send).not.toHaveBeenCalled();
    expect(ga.event).not.toHaveBeenCalled();
  }
);

test("initializes without an automatic pageview and sends router pageviews", () => {
  const { analytics, ga } = loadAnalytics("production", "G-TEST123");
  analytics.initGA();
  expect(ga.initialize).toHaveBeenCalledWith("G-TEST123", {
    gaOptions: { anonymize_ip: true }, gtagOptions: { send_page_view: false },
  });
  ga.isInitialized = true;
  analytics.initGA();
  expect(ga.initialize).toHaveBeenCalledTimes(1);
  analytics.trackPageView("/search");
  expect(ga.send).toHaveBeenCalledWith({ hitType: "pageview", page: "/search" });
});

test("sends exactly one named event per business action with custom fields", () => {
  const { analytics, ga } = loadAnalytics("production", "G-TEST123");
  analytics.trackSearch("Arusha", 20000, 50000, 0);
  analytics.trackZeroResults("Arusha", 20000, 50000);
  analytics.trackHotelView("1", "Hotel", "Arusha");
  analytics.trackWhatsApp("1", "Hotel", "Arusha");
  analytics.trackPhoneView("1", "Hotel", "Arusha");
  expect(ga.event).toHaveBeenCalledTimes(5);
  expect(ga.event).toHaveBeenNthCalledWith(1, "hotel_search", {
    event_category: "Search", event_label: "Arusha", value: 0,
    city: "Arusha", budget_min: 20000, budget_max: 50000, results_count: 0,
  });
  expect(ga.event).toHaveBeenNthCalledWith(2, "zero_results", {
    event_category: "Search", event_label: "Arusha",
    city: "Arusha", budget_min: 20000, budget_max: 50000,
  });
  ["hotel_view", "whatsapp_click", "phone_revealed"].forEach((event, index) => {
    expect(ga.event).toHaveBeenNthCalledWith(index + 3, event, {
      event_category: index === 0 ? "Hotel" : "Conversion",
      event_label: "Hotel - Arusha", hotel_id: "1", hotel_name: "Hotel", city: "Arusha",
    });
  });
});
