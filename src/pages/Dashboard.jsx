import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

function StatCard({ title, value, hint }) {
  return (
    <div className="bg-white/80 backdrop-blur p-5 rounded-2xl shadow-sm ring-1 ring-slate-200/60">
      <div className="text-sm font-semibold text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    categories: [],
    products: [],
    cart: [],
    featuredCategories: [],
    features: [],
    impacts: [],
  });

  useEffect(() => {
    const load = async () => {
      setError("");
      setLoading(true);
      try {
        const [
          categories,
          products,
          cart,
          featuredCategories,
          features,
          impacts,
        ] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
          api.get("/cart"),
          api.get("/featuredCategories"),
          api.get("/features"),
          api.get("/impacts"),
        ]);
        setData({
          categories: Array.isArray(categories) ? categories : [],
          products: Array.isArray(products) ? products : [],
          cart: Array.isArray(cart) ? cart : [],
          featuredCategories: Array.isArray(featuredCategories)
            ? featuredCategories
            : [],
          features: Array.isArray(features) ? features : [],
          impacts: Array.isArray(impacts) ? impacts : [],
        });
      } catch (e) {
        setError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cartTotals = useMemo(() => {
    const items = data.cart || [];
    const qty = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const value = items.reduce(
      (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.price) || 0),
      0
    );
    return { qty, value };
  }, [data.cart]);

  const contentPie = useMemo(() => {
    return [
      { name: "Products", value: data.products.length },
      { name: "Categories", value: data.categories.length },
      { name: "Featured", value: data.featuredCategories.length },
      { name: "Features", value: data.features.length },
      { name: "Impacts", value: data.impacts.length },
    ];
  }, [
    data.products.length,
    data.categories.length,
    data.featuredCategories.length,
    data.features.length,
    data.impacts.length,
  ]);

  const cartLine = useMemo(() => {
    const items = [...(data.cart || [])].slice(0, 7);
    return items.map((i, idx) => ({
      name: `Item ${idx + 1}`,
      value: (Number(i.qty) || 0) * (Number(i.price) || 0),
    }));
  }, [data.cart]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Koala store admin overview (live from `db.json`).
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Products"
          value={loading ? "…" : data.products.length}
        />
        <StatCard
          title="Categories"
          value={loading ? "…" : data.categories.length}
        />
        <StatCard
          title="Featured Categories"
          value={loading ? "…" : data.featuredCategories.length}
        />
        <StatCard
          title="Cart Value"
          value={loading ? "…" : `₹${cartTotals.value.toLocaleString()}`}
          hint={loading ? "" : `${cartTotals.qty} total qty`}
        />
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur p-6 rounded-2xl shadow-sm ring-1 ring-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900">Cart Items Value</div>
            <div className="text-sm text-slate-500">
              Sample of first {Math.min((data.cart || []).length, 7)} items
            </div>
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cartLine}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-sm ring-1 ring-slate-200/60">
          <div className="font-bold text-slate-900">Content Breakdown</div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contentPie} dataKey="value" outerRadius={92}>
                  {contentPie.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            {contentPie.map((x, idx) => (
              <div key={x.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[idx % COLORS.length] }}
                />
                <span className="font-semibold">{x.name}</span>
                <span className="ml-auto tabular-nums">{x.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}