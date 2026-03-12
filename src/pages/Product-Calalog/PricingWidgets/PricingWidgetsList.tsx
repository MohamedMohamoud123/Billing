import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NewPricingWidgetModal from "./components/NewPricingWidgetModal";
import { createPricingWidget, deletePricingWidget, readPricingWidgets } from "./storage";
import type { PricingWidgetRecord } from "./types";
import { buildCloneName } from "../utils/cloneName";

type SortOrder = "asc" | "desc";

const formatDate = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getCreatedBy = (row: PricingWidgetRecord) => String(row.createdBy || "").trim() || "-";

export default function PricingWidgetsPage() {
  const navigate = useNavigate();
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [rows, setRows] = useState<PricingWidgetRecord[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setRows(readPricingWidgets());
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('[data-row-menu-root="true"]')) {
        setOpenRowMenuId(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const left = new Date(a.updatedAt || "").getTime();
      const right = new Date(b.updatedAt || "").getTime();
      const safeLeft = Number.isFinite(left) ? left : 0;
      const safeRight = Number.isFinite(right) ? right : 0;
      return sortOrder === "asc" ? safeLeft - safeRight : safeRight - safeLeft;
    });
    return sorted;
  }, [rows, sortOrder]);

  const openEditor = (row: PricingWidgetRecord) => {
    setOpenRowMenuId(null);
    navigate(
      `/products/pricing-widgets/new?widgetId=${encodeURIComponent(row.id)}&name=${encodeURIComponent(row.name)}&product=${encodeURIComponent(
        row.product
      )}&template=${encodeURIComponent(row.template || "Modern")}`
    );
  };

  const onCopyCode = async (row: PricingWidgetRecord) => {
    const snippet = `<div id="pricing-widget-${row.id}"></div>\n<script src="https://app.example.com/embed/pricing-widget.js" data-widget-id="${row.id}"></script>`;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Embed code copied");
    } catch {
      toast.error("Unable to copy code");
    }
  };

  const onClone = (row: PricingWidgetRecord) => {
    const cloned = createPricingWidget({
      name: buildCloneName(
        row.name,
        rows.map((currentRow) => currentRow.name),
        "Pricing Widget"
      ),
      product: row.product,
      createdBy: row.createdBy,
      template: row.template,
      status: row.status,
      selectedPlans: row.selectedPlans,
      caption: row.caption,
      buttonLabel: row.buttonLabel,
      buttonColor: row.buttonColor,
    });
    setRows((prev) => [cloned, ...prev]);
    setOpenRowMenuId(null);
    toast.success("Pricing widget cloned");
  };

  const onDelete = (id: string) => {
    if (!window.confirm("Delete this pricing widget?")) return;
    const updated = deletePricingWidget(id);
    setRows(updated);
    setOpenRowMenuId(null);
    toast.success("Pricing widget deleted");
  };

  return (
    <div className="flex min-h-[calc(100vh-98px)] flex-col border border-[#d8deea] bg-white">
      <div className="flex items-center justify-between border-b border-[#d8deea] px-6 py-4">
        <h1 className="text-[32px] font-semibold leading-none text-[#111827]">Pricing Widgets</h1>
        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-b-[4px] border-[#0D4A52] px-4 py-1.5 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] hover:border-b-[6px] hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] active:brightness-90"
          style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
        >
          <Plus size={16} /> New
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-[#d8deea] bg-[#f8fafc]">
            <tr className="text-[13px] font-semibold uppercase tracking-wide text-[#5f7194]">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Created By</th>
              <th className="px-6 py-3">
                <button
                  type="button"
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide text-[#5f7194]"
                >
                  Last Modified Date
                  <ArrowUpDown size={12} className="text-[#2563eb]" />
                </button>
              </th>
              <th className="w-[260px] px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d8deea]">
            {sortedRows.map((row) => (
              <tr key={row.id} className="group bg-white hover:bg-[#f8fafc]">
                <td className="px-6 py-5 text-[14px]">
                  <button type="button" onClick={() => openEditor(row)} className="text-[#2563eb] hover:underline">
                    {row.name || "-"}
                  </button>
                </td>
                <td className="px-6 py-5 text-[14px] text-[#111827]">{row.product || "-"}</td>
                <td className="px-6 py-5 text-[14px] text-[#111827]">{getCreatedBy(row)}</td>
                <td className="px-6 py-5 text-[14px] text-[#111827]">{formatDate(row.updatedAt)}</td>
                <td className="px-6 py-5 text-right">
                  <div
                    data-row-menu-root="true"
                    className={`relative inline-flex items-center gap-4 transition-opacity ${
                      openRowMenuId === row.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onCopyCode(row)}
                      className="inline-flex items-center gap-1 text-[14px] text-[#2563eb] hover:underline"
                    >
                      Copy Code
                      <Copy size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenRowMenuId((prev) => (prev === row.id ? null : row.id))}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#23b26d] text-white"
                    >
                      <ChevronDown size={14} />
                    </button>

                    {openRowMenuId === row.id ? (
                      <div className="absolute right-0 top-9 z-20 w-[132px] overflow-hidden rounded-lg border border-[#d8deea] bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => openEditor(row)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-[#2563eb] hover:bg-[#3b82f6] hover:text-white"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onClone(row)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-[#1e293b] hover:bg-[#f1f5f9]"
                        >
                          <Copy size={14} />
                          Clone
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-[#2563eb] hover:bg-[#f1f5f9]"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewPricingWidgetModal open={isNewOpen} onClose={() => setIsNewOpen(false)} />
    </div>
  );
}
