import { Plus, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import View from "./viewCategories";
import { RiDeleteBin6Line } from "react-icons/ri";
import { GrFormView } from "react-icons/gr";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [editing, setEditing] = useState(null);

  const [viewModal, setViewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const slug = useMemo(
    () =>
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-"),
    [name]
  );

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

  // ✅ Add Category with FormData
  const addCategory = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;

    setError("");
    try {
      const formData = new FormData();
      formData.append("id", crypto?.randomUUID?.() ?? String(Date.now()));
      formData.append("title", n);
      formData.append("categories", JSON.stringify([]));
      if (image) {
        formData.append("image", image);
      }

      const created = await api.post("/featuredCategories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setItems((prev) => [created, ...prev]);
      setName("");
      setImage(null);
    } catch (e) {
      setError(e?.message || "Failed to add category");
    }
  };

  // ✅ Update Category with FormData
  const updateCategory = async (e) => {
    e.preventDefault();
    if (!editing) return;

    try {
      const formData = new FormData();
      formData.append("title", name);
      if (image) {
        formData.append("image", image);
      }

      const updated = await api.put(`/featuredCategories/${editing.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setItems((prev) =>
        prev.map((x) => (x.id === editing.id ? updated : x))
      );
      setEditing(null);
      setName("");
      setImage(null);
    } catch (e) {
      setError(e?.message || "Failed to update category");
    }
  };

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
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">SubCategories</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-t">
                    {/* ✅ Image */}
                    <td className="px-4 py-3">
                      {c.image ? (
                        <img
                          src={
                            c.image.startsWith("http")
                              ? c.image
                              : `${import.meta.env.VITE_API_URL}/${c.image}`
                          }
                          alt={c.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-semibold">{c.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {Array.isArray(c.categories) ? c.categories.length : 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {/* View */}
                      <button
                        onClick={() => {
                          setSelectedCategory(c);
                          setViewModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-100 text-stone-700 rounded"
                      >
                        <GrFormView size={20} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditing(c);
                          setName(c.title);
                          setImage(null);
                        }}
                        className="px-3 py-1 bg-yellow-100 text-stone-700 rounded"
                      >
                        Edit
                      </button>

                      {/* Delete */}
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
                  <td colSpan={4} className="text-center py-6">
                    No categories yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <div className="text-lg font-bold">
          {editing ? "Edit Category" : "Add Category"}
        </div>

        <form
          onSubmit={editing ? updateCategory : addCategory}
          className="mt-4 space-y-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full border px-3 py-2 rounded"
          />

          <input
            value={slug}
            readOnly
            className="w-full border px-3 py-2 rounded bg-gray-50"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full border px-3 py-2 rounded"
          />

          {/* ✅ Preview */}
          {image && (
            <img
              src={URL.createObjectURL(image)}
              alt="preview"
              className="w-20 h-20 object-cover rounded mt-2"
            />
          )}

          <button className="w-full bg-stone-500 text-white py-2 rounded flex justify-center gap-2">
            <Plus /> {editing ? "Update" : "Add"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setName("");
                setImage(null);
              }}
              className="w-full border py-2 rounded"
            >
              Cancel Edit
            </button>
          )}

<button
            type="button"
            onClick={load}
            className="w-full border py-2 rounded"
          >
            Refresh List
          </button>
        </form>
      </div>

      {/* VIEW MODAL */}
      {viewModal && selectedCategory && (
        <View
          category={selectedCategory}
          onClose={() => {
            setViewModal(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
}
