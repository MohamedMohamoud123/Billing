import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  Plus,
  MoreHorizontal,
  RefreshCw,
  Download,
  Settings,
  X,
  Edit,
  Info,
  User,
} from "lucide-react";
import { salespersonsAPI } from "../../../services/api";

const parseShortDate = (value?: string) => {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return "";
  const day = match[1].padStart(2, "0");
  const monthMap: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  const month = monthMap[match[2]];
  if (!month) return "";
  return `${match[3]}-${month}-${day}`;
};

export default function SubscriptionDetailPage() {
  const navigate = useNavigate();
  const { subscriptionId } = useParams();
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [detailMoreOpen, setDetailMoreOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const raw = localStorage.getItem("taban_subscriptions_v1");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false);
  const [isUpdateSalespersonOpen, setIsUpdateSalespersonOpen] = useState(false);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState("");
  const [coupons, setCoupons] = useState<Array<{ id: string; couponName: string; couponCode: string }>>([]);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "invoice" | "activity">("overview");
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const detailMoreRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    if (!subscriptions.length) return null;
    if (subscriptionId) {
      return subscriptions.find((sub: any) => sub.id === subscriptionId) || subscriptions[0];
    }
    return subscriptions[0];
  }, [subscriptionId, subscriptions]);
  const selectedCount = selectedIds.length;
  const isAllSelected = selectedCount > 0 && selectedIds.length === subscriptions.length;
  const statusText = String(selected?.status || "LIVE").toUpperCase();
  const statusClass =
    statusText === "UNPAID"
      ? "bg-red-100 text-red-600"
      : statusText === "CANCELLED" || statusText === "CANCELED"
      ? "bg-red-100 text-red-600"
      : "bg-[#e6f7f1] text-[#10a37f]";
  const listStatusClass = (status: string) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "UNPAID") return "text-red-500";
    if (normalized === "CANCELLED" || normalized === "CANCELED") return "text-red-500";
    if (normalized === "EXPIRED") return "text-gray-500";
    return "text-[#10a37f]";
  };
  const hasSelection = !!selected;
  const normalizeAddress = (addr: any) => {
    if (!addr || typeof addr !== "object") return null;
    const keys = [
      "attention",
      "country",
      "street1",
      "street2",
      "city",
      "state",
      "zipCode",
      "phone",
      "fax",
      "phoneNumber",
      "mobile",
      "mobilePhone",
    ];
    const hasValue = keys.some((key) => String(addr?.[key] || "").trim());
    return hasValue ? addr : null;
  };
  const billingAddress = normalizeAddress(selected?.billingAddress);
  const shippingAddress = normalizeAddress(selected?.shippingAddress);
  const customerEmail =
    String(selected?.customerEmail || selected?.contactPersons?.[0]?.email || "").trim();
  const salespersonName = useMemo(() => {
    const id = String(selected?.salesperson || selected?.salespersonId || "");
    if (!id) return "";
    const match = salespersons.find(
      (sp) => String(sp?._id || sp?.id || sp?.name) === id
    );
    return String(match?.name || match?.displayName || id).trim();
  }, [selected?.salesperson, selected?.salespersonId, salespersons]);

  const readRows = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
      if (detailMoreRef.current && !detailMoreRef.current.contains(e.target as Node)) {
        setDetailMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("taban_subscriptions_v1");
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          setSubscriptions(parsed);
          return;
        }
      } catch {
        // ignore storage errors
      }
      setSubscriptions([]);
    };
    load();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "taban_subscriptions_v1") load();
    };
    const onFocus = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!isAddChargeOpen || !selected) return;
    const raw = String(selected.amount || "");
    const numeric = raw.replace(/[^\d.]/g, "");
    setChargeAmount(numeric || "");
  }, [isAddChargeOpen, selected]);

  useEffect(() => {
    const loadCoupons = () => {
      try {
        const rows = readRows("inv_coupons_v1");
        const mapped = rows
          .map((row: any, idx: number) => ({
            id: String(row?.id || row?._id || `coupon-${idx}`),
            couponName: String(row?.couponName || row?.name || "").trim(),
            couponCode: String(row?.couponCode || row?.code || "").trim(),
          }))
          .filter((row: any) => row.couponName && row.couponCode);
        setCoupons(mapped);
      } catch {
        setCoupons([]);
      }
    };
    loadCoupons();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "inv_coupons_v1") loadCoupons();
    };
    const onFocus = () => loadCoupons();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const loadSalespersons = async () => {
      try {
        const response = await salespersonsAPI.getAll({ limit: 10000 });
        const rows = Array.isArray(response?.data) ? response.data : [];
        setSalespersons(rows);
      } catch {
        setSalespersons([]);
      }
    };
    loadSalespersons();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "taban_books_salespersons") loadSalespersons();
    };
    const onFocus = () => loadSalespersons();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <div className="flex h-full bg-white font-sans text-gray-800 antialiased">
      <div className="w-[320px] border-r border-gray-200 flex flex-col">
        {selectedCount === 0 && (
          <div className="flex items-center justify-between px-6 border-b border-gray-100 bg-white h-[60px] shrink-0">
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <h1 className="text-[17px] font-bold text-slate-900">All Subscriptions</h1>
              <ChevronDown
                size={16}
                className={`text-blue-500 transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {filterDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] py-2">
                {["All Subscriptions", "Active", "Pending", "Cancelled", "Expired"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setFilterDropdownOpen(false)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    {view}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/sales/subscriptions/new")}
              className="flex items-center gap-1 bg-[#10a37f] hover:bg-[#0e8a6b] text-white px-3 py-1.5 rounded-md text-sm font-semibold transition-all shadow-sm"
            >
              <Plus size={16} />
            </button>
            <div className="relative" ref={moreDropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <MoreHorizontal size={16} className="text-gray-500" />
              </button>
              {moreDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <RefreshCw size={14} /> Refresh
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Download size={14} /> Export
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings size={14} /> Subscriptions Preferences
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        <div className="flex-1 overflow-auto">
          {selectedCount > 0 && (
            <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(subscriptions.map((row: any) => row.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                Bulk Actions
              </label>
              <button className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700">
                Bulk Actions
              </button>
              <div className="h-5 w-px bg-gray-200" />
              <span className="text-sm text-gray-700">
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  {selectedCount}
                </span>{" "}
                Selected
              </span>
              <button
                className="ml-auto text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedIds([])}
                aria-label="Clear selection"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="divide-y divide-gray-100">
          {subscriptions.map((sub: any) => (
            <button
              key={sub.id}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50/60 transition-colors ${
                sub.id === selected?.id ? "bg-[#f5f7fb]" : ""
              }`}
              onClick={() => navigate(`/sales/subscriptions/${sub.id}`)}
            >
              <div className="pt-1">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={selectedIds.includes(sub.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => {
                    setSelectedIds((prev) =>
                      prev.includes(sub.id) ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
                    );
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{sub.customerName}</span>
                  <span className="text-sm font-semibold text-slate-900">{sub.amount}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Next Renewal on {sub.nextBillingOn}</div>
                <span className={`inline-flex text-[11px] font-bold tracking-wide mt-2 ${listStatusClass(sub.status)}`}>
                  {String(sub.status || "").toUpperCase() || "LIVE"}
                </span>
              </div>
            </button>
          ))}
          </div>
        </div>
      </div>

      {hasSelection ? (
      <div className="flex-1 overflow-auto">
        <div className="flex items-start justify-between px-8 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900">
              {selected.customerName} - {selected.planName} (DD)
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>#{selected.subscriptionNumber}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusClass}`}>{statusText}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1"
              onClick={() => {
                const amountText = String(selected?.amount || "");
                const currencyMatch = amountText.match(/^[A-Za-z]+/);
                const currency = currencyMatch ? currencyMatch[0] : "USD";
                const price = Number(amountText.replace(/[^\d.]/g, "")) || 0;
                const draft = {
                  id: String(selected?.id || ""),
                  customerId: String(selected?.customerId || ""),
                  customerName: String(selected?.customerName || ""),
                  contactPersons: Array.isArray(selected?.contactPersons)
                    ? selected.contactPersons
                    : selected?.customerEmail
                    ? [{ email: selected.customerEmail }]
                    : [],
                  billingAddress: selected?.billingAddress ?? null,
                  shippingAddress: selected?.shippingAddress ?? null,
                  currency,
                  productId: String(selected?.productId || ""),
                  productName: String(selected?.productName || selected?.planName || ""),
                  planName: String(selected?.planName || ""),
                  planDescription: String(selected?.planDescription || ""),
                  quantity: Number(selected?.quantity || 1) || 1,
                  price,
                  basePrice: Number(selected?.basePrice || 0) || 0,
                  tax: String(selected?.tax || ""),
                  taxRate: Number(selected?.taxRate || 0) || 0,
                  taxPreference: String(selected?.taxPreference || "Tax Exclusive"),
                  contentType: String(selected?.contentType || "product"),
                  items: Array.isArray(selected?.items) ? selected.items : [],
                  customerNotes: String(selected?.customerNotes || ""),
                  tag: String(selected?.tag || ""),
                  reportingTags: Array.isArray(selected?.reportingTags) ? selected.reportingTags : [],
                  startDate: parseShortDate(selected?.activatedOn || ""),
                  coupon: String(selected?.coupon || ""),
                  couponCode: String(selected?.couponCode || ""),
                  couponValue: String(selected?.couponValue || ""),
                  addonLines: Array.isArray(selected?.addonLines) ? selected.addonLines : [],
                  priceListId: String(selected?.priceListId || ""),
                  priceListName: String(selected?.priceListName || ""),
                  location: String(selected?.location || ""),
                  subscriptionNumber: String(selected?.subscriptionNumber || ""),
                  referenceNumber: String(selected?.referenceNumber || ""),
                  salesperson: String(selected?.salesperson || selected?.salespersonId || ""),
                  meteredBilling: Boolean(selected?.meteredBilling ?? false),
                  paymentMode: String(selected?.paymentMode || "offline"),
                  paymentTerms: String(selected?.paymentTerms || "Due on Receipt"),
                  partialPayments: Boolean(selected?.partialPayments ?? false),
                  prorateCharges: Boolean(selected?.prorateCharges ?? true),
                  generateInvoices: Boolean(selected?.generateInvoices ?? true),
                  invoiceTemplate: String(selected?.invoiceTemplate || "Standard Template"),
                  roundOffPreference: String(selected?.roundOffPreference || "No Rounding"),
                  createdOn: String(selected?.createdOn || ""),
                  activatedOn: String(selected?.activatedOn || ""),
                  lastBilledOn: String(selected?.lastBilledOn || ""),
                  nextBillingOn: String(selected?.nextBillingOn || ""),
                  status: String(selected?.status || ""),
                };
                navigate(`/sales/subscriptions/${selected?.id || "unknown"}/edit`, { state: { draft } });
              }}
            >
              <Edit size={14} />
              Edit
            </button>
            <div className="relative" ref={detailMoreRef}>
              <button
                onClick={() => setDetailMoreOpen(!detailMoreOpen)}
                className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1"
              >
                More <ChevronDown size={14} />
              </button>
              {detailMoreOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-xl z-[20] overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-white bg-[#3b82f6] hover:bg-[#2563eb]"
                    onClick={() => {
                      setDetailMoreOpen(false);
                      setIsAddCouponOpen(true);
                    }}
                  >
                    Add Coupon
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Add One Time Addon
                  </button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setDetailMoreOpen(false);
                      setIsAddChargeOpen(true);
                    }}
                  >
                    Add Charge
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Create Quote
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Update Custom Fields
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Disable Metered Billing
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Cancel Subscription
                  </button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (!selected?.id) return;
                      const ok = window.confirm("Delete this subscription? This action cannot be undone.");
                      if (!ok) return;
                      const updated = subscriptions.filter((row: any) => row.id !== selected.id);
                      setSubscriptions(updated);
                      setSelectedIds((prev) => prev.filter((id) => id !== selected.id));
                      try {
                        localStorage.setItem("taban_subscriptions_v1", JSON.stringify(updated));
                      } catch {
                        // ignore storage errors
                      }
                      setDetailMoreOpen(false);
                      navigate("/sales/subscriptions");
                    }}
                  >
                    Delete Subscription
                  </button>
                </div>
              )}
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => navigate("/sales/subscriptions")}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-8 border-b border-gray-200">
          <div className="flex gap-6 text-sm">
            {[
              { key: "overview", label: "Overview" },
              { key: "invoice", label: "Invoice History" },
              { key: "activity", label: "Recent Activities" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`py-3 border-b-2 ${
                  activeTab === tab.key ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab.key as "overview" | "invoice" | "activity")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="px-8 py-3">
            <div className="max-w-[1240px] w-full grid grid-cols-[360px_minmax(0,1fr)] gap-8">
              <div className="space-y-4 pr-10 border-r border-gray-200">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Taban Enterprise</h3>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <User size={20} />
                    </div>
                    <div>
                    <div className="text-sm font-semibold text-blue-600">{selected.customerName}</div>
                    <div className="text-xs text-gray-500">{customerEmail}</div>
                  </div>
                </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Address</h3>
                  <div className="mt-3 text-sm text-gray-700 space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Billing Address</div>
                      {billingAddress ? (
                        <>
                          {billingAddress.attention && (
                            <div className="mt-1 font-semibold text-gray-900">{billingAddress.attention}</div>
                          )}
                          {billingAddress.street1 && <div>{billingAddress.street1}</div>}
                          {billingAddress.street2 && <div>{billingAddress.street2}</div>}
                          {(billingAddress.city || billingAddress.state) && (
                            <div>
                              {[billingAddress.city, billingAddress.state].filter(Boolean).join(", ")}
                            </div>
                          )}
                          {(billingAddress.zipCode || billingAddress.country) && (
                            <div>
                              {[billingAddress.zipCode, billingAddress.country].filter(Boolean).join(" ")}
                            </div>
                          )}
                          {(billingAddress.phone || billingAddress.phoneNumber || billingAddress.mobile || billingAddress.mobilePhone) && (
                            <div>
                              Phone:{" "}
                              {billingAddress.phone ||
                                billingAddress.phoneNumber ||
                                billingAddress.mobile ||
                                billingAddress.mobilePhone}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">No billing address saved.</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Shipping Address</div>
                      {shippingAddress ? (
                        <>
                          {shippingAddress.attention && (
                            <div className="mt-1 font-semibold text-gray-900">{shippingAddress.attention}</div>
                          )}
                          {shippingAddress.street1 && <div>{shippingAddress.street1}</div>}
                          {shippingAddress.street2 && <div>{shippingAddress.street2}</div>}
                          {(shippingAddress.city || shippingAddress.state) && (
                            <div>
                              {[shippingAddress.city, shippingAddress.state].filter(Boolean).join(", ")}
                            </div>
                          )}
                          {(shippingAddress.zipCode || shippingAddress.country) && (
                            <div>
                              {[shippingAddress.zipCode, shippingAddress.country].filter(Boolean).join(" ")}
                            </div>
                          )}
                          {(shippingAddress.phone || shippingAddress.phoneNumber || shippingAddress.mobile || shippingAddress.mobilePhone) && (
                            <div>
                              Phone:{" "}
                              {shippingAddress.phone ||
                                shippingAddress.phoneNumber ||
                                shippingAddress.mobile ||
                                shippingAddress.mobilePhone}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">No shipping address saved.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Subscription Options</h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Subscription ID</span><span className="text-gray-900">8340042000000108287</span></div>
                    <div className="flex justify-between"><span>Subscription Number</span><span className="text-gray-900">{selected.subscriptionNumber}</span></div>
                  <div className="flex justify-between"><span>Autocharge</span><span className="text-gray-900">Disabled</span></div>
                  <div className="flex justify-between"><span>Reference Number</span><span className="text-gray-900">{selected.referenceNumber || "sc"}</span></div>
                  <div className="flex justify-between">
                    <span>Salesperson</span>
                    <button
                      className="text-blue-600"
                      onClick={() => {
                        setSelectedSalespersonId(String(selected?.salesperson || selected?.salespersonId || ""));
                        setIsUpdateSalespersonOpen(true);
                      }}
                    >
                      {salespersonName || "Update"}
                    </button>
                  </div>
                  </div>
                </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">Associated Contacts</h3>
                <div className="mt-3 text-sm text-gray-700">
                  {customerEmail || "No contact email"}
                  <div><button className="text-blue-600 text-xs mt-1">Manage Contact Persons</button></div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">Other Details</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Repeat Every</span><span className="text-gray-900">1 month(s)</span></div>
                  <div className="flex justify-between"><span>Activation Date</span><span className="text-gray-900">{selected.activatedOn}</span></div>
                  <div className="flex justify-between"><span>Current Cycle Start</span><span className="text-gray-900">{selected.lastBilledOn}</span></div>
                  <div className="flex justify-between"><span>Current Cycle End</span><span className="text-gray-900">{selected.nextBillingOn}</span></div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">Customer Notes</h3>
                <div className="mt-3 text-sm text-gray-600">Looking forward for your business.</div>
              </div>
            </div>

              <div className="space-y-6">
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Subscription Amount</div>
                  <div className="text-lg font-semibold text-slate-900">{selected.amount}</div>
                  <div className="text-xs text-gray-500">1 month(s)</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Next Billing Date</div>
                  <div className="text-lg font-semibold text-slate-900">{selected.nextBillingOn}</div>
                  <button className="text-blue-600 text-xs">Change</button>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Last Billing Date</div>
                  <div className="text-lg font-semibold text-slate-900">{selected.lastBilledOn}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-[#22c55e]">Renews Forever</div>
                  <div className="text-lg font-semibold text-slate-900">{"\u221e"}</div>
                </div>
              </div>

              {selected?.priceListName && (
                <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2">
                  <Info size={14} className="text-gray-400" />
                  <span>The applied pricelist is</span>
                  <span className="text-gray-900 font-semibold">{selected.priceListName}</span>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Item Details</h3>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="grid grid-cols-6 bg-gray-50 text-[11px] font-semibold text-slate-500 px-3 py-2 uppercase">
                    <span className="col-span-2">Item Details</span>
                    <span className="text-right">Quantity</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Tax</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="grid grid-cols-6 px-3 py-3 text-sm text-gray-700">
                    <span className="col-span-2 uppercase">{selected.planName}</span>
                    <span className="text-right">1</span>
                    <span className="text-right">{selected.amount}</span>
                    <span className="text-right">-</span>
                    <span className="text-right">{selected.amount}</span>
                  </div>
                  <div className="border-t border-gray-200 px-3 py-3 text-sm text-gray-700 flex justify-end">
                    <div className="w-48 space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Round Off</span>
                        <span>AMD0.00</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Total</span>
                        <span>{selected.amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                  Notes <Info size={12} className="text-gray-400" />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  There are no notes added for this subscription. <button className="text-blue-600">+ Add Note</button>
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {isAddCouponOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40">
            <div className="mt-20 w-full max-w-[520px] bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-[16px] font-semibold text-gray-900">Add Coupon</h3>
                <button
                  className="h-7 w-7 rounded border border-blue-500 text-blue-500 flex items-center justify-center hover:bg-blue-50"
                  onClick={() => setIsAddCouponOpen(false)}
                >
                  {"\u00D7"}
                </button>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600 w-28">Select Coupon</label>
                  <div className="flex-1">
                    <select
                      value={selectedCouponId}
                      onChange={(e) => setSelectedCouponId(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                    >
                      <option value="">Select Coupon</option>
                      {coupons.map((coupon) => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.couponName} ({coupon.couponCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-2">
                <button
                  className="px-4 py-2 bg-[#10a37f] hover:bg-[#0e8a6b] text-white rounded-md text-sm font-semibold"
                  onClick={() => setIsAddCouponOpen(false)}
                >
                  Apply
                </button>
                <button
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm"
                  onClick={() => setIsAddCouponOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddChargeOpen && (
          <div className="fixed inset-0 z-[210] flex items-start justify-center bg-black/40">
            <div className="mt-14 w-full max-w-[720px] bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-[16px] font-semibold text-gray-900">Add Charge</h3>
                <button
                  className="h-7 w-7 rounded text-red-500 flex items-center justify-center hover:bg-red-50"
                  onClick={() => setIsAddChargeOpen(false)}
                >
                  {"\u00D7"}
                </button>
              </div>

              <div className="px-6 py-5">
                <div className="grid grid-cols-[1fr_1.4fr] gap-6 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Customer Name</div>
                      <div className="text-sm font-medium text-gray-900">{selected.customerName}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Subscription#</div>
                    <div className="text-sm font-medium text-gray-900">{selected.subscriptionNumber}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-5">
                  <div>
                    <label className="text-sm text-gray-700">Account</label>
                    <select className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>Sales</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Location</label>
                    <select className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>Head Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-red-500">Amount*</label>
                    <div className="mt-2 flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <span className="text-gray-500">AMD</span>
                      <input
                        className="flex-1 outline-none"
                        placeholder="0.00"
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                      />
                    </div>
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-500">
                      <input type="checkbox" />
                      Allow partial payments
                    </label>
                  </div>
                  <div>
                    <label className="text-sm text-red-500">Reason*</label>
                    <textarea className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="This will be displayed in the line item details of the invoice sent to your customer." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-700">Description</label>
                    <textarea className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="Mention why you are adding this charge." />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Reporting Tags</label>
                    <select className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>None</option>
                    </select>
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Note: An invoice will be generated for this amount and sent to your customer.
                </p>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-2">
                <button className="px-4 py-2 bg-[#10a37f] hover:bg-[#0e8a6b] text-white rounded-md text-sm font-semibold">
                  Charge
                </button>
                <button
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm"
                  onClick={() => setIsAddChargeOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isUpdateSalespersonOpen && (
          <div className="fixed inset-0 z-[220] flex items-start justify-center bg-black/40">
            <div className="mt-16 w-full max-w-[520px] bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-[16px] font-semibold text-gray-900">Update Sales Person</h3>
                <button
                  className="h-6 w-6 rounded text-red-500 flex items-center justify-center hover:bg-red-50"
                  onClick={() => setIsUpdateSalespersonOpen(false)}
                >
                  {"\u00D7"}
                </button>
              </div>
              <div className="px-5 py-5">
                <select
                  value={selectedSalespersonId}
                  onChange={(e) => setSelectedSalespersonId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                >
                  <option value="">Select a salesperson</option>
                  {salespersons.map((sp) => (
                    <option key={String(sp?._id || sp?.id || sp?.name)} value={String(sp?._id || sp?.id || sp?.name)}>
                      {String(sp?.name || sp?.displayName || sp?.email || sp?.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-2">
                <button
                  className="px-4 py-2 bg-[#10a37f] hover:bg-[#0e8a6b] text-white rounded-md text-sm font-semibold"
                  onClick={() => {
                    const nextId = String(selectedSalespersonId || "");
                    const updated = subscriptions.map((row: any) =>
                      row.id === selected?.id
                        ? { ...row, salesperson: nextId, salespersonId: nextId }
                        : row
                    );
                    setSubscriptions(updated);
                    try {
                      localStorage.setItem("taban_subscriptions_v1", JSON.stringify(updated));
                    } catch {
                      // ignore storage errors
                    }
                    setIsUpdateSalespersonOpen(false);
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          No subscriptions found. Create or update a subscription to see details.
        </div>
      )}
    </div>
  );
}

