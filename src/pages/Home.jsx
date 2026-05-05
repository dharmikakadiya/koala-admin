import { ArrowRight, Boxes, LayoutDashboard, Package2 } from "lucide-react";
import { Link } from "react-router-dom";

function QuickCard({ title, description, icon, to }) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm ring-1 ring-slate-60 hover:bg-white "
    >
      <div className="flex items-start justify-between gap-4 ">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{description}</div>
        </div>
        <div className="rounded-xl bg-indigo-50 p-2 text-stone-600 ring-1 ring-indigo-100">
          {icon}
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-600">
        Open <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div>
      <div className="mb-6">
        <div className="text-2xl font-bold text-slate-900">Home</div>
       
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <QuickCard
          title="Dashboard"
          description="Stats, charts, activity overview."
          to="/dashboard"
          icon={<LayoutDashboard size={18} />}
        />
        <QuickCard
          title="Categories"
          description="Create, edit and manage categories."
          to="/categories"
          icon={<Boxes size={18} />}
        />
        <QuickCard
          title="Products"
          description="Manage product list, pricing and stock."
          to="/products"
          icon={<Package2 size={18} />}
        />
      </div>
    </div>
  );
}

