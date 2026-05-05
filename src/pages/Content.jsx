import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";

function Field({ label, value, onChange, placeholder }) {
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

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}

export default function Content() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [secondaryBanner, setSecondaryBanner] = useState({
    title: "",
    subtitle: "",
    buttonText: "",
    videoUrl: "",
  });
  const [modularBanner, setModularBanner] = useState({
    title: "",
    subtitle: "",
    buttonText: "",
    videoUrl: "",
    posterUrl: "",
  });

  const [features, setFeatures] = useState([]);
  const [impacts, setImpacts] = useState([]);

  const [newFeature, setNewFeature] = useState({
    title: "",
    description: "",
    img: "",
  });
  const [newImpact, setNewImpact] = useState({
    title: "",
    description: "",
    img: "",
  });

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const [sb, mb, f, im] = await Promise.all([
        api.get("/secondaryBanner"),
        api.get("/modularBanner"),
        api.get("/features"),
        api.get("/impacts"),
      ]);
      setSecondaryBanner(sb || {});
      setModularBanner(mb || {});
      setFeatures(Array.isArray(f) ? f : []);
      setImpacts(Array.isArray(im) ? im : []);
    } catch (e) {
      setError(e?.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSecondaryBanner = async () => {
    setError("");
    try {
      await api.put("/secondaryBanner", secondaryBanner);
    } catch (e) {
      setError(e?.message || "Failed to save secondary banner");
    }
  };

  const saveModularBanner = async () => {
    setError("");
    try {
      await api.put("/modularBanner", modularBanner);
    } catch (e) {
      setError(e?.message || "Failed to save modular banner");
    }
  };

  const addFeature = async () => {
    const t = newFeature.title.trim();
    if (!t) return;
    setError("");
    try {
      const created = await api.post("/features", {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        title: t,
        description: newFeature.description.trim(),
        img: newFeature.img.trim(),
      });
      setFeatures((p) => [created, ...p]);
      setNewFeature({ title: "", description: "", img: "" });
    } catch (e) {
      setError(e?.message || "Failed to add feature");
    }
  };

  const saveFeature = async (row) => {
    setError("");
    try {
      const updated = await api.patch(`/features/${row.id}`, {
        title: row.title,
        description: row.description,
        img: row.img,
      });
      setFeatures((p) => p.map((x) => (x.id === row.id ? updated : x)));
    } catch (e) {
      setError(e?.message || "Failed to save feature");
    }
  };

  const deleteFeature = async (id) => {
    setError("");
    const prev = features;
    setFeatures((p) => p.filter((x) => x.id !== id));
    try {
      await api.del(`/features/${id}`);
    } catch (e) {
      setFeatures(prev);
      setError(e?.message || "Failed to delete feature");
    }
  };

  const addImpact = async () => {
    const t = newImpact.title.trim();
    if (!t) return;
    setError("");
    try {
      const created = await api.post("/impacts", {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        title: t,
        description: newImpact.description.trim(),
        img: newImpact.img.trim(),
      });
      setImpacts((p) => [created, ...p]);
      setNewImpact({ title: "", description: "", img: "" });
    } catch (e) {
      setError(e?.message || "Failed to add impact");
    }
  };

  const saveImpact = async (row) => {
    setError("");
    try {
      const updated = await api.patch(`/impacts/${row.id}`, {
        title: row.title,
        description: row.description,
        img: row.img,
      });
      setImpacts((p) => p.map((x) => (x.id === row.id ? updated : x)));
    } catch (e) {
      setError(e?.message || "Failed to save impact");
    }
  };

  const deleteImpact = async (id) => {
    setError("");
    const prev = impacts;
    setImpacts((p) => p.filter((x) => x.id !== id));
    try {
      await api.del(`/impacts/${id}`);
    } catch (e) {
      setImpacts(prev);
      setError(e?.message || "Failed to delete impact");
    }
  };

  const updateFeatureLocal = (id, patch) =>
    setFeatures((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const updateImpactLocal = (id, patch) =>
    setImpacts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-slate-900">Content</div>
          <div className="mt-1 text-sm text-slate-500">
            Manage banners, features and impacts.
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
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900">Secondary Banner</div>
            <button
              onClick={saveSecondaryBanner}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              disabled={loading}
            >
              <Save size={16} />
              Save
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <Field
              label="Title"
              value={secondaryBanner.title ?? ""}
              onChange={(v) => setSecondaryBanner((p) => ({ ...p, title: v }))}
            />
            <TextArea
              label="Subtitle"
              value={secondaryBanner.subtitle ?? ""}
              onChange={(v) =>
                setSecondaryBanner((p) => ({ ...p, subtitle: v }))
              }
            />
            <Field
              label="Button text"
              value={secondaryBanner.buttonText ?? ""}
              onChange={(v) =>
                setSecondaryBanner((p) => ({ ...p, buttonText: v }))
              }
              placeholder="Shop Sofa Beds"
            />
            <Field
              label="Video url"
              value={secondaryBanner.videoUrl ?? ""}
              onChange={(v) =>
                setSecondaryBanner((p) => ({ ...p, videoUrl: v }))
              }
              placeholder="bannervideo.mp4"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900">Modular Banner</div>
            <button
              onClick={saveModularBanner}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              disabled={loading}
            >
              <Save size={16} />
              Save
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <Field
              label="Title"
              value={modularBanner.title ?? ""}
              onChange={(v) => setModularBanner((p) => ({ ...p, title: v }))}
            />
            <TextArea
              label="Subtitle"
              value={modularBanner.subtitle ?? ""}
              onChange={(v) => setModularBanner((p) => ({ ...p, subtitle: v }))}
            />
            <Field
              label="Button text"
              value={modularBanner.buttonText ?? ""}
              onChange={(v) =>
                setModularBanner((p) => ({ ...p, buttonText: v }))
              }
              placeholder="Explore Modular Sofas"
            />
            <Field
              label="Video url"
              value={modularBanner.videoUrl ?? ""}
              onChange={(v) =>
                setModularBanner((p) => ({ ...p, videoUrl: v }))
              }
              placeholder="second.mp4"
            />
            <Field
              label="Poster url"
              value={modularBanner.posterUrl ?? ""}
              onChange={(v) =>
                setModularBanner((p) => ({ ...p, posterUrl: v }))
              }
              placeholder="modular-poster.jpg"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="font-bold text-slate-900">Features</div>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field
                label="Title"
                value={newFeature.title}
                onChange={(v) => setNewFeature((p) => ({ ...p, title: v }))}
              />
              <Field
                label="Image"
                value={newFeature.img}
                onChange={(v) => setNewFeature((p) => ({ ...p, img: v }))}
                placeholder="Washable.webp"
              />
              <button
                type="button"
                onClick={addFeature}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <TextArea
              label="Description"
              value={newFeature.description}
              onChange={(v) => setNewFeature((p) => ({ ...p, description: v }))}
              placeholder="Keep it clean and change up your style."
            />
          </div>

          <div className="mt-5 space-y-3">
            {features.map((x) => (
              <div
                key={x.id}
                className="rounded-2xl border border-slate-200/70 bg-white/60 p-4"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <Field
                    label="Title"
                    value={x.title ?? ""}
                    onChange={(v) => updateFeatureLocal(x.id, { title: v })}
                  />
                  <Field
                    label="Image"
                    value={x.img ?? ""}
                    onChange={(v) => updateFeatureLocal(x.id, { img: v })}
                  />
                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => saveFeature(x)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFeature(x.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <TextArea
                    label="Description"
                    value={x.description ?? ""}
                    onChange={(v) => updateFeatureLocal(x.id, { description: v })}
                  />
                </div>
              </div>
            ))}
            {features.length === 0 && !loading && (
              <div className="text-sm text-slate-500">No features.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="font-bold text-slate-900">Impacts</div>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field
                label="Title"
                value={newImpact.title}
                onChange={(v) => setNewImpact((p) => ({ ...p, title: v }))}
              />
              <Field
                label="Image"
                value={newImpact.img}
                onChange={(v) => setNewImpact((p) => ({ ...p, img: v }))}
                placeholder="koala.webp"
              />
              <button
                type="button"
                onClick={addImpact}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <TextArea
              label="Description"
              value={newImpact.description}
              onChange={(v) => setNewImpact((p) => ({ ...p, description: v }))}
              placeholder="Your order helps us support conservation..."
            />
          </div>

          <div className="mt-5 space-y-3">
            {impacts.map((x) => (
              <div
                key={x.id}
                className="rounded-2xl border border-slate-200/70 bg-white/60 p-4"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <Field
                    label="Title"
                    value={x.title ?? ""}
                    onChange={(v) => updateImpactLocal(x.id, { title: v })}
                  />
                  <Field
                    label="Image"
                    value={x.img ?? ""}
                    onChange={(v) => updateImpactLocal(x.id, { img: v })}
                  />
                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => saveImpact(x)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteImpact(x.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <TextArea
                    label="Description"
                    value={x.description ?? ""}
                    onChange={(v) => updateImpactLocal(x.id, { description: v })}
                  />
                </div>
              </div>
            ))}
            {impacts.length === 0 && !loading && (
              <div className="text-sm text-slate-500">No impacts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

