import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    MoreHorizontal,
    MoreVertical,
    Plus,
    ChevronDown,
    X,
    Star,
    RefreshCw,
    Lock,
    Unlock,
    Pencil,
    Trash2,
    Copy,
    Info,
    Image as ImageIcon,
    Filter,
    ArrowUpDown
} from "lucide-react";
import { toast } from "react-toastify";
import { apiRequest, itemsAPI, tagAssignmentsAPI, invoicesAPI, billsAPI, inventoryAdjustmentsAPI } from "../../../../services/api";
import { Item, Z, fmtMoney } from "../itemsModel";
import LockItemModal from "./modals/LockItemModal";
import OpeningStockModal from "./modals/OpeningStockModal";
import AdjustStock from "./modals/AdjustStock";
import ReorderPointModal from "./modals/ReorderPointModal";

interface ItemDetailsProps {
    item: Item;
    onBack: () => void;
    onEdit: () => void;
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    onUpdate: (data: any) => Promise<void>;
    setSelectedId: (id: string | null) => void;
    setView: (view: string) => void;
    onDelete: (id: string) => Promise<void>;
    onClone: (data: any) => void;
    baseCurrency?: any;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{children}</div>
);

const FieldValue = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`text-sm text-gray-900 font-medium ${className || ""}`}>{children || "-"}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-gray-900 mt-8 mb-4">{children}</h3>
);

const StatusCard = ({ label, value, onEdit, icon }: any) => (
    <div className="p-4 border-b border-gray-100 last:border-0 relative">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest leading-none">{label}</span>
            {onEdit && (
                <button onClick={onEdit} className="text-blue-500 hover:text-blue-600 transition-colors">
                    {icon || <span className="text-xs font-medium lowercase flex items-center gap-1"><Pencil size={12} /> edit</span>}
                </button>
            )}
        </div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
);

import { useCurrency } from "../../../../hooks/useCurrency";

export default function ItemDetails({
    item,
    onBack,
    onEdit,
    items,
    setItems,
    onUpdate,
    setSelectedId,
    setView,
    onDelete,
    onClone,
    baseCurrency,
    canCreate = true,
    canEdit = true,
    canDelete = true,
}: ItemDetailsProps) {
    const navigate = useNavigate();
    const { symbol: currencySymbol } = useCurrency();
    const [activeTab, setActiveTab] = useState("overview");
    const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
    const [showAdjustStock, setShowAdjustStock] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [showOpeningStockModal, setShowOpeningStockModal] = useState(false);
    const [showReorderPointModal, setShowReorderPointModal] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [txTypeFilter, setTxTypeFilter] = useState<"Quotes" | "Invoices" | "Credit Notes" | "Sales Receipts">("Quotes");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showAssociatedPriceLists, setShowAssociatedPriceLists] = useState(false);
    const [reorderNotificationEnabled, setReorderNotificationEnabled] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const moreDropdownRef = useRef<HTMLDivElement>(null);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch reorder notification setting
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await apiRequest('/organization/preferences');
                if (response?.data?.itemSettings?.notifyReorderPoint) {
                    setReorderNotificationEnabled(true);
                } else {
                    setReorderNotificationEnabled(false);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };

        fetchSettings();

        // Re-fetch when page becomes visible (user returns from settings)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchSettings();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (moreDropdownRef.current && !moreDropdownRef.current.contains(target)) setMoreDropdownOpen(false);
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(target)) setShowTypeDropdown(false);
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) setShowStatusDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeTab === "transactions") {
            fetchTransactions();
        }
    }, [activeTab, item.id, item._id, txTypeFilter, statusFilter]);

    const transactionTypeOptions = ["Quotes", "Invoices", "Credit Notes", "Sales Receipts"] as const;
    const transactionNumberHeading: Record<(typeof transactionTypeOptions)[number], string> = {
        Quotes: "QUOTE NUMBER",
        Invoices: "INVOICE NUMBER",
        "Credit Notes": "CREDIT NOTE NUMBER",
        "Sales Receipts": "SALES RECEIPT NUMBER",
    };
    const statusOptionsByType: Record<(typeof transactionTypeOptions)[number], { label: string; separator?: boolean }[]> = {
        Quotes: [
            { label: "All" },
            { label: "Draft" },
            { label: "Sent" },
            { label: "Client Viewed" },
            { label: "Accepted" },
            { label: "Invoiced" },
            { label: "Declined", separator: true },
            { label: "Expired" },
        ],
        Invoices: [
            { label: "All" },
            { label: "Draft" },
            { label: "Sent" },
            { label: "Viewed" },
            { label: "Partially Paid" },
            { label: "Paid" },
            { label: "Overdue", separator: true },
            { label: "Void" },
        ],
        "Credit Notes": [
            { label: "All" },
            { label: "Draft" },
            { label: "Open" },
            { label: "Partially Applied" },
            { label: "Applied" },
            { label: "Void" },
        ],
        "Sales Receipts": [
            { label: "All" },
            { label: "Draft" },
            { label: "Sent" },
            { label: "Deposited" },
            { label: "Undeposited" },
            { label: "Void" },
        ],
    };

    const fetchTransactions = async () => {
        setIsLoadingTransactions(true);
        try {
            const itemId = item.id || item._id;
            let resp;
            let typeLabel = "";
            let refField = "";
            let entityField = "";
            const dateField = "date";

            // Determine which API to call based on txTypeFilter
            try {
                switch (txTypeFilter) {
                    case "Quotes":
                        resp = await apiRequest('/quotes?limit=1000');
                        typeLabel = "Quote";
                        refField = "quoteNumber";
                        entityField = "customer";
                        break;
                    case "Invoices":
                        resp = await apiRequest('/sales-invoices?limit=1000');
                        typeLabel = "Invoice";
                        refField = "invoiceNumber";
                        entityField = "customer";
                        break;
                    case "Credit Notes":
                        resp = await apiRequest('/credit-notes?limit=1000');
                        typeLabel = "Credit Note";
                        refField = "creditNoteNumber";
                        entityField = "customer";
                        break;
                    case "Sales Receipts":
                        resp = await apiRequest('/sales-receipts?limit=1000');
                        typeLabel = "Sales Receipt";
                        refField = "receiptNumber";
                        entityField = "customer";
                        break;
                    default:
                        resp = { success: true, data: [] };
                }
            } catch (error) {
                console.warn(`Failed to fetch ${txTypeFilter} transactions:`, error);
                resp = { success: true, data: [] };
            }

            const allTransactions: any[] = [];

            if (resp?.success && Array.isArray(resp.data)) {
                resp.data.forEach((tx: any) => {
                    const lineItem = tx.items?.find((li: any) => (li.item === itemId || (li.item && typeof li.item === 'object' && (li.item._id === itemId || li.item.id === itemId))));
                    if (lineItem) {
                        // Check status filter
                        if (statusFilter !== "All" && tx.status?.toLowerCase() !== statusFilter.toLowerCase()) {
                            return;
                        }

                        allTransactions.push({
                            id: tx._id || tx.id,
                            date: tx[dateField] || tx.createdAt,
                            type: typeLabel,
                            reference: tx[refField] || "N/A",
                            entity: tx[entityField]?.displayName || tx[entityField + "Name"] || "N/A",
                            quantity: lineItem.quantity || lineItem.quantityAdjusted || 0,
                            price: lineItem.unitPrice || lineItem.rate || 0,
                            amount: tx.total || (lineItem.quantity * (lineItem.unitPrice || 0)) || 0,
                            status: tx.status
                        });
                    }
                });
            }

            setTransactions(allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to load transactions");
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    const getStatusesForType = () => statusOptionsByType[txTypeFilter];


    const handleClone = () => {
        const clonedData = {
            ...item,
            name: item.name,
            sku: item.sku
        };

        // Remove sensitive/unique identifiers
        const fieldsToRemove = ['_id', 'id', '__v', 'createdAt', 'updatedAt'];
        fieldsToRemove.forEach(field => delete (clonedData as any)[field]);

        onClone(clonedData);
        setMoreDropdownOpen(false);
    };

    const handleToggleActive = async () => {
        setIsActionLoading(true);
        try {
            const isCurrentlyInactive = item.active === false || item.isActive === false || item.status === "Inactive";
            const targetState = isCurrentlyInactive; // If it was inactive, we want it to be active (true)
            const newStatus = isCurrentlyInactive ? "Active" : "Inactive";

            await onUpdate({
                active: targetState,
                isActive: targetState,
                status: newStatus
            });
            setMoreDropdownOpen(false);
        } catch (error) {
            console.error("Action failed:", error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                const newImages = [base64, ...(item.images || [])];
                await onUpdate({ images: newImages });
            };
            reader.readAsDataURL(file);
        }
        if (e.target) {
            e.target.value = "";
        }
    };

    const handleRemoveImage = async () => {
        if (!canEdit) return;
        if (!item.images || item.images.length === 0) return;
        const remaining = item.images.slice(1);
        await onUpdate({ images: remaining });
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Top Navigation / Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 truncate">{item.name}</h1>
                    {(item.active === false || item.isActive === false || item.status === "Inactive") ? (
                        <span className="shrink-0 px-2 py-0.5 rounded bg-[#b1b1b1] text-white text-[10px] font-bold uppercase tracking-wider">
                            INACTIVE
                        </span>
                    ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded bg-[#111827] text-white text-[10px] font-bold uppercase tracking-wider">
                            ACTIVE
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {canEdit && (
                        <button onClick={onEdit} className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition-colors" title="Edit">
                            <Pencil size={18} />
                        </button>
                    )}

                    {(canCreate || canEdit || canDelete) && (
                        <div className="relative" ref={moreDropdownRef}>
                            <button
                                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                                className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 transition-colors bg-white shadow-sm"
                                title="More"
                            >
                                <MoreVertical size={18} className="text-gray-500" />
                            </button>
                            {moreDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-2 flex flex-col gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleClone();
                                            }}
                                            className="w-full px-3 py-2 text-sm text-left text-white bg-[#3b82f6] rounded-md cursor-pointer hover:bg-blue-600 transition-all font-medium"
                                        >
                                            Clone Item
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleActive();
                                            }}
                                            disabled={isActionLoading}
                                            className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-transparent rounded-md cursor-pointer hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            {(item.active === false || item.isActive === false || item.status === "Inactive") ? "Mark as Active" : "Mark as Inactive"}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item.id || item._id || "");
                                                setMoreDropdownOpen(false);
                                            }}
                                            className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-transparent rounded-md cursor-pointer hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={onBack} className="p-1 text-gray-400 hover:text-gray-600 ml-1 transition-colors">
                        <X size={24} strokeWidth={1} />
                    </button>
                </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex items-center gap-8 px-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {["Overview", "Transactions", "History"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`py-3.5 text-[17px] font-medium border-b-[3px] transition-colors whitespace-nowrap ${activeTab === tab.toLowerCase() ? "border-[#3b82f6] text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {activeTab === "overview" && (
                    <div className="w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-[540px_1fr] gap-8 border-b border-gray-200 pb-10">
                            <div className="space-y-5 pt-2">
                                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                    <div className="text-[14px] text-gray-500">Item Type</div>
                                    <div className="text-[15px] text-gray-900">
                                        {item.type === "Service" ? "Services" : item.trackInventory ? "Inventory Items" : "Sales Items"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                    <div className="text-[14px] text-gray-500">SKU</div>
                                    <div className="text-[15px] text-gray-900">{item.sku || "-"}</div>
                                </div>
                                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                    <div className="text-[14px] text-gray-500">Unit</div>
                                    <div className="text-[15px] text-gray-900">{item.unit || "-"}</div>
                                </div>
                                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                    <div className="text-[14px] text-gray-500">Created Source</div>
                                    <div className="text-[15px] text-gray-900">User</div>
                                </div>
                                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                    <div className="text-[14px] text-gray-500">Sales Tax</div>
                                    <div className="text-[15px] text-gray-900">
                                        {item.salesTax || (item.taxInfo ? `${item.taxInfo.taxName} [${item.taxInfo.taxRate}%]` : "-")}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-start lg:justify-center">
                                <div className="w-full max-w-[280px]">
                                    <div
                                        className="border border-dashed border-gray-300 rounded-lg h-[230px] flex flex-col items-center justify-center bg-[#fafafa] text-center cursor-pointer transition-colors hover:bg-white relative overflow-hidden"
                                        onClick={() => canEdit && fileInputRef.current?.click()}
                                    >
                                        {item.images && item.images.length > 0 ? (
                                            <img src={item.images[0]} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                                        ) : (
                                            <>
                                                <ImageIcon className="h-11 w-11 text-gray-400 mb-3" />
                                                <p className="text-[17px] text-gray-500 leading-tight">Drag image(s) here or</p>
                                                <span className="text-[17px] text-[#2563eb] font-medium mt-1">Browse images</span>
                                            </>
                                        )}
                                    </div>
                                    {item.images && item.images.length > 0 && (
                                        <div className="mt-2 flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-[13px] text-gray-600">
                                            <button
                                                type="button"
                                                onClick={() => canEdit && fileInputRef.current?.click()}
                                                className="text-[#2563eb] hover:underline"
                                            >
                                                Change Image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="text-gray-500 hover:text-gray-700"
                                                title="Remove image"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="max-w-[760px] py-10 border-b border-gray-200">
                            <h3 className="text-[18px] text-gray-900 mb-6">Sales Information</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                    <div className="text-[14px] text-gray-500">Selling Price</div>
                                    <div className="text-[15px] text-gray-900">{fmtMoney(item.sellingPrice || 0, currencySymbol)}</div>
                                </div>
                                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                    <div className="text-[14px] text-gray-500">Sales Account</div>
                                    <div className="text-[15px] text-gray-900">{item.salesAccount || "-"}</div>
                                </div>
                                <div className="grid grid-cols-[150px_1fr] items-start gap-4">
                                    <div className="text-[14px] text-gray-500">Description</div>
                                    <div className="text-[15px] text-gray-900">{item.salesDescription || "-"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="py-8">
                            <h3 className="text-[18px] text-gray-900 mb-4">Reporting Tags</h3>
                            {item.tags && item.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {item.tags.map((tag: any, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                                            {tag.groupName}: {tag.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[16px] text-gray-500">No reporting tag has been associated with this item.</p>
                            )}
                        </div>

                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={() => setShowAssociatedPriceLists((prev) => !prev)}
                                className="text-[17px] text-[#2563eb] font-medium flex items-center gap-2"
                            >
                                Associated Price Lists
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${showAssociatedPriceLists ? "" : "-rotate-90"}`}
                                />
                            </button>

                            {showAssociatedPriceLists && (
                                <div className="mt-6 max-w-[760px] border-t border-gray-200 pt-5">
                                    <div className="grid grid-cols-3 text-[13px] font-semibold text-gray-500 px-2 py-3 border-y border-gray-200">
                                        <span>NAME</span>
                                        <span>PRICE</span>
                                        <span>DISCOUNT</span>
                                    </div>

                                    <div className="text-center py-9 px-4 text-[16px] text-gray-800 border-b border-gray-200">
                                        The sales price lists associated with this item will be displayed here.{" "}
                                        <button type="button" className="text-[#2563eb] hover:underline">
                                            Create Price List
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="mt-3 inline-flex items-center gap-2 text-[16px] text-gray-700 hover:text-gray-900"
                                    >
                                        <Plus size={16} className="text-[#2b83ea]" />
                                        Associate Price List
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "transactions" && (
                    <div className="flex flex-col gap-4">
                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative" ref={typeDropdownRef}>
                                <button
                                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-[#f5f5f5] hover:bg-white flex items-center gap-2 transition-colors"
                                >
                                    <span className="text-gray-500 font-normal">Filter By:</span> {txTypeFilter} <ChevronDown size={14} className="text-gray-600" />
                                </button>
                                {showTypeDropdown && (
                                    <div className="absolute left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] py-1 antialiased">
                                        {transactionTypeOptions.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => { setTxTypeFilter(type); setStatusFilter("All"); setShowTypeDropdown(false); }}
                                                className={`mx-1 my-0.5 w-[calc(100%-8px)] text-left px-3 py-2 text-sm rounded-md border transition-colors ${txTypeFilter === type ? "bg-[#3b82f6] text-white border-[#2563eb]" : "text-gray-600 border-transparent hover:bg-gray-100"}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={statusDropdownRef}>
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-[#f5f5f5] hover:bg-white flex items-center gap-2 transition-colors"
                                >
                                    <span className="text-gray-500 font-normal">Status:</span> {statusFilter} <ChevronDown size={14} className="text-gray-600" />
                                </button>
                                {showStatusDropdown && (
                                    <div className="absolute left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] py-1 antialiased">
                                        {getStatusesForType().map((status) => (
                                            <React.Fragment key={status.label}>
                                                {status.separator ? <div className="my-1 border-t border-gray-200" /> : null}
                                                <button
                                                    onClick={() => { setStatusFilter(status.label); setShowStatusDropdown(false); }}
                                                    className={`mx-1 my-0.5 w-[calc(100%-8px)] text-left px-3 py-2 text-sm rounded-md border transition-colors ${statusFilter === status.label ? "bg-[#3b82f6] text-white border-[#2563eb]" : "text-gray-600 border-transparent hover:bg-gray-100"}`}
                                                >
                                                    {status.label}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-x-auto min-h-[400px]">
                            {isLoadingTransactions ? (
                                <div className="flex items-center justify-center h-64">
                                    <RefreshCw className="animate-spin text-blue-500" size={32} />
                                </div>
                            ) : transactions.length > 0 ? (
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="bg-[#fcfdfe] border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-600 uppercase">
                                                    Date <ArrowUpDown size={10} />
                                                </div>
                                            </th>
                                            <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{transactionNumberHeading[txTypeFilter]}</th>
                                            <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">CUSTOMER NAME</th>
                                            <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">QUANTITY SOLD</th>
                                            <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">PRICE</th>
                                            <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">TOTAL</th>
                                            <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors group border-b border-gray-50 last:border-0">
                                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-blue-600 cursor-pointer hover:underline">{tx.reference}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{tx.entity}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 text-right">{parseFloat(tx.quantity).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 text-right">{fmtMoney(tx.price, currencySymbol)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                                    {fmtMoney(tx.amount, currencySymbol)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[13px] font-medium ${['paid', 'accepted', 'invoiced', 'adjusted'].includes(tx.status?.toLowerCase()) ? 'text-[#111827]' :
                                                        ['draft'].includes(tx.status?.toLowerCase()) ? 'text-gray-400' :
                                                            ['sent', 'open'].includes(tx.status?.toLowerCase()) ? 'text-blue-500' :
                                                                'text-orange-500'
                                                        }`}>
                                                        {tx.status?.charAt(0).toUpperCase() + tx.status?.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                                        <RefreshCw className="text-gray-200" size={32} />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">No transactions found</h4>
                                    <p className="text-xs text-gray-400">There are no {txTypeFilter.toLowerCase()} found matching your filter.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === "history" && (
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden p-8">
                        <div className="relative border-l-2 border-gray-100 pl-8 ml-4 space-y-12">
                            <div className="relative">
                                <div className="absolute -left-[41px] top-1 bg-blue-600 rounded-full w-4 h-4 border-4 border-white"></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 mb-1">Item Created</span>
                                    <span className="text-xs text-gray-500 mb-2">Item was added to the inventory system.</span>
                                    <div className="bg-gray-50 rounded-md p-3 text-[11px] text-gray-600 font-mono inline-block w-fit">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Initial Record"}
                                    </div>
                                </div>
                            </div>
                            {item.updatedAt && item.updatedAt !== item.createdAt && (
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-1 bg-gray-400 rounded-full w-4 h-4 border-4 border-white"></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 mb-1">Last System Update</span>
                                        <span className="text-xs text-gray-500 mb-2">Detailed property modifications.</span>
                                        <div className="bg-gray-50 rounded-md p-3 text-[11px] text-gray-600 font-mono inline-block w-fit">
                                            {new Date(item.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="relative">
                                <div className="absolute -left-[41px] top-1 bg-gray-200 rounded-full w-4 h-4 border-4 border-white"></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 mb-1">Inventory Tracking Enabled</span>
                                    <span className="text-xs text-gray-500">Tracking started with opening stock: {item.openingStock || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showLockModal && <LockItemModal onClose={() => setShowLockModal(false)} onLock={async (c, r) => { await onUpdate({ ...item, locked: true, lockConfig: c, lockReason: r }); setShowLockModal(false); }} />}
            {showOpeningStockModal && <OpeningStockModal item={item} onClose={() => setShowOpeningStockModal(false)} onSave={async (d) => { await onUpdate({ ...item, ...d }); setShowOpeningStockModal(false); }} />}
            {showReorderPointModal && <ReorderPointModal currentValue={parseFloat(String(item.reorderPoint || 0))} onClose={() => setShowReorderPointModal(false)} onSave={async (v) => { await onUpdate({ ...item, reorderPoint: v }); setShowReorderPointModal(false); }} />}

            <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
    );
}


