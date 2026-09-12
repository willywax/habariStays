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


describe("backend business events", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    sessionStorage.clear();
    process.env.REACT_APP_API_URL = "https://analytics.example.test/";
    process.env.REACT_APP_BACKEND_URL = "https://api.example.test";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201 });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("posts full business fields and reuses a tab session independently of GA4", async () => {
    const { analytics, ga } = loadAnalytics("development", "");
    await analytics.sendBackendEvent("hotel_search", {
      city: "Arusha", budget_min: 0, budget_max: 60000, results_count: 0,
    });
    await analytics.sendBackendEvent("hotel_view", { hotel_id: "hotel-1", city: "Arusha" });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("https://analytics.example.test/api/analytics/event");
    expect(options).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true });
    const first = JSON.parse(options.body);
    expect(first).toEqual({ event_type: "hotel_search", session_id: expect.any(String), city: "Arusha", budget_min: 0, budget_max: 60000, results_count: 0 });
    expect(first.session_id).toBeTruthy();
    expect(first.session_id).toBe(sessionStorage.getItem("hs_session"));
    expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({
      event_type: "hotel_view", hotel_id: "hotel-1", city: "Arusha", session_id: first.session_id,
    });
    expect(ga.event).not.toHaveBeenCalled();
  });

  test("uses the existing backend URL when the analytics override is empty", async () => {
    process.env.REACT_APP_API_URL = "";
    const { analytics } = loadAnalytics("production", "");
    await analytics.sendBackendEvent("zero_results", { city: "", budget_min: undefined, budget_max: undefined });
    expect(global.fetch.mock.calls[0][0]).toBe("https://api.example.test/api/analytics/event");
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      event_type: "zero_results", session_id: expect.any(String),
    });
  });

  test("does not send to an undefined host when neither URL is configured", async () => {
    delete process.env.REACT_APP_API_URL;
    delete process.env.REACT_APP_BACKEND_URL;
    const { analytics } = loadAnalytics("production", "");
    await analytics.sendBackendEvent("hotel_view");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test.each(["whatsapp_click", "phone_revealed"])("sends %s with hotel identity", async (event_type) => {
    const { analytics } = loadAnalytics("production", "G-TEST123");
    await analytics.sendBackendEvent(event_type, { hotel_id: "hotel-1", city: "Moshi" });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({ event_type, hotel_id: "hotel-1", city: "Moshi" });
  });

  test("silently handles rejected requests and HTTP rate limits", async () => {
    const { analytics } = loadAnalytics("production", "");
    global.fetch.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(analytics.sendBackendEvent("hotel_view")).resolves.toBeUndefined();
    await expect(analytics.sendBackendEvent("hotel_view")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("silently handles denied storage and serialization failures", async () => {
    const { analytics } = loadAnalytics("production", "");
    const storage = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    await expect(analytics.sendBackendEvent("hotel_view")).resolves.toBeUndefined();
    storage.mockRestore();
    const circular = {};
    circular.self = circular;
    await expect(analytics.sendBackendEvent("hotel_view", { metadata: circular })).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("returns immediately and still posts if the GA4 companion throws", async () => {
    const { analytics, ga } = loadAnalytics("production", "G-TEST123");
    ga.event.mockImplementationOnce(() => { throw new Error("GA unavailable"); });
    global.fetch.mockReturnValueOnce(new Promise(() => {}));
    const navigate = jest.fn();
    expect(() => {
      analytics.trackWhatsApp("hotel-1", "Hotel", "Arusha");
      void analytics.sendBackendEvent("whatsapp_click", { hotel_id: "hotel-1", city: "Arusha" });
      navigate();
    }).not.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
