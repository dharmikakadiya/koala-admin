import { Plus, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import View from "./viewCategories";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaEdit } from "react-icons/fa";
import { GrFormView } from "react-icons/gr";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewModal, setViewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editing, setEditing] = useState(null);
  const [image, setImage] = useState(null);

  const slug = useMemo(
    () =>
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-"),
    [name]
  );

  // LOAD DATA
  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.get("/featuredCategories");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // EDIT BUTTON CLICK — form mein data bhar do
  const startEdit = (category) => {
    setEditing(category);
    setName(category.title || "");
    setSubCategory("");
    setImage(null);
  };

  // CANCEL EDIT
  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setSubCategory("");
    setImage(null);
  };

  // ADD CATEGORY
  const addCategory = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setError("");
    try {
      const created = await api.post("/featuredCategories", {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        title: n,
        slug,
        categories: subCategory
          ? [{ id: Date.now(), title: subCategory }]
          : [],
      });
      setItems((prev) => [created, ...prev]);
      setName("");
      setSubCategory("");
    } catch (e) {
      setError(e?.message || "Failed to add category");
    }
  };

  // UPDATE CATEGORY
  const updateCategory = async (e) => {
    e.preventDefault();
    if (!editing) return;
    const n = name.trim();
    if (!n) return;
    setError("");
    try {
      const updated = await api.put(`/featuredCategories/${editing.id}`, {
        ...editing,
        title: n,
        slug,
      });
      setItems((prev) =>
        prev.map((x) => (x.id === editing.id ? updated : x))
      );
      cancelEdit();
    } catch (e) {
      setError(e?.message || "Failed to update category");
    }
  };

  // DELETE CATEGORY
  const removeCategory = async (id) => {
    setError("");
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await api.del(`/featuredCategories/${id}`);
    } catch (e) {
      setItems(prev);
      setError(e?.message || "Failed to delete category");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {/* LEFT SIDE */}
      <div className="xl:col-span-2 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">Categories</div>
          <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-3 py-2 text-sm font-semibold text-stone-700 rounded-xl">
            <Tag size={16} />
            {items.length} total
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-rose-50 text-rose-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border">
          <table className="w-full">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">SubCategories</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-t ${editing?.id === c.id ? "bg-indigo-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold">{c.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {Array.isArray(c.categories) ? c.categories.length : 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {/* VIEW */}
                      <button
                        onClick={() => {
                          setSelectedCategory(c);
                          setViewModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-100 text-stone-700 rounded"
                      >
                        <GrFormView size={20} />
                      </button>

                      {/* EDIT */}
                      <button
                        onClick={() => startEdit(c)}
                        className="px-3 py-1 bg-green-100 text-stone-700 rounded"
                      >
                        <FaEdit size={20} />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => removeCategory(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 border rounded"
                      >
                        <RiDeleteBin6Line size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-6">
                    No categories yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDE — Add / Edit Form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <div className="text-lg font-bold">
          {editing ? "Edit Category" : "Add Category"}
        </div>

        {/* Editing badge */}
        {editing && (
          <div className="mt-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
            Editing: <span className="font-semibold">{editing.title}</span>
          </div>
        )}

        <form
          onSubmit={editing ? updateCategory : addCategory}
          className="mt-4 space-y-3"
        >
          {/* CATEGORY NAME */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full border px-3 py-2 rounded"
          />

          {/* SUBCATEGORY — only show when adding */}
          {!editing && (
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="SubCategory name"
              className="w-full border px-3 py-2 rounded"
            />
          )}

          {/* SLUG */}
          <input
            value={slug}
            readOnly
            className="w-full border px-3 py-2 rounded bg-gray-50"
          />

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className={`w-full text-white py-2 rounded flex justify-center gap-2 ${
              editing ? "bg-green-600 hover:bg-green-700" : "bg-stone-500 hover:bg-stone-600"
            }`}
          >
            <Plus />
            {editing ? "Update" : "Add"}
          </button>

          {/* CANCEL — only when editing */}
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="w-full border py-2 rounded text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}

          {/* REFRESH */}
          <button
            type="button"
            onClick={load}
            className="w-full border py-2 rounded"
          >
            Refresh
          </button>
        </form>
      </div>

      {/* MODAL */}
      {viewModal && (
        <View
          data={selectedCategory}
          onClose={() => setViewModal(false)}
        />
      )}
    </div>
  );
}