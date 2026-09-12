import React, { act } from "react";
import { createRoot } from "react-dom/client";
import AdminAnalytics, { AnalyticsTable } from "./AdminAnalytics";
import { api } from "../App";

jest.mock("../App", () => ({ api: { get: jest.fn() } }));
jest.mock("recharts", () => {
  const React = require("react");
  const Chart = ({ children }) => React.createElement("div", null, children);
  return Object.fromEntries(
    [
      "Bar",
      "BarChart",
      "CartesianGrid",
      "Legend",
      "Line",
      "LineChart",
      "ResponsiveContainer",
      "Tooltip",
      "XAxis",
      "YAxis",
    ].map((name) => [name, Chart]),
  );
});

const summary = {
  total_searches: 120,
  total_hotel_views: 40,
  total_whatsapp_clicks: 4,
  total_phone_reveals: 3,
  conversion_rate: 10,
  zero_results_searches: 8,
  searches_by_day: [{ date: "2026-09-12", count: 12 }],
  top_cities_searched: [{ city: "Arusha", count: 5 }],
  top_cities_zero_results: [{ city: "Empty Town", count: 8, hotels_listed: 0 }],
  budget_distribution: [{ range: "0-30k", count: 3 }],
};
const hotels = {
  most_viewed: [
    {
      hotel_id: "h1",
      name: "First Hotel",
      city: "Arusha",
      views: 40,
      whatsapp_clicks: 4,
      phone_reveals: 3,
      conversion_rate: 10,
    },
  ],
  most_contacted: [
    {
      hotel_id: "h1",
      name: "First Hotel",
      city: "Arusha",
      whatsapp_clicks: 4,
      phone_reveals: 3,
    },
  ],
  zero_result_cities: [
    { city: "Dar es Salaam", search_count: 9, zero_results_count: 5 },
  ],
};
const calls = {
  total_calls: 20,
  verified: 8,
  unreachable: 2,
  verification_rate: 40,
  pipeline_counts: {
    total: 100,
    pending: 40,
    called: 20,
    verified: 30,
    published: 20,
  },
  top_callers: [
    {
      user_id: "u1",
      name: "Top Caller",
      total: 10,
      verified: 8,
      rate: 80,
      last_active: "2026-09-12T12:00:00Z",
    },
  ],
  calls_by_day: [{ date: "2026-09-12", total: 20, verified: 8 }],
  towns_progress: [
    {
      city: "Best",
      pending: 0,
      called: 0,
      verified: 90,
      published: 80,
      completion_pct: 90,
    },
    {
      city: "Worst",
      pending: 9,
      called: 0,
      verified: 1,
      published: 1,
      completion_pct: 10,
    },
  ],
};
let container, root;
const render = async (element = <AdminAnalytics />) => {
  await act(async () => {
    root.render(element);
  });
};
const button = (text) =>
  [...container.querySelectorAll("button")].find(
    (node) => node.textContent === text,
  );
const click = async (node) => {
  expect(node).toBeTruthy();
  await act(async () => {
    node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};
const tab = async (name) => {
  await act(async () => {
    button(name).dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, button: 0 }),
    );
  });
};

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  api.get.mockReset().mockImplementation((path) =>
    Promise.resolve({
      data: { summary, hotels, calls }[path.split("/").pop()],
    }),
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("loads all endpoints at 30 days and refetches all when the period changes", async () => {
  await render();
  expect(api.get).toHaveBeenCalledTimes(3);
  for (const name of ["summary", "hotels", "calls"])
    expect(api.get).toHaveBeenCalledWith(
      `/analytics/${name}`,
      expect.objectContaining({ params: { days: 30 } }),
    );
  expect(container.textContent).toContain("120");
  expect(
    container.querySelector(
      'table[aria-label="Cities with no results"] tbody tr',
    ).className,
  ).toContain("bg-red-50");
  const oldSignal = api.get.mock.calls[0][1].signal;
  await click(button("7d"));
  expect(oldSignal.aborted).toBe(true);
  expect(api.get).toHaveBeenCalledTimes(6);
  expect(
    api.get.mock.calls
      .slice(3)
      .every(([, options]) => options.params.days === 7),
  ).toBe(true);
});

test("hotel links, full metrics, and town scraping actions are available", async () => {
  await render();
  await tab("Hotels");
  const link = container.querySelector('a[href="/admin/hotels/h1"]');
  expect(link?.target).toBe("_blank");
  expect(container.textContent).toContain("Phone Reveals");
  expect(container.textContent).toContain("5 times but found no hotels");
  expect(
    container
      .querySelector('a[href^="https://pipeline.habaristays.com"]')
      .getAttribute("href"),
  ).toBe("https://pipeline.habaristays.com/scrape?town=Dar%20es%20Salaam");
  const open = jest.spyOn(window, "open").mockImplementation(() => {});
  await click(
    container.querySelector('table[aria-label="Most Viewed Hotels"] tbody tr'),
  );
  expect(open).toHaveBeenCalledWith(
    "/admin/hotels/h1",
    "_blank",
    "noopener,noreferrer",
  );
});

test("calls show pipeline percentages, the top performer, and worst towns first", async () => {
  await render();
  await tab("Calls");
  expect(container.textContent).toContain("40.0% of 100");
  expect(
    container.querySelector('table[aria-label="Caller leaderboard"] tbody tr')
      .className,
  ).toContain("bg-emerald-50");
  const towns = container.querySelectorAll(
    'table[aria-label="Town completion"] tbody tr',
  );
  expect(towns[0].textContent).toContain("Worst");
  expect(
    towns[0].querySelector('[role="progressbar"] > div').className,
  ).toContain("bg-red-500");
  expect(
    towns[1].querySelector('[role="progressbar"] > div').className,
  ).toContain("bg-emerald-500");
});

test("tables sort numerically and paginate in groups of 20", async () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({
    hotel_id: `${index}`,
    name: `Hotel ${index}`,
    views: index,
  }));
  await render(
    <AnalyticsTable
      title="Test hotels"
      rows={rows}
      columns={[
        { key: "name", label: "Name" },
        { key: "views", label: "Views" },
      ]}
      defaultSort={{ key: "views", direction: "desc" }}
    />,
  );
  expect(container.querySelectorAll("tbody tr")).toHaveLength(20);
  expect(container.querySelector("tbody tr").textContent).toContain("Hotel 24");
  await click(
    container.querySelector('[aria-label="Next page of Test hotels"]'),
  );
  expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
  await click(button("Views"));
  expect(container.querySelectorAll("tbody tr")).toHaveLength(20);
  expect(container.querySelector("tbody tr").textContent).toContain("Hotel 0");
});

test("background refresh keeps existing data on failure without a loading skeleton", async () => {
  await render();
  api.get.mockRejectedValue(new Error("Offline"));
  await act(async () => {
    jest.advanceTimersByTime(300000);
  });
  expect(api.get).toHaveBeenCalledTimes(6);
  expect(container.textContent).toContain("120");
  expect(container.textContent).toContain("Showing the last available data");
  expect(
    container.querySelector('[aria-label="Loading analytics"]'),
  ).toBeNull();
});

test("loading, recoverable errors, and empty states do not show invented metrics", async () => {
  api.get.mockImplementation(() => new Promise(() => {}));
  await render();
  expect(
    container.querySelector('[aria-label="Loading analytics"]'),
  ).not.toBeNull();
  api.get.mockRejectedValue(new Error("Offline"));
  await click(button("14d"));
  expect(container.textContent).toContain("Could not load this section");
  api.get.mockResolvedValue({
    data: {
      ...summary,
      total_searches: 0,
      searches_by_day: [],
      top_cities_searched: [],
      top_cities_zero_results: [],
      budget_distribution: [],
    },
  });
  await click(button("Retry"));
  expect(container.textContent).toContain("No data yet for this period");
});

test("older period responses cannot overwrite the selected period", async () => {
  const pending = [];
  api.get.mockImplementation(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  await render();
  api.get.mockImplementation((path) =>
    Promise.resolve({
      data: path.endsWith("summary") ? { ...summary, total_searches: 777 } : {},
    }),
  );
  await click(button("90d"));
  await act(async () =>
    pending.forEach((resolve) => resolve({ data: summary })),
  );
  expect(container.textContent).toContain("777");
  expect(button("90d").getAttribute("aria-pressed")).toBe("true");
});


test.each([[1.9, "text-red-700"], [2, "text-amber-700"], [5, "text-amber-700"], [5.1, "text-emerald-700"]])("conversion rate %s uses the specified threshold", async (rate, color) => {
  api.get.mockImplementation((path) => Promise.resolve({ data: path.endsWith("summary") ? { ...summary, conversion_rate: rate } : {} }));
  await render();
  const label = [...container.querySelectorAll("p")].find((node) => node.textContent === "Conversion Rate");
  expect(label.nextElementSibling.className).toContain(color);
});
