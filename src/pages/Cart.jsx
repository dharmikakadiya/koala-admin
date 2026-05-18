import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function QtyButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
      type="button"
    >
      {children}
    </button>
  );
}

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Frontend "quantity" field use karta hai, admin "qty" — dono handle karo
  const getQty = (item) => Number(item.quantity ?? item.qty ?? 0);

  const total = useMemo(() => {
    return (items || []).reduce(
      (sum, i) => sum + getQty(i) * (Number(i.price) || 0),
      0
    );
  }, [items]);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.get("/cart");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setQty = async (id, nextQty) => {
    const quantity = Math.max(0, Number(nextQty) || 0);
    setError("");
    const prev = items;
    setItems((p) =>
      p.map((x) => (x.id === id ? { ...x, quantity, qty: quantity } : x))
    );
    try {
      if (quantity === 0) {
        await api.del(`/cart/${id}`);
        setItems((p) => p.filter((x) => x.id !== id));
      } else {
        const updated = await api.patch(`/cart/${id}`, { quantity });
        setItems((p) => p.map((x) => (x.id === id ? updated : x)));
      }
    } catch (e) {
      setItems(prev);
      setError(e?.message || "Failed to update qty");
    }
  };

  const remove = async (id) => {
    setError("");
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await api.del(`/cart/${id}`);
    } catch (e) {
      setItems(prev);
      setError(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-slate-900">Cart</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Total
          </div>
          <div className="mt-1 text-xl font-black text-slate-900">
            ₹{total.toLocaleString()}
          </div>
          <button
            onClick={load}
            className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-slate-200/70">
        <table className="w-full">
          <thead className="bg-slate-100/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                  Loading...
                </td>
              </tr>
            ) : (
              items.map((x) => (
                <tr key={x.id} className="border-t border-slate-200/70">
                  <td className="px-4 py-3">
                    {x.image && (
                      <img
                        src={x.image}
                        alt={x.title}
                        className="w-12 h-12 object-contain rounded-lg border border-slate-100"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {x.title}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="flex items-center gap-2">
                      {x.colorHex && (
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-slate-200"
                          style={{ backgroundColor: x.colorHex }}
                        />
                      )}
                      {x.colorName || x.category || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">₹{x.price}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <QtyButton onClick={() => setQty(x.id, getQty(x) - 1)}>
                        <Minus size={16} />
                      </QtyButton>
                      <input
                        value={getQty(x)}
                        onChange={(e) => setQty(x.id, e.target.value)}
                        className="w-16 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-center text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                      <QtyButton onClick={() => setQty(x.id, getQty(x) + 1)}>
                        <Plus size={16} />
                      </QtyButton>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(x.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                  Cart is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
