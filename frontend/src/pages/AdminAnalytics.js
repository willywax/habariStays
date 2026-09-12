import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../App";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

const PERIODS = [7, 14, 30, 90];
const ENDPOINTS = ["summary", "hotels", "calls"];
const REFRESH_MS = 5 * 60 * 1000;
const integer = (value) =>
  value == null
    ? "—"
    : Number(value).toLocaleString("en-TZ", { maximumFractionDigits: 0 });
const percent = (value) =>
  value == null ? "—" : `${Number(value).toFixed(1)}%`;
const shortDate = (value) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
const lastActive = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : "—";
const conversionColor = (value) =>
  value > 5
    ? "text-emerald-700"
    : value >= 2
      ? "text-amber-700"
      : "text-red-700";
const progressColor = (value) =>
  value < 30 ? "bg-red-500" : value <= 70 ? "bg-amber-500" : "bg-emerald-500";
const hotelUrl = (row) => `/admin/hotels/${encodeURIComponent(row.hotel_id)}`;
const totalContacts = (row) =>
  Number(row.whatsapp_clicks || 0) + Number(row.phone_reveals || 0);

function useAnalytics(days) {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    setData({});
    setErrors({});
    setLoading(true);
    const fetchAll = async () => {
      if (busy) return;
      busy = true;
      const results = await Promise.allSettled(
        ENDPOINTS.map((name) =>
          api.get(`/analytics/${name}`, {
            params: { days },
            signal: controller.signal,
          }),
        ),
      );
      if (controller.signal.aborted) return;
      setData((previous) => {
        const next = { ...previous };
        results.forEach((result, index) => {
          if (result.status === "fulfilled")
            next[ENDPOINTS[index]] = result.value.data;
        });
        return next;
      });
      setErrors(
        Object.fromEntries(
          results.map((result, index) => [
            ENDPOINTS[index],
            result.status === "rejected",
          ]),
        ),
      );
      setLoading(false);
      busy = false;
    };
    void fetchAll();
    const interval = setInterval(() => {
      void fetchAll();
    }, REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [days, revision]);
  return {
    data,
    errors,
    loading,
    retry: () => setRevision((value) => value + 1),
  };
}

function Panel({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-['Outfit'] text-lg font-semibold text-zinc-900">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Empty({ children = "No data yet for this period." }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-8 text-center text-sm text-zinc-500">
      <BarChart3 className="h-7 w-7 text-zinc-300" aria-hidden="true" />
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Loading analytics"
      className="space-y-6 animate-pulse"
    >
      <span className="sr-only">Loading analytics…</span>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-zinc-200" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-72 rounded-xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}

function KPIs({ items }) {
  return (
    <div
      className={`grid grid-cols-2 gap-4 ${items.length === 6 ? "xl:grid-cols-6" : "xl:grid-cols-4"}`}
    >
      {items.map(({ label, value, color }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-zinc-500">{label}</p>
          <p
            className={`mt-3 font-['Outfit'] text-3xl font-semibold tabular-nums ${color || "text-zinc-900"}`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsTable({
  title,
  columns,
  rows = [],
  defaultSort,
  rowHref,
  highlight,
}) {
  const [sort, setSort] = useState(
    defaultSort || { key: columns[0].key, direction: "asc" },
  );
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sort.key);
    return [...rows].sort((a, b) => {
      const left = column?.value ? column.value(a) : a[sort.key];
      const right = column?.value ? column.value(b) : b[sort.key];
      if (left == null) return right == null ? 0 : 1;
      if (right == null) return -1;
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [rows, columns, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / 20));
  const currentPage = Math.min(page, pages - 1);
  if (!rows.length)
    return <Empty>No {title.toLowerCase()} yet for this period.</Empty>;
  return (
    <>
      <div className="overflow-x-auto">
        <table aria-label={title} className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3"
                  aria-sort={
                    sort.key === column.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {column.sortable === false ? (
                    column.label
                  ) : (
                    <button
                      className="flex items-center gap-1.5 text-left hover:text-zinc-900"
                      onClick={() => {
                        setSort({
                          key: column.key,
                          direction:
                            sort.key === column.key && sort.direction === "asc"
                              ? "desc"
                              : "asc",
                        });
                        setPage(0);
                      }}
                    >
                      {column.label}
                      {sort.key === column.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted
              .slice(currentPage * 20, (currentPage + 1) * 20)
              .map((row, index) => (
                <tr
                  key={row.hotel_id ?? row.user_id ?? row.city ?? index}
                  className={`${highlight?.(row) || ""} ${rowHref ? "cursor-pointer hover:bg-zinc-50 focus:bg-zinc-50" : ""}`}
                  tabIndex={rowHref ? 0 : undefined}
                  onClick={
                    rowHref
                      ? () =>
                          window.open(
                            rowHref(row),
                            "_blank",
                            "noopener,noreferrer",
                          )
                      : undefined
                  }
                  onKeyDown={
                    rowHref
                      ? (event) => {
                          if (
                            event.key === "Enter" &&
                            event.target === event.currentTarget
                          )
                            window.open(
                              rowHref(row),
                              "_blank",
                              "noopener,noreferrer",
                            );
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap px-3 py-3.5 tabular-nums"
                    >
                      {column.render
                        ? column.render(row, currentPage * 20 + index + 1)
                        : ((column.value
                            ? column.value(row)
                            : row[column.key]) ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
          <span>
            {currentPage * 20 + 1}–
            {Math.min((currentPage + 1) * 20, rows.length)} of{" "}
            {integer(rows.length)}
          </span>
          <div className="flex items-center gap-3">
            <button
              aria-label={`Previous page of ${title}`}
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              className="rounded border p-1.5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              {currentPage + 1} / {pages}
            </span>
            <button
              aria-label={`Next page of ${title}`}
              disabled={currentPage + 1 === pages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded border p-1.5 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DailyChart({ data = [], calls = false }) {
  const lines = calls
    ? [
        { key: "total", name: "Calls made", color: "#2563eb" },
        { key: "verified", name: "Verified", color: "#059669" },
      ]
    : [{ key: "count", name: "Searches", color: "#9A3324" }];
  if (!data.some((row) => lines.some(({ key }) => row[key] > 0)))
    return <Empty />;
  return (
    <div
      className="h-72"
      role="img"
      aria-label={calls ? "Daily calls made and verified" : "Searches per day"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 16, bottom: 5, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e4e4e7"
          />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            minTickGap={30}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={45}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={shortDate}
            formatter={(value) => integer(value)}
          />
          {calls && <Legend />}
          {lines.map(({ key, name, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function HorizontalChart({
  data = [],
  labelKey,
  color = "#0F4C5C",
  labelWidth = 105,
}) {
  if (!data.some((row) => row.count > 0)) return <Empty />;
  return (
    <div className="h-72" role="img" aria-label="Search counts by category">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e4e4e7"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey={labelKey}
            width={labelWidth}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(value) => [integer(value), "Searches"]} />
          <Bar
            dataKey="count"
            name="Searches"
            fill={color}
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const numberColumn = (key, label) => ({
  key,
  label,
  render: (row) => integer(row[key]),
});
const rankColumn = {
  key: "rank",
  label: "#",
  sortable: false,
  render: (_, rank) => rank,
};
const hotelNameColumn = {
  key: "name",
  label: "Hotel Name",
  render: (row) => (
    <a
      className="font-medium text-[#9A3324] hover:underline"
      href={hotelUrl(row)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
    >
      {row.name}
      <ArrowUpRight
        className="ml-1 inline h-3 w-3"
        aria-label="Opens in new tab"
      />
    </a>
  ),
};
const cityColumn = { key: "city", label: "City" };
const viewedColumns = [
  rankColumn,
  hotelNameColumn,
  cityColumn,
  numberColumn("views", "Views"),
  numberColumn("whatsapp_clicks", "WhatsApp Clicks"),
  numberColumn("phone_reveals", "Phone Reveals"),
  {
    key: "conversion_rate",
    label: "Conversion %",
    render: (row) => (
      <span className={conversionColor(row.conversion_rate)}>
        {percent(row.conversion_rate)}
      </span>
    ),
  },
];
const contactColumns = [
  rankColumn,
  hotelNameColumn,
  cityColumn,
  numberColumn("whatsapp_clicks", "WhatsApp"),
  numberColumn("phone_reveals", "Phone"),
  {
    key: "total_contacts",
    label: "Total Contacts",
    value: totalContacts,
    render: (row) => integer(totalContacts(row)),
  },
];
const noResultsColumns = [
  cityColumn,
  numberColumn("count", "Times Searched"),
  numberColumn("hotels_listed", "Hotels Listed"),
];
const callerColumns = [
  { key: "name", label: "Name", render: (row) => row.name || "Deleted user" },
  numberColumn("total", "Calls"),
  numberColumn("verified", "Verified"),
  { key: "rate", label: "Rate %", render: (row) => percent(row.rate) },
  {
    key: "last_active",
    label: "Last Active",
    render: (row) => lastActive(row.last_active),
  },
];
const townColumns = [
  { key: "city", label: "Town" },
  ...["pending", "called", "verified", "published"].map((key) =>
    numberColumn(key, key[0].toUpperCase() + key.slice(1)),
  ),
  {
    key: "completion_pct",
    label: "Progress",
    render: (row) => (
      <div className="flex min-w-36 items-center gap-3">
        <div
          role="progressbar"
          aria-label={`${row.city} completion`}
          aria-valuenow={row.completion_pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100"
        >
          <div
            className={`h-full rounded-full ${progressColor(row.completion_pct)}`}
            style={{
              width: `${Math.max(0, Math.min(100, row.completion_pct))}%`,
            }}
          />
        </div>
        <span>{percent(row.completion_pct)}</span>
      </div>
    ),
  },
];

function Overview({ data }) {
  const cities = [...(data.top_cities_searched || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const budgetLabels = {
    "0-30k": "Under TZS 30,000",
    "30k-60k": "TZS 30,000–60,000",
    "60k-100k": "TZS 60,000–100,000",
    "100k+": "TZS 100,000+",
  };
  return (
    <div className="space-y-6">
      <KPIs
        items={[
          { label: "Total Searches", value: integer(data.total_searches) },
          { label: "Hotel Views", value: integer(data.total_hotel_views) },
          {
            label: "WhatsApp Clicks",
            value: integer(data.total_whatsapp_clicks),
          },
          { label: "Phone Reveals", value: integer(data.total_phone_reveals) },
          {
            label: "Conversion Rate",
            value: percent(data.conversion_rate),
            color: conversionColor(data.conversion_rate),
          },
          {
            label: "Zero Result Searches",
            value: integer(data.zero_results_searches),
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Searches per day"
          description="Traveler demand over the selected period"
        >
          <DailyChart data={data.searches_by_day} />
        </Panel>
        <Panel
          title="Top cities searched"
          description="The eight most searched destinations"
        >
          <HorizontalChart data={cities} labelKey="city" />
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Cities with no results"
          description="Find the next towns to add listings. Hotels listed reflects current public inventory."
        >
          <AnalyticsTable
            title="Cities with no results"
            columns={noResultsColumns}
            rows={data.top_cities_zero_results}
            defaultSort={{ key: "count", direction: "desc" }}
            highlight={(row) =>
              row.hotels_listed === 0 ? "bg-red-50 text-red-800" : ""
            }
          />
        </Panel>
        <Panel
          title="Budget distribution"
          description="Nightly budget in TZS · minimum budget, or maximum when no minimum is set"
        >
          <HorizontalChart
            data={(data.budget_distribution || []).map((row) => ({
              ...row,
              label: budgetLabels[row.range] || row.range,
            }))}
            labelKey="label"
            labelWidth={145}
            color="#E07B2A"
          />
        </Panel>
      </div>
    </div>
  );
}

function Hotels({ data }) {
  const zeroCities = (data.zero_result_cities || []).filter(
    (row) => (row.zero_results_count ?? row.search_count) > 0,
  );
  return (
    <div className="space-y-6">
      <Panel
        title="Most Viewed Hotels"
        description="Select a hotel to edit its listing in a new tab."
      >
        <AnalyticsTable
          title="Most Viewed Hotels"
          columns={viewedColumns}
          rows={data.most_viewed}
          defaultSort={{ key: "views", direction: "desc" }}
          rowHref={hotelUrl}
        />
      </Panel>
      <Panel
        title="Most Contacted Hotels"
        description="Your best performing listings, ranked by total contacts."
      >
        <AnalyticsTable
          title="Most Contacted Hotels"
          columns={contactColumns}
          rows={data.most_contacted}
          defaultSort={{ key: "total_contacts", direction: "desc" }}
          rowHref={hotelUrl}
        />
      </Panel>
      <Panel
        title="Zero results cities"
        description="Turn unmet demand into new listings."
      >
        {zeroCities.length ? (
          <ul className="divide-y divide-zinc-100">
            {zeroCities.map((row) => (
              <li
                key={row.city}
                className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <p className="text-sm text-zinc-600">
                  Travelers searched{" "}
                  <strong className="text-zinc-900">{row.city}</strong>{" "}
                  {integer(row.zero_results_count ?? row.search_count)} times
                  but found no hotels.
                </p>
                <a
                  href={`https://pipeline.habaristays.com/scrape?town=${encodeURIComponent(row.city)}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#9A3324] px-4 py-2 text-sm font-medium text-white hover:bg-[#7e291d]"
                >
                  Scrape this town
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No zero-result searches in this period.</Empty>
        )}
      </Panel>
    </div>
  );
}

function Calls({ data }) {
  const pipeline = data.pipeline_counts;
  const stages = [
    { key: "pending", label: "Pending", color: "bg-zinc-100 text-zinc-700" },
    { key: "called", label: "Called", color: "bg-blue-50 text-blue-700" },
    {
      key: "verified",
      label: "Verified",
      color: "bg-emerald-50 text-emerald-700",
    },
    { key: "published", label: "Published", color: "bg-teal-50 text-teal-700" },
  ];
  const leader = [...(data.top_callers || [])].sort(
    (a, b) => b.verified - a.verified || b.rate - a.rate || b.total - a.total,
  )[0];
  return (
    <div className="space-y-6">
      <KPIs
        items={[
          { label: "Total Calls Made", value: integer(data.total_calls) },
          {
            label: "Verified",
            value: integer(data.verified),
            color: "text-emerald-700",
          },
          { label: "Unreachable", value: integer(data.unreachable) },
          {
            label: "Verification Rate",
            value: percent(data.verification_rate),
          },
        ]}
      />
      <Panel
        title="Verification pipeline"
        description="Current inventory, independent of the selected period. Each percentage uses all hotels; verified and published may overlap."
      >
        {pipeline?.total > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((stage, index) => (
              <React.Fragment key={stage.key}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-zinc-300">
                    →
                  </span>
                )}
                <div
                  className={`min-w-28 flex-1 rounded-xl p-4 ${stage.color}`}
                >
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {integer(pipeline[stage.key])}
                  </p>
                  <p className="mt-1 text-xs">
                    {percent((pipeline[stage.key] / pipeline.total) * 100)} of{" "}
                    {integer(pipeline.total)}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <Empty>
            {pipeline
              ? "No hotels in the pipeline yet."
              : "Pipeline totals are unavailable."}
          </Empty>
        )}
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Caller leaderboard"
          description="Top performer by verified calls, then verification rate. Last active is shown in UTC."
        >
          <AnalyticsTable
            title="Caller leaderboard"
            columns={callerColumns}
            rows={data.top_callers}
            defaultSort={{ key: "verified", direction: "desc" }}
            highlight={(row) =>
              row === leader && row.verified > 0
                ? "bg-emerald-50 text-emerald-800"
                : ""
            }
          />
        </Panel>
        <Panel
          title="Daily calls"
          description="Calls made and verified over the selected period"
        >
          <DailyChart data={data.calls_by_day} calls />
        </Panel>
      </div>
      <Panel
        title="Town completion"
        description="Towns needing the most attention appear first."
      >
        <AnalyticsTable
          title="Town completion"
          columns={townColumns}
          rows={data.towns_progress}
          defaultSort={{ key: "completion_pct", direction: "asc" }}
        />
      </Panel>
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const { data, errors, loading, retry } = useAnalytics(days);
  return (
    <div className="space-y-6" data-testid="admin-analytics">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-zinc-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Traveler demand, listing performance, and backoffice progress.
          </p>
        </div>
        <div
          role="group"
          aria-label="Analytics period"
          className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1"
        >
          {PERIODS.map((period) => (
            <button
              key={period}
              aria-pressed={days === period}
              onClick={() => setDays(period)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${days === period ? "bg-[#9A3324] text-white" : "text-zinc-500 hover:bg-zinc-50"}`}
            >
              {period}d
            </button>
          ))}
        </div>
      </header>
      <Tabs defaultValue="summary">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <TabsList aria-label="Analytics sections" className="h-11">
            <TabsTrigger value="summary" className="px-5 py-2">
              Overview
            </TabsTrigger>
            <TabsTrigger value="hotels" className="px-5 py-2">
              Hotels
            </TabsTrigger>
            <TabsTrigger value="calls" className="px-5 py-2">
              Calls
            </TabsTrigger>
          </TabsList>
          <span className="text-xs text-zinc-400">
            UTC dates · refreshes every 5 minutes
          </span>
        </div>
        {ENDPOINTS.map((name) => (
          <TabsContent key={name} value={name} className="mt-6">
            {errors[name] && (
              <div
                role="status"
                className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                <span>
                  {data[name]
                    ? "Could not refresh this section. Showing the last available data."
                    : "Could not load this section. Please try again."}
                </span>
                <button
                  onClick={retry}
                  className="inline-flex items-center gap-2 font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            )}
            {loading ? (
              <Skeleton />
            ) : data[name] ? (
              <React.Fragment key={`${name}-${days}`}>
                {name === "summary" ? (
                  <Overview data={data.summary} />
                ) : name === "hotels" ? (
                  <Hotels data={data.hotels} />
                ) : (
                  <Calls data={data.calls} />
                )}
              </React.Fragment>
            ) : (
              !errors[name] && <Empty />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
