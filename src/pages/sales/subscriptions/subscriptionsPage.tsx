import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronDown,
    Search,
    Plus,
    MoreHorizontal,
    SlidersHorizontal,
    X,
    Star,
    Settings,
    Download,
    RefreshCw,
    ImageIcon,
    GripVertical,
} from "lucide-react";
import { useOrganizationBranding } from "../../../hooks/useOrganizationBranding";

const SUBSCRIPTIONS_STORAGE_KEY = "taban_subscriptions_v1";

type Column = {
    key: string;
    label: string;
    visible: boolean;
    width: number;
};

const COLUMNS_STORAGE_KEY = "taban_subscriptions_columns_v1";
const DEFAULT_COLUMNS: Column[] = [
    { key: "createdOn", label: "CREATED ON", visible: true, width: 120 },
    { key: "activatedOn", label: "ACTIVATED ON", visible: true, width: 120 },
    { key: "location", label: "LOCATION", visible: true, width: 120 },
    { key: "subscriptionNumber", label: "SUBSCRIPTION#", visible: true, width: 140 },
    { key: "customerName", label: "CUSTOMER NAME", visible: true, width: 220 },
    { key: "planName", label: "PLAN NAME", visible: true, width: 120 },
    { key: "status", label: "STATUS", visible: true, width: 100 },
    { key: "amount", label: "AMOUNT", visible: true, width: 110 },
    { key: "lastBilledOn", label: "LAST BILLED ON", visible: true, width: 120 },
    { key: "nextBillingOn", label: "NEXT BILLING ON", visible: true, width: 120 },
    { key: "referenceNumber", label: "REFERENCE#", visible: true, width: 130 },
    { key: "pauseDate", label: "PAUSE DATE", visible: false, width: 130 },
    { key: "resumeDate", label: "RESUME DATE", visible: false, width: 130 },
    { key: "createdBy", label: "CREATED BY", visible: false, width: 140 },
    { key: "email", label: "EMAIL", visible: false, width: 200 },
    { key: "meteredBillingEnabled", label: "METERED BILLING ENABLED", visible: false, width: 190 },
    { key: "mobilePhone", label: "MOBILE PHONE", visible: false, width: 140 },
    { key: "paymentTerms", label: "PAYMENT TERMS", visible: false, width: 140 },
    { key: "phone", label: "PHONE", visible: false, width: 140 },
    { key: "planCode", label: "PLAN CODE", visible: false, width: 120 },
    { key: "reactivationDate", label: "REACTIVATION DATE", visible: false, width: 150 },
    { key: "salesperson", label: "SALES PERSON", visible: false, width: 140 },
    { key: "scheduledCancellationDate", label: "SCHEDULED CANCELLATION DATE", visible: false, width: 210 },
    { key: "scheduledUpdateDate", label: "SCHEDULED UPDATE DATE", visible: false, width: 190 },
];

const SubscriptionsPage = () => {
    const navigate = useNavigate();
    const { accentColor } = useOrganizationBranding();

    const [filterType, setFilterType] = useState("All Subscriptions");
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [columnSearch, setColumnSearch] = useState("");

    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const moreDropdownRef = useRef<HTMLDivElement>(null);

    const [columns, setColumns] = useState<Column[]>(() => {
        const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (!saved) return DEFAULT_COLUMNS;
        try {
            const parsed = JSON.parse(saved);
            return DEFAULT_COLUMNS.map((def) => {
                const found = parsed.find((p: Column) => p.key === def.key);
                return found ? { ...def, ...found } : def;
            });
        } catch {
            return DEFAULT_COLUMNS;
        }
    });

    useEffect(() => {
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
    }, [columns]);

    useEffect(() => {
        const load = () => {
            try {
                const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                setSubscriptions(Array.isArray(parsed) ? parsed : []);
            } catch {
                setSubscriptions([]);
            }
        };
        load();
        const onStorage = (event: StorageEvent) => {
            if (!event.key || event.key === SUBSCRIPTIONS_STORAGE_KEY) load();
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
        const handleClickOutside = (e: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
                setFilterDropdownOpen(false);
            }
            if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
                setMoreDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);
    const filteredColumns = useMemo(() => {
        const term = columnSearch.toLowerCase().trim();
        if (!term) return columns;
        return columns.filter((c) => c.label.toLowerCase().includes(term));
    }, [columns, columnSearch]);

    const toggleColumn = (key: string) => {
        setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
    };

    const toggleSelectAll = () => {
        if (!subscriptions.length) return;
        if (selectedIds.length === subscriptions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(subscriptions.map((s: any) => s.id));
        }
    };

    const toggleSelectOne = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const deriveStatus = (sub: any) => {
        const explicit = String(sub?.status || "").toUpperCase();
        if (explicit && !["LIVE", "UNPAID"].includes(explicit)) return explicit;
        const immediate = Number(sub?.immediateCharges ?? 0) || 0;
        const paymentReceived = Boolean(sub?.paymentReceived);
        if (immediate > 0 && !paymentReceived) return "UNPAID";
        return explicit || "LIVE";
    };

    const statusStyles = (status: string) => {
        const normalized = status.toUpperCase();
        if (normalized === "UNPAID") return "text-red-500";
        if (normalized === "CANCELLED" || normalized === "CANCELED") return "text-red-500";
        if (normalized === "EXPIRED") return "text-gray-500";
        return "text-[#1b5e6a]";
    };

    const handleNewSubscription = () => {
        navigate("/sales/subscriptions/new");
    };

    const getCustomerEmail = (sub: any) =>
        String(sub?.customerEmail || sub?.contactPersons?.[0]?.email || "").trim();

    return (
        <div className="flex flex-col min-h-screen w-full bg-white font-sans text-gray-800 antialiased relative overflow-visible">
            <div className="flex items-center justify-between px-4 border-b border-gray-100 bg-white relative z-[9999] overflow-visible">
                <div className="flex items-center gap-6 pl-4">
                    <div className="relative" ref={filterDropdownRef}>
                        <div
                            className="flex items-center gap-1.5 py-4 cursor-pointer group border-b-2 border-slate-900 -mb-[px]"
                            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                        >
                            <h1 className="text-[15px] font-bold text-slate-900 transition-colors">{filterType}</h1>
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${filterDropdownOpen ? "rotate-180" : ""}`}
                                style={{ color: accentColor }}
                            />
                        </div>

                        {filterDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-2xl z-[10000] py-2">
                                {["All Subscriptions", "Active", "Pending", "Cancelled", "Expired"].map((view) => (
                                    <button
                                        key={view}
                                        onClick={() => {
                                            setFilterType(view);
                                            setFilterDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-teal-50 cursor-pointer group/item transition-colors flex items-center justify-between"
                                    >
                                        <span className={filterType === view ? "text-teal-700 font-medium" : "text-gray-700"}>
                                            {view}
                                        </span>
                                        <Star size={14} className="text-gray-300 group-hover:text-yellow-400" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mr-4">
                    <button
                        onClick={handleNewSubscription}
                        className="cursor-pointer transition-all text-white px-3 sm:px-4 py-1.5 rounded-lg border-[#0D4A52] border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:translate-y-[1px] text-sm font-semibold shadow-sm flex items-center gap-1"
                        style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
                    >
                        <Plus size={16} />
                        <span>New</span>
                    </button>

                    <div className="relative" ref={moreDropdownRef}>
                        <button
                            onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                            className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <MoreHorizontal size={18} className="text-gray-500" />
                        </button>

                        {moreDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-2xl z-[10000] py-1">
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

            <div className="flex-1 overflow-x-auto bg-white min-h-0">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-[#f6f7fb] sticky top-0 z-10 border-b border-[#e6e9f2]">
                        <tr className="text-[10px] font-semibold text-[#7b8494] uppercase tracking-wider">
                            <th className="px-4 py-3 w-16 min-w-[64px]">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomizeModalOpen(true)}
                                        className="h-6 w-6 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                                        title="Manage Columns"
                                    >
                                        <SlidersHorizontal size={13} style={{ color: accentColor }} />
                                    </button>
                                    <div className="h-5 w-px bg-gray-200" />
                                    <input
                                        type="checkbox"
                                        checked={subscriptions.length > 0 && selectedIds.length === subscriptions.length}
                                        onChange={toggleSelectAll}
                                        style={{ accentColor: accentColor }}
                                        className="w-4 h-4 rounded border-gray-300 cursor-pointer focus:ring-0"
                                    />
                                </div>
                            </th>
                            {visibleColumns.map((col) => (
                                <th key={col.key} className="px-4 py-3" style={{ width: col.width }}>
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-4 py-3 w-12 sticky right-0 bg-[#f6f7fb] border-l border-[#e6e9f2]">
                                <div className="flex items-center justify-center">
                                    <Search size={14} className="text-gray-300 cursor-pointer transition-colors hover:opacity-80" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {subscriptions.map((sub: any) => (
                            <tr
                                key={sub.id}
                                className="text-[13px] group transition-all hover:bg-[#f8fafc] cursor-pointer h-[50px] border-b border-[#eef1f6]"
                                style={selectedIds.includes(sub.id) ? { backgroundColor: "#1b5e6a1A" } : {}}
                                onClick={() => navigate(`/sales/subscriptions/${sub.id}`)}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-6 w-6 shrink-0" aria-hidden />
                                        <span className="h-5 w-px shrink-0 bg-transparent" aria-hidden />
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(sub.id)}
                                            onChange={() => {}}
                                            onClick={(e) => toggleSelectOne(sub.id, e)}
                                            style={{ accentColor: "#1b5e6a" }}
                                            className="w-4 h-4 rounded border-gray-300 cursor-pointer focus:ring-0"
                                        />
                                    </div>
                                </td>
                                {visibleColumns.map((col) => {
                                    const value = (sub as any)[col.key];
                                    if (col.key === "customerName") {
                                        return (
                                            <td key={col.key} className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <ImageIcon size={16} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[#1b5e6a] font-medium hover:underline truncate">
                                                            {sub.customerName}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 truncate">{getCustomerEmail(sub) || "-"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    }
                                    if (col.key === "subscriptionNumber") {
                                        return (
                                            <td key={col.key} className="px-4 py-3">
                                                <span className="text-[#1b5e6a] font-medium hover:underline">{sub.subscriptionNumber}</span>
                                            </td>
                                        );
                                    }
                                    if (col.key === "status") {
                                        const status = deriveStatus(sub);
                                        return (
                                            <td key={col.key} className="px-4 py-3">
                                                <span className={`text-[11px] font-bold tracking-wide ${statusStyles(status)}`}>{status}</span>
                                            </td>
                                        );
                                    }
                                    if (col.key === "planName") {
                                        return (
                                            <td key={col.key} className="px-4 py-3 text-gray-700 uppercase">
                                                {sub.planName}
                                            </td>
                                        );
                                    }
                                    if (col.key === "amount") {
                                        return (
                                            <td key={col.key} className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                {sub.amount}
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={col.key} className="px-4 py-3 text-gray-700">
                                            {value || "-"}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 sticky right-0 bg-white/95 backdrop-blur-sm border-l border-[#eef1f6] group-hover:bg-[#f8fafc] transition-colors" />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCustomizeModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[10000] flex items-start justify-center pt-4 px-6 pb-6 overflow-y-auto">
                    <div className="w-full max-w-[520px] rounded-lg bg-white shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef1f6] bg-[#f8f9fb]">
                            <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-800">
                                <SlidersHorizontal size={16} />
                                Customize Columns
                            </div>
                            <div className="flex items-center gap-4 text-[12px] text-slate-500">
                                <span>
                                    {visibleColumns.length} of {columns.length} Selected
                                </span>
                                <button
                                    onClick={() => setIsCustomizeModalOpen(false)}
                                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-slate-100"
                                    aria-label="Close"
                                >
                                    <X size={14} className="text-red-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-b border-[#eef1f6] bg-white">
                            <div className="flex items-center gap-2 border border-[#d7dbe7] rounded-md px-3 py-2 bg-white">
                                <Search size={14} className="text-slate-400" />
                                <input
                                    value={columnSearch}
                                    onChange={(e) => setColumnSearch(e.target.value)}
                                    placeholder="Search"
                                    className="w-full text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto p-3 space-y-2 bg-white">
                            {filteredColumns.map((col) => (
                                <label
                                    key={col.key}
                                    className="flex items-center gap-3 rounded-md bg-[#f8fafc] px-3 py-2 text-[13px] text-slate-700 cursor-pointer"
                                >
                                    <GripVertical size={14} className="text-slate-400" />
                                    <input
                                        type="checkbox"
                                        checked={col.visible}
                                        onChange={() => toggleColumn(col.key)}
                                        className="h-4 w-4 rounded border-gray-300"
                                        style={{ accentColor: "#3b82f6" }}
                                    />
                                    <span>{col.label.replace("ON", "On").replace("DATE", "Date")}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 px-5 py-4 border-t border-[#eef1f6] bg-white">
                            <button
                                onClick={() => setIsCustomizeModalOpen(false)}
                                className="px-4 py-2 text-sm rounded-md bg-[#22b573] text-white font-semibold hover:brightness-95"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsCustomizeModalOpen(false)}
                                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionsPage;
