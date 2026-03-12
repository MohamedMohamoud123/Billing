import React, { useEffect, useState } from "react";
import { X, HelpCircle, Info } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../../components/ui/Modal";
import { useOrganizationBranding } from "../../../../hooks/useOrganizationBranding";

const PRODUCTS_STORAGE_KEY = "inv_products_v1";

interface NewProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess?: () => void;
    mode?: "create" | "edit";
    initialProduct?: any;
}

const getDefaultForm = () => ({
    name: "",
    description: "",
    emailRecipients: "",
    redirectionUrl: "",
    autoGenerateSubscriptionNumbers: false,
    prefix: "SUB-",
    nextNumber: "00001",
});

export default function NewProductModal({
    isOpen,
    onClose,
    onSaveSuccess,
    mode = "create",
    initialProduct,
}: NewProductModalProps) {
    const { accentColor } = useOrganizationBranding();
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState(getDefaultForm);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const isEditMode = mode === "edit" && Boolean(initialProduct);

    const placeholders = [
        "%EmailID%",
        "%SubscriptionID%",
        "%SubscriptionName%",
        "%PlanName%",
        "%RecurringCharges%",
        "%NextBillingDate%",
        "%TransactionID%",
        "%InvoiceNumber%",
        "%PaymentNumber%",
        "%InvoiceAmount%",
    ];

    const insertPlaceholder = (ph: string) => {
        setForm(prev => ({ ...prev, redirectionUrl: prev.redirectionUrl + ph }));
        setDropdownOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return;
        if (isEditMode) {
            setForm({
                name: String(initialProduct?.name || ""),
                description: String(initialProduct?.description || ""),
                emailRecipients: String(initialProduct?.emailRecipients || ""),
                redirectionUrl: String(initialProduct?.redirectionUrl || ""),
                autoGenerateSubscriptionNumbers: Boolean(initialProduct?.autoGenerateSubscriptionNumbers),
                prefix: String(initialProduct?.prefix || "SUB-"),
                nextNumber: String(initialProduct?.nextNumber || "00001"),
            });
            return;
        }
        setForm(getDefaultForm());
    }, [isOpen, isEditMode, initialProduct]);

    const saveProduct = async () => {
        if (!form.name.trim()) {
            toast.error("Name is required.");
            return;
        }
        setIsSaving(true);
        try {
            const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            const rows = raw ? JSON.parse(raw) : [];
            const list = Array.isArray(rows) ? rows : [];
            const editingId = String(initialProduct?.id || initialProduct?._id || "");
            const record = {
                id: isEditMode ? editingId : `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                name: form.name.trim(),
                description: form.description.trim(),
                emailRecipients: form.emailRecipients.trim(),
                redirectionUrl: form.redirectionUrl.trim(),
                autoGenerateSubscriptionNumbers: form.autoGenerateSubscriptionNumbers,
                prefix: form.autoGenerateSubscriptionNumbers ? form.prefix : "",
                nextNumber: form.autoGenerateSubscriptionNumbers ? form.nextNumber : "",
                status: String(initialProduct?.status || "Active"),
                createdAt: String(initialProduct?.createdAt || new Date().toISOString()),
                updatedAt: new Date().toISOString(),
            };
            const nextRows = isEditMode
                ? list.map((row: any) => {
                    const rowId = String(row?.id || row?._id || "");
                    return rowId === editingId ? { ...row, ...record } : row;
                })
                : [record, ...list];
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(nextRows));
            toast.success(isEditMode ? "Product updated" : "Product saved");
            onSaveSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to save product", error);
            toast.error(isEditMode ? "Failed to update product" : "Failed to save product");
        } finally {
            setIsSaving(false);
        }
    };

    const labelClass = "block text-[13px] text-gray-700 font-normal mb-1.5";
    const inputClass = "w-full h-[32px] border border-gray-300 rounded px-3 text-[13px] outline-none focus:border-blue-400 transition-all";
    const textareaClass = "w-full border border-gray-300 rounded p-3 text-[13px] outline-none focus:border-blue-400 min-h-[100px] resize-none";

    return (
        <Modal open={isOpen} title={isEditMode ? "Edit Product" : "New Product"} onClose={onClose}>
            <div className="bg-white w-full rounded-lg overflow-hidden border-none shadow-none">

                {/* Form Body */}
                <div className="py-2 space-y-6">

                    {/* Name Field */}
                    <div>
                        <label className={labelClass}>
                            Name<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            className={inputClass}
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                            className={textareaClass}
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    {/* Email Notification Recipients */}
                    <div>
                        <label className={`${labelClass} flex items-center gap-1`}>
                            Email Notification Recipients
                            <HelpCircle size={14} className="text-gray-400 cursor-help" />
                        </label>
                        <input
                            type="text"
                            className={inputClass}
                            value={form.emailRecipients}
                            onChange={(e) => setForm((prev) => ({ ...prev, emailRecipients: e.target.value }))}
                        />
                    </div>

                    {/* Redirection URL */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className={`${labelClass} flex items-center gap-1 mb-0 font-medium`}>
                                Redirection URL <Info size={14} className="text-gray-400 cursor-help" />
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="text-[12px] text-blue-600 border border-blue-600 rounded-md px-3 py-1 hover:bg-blue-50 transition-colors"
                                >
                                    + Insert Placeholders
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-[100] py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        {placeholders.map((ph, idx) => (
                                            <button
                                                key={ph}
                                                onClick={() => insertPlaceholder(ph)}
                                                className={`w-full text-left px-4 py-2 text-[13px] hover:bg-blue-600 hover:text-white transition-colors ${idx === 0 ? "bg-blue-600 text-white rounded-[4px] mx-[2px]" : "text-gray-700"}`}
                                                style={idx === 0 ? { width: 'calc(100% - 4px)' } : {}}
                                            >
                                                {ph}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <input
                            type="text"
                            className={`${inputClass} !h-[38px] !text-[14px] !bg-slate-50/30 whitespace-nowrap overflow-hidden`}
                            value={form.redirectionUrl}
                            onChange={(e) => setForm((prev) => ({ ...prev, redirectionUrl: e.target.value }))}
                        />
                        <p className="mt-2 text-[11px] text-gray-500 italic">
                            You can use placeholders to append query params to your URL to fetch subscription details.
                            <br />
                            <span className="text-gray-400 font-normal">https://yourredirecturl.com?planname=%PlanName%</span>
                        </p>
                    </div>

                    {/* Auto-Generate Checkbox */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="auto-gen"
                                className="mt-1 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                checked={form.autoGenerateSubscriptionNumbers}
                                onChange={(e) => setForm((prev) => ({ ...prev, autoGenerateSubscriptionNumbers: e.target.checked }))}
                            />
                            <label htmlFor="auto-gen" className="text-[13px] text-gray-700 font-medium flex items-center gap-1 cursor-pointer">
                                Auto-Generate Subscription Numbers for This Product <HelpCircle size={14} className="text-gray-400 cursor-help" />
                            </label>
                        </div>

                        {form.autoGenerateSubscriptionNumbers && (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ml-6">
                                <div className="flex gap-4">
                                    <div className="flex-1 max-w-[180px]">
                                        <label className="flex items-center gap-1 text-[13px] text-gray-700 mb-1.5 font-normal">
                                            Prefix <Info size={14} className="text-gray-400" />
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full h-[38px] border border-blue-400 bg-white rounded-lg px-3 text-[14px] outline-none shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
                                            value={form.prefix}
                                            onChange={(e) => setForm(prev => ({ ...prev, prefix: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex-1 max-w-[180px]">
                                        <label className="flex items-center gap-1 text-[13px] text-gray-700 mb-1.5 font-normal">
                                            Next Number <Info size={14} className="text-gray-400" />
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full h-[38px] border border-gray-200 bg-white rounded-lg px-3 text-[14px] outline-none focus:border-blue-400"
                                            value={form.nextNumber}
                                            onChange={(e) => setForm(prev => ({ ...prev, nextNumber: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <p className="text-[12px] text-gray-500 leading-relaxed max-w-[500px]">
                                    <span className="text-gray-600 font-bold">Note:</span> Subscriptions created for this product will follow this number series, regardless of the organization-level preferences configured in Settings.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50/50 px-0 py-4 border-t border-gray-100 flex gap-3 mt-4">
                    <button
                        onClick={saveProduct}
                        disabled={isSaving}
                        className="text-white px-5 py-1.5 rounded text-[13px] font-medium transition-all shadow-sm active:scale-95 hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: accentColor }}
                    >
                        {isSaving ? (isEditMode ? "Updating..." : "Saving...") : "Save"}
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-1.5 rounded text-[13px] font-medium transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
