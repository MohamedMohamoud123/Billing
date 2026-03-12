import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Check, ChevronDown, HelpCircle, Image as ImageIcon, PlusCircle, Search, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrganizationBranding } from "../../../../hooks/useOrganizationBranding";
import { taxesAPI, unitsAPI } from "../../../../services/api";
import CreateAccountModal from "../../../settings/organization-settings/setup-configurations/opening-balances/CreateAccountModal";
import ManageUnitsModal from "./modals/ManageUnitsModal";

interface NewItemFormProps {
  onCancel: () => void;
  onCreate: (data: any, selectedTagIds: string[]) => Promise<void>;
  baseCurrency?: any;
  initialData?: any;
  formTitle?: string;
}

const BUILTIN_UNITS = ["cm", "dz", "ft", "g", "in", "kg", "km", "lb", "mg", "ml", "m", "pcs"];
const SALES_ACCOUNTS = [
  "Income",
  "Discount",
  "General Income",
  "Interest Income",
  "Late Fee Income",
  "Other Charges",
  "Sales",
  "Shipping Charge",
];

const TAX_GROUP_MARKER = "__taban_tax_group__";

const normalizeTaxOptions = (rows: any[]) =>
  rows
    .filter((tax) => {
      if (!tax) return false;
      if (tax.isActive === false) return false;
      if (tax.description === TAX_GROUP_MARKER) return false;
      if (tax.isGroup === true || String(tax.type || "").toLowerCase() === "group") return false;
      return true;
    })
    .map((tax) => {
      const name = String(tax.name || tax.taxName || "").trim();
      const rate = Number(tax.rate ?? tax.taxRate ?? 0);
      if (!name) return "";
      const safeRate = Number.isFinite(rate) ? rate : 0;
      return `${name} [${safeRate}%]`;
    })
    .filter(Boolean);

type DropdownOption = {
  value: string;
  label: string;
};

type SearchableDropdownProps = {
  value: string;
  options: Array<string | DropdownOption>;
  onChange: (value: string) => void;
  placeholder: string;
  accentColor: string;
  groupLabel?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
};

const SearchableDropdown = ({
  value,
  options,
  onChange,
  placeholder,
  accentColor,
  groupLabel,
  addNewLabel,
  onAddNew,
}: SearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
  const selected = normalizedOptions.find((opt) => opt.value === value);
  const filtered = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-[34px] w-full rounded border border-gray-300 px-3 text-left text-[13px] transition-colors hover:border-gray-400"
        style={open ? { borderColor: accentColor } : {}}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={selected ? "text-[#1f2937]" : "text-[#6b7280]"}>{selected?.label || placeholder}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} style={{ color: accentColor }} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[140] mt-1 w-full rounded-xl border border-[#d6dbe8] bg-white p-2 shadow-xl">
          <div className="mb-2 flex items-center gap-2 rounded-lg border bg-white px-3 py-2" style={{ borderColor: accentColor }}>
            <Search size={14} className="text-[#94a3b8]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full border-none bg-transparent text-[13px] text-[#334155] outline-none"
            />
          </div>

          {groupLabel ? <div className="px-2 pb-1 text-[13px] font-semibold text-[#475569]">{groupLabel}</div> : null}

          <div className="max-h-56 overflow-y-auto rounded-lg bg-white">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-[#94a3b8]">No options found</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                    onMouseEnter={() => setHoveredValue(opt.value)}
                    onMouseLeave={() => setHoveredValue(null)}
                    className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] text-[#334155] transition-colors last:mb-0"
                    style={isSelected || hoveredValue === opt.value ? { backgroundColor: accentColor, color: "#ffffff" } : {}}
                  >
                    <span>{opt.label}</span>
                    {isSelected ? <Check size={14} className="text-white" /> : null}
                  </button>
                );
              })
            )}
          </div>

          {onAddNew && addNewLabel ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearchTerm("");
                onAddNew();
              }}
              className="mt-2 flex w-full items-center gap-2 border-t border-[#e2e8f0] px-2 pt-2 text-[13px]"
              style={{ color: accentColor }}
            >
              <PlusCircle size={14} />
              {addNewLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

const Label = ({ children, required = false, tooltip, dotted = false }: any) => (
  <div className="flex items-center gap-1 text-[13px]">
    <span className={`${required ? "text-[#ef4444]" : "text-gray-700"}`}>
      {children}
      {required ? "*" : ""}
    </span>
    {tooltip && <HelpCircle size={14} className="cursor-help text-gray-400" />}
  </div>
);

export default function NewItemForm({ onCancel, onCreate, baseCurrency, initialData, formTitle = "New Item" }: NewItemFormProps) {
  const navigate = useNavigate();
  const { accentColor } = useOrganizationBranding();
  const currencyCode = baseCurrency?.symbol || baseCurrency?.code || "AMD";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [extraSalesAccounts, setExtraSalesAccounts] = useState<string[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    type: (initialData?.type === "Service" ? "Service" : "Goods") as "Goods" | "Service",
    unit: initialData?.unit || "",
    sku: initialData?.sku || "",
    sellingPrice: initialData?.sellingPrice?.toString() || "",
    salesAccount: initialData?.salesAccount || "Sales",
    salesTax: initialData?.salesTax || (initialData?.taxInfo ? `${initialData.taxInfo.taxName} [${initialData.taxInfo.taxRate}%]` : ""),
    salesDescription: initialData?.salesDescription || initialData?.description || "",
  });
  const [taxOptions, setTaxOptions] = useState<string[]>([]);

  const [images, setImages] = useState<string[]>(
    Array.isArray(initialData?.images)
      ? initialData.images
      : initialData?.image
        ? [initialData.image]
        : []
  );

  const inputBaseClass = "h-[34px] w-full rounded border border-gray-300 px-3 text-[13px] outline-none focus:border-blue-400 transition-all";
  const selectBaseClass = "h-[34px] w-full appearance-none rounded border border-gray-300 bg-white px-3 pr-8 text-[13px] outline-none focus:border-blue-400 cursor-pointer";
  const dedupeOptions = (rows: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    rows.forEach((value) => {
      const trimmed = String(value || "").trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(trimmed);
    });
    return out;
  };
  const salesAccountOptions = dedupeOptions([form.salesAccount, ...SALES_ACCOUNTS, ...extraSalesAccounts]);
  const mergedTaxOptions = dedupeOptions([form.salesTax, ...taxOptions]);
  const mergedUnitOptions = dedupeOptions([form.unit, ...BUILTIN_UNITS, ...unitOptions]);

  useEffect(() => {
    let mounted = true;

    const loadTaxes = async () => {
      try {
        const response: any = await taxesAPI.getAll({ limit: 1000 });
        const apiRows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        let options = normalizeTaxOptions(apiRows);

        if (options.length === 0) {
          const settingsRows = JSON.parse(localStorage.getItem("taban_settings_taxes_v1") || "[]");
          if (Array.isArray(settingsRows)) {
            options = normalizeTaxOptions(settingsRows);
          }
        }

        if (mounted) {
          setTaxOptions(Array.from(new Set(options)));
        }
      } catch (error) {
        console.error("Failed to load taxes", error);
      }
    };

    const fetchUnits = async () => {
      try {
        const response: any = await unitsAPI.getAll();
        const apiUnits = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        if (mounted) {
          setUnitOptions(apiUnits.map((u: any) => u.name).filter(Boolean));
        }
      } catch (err) {
        console.warn("Failed to fetch units", err);
      }
    };

    loadTaxes();
    fetchUnits();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshUnits = async () => {
    try {
      const response: any = await unitsAPI.getAll();
      const apiUnits = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setUnitOptions(apiUnits.map((u: any) => u.name).filter(Boolean));
    } catch (err) {
      console.warn("Failed to fetch units", err);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImages([String(reader.result || "")]);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleChange = (e: any) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!form.sku.trim()) {
      toast.error("SKU is required.");
      return;
    }
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) {
      toast.error("Selling Price must be greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      await onCreate(
        {
          type: form.type,
          name: form.name.trim(),
          unit: form.unit.trim(),
          sku: form.sku.trim(),
          sellingPrice: Number(form.sellingPrice),
          salesAccount: form.salesAccount || "Sales",
          salesTax: form.salesTax || "",
          salesDescription: form.salesDescription || "",
          description: form.salesDescription || "",
          rate: Number(form.sellingPrice),
          images,
          currency: currencyCode,
          active: initialData?.active ?? true,
          status: initialData?.status || "Active",
        },
        []
      );
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error("Failed to save item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-98px)] flex-col bg-white">

      {/* HEADER: Fixed at top */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-normal text-gray-800">{formTitle}</h1>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="bg-white">
        <div className="max-w-[1120px] px-6 py-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">

            {/* Left Inputs */}
            <div className="space-y-6">
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label required>Name</Label>
                <input name="name" value={form.name} onChange={handleChange} className={inputBaseClass} />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label tooltip="Select Type">Type</Label>
                <div className="flex gap-6 text-[13px]">
                  {["Goods", "Service"].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="type" value={t} checked={form.type === t} onChange={handleChange} className="accent-[#1b5e6a] w-4 h-4 cursor-pointer" />
                      <span className="group-hover:text-gray-900 transition-colors">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label tooltip="Select Unit">Unit</Label>
                <SearchableDropdown
                  value={form.unit}
                  options={mergedUnitOptions}
                  onChange={(value) => setForm((prev) => ({ ...prev, unit: value }))}
                  placeholder="Select or type to add"
                  accentColor={accentColor}
                  addNewLabel="Manage Units"
                  onAddNew={() => setIsUnitModalOpen(true)}
                />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label required dotted tooltip="SKU Number">SKU</Label>
                <input name="sku" value={form.sku} onChange={handleChange} className={inputBaseClass} />
              </div>
            </div>

            {/* Right Column Image Section */}
            <div className="flex justify-start lg:justify-end">
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />

              {images.length > 0 ? (
                <div className="w-full lg:w-[320px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="h-[200px] w-full flex items-center justify-center bg-[#f3f4f6]">
                    <img src={images[0]} alt="Preview" className="max-h-[90%] max-w-[90%] object-contain" />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[13px] text-blue-600 font-medium hover:text-blue-700"
                    >
                      Change Image
                    </button>
                    <button type="button" onClick={() => setImages([])} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[210px] lg:w-[320px] border-2 border-dashed border-gray-200 rounded-lg bg-[#f9fafb] flex flex-col items-center justify-center cursor-pointer transition-all group"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3 group-hover:border-blue-100 transition-all">
                    <ImageIcon size={32} strokeWidth={1.5} className="text-gray-400" />
                  </div>
                  <p className="text-[13px] text-gray-500">Drag image(s) here or</p>
                  <p className="text-[13px] text-blue-600 font-medium">Browse images</p>
                </div>
              )}
            </div>
          </div>

          {/* Sales Information */}
          <div className="mt-8">
            <h2 className="mb-6 border-b border-gray-50 pb-2 text-[15px] font-medium text-gray-800">Sales Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-6">
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label required dotted>Selling Price</Label>
                <div className="flex">
                  <span className="h-[34px] flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 text-[12px] text-gray-500 rounded-l">{currencyCode}</span>
                  <input name="sellingPrice" type="number" value={form.sellingPrice} onChange={handleChange} className={`${inputBaseClass} rounded-l-none`} />
                </div>
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label required dotted>Account</Label>
                <SearchableDropdown
                  value={form.salesAccount}
                  options={salesAccountOptions}
                  onChange={(value) => setForm((prev) => ({ ...prev, salesAccount: value }))}
                  placeholder="Select Account"
                  accentColor={accentColor}
                  groupLabel="Income"
                  addNewLabel="Add New Account"
                  onAddNew={() => setIsAccountModalOpen(true)}
                />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-start gap-4">
                <Label>Description</Label>
                <textarea
                  name="salesDescription"
                  value={form.salesDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded p-2 text-[13px] outline-none focus:border-blue-400 resize-none transition-all"
                />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label tooltip="Select Tax">Tax</Label>
                <SearchableDropdown
                  value={form.salesTax}
                  options={mergedTaxOptions}
                  onChange={(value) => setForm((prev) => ({ ...prev, salesTax: value }))}
                  placeholder="Select a Tax"
                  accentColor={accentColor}
                  addNewLabel="Add New Tax"
                  onAddNew={() => navigate("/settings/taxes/new")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 border-t bg-[#f9fafb] px-6 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="text-white px-6 py-1.5 rounded text-[13px] font-medium hover:opacity-90 shadow-sm active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button onClick={onCancel} className="bg-white border border-gray-300 text-gray-700 px-6 py-1.5 rounded text-[13px] font-medium hover:bg-gray-50 active:scale-95 transition-all">
            Cancel
          </button>
        </div>
      </div>

      {isAccountModalOpen && (
        <CreateAccountModal
          accountType="Income"
          onClose={() => setIsAccountModalOpen(false)}
          onSave={(account) => {
            const accountName = String(account?.accountName || account?.name || "").trim();
            if (!accountName) return;
            setExtraSalesAccounts((prev) => Array.from(new Set([...prev, accountName])));
            setForm((prev) => ({ ...prev, salesAccount: accountName }));
            setIsAccountModalOpen(false);
          }}
        />
      )}

      <ManageUnitsModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onUnitsChanged={refreshUnits}
      />
    </div>
  );
}
