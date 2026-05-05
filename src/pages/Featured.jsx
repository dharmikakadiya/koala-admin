import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}

export default function Featured() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [navigate, setNavigate] = useState("");
  const [discount, setDiscount] = useState("");
  const [img, setImg] = useState("");

  const canAdd = useMemo(() => title.trim() && navigate.trim(), [title, navigate]);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.get("/featuredCategories");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load featured categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!canAdd) return;
    setError("");
    try {
      const created = await api.post("/featuredCategories", {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        title: title.trim(),
        navigate: navigate.trim(),
        discount: discount.trim() || null,
        img: img.trim() || "",
      });
      setItems((p) => [created, ...p]);
      setTitle("");
      setNavigate("");
      setDiscount("");
      setImg("");
    } catch (e) {
      setError(e?.message || "Failed to add featured category");
    }
  };

  const remove = async (id) => {
    setError("");
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await api.del(`/featuredCategories/${id}`);
    } catch (e) {
      setItems(prev);
      setError(e?.message || "Failed to delete");
    }
  };

  const save = async (row) => {
    setError("");
    try {
      const updated = await api.patch(`/featuredCategories/${row.id}`, {
        title: row.title,
        navigate: row.navigate,
        discount: row.discount ?? null,
        img: row.img ?? "",
      });
      setItems((p) => p.map((x) => (x.id === row.id ? updated : x)));
    } catch (e) {
      setError(e?.message || "Failed to save");
    }
  };

  const updateLocal = (id, patch) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2 rounded-2xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-slate-900">Featured Categories</div>
            <div className="mt-1 text-sm text-slate-500">
              Manage homepage featured sections.
            </div>
          </div>
          <button
            onClick={load}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
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
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Navigate</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((x) => (
                  <tr key={x.id} className="border-t border-slate-200/70 align-top">
                    <td className="px-4 py-3">
                      <input
                        value={x.title ?? ""}
                        onChange={(e) => updateLocal(x.id, { title: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={x.navigate ?? ""}
                        onChange={(e) => updateLocal(x.id, { navigate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={x.discount ?? ""}
                        onChange={(e) => updateLocal(x.id, { discount: e.target.value })}
                        placeholder="Up to 30% off"
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={x.img ?? ""}
                        onChange={(e) => updateLocal(x.id, { img: e.target.value })}
                        placeholder="whitebed.webp / URL"
                        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => save(x)}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => remove(x.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                    No featured categories.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
        <div className="text-lg font-bold text-slate-900">Add Featured</div>
        <div className="mt-1 text-sm text-slate-500">
          Add a new homepage featured category.
        </div>

        <form onSubmit={add} className="mt-5 space-y-3">
          <Input label="Title" value={title} onChange={setTitle} placeholder="Living Room" />
          <Input label="Navigate" value={navigate} onChange={setNavigate} placeholder="living-room" />
          <Input label="Discount" value={discount} onChange={setDiscount} placeholder="Up to 30% off" />
          <Input label="Image" value={img} onChange={setImg} placeholder="whitebed.webp / URL" />
          <button
            type="submit"
            disabled={!canAdd}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-400 disabled:opacity-60"
          >
            <Plus size={16} />
            Add
          </button>
        </form>
      </div>
    </div>
  );
}

