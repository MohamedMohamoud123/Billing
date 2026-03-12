import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { customersAPI, vendorsAPI, currenciesAPI, invoicesAPI, paymentsReceivedAPI, creditNotesAPI, quotesAPI, recurringInvoicesAPI, expensesAPI, recurringExpensesAPI, projectsAPI, billsAPI, salesReceiptsAPI, journalEntriesAPI, paymentsMadeAPI, purchaseOrdersAPI, vendorCreditsAPI, documentsAPI } from "../../../services/api";
import {
    X, Edit, Paperclip, ChevronDown, Plus, MoreVertical,
    Settings, User, Mail, Phone, MapPin, Globe,
    DollarSign, TrendingUp, Calendar, UserPlus,
    ChevronUp, ChevronRight, Sparkles, Bold, Italic, Underline, ChevronRight as ChevronRightIcon,
    Filter, ArrowUpDown, Search, ChevronLeft, Link2, FileText, Monitor, Check, Upload, Trash2, Loader2
} from "lucide-react";
import { Customer, Invoice, CreditNote, AttachedFile, Quote, RecurringInvoice, Expense, RecurringExpense, Project, Bill, SalesReceipt } from "../../salesModel";

interface ExtendedCustomer extends Customer {
    billingAttention: string;
    billingCountry: string;
    billingStreet1: string;
    billingStreet2: string;
    billingCity: string;
    billingState: string;
    billingZipCode: string;
    billingPhone: string;
    billingFax: string;
    shippingAttention: string;
    shippingCountry: string;
    shippingStreet1: string;
    shippingStreet2: string;
    shippingCity: string;
    shippingState: string;
    shippingZipCode: string;
    shippingPhone: string;
    shippingFax: string;
    remarks: string;
    openingBalance?: string | number;
    profileImage?: string | ArrayBuffer | null;
    createdDate?: string;
    linkedVendorId?: string | null;
    linkedVendorName?: string | null;
    comments?: Comment[];
}

interface Transaction {
    id: string;
    date: string;
    type: string;
    details: string;
    detailsLink?: string;
    amount: number;
    payments: number;
    balance: number;
}

interface Comment {
    id: string | number;
    text: string;
    author: string;
    timestamp: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}

interface Mail {
    id: number;
    to: string;
    subject: string;
    description: string;
    date: string;
    type: string;
    initial: string;
}


export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const initialCustomer = (location.state as any)?.customer || null;

    const [customer, setCustomer] = useState<ExtendedCustomer | null>(initialCustomer);
    const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<ExtendedCustomer[]>([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [selectedTransactionType, setSelectedTransactionType] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isInvoiceViewDropdownOpen, setIsInvoiceViewDropdownOpen] = useState(false);

    const invoiceViewDropdownRef = useRef<HTMLDivElement>(null);
    const [expandedSections, setExpandedSections] = useState({
        address: true,
        otherDetails: true,
        contactPersons: true,
        recordInfo: false
    });
    const [expandedTransactions, setExpandedTransactions] = useState({
        subscriptions: false,
        invoices: false,
        customerPayments: false,
        paymentLinks: false,
        quotes: false,
        recurringInvoices: false,
        expenses: false,
        recurringExpenses: false,
        projects: false,
        creditNotes: false,
        salesReceipts: false,
        refunds: false,
        journals: false,
        bills: false
    });
    const transactionSectionOptions = [
        { key: "subscriptions", label: "Subscriptions" },
        { key: "invoices", label: "Invoices" },
        { key: "customerPayments", label: "Customer Payments" },
        { key: "paymentLinks", label: "Payment Links" },
        { key: "quotes", label: "Quotes" },
        { key: "recurringInvoices", label: "Retainer Invoices" },
        { key: "expenses", label: "Expenses" },
        { key: "recurringExpenses", label: "Recurring Expenses" },
        { key: "projects", label: "Projects" },
        { key: "creditNotes", label: "Credit Notes" },
        { key: "salesReceipts", label: "Sales Receipts" },
        { key: "refunds", label: "Refunds" }
    ] as const;
    const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
    const [invoiceCurrentPage, setInvoiceCurrentPage] = useState(1);
    const invoicesPerPage = 10;
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Quotes status filter
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [quoteStatusFilter, setQuoteStatusFilter] = useState("all");
    const [isQuoteStatusDropdownOpen, setIsQuoteStatusDropdownOpen] = useState(false);
    const quoteStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Recurring Invoices status filter
    const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
    const [recurringInvoiceStatusFilter, setRecurringInvoiceStatusFilter] = useState("all");
    const [isRecurringInvoiceStatusDropdownOpen, setIsRecurringInvoiceStatusDropdownOpen] = useState(false);
    const recurringInvoiceStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Expenses status filter
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expenseStatusFilter, setExpenseStatusFilter] = useState("all");
    const [isExpenseStatusDropdownOpen, setIsExpenseStatusDropdownOpen] = useState(false);
    const expenseStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Recurring Expenses status filter
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [recurringExpenseStatusFilter, setRecurringExpenseStatusFilter] = useState("all");
    const [isRecurringExpenseStatusDropdownOpen, setIsRecurringExpenseStatusDropdownOpen] = useState(false);
    const recurringExpenseStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Projects status filter
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectStatusFilter, setProjectStatusFilter] = useState("all");
    const [isProjectStatusDropdownOpen, setIsProjectStatusDropdownOpen] = useState(false);
    const projectStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Bills status filter
    const [bills, setBills] = useState<Bill[]>([]);
    const [billStatusFilter, setBillStatusFilter] = useState("all");
    const [isBillStatusDropdownOpen, setIsBillStatusDropdownOpen] = useState(false);
    const billStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Credit Notes status filter
    const [creditNoteStatusFilter, setCreditNoteStatusFilter] = useState("all");
    const [isCreditNoteStatusDropdownOpen, setIsCreditNoteStatusDropdownOpen] = useState(false);
    const creditNoteStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Sales Receipts status filter
    const [salesReceipts, setSalesReceipts] = useState<SalesReceipt[]>([]);
    const [salesReceiptStatusFilter, setSalesReceiptStatusFilter] = useState("all");
    const [isSalesReceiptStatusDropdownOpen, setIsSalesReceiptStatusDropdownOpen] = useState(false);
    const salesReceiptStatusDropdownRef = useRef<HTMLDivElement>(null);

    // Journals state
    const [journals, setJournals] = useState<any[]>([]);

    // Sidebar selection state
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [isBulkActionsDropdownOpen, setIsBulkActionsDropdownOpen] = useState(false);

    const bulkActionsDropdownRef = useRef<HTMLDivElement>(null);

    // Print Customer Statements Modal state
    const [isPrintStatementsModalOpen, setIsPrintStatementsModalOpen] = useState(false);
    const [printStatementStartDate, setPrintStatementStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date;
    });
    const [printStatementEndDate, setPrintStatementEndDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date;
    });
    const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
    const [startDateCalendarMonth, setStartDateCalendarMonth] = useState(new Date());
    const [endDateCalendarMonth, setEndDateCalendarMonth] = useState(new Date());
    const startDatePickerRef = useRef<HTMLDivElement>(null);
    const endDatePickerRef = useRef<HTMLDivElement>(null);

    // Merge Customers Modal state
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [mergeTargetCustomer, setMergeTargetCustomer] = useState<ExtendedCustomer | null>(null);
    const [isMergeCustomerDropdownOpen, setIsMergeCustomerDropdownOpen] = useState(false);
    const [mergeCustomerSearch, setMergeCustomerSearch] = useState("");

    const mergeCustomerDropdownRef = useRef<HTMLDivElement>(null);

    // Associate Templates Modal state
    const [isAssociateTemplatesModalOpen, setIsAssociateTemplatesModalOpen] = useState(false);
    const [pdfTemplates, setPdfTemplates] = useState({
        customerStatement: "Standard Template",
        quotes: "Standard Template",
        invoices: "Standard Template",
        creditNotes: "Standard Template",
        paymentThankYou: "Elite Template"
    });
    const [emailNotifications, setEmailNotifications] = useState({
        quotes: "Default",
        invoices: "Default",
        creditNotes: "Default",
        paymentThankYou: "Default"
    });
    const [openTemplateDropdown, setOpenTemplateDropdown] = useState<string | null>(null);
    const [templateSearches, setTemplateSearches] = useState<Record<string, string>>({});

    const pdfTemplateOptions = ["Standard Template", "Elite Template", "Classic Template", "Modern Template"];
    const emailTemplateOptions = ["Default", "Professional", "Friendly", "Formal"];

    // Payments state
    const [payments, setPayments] = useState<any[]>([]);

    // Mails state - sample data for demonstration
    const [mails, setMails] = useState<Mail[]>([]);
    const [isLinkEmailDropdownOpen, setIsLinkEmailDropdownOpen] = useState(false);

    const linkEmailDropdownRef = useRef<HTMLDivElement>(null);
    const [isOutlookIntegrationModalOpen, setIsOutlookIntegrationModalOpen] = useState(false);
    const [isZohoMailIntegrationModalOpen, setIsZohoMailIntegrationModalOpen] = useState(false);

    // Statement state
    const [statementPeriod, setStatementPeriod] = useState("this-month");
    const [statementFilter, setStatementFilter] = useState("all");
    const [isStatementPeriodDropdownOpen, setIsStatementPeriodDropdownOpen] = useState(false);
    const [isStatementFilterDropdownOpen, setIsStatementFilterDropdownOpen] = useState(false);
    const [isStatementDownloading, setIsStatementDownloading] = useState(false);

    const statementPeriodDropdownRef = useRef<HTMLDivElement>(null);
    const statementFilterDropdownRef = useRef<HTMLDivElement>(null);
    const [statementTransactions, setStatementTransactions] = useState<Transaction[]>([]);
    const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

    // Address Modal state
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressType, setAddressType] = useState("billing"); // "billing" or "shipping"
    const [addressFormData, setAddressFormData] = useState({
        attention: "",
        country: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        faxNumber: "",
    });

    // New Transaction dropdown state
    const [isNewTransactionDropdownOpen, setIsNewTransactionDropdownOpen] = useState(false);
    const [isGoToTransactionsDropdownOpen, setIsGoToTransactionsDropdownOpen] = useState(false);

    const newTransactionDropdownRef = useRef<HTMLDivElement>(null);
    const goToTransactionsDropdownRef = useRef<HTMLDivElement>(null);

    // Attachments dropdown state
    const [isAttachmentsDropdownOpen, setIsAttachmentsDropdownOpen] = useState(false);

    const attachmentsDropdownRef = useRef<HTMLDivElement>(null);
    const [attachments, setAttachments] = useState<any[]>([

    ]);

    // Subscription dropdown state
    const [isSubscriptionDropdownOpen, setIsSubscriptionDropdownOpen] = useState(false);

    const subscriptionDropdownRef = useRef<HTMLDivElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const formatFileSize = (bytes: number) => {
        if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };
    const mapDocumentsToAttachments = (documents: any[] = []) => {
        if (!Array.isArray(documents)) return [];
        return documents.map((doc: any, index: number) => ({
            id: index + 1,
            documentId: doc.documentId || doc.id || doc._id || null,
            name: doc.name || 'Unnamed Document',
            size: doc.size || 'Unknown',
            url: doc.url || '',
            uploadedAt: doc.uploadedAt
        }));
    };

    // More dropdown state
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

    const moreDropdownRef = useRef<HTMLDivElement>(null);
    const [areRemindersStopped, setAreRemindersStopped] = useState(false);

    // Sidebar 3-dot menu state
    const [isSidebarMoreMenuOpen, setIsSidebarMoreMenuOpen] = useState(false);

    const sidebarMoreMenuRef = useRef<HTMLDivElement>(null);

    // Settings dropdown state (for customer name settings icon)
    const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);

    const settingsDropdownRef = useRef<HTMLDivElement>(null);

    // Opening Balance modal state
    const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
    const [openingBalanceValue, setOpeningBalanceValue] = useState("");

    // Customer Type hover state
    const [isCustomerTypeHovered, setIsCustomerTypeHovered] = useState(false);
    const [isCustomerTypeEditing, setIsCustomerTypeEditing] = useState(false);
    const [customerTypeValue, setCustomerTypeValue] = useState("");

    // Default Currency hover and edit state
    const [isCurrencyHovered, setIsCurrencyHovered] = useState(false);
    const [isCurrencyEditing, setIsCurrencyEditing] = useState(false);
    const [currencyValue, setCurrencyValue] = useState("");
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

    const currencyDropdownRef = useRef<HTMLDivElement>(null);

    // Customer Language hover and edit state
    const [isLanguageHovered, setIsLanguageHovered] = useState(false);
    const [isLanguageEditing, setIsLanguageEditing] = useState(false);
    const [languageValue, setLanguageValue] = useState("");
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

    const languageDropdownRef = useRef<HTMLDivElement>(null);

    // Portal Status hover state
    const [isPortalStatusHovered, setIsPortalStatusHovered] = useState(false);

    // Add Contact Person modal state
    const [isAddContactPersonModalOpen, setIsAddContactPersonModalOpen] = useState(false);
    const [newContactPerson, setNewContactPerson] = useState({
        salutation: "Mr",
        firstName: "",
        lastName: "",
        email: "",
        workPhone: "",
        mobile: "",
        skype: "",
        designation: "",
        department: "",
        enablePortalAccess: true
    });

    // Clone modal state
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [cloneContactType, setCloneContactType] = useState("customer");
    const [isCloning, setIsCloning] = useState(false);

    // Configure Portal Access modal state
    const [isConfigurePortalModalOpen, setIsConfigurePortalModalOpen] = useState(false);
    const [portalAccessContacts, setPortalAccessContacts] = useState<any[]>([]);

    // Link to Vendor modal state
    const [isLinkToVendorModalOpen, setIsLinkToVendorModalOpen] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [linkedVendor, setLinkedVendor] = useState<any>(null);
    const [linkedVendorPurchases, setLinkedVendorPurchases] = useState<any[]>([]);
    const [linkedVendorPaymentsMade, setLinkedVendorPaymentsMade] = useState<any[]>([]);
    const [linkedVendorPurchaseOrders, setLinkedVendorPurchaseOrders] = useState<any[]>([]);
    const [linkedVendorCredits, setLinkedVendorCredits] = useState<any[]>([]);
    const [isLinkedVendorPurchasesLoading, setIsLinkedVendorPurchasesLoading] = useState(false);
    const [linkedVendorPurchaseSections, setLinkedVendorPurchaseSections] = useState({
        bills: false,
        paymentsMade: false,
        purchaseOrders: false,
        vendorCredits: false
    });
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
    const [vendorSearch, setVendorSearch] = useState("");

    const vendorDropdownRef = useRef<HTMLDivElement>(null);

    // Action header bar state
    const [showActionHeader, setShowActionHeader] = useState(false);

    // Income Section state
    const [incomeTimePeriod, setIncomeTimePeriod] = useState("Last 6 Months");
    const [isIncomeTimePeriodDropdownOpen, setIsIncomeTimePeriodDropdownOpen] = useState(false);
    const [accountingBasis, setAccountingBasis] = useState("Accrual");
    const [isAccountingBasisDropdownOpen, setIsAccountingBasisDropdownOpen] = useState(false);

    const incomeTimePeriodRef = useRef<HTMLDivElement>(null);
    const accountingBasisRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (incomeTimePeriodRef.current && !incomeTimePeriodRef.current.contains(event.target as Node)) {
                setIsIncomeTimePeriodDropdownOpen(false);
            }
            if (accountingBasisRef.current && !accountingBasisRef.current.contains(event.target as Node)) {
                setIsAccountingBasisDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Profile Image and Invite Card state

    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isAvatarHovered, setIsAvatarHovered] = useState(false);
    const [showInviteCard, setShowInviteCard] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteMethod, setInviteMethod] = useState('email'); // 'email' or 'social'
    const [inviteEmail, setInviteEmail] = useState('');

    const profileImageInputRef = useRef<HTMLInputElement>(null);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Organization profile data
    const [organizationProfile, setOrganizationProfile] = useState<any>(null);
    // Owner email data
    const [ownerEmail, setOwnerEmail] = useState<any>(null);

    const normalizeImageSrc = (value: string | ArrayBuffer | null | undefined): string | null => {
        if (!value) return null;
        return typeof value === "string" ? value : null;
    };

    useEffect(() => {
        // Set profile image when customer is loaded or updated
        if (customer?.profileImage) {
            setProfileImage(normalizeImageSrc(customer.profileImage));
        } else {
            // Reset to null if customer doesn't have a profile image
            setProfileImage(null);
        }
    }, [customer]);

    const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            const normalized = typeof base64String === "string" ? base64String : null;
            if (!normalized) {
                toast.error('Error reading image file');
                return;
            }

            // Optimistically update UI
            setProfileImage(normalized);

            if (customer && id) {
                try {
                    // Only send profileImage field to avoid sending entire customer object
                    const updateData = {
                        profileImage: normalized
                    };

                    const response = await customersAPI.update(id, updateData);

                    // Update customer state with response data
                    if (response && response.data) {
                        setCustomer(response.data);
                        toast.success('Profile image updated successfully');
                    } else {
                        // Fallback: update local state
                        setCustomer({
                            ...customer,
                            profileImage: normalized
                        });
                        toast.success('Profile image updated successfully');
                    }
                } catch (error) {
                    // Revert UI change on error
                    setProfileImage(normalizeImageSrc(customer.profileImage));
                    toast.error('Failed to update profile image: ' + ((error as any).message || 'Unknown error'));
                }
            }
        };

        reader.onerror = () => {
            toast.error('Error reading image file');
        };

        reader.readAsDataURL(file);
    };

    // Fetch organization profile data
    const fetchOrganizationProfile = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                // Set fallback data from localStorage if available
                const fallbackProfile = localStorage.getItem('organization_profile');
                if (fallbackProfile) {
                    setOrganizationProfile(JSON.parse(fallbackProfile));
                }
                return;
            }

            const response = await fetch('/api/settings/organization/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setOrganizationProfile(data.data);
                    // Cache in localStorage for offline/fallback use
                    localStorage.setItem('organization_profile', JSON.stringify(data.data));
                }
            } else {
                // Try fallback
                const fallbackProfile = localStorage.getItem('organization_profile');
                if (fallbackProfile) {
                    setOrganizationProfile(JSON.parse(fallbackProfile));
                }
            }
        } catch (error) {
            // Set fallback data from localStorage if available
            const fallbackProfile = localStorage.getItem('organization_profile');
            if (fallbackProfile) {
                setOrganizationProfile(JSON.parse(fallbackProfile));
            }
        }
    };

    // Fetch owner email data
    const fetchOwnerEmail = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch('/api/settings/organization/owner-email', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setOwnerEmail(data.data);
                }
            }
        } catch (error) {
        }
    };

    // Consolidated data loading with refresh function
    const refreshData = async () => {
        if (!id) return;

        setIsRefreshing(true);
        try {
            const customerId = String(id).trim();

            const [
                customerResponse,
                currenciesData,
                customersResponse,
                invoicesResponse,
                paymentsResponse,
                creditNotesResponse,
                quotesResponse,
                recurringInvoicesResponse,
                expensesResponse,
                recurringExpensesResponse,
                projectsResponse,
                billsResponse,
                salesReceiptsResponse,
                journalsResponse,
                vendorsResponse
            ] = await Promise.all([
                customersAPI.getById(customerId),
                currenciesAPI.getAll(),
                customersAPI.getAll({ limit: 1000 }),
                invoicesAPI.getByCustomer(customerId).catch(() => ({ success: true, data: [] })),
                paymentsReceivedAPI.getByInvoice(customerId).catch(() => ({ success: true, data: [] })),
                creditNotesAPI.getByCustomer(customerId).catch(() => ({ success: true, data: [] })),
                quotesAPI.getAll({ customerId }).catch(() => ({ success: true, data: [] })),
                recurringInvoicesAPI.getAll().catch(() => ({ success: true, data: [] })),
                expensesAPI.getAll().catch(() => ({ success: true, data: [] })),
                recurringExpensesAPI.getAll().catch(() => ({ success: true, data: [] })),
                projectsAPI.getByCustomer(customerId).catch(() => ({ success: true, data: [] })),
                billsAPI.getAll().catch(() => ({ success: true, data: [] })),
                salesReceiptsAPI.getAll({ customerId }).catch(() => ({ success: true, data: [] })),
                journalEntriesAPI.getAll().catch(() => ({ success: true, data: [] })),
                vendorsAPI.getAll().catch(() => ({ success: true, data: [] }))
            ]);

            // Process customer data
            if (customerResponse && customerResponse.success && customerResponse.data) {
                const customerData = customerResponse.data;

                // Ensure name is always set with proper fallbacks
                let customerName = customerData.displayName || customerData.name;
                if (!customerName || customerName.trim() === '') {
                    const firstName = customerData.firstName || '';
                    const lastName = customerData.lastName || '';
                    const companyName = customerData.companyName || '';

                    if (firstName || lastName) {
                        customerName = `${firstName} ${lastName}`.trim();
                    } else if (companyName) {
                        customerName = companyName.trim();
                    } else {
                        customerName = 'Customer';
                    }
                }
                customerName = customerName.trim() || 'Customer';
                const normalizedComments = normalizeComments(customerData.comments);

                const mappedCustomer = {
                    ...customerData,
                    id: String(customerData._id || customerData.id),
                    name: customerName,
                    displayName: customerData.displayName || customerName,
                    billingAttention: customerData.billingAddress?.attention || customerData.billingAttention || '',
                    billingCountry: customerData.billingAddress?.country || customerData.billingCountry || '',
                    billingStreet1: customerData.billingAddress?.street1 || customerData.billingStreet1 || '',
                    billingStreet2: customerData.billingAddress?.street2 || customerData.billingStreet2 || '',
                    billingCity: customerData.billingAddress?.city || customerData.billingCity || '',
                    billingState: customerData.billingAddress?.state || customerData.billingState || '',
                    billingZipCode: customerData.billingAddress?.zipCode || customerData.billingZipCode || '',
                    billingPhone: customerData.billingAddress?.phone || customerData.billingPhone || '',
                    billingFax: customerData.billingAddress?.fax || customerData.billingFax || '',
                    shippingAttention: customerData.shippingAddress?.attention || customerData.shippingAttention || '',
                    shippingCountry: customerData.shippingAddress?.country || customerData.shippingCountry || '',
                    shippingStreet1: customerData.shippingAddress?.street1 || customerData.shippingStreet1 || '',
                    shippingStreet2: customerData.shippingAddress?.street2 || customerData.shippingStreet2 || '',
                    shippingCity: customerData.shippingAddress?.city || customerData.shippingCity || '',
                    shippingState: customerData.shippingAddress?.state || customerData.shippingState || '',
                    shippingZipCode: customerData.shippingAddress?.zipCode || customerData.shippingZipCode || '',
                    shippingPhone: customerData.shippingAddress?.phone || customerData.shippingPhone || '',
                    shippingFax: customerData.shippingAddress?.fax || customerData.shippingFax || '',
                    remarks: customerData.remarks || customerData.notes || '',
                    comments: normalizedComments
                };
                setCustomer(mappedCustomer);
                setComments(normalizedComments);

                // Load attachments from customer documents
                setAttachments(mapDocumentsToAttachments(customerData.documents || []));

                // Load sample mails for this customer
                const customerEmail = mappedCustomer.email || "";
                const sampleMails = [];

                if (customerEmail) {
                    sampleMails.push({
                        id: 1,
                        to: customerEmail,
                        subject: "Payment Acknowledgment",
                        description: "Payment Received by taban",
                        date: "11 Dec 2025 01:30 PM",
                        type: "payment",
                        initial: customerEmail.charAt(0).toUpperCase()
                    });
                }

                const secondaryEmail = mappedCustomer.contactPersons?.[0]?.email || "maxamed9885m@gmail.com";
                sampleMails.push({
                    id: 2,
                    to: secondaryEmail,
                    subject: "Draft Notification",
                    description: "New auto-generated invoice for the recurring profile: taban profile",
                    date: "11 Dec 2025 12:09 PM",
                    type: "invoice",
                    initial: secondaryEmail.charAt(0).toUpperCase()
                });

                setMails(sampleMails);
            } else {
                navigate("/sales/customers");
                return;
            }

            // Process invoices
            if (invoicesResponse && invoicesResponse.success && invoicesResponse.data) {
                const invoiceCustomerId = String(customerResponse?.data?.id || customerResponse?.data?._id || '');
                const customerInvoices = invoicesResponse.data.filter((inv: any) => {
                    const invCustomerId = String(inv.customerId || inv.customer?._id || inv.customer || '').trim();
                    return invCustomerId === invoiceCustomerId;
                });
                setInvoices(customerInvoices);
            } else {
                setInvoices([]);
            }

            // Process payments
            if (paymentsResponse && paymentsResponse.success && paymentsResponse.data) {
                const paymentCustomerId = String(customerResponse?.data?.id || customerResponse?.data?._id || '');
                const customerPayments = paymentsResponse.data.filter((payment: any) => {
                    const paymentCustId = String(payment.customerId || payment.customer?._id || payment.customer || '').trim();
                    return paymentCustId === paymentCustomerId;
                });
                setPayments(customerPayments);
            } else {
                setPayments([]);
            }

            // Process credit notes
            if (creditNotesResponse && creditNotesResponse.success && creditNotesResponse.data) {
                const cnCustomerId = String(customerResponse?.data?.id || customerResponse?.data?._id || '');
                const customerCreditNotes = creditNotesResponse.data.filter((cn: any) => {
                    const cnCustId = String(cn.customerId || cn.customer?._id || cn.customer || '').trim();
                    return cnCustId === cnCustomerId;
                });
                setCreditNotes(customerCreditNotes);
            } else {
                setCreditNotes([]);
            }

            // Process currencies
            if (currenciesData && Array.isArray(currenciesData)) {
                setAvailableCurrencies(currenciesData.filter((c: any) => c.status === 'active'));
            }

            // Process customers list
            if (customersResponse && customersResponse.success && customersResponse.data) {
                setCustomers(customersResponse.data.map((c: any) => ({
                    ...c,
                    id: String(c._id || c.id),
                    name: c.displayName || c.name
                })));
            }

            // Process Quotes
            if (quotesResponse && quotesResponse.success && quotesResponse.data) {
                setQuotes(quotesResponse.data);
            }

            // Process Recurring Invoices
            if (recurringInvoicesResponse && recurringInvoicesResponse.success && recurringInvoicesResponse.data) {
                const customerRI = recurringInvoicesResponse.data.filter((ri: any) =>
                    String(ri.customerId || ri.customer?._id || ri.customer || '').trim() === customerId
                );
                setRecurringInvoices(customerRI);
            }

            // Process Expenses
            if (expensesResponse && expensesResponse.success && expensesResponse.data) {
                const customerExp = expensesResponse.data.filter((exp: any) =>
                    String(exp.customerId || exp.customer?._id || exp.customer || '').trim() === customerId
                );
                setExpenses(customerExp);
            }

            // Process Recurring Expenses
            if (recurringExpensesResponse && recurringExpensesResponse.success && recurringExpensesResponse.data) {
                const customerRE = recurringExpensesResponse.data.filter((re: any) =>
                    String(re.customerId || re.customer?._id || re.customer || '').trim() === customerId
                );
                setRecurringExpenses(customerRE);
            }

            // Process Projects
            if (projectsResponse && projectsResponse.success && projectsResponse.data) {
                setProjects(projectsResponse.data);
            }

            // Process Bills
            if (billsResponse && billsResponse.success && billsResponse.data) {
                const customerBills = billsResponse.data.filter((bill: any) =>
                    String(bill.customerId || bill.customer?._id || bill.customer || '').trim() === customerId
                );
                setBills(customerBills);
            }

            // Process Sales Receipts
            if (salesReceiptsResponse && salesReceiptsResponse.success && salesReceiptsResponse.data) {
                setSalesReceipts(salesReceiptsResponse.data);
            }

            // Process Journals
            if (journalsResponse && journalsResponse.success && journalsResponse.data) {
                const customerJournals = journalsResponse.data.filter((journal: any) =>
                    String(journal.customerId || journal.customer?._id || journal.customer || '').trim() === customerId
                );
                setJournals(customerJournals);
            }

            // Process Vendors list
            if (vendorsResponse && vendorsResponse.success && vendorsResponse.data) {
                const mappedVendors = vendorsResponse.data.map((v: any) => ({
                    ...v,
                    id: String(v._id || v.id),
                    name: v.displayName || v.vendorName || v.companyName || v.name
                }));
                setVendors(mappedVendors);

                // If customer has a linked vendor, find it in the list
                if (customerResponse?.data?.linkedVendorId) {
                    const foundVendor = mappedVendors.find((v: any) => String(v.id) === String(customerResponse.data.linkedVendorId));
                    if (foundVendor) {
                        setLinkedVendor(foundVendor);
                    } else {
                        setLinkedVendor(null);
                    }
                } else {
                    setLinkedVendor(null);
                }
            }

        } catch (error: any) {
            toast.error('Failed to refresh customer data: ' + (error.message || 'Unknown error'));
        } finally {
            setIsRefreshing(false);
        }
    };

    // Load customer data when ID changes
    useEffect(() => {
        let isActive = true;
        const loadData = async () => {
            if (!id) return;

            const customerId = String(id).trim();
            const prefill = (location.state as any)?.customer || null;
            const prefillId = prefill ? String(prefill._id || prefill.id || "").trim() : "";
            if (prefill && prefillId && prefillId === customerId) {
                // Ensure name/displayName are present so header doesn't flash wrong values.
                const prefillName =
                    prefill.displayName ||
                    prefill.name ||
                    prefill.companyName ||
                    `${prefill.firstName || ""} ${prefill.lastName || ""}`.trim() ||
                    "Customer";
                setCustomer({
                    ...prefill,
                    id: String(prefill._id || prefill.id),
                    _id: prefill._id || prefill.id,
                    name: prefillName,
                    displayName: prefill.displayName || prefillName
                });
                setComments(normalizeComments(prefill.comments));
                setLoading(false);
            } else {
                // Avoid showing previous customer's state for a different ID.
                setCustomer(null);
                setComments([]);
                setLoading(true);
            }
            try {
                const [
                    customerResponse,
                    currenciesData,
                    customersResponse
                ] = await Promise.all([
                    customersAPI.getById(customerId),
                    currenciesAPI.getAll(),
                    customersAPI.getAll({ limit: 1000 })
                ]);

                // Process customer data
                if (customerResponse && customerResponse.success && customerResponse.data) {
                    const customerData = customerResponse.data;

                    // Ensure name is always set with proper fallbacks
                    let customerName = customerData.displayName || customerData.name;
                    if (!customerName || customerName.trim() === '') {
                        const firstName = customerData.firstName || '';
                        const lastName = customerData.lastName || '';
                        const companyName = customerData.companyName || '';

                        if (firstName || lastName) {
                            customerName = `${firstName} ${lastName}`.trim();
                        } else if (companyName) {
                            customerName = companyName.trim();
                        } else {
                            customerName = 'Customer';
                        }
                    }
                    customerName = customerName.trim() || 'Customer';
                    const normalizedComments = normalizeComments(customerData.comments);

                    const mappedCustomer = {
                        ...customerData,
                        id: String(customerData._id || customerData.id),
                        name: customerName,
                        displayName: customerData.displayName || customerName,
                        // Map addresses if they're nested
                        billingAttention: customerData.billingAddress?.attention || customerData.billingAttention || '',
                        billingCountry: customerData.billingAddress?.country || customerData.billingCountry || '',
                        billingStreet1: customerData.billingAddress?.street1 || customerData.billingStreet1 || '',
                        billingStreet2: customerData.billingAddress?.street2 || customerData.billingStreet2 || '',
                        billingCity: customerData.billingAddress?.city || customerData.billingCity || '',
                        billingState: customerData.billingAddress?.state || customerData.billingState || '',
                        billingZipCode: customerData.billingAddress?.zipCode || customerData.billingZipCode || '',
                        billingPhone: customerData.billingAddress?.phone || customerData.billingPhone || '',
                        billingFax: customerData.billingAddress?.fax || customerData.billingFax || '',
                        shippingAttention: customerData.shippingAddress?.attention || customerData.shippingAttention || '',
                        shippingCountry: customerData.shippingAddress?.country || customerData.shippingCountry || '',
                        shippingStreet1: customerData.shippingAddress?.street1 || customerData.shippingStreet1 || '',
                        shippingStreet2: customerData.shippingAddress?.street2 || customerData.shippingStreet2 || '',
                        shippingCity: customerData.shippingAddress?.city || customerData.shippingCity || '',
                        shippingState: customerData.shippingAddress?.state || customerData.shippingState || '',
                        shippingZipCode: customerData.shippingAddress?.zipCode || customerData.shippingZipCode || '',
                        shippingPhone: customerData.shippingAddress?.phone || customerData.shippingPhone || '',
                        shippingFax: customerData.shippingAddress?.fax || customerData.shippingFax || '',
                        remarks: customerData.remarks || customerData.notes || '',
                        comments: normalizedComments
                    };
                    setCustomer(mappedCustomer);
                    setComments(normalizedComments);
                    setAttachments(mapDocumentsToAttachments(customerData.documents || []));

                    // Load sample mails for this customer
                    const customerEmail = mappedCustomer.email || "";
                    const sampleMails = [];

                    // Add sample mails based on customer email
                    if (customerEmail) {
                        sampleMails.push({
                            id: 1,
                            to: customerEmail,
                            subject: "Payment Acknowledgment",
                            description: "Payment Received by taban",
                            date: "11 Dec 2025 01:30 PM",
                            type: "payment",
                            initial: customerEmail.charAt(0).toUpperCase()
                        });
                    }

                    // Add a second sample mail with different email
                    const secondaryEmail = mappedCustomer.contactPersons?.[0]?.email || "maxamed9885m@gmail.com";
                    sampleMails.push({
                        id: 2,
                        to: secondaryEmail,
                        subject: "Draft Notification",
                        description: "New auto-generated invoice for the recurring profile: taban profile",
                        date: "11 Dec 2025 12:09 PM",
                        type: "invoice",
                        initial: secondaryEmail.charAt(0).toUpperCase()
                    });

                    setMails(sampleMails);
                } else {
                    navigate("/sales/customers");
                    return;
                }

                // Process currencies
                if (currenciesData && Array.isArray(currenciesData)) {
                    setAvailableCurrencies(currenciesData.filter(c => c.status === 'active'));
                }

                // Process customers list
                if (customersResponse && customersResponse.success && customersResponse.data) {
                    setCustomers((customersResponse.data as any[]).map(c => ({
                        ...c,
                        id: String(c._id || c.id),
                        name: c.displayName || c.name
                    })) as ExtendedCustomer[]);
                }

                if (!isActive) return;
                setLoading(false);

                const canonicalCustomerId = String(customerResponse?.data?._id || customerResponse?.data?.id || customerId).trim();
                const linkedVendorId = String(customerResponse?.data?.linkedVendorId || "").trim();

                // Load heavy/secondary datasets in the background to avoid blocking initial render.
                const loadSupplementaryData = async () => {
                    try {
                        const [
                            invoicesResponse,
                            paymentsResponse,
                            creditNotesResponse,
                            quotesResponse,
                            recurringInvoicesResponse,
                            expensesResponse,
                            recurringExpensesResponse,
                            projectsResponse,
                            billsResponse,
                            salesReceiptsResponse,
                            journalsResponse,
                            vendorsResponse
                        ] = await Promise.all([
                            invoicesAPI.getByCustomer(customerId).catch(() => ({ success: true, data: [] })),
                            paymentsReceivedAPI.getByInvoice(customerId).catch(() => ({ success: true, data: [] })),
                            creditNotesAPI.getByCustomer(customerId).catch(() => ({ success: true, data: [] })),
                            quotesAPI.getAll({ customerId }).catch(() => ({ success: true, data: [] })),
                            recurringInvoicesAPI.getAll().catch(() => ({ success: true, data: [] })),
                            expensesAPI.getAll().catch(() => ({ success: true, data: [] })),
                            recurringExpensesAPI.getAll().catch(() => ({ success: true, data: [] })),
                            projectsAPI.getByCustomer(customerId).catch(() => ({ success: true, data: [] })),
                            billsAPI.getAll().catch(() => ({ success: true, data: [] })),
                            salesReceiptsAPI.getAll({ customerId }).catch(() => ({ success: true, data: [] })),
                            journalEntriesAPI.getAll().catch(() => ({ success: true, data: [] })),
                            vendorsAPI.getAll().catch(() => ({ success: true, data: [] }))
                        ]);

                        if (!isActive) return;

                        // Process invoices
                        if (invoicesResponse && invoicesResponse.success && invoicesResponse.data) {
                            const customerInvoices = invoicesResponse.data.filter((inv: any) => {
                                const invCustomerId = String(inv.customerId || inv.customer?._id || inv.customer || '').trim();
                                return invCustomerId === canonicalCustomerId;
                            });
                            setInvoices(customerInvoices);
                        } else {
                            setInvoices([]);
                        }

                        // Process payments
                        if (paymentsResponse && paymentsResponse.success && paymentsResponse.data) {
                            const customerPayments = paymentsResponse.data.filter((payment: any) => {
                                const paymentCustId = String(payment.customerId || payment.customer?._id || payment.customer || '').trim();
                                return paymentCustId === canonicalCustomerId;
                            });
                            setPayments(customerPayments);
                        } else {
                            setPayments([]);
                        }

                        // Process credit notes
                        if (creditNotesResponse && creditNotesResponse.success && creditNotesResponse.data) {
                            const customerCreditNotes = creditNotesResponse.data.filter((cn: any) => {
                                const cnCustId = String(cn.customerId || cn.customer?._id || cn.customer || '').trim();
                                return cnCustId === canonicalCustomerId;
                            });
                            setCreditNotes(customerCreditNotes);
                        } else {
                            setCreditNotes([]);
                        }

                        // Process Quotes
                        if (quotesResponse && quotesResponse.success && quotesResponse.data) {
                            setQuotes(quotesResponse.data);
                        }

                        // Process Recurring Invoices
                        if (recurringInvoicesResponse && recurringInvoicesResponse.success && recurringInvoicesResponse.data) {
                            const customerRI = recurringInvoicesResponse.data.filter((ri: any) =>
                                String(ri.customerId || ri.customer?._id || ri.customer || '').trim() === canonicalCustomerId
                            );
                            setRecurringInvoices(customerRI);
                        }

                        // Process Expenses
                        if (expensesResponse && expensesResponse.success && expensesResponse.data) {
                            const customerExp = expensesResponse.data.filter((exp: any) =>
                                String(exp.customerId || exp.customer?._id || exp.customer || '').trim() === canonicalCustomerId
                            );
                            setExpenses(customerExp);
                        }

                        // Process Recurring Expenses
                        if (recurringExpensesResponse && recurringExpensesResponse.success && recurringExpensesResponse.data) {
                            const customerRE = recurringExpensesResponse.data.filter((re: any) =>
                                String(re.customerId || re.customer?._id || re.customer || '').trim() === canonicalCustomerId
                            );
                            setRecurringExpenses(customerRE);
                        }

                        // Process Projects
                        if (projectsResponse && projectsResponse.success && projectsResponse.data) {
                            setProjects(projectsResponse.data);
                        }

                        // Process Bills
                        if (billsResponse && billsResponse.success && billsResponse.data) {
                            const customerBills = billsResponse.data.filter((bill: any) =>
                                String(bill.customerId || bill.customer?._id || bill.customer || '').trim() === canonicalCustomerId
                            );
                            setBills(customerBills);
                        }

                        // Process Sales Receipts
                        if (salesReceiptsResponse && salesReceiptsResponse.success && salesReceiptsResponse.data) {
                            setSalesReceipts(salesReceiptsResponse.data);
                        }

                        // Process Journals
                        if (journalsResponse && journalsResponse.success && journalsResponse.data) {
                            const customerJournals = journalsResponse.data.filter((journal: any) =>
                                String(journal.customerId || journal.customer?._id || journal.customer || '').trim() === canonicalCustomerId
                            );
                            setJournals(customerJournals);
                        }

                        // Process Vendors list
                        if (vendorsResponse && vendorsResponse.success && vendorsResponse.data) {
                            const mappedVendors = vendorsResponse.data.map((v: any) => ({
                                ...v,
                                id: String(v._id || v.id),
                                name: v.displayName || v.vendorName || v.companyName || v.name
                            }));
                            setVendors(mappedVendors);

                            if (linkedVendorId) {
                                const foundVendor = mappedVendors.find((v: any) => String(v.id) === linkedVendorId);
                                setLinkedVendor(foundVendor || null);
                            } else {
                                setLinkedVendor(null);
                            }
                        }
                    } catch (error: any) {
                        if (!isActive) return;
                        toast.error('Failed to load customer details: ' + (error.message || 'Unknown error'));
                    }
                };

                loadSupplementaryData();
            } catch (error: any) {
                if (!isActive) return;
                alert('Error loading customer: ' + (error.message || 'Unknown error'));
                navigate("/sales/customers");
            }
        };

        loadData();
        fetchOrganizationProfile(); // Fetch organization profile for statement generation
        fetchOwnerEmail(); // Fetch owner email for statement generation

        return () => {
            isActive = false;
        };
    }, [id, location.key]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    useEffect(() => {
        const linkedVendorId = String(customer?.linkedVendorId || "").trim();
        if (!linkedVendorId) {
            setLinkedVendorPurchases([]);
            setLinkedVendorPaymentsMade([]);
            setLinkedVendorPurchaseOrders([]);
            setLinkedVendorCredits([]);
            return;
        }

        let isActive = true;
        const loadLinkedVendorPurchases = async () => {
            setIsLinkedVendorPurchasesLoading(true);
            try {
                const linkedVendorName = String(customer?.linkedVendorName || linkedVendor?.name || "").toLowerCase().trim();
                const matchesLinkedVendor = (row: any) => {
                    const rowVendorId = String(
                        row.vendorId || row.vendor?._id || row.vendor || row.vendor_id || ""
                    ).trim();
                    if (rowVendorId && rowVendorId === linkedVendorId) return true;

                    const rowVendorName = String(
                        row.vendorName || row.vendor_name || row.vendor?.name || ""
                    ).toLowerCase().trim();
                    return Boolean(
                        linkedVendorName &&
                        rowVendorName &&
                        (rowVendorName === linkedVendorName ||
                            rowVendorName.includes(linkedVendorName) ||
                            linkedVendorName.includes(rowVendorName))
                    );
                };

                const [billsByVendorResponse, allBillsResponse, paymentsMadeResponse, purchaseOrdersResponse, vendorCreditsResponse] = await Promise.all([
                    billsAPI.getByVendor(linkedVendorId).catch(() => null),
                    billsAPI.getAll().catch(() => ({ data: [] })),
                    paymentsMadeAPI.getAll().catch(() => ({ data: [] })),
                    purchaseOrdersAPI.getAll().catch(() => ({ data: [] })),
                    vendorCreditsAPI.getAll().catch(() => ({ data: [] }))
                ]);

                let vendorBills: any[] = Array.isArray(billsByVendorResponse?.data)
                    ? billsByVendorResponse.data
                    : (Array.isArray(billsByVendorResponse) ? billsByVendorResponse : []);
                if (vendorBills.length === 0) {
                    const allBills = Array.isArray(allBillsResponse?.data)
                        ? allBillsResponse.data
                        : (Array.isArray(allBillsResponse) ? allBillsResponse : []);
                    vendorBills = allBills.filter(matchesLinkedVendor);
                }

                const allPaymentsMade = Array.isArray(paymentsMadeResponse?.data)
                    ? paymentsMadeResponse.data
                    : (Array.isArray(paymentsMadeResponse) ? paymentsMadeResponse : []);
                const allPurchaseOrders = Array.isArray(purchaseOrdersResponse?.data)
                    ? purchaseOrdersResponse.data
                    : (Array.isArray(purchaseOrdersResponse) ? purchaseOrdersResponse : []);
                const allVendorCredits = Array.isArray(vendorCreditsResponse?.data)
                    ? vendorCreditsResponse.data
                    : (Array.isArray(vendorCreditsResponse) ? vendorCreditsResponse : []);

                const vendorPaymentsMade = allPaymentsMade.filter(matchesLinkedVendor);
                const vendorPurchaseOrders = allPurchaseOrders.filter(matchesLinkedVendor);
                const vendorCredits = allVendorCredits.filter(matchesLinkedVendor);

                if (isActive) {
                    setLinkedVendorPurchases(vendorBills);
                    setLinkedVendorPaymentsMade(vendorPaymentsMade);
                    setLinkedVendorPurchaseOrders(vendorPurchaseOrders);
                    setLinkedVendorCredits(vendorCredits);
                }
            } catch (error) {
                if (isActive) {
                    setLinkedVendorPurchases([]);
                    setLinkedVendorPaymentsMade([]);
                    setLinkedVendorPurchaseOrders([]);
                    setLinkedVendorCredits([]);
                }
            } finally {
                if (isActive) setIsLinkedVendorPurchasesLoading(false);
            }
        };

        loadLinkedVendorPurchases();
        return () => {
            isActive = false;
        };
    }, [customer?.linkedVendorId, customer?.linkedVendorName, linkedVendor?.name]);

    useEffect(() => {
        if (activeTab === "purchases" && !customer?.linkedVendorId) {
            setActiveTab("overview");
        }
    }, [activeTab, customer?.linkedVendorId]);

    // Build statement transactions from invoices, payments, and credit notes
    useEffect(() => {
        if (!customer) {
            setStatementTransactions([]);
            return;
        }

        const transactions: Transaction[] = [];

        // Add opening balance
        transactions.push({
            id: "opening",
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            type: "Opening Balance",
            details: "***Opening Balance***",
            amount: parseFloat(String(customer.openingBalance || 0)),
            payments: 0,
            balance: parseFloat(String(customer.openingBalance || 0))
        });

        // Add payments
        payments.forEach(payment => {
            transactions.push({
                id: `payment-${payment.id}`,
                date: payment.paymentDate || payment.date || new Date().toISOString(),
                type: "Payment Received",
                details: `${payment.paymentNumber || payment.id}\nAMD${parseFloat(String(payment.amountReceived || payment.amount || 0)).toLocaleString()} in excess payments`,
                detailsLink: payment.paymentNumber || payment.id,
                amount: 0,
                payments: parseFloat(String(payment.amountReceived || payment.amount || 0)),
                balance: 0
            });
        });

        // Add credit notes
        creditNotes.forEach(cn => {
            transactions.push({
                id: `cn-${cn.id}`,
                date: cn.date || cn.creditNoteDate || new Date().toISOString(),
                type: "Credit Note",
                details: cn.creditNoteNumber || cn.id,
                detailsLink: cn.creditNoteNumber || cn.id,
                amount: -(parseFloat(String(cn.total || cn.amount || 0))),
                payments: 0,
                balance: 0
            });
        });

        // Add invoices
        invoices.forEach(inv => {
            transactions.push({
                id: `inv-${inv.id}`,
                date: inv.date || inv.invoiceDate || new Date().toISOString(),
                type: "Invoice",
                details: inv.invoiceNumber || inv.id,
                detailsLink: inv.invoiceNumber || inv.id,
                amount: parseFloat(String(inv.total || inv.amount || 0)),
                payments: 0,
                balance: 0
            });
        });

        // Sort by date
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate running balance
        let runningBalance = 0;
        transactions.forEach(t => {
            runningBalance = runningBalance + t.amount - t.payments;
            t.balance = runningBalance;
        });

        setStatementTransactions(transactions);
    }, [customer, invoices, payments, creditNotes]);

    // Listen for customer update events
    // Listen for customer update events
    useEffect(() => {
        const handleCustomerUpdated = (event: any) => {
            // Reload customer data if the updated customer matches this one
            if (event.detail?.customer && id) {
                const updatedCustomerId = String(event.detail.customer._id || event.detail.customer.id);
                const currentCustomerId = String(id);
                if (updatedCustomerId === currentCustomerId) {
                    refreshData();
                    toast.success('Customer data refreshed');
                }
            }
        };

        window.addEventListener('customersUpdated', handleCustomerUpdated);

        return () => {
            window.removeEventListener('customersUpdated', handleCustomerUpdated);
        };
    }, [id]);

    // Reload when page becomes visible (user navigates back from edit)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && id) {
                refreshData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [id]);

    // Close dropdowns when clicking outside
    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (invoiceViewDropdownRef.current && !invoiceViewDropdownRef.current.contains(event.target as Node)) {
                setIsInvoiceViewDropdownOpen(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
            if (linkEmailDropdownRef.current && !linkEmailDropdownRef.current.contains(event.target as Node)) {
                setIsLinkEmailDropdownOpen(false);
            }
            if (statementPeriodDropdownRef.current && !statementPeriodDropdownRef.current.contains(event.target as Node)) {
                setIsStatementPeriodDropdownOpen(false);
            }
            if (statementFilterDropdownRef.current && !statementFilterDropdownRef.current.contains(event.target as Node)) {
                setIsStatementFilterDropdownOpen(false);
            }
            if (bulkActionsDropdownRef.current && !bulkActionsDropdownRef.current.contains(event.target as Node)) {
                setIsBulkActionsDropdownOpen(false);
            }
            if (startDatePickerRef.current && !startDatePickerRef.current.contains(event.target as Node)) {
                setIsStartDatePickerOpen(false);
            }
            if (endDatePickerRef.current && !endDatePickerRef.current.contains(event.target as Node)) {
                setIsEndDatePickerOpen(false);
            }
            if (mergeCustomerDropdownRef.current && !mergeCustomerDropdownRef.current.contains(event.target as Node)) {
                setIsMergeCustomerDropdownOpen(false);
            }
            if (newTransactionDropdownRef.current && !newTransactionDropdownRef.current.contains(event.target as Node)) {
                setIsNewTransactionDropdownOpen(false);
            }
            if (goToTransactionsDropdownRef.current && !goToTransactionsDropdownRef.current.contains(event.target as Node)) {
                setIsGoToTransactionsDropdownOpen(false);
            }
            if (attachmentsDropdownRef.current && !attachmentsDropdownRef.current.contains(event.target as Node)) {
                setIsAttachmentsDropdownOpen(false);
            }
            if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
                setIsMoreDropdownOpen(false);
            }
            if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
                setIsSettingsDropdownOpen(false);
            }
            if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
                setIsVendorDropdownOpen(false);
            }
            if (sidebarMoreMenuRef.current && !sidebarMoreMenuRef.current.contains(event.target as Node)) {
                setIsSidebarMoreMenuOpen(false);
            }
            if (quoteStatusDropdownRef.current && !quoteStatusDropdownRef.current.contains(event.target as Node)) {
                setIsQuoteStatusDropdownOpen(false);
            }
            if (recurringInvoiceStatusDropdownRef.current && !recurringInvoiceStatusDropdownRef.current.contains(event.target as Node)) {
                setIsRecurringInvoiceStatusDropdownOpen(false);
            }
            if (expenseStatusDropdownRef.current && !expenseStatusDropdownRef.current.contains(event.target as Node)) {
                setIsExpenseStatusDropdownOpen(false);
            }
            if (recurringExpenseStatusDropdownRef.current && !recurringExpenseStatusDropdownRef.current.contains(event.target as Node)) {
                setIsRecurringExpenseStatusDropdownOpen(false);
            }
            if (projectStatusDropdownRef.current && !projectStatusDropdownRef.current.contains(event.target as Node)) {
                setIsProjectStatusDropdownOpen(false);
            }
            if (billStatusDropdownRef.current && !billStatusDropdownRef.current.contains(event.target as Node)) {
                setIsBillStatusDropdownOpen(false);
            }
            if (creditNoteStatusDropdownRef.current && !creditNoteStatusDropdownRef.current.contains(event.target as Node)) {
                setIsCreditNoteStatusDropdownOpen(false);
            }
            if (salesReceiptStatusDropdownRef.current && !salesReceiptStatusDropdownRef.current.contains(event.target as Node)) {
                setIsSalesReceiptStatusDropdownOpen(false);
            }
            if (subscriptionDropdownRef.current && !subscriptionDropdownRef.current.contains(event.target as Node)) {
                setIsSubscriptionDropdownOpen(false);
            }
        };
        if (isInvoiceViewDropdownOpen || isStatusDropdownOpen || isLinkEmailDropdownOpen || isStatementPeriodDropdownOpen || isStatementFilterDropdownOpen || isBulkActionsDropdownOpen || isStartDatePickerOpen || isEndDatePickerOpen || isMergeCustomerDropdownOpen || isNewTransactionDropdownOpen || isGoToTransactionsDropdownOpen || isAttachmentsDropdownOpen || isMoreDropdownOpen || isVendorDropdownOpen || isSettingsDropdownOpen || isSidebarMoreMenuOpen ||
            isQuoteStatusDropdownOpen || isRecurringInvoiceStatusDropdownOpen || isExpenseStatusDropdownOpen || isRecurringExpenseStatusDropdownOpen || isProjectStatusDropdownOpen || isBillStatusDropdownOpen || isCreditNoteStatusDropdownOpen || isSalesReceiptStatusDropdownOpen || isSubscriptionDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isInvoiceViewDropdownOpen, isStatusDropdownOpen, isLinkEmailDropdownOpen, isStatementPeriodDropdownOpen, isStatementFilterDropdownOpen, isBulkActionsDropdownOpen, isStartDatePickerOpen, isEndDatePickerOpen, isMergeCustomerDropdownOpen, isNewTransactionDropdownOpen, isGoToTransactionsDropdownOpen, isAttachmentsDropdownOpen, isMoreDropdownOpen, isVendorDropdownOpen, isSettingsDropdownOpen, isSidebarMoreMenuOpen,
        isQuoteStatusDropdownOpen, isRecurringInvoiceStatusDropdownOpen, isExpenseStatusDropdownOpen, isRecurringExpenseStatusDropdownOpen, isProjectStatusDropdownOpen, isBillStatusDropdownOpen, isCreditNoteStatusDropdownOpen, isSalesReceiptStatusDropdownOpen, isSubscriptionDropdownOpen]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const openTransactionSection = (section: keyof typeof expandedTransactions) => {
        setExpandedTransactions(prev => {
            const next = { ...prev };
            (Object.keys(next) as Array<keyof typeof next>).forEach((key) => {
                next[key] = false;
            });
            next[section] = true;
            return next;
        });
        setSelectedTransactionType(section);
        setIsGoToTransactionsDropdownOpen(false);
    };

    const toggleTransactionSection = (section: keyof typeof expandedTransactions) => {
        setExpandedTransactions(prev => {
            const isOpen = prev[section];
            const next = { ...prev };
            (Object.keys(next) as Array<keyof typeof next>).forEach((key) => {
                next[key] = false;
            });
            next[section] = !isOpen;
            return next;
        });
        setSelectedTransactionType(section);
    };

    const toggleLinkedVendorPurchaseSection = (section: keyof typeof linkedVendorPurchaseSections) => {
        setLinkedVendorPurchaseSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Customer selection handlers
    const handleCustomerCheckboxChange = (customerId: string, e: React.MouseEvent | React.ChangeEvent) => {
        e.stopPropagation();
        setSelectedCustomers(prev => {
            if (prev.includes(customerId)) {
                return prev.filter(id => id !== customerId);
            } else {
                return [...prev, customerId];
            }
        });
    };

    const handleClearSelection = () => {
        setSelectedCustomers([]);
    };

    const handleSelectAllCustomers = () => {
        if (selectedCustomers.length === customers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(customers.map((c: any) => c.id));
        }
    };

    const handlePrintCustomerStatements = () => {
        setIsBulkActionsDropdownOpen(false);
        setIsPrintStatementsModalOpen(true);
    };

    const handlePrintStatementsSubmit = () => {
        // TODO: Implement actual print functionality
        setIsPrintStatementsModalOpen(false);
        alert(`Printing statements for ${selectedCustomers.length} customer(s)`);
    };

    const handleUnlinkVendor = async () => {
        if (!customer) return;

        const confirmUnlink = window.confirm(`Are you sure you want to unlink "${customer.name || customer.displayName}" from its associated vendor?`);
        if (!confirmUnlink) return;

        try {
            const customerId = String(customer.id || customer._id || "");
            const linkedVendorId = String(customer.linkedVendorId || "").trim();

            await customersAPI.update(customerId, {
                ...customer,
                linkedVendorId: null,
                linkedVendorName: null
            });

            if (linkedVendorId) {
                await vendorsAPI.update(linkedVendorId, {
                    linkedCustomerId: null,
                    linkedCustomerName: null
                });
            }

            // Refresh customer data
            await refreshData();
            setLinkedVendor(null);
            setLinkedVendorPurchases([]);

            toast.success(`Customer "${customer.name || customer.displayName}" has been unlinked from the vendor`);
        } catch (error: any) {
            toast.error('Failed to unlink vendor: ' + (error.message || 'Unknown error'));
        }
        setIsMoreDropdownOpen(false);
    };

    // Statement print, PDF, and Excel functions
    const getStatementDateRange = () => {
        const now = new Date();
        let startDate, endDate;

        switch (statementPeriod) {
            case "this-month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case "last-month":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case "this-quarter":
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case "this-year":
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        return { startDate, endDate };
    };

    const handlePrintStatement = () => {
        if (!customer) return;

        const { startDate, endDate } = getStatementDateRange();
        const openingBalance = parseFloat(String(customer?.openingBalance || 0));
        const invoicedAmount = invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total || inv.amount || 0)), 0);
        const amountReceived = payments.reduce((sum, p) => sum + parseFloat(String(p.amountReceived || p.amount || 0)), 0);
        const totalCreditNotes = creditNotes.reduce((sum, cn) => sum + parseFloat(String(cn.total || cn.amount || 0)), 0);
        const balanceDue = openingBalance + invoicedAmount - amountReceived - totalCreditNotes;
        const currencyCode = customer?.currency || "USD";

        const printWindow = window.open('', '_blank');
        const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Statement - ${displayName || 'Customer'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; line-height: 1.4; }
          .statement-container { max-width: 1000px; margin: 0 auto; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .mb-1 { margin-bottom: 4px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-10 { margin-bottom: 40px; }
          .mb-12 { margin-bottom: 48px; }
          .mb-14 { margin-bottom: 56px; }
          .text-[17px] { font-size: 17px; }
          .text-[13px] { font-size: 13px; }
          .text-[11px] { font-size: 11px; }
          .text-[22px] { font-size: 22px; }
          .font-medium { font-weight: 500; }
          .font-bold { font-weight: 700; }
          .font-extrabold { font-weight: 800; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-900 { color: #111827; }
          .text-blue-600 { color: #2563eb; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-start { align-items: flex-start; }
          .items-end { align-items: flex-end; }
          .flex-col { flex-direction: column; }
          .gap-16 { gap: 64px; }
          .w-full { width: 100%; }
          .h-[2px] { height: 2px; }
          .bg-gray-900 { background-color: #111827; }
          .bg-dark { background-color: #2a2a2a; color: white !important; -webkit-print-color-adjust: exact; }
          .border-t-heavy { border-top: 3px solid #111827; }
          .px-3 { padding-left: 12px; padding-right: 12px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .py-3 { padding-top: 12px; padding-bottom: 12px; }
          .py-4 { padding-top: 16px; padding-bottom: 16px; }
          .py-2-5 { padding-top: 10px; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border-bottom: 1px solid #f3f4f6; padding: 10px; }
          th { text-align: left; color: white; }
          .summary-box { width: 360px; border-top: 2px solid #e5e7eb; }
          .tracking-tight { letter-spacing: -0.025em; }
          .tracking-wider { letter-spacing: 0.05em; }
          @media print {
            body { padding: 20px; }
            .bg-dark { background-color: #2a2a2a !important; color: white !important; }
            th { color: white !important; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="statement-container">
          <div class="flex justify-between items-start mb-12">
            <div class="flex gap-6 items-start">
              <div class="flex-shrink-0">
                ${organizationProfile?.logo ?
                `<img src="${organizationProfile.logo}" alt="Logo" style="max-width: 100px; max-height: 80px; object-fit: contain;" />` :
                `<div style="font-size: 40px;">📖</div>`}
              </div>
              <div class="flex flex-col">
                <div class="text-[18px] font-bold text-gray-900 mb-1">
                  ${organizationProfile?.organizationName || organizationProfile?.name || "TABAN ENTERPRISES"}
                </div>
                <div class="text-[14px] text-gray-600">
                  ${organizationProfile?.address?.street1 ? `<div>${organizationProfile.address.street1}</div>` : ''}
                  ${organizationProfile?.address?.street2 ? `<div>${organizationProfile.address.street2}</div>` : ''}
                  ${(organizationProfile?.address?.city || organizationProfile?.address?.state || organizationProfile?.address?.zipCode) ?
                `<div>${[organizationProfile.address.city, organizationProfile.address.state, organizationProfile.address.zipCode].filter(Boolean).join(', ')}</div>` : ''}
                  ${organizationProfile?.address?.country ? `<div>${organizationProfile.address.country}</div>` : ''}
                  <div class="mt-1">${ownerEmail?.email || organizationProfile?.email || ""}</div>
                </div>
              </div>
            </div>

            <div class="text-right">
              <h2 class="text-[32px] font-bold text-gray-900 mb-2">STATEMENT</h2>
              <div class="text-[14px] text-gray-600">
                ${startDate.toLocaleDateString('en-GB')} To ${endDate.toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          <div class="mb-8">
            <div class="text-[14px] font-bold text-gray-900 mb-2">To</div>
            <div class="text-[16px] font-medium text-blue-600">${displayName}</div>
          </div>

              <div class="summary-box">
                <div style="background-color: #f3f4f6; padding: 6px 12px; font-weight: bold; font-size: 11px; color: #374151; text-align: left; text-transform: uppercase;">Account Summary</div>
                <div class="flex justify-between px-3 py-2 text-[13px]">
                  <span>Opening Balance</span>
                  <span class="font-bold">${currencyCode} ${openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between px-3 py-2 text-[13px]">
                  <span>Invoiced Amount</span>
                  <span class="font-bold">${currencyCode} ${invoicedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between px-3 py-2 text-[13px]">
                  <span>Amount Received</span>
                  <span class="font-bold">${currencyCode} ${amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between px-3 py-2 text-[13px] font-bold border-t-heavy">
                  <span>Balance Due</span>
                  <span>${currencyCode} ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr class="bg-dark">
                <th class="py-2-5 px-3 uppercase text-[11px] font-bold tracking-wider">Date</th>
                <th class="py-2-5 px-3 uppercase text-[11px] font-bold tracking-wider">Transactions</th>
                <th class="py-2-5 px-3 uppercase text-[11px] font-bold tracking-wider">Details</th>
                <th class="py-2-5 px-3 uppercase text-[11px] font-bold tracking-wider text-right">Amount</th>
                <th class="py-2-5 px-3 uppercase text-[11px] font-bold tracking-wider text-right">Payments</th>
                <th class="py-2-5 px-3 uppercase text-[11px] font-bold tracking-wider text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${openingBalance !== 0 ? `
                <tr>
                  <td class="py-3 px-3 text-[13px]">01/01/${new Date().getFullYear()}</td>
                  <td class="py-3 px-3 text-[13px] italic font-medium text-gray-900">***Opening Balance***</td>
                  <td class="py-3 px-3 text-[13px]"></td>
                  <td class="py-3 px-3 text-[13px] text-right font-medium">${openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="py-3 px-3 text-[13px] text-right">0.00</td>
                  <td class="py-3 px-3 text-[13px] text-right font-bold">${(openingBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ` : ''}
              ${statementTransactions.map(transaction => `
                <tr>
                  <td class="py-3 px-3 text-[13px] font-medium">${new Date(transaction.date).toLocaleDateString('en-GB')}</td>
                  <td class="py-3 px-3 text-[13px] italic font-medium text-gray-900">***${transaction.type}***</td>
                  <td class="py-3 px-3 text-[13px] text-blue-600 font-bold">${transaction.detailsLink || ''}</td>
                  <td class="py-3 px-3 text-[13px] text-right font-medium">${transaction.amount !== 0 ? transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                  <td class="py-3 px-3 text-[13px] text-right">${transaction.payments !== 0 ? transaction.payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                  <td class="py-3 px-3 text-[13px] text-right font-bold">${(transaction.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="flex justify-end gap-16 py-4 px-3">
            <div class="text-[13px] font-bold text-gray-900 uppercase tracking-tight">Balance Due</div>
            <div class="text-[13px] font-bold text-gray-900">
              ${currencyCode} ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(() => {
              window.print(); 
              window.close();
            }, 700);
          }
        </script>
      </body>
      </html>
    `;

        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
        }
    };

    const handleDownloadPDF = async () => {
        if (!customer || isStatementDownloading) return;

        setIsStatementDownloading(true);

        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const receivables = parseFloat(String(customer.receivables || customer.openingBalance || 0));
        const currency = customer.currency || "USD";

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '210mm';
        document.body.appendChild(container);

        try {
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            container.innerHTML = `
          <div style="padding: 15mm; background: white; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a202c; line-height: 1.6; min-height: 297mm; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
              <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #156372; text-transform: uppercase; letter-spacing: -0.5px;">TABAN BOOKS</h1>
                <div style="margin-top: 8px; font-size: 13px; color: #4a5568;">
                  <p style="margin: 2px 0;">${organizationProfile?.address?.country || "Aland Islands"}</p>
                  <p style="margin: 2px 0;">${ownerEmail?.email || organizationProfile?.email || ""}</p>
                </div>
              </div>
              <div style="text-align: right;">
                <h2 style="margin: 0; font-size: 32px; font-weight: 900; color: #2d3748; text-transform: uppercase; line-height: 1;">Statement</h2>
                <div style="margin-top: 10px; font-size: 14px; font-weight: 600; color: #718096; background: #f7fafc; padding: 6px 12px; border-radius: 6px; display: inline-block;">
                  ${dateStr} - ${dateStr}
                </div>
              </div>
            </div>

            <div style="height: 1px; background: #e2e8f0; margin-bottom: 40px;"></div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px;">
              <div>
                <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a0aec0; font-weight: 700;">Statement Of Accounts To</h3>
                <div style="font-size: 16px; font-weight: 700; color: #1a202c;">${displayName || 'N/A'}</div>
                ${customer.companyName ? `<div style="font-size: 14px; color: #4a5568; margin-top: 4px;">${customer.companyName}</div>` : ''}
                <div style="font-size: 14px; color: #4a5568; margin-top: 2px;">${customer.email || ''}</div>
              </div>
              <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #edf2f7;">
                <h3 style="margin: 0 0 15px 0; font-size: 13px; text-transform: uppercase; color: #2d3748; font-weight: 700; border-bottom: 2px solid #156372; display: inline-block; padding-bottom: 4px;">Account Summary</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Opening Balance</td>
                    <td style="text-align: right; padding: 8px 0; font-weight: 600;">${currency} 0.00</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Invoiced Amount</td>
                    <td style="text-align: right; padding: 8px 0; font-weight: 600;">${currency} ${receivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #718096;">Amount Received</td>
                    <td style="text-align: right; padding: 8px 0; font-weight: 600; color: #48bb78;">${currency} 0.00</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0 0 0; font-weight: 800; color: #1a202c; font-size: 16px;">Balance Due</td>
                    <td style="text-align: right; padding: 12px 0 0 0; font-weight: 800; color: #156372; font-size: 18px;">${currency} ${receivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div style="margin-bottom: 60px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #156372; color: white;">
                    <th style="padding: 12px 15px; text-align: left; font-weight: 700; border-radius: 8px 0 0 8px;">DATE</th>
                    <th style="padding: 12px 15px; text-align: left; font-weight: 700;">TRANSACTIONS</th>
                    <th style="padding: 12px 15px; text-align: left; font-weight: 700;">DETAILS</th>
                    <th style="padding: 12px 15px; text-align: right; font-weight: 700;">AMOUNT</th>
                    <th style="padding: 12px 15px; text-align: right; font-weight: 700;">PAYMENTS</th>
                    <th style="padding: 12px 15px; text-align: right; font-weight: 700; border-radius: 0 8px 8px 0;">BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #edf2f7;">
                    <td style="padding: 15px;">${dateStr}</td>
                    <td style="padding: 15px; font-weight: 600;">Opening Balance</td>
                    <td style="padding: 15px; color: #718096;">Initial balance</td>
                    <td style="padding: 15px; text-align: right;">0.00</td>
                    <td style="padding: 15px; text-align: right; color: #48bb78;">0.00</td>
                    <td style="padding: 15px; text-align: right; font-weight: 600;">0.00</td>
                  </tr>
                  <tr style="background: #fcfcfc; border-bottom: 1px solid #edf2f7;">
                    <td style="padding: 15px;">${dateStr}</td>
                    <td style="padding: 15px; font-weight: 600; color: #156372;">Invoice</td>
                    <td style="padding: 15px; color: #718096;">Account Balance Adjustment</td>
                    <td style="padding: 15px; text-align: right;">${receivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style="padding: 15px; text-align: right;">0.00</td>
                    <td style="padding: 15px; text-align: right; font-weight: 600;">${receivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; border-top: 2px solid #156372;">
                    <td colspan="4" style="padding: 20px 15px; text-align: right; font-weight: 800; font-size: 14px; color: #2d3748;">NET BALANCE DUE</td>
                    <td style="padding: 20px 15px; text-align: right;"></td>
                    <td style="padding: 20px 15px; text-align: right; font-weight: 900; font-size: 15px; color: #156372;">${currency} ${receivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="position: absolute; bottom: 15mm; left: 15mm; right: 15mm; text-align: center; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 20px; font-size: 10px;">
              <p style="margin: 0; font-weight: 600;">Generated professionally by TABAN BOOKS Management System</p>
              <p style="margin: 4px 0 0 0;">Report Date: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        `;

            const canvas = await html2canvas(container, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
            pdf.save(`Statements_${today.toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            toast.error("Error generating PDF. Please try again.");
        } finally {
            try {
                document.body.removeChild(container);
            } catch (e) {
                // no-op
            }
            setIsStatementDownloading(false);
        }
    };

    const handleDownloadExcel = () => {
        if (!customer) return;

        const { startDate, endDate } = getStatementDateRange();
        const openingBalance = parseFloat(String(customer?.openingBalance || 0));
        const invoicedAmount = invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total || inv.amount || 0)), 0);
        const amountReceived = payments.reduce((sum, p) => sum + parseFloat(String(p.amountReceived || p.amount || 0)), 0);
        const balanceDue = openingBalance + invoicedAmount - amountReceived - creditNotes.reduce((sum, cn) => sum + parseFloat(String(cn.total || cn.amount || 0)), 0);

        // Create CSV content
        const headers = ['Date', 'Transactions', 'Details', 'Amount', 'Payments', 'Balance'];
        const csvRows = [
            [organizationProfile?.organizationName || organizationProfile?.name || "TABAN ENTERPRISES"],
            [organizationProfile?.address?.street1 || ""],
            [organizationProfile?.address?.street2 || ""],
            [[organizationProfile?.address?.city, organizationProfile?.address?.state, organizationProfile?.address?.zipCode].filter(Boolean).join(", ")],
            [organizationProfile?.address?.country || ""],
            [ownerEmail?.email || organizationProfile?.email || ""],
            [''],
            ['Customer Statement for ' + displayName],
            ['From ' + startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' To ' + endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
            [''],
            ['Account Summary'],
            ['Opening Balance', '', '', `${customer?.currency || "AMD"} ${openingBalance.toFixed(2)}`, '', ''],
            ['Invoiced Amount', '', '', `${customer?.currency || "AMD"} ${invoicedAmount.toFixed(2)}`, '', ''],
            ['Amount Received', '', '', `${customer?.currency || "AMD"} ${amountReceived.toLocaleString()}`, '', ''],
            ['Balance Due', '', '', `${customer?.currency || "AMD"} ${balanceDue.toFixed(2)}`, '', ''],
            [''],
            headers.join(','),
            ...statementTransactions.map(transaction => [
                new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                `"${(transaction.type || '').replace(/"/g, '""')}"`,
                `"${((transaction.detailsLink || transaction.details || '').replace(/"/g, '""'))}"`,
                transaction.amount !== 0 ? (transaction.amount < 0 ? `(${Math.abs(transaction.amount).toFixed(2)})` : transaction.amount.toFixed(2)) : '',
                transaction.payments !== 0 ? transaction.payments.toLocaleString() : '',
                transaction.balance.toFixed(2)
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `customer_statement_${displayName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        document.body.removeChild(link);
    };

    const handleMergeCustomers = () => {
        setIsBulkActionsDropdownOpen(false);
        setIsMoreDropdownOpen(false);
        setMergeTargetCustomer(null);
        setMergeCustomerSearch("");
        setIsMergeCustomerDropdownOpen(false);
        setIsMergeModalOpen(true);
    };

    const handleMergeSubmit = async () => {
        if (!mergeTargetCustomer) {
            alert("Please select a customer to merge with.");
            return;
        }
        if (!customer) {
            alert("Customer data not available.");
            return;
        }

        const sourceCustomer = customer;
        const sourceCustomerId = String(sourceCustomer.id || sourceCustomer._id || "").trim();
        const targetCustomer = mergeTargetCustomer;
        const targetCustomerId = String(targetCustomer.id || targetCustomer._id || "").trim();

        if (!sourceCustomerId || !targetCustomerId) {
            alert("Unable to determine customer IDs for merge.");
            return;
        }

        if (sourceCustomerId === targetCustomerId) {
            alert("Please select a different customer to merge with.");
            return;
        }

        try {
            await customersAPI.merge(targetCustomerId, [sourceCustomerId]);

            toast.success(`Successfully merged "${sourceCustomer.name || sourceCustomer.displayName}" into "${targetCustomer.name || targetCustomer.displayName}".`);
            setIsMergeModalOpen(false);
            setMergeTargetCustomer(null);
            setMergeCustomerSearch("");

            navigate(`/sales/customers/${targetCustomerId}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to merge customers");
        }
    };

    // Get customers available for merge (exclude current customer)
    const getMergeableCustomers = () => {
        return customers.filter(c => {
            const candidateId = String(c.id || c._id || "");
            if (candidateId === String(id)) return false;
            return true;
        });
    };

    const filteredMergeCustomers = getMergeableCustomers().filter(c =>
        c.name.toLowerCase().includes(mergeCustomerSearch.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(mergeCustomerSearch.toLowerCase()))
    );

    const handleAssociateTemplates = () => {
        setIsBulkActionsDropdownOpen(false);
        setIsMoreDropdownOpen(false);
        setIsAssociateTemplatesModalOpen(true);
    };

    const handleAssociateTemplatesSave = () => {
        // TODO: Implement actual save functionality
        setIsAssociateTemplatesModalOpen(false);
        toast.success("Templates associated successfully!");
    };

    const handleTemplateSelect = (category: string, field: string, value: string) => {
        if (category === "pdf") {
            setPdfTemplates(prev => ({ ...prev, [field]: value }));
        } else {
            setEmailNotifications(prev => ({ ...prev, [field]: value }));
        }
        setOpenTemplateDropdown(null);
        setTemplateSearches({});
    };

    const getFilteredTemplateOptions = (options: string[], field: string) => {
        const search = (templateSearches as any)[field] || "";
        return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !customer || !id) return;

        try {
            const currentDocuments = Array.isArray(customer.documents) ? customer.documents : [];
            const filesArray = Array.from(files);

            if (currentDocuments.length + filesArray.length > 10) {
                toast.error("You can upload a maximum of 10 files.");
                return;
            }

            const oversizedFiles = filesArray.filter((file) => file.size > 10 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                toast.error("Each file must be 10MB or less.");
                return;
            }

            const uploadedDocuments: any[] = [];
            for (const file of filesArray) {
                const uploadResponse = await documentsAPI.upload(file, {
                    name: file.name,
                    module: "Customers",
                    type: "other",
                    relatedToType: "customer",
                    relatedToId: String(id)
                });

                if (uploadResponse?.success && uploadResponse?.data) {
                    uploadedDocuments.push({
                        documentId: uploadResponse.data._id || uploadResponse.data.id,
                        name: file.name,
                        size: formatFileSize(file.size),
                        url: uploadResponse.data.url || "",
                        uploadedAt: uploadResponse.data.createdAt || new Date()
                    });
                }
            }

            if (uploadedDocuments.length === 0) {
                toast.error("Failed to upload files. Please try again.");
                return;
            }

            const updatedDocuments = [...currentDocuments, ...uploadedDocuments];
            const updateResponse = await customersAPI.update(id, { documents: updatedDocuments });
            const persistedDocuments = updateResponse?.data?.documents || updatedDocuments;

            setCustomer(prev => prev ? ({ ...prev, documents: persistedDocuments }) : prev);
            setAttachments(mapDocumentsToAttachments(persistedDocuments));

            toast.success(`${uploadedDocuments.length} file(s) uploaded successfully`);
        } catch (error) {
            toast.error('Failed to upload files: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveAttachment = async (attachmentId: number) => {
        if (!customer || !id) return;

        try {
            // Find the attachment to remove (attachmentId is 1-indexed)
            const attachmentIndex = attachmentId - 1;
            const currentDocuments = Array.isArray(customer.documents) ? customer.documents : [];
            const removedDocument = currentDocuments[attachmentIndex];
            const updatedDocuments = currentDocuments.filter((_, index) => index !== attachmentIndex);

            const removedDocumentId = removedDocument?.documentId || removedDocument?.id || removedDocument?._id;
            if (removedDocumentId) {
                try {
                    await documentsAPI.delete(String(removedDocumentId));
                } catch (_) {
                    // Keep customer update flow even if deleting source file fails
                }
            }

            const updateResponse = await customersAPI.update(id, { documents: updatedDocuments });
            const persistedDocuments = updateResponse?.data?.documents || updatedDocuments;

            setCustomer(prev => prev ? ({ ...prev, documents: persistedDocuments }) : prev);
            setAttachments(mapDocumentsToAttachments(persistedDocuments));

            toast.success('Attachment removed successfully');
        } catch (error) {
            toast.error('Failed to remove attachment: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleClone = () => {
        setIsMoreDropdownOpen(false);
        setCloneContactType("customer");
        handleCloneSubmit("customer");
    };

    const handleCloneSubmit = async (forcedType?: "customer" | "vendor") => {
        if (!customer) return;

        // Keep existing vendor behavior; auto-clone customer directly.
        const contactType = forcedType || cloneContactType;
        if (contactType === "vendor") {
            const clonedData = {
                ...customer,
                id: undefined,
                name: `${customer.name} (Copy)`,
                displayName: customer.displayName ? `${customer.displayName} (Copy)` : undefined
            };
            setIsCloneModalOpen(false);
            navigate("/purchases/vendors/new", { state: { clonedData } });
            return;
        }

        setIsCloning(true);
        try {
            const source: any = customer;
            const copySuffix = " (Copy)";
            const uniqueSuffix = Date.now().toString().slice(-4);

            const billingAddress = source.billingAddress || {
                attention: source.billingAttention || "",
                country: source.billingCountry || "",
                street1: source.billingStreet1 || "",
                street2: source.billingStreet2 || "",
                city: source.billingCity || "",
                state: source.billingState || "",
                zipCode: source.billingZipCode || "",
                phone: source.billingPhone || "",
                fax: source.billingFax || "",
            };

            const shippingAddress = source.shippingAddress || {
                attention: source.shippingAttention || "",
                country: source.shippingCountry || "",
                street1: source.shippingStreet1 || "",
                street2: source.shippingStreet2 || "",
                city: source.shippingCity || "",
                state: source.shippingState || "",
                zipCode: source.shippingZipCode || "",
                phone: source.shippingPhone || "",
                fax: source.shippingFax || "",
            };

            const clonedPayload = {
                displayName: `${source.displayName || source.name || "Customer"}${copySuffix}`,
                name: `${source.name || source.displayName || "Customer"}${copySuffix}`,
                status: "active",
                isActive: true,
                isInactive: false,
                customerType: source.customerType || "business",
                salutation: source.salutation || "",
                firstName: source.firstName || "",
                lastName: source.lastName || "",
                companyName: source.companyName || "",
                email: source.email || "",
                workPhone: source.workPhone || "",
                mobile: source.mobile || "",
                websiteUrl: source.websiteUrl || source.website || "",
                xHandle: source.xHandle || "",
                skypeName: source.skypeName || "",
                facebook: source.facebook || "",
                customerNumber: source.customerNumber ? `${source.customerNumber}-C${uniqueSuffix}` : "",
                customerLanguage: source.customerLanguage || source.portalLanguage || "english",
                taxRate: source.taxRate || "",
                exchangeRate: parseFloat(String(source.exchangeRate || "1")) || 1,
                companyId: source.companyId || "",
                locationCode: source.locationCode || "",
                currency: source.currency || "USD",
                paymentTerms: source.paymentTerms || "due-on-receipt",
                department: source.department || "",
                designation: source.designation || "",
                accountsReceivable: source.accountsReceivable || "",
                openingBalance: String(source.openingBalance || source.receivables || "0"),
                receivables: parseFloat(String(source.receivables || source.openingBalance || "0")) || 0,
                enablePortal: !!source.enablePortal,
                customerOwner: source.customerOwner || "",
                remarks: source.remarks || source.notes || "",
                notes: source.notes || source.remarks || "",
                billingAddress,
                shippingAddress,
                contactPersons: Array.isArray(source.contactPersons)
                    ? source.contactPersons.map((cp: any) => {
                        const { id, _id, createdAt, updatedAt, ...rest } = cp || {};
                        return { ...rest };
                    })
                    : [],
                documents: Array.isArray(source.documents) ? [...source.documents] : [],
                customFields: source.customFields || {},
                reportingTags: source.reportingTags || []
            };

            const response: any = await customersAPI.create(clonedPayload);
            if (!response?.success) {
                throw new Error(response?.message || "Failed to clone customer");
            }

            const clonedCustomer = response?.data || {};

            window.dispatchEvent(new CustomEvent("customersUpdated", {
                detail: {
                    customer: clonedCustomer,
                    action: "created"
                }
            }));

            setIsCloneModalOpen(false);
            toast.success("Customer cloned successfully.");
            // Stay on the current customer after cloning.
        } catch (error: any) {
            toast.error(error?.message || "Failed to clone customer");
        } finally {
            setIsCloning(false);
        }
    };

    const formatDateForDisplay = (date: any) => {
        if (!date) return "";
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Calendar helper functions
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const renderCalendar = (calendarMonth: Date, selectedDate: Date, onSelectDate: any, onPrevMonth: any, onNextMonth: any) => {
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(calendarMonth);
        const days = [];

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthDays - i)
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        const isSelected = (date: Date) => {
            return selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();
        };

        const isToday = (date: Date) => {
            const today = new Date();
            return date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
        };

        return (
            <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded cursor-pointer" onClick={onPrevMonth}>«</button>
                    <span className="text-sm font-semibold text-gray-900">{months[month]} {year}</span>
                    <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded cursor-pointer" onClick={onNextMonth}>»</button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-xs font-medium text-gray-600 text-center py-1">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map((dayObj, index) => (
                        <button
                            key={index}
                            className={`w-8 h-8 text-xs rounded cursor-pointer transition-colors ${!dayObj.isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'
                                } ${isSelected(dayObj.date) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                } ${isToday(dayObj.date) && !isSelected(dayObj.date) ? 'bg-blue-100 text-blue-700 font-semibold' : ''
                                }`}
                            onClick={() => onSelectDate(dayObj.date)}
                        >
                            {dayObj.day}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const invoiceStatusOptions = ["all", "draft", "client viewed", "partially paid", "unpaid", "overdue", "paid", "void"];
    const formatStatusLabel = (value: string) => value.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    const normalizeInvoiceStatus = (invoice: any) => {
        const raw = String(invoice?.status || "draft").toLowerCase();
        if (raw === "void") return "void";
        if (raw === "paid") return "paid";
        if (raw === "overdue") return "overdue";
        if (raw === "partially paid" || raw === "partial" || raw === "partial paid") return "partially paid";
        if (raw === "open" || raw === "unpaid") return "unpaid";
        if (raw === "sent" || raw === "viewed" || invoice?.customerViewed) return "client viewed";
        return "draft";
    };

    // Filter and paginate invoices
    const getFilteredInvoices = () => {
        let filtered = invoices;

        // Apply search filter
        if (invoiceSearchTerm) {
            const searchLower = invoiceSearchTerm.toLowerCase();
            filtered = filtered.filter(inv =>
                (inv.invoiceNumber || "").toLowerCase().includes(searchLower) ||
                (inv.orderNumber || "").toLowerCase().includes(searchLower) ||
                (inv.id || "").toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (invoiceStatusFilter !== "all") {
            filtered = filtered.filter(inv =>
                normalizeInvoiceStatus(inv) === invoiceStatusFilter.toLowerCase()
            );
        }

        return filtered;
    };

    const filteredInvoices = getFilteredInvoices();
    const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);
    const startIndex = (invoiceCurrentPage - 1) * invoicesPerPage;
    const endIndex = startIndex + invoicesPerPage;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    const getFilteredQuotes = () => {
        let filtered = quotes;
        if (quoteStatusFilter !== "all") {
            filtered = filtered.filter(q => (q.status || "draft").toLowerCase() === quoteStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const getFilteredRecurringInvoices = () => {
        let filtered = recurringInvoices;
        if (recurringInvoiceStatusFilter !== "all") {
            filtered = filtered.filter(ri => (ri.status || "active").toLowerCase() === recurringInvoiceStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const getFilteredExpenses = () => {
        let filtered = expenses;
        if (expenseStatusFilter !== "all") {
            filtered = filtered.filter(e => (e.status || "unbilled").toLowerCase() === expenseStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const getFilteredRecurringExpenses = () => {
        let filtered = recurringExpenses;
        if (recurringExpenseStatusFilter !== "all") {
            filtered = filtered.filter(re => (re.status || "active").toLowerCase() === recurringExpenseStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const getFilteredProjects = () => {
        let filtered = projects;
        if (projectStatusFilter !== "all") {
            filtered = filtered.filter(p => (p.status || "active").toLowerCase() === projectStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const getFilteredBills = () => {
        let filtered = bills;
        if (billStatusFilter !== "all") {
            filtered = filtered.filter(b => (b.status || "draft").toLowerCase() === billStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const getFilteredCreditNotes = () => {
        let filtered = creditNotes;
        if (creditNoteStatusFilter !== "all") {
            filtered = filtered.filter(cn => (cn.status || "draft").toLowerCase() === creditNoteStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const getFilteredSalesReceipts = () => {
        let filtered = salesReceipts;
        if (salesReceiptStatusFilter !== "all") {
            filtered = filtered.filter(sr => (sr.status || "draft").toLowerCase() === salesReceiptStatusFilter.toLowerCase());
        }
        return filtered;
    };

    const formatCurrency = (amount: any, currency = "AMD") => {
        return `${currency}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;
    };

    const normalizeComments = (rawComments: any): Comment[] => {
        if (!Array.isArray(rawComments)) return [];
        return rawComments
            .filter((item: any) => item && typeof item.text === "string" && item.text.trim() !== "")
            .map((item: any, index: number) => ({
                id: item.id ?? item._id ?? `${Date.now()}-${index}`,
                text: item.text,
                author: item.author || "You",
                timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
                bold: Boolean(item.bold),
                italic: Boolean(item.italic),
                underline: Boolean(item.underline)
            }));
    };

    const handleAddComment = async () => {
        const trimmedComment = commentText.trim();
        if (!trimmedComment) return;

        const customerId = String(customer?._id || customer?.id || id || "").trim();
        if (!customerId) {
            toast.error("Customer ID not found. Please refresh and try again.");
            return;
        }

        const previousComments = comments;
        const newComment: Comment = {
            id: Date.now(),
            text: trimmedComment,
            timestamp: new Date().toISOString(),
            author: "You"
        };
        const updatedComments = [...previousComments, newComment];

        setComments(updatedComments);
        setCommentText("");

        try {
            const response = await customersAPI.update(customerId, { comments: updatedComments });
            const savedComments = normalizeComments(response?.data?.comments ?? updatedComments);
            setComments(savedComments);
            setCustomer((prev) => (prev ? { ...prev, comments: savedComments } : prev));
        } catch (error: any) {
            setComments(previousComments);
            setCommentText(trimmedComment);
            toast.error("Failed to save comment: " + (error?.message || "Unknown error"));
        }
    };

    const handleDeleteComment = async (commentId: string | number) => {
        const customerId = String(customer?._id || customer?.id || id || "").trim();
        if (!customerId) {
            toast.error("Customer ID not found. Please refresh and try again.");
            return;
        }

        const previousComments = comments;
        const updatedComments = previousComments.filter(comment => String(comment.id) !== String(commentId));
        setComments(updatedComments);

        try {
            const response = await customersAPI.update(customerId, { comments: updatedComments });
            const savedComments = normalizeComments(response?.data?.comments ?? updatedComments);
            setComments(savedComments);
            setCustomer((prev) => (prev ? { ...prev, comments: savedComments } : prev));
        } catch (error: any) {
            setComments(previousComments);
            toast.error("Failed to delete comment: " + (error?.message || "Unknown error"));
        }
    };

    const applyFormatting = (format: string) => {
        // Simple text formatting implementation
        const textarea = document.getElementById("comment-textarea") as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = commentText.substring(start, end);
            let formattedText = "";

            if (format === "bold") {
                formattedText = `**${selectedText}**`;
            } else if (format === "italic") {
                formattedText = `*${selectedText}*`;
            } else if (format === "underline") {
                formattedText = `__${selectedText}__`;
            }

            const newText = commentText.substring(0, start) + formattedText + commentText.substring(end);
            setCommentText(newText);

            // Reset cursor position
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
            }, 0);
        }
    };

    const isCustomerActive = (c: any) =>
        (c?.status || "").toLowerCase() === "active" || c?.isActive === true;

    const setActiveStatus = async (makeActive: boolean) => {
        const targetId = String((customer as any)?._id || (customer as any)?.id || id || "").trim();
        if (!targetId || targetId.toLowerCase() === "undefined" || targetId.toLowerCase() === "null") {
            toast.error("Customer ID not found. Please refresh and try again.");
            return;
        }

        const status = makeActive ? "active" : "inactive";
        const statusLabel = makeActive ? "active" : "inactive";

        // Optimistic UI update for current customer and exact matching sidebar row only.
        setCustomer(prev => prev ? ({ ...prev, status, isActive: makeActive, isInactive: !makeActive }) : prev);
        setCustomers(prev => prev.map((c: any) => {
            const rowId = String(c?._id || c?.id || "").trim();
            if (!rowId || rowId.toLowerCase() === "undefined" || rowId.toLowerCase() === "null") return c;
            return rowId === targetId
                ? ({ ...c, status, isActive: makeActive, isInactive: !makeActive })
                : c;
        }));

        try {
            await customersAPI.update(targetId, { status });
            toast.success(`Customer marked as ${statusLabel} successfully`);

            // Pull canonical state from backend to avoid any accidental UI bleed.
            await refreshData();
        } catch (error: any) {
            toast.error("Failed to update customer: " + (error.message || "Unknown error"));
            // Best-effort refresh to revert any mismatch
            await refreshData();
        }
    };

    if (!customer && loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!customer) {
        return null;
    }

    const primaryContact = customer.contactPersons?.[0] || null;
    const displayName = customer.displayName || customer.name || `${customer.firstName} ${customer.lastName}`.trim() || customer.companyName;
    const associatedTagLabels = (() => {
        const normalizeText = (value: any) => String(value ?? "").trim();
        const toLabel = (entry: any) => {
            if (!entry) return "";
            if (typeof entry === "string") return normalizeText(entry);
            if (typeof entry !== "object") return "";

            const name = normalizeText(entry.name || entry.tagName || entry.label || entry.title);
            const value = normalizeText(
                entry.value ??
                entry.option ??
                entry.selectedValue ??
                entry.selected ??
                entry.tagValue
            );

            if (name && value) return `${name} ${value}`;
            return name || value;
        };

        const reportingTags = Array.isArray((customer as any)?.reportingTags)
            ? (customer as any).reportingTags
            : [];
        const legacyTags = Array.isArray((customer as any)?.tags)
            ? (customer as any).tags
            : [];

        const labels = [...reportingTags, ...legacyTags]
            .map((entry: any) => toLabel(entry))
            .filter((label: string) => Boolean(label));

        return Array.from(new Set(labels));
    })();

    const customerSubscriptions = (() => {
        const fromCustomer = Array.isArray((customer as any)?.subscriptions)
            ? (customer as any).subscriptions
            : [];
        if (fromCustomer.length) return fromCustomer;
        try {
            const raw = localStorage.getItem("subscriptions");
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            const customerId = String((customer as any)?._id || (customer as any)?.id || "").trim();
            if (!customerId) return [];
            return parsed.filter((sub: any) => {
                const subCustomerId = String(sub?.customerId || sub?.customer?._id || sub?.customer || "").trim();
                return subCustomerId === customerId;
            });
        } catch {
            return [];
        }
    })();

    return (
        <div className="w-full h-screen flex bg-white overflow-hidden" style={{ margin: 0, padding: 0, maxWidth: "100%" }}>
            {/* Left Sidebar */}
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-screen overflow-hidden min-h-0">
                {selectedCustomers.length > 0 ? (
                    /* Bulk Selection Header */
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectedCustomers.length === customers.length}
                                onChange={handleSelectAllCustomers}
                                className="w-4 h-4 cursor-pointer"
                            />
                            <div className="relative" ref={bulkActionsDropdownRef}>
                                <button
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                    onClick={() => setIsBulkActionsDropdownOpen(!isBulkActionsDropdownOpen)}
                                >
                                    Bulk Actions
                                    <ChevronDown size={14} />
                                </button>
                                {isBulkActionsDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]">
                                        <div className="px-4 py-2 text-sm text-blue-600 font-medium cursor-pointer hover:bg-blue-50">
                                            Bulk Update
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={handlePrintCustomerStatements}
                                        >
                                            Print Customer Statements
                                        </div>
                                        <div className="h-px bg-gray-200 my-1"></div>
                                        <div className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                                            Mark as Active
                                        </div>
                                        <div className="px-4 py-2 text-sm text-blue-600 font-medium cursor-pointer hover:bg-blue-50">
                                            Mark as Inactive
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={handleMergeCustomers}
                                        >
                                            Merge
                                        </div>
                                        <div className="h-px bg-gray-200 my-1"></div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-[#156372] hover:text-white transition-colors"
                                            onClick={handleAssociateTemplates}
                                        >
                                            Associate Templates
                                        </div>
                                        <div className="px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50">
                                            Delete
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded text-xs font-semibold text-white" style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}>{selectedCustomers.length}</span>
                            <span className="text-sm text-gray-700">Selected</span>
                            <button
                                className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                                onClick={handleClearSelection}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Normal Header */
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <button className="flex items-center gap-2 text-xl font-semibold text-slate-900 cursor-pointer">
                            All Customers
                            <ChevronDown size={16} className="text-[#1b5e6a]" />
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#1b5e6a] text-white shadow-sm transition-all hover:brightness-110"
                                onClick={() => navigate("/sales/customers/new")}
                            >
                                <Plus size={16} />
                            </button>
                            <div className="relative" ref={sidebarMoreMenuRef}>
                                <button
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-slate-600 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setIsSidebarMoreMenuOpen(!isSidebarMoreMenuOpen)}
                                >
                                    <MoreVertical size={16} />
                                </button>
                                {isSidebarMoreMenuOpen && (
                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[180px]">
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors hover:bg-[#156372] hover:text-white"
                                            onClick={() => {
                                                setIsSidebarMoreMenuOpen(false);
                                                navigate("/sales/customers/import");
                                            }}
                                        >
                                            Import Customers
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors hover:bg-[#156372] hover:text-white"
                                            onClick={() => {
                                                setIsSidebarMoreMenuOpen(false);
                                                navigate("/sales/customers", { state: { openExportModal: true } });
                                            }}
                                        >
                                            Export Customers
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors hover:bg-[#156372] hover:text-white"
                                            onClick={() => {
                                                setIsSidebarMoreMenuOpen(false);
                                                navigate("/settings/customers-vendors");
                                            }}
                                        >
                                            Preferences
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors hover:bg-[#156372] hover:text-white"
                                            onClick={() => {
                                                setIsSidebarMoreMenuOpen(false);
                                                alert("Manage Custom Fields - Feature coming soon");
                                            }}
                                        >
                                            Manage Custom Fields
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors hover:bg-[#156372] hover:text-white"
                                            onClick={async () => {
                                                setIsSidebarMoreMenuOpen(false);
                                                try {
                                                    const response = await customersAPI.getAll();
                                                    if (response && response.data) {
                                                        setCustomers(response.data);
                                                        toast.success('Customer list refreshed');
                                                    }
                                                } catch (error) {
                                                    toast.error('Failed to refresh customer list');
                                                }
                                            }}
                                        >
                                            Refresh List
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors hover:bg-[#156372] hover:text-white"
                                            onClick={() => {
                                                setIsSidebarMoreMenuOpen(false);
                                                alert("Column widths reset to default");
                                            }}
                                        >
                                            Reset Column Width
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {customers.map((cust, index) => (
                        <div
                            key={`${cust.id}-${index}`}
                            className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${cust.id === id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                                } ${selectedCustomers.includes(cust.id) ? "bg-gray-100" : ""}`}
                            onClick={() => navigate(`/sales/customers/${cust.id}`, { state: { customer: cust } })}
                        >
                            <input
                                type="checkbox"
                                checked={selectedCustomers.includes(cust.id)}
                                onChange={(e) => handleCustomerCheckboxChange(cust.id, e)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{cust.name}</div>
                                <div className="text-xs text-gray-600">
                                    {formatCurrency(cust.receivables, cust.currency)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ marginRight: 0, paddingRight: 0 }}>
                {/* Header - Show action header when showActionHeader is true, otherwise show normal header */}
                {!isCustomerActive(customer) ? (
                    /* Action Header Bar */
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold text-gray-900">
                                {customer?.name || customer?.displayName || customer?.companyName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Customer'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={async () => {
                                    await setActiveStatus(true);
                                }}
                            >
                                Mark as Active
                            </button>
                            <div className="flex items-center justify-center gap-1 min-w-[44px] h-[38px] px-3 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium">
                                <Paperclip size={14} />
                                {attachments.length}
                            </div>
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                    setIsMoreDropdownOpen(false);
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                Delete
                            </button>
                            <button
                                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded-md text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => navigate("/sales/customers")}
                                title="Back to Customers List"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Normal Header */
                    <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white ${selectedCustomers.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold text-gray-900">
                                {customer?.name || customer?.displayName || customer?.companyName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Customer'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/sales/customers/${id}/edit`)}
                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm font-medium cursor-pointer"
                                style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
                                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                                disabled={selectedCustomers.length > 0}
                            >
                                <Edit size={16} />
                                Edit
                            </button>
                            <div className="relative" ref={attachmentsDropdownRef}>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50"
                                    onClick={() => setIsAttachmentsDropdownOpen(!isAttachmentsDropdownOpen)}
                                >
                                    <Paperclip size={16} />
                                    {attachments.length}
                                </button>
                                {isAttachmentsDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                            <span className="text-sm font-semibold text-gray-900">Attachments</span>
                                            <button
                                                className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                                                onClick={() => setIsAttachmentsDropdownOpen(false)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-2">
                                            {attachments.map(attachment => (
                                                <div key={attachment.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md group">
                                                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-md text-gray-600">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="block text-sm font-medium text-gray-900 truncate">{attachment.name}</span>
                                                        <span className="block text-xs text-gray-500">File Size: {attachment.size}</span>
                                                    </div>
                                                    <button
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                        onClick={() => handleRemoveAttachment(attachment.id)}
                                                        title="Remove attachment"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 border-t border-gray-200">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                multiple
                                                style={{ display: "none" }}
                                            />
                                            <button
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md text-sm font-medium cursor-pointer"
                                                style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
                                                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                                                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload size={18} />
                                                Upload your Files
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                        <p className="px-4 pb-4 text-xs text-gray-500">
                                            You can upload a maximum of 10 files, 10MB each
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="relative" ref={newTransactionDropdownRef}>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm font-medium cursor-pointer"
                                    style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
                                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                                    onClick={() => setIsNewTransactionDropdownOpen(!isNewTransactionDropdownOpen)}
                                >
                                    New Transaction
                                    <ChevronDown size={16} />
                                </button>
                                {isNewTransactionDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">SALES</div>
                                        {/* Invoice hidden */}
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/sales/payments-received/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Customer Payment
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/sales/quotes/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Quote
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/sales/recurring-invoices/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Recurring Invoice
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/purchases/expenses/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Expense
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/expenses/recurring-expenses/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Recurring Expense
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/accountant/manual-journals/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Journal
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/sales/credit-notes/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Credit Note
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/sales/sales-receipts/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Sales Receipt
                                        </div>
                                        <div
                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => {
                                                setIsNewTransactionDropdownOpen(false);
                                                navigate("/projects/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            Project
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative" ref={moreDropdownRef}>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50"
                                    onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                                >
                                    More
                                    <ChevronDown size={16} />
                                </button>
                                {isMoreDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 font-medium cursor-pointer hover:bg-[#156372] hover:text-white transition-colors"
                                            onClick={handleAssociateTemplates}
                                        >
                                            Associate Templates
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => {
                                                setIsMoreDropdownOpen(false);
                                                // Initialize portal access contacts from customer contact persons
                                                const contacts = customer.contactPersons?.map(contact => ({
                                                    id: contact.id || Date.now() + Math.random(),
                                                    name: `${contact.salutation ? `${contact.salutation}. ` : ''}${contact.firstName} ${contact.lastName}`,
                                                    email: contact.email || '',
                                                    hasAccess: contact.hasPortalAccess || false
                                                })) || [];
                                                // If no contact persons, add the customer as a contact
                                                if (contacts.length === 0 && customer.name) {
                                                    contacts.push({
                                                        id: 'customer-main',
                                                        name: customer.name,
                                                        email: customer.email || '',
                                                        hasAccess: customer.enablePortal || false
                                                    });
                                                }
                                                setPortalAccessContacts(contacts);
                                                setIsConfigurePortalModalOpen(true);
                                            }}
                                        >
                                            Configure Customer Portal
                                        </button>
                                        <button
                                            className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${areRemindersStopped
                                                ? "text-gray-700 hover:bg-gray-50"
                                                : "text-blue-600 font-medium hover:bg-blue-50"
                                                }`}
                                            onClick={() => {
                                                setIsMoreDropdownOpen(false);
                                                setAreRemindersStopped(!areRemindersStopped);
                                                if (!areRemindersStopped) {
                                                    // Reminders are being stopped
                                                    alert("All reminders stopped for this customer");
                                                } else {
                                                    // Reminders are being enabled
                                                    alert("All reminders enabled for this customer");
                                                }
                                            }}
                                        >
                                            {areRemindersStopped ? "Enable All Reminders" : "Stop All Reminders"}
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={handleClone}
                                        >
                                            Clone
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={handleMergeCustomers}
                                        >
                                            Merge Customers
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={async () => {
                                                setIsMoreDropdownOpen(false);
                                                const isCurrentlyActive = isCustomerActive(customer);
                                                await setActiveStatus(!isCurrentlyActive);
                                                setShowActionHeader(true);
                                            }}
                                        >
                                            {customer?.status?.toLowerCase() === "active" || customer?.isActive ? "Mark as Inactive" : "Mark as Active"}
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 transition-colors"
                                            onClick={() => {
                                                setIsMoreDropdownOpen(false);
                                                setIsDeleteModalOpen(true);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigate("/sales/customers")}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-0 border-b border-gray-200">
                    <button
                        className={`px-2.5 py-1.75 text-[13px] rounded-t-md border border-transparent border-b-0 cursor-pointer transition-colors ${activeTab === "overview"
                            ? "text-gray-900 bg-white border-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </button>
                    <button
                        className={`px-2.5 py-1.75 text-[13px] rounded-t-md border border-transparent border-b-0 cursor-pointer transition-colors ${activeTab === "comments"
                            ? "text-gray-900 bg-white border-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setActiveTab("comments")}
                    >
                        Comments
                    </button>
                    <button
                        className={`px-2.5 py-1.75 text-[13px] rounded-t-md border border-transparent border-b-0 cursor-pointer transition-colors ${activeTab === "transactions"
                            ? "text-gray-900 bg-white border-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => {
                            setActiveTab("transactions");
                            if (!selectedTransactionType) {
                                openTransactionSection("subscriptions");
                            }
                        }}
                    >
                        Transactions
                    </button>
                    {customer?.linkedVendorId && (
                        <button
                            className={`px-2.5 py-1.75 text-[13px] rounded-t-md border border-transparent border-b-0 cursor-pointer transition-colors ${activeTab === "purchases"
                                ? "text-gray-900 bg-white border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                            onClick={() => setActiveTab("purchases")}
                        >
                            Purchases
                        </button>
                    )}
                    <button
                        className={`px-2.5 py-1.75 text-[13px] rounded-t-md border border-transparent border-b-0 cursor-pointer transition-colors ${activeTab === "mails"
                            ? "text-gray-900 bg-white border-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setActiveTab("mails")}
                    >
                        Mails
                    </button>
                    <button
                        className={`px-2.5 py-1.75 text-[13px] rounded-t-md border border-transparent border-b-0 cursor-pointer transition-colors ${activeTab === "statement"
                            ? "text-gray-900 bg-white border-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setActiveTab("statement")}
                    >
                        Statement
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex min-h-full">
                            {/* Left Column */}
                            <div className="w-[370px] flex-shrink-0 border-r border-gray-200 bg-[#f8f9fc] p-4">
                                {/* Customer Profile Section */}
                                <div className="mb-6">
                                    <div className="mb-2 text-sm text-[#1f5fa8]">
                                        {(customer as any).companyName || displayName}
                                    </div>
                                    {!showInviteCard ? (
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 relative cursor-pointer overflow-hidden group"
                                                    onMouseEnter={() => setIsAvatarHovered(true)}
                                                    onMouseLeave={() => setIsAvatarHovered(false)}
                                                    onClick={() => profileImageInputRef.current?.click()}
                                                >
                                                    {profileImage ? (
                                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={24} className="text-gray-400" />
                                                    )}
                                                    {isAvatarHovered && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Upload size={16} className="text-white" />
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        ref={profileImageInputRef}
                                                        onChange={handleProfileImageUpload}
                                                        accept="image/*"
                                                        style={{ display: "none" }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-base font-medium text-gray-900">
                                                            {primaryContact ? (
                                                                <>
                                                                    {primaryContact.salutation && `${primaryContact.salutation}. `}
                                                                    {primaryContact.firstName} {primaryContact.lastName}
                                                                </>
                                                            ) : (
                                                                displayName
                                                            )}
                                                        </span>
                                                        <div className="relative" ref={settingsDropdownRef}>
                                                            <button
                                                                className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                                                                }}
                                                            >
                                                                <Settings size={14} />
                                                            </button>
                                                            {isSettingsDropdownOpen && (
                                                                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px]">
                                                                    <button
                                                                        className="w-full text-left px-4 py-2 text-sm text-blue-600 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsSettingsDropdownOpen(false);
                                                                            navigate(`/sales/customers/${id}/edit`);
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsSettingsDropdownOpen(false);
                                                                            setIsDeleteModalOpen(true);
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-1">
                                                        {primaryContact?.email || customer.email || ""}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        Portal not enabled
                                                    </div>
                                                    <button
                                                        onClick={() => setIsInviteModalOpen(true)}
                                                        className="text-sm text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                                    >
                                                        Invite
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#f8f9ff] rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden w-full">
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
                                            <button
                                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                                                onClick={() => setShowInviteCard(false)}
                                            >
                                                <Settings size={14} />
                                            </button>
                                            <div className="flex gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-lg bg-gray-300 flex-shrink-0 overflow-hidden cursor-pointer relative group"
                                                    onMouseEnter={() => setIsAvatarHovered(true)}
                                                    onMouseLeave={() => setIsAvatarHovered(false)}
                                                    onClick={() => profileImageInputRef.current?.click()}
                                                >
                                                    {profileImage ? (
                                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                            <User size={24} className="text-white" />
                                                        </div>
                                                    )}
                                                    {isAvatarHovered && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Upload size={16} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-base font-bold text-gray-900 truncate mb-0.5">
                                                        {primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : displayName}
                                                    </div>
                                                    <div className="text-sm text-gray-600 truncate mb-3">
                                                        {primaryContact?.email || customer.email || ""}
                                                    </div>
                                                    <div className="text-[13px] text-gray-600 font-medium mb-3">
                                                        Portal invitation not accepted
                                                    </div>
                                                    <button
                                                        className="text-[13px] text-blue-600 font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
                                                        onClick={() => alert("Re-invitation sent!")}
                                                    >
                                                        Re-invite
                                                    </button>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                ref={profileImageInputRef}
                                                onChange={handleProfileImageUpload}
                                                accept="image/*"
                                                style={{ display: "none" }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Address Section */}
                                <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ADDRESS</div>
                                    <div className="mb-4">
                                        <div className="text-sm text-gray-600 mb-1">Billing Address</div>
                                        {(customer.billingAddress?.street1 || customer.billingStreet1 || customer.billingAddress?.city || customer.billingCity) ? (
                                            <div>
                                                <div className="text-sm text-gray-900">
                                                    {customer.billingAddress?.street1 || customer.billingStreet1 || ""}
                                                    {(customer.billingAddress?.city || customer.billingCity) && `, ${customer.billingAddress?.city || customer.billingCity}`}
                                                    {(customer.billingAddress?.state || customer.billingState) && `, ${customer.billingAddress?.state || customer.billingState}`}
                                                    {(customer.billingAddress?.zipCode || customer.billingZipCode) && ` ${customer.billingAddress?.zipCode || customer.billingZipCode}`}
                                                </div>
                                                <a
                                                    href="#"
                                                    className="text-sm text-blue-600 hover:underline"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setAddressType("billing");
                                                        // Read data exactly from both nested and flat structures
                                                        const billingAddr = customer.billingAddress || {};
                                                        setAddressFormData({
                                                            attention: billingAddr.attention ?? customer.billingAttention ?? "",
                                                            country: billingAddr.country ?? customer.billingCountry ?? "",
                                                            addressLine1: billingAddr.street1 ?? customer.billingStreet1 ?? "",
                                                            addressLine2: billingAddr.street2 ?? customer.billingStreet2 ?? "",
                                                            city: billingAddr.city ?? customer.billingCity ?? "",
                                                            state: billingAddr.state ?? customer.billingState ?? "",
                                                            zipCode: billingAddr.zipCode ?? customer.billingZipCode ?? "",
                                                            phone: billingAddr.phone ?? customer.billingPhone ?? "",
                                                            faxNumber: billingAddr.fax ?? customer.billingFax ?? "",
                                                        });
                                                        setShowAddressModal(true);
                                                    }}
                                                >
                                                    Edit
                                                </a>
                                            </div>
                                        ) : (
                                            <a
                                                href="#"
                                                className="text-sm text-blue-600 hover:underline"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setAddressType("billing");
                                                    // Read data exactly from both nested and flat structures
                                                    const billingAddr = customer.billingAddress || {};
                                                    setAddressFormData({
                                                        attention: billingAddr.attention ?? customer.billingAttention ?? "",
                                                        country: billingAddr.country ?? customer.billingCountry ?? "",
                                                        addressLine1: billingAddr.street1 ?? customer.billingStreet1 ?? "",
                                                        addressLine2: billingAddr.street2 ?? customer.billingStreet2 ?? "",
                                                        city: billingAddr.city ?? customer.billingCity ?? "",
                                                        state: billingAddr.state ?? customer.billingState ?? "",
                                                        zipCode: billingAddr.zipCode ?? customer.billingZipCode ?? "",
                                                        phone: billingAddr.phone ?? customer.billingPhone ?? "",
                                                        faxNumber: billingAddr.fax ?? customer.billingFax ?? "",
                                                    });
                                                    setShowAddressModal(true);
                                                }}
                                            >
                                                No Billing Address - New Address
                                            </a>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Shipping Address</div>
                                        {(customer.shippingAddress?.street1 || customer.shippingStreet1 || customer.shippingAddress?.city || customer.shippingCity) ? (
                                            <div>
                                                <div className="text-sm text-gray-900">
                                                    {customer.shippingAddress?.street1 || customer.shippingStreet1 || ""}
                                                    {(customer.shippingAddress?.city || customer.shippingCity) && `, ${customer.shippingAddress?.city || customer.shippingCity}`}
                                                    {(customer.shippingAddress?.state || customer.shippingState) && `, ${customer.shippingAddress?.state || customer.shippingState}`}
                                                    {(customer.shippingAddress?.zipCode || customer.shippingZipCode) && ` ${customer.shippingAddress?.zipCode || customer.shippingZipCode}`}
                                                </div>
                                                <a
                                                    href="#"
                                                    className="text-sm text-blue-600 hover:underline"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setAddressType("shipping");
                                                        // Read data exactly from both nested and flat structures
                                                        const shippingAddr = customer.shippingAddress || {};
                                                        setAddressFormData({
                                                            attention: shippingAddr.attention ?? customer.shippingAttention ?? "",
                                                            country: shippingAddr.country ?? customer.shippingCountry ?? "",
                                                            addressLine1: shippingAddr.street1 ?? customer.shippingStreet1 ?? "",
                                                            addressLine2: shippingAddr.street2 ?? customer.shippingStreet2 ?? "",
                                                            city: shippingAddr.city ?? customer.shippingCity ?? "",
                                                            state: shippingAddr.state ?? customer.shippingState ?? "",
                                                            zipCode: shippingAddr.zipCode ?? customer.shippingZipCode ?? "",
                                                            phone: shippingAddr.phone ?? customer.shippingPhone ?? "",
                                                            faxNumber: shippingAddr.fax ?? customer.shippingFax ?? "",
                                                        });
                                                        setShowAddressModal(true);
                                                    }}
                                                >
                                                    Edit
                                                </a>
                                            </div>
                                        ) : (
                                            <a
                                                href="#"
                                                className="text-sm text-blue-600 hover:underline"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setAddressType("shipping");
                                                    // Read data exactly from both nested and flat structures
                                                    const shippingAddr = customer.shippingAddress || {};
                                                    setAddressFormData({
                                                        attention: shippingAddr.attention ?? customer.shippingAttention ?? "",
                                                        country: shippingAddr.country ?? customer.shippingCountry ?? "",
                                                        addressLine1: shippingAddr.street1 ?? customer.shippingStreet1 ?? "",
                                                        addressLine2: shippingAddr.street2 ?? customer.shippingStreet2 ?? "",
                                                        city: shippingAddr.city ?? customer.shippingCity ?? "",
                                                        state: shippingAddr.state ?? customer.shippingState ?? "",
                                                        zipCode: shippingAddr.zipCode ?? customer.shippingZipCode ?? "",
                                                        phone: shippingAddr.phone ?? customer.shippingPhone ?? "",
                                                        faxNumber: shippingAddr.fax ?? customer.shippingFax ?? "",
                                                    });
                                                    setShowAddressModal(true);
                                                }}
                                            >
                                                No Shipping Address - New Address
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Other Details Section */}
                                <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">Other Details</h3>
                                        <ChevronUp size={14} className="text-[#2563eb]" />
                                    </div>
                                    <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-x-3 gap-y-4 px-4 py-5">
                                        <span className="text-sm text-slate-500">Customer Type</span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {customer.customerType === "individual" ? "Individual" : "Business"}
                                        </span>

                                        <span className="text-sm text-slate-500">Customer Number</span>
                                        <span className="text-sm font-medium text-slate-900">{customer.customerNumber || "--"}</span>

                                        <span className="text-sm text-slate-500">Default Currency</span>
                                        <span className="text-sm font-medium text-slate-900">{customer.currency || "USD"}</span>

                                        <span className="text-sm text-slate-500">
                                            <span className="border-b border-dotted border-slate-400">Consolidated Billing</span>
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 text-sm font-medium ${((customer as any)?.consolidatedBilling || (customer as any)?.enableConsolidatedBilling || (customer as any)?.isConsolidatedBillingEnabled)
                                                ? "text-emerald-600"
                                                : "text-rose-500"
                                                }`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full ${((customer as any)?.consolidatedBilling || (customer as any)?.enableConsolidatedBilling || (customer as any)?.isConsolidatedBillingEnabled) ? "bg-emerald-500" : "bg-rose-500"}`} />
                                            {((customer as any)?.consolidatedBilling || (customer as any)?.enableConsolidatedBilling || (customer as any)?.isConsolidatedBillingEnabled) ? "Enabled" : "Disabled"}
                                            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[9px] leading-none">i</span>
                                        </span>

                                        <span className="text-sm text-slate-500">Portal Status</span>
                                        {(() => {
                                            const portalEnabled =
                                                !!(customer as any)?.enablePortal ||
                                                (customer.contactPersons?.some((cp: any) => cp?.hasPortalAccess || cp?.enablePortal) ?? false);
                                            return (
                                                <span className={`inline-flex items-center gap-1 text-sm font-medium ${portalEnabled ? "text-emerald-600" : "text-rose-500"}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${portalEnabled ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                    {portalEnabled ? "Enabled" : "Disabled"}
                                                </span>
                                            );
                                        })()}

                                        <span className="text-sm text-slate-500">Customer Language</span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {customer.customerLanguage
                                                ? `${customer.customerLanguage.charAt(0).toUpperCase()}${customer.customerLanguage.slice(1)}`
                                                : "English"}
                                        </span>
                                    </div>
                                </div>

                                {/* Contact Persons Section */}
                                <div className="mb-6 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            CONTACT PERSONS ({customer.contactPersons?.length || 0})
                                        </span>
                                        <button
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                            onClick={() => {
                                                setNewContactPerson({
                                                    salutation: "Mr",
                                                    firstName: "",
                                                    lastName: "",
                                                    email: "",
                                                    workPhone: "",
                                                    mobile: "",
                                                    skype: "",
                                                    designation: "",
                                                    department: "",
                                                    enablePortalAccess: true
                                                });
                                                setIsAddContactPersonModalOpen(true);
                                            }}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        {customer.contactPersons && customer.contactPersons.length > 0 ? (
                                            <div className="space-y-3">
                                                {customer.contactPersons.map((contact, index) => (
                                                    <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {contact.salutation && `${contact.salutation}. `}
                                                                    {contact.firstName} {contact.lastName}
                                                                </span>
                                                                <button className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                                                                    <Settings size={14} />
                                                                </button>
                                                            </div>
                                                            {contact.email && (
                                                                <div className="text-sm text-gray-600">{contact.email}</div>
                                                            )}
                                                            <div className="text-sm text-gray-500 mt-1">Portal invitation not accepted</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 text-center py-4">No contact persons found.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Associate Tags */}
                                <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">ASSOCIATE TAGS</div>
                                    <div className="flex flex-wrap gap-2">
                                        {associatedTagLabels.length > 0 ? (
                                            associatedTagLabels.map((tag: string, idx: number) => (
                                                <span key={`${tag}-${idx}`} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                                    {tag}
                                                    <X size={12} className="text-gray-500" />
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">No tags associated</span>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Portal Info */}
                                <div className="mb-6 border border-green-200 bg-green-50 p-4">
                                    <p className="mb-3 text-sm text-gray-700">
                                        Customer Portal allows your customers to keep track of all the transactions between them and your business.
                                    </p>
                                    <button className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                        Enable Portal
                                    </button>
                                </div>

                                {/* Record Info Section */}
                                <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">RECORD INFO</div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Customer Number:</span>
                                            <span className="text-sm font-medium text-gray-900">{customer.customerNumber || "--"}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Customer ID:</span>
                                            <span className="text-sm font-medium text-gray-900">{customer.id || id}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Created On:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {customer.createdDate ? new Date(customer.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "03/12/2025"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Created By:</span>
                                            <span className="text-sm font-medium text-gray-900">{customer.createdBy || "JIRDE HUSSEIN KHALIF"}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Right Column */}
                            <div className="flex-1 min-w-0 p-4">
                                {/* Payment Terms */}
                                <div className="mb-4">
                                    <div className="px-2">
                                        <span className="text-sm text-gray-500">Payment due period</span>
                                    </div>
                                    <div className="px-2 pt-1">
                                        <div className="text-sm text-gray-900">
                                            {customer.paymentTerms === "due-on-receipt" ? "Due on Receipt" : customer.paymentTerms || "Due on Receipt"}
                                        </div>
                                    </div>
                                </div>

                                {/* Receivables Section */}
                                <div className="mb-4 border-t border-b border-gray-200 bg-white">
                                    <div className="px-2 py-3">
                                        <span className="text-2xl text-lg font-medium text-gray-900">Receivables</span>
                                    </div>
                                    <div className="overflow-hidden border-t border-gray-100">
                                        {!isOpeningBalanceModalOpen && (
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">CURRENCY</th>
                                                        <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">OUTSTANDING RECEIVABLES</th>
                                                        <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">UNUSED CREDITS</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    <tr>
                                                        <td className="py-3 px-4 text-gray-900 font-medium">
                                                            {`${customer.currency || "USD"}- ${availableCurrencies.find((c: any) => c?.code === (customer.currency || "USD"))?.currencyName || availableCurrencies.find((c: any) => c?.code === (customer.currency || "USD"))?.name || "Armenian Dram"}`}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-900">
                                                            {formatCurrency(customer.receivables || 0, customer.currency || "USD")}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-blue-600 font-medium">
                                                            {formatCurrency(customer.unusedCredits || 0, customer.currency || "USD")}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                    <div className="hidden p-4 pt-2 relative">

                                        {isOpeningBalanceModalOpen && (
                                            <div className="absolute top-full left-0 mt-2 z-50 w-[400px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                                                {/* Arrow pointing up */}
                                                <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>

                                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                                    <h3 className="text-lg font-medium text-gray-900">Edit Opening Balance</h3>
                                                    <button
                                                        onClick={() => setIsOpeningBalanceModalOpen(false)}
                                                        className="w-7 h-7 flex items-center justify-center border-2 border-blue-600 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>

                                                <div className="p-6">
                                                    <div className="flex items-center gap-4 mb-8">
                                                        <label className="text-sm font-medium text-gray-700 w-32">Opening Balance</label>
                                                        <input
                                                            type="number"
                                                            value={openingBalanceValue}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOpeningBalanceValue(e.target.value)}
                                                            onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                                                                if (e.key === 'Enter') {
                                                                    const val = parseFloat(openingBalanceValue) || 0;
                                                                    const updatedCustomer = {
                                                                        ...customer,
                                                                        openingBalance: val,
                                                                        receivables: val
                                                                    };
                                                                    try {
                                                                        await customersAPI.update(id, updatedCustomer);
                                                                        setCustomer(updatedCustomer);
                                                                        setIsOpeningBalanceModalOpen(false);
                                                                    } catch (error) {
                                                                        alert('Failed to update customer: ' + (error.message || 'Unknown error'));
                                                                    }
                                                                }
                                                            }}
                                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                            autoFocus
                                                        />
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={async () => {
                                                                if (customer && id) {
                                                                    const val = parseFloat(openingBalanceValue) || 0;
                                                                    const updatedCustomer = {
                                                                        ...customer,
                                                                        openingBalance: val,
                                                                        receivables: val
                                                                    };
                                                                    try {
                                                                        await customersAPI.update(id, updatedCustomer);
                                                                        setCustomer(updatedCustomer);
                                                                        setIsOpeningBalanceModalOpen(false);
                                                                    } catch (error) {
                                                                        alert('Failed to update customer: ' + (error.message || 'Unknown error'));
                                                                    }
                                                                }
                                                            }}
                                                            className="px-5 py-2 bg-blue-500 text-white rounded font-medium text-sm hover:bg-blue-600 cursor-pointer transition-colors"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {customer.linkedVendorId && (
                                    <div className="mb-4 border-t border-b border-gray-200 bg-white">
                                        <div className="p-4 border-b border-gray-200">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payables</span>
                                        </div>
                                        <div className="overflow-hidden border-t border-gray-100">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">CURRENCY</th>
                                                        <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">OUTSTANDING PAYABLES</th>
                                                        <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">UNUSED CREDITS</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    <tr>
                                                        <td className="py-3 px-4 text-gray-900 font-medium">
                                                            {customer.currency || "USD"}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-900">
                                                            {formatCurrency(linkedVendor?.payables || 0, customer.currency || "USD")}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-red-600 font-medium">
                                                            {formatCurrency(linkedVendor?.unusedCredits || 0, customer.currency || "USD")}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="p-4 pt-2 border-t border-gray-100">
                                            <div className="text-xs text-gray-500">
                                                Linked Vendor: <span className="font-medium text-gray-900">{customer.linkedVendorName || linkedVendor?.name || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {customerSubscriptions.length === 0 ? (
                                    <div className="mb-4 rounded border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                                        <div className="mb-4 text-sm text-gray-500">No subscriptions have been created for this customer yet.</div>
                                        <div className="relative inline-flex" ref={subscriptionDropdownRef}>
                                            <div className="flex items-center">
                                                <button
                                                    className="px-4 py-1.5 text-sm font-medium text-white rounded-l hover:opacity-90 transition-opacity whitespace-nowrap"
                                                    style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
                                                    onClick={() => navigate("/subscriptions/new", { state: { customerId: customer?.id, customerName: customer?.name } })}
                                                >
                                                    + New
                                                </button>
                                                <button
                                                    className="px-2 py-1.5 text-white rounded-r border-l border-white/20 hover:opacity-90 transition-opacity"
                                                    style={{ background: "#0D4A52" }}
                                                    onClick={() => setIsSubscriptionDropdownOpen(!isSubscriptionDropdownOpen)}
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>

                                            {isSubscriptionDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-50 text-left overflow-hidden">
                                                    <div
                                                        className="px-4 py-2 text-sm text-white cursor-pointer transition-colors"
                                                        style={{ backgroundColor: "#156372" }}
                                                        onClick={() => {
                                                            setIsSubscriptionDropdownOpen(false);
                                                            navigate("/subscriptions/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                                        }}
                                                    >
                                                        New Subscription
                                                    </div>
                                                    <div
                                                        className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                                        onClick={() => {
                                                            setIsSubscriptionDropdownOpen(false);
                                                        navigate("/sales/quotes/subscription/new", { state: { customerId: customer?.id, customerName: customer?.name, forSubscription: true } });
                                                        }}
                                                    >
                                                        Create Quote for Subscription
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 rounded border border-gray-200 bg-white">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Subscriptions</span>
                                            <div className="relative inline-flex" ref={subscriptionDropdownRef}>
                                                <div className="flex items-center">
                                                    <button
                                                        className="px-3 py-1.5 text-sm font-medium text-white rounded-l hover:opacity-90 transition-opacity whitespace-nowrap"
                                                        style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
                                                        onClick={() => navigate("/subscriptions/new", { state: { customerId: customer?.id, customerName: customer?.name } })}
                                                    >
                                                        + New
                                                    </button>
                                                    <button
                                                        className="px-2 py-1.5 text-white rounded-r border-l border-white/20 hover:opacity-90 transition-opacity"
                                                        style={{ background: "#0D4A52" }}
                                                        onClick={() => setIsSubscriptionDropdownOpen(!isSubscriptionDropdownOpen)}
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                </div>

                                                {isSubscriptionDropdownOpen && (
                                                    <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-50 text-left overflow-hidden">
                                                        <div
                                                            className="px-4 py-2 text-sm text-white cursor-pointer transition-colors"
                                                            style={{ backgroundColor: "#156372" }}
                                                            onClick={() => {
                                                                setIsSubscriptionDropdownOpen(false);
                                                                navigate("/subscriptions/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                                            }}
                                                        >
                                                            New Subscription
                                                        </div>
                                                        <div
                                                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                                            onClick={() => {
                                                                setIsSubscriptionDropdownOpen(false);
                                                                navigate("/sales/quotes/subscription/new", { state: { customerId: customer?.id, customerName: customer?.name, forSubscription: true } });
                                                            }}
                                                        >
                                                            Create Quote for Subscription
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {customerSubscriptions.map((sub: any) => {
                                                const name = sub?.planName || sub?.name || sub?.subscriptionName || "Subscription";
                                                const description = sub?.description || sub?.notes || sub?.summary || "";
                                                const subId = sub?.subscriptionId || sub?.referenceId || sub?.id || sub?._id || "";
                                                const subNumber = sub?.subscriptionNumber || sub?.number || sub?.code || "";
                                                const amountValue = sub?.amount || sub?.total || sub?.amountDue || 0;
                                                const currency = sub?.currency || customer?.currency || "USD";
                                                const status = String(sub?.status || sub?.state || "LIVE").toUpperCase();
                                                const lastBilling = sub?.lastBilledOn || sub?.lastBillingDate || sub?.lastBilledDate || sub?.lastBillingOn;
                                                const nextBilling = sub?.nextBillingOn || sub?.nextBillingDate || sub?.nextBillDate;

                                                return (
                                                    <div key={String(subId || subNumber || name)} className="px-4 py-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="text-base font-medium text-blue-600">{name}</div>
                                                                {description && (
                                                                    <div className="text-xs text-gray-500">({description})</div>
                                                                )}
                                                                <div className="mt-2 space-y-0.5 text-xs text-gray-600">
                                                                    {subId && (
                                                                        <div>Subscription ID : {subId}</div>
                                                                    )}
                                                                    {subNumber && (
                                                                        <div>Subscription# : {subNumber}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-semibold text-gray-900">
                                                                    {formatCurrency(amountValue || 0, currency)}
                                                                </div>
                                                                <div className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
                                                                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                                                                    <span>{status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(lastBilling || nextBilling) && (
                                                            <div className="mt-3 text-xs text-gray-600">
                                                                {lastBilling && (
                                                                    <span>Last Billing Date : {formatDateForDisplay(lastBilling)}</span>
                                                                )}
                                                                {lastBilling && nextBilling && (
                                                                    <span className="mx-2 text-gray-400">|</span>
                                                                )}
                                                                {nextBilling && (
                                                                    <span>Next Billing Date : {formatDateForDisplay(nextBilling)}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Income Section */}
                                <div className="mb-6 border-t border-b border-gray-200 bg-white">
                                    <div className="flex items-start justify-between px-2 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-semibold text-gray-900">Income and Expense</span>
                                            <span className="text-xs text-gray-500">
                                                This chart is displayed in the organization's base currency.
                                            </span>
                                        </div>
                                        <div className="relative" ref={incomeTimePeriodRef}>
                                            <button
                                                onClick={() => setIsIncomeTimePeriodDropdownOpen(!isIncomeTimePeriodDropdownOpen)}
                                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 bg-transparent border-none cursor-pointer"
                                            >
                                                {incomeTimePeriod}
                                                <ChevronDown size={14} className={`transition-transform duration-200 ${isIncomeTimePeriodDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isIncomeTimePeriodDropdownOpen && (
                                                <div className="absolute top-full right-0 mt-1 w-[200px] bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                                                    {["This Fiscal Year", "Previous Fiscal Year", "Last 12 Months", "Last 6 Months"].map((period) => (
                                                        <button
                                                            key={period}
                                                            onClick={() => {
                                                                setIncomeTimePeriod(period);
                                                                setIsIncomeTimePeriodDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${incomeTimePeriod === period ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                                                        >
                                                            {period}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-2 pb-4">
                                        {(() => {
                                            // Calculate income based on invoices
                                            const now = new Date();
                                            let filteredInvoices = [...invoices];

                                            // Filter by time period
                                            if (incomeTimePeriod === "This Fiscal Year") {
                                                const fiscalYearStart = new Date(now.getFullYear(), 6, 1); // July 1st
                                                filteredInvoices = invoices.filter((inv: Invoice) => {
                                                    const invDate = new Date(inv.invoiceDate || inv.date || (inv as any).createdAt);
                                                    return invDate >= fiscalYearStart && invDate <= now;
                                                });
                                            } else if (incomeTimePeriod === "Previous Fiscal Year") {
                                                const prevFiscalYearStart = new Date(now.getFullYear() - 1, 6, 1);
                                                const prevFiscalYearEnd = new Date(now.getFullYear(), 5, 30);
                                                filteredInvoices = invoices.filter((inv: Invoice) => {
                                                    const invDate = new Date(inv.invoiceDate || inv.date || (inv as any).createdAt);
                                                    return invDate >= prevFiscalYearStart && invDate <= prevFiscalYearEnd;
                                                });
                                            } else if (incomeTimePeriod === "Last 12 Months") {
                                                const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
                                                filteredInvoices = invoices.filter((inv: Invoice) => {
                                                    const invDate = new Date(inv.invoiceDate || inv.date || (inv as any).createdAt);
                                                    return invDate >= twelveMonthsAgo && invDate <= now;
                                                });
                                            } else if (incomeTimePeriod === "Last 6 Months") {
                                                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                                                filteredInvoices = invoices.filter((inv: Invoice) => {
                                                    const invDate = new Date(inv.invoiceDate || inv.date || (inv as any).createdAt);
                                                    return invDate >= sixMonthsAgo && invDate <= now;
                                                });
                                            }

                                            // Filter by accounting basis
                                            if (accountingBasis === "Cash") {
                                                // Only count invoices that have been paid
                                                filteredInvoices = filteredInvoices.filter((inv: Invoice) => {
                                                    const paidAmount = payments
                                                        .filter(p => p.invoiceId === inv.id || p.invoiceId === (inv as any)._id || p.invoiceNumber === inv.invoiceNumber)
                                                        .reduce((sum, p) => sum + parseFloat(String(p.amountReceived || p.amount || 0)), 0);
                                                    const invoiceTotal = parseFloat(String(inv.total || inv.amount || 0));
                                                    return paidAmount >= invoiceTotal;
                                                });
                                            }

                                            // Calculate total income
                                            const totalIncome = filteredInvoices.reduce((sum, inv: Invoice) => {
                                                const amount = parseFloat(String(inv.total || inv.amount || (inv as any).subtotal || 0));
                                                return sum + amount;
                                            }, 0);

                                            // Monthly data for chart
                                            const getMonthlyData = () => {
                                                const periods: { label: string; year: number; month: number; total: number }[] = [];
                                                const now = new Date();

                                                if (incomeTimePeriod === "Last 6 Months" || incomeTimePeriod === "Last 12 Months") {
                                                    const count = incomeTimePeriod === "Last 6 Months" ? 6 : 12;
                                                    for (let i = count - 1; i >= 0; i--) {
                                                        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                                        periods.push({
                                                            label: d.toLocaleString('en-US', { month: 'short' }),
                                                            year: d.getFullYear(),
                                                            month: d.getMonth(),
                                                            total: 0
                                                        });
                                                    }
                                                } else if (incomeTimePeriod === "This Fiscal Year") {
                                                    const startMonth = 6; // July
                                                    const fiscalYearStart = now.getMonth() >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
                                                    for (let i = 0; i < 12; i++) {
                                                        const d = new Date(fiscalYearStart, startMonth + i, 1);
                                                        if (d > now) break;
                                                        periods.push({
                                                            label: d.toLocaleString('en-US', { month: 'short' }),
                                                            year: d.getFullYear(),
                                                            month: d.getMonth(),
                                                            total: 0
                                                        });
                                                    }
                                                } else if (incomeTimePeriod === "Previous Fiscal Year") {
                                                    const startMonth = 6; // July
                                                    const fiscalYearStart = now.getMonth() >= startMonth ? now.getFullYear() - 1 : now.getFullYear() - 2;
                                                    for (let i = 0; i < 12; i++) {
                                                        const d = new Date(fiscalYearStart, startMonth + i, 1);
                                                        periods.push({
                                                            label: d.toLocaleString('en-US', { month: 'short' }),
                                                            year: d.getFullYear(),
                                                            month: d.getMonth(),
                                                            total: 0
                                                        });
                                                    }
                                                }

                                                // Fill data
                                                filteredInvoices.forEach(inv => {
                                                    const invDate = new Date(String(inv.invoiceDate || inv.date || inv.createdAt || 0));
                                                    const period = periods.find(p => p.year === invDate.getFullYear() && p.month === invDate.getMonth());
                                                    if (period) {
                                                        period.total += parseFloat(String(inv.total || inv.amount || 0));
                                                    }
                                                });

                                                return periods;
                                            };

                                            const chartData = getMonthlyData();
                                            const maxVal = Math.max(...chartData.map(d => d.total), 1000);
                                            const hasIncomeData = chartData.some((d) => d.total > 0);
                                            const chartHeight = 160;
                                            const chartWidth = 400;

                                            return (
                                                <>
                                                    <div className="h-56 rounded-md p-4 mb-4 relative overflow-hidden">
                                                        <div className="h-full w-full relative">
                                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                                {[0, 1, 2, 3, 4].map(i => (
                                                                    <div key={i} className="w-full border-t border-gray-200 h-0"></div>
                                                                ))}
                                                            </div>
                                                            {hasIncomeData && (
                                                                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                                                                    <path
                                                                        d={`M 0 ${chartHeight} ${chartData.map((d, i) =>
                                                                            `L ${(i / (chartData.length - 1)) * chartWidth} ${chartHeight - (d.total / maxVal) * chartHeight * 0.8}`
                                                                        ).join(' ')} L ${chartWidth} ${chartHeight} Z`}
                                                                        fill="rgba(59, 130, 246, 0.10)"
                                                                    />
                                                                    <polyline
                                                                        fill="none"
                                                                        stroke="#3b82f6"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        points={chartData.map((d, i) =>
                                                                            `${(i / (chartData.length - 1)) * chartWidth},${chartHeight - (d.total / maxVal) * chartHeight * 0.8}`
                                                                        ).join(' ')}
                                                                    />
                                                                </svg>
                                                            )}
                                                            <div className="absolute bottom-[-15px] left-0 right-0 flex justify-between px-1">
                                                                {chartData.map((d, i) => (
                                                                    <span key={i} className="text-[10px] text-gray-400 font-medium">{d.label}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-lg font-medium text-gray-900 pt-4 border-t border-gray-200">
                                                        Total Income ({incomeTimePeriod}) - {formatCurrency(totalIncome, customer.currency?.substring(0, 3) || "USD")}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Activity Feed */}
                                <div className="mb-6 border-t border-gray-200 pt-6">
                                    <div className="px-2">
                                        {(() => {
                                            const events: Array<{
                                                id: string;
                                                date: Date;
                                                title: string;
                                                description: string;
                                                author?: string;
                                                color: string;
                                                detailsLink?: string;
                                            }> = [];

                                            if (customer?.createdDate || customer?.createdAt) {
                                                events.push({
                                                    id: `customer-created-${customer.id || id}`,
                                                    date: new Date(String(customer.createdDate || customer.createdAt)),
                                                    title: "Contact added",
                                                    description: "Customer created",
                                                    author: customer.createdBy || "System",
                                                    color: "border-blue-400",
                                                });
                                            }

                                            (customer?.contactPersons || []).forEach((contact: any, index: number) => {
                                                const contactName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Contact person";
                                                events.push({
                                                    id: `contact-person-${contact.id || index}`,
                                                    date: new Date(String(contact.createdAt || customer?.createdDate || Date.now())),
                                                    title: "Contact person added",
                                                    description: `Contact person ${contactName} has been created`,
                                                    author: contact.createdBy || customer?.createdBy || "System",
                                                    color: "border-blue-400",
                                                });
                                            });

                                            invoices.forEach((invoice: any, index: number) => {
                                                events.push({
                                                    id: `invoice-${invoice.id || invoice._id || index}`,
                                                    date: new Date(String(invoice.invoiceDate || invoice.date || invoice.createdAt || Date.now())),
                                                    title: invoice.status === "sent" || invoice.status === "emailed" ? "Invoice updated" : "Invoice added",
                                                    description: `Invoice ${invoice.invoiceNumber || invoice.id || invoice._id || "record"} ${invoice.status === "sent" || invoice.status === "emailed" ? "emailed" : "created"}`,
                                                    author: invoice.createdBy,
                                                    color: "border-sky-400",
                                                    detailsLink: "View Details",
                                                });
                                            });

                                            payments.forEach((payment: any, index: number) => {
                                                events.push({
                                                    id: `payment-${payment.id || payment._id || index}`,
                                                    date: new Date(String(payment.paymentDate || payment.date || payment.createdAt || Date.now())),
                                                    title: "Payment received",
                                                    description: `${formatCurrency(payment.amountReceived || payment.amount || 0, customer?.currency || "USD")} applied for ${payment.invoiceNumber || payment.invoiceId || "invoice"}`,
                                                    author: payment.createdBy,
                                                    color: "border-green-400",
                                                });
                                            });

                                            const displayEvents = events
                                                .filter((event) => !Number.isNaN(event.date.getTime()))
                                                .sort((a, b) => b.date.getTime() - a.date.getTime())
                                                .slice(0, 8);

                                            if (displayEvents.length === 0) {
                                                return (
                                                    <div className="text-center py-10 text-sm text-gray-500">
                                                        No activity found
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="space-y-8">
                                                    {displayEvents.map((event, index) => {
                                                        const formattedDate = event.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                                                        const formattedTime = event.date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                                                        const isLast = index === displayEvents.length - 1;

                                                        return (
                                                            <div key={event.id} className="grid grid-cols-[120px_24px_1fr] gap-4">
                                                                <div className="text-right">
                                                                    <div className="text-[13px] text-gray-700">{formattedDate}</div>
                                                                    <div className="text-[13px] text-blue-600">{formattedTime}</div>
                                                                </div>
                                                                <div className="relative flex justify-center">
                                                                    {!isLast && <div className="absolute top-5 bottom-[-32px] w-px bg-blue-300"></div>}
                                                                    <span className={`z-10 mt-1 h-4 w-4 rounded-full border-2 bg-white ${event.color}`}></span>
                                                                </div>
                                                                <div className="rounded-md border border-gray-200 bg-white px-5 py-4">
                                                                    <p className="text-base font-medium text-gray-900">{event.title}</p>
                                                                    <p className="mt-1 text-[15px] text-gray-600">{event.description}</p>
                                                                    {event.author && (
                                                                        <p className="mt-1 text-[15px] font-semibold text-[#4b5f82]">
                                                                            by {event.author}
                                                                            {event.detailsLink && <span className="ml-1 text-xs font-normal text-blue-600">{event.detailsLink}</span>}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "comments" && (
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Comment Editor */}
                        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200">
                                <button
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                                    onClick={() => applyFormatting("bold")}
                                    title="Bold"
                                >
                                    <Bold size={16} />
                                </button>
                                <button
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                                    onClick={() => applyFormatting("italic")}
                                    title="Italic"
                                >
                                    <Italic size={16} />
                                </button>
                                <button
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                                    onClick={() => applyFormatting("underline")}
                                    title="Underline"
                                >
                                    <Underline size={16} />
                                </button>
                            </div>
                            <textarea
                                id="comment-textarea"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y mb-4"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
                                rows={6}
                            />
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700"
                                onClick={handleAddComment}
                            >
                                Add Comment
                            </button>
                        </div>

                        {/* Comments List */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">ALL COMMENTS</h3>
                            {comments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No comments yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="text-sm text-gray-900 mb-3 whitespace-pre-wrap">
                                                {comment.text}
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(String(comment.timestamp)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <button
                                                    className="p-1 text-gray-500 hover:text-red-600 cursor-pointer"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    title="Delete comment"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {
                    activeTab === "transactions" && (
                        <div className="flex-1 overflow-y-auto p-6" style={{ paddingRight: 0 }}>
                            <div className="relative inline-block mb-4" ref={goToTransactionsDropdownRef}>
                                <button
                                    className="flex items-center gap-1 text-sm text-[#0f5ca8] cursor-pointer hover:underline"
                                    onClick={() => setIsGoToTransactionsDropdownOpen((prev) => !prev)}
                                >
                                    Go to transactions
                                    <ChevronDown size={14} />
                                </button>
                                {isGoToTransactionsDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-[210px] max-h-[430px] overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                                        {transactionSectionOptions.map((option) => {
                                            const isActive = Boolean(expandedTransactions[option.key]);
                                            return (
                                                <button
                                                    key={option.key}
                                                    className={`w-full text-left px-3 py-2 text-[14px] cursor-pointer ${isActive ? "bg-blue-500 text-white rounded-md mx-1 w-[calc(100%-8px)]" : "text-gray-800 hover:bg-gray-50"}`}
                                                    onClick={() => openTransactionSection(option.key)}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Transaction Categories List */}
                            <div className="space-y-0">
                                {/* Subscriptions */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.subscriptions ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("subscriptions")}
                                    >
                                        {expandedTransactions.subscriptions ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Subscriptions</span>
                                    </div>
                                </div>
                                {expandedTransactions.subscriptions && (
                                    <div className="bg-white border-b border-gray-200">
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">CREATION DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">LOCATION</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">SUBSCRIPTION NUMBER</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">REFERENCE NUMBER</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">PLAN</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">AMOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">NEXT BILLING DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td colSpan={8} className="py-8 px-4 text-center text-sm text-gray-500">
                                                            No subscriptions have been created for this customer yet.
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Invoices */}
                                <>
                                    <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.invoices ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                        <div
                                            className="flex items-center gap-3 flex-1 cursor-pointer"
                                            onClick={() => toggleTransactionSection("invoices")}
                                        >
                                            {expandedTransactions.invoices ? (
                                                <ChevronDown size={16} className="text-gray-400" />
                                            ) : (
                                                <ChevronRight size={16} className="text-gray-400" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900">Invoices</span>
                                        </div>
                                        <button
                                            className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                e.stopPropagation();
                                                navigate("/sales/invoices/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                            }}
                                        >
                                            <Plus size={14} />
                                            New
                                        </button>
                                    </div>
                                    {expandedTransactions.invoices && (
                                        <div className="pt-1 pb-0 bg-white border-b border-gray-200">
                                            <div className="flex items-center justify-end px-4 py-1 mb-0">
                                                <div className="relative" ref={statusDropdownRef}>
                                                    <button
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                                    >
                                                        <Filter size={14} className="text-blue-600" />
                                                        Status: {invoiceStatusFilter === "all" ? "All" : formatStatusLabel(invoiceStatusFilter)}
                                                        <ChevronDown size={14} />
                                                    </button>
                                                    {isStatusDropdownOpen && (
                                                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]">
                                                            {invoiceStatusOptions.map(status => (
                                                                <div
                                                                    key={status}
                                                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${invoiceStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                                    onClick={() => {
                                                                        setInvoiceStatusFilter(status);
                                                                        setIsStatusDropdownOpen(false);
                                                                        setInvoiceCurrentPage(1);
                                                                    }}
                                                                >
                                                                    {status === "all" ? "All" : formatStatusLabel(status)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="w-full border-collapse text-[13px]">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">DATE</th>
                                                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">LOCATION</th>
                                                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">INVOICE NUMBER</th>
                                                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">ORDER NUMBER</th>
                                                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">BALANCE DUE</th>
                                                            <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedInvoices.length > 0 ? (
                                                            paginatedInvoices.map((invoice) => (
                                                                <tr
                                                                    key={invoice.id}
                                                                    onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                                                                    className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                                >
                                                                    <td className="py-3 px-4 text-gray-900">
                                                                        {new Date(String(invoice.invoiceDate || invoice.date || invoice.createdAt || 0)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-gray-900">
                                                                        {(invoice as any).location || (customer as any)?.location || "Head Office"}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-gray-900">
                                                                        <span
                                                                            className="text-blue-600 no-underline font-medium hover:underline cursor-pointer"
                                                                            onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                                                                                e.stopPropagation();
                                                                                navigate(`/sales/invoices/${invoice.id}`);
                                                                            }}
                                                                        >
                                                                            {invoice.invoiceNumber || invoice.id}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-gray-900">{invoice.orderNumber || "-"}</td>
                                                                    <td className="py-3 px-4 text-gray-900">{formatCurrency(invoice.total || invoice.amount || 0, invoice.currency || customer?.currency || "AMD")}</td>
                                                                    <td className="py-3 px-4 text-gray-900">{formatCurrency(invoice.balance || invoice.total || invoice.amount || 0, invoice.currency || customer?.currency || "AMD")}</td>
                                                                    <td className="py-3 px-4 text-gray-900">
                                                                        <span
                                                                            className="text-xs font-medium"
                                                                            style={{
                                                                                color:
                                                                                    normalizeInvoiceStatus(invoice) === "paid" ? "#10b981" :
                                                                                        normalizeInvoiceStatus(invoice) === "overdue" ? "#ef4444" :
                                                                                            normalizeInvoiceStatus(invoice) === "client viewed" ? "#2563eb" :
                                                                                                normalizeInvoiceStatus(invoice) === "unpaid" ? "#f59e0b" :
                                                                                                    "#9ca3af"
                                                                            }}
                                                                        >
                                                                            {formatStatusLabel(normalizeInvoiceStatus(invoice))}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={7} className="py-8 px-4 text-center text-sm text-gray-500">
                                                                    There are no invoices.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                                {filteredInvoices.length > 0 && (
                                                    <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                                                        <div className="text-sm text-gray-700">
                                                            Total Count: <span className="text-blue-600 cursor-pointer hover:underline">View</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                onClick={() => setInvoiceCurrentPage(prev => Math.max(1, prev - 1))}
                                                                disabled={invoiceCurrentPage === 1}
                                                            >
                                                                <ChevronLeft size={16} />
                                                            </button>
                                                            <span className="text-sm text-gray-700 px-2">
                                                                {startIndex + 1} - {Math.min(endIndex, filteredInvoices.length)}
                                                            </span>
                                                            <button
                                                                className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                onClick={() => setInvoiceCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                                disabled={invoiceCurrentPage === totalPages}
                                                            >
                                                                <ChevronRight size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>


                                {/* Customer Payments */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.customerPayments ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("customerPayments")}
                                    >
                                        {expandedTransactions.customerPayments ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Customer Payments</span>
                                    </div>
                                    <button
                                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            navigate("/sales/payments-received/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                        }}
                                    >
                                        <Plus size={14} />
                                        New
                                    </button>
                                </div>
                                {expandedTransactions.customerPayments && (
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">PAYMENT#</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">REFERENCE NUMBER</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">INVOICE#</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">MODE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payments.length > 0 ? (
                                                        payments.map((payment) => (
                                                            <tr
                                                                key={payment.id}
                                                                onClick={() => navigate(`/sales/payments-received/${payment.id}`)}
                                                                className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                            >
                                                                <td className="py-3 px-4 text-gray-900">
                                                                    {new Date(String(payment.paymentDate || payment.date || payment.createdAt || 0)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </td>
                                                                <td className="py-3 px-4 text-gray-900">
                                                                    <span className="text-blue-600 no-underline font-medium hover:underline cursor-pointer">
                                                                        {payment.paymentNumber || payment.id}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-gray-900">{payment.referenceNumber || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{payment.invoiceNumber || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{payment.paymentMode || payment.mode || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{formatCurrency(payment.amountReceived || payment.amount || 0, payment.currency || customer?.currency || "AMD")}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="py-8 px-4 text-center text-sm text-gray-500">
                                                                There are no payments.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Links */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.paymentLinks ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("paymentLinks")}
                                    >
                                        {expandedTransactions.paymentLinks ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Payment Links</span>
                                    </div>
                                    <button
                                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            navigate("/payments/payment-links/new");
                                        }}
                                    >
                                        <Plus size={14} />
                                        New
                                    </button>
                                </div>
                                {expandedTransactions.paymentLinks && (
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        <div className="text-sm text-gray-500">
                                            No payment links found.
                                        </div>
                                    </div>
                                )}

                                {/* Quotes */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.quotes ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("quotes")}
                                    >
                                        {expandedTransactions.quotes ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Quotes</span>
                                    </div>
                                    <button
                                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            navigate("/sales/quotes/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                        }}
                                    >
                                        <Plus size={14} />
                                        New
                                    </button>
                                </div>
                                {expandedTransactions.quotes && (
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        <div className="flex items-center justify-end gap-2 mb-0">
                                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                                                <Filter size={16} />
                                            </button>
                                            <div className="relative" ref={quoteStatusDropdownRef}>
                                                <button
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setIsQuoteStatusDropdownOpen(!isQuoteStatusDropdownOpen)}
                                                >
                                                    Status: {quoteStatusFilter === "all" ? "All" : quoteStatusFilter.charAt(0).toUpperCase() + quoteStatusFilter.slice(1)}
                                                    <ChevronDown size={14} />
                                                </button>
                                                {isQuoteStatusDropdownOpen && (
                                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
                                                        {["all", "draft", "sent", "accepted", "declined", "expired", "invoiced"].map(status => (
                                                            <div
                                                                key={status}
                                                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${quoteStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                                onClick={() => {
                                                                    setQuoteStatusFilter(status);
                                                                    setIsQuoteStatusDropdownOpen(false);
                                                                }}
                                                            >
                                                                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">QUOTE#</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">REFERENCE NUMBER</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getFilteredQuotes().length > 0 ? (
                                                        getFilteredQuotes().map((quote) => (
                                                            <tr
                                                                key={quote.id}
                                                                onClick={() => navigate(`/sales/quotes/${quote.id}`)}
                                                                className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                            >
                                                                <td className="py-3 px-4 text-gray-900">
                                                                    {new Date(String(quote.date || quote.quoteDate || quote.createdAt || 0)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </td>
                                                                <td className="py-3 px-4 text-gray-900 px-4">
                                                                    <span className="text-blue-600 no-underline font-medium hover:underline cursor-pointer">
                                                                        {quote.quoteNumber || quote.id}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-gray-900">{quote.referenceNumber || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{formatCurrency(quote.total || 0, quote.currency || customer?.currency || "AMD")}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${(quote.status || "draft").toLowerCase() === "accepted" ? "bg-green-100 text-green-700" :
                                                                        (quote.status || "draft").toLowerCase() === "sent" ? "bg-blue-100 text-blue-700" :
                                                                            (quote.status || "draft").toLowerCase() === "declined" ? "bg-red-100 text-red-700" :
                                                                                (quote.status || "draft").toLowerCase() === "expired" ? "bg-gray-100 text-gray-700" :
                                                                                    (quote.status || "draft").toLowerCase() === "invoiced" ? "bg-purple-100 text-purple-700" :
                                                                                        "bg-gray-100 text-gray-700"
                                                                        }`}>
                                                                        {quote.status || "Draft"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} className="py-8 px-4 text-center text-sm text-gray-500">
                                                                There are no quotes.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Retainer Invoices */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.recurringInvoices ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("recurringInvoices")}
                                    >
                                        {expandedTransactions.recurringInvoices ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Retainer Invoices</span>
                                    </div>
                                    <button
                                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            navigate("/sales/retainer-invoices/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                        }}
                                    >
                                        <Plus size={14} />
                                        New
                                    </button>
                                </div>
                                {expandedTransactions.recurringInvoices && (
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        <div className="flex items-center justify-end gap-2 mb-0">
                                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                                                <Filter size={16} />
                                            </button>
                                            <div className="relative" ref={recurringInvoiceStatusDropdownRef}>
                                                <button
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setIsRecurringInvoiceStatusDropdownOpen(!isRecurringInvoiceStatusDropdownOpen)}
                                                >
                                                    Status: {recurringInvoiceStatusFilter === "all" ? "All" : recurringInvoiceStatusFilter.charAt(0).toUpperCase() + recurringInvoiceStatusFilter.slice(1)}
                                                    <ChevronDown size={14} />
                                                </button>
                                                {isRecurringInvoiceStatusDropdownOpen && (
                                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
                                                        {["all", "active", "stopped", "completed", "expired"].map(status => (
                                                            <div
                                                                key={status}
                                                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${recurringInvoiceStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                                onClick={() => {
                                                                    setRecurringInvoiceStatusFilter(status);
                                                                    setIsRecurringInvoiceStatusDropdownOpen(false);
                                                                }}
                                                            >
                                                                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">PROFILE NAME</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">FREQUENCY</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">LAST INVOICE DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">NEXT INVOICE DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getFilteredRecurringInvoices().length > 0 ? (
                                                        getFilteredRecurringInvoices().map((ri) => (
                                                            <tr
                                                                key={ri.id}
                                                                onClick={() => navigate(`/sales/retainer-invoices/${ri.id}`)}
                                                                className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                            >
                                                                <td className="py-3 px-4 text-gray-900 font-medium">{ri.profileName || ri.id}</td>
                                                                <td className="py-3 px-4 text-gray-900">{ri.repeatEvery} {ri.repeatUnit}</td>
                                                                <td className="py-3 px-4 text-gray-900">{ri.lastInvoiceDate ? new Date(ri.lastInvoiceDate).toLocaleDateString() : "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{ri.nextInvoiceDate ? new Date(ri.nextInvoiceDate).toLocaleDateString() : "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{formatCurrency(ri.total || 0, ri.currency || customer?.currency || "AMD")}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${(ri.status || "").toLowerCase() === "active" ? "bg-green-100 text-green-700" :
                                                                        (ri.status || "").toLowerCase() === "stopped" ? "bg-red-100 text-red-700" :
                                                                            "bg-gray-100 text-gray-700"
                                                                        }`}>
                                                                        {ri.status || "Active"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="py-8 px-4 text-center text-sm text-gray-500">
                                                                There are no retainer invoices.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Expenses */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.expenses ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("expenses")}
                                    >
                                        {expandedTransactions.expenses ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Expenses</span>
                                    </div>
                                    <button
                                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            navigate("/purchases/expenses/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                        }}
                                    >
                                        <Plus size={14} />
                                        New
                                    </button>
                                </div>
                                {expandedTransactions.expenses && (
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        <div className="flex items-center justify-end gap-2 mb-0">
                                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                                                <Filter size={16} />
                                            </button>
                                            <div className="relative" ref={expenseStatusDropdownRef}>
                                                <button
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setIsExpenseStatusDropdownOpen(!isExpenseStatusDropdownOpen)}
                                                >
                                                    Status: {expenseStatusFilter === "all" ? "All" : expenseStatusFilter.charAt(0).toUpperCase() + expenseStatusFilter.slice(1)}
                                                    <ChevronDown size={14} />
                                                </button>
                                                {isExpenseStatusDropdownOpen && (
                                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
                                                        {["all", "unbilled", "invoiced", "reimbursable", "non-reimbursable"].map(status => (
                                                            <div
                                                                key={status}
                                                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${expenseStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                                onClick={() => {
                                                                    setExpenseStatusFilter(status);
                                                                    setIsExpenseStatusDropdownOpen(false);
                                                                }}
                                                            >
                                                                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">EXPENSE ACCOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">REFERENCE NUMBER</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">VENDOR NAME</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">PAID THROUGH</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getFilteredExpenses().length > 0 ? (
                                                        getFilteredExpenses().map((expense) => (
                                                            <tr
                                                                key={expense.id}
                                                                onClick={() => navigate(`/purchases/expenses/${expense.id}`)}
                                                                className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                            >
                                                                <td className="py-3 px-4 text-gray-900">
                                                                    {new Date(String(expense.date || expense.createdAt || 0)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </td>
                                                                <td className="py-3 px-4 text-gray-900">{expense.expenseAccount || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{expense.referenceNumber || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{expense.vendorName || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{expense.paidThrough || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900 font-medium">{formatCurrency(expense.amount || 0, expense.currency || customer?.currency || "AMD")}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${(expense.status || "").toLowerCase() === "invoiced" ? "bg-green-100 text-green-700" :
                                                                        "bg-gray-100 text-gray-700"
                                                                        }`}>
                                                                        {expense.status || "Unbilled"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={7} className="py-8 px-4 text-center text-sm text-gray-500">
                                                                There are no expenses.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Recurring Expenses */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.recurringExpenses ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("recurringExpenses")}
                                    >
                                        {expandedTransactions.recurringExpenses ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Recurring Expenses</span>
                                    </div>
                                    <button
                                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            navigate("/purchases/expenses/recurring/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                        }}
                                    >
                                        <Plus size={14} />
                                        New
                                    </button>
                                </div>
                                {expandedTransactions.recurringExpenses && (
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        <div className="flex items-center justify-end gap-2 mb-0">
                                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                                                <Filter size={16} />
                                            </button>
                                            <div className="relative" ref={recurringExpenseStatusDropdownRef}>
                                                <button
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setIsRecurringExpenseStatusDropdownOpen(!isRecurringExpenseStatusDropdownOpen)}
                                                >
                                                    Status: {recurringExpenseStatusFilter === "all" ? "All" : recurringExpenseStatusFilter.charAt(0).toUpperCase() + recurringExpenseStatusFilter.slice(1)}
                                                    <ChevronDown size={14} />
                                                </button>
                                                {isRecurringExpenseStatusDropdownOpen && (
                                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
                                                        {["all", "active", "stopped", "expired"].map(status => (
                                                            <div
                                                                key={status}
                                                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${recurringExpenseStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                                onClick={() => {
                                                                    setRecurringExpenseStatusFilter(status);
                                                                    setIsRecurringExpenseStatusDropdownOpen(false);
                                                                }}
                                                            >
                                                                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">PROFILE NAME</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">FREQUENCY</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">LAST EXPENSE DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">NEXT EXPENSE DATE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getFilteredRecurringExpenses().length > 0 ? (
                                                        getFilteredRecurringExpenses().map((re) => (
                                                            <tr
                                                                key={re.id}
                                                                onClick={() => navigate(`/purchases/expenses/recurring/${re.id}`)}
                                                                className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                            >
                                                                <td className="py-3 px-4 text-gray-900 font-medium">{re.profileName || re.id}</td>
                                                                <td className="py-3 px-4 text-gray-900">{re.repeatEvery} {re.repeatUnit}</td>
                                                                <td className="py-3 px-4 text-gray-900">{re.lastExpenseDate ? new Date(re.lastExpenseDate).toLocaleDateString() : "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{re.nextExpenseDate ? new Date(re.nextExpenseDate).toLocaleDateString() : "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{formatCurrency(re.amount || 0, re.currency || customer?.currency || "AMD")}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${(re.status || "").toLowerCase() === "active" ? "bg-green-100 text-green-700" :
                                                                        (re.status || "").toLowerCase() === "stopped" ? "bg-red-100 text-red-700" :
                                                                            "bg-gray-100 text-gray-700"
                                                                        }`}>
                                                                        {re.status || "Active"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="py-8 px-4 text-center text-sm text-gray-500">
                                                                There are no recurring expenses.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Projects */}
                                <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.projects ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => toggleTransactionSection("projects")}
                                    >
                                        {expandedTransactions.projects ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">Projects</span>
                                    </div>
                                    <button
                                        className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            navigate("/time-tracking/projects/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                        }}
                                    >
                                        <Plus size={14} />
                                        New
                                    </button>
                                </div>
                                {expandedTransactions.projects && (
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        <div className="flex items-center justify-end gap-2 mb-0">
                                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                                                <Filter size={16} />
                                            </button>
                                            <div className="relative" ref={projectStatusDropdownRef}>
                                                <button
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setIsProjectStatusDropdownOpen(!isProjectStatusDropdownOpen)}
                                                >
                                                    Status: {projectStatusFilter === "all" ? "All" : projectStatusFilter.charAt(0).toUpperCase() + projectStatusFilter.slice(1)}
                                                    <ChevronDown size={14} />
                                                </button>
                                                {isProjectStatusDropdownOpen && (
                                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
                                                        {["all", "active", "on hold", "finished", "cancelled"].map(status => (
                                                            <div
                                                                key={status}
                                                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${projectStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                                onClick={() => {
                                                                    setProjectStatusFilter(status);
                                                                    setIsProjectStatusDropdownOpen(false);
                                                                }}
                                                            >
                                                                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">PROJECT NAME</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">PROJECT CODE</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">BILLING METHOD</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">TOTAL HOURS</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">BILLED AMOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">UN-BILLED AMOUNT</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getFilteredProjects().length > 0 ? (
                                                        getFilteredProjects().map((project) => (
                                                            <tr
                                                                key={project.id}
                                                                onClick={() => navigate(`/time-tracking/projects/${project.id}`)}
                                                                className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                            >
                                                                <td className="py-3 px-4 text-gray-900 font-medium">{project.projectName || project.name}</td>
                                                                <td className="py-3 px-4 text-gray-900">{project.projectCode || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{project.billingMethod || "-"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{project.totalHours || "0:00"}</td>
                                                                <td className="py-3 px-4 text-gray-900">{formatCurrency(project.billedAmount || 0, project.currency || customer?.currency || "AMD")}</td>
                                                                <td className="py-3 px-4 text-gray-900">{formatCurrency(project.unbilledAmount || 0, project.currency || customer?.currency || "AMD")}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${(project.status || "").toLowerCase() === "active" ? "bg-green-100 text-green-700" :
                                                                        (project.status || "").toLowerCase() === "finished" ? "bg-blue-100 text-blue-700" :
                                                                            "bg-gray-100 text-gray-700"
                                                                        }`}>
                                                                        {project.status || "Active"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={7} className="py-8 px-4 text-center text-sm text-gray-500">
                                                                There are no projects.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Journals and Bills removed from customer Transactions tab */}
                            </div>

                            {/* Credit Notes */}
                            <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.creditNotes ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                <div
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => toggleTransactionSection("creditNotes")}
                                >
                                    {expandedTransactions.creditNotes ? (
                                        <ChevronDown size={16} className="text-gray-400" />
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium text-gray-900">Credit Notes</span>
                                </div>
                                <button
                                    className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/sales/credit-notes/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                    }}
                                >
                                    <Plus size={14} />
                                    New
                                </button>
                            </div>
                            {expandedTransactions.creditNotes && (
                                <div className="p-4 bg-white border-b border-gray-200">
                                    <div className="flex items-center justify-end gap-2 mb-0">
                                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                                            <Filter size={16} />
                                        </button>
                                        <div className="relative" ref={creditNoteStatusDropdownRef}>
                                            <button
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                onClick={() => setIsCreditNoteStatusDropdownOpen(!isCreditNoteStatusDropdownOpen)}
                                            >
                                                Status: {creditNoteStatusFilter === "all" ? "All" : creditNoteStatusFilter.charAt(0).toUpperCase() + creditNoteStatusFilter.slice(1)}
                                                <ChevronDown size={14} />
                                            </button>
                                            {isCreditNoteStatusDropdownOpen && (
                                                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
                                                    {["all", "draft", "open", "closed", "void"].map(status => (
                                                        <div
                                                            key={status}
                                                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${creditNoteStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                            onClick={() => {
                                                                setCreditNoteStatusFilter(status);
                                                                setIsCreditNoteStatusDropdownOpen(false);
                                                            }}
                                                        >
                                                            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full border-collapse text-[13px]">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">DATE</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">CREDIT NOTE#</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">REFERENCE#</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">BALANCE</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getFilteredCreditNotes().length > 0 ? (
                                                    getFilteredCreditNotes().map((cn) => (
                                                        <tr
                                                            key={cn.id}
                                                            onClick={() => navigate(`/sales/credit-notes/${cn.id}`)}
                                                            className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                        >
                                                            <td className="py-3 px-4 text-gray-900">
                                                                {new Date(String(cn.date || cn.creditNoteDate || 0)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-900 font-medium">{cn.creditNoteNumber || cn.id}</td>
                                                            <td className="py-3 px-4 text-gray-900">{cn.referenceNumber || "-"}</td>
                                                            <td className="py-3 px-4 text-gray-900 font-medium">{formatCurrency(cn.total || 0, cn.currency || customer?.currency || "AMD")}</td>
                                                            <td className="py-3 px-4 text-gray-900">{formatCurrency(cn.balance || 0, cn.currency || customer?.currency || "AMD")}</td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${(cn.status || "").toLowerCase() === "open" ? "bg-blue-100 text-blue-700" :
                                                                    (cn.status || "").toLowerCase() === "closed" ? "bg-green-100 text-green-700" :
                                                                        "bg-gray-100 text-gray-700"
                                                                    }`}>
                                                                    {cn.status || "Draft"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="py-8 px-4 text-center text-sm text-gray-500">
                                                            There are no credit notes.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Sales Receipts */}
                            <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.salesReceipts ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                <div
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => toggleTransactionSection("salesReceipts")}
                                >
                                    {expandedTransactions.salesReceipts ? (
                                        <ChevronDown size={16} className="text-gray-400" />
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium text-gray-900">Sales Receipts</span>
                                </div>
                                <button
                                    className="hidden flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/sales/sales-receipts/new", { state: { customerId: customer?.id, customerName: customer?.name } });
                                    }}
                                >
                                    <Plus size={14} />
                                    New
                                </button>
                            </div>
                            {expandedTransactions.salesReceipts && (
                                <div className="p-4 bg-white border-b border-gray-200">
                                    <div className="flex items-center justify-end gap-2 mb-0">
                                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                                            <Filter size={16} />
                                        </button>
                                        <div className="relative" ref={salesReceiptStatusDropdownRef}>
                                            <button
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                onClick={() => setIsSalesReceiptStatusDropdownOpen(!isSalesReceiptStatusDropdownOpen)}
                                            >
                                                Status: {salesReceiptStatusFilter === "all" ? "All" : salesReceiptStatusFilter.charAt(0).toUpperCase() + salesReceiptStatusFilter.slice(1)}
                                                <ChevronDown size={14} />
                                            </button>
                                            {isSalesReceiptStatusDropdownOpen && (
                                                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
                                                    {["all", "draft", "sent", "paid", "void"].map(status => (
                                                        <div
                                                            key={status}
                                                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${salesReceiptStatusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                                                            onClick={() => {
                                                                setSalesReceiptStatusFilter(status);
                                                                setIsSalesReceiptStatusDropdownOpen(false);
                                                            }}
                                                        >
                                                            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full border-collapse text-[13px]">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">DATE</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">SALES RECEIPT#</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">REFERENCE NUMBER</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">AMOUNT</th>
                                                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getFilteredSalesReceipts().length > 0 ? (
                                                    getFilteredSalesReceipts().map((sr) => (
                                                        <tr
                                                            key={sr.id}
                                                            onClick={() => navigate(`/sales/sales-receipts/${sr.id}`)}
                                                            className="border-b border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                                        >
                                                            <td className="py-3 px-4 text-gray-900">
                                                                {new Date(String(sr.date || sr.salesReceiptDate || 0)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-900 font-medium">{sr.salesReceiptNumber || sr.id}</td>
                                                            <td className="py-3 px-4 text-gray-900">{sr.referenceNumber || "-"}</td>
                                                            <td className="py-3 px-4 text-gray-900 font-medium">{formatCurrency(sr.total || 0, sr.currency || customer?.currency || "AMD")}</td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${(sr.status || "").toLowerCase() === "paid" ? "bg-green-100 text-green-700" :
                                                                    (sr.status || "").toLowerCase() === "sent" ? "bg-blue-100 text-blue-700" :
                                                                        "bg-gray-100 text-gray-700"
                                                                    }`}>
                                                                    {sr.status || "Draft"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 px-4 text-center text-sm text-gray-500">
                                                            There are no sales receipts.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Refunds */}
                            <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${expandedTransactions.refunds ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                                <div
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => toggleTransactionSection("refunds")}
                                >
                                    {expandedTransactions.refunds ? (
                                        <ChevronDown size={16} className="text-gray-400" />
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium text-gray-900">Refunds</span>
                                </div>
                            </div>
                            {expandedTransactions.refunds && (
                                <div className="p-4 bg-white border-b border-gray-200">
                                    <div className="text-sm text-gray-500">
                                        No refunds found.
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === "purchases" && (
                        <div className="flex-1 overflow-y-auto p-6" style={{ paddingRight: 0 }}>
                            <button className="flex items-center gap-2 px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-100">
                                Go to transactions
                                <ChevronDown size={16} />
                            </button>
                            {isLinkedVendorPurchasesLoading && (
                                <div className="bg-white rounded-lg border border-gray-200 px-6 py-10 text-sm text-gray-500 text-center">
                                    Loading linked vendor transactions...
                                </div>
                            )}
                            {!isLinkedVendorPurchasesLoading && (
                                <div className="space-y-4">
                                    {[
                                        { key: "bills", label: "Bills", rows: linkedVendorPurchases, navigateTo: "/purchases/bills/" },
                                        { key: "paymentsMade", label: "Bill Payments", rows: linkedVendorPaymentsMade, navigateTo: "/purchases/payments-made/" },
                                        { key: "purchaseOrders", label: "Purchase Orders", rows: linkedVendorPurchaseOrders, navigateTo: "/purchases/purchase-orders/" },
                                        { key: "vendorCredits", label: "Vendor Credits", rows: linkedVendorCredits, navigateTo: "/purchases/vendor-credits/" }
                                    ].map((section: any) => (
                                        <div key={section.key} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                            <button
                                                className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-900 font-medium cursor-pointer hover:bg-gray-100"
                                                onClick={() => toggleLinkedVendorPurchaseSection(section.key)}
                                            >
                                                {linkedVendorPurchaseSections[section.key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                {section.label}
                                            </button>
                                            {linkedVendorPurchaseSections[section.key] && (
                                                <div className="bg-white border-t border-gray-200">
                                                    {section.rows.length === 0 ? (
                                                        <div className="px-4 py-4 text-sm text-gray-500">No transactions found.</div>
                                                    ) : (
                                                        section.rows.map((row: any, index: number) => {
                                                            const rowId = String(row._id || row.id || "");
                                                            const rowNumber =
                                                                row.billNumber ||
                                                                row.paymentNumber ||
                                                                row.purchaseOrderNumber ||
                                                                row.vendorCreditNumber ||
                                                                row.creditNoteNumber ||
                                                                rowId;
                                                            const rowDate = row.date || row.billDate || row.paymentDate || row.purchaseOrderDate || row.creditNoteDate;
                                                            const rowAmount = row.total || row.amount || row.amountPaid || 0;
                                                            return (
                                                                <div
                                                                    key={rowId || `${section.key}-${index}`}
                                                                    className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 text-sm hover:bg-gray-50 cursor-pointer"
                                                                    onClick={() => rowId && navigate(`${section.navigateTo}${rowId}`)}
                                                                >
                                                                    <div className="col-span-3 text-gray-900">{rowDate ? new Date(rowDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}</div>
                                                                    <div className="col-span-4 text-blue-600 font-medium">{rowNumber || "-"}</div>
                                                                    <div className="col-span-3 text-gray-900">{formatCurrency(rowAmount, row.currency || customer?.currency || "USD")}</div>
                                                                    <div className="col-span-2 text-gray-600">{row.status || "-"}</div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === "mails" && (
                        <div className="flex-1 overflow-y-auto p-6" style={{ paddingRight: 0 }}>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">System Mails</h3>
                                    <div className="relative" ref={linkEmailDropdownRef}>
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700"
                                            onClick={() => setIsLinkEmailDropdownOpen(!isLinkEmailDropdownOpen)}
                                        >
                                            <Mail size={16} />
                                            Link Email account
                                            <ChevronDown size={14} />
                                        </button>
                                        {isLinkEmailDropdownOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                                <div
                                                    className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => {
                                                        setIsLinkEmailDropdownOpen(false);
                                                        setIsZohoMailIntegrationModalOpen(true);
                                                    }}
                                                >
                                                    Zoho Mail
                                                </div>
                                                <div
                                                    className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => {
                                                        setIsLinkEmailDropdownOpen(false);
                                                        setIsOutlookIntegrationModalOpen(true);
                                                    }}
                                                >
                                                    Connect Outlook
                                                </div>
                                                <div className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                                                    Connect Other Email
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {mails.length > 0 ? (
                                        mails.map((mail) => (
                                            <div key={mail.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-sm">
                                                    {mail.initial}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-gray-600 mb-1">
                                                        To <span className="font-medium text-gray-900">{mail.to}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        <span className="font-medium">{mail.subject}</span>
                                                        <span className="text-gray-400"> - </span>
                                                        <span className="text-gray-600">{mail.description}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                                    {mail.date}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                                            <Mail size={48} />
                                            <p>No emails sent to this customer yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === "statement" && (
                        <div className="flex-1 overflow-y-auto p-6" style={{ paddingRight: 0 }}>
                            {/* Statement Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="relative" ref={statementPeriodDropdownRef}>
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => setIsStatementPeriodDropdownOpen(!isStatementPeriodDropdownOpen)}
                                        >
                                            <Calendar size={16} />
                                            {statementPeriod === "this-month" ? "This Month" :
                                                statementPeriod === "last-month" ? "Last Month" :
                                                    statementPeriod === "this-quarter" ? "This Quarter" :
                                                        statementPeriod === "this-year" ? "This Year" : "Custom"}
                                            <ChevronDown size={14} />
                                        </button>
                                        {isStatementPeriodDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[180px]">
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementPeriod === "this-month" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementPeriod("this-month"); setIsStatementPeriodDropdownOpen(false); }}>This Month</div>
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementPeriod === "last-month" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementPeriod("last-month"); setIsStatementPeriodDropdownOpen(false); }}>Last Month</div>
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementPeriod === "this-quarter" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementPeriod("this-quarter"); setIsStatementPeriodDropdownOpen(false); }}>This Quarter</div>
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementPeriod === "this-year" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementPeriod("this-year"); setIsStatementPeriodDropdownOpen(false); }}>This Year</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative" ref={statementFilterDropdownRef}>
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                            onClick={() => setIsStatementFilterDropdownOpen(!isStatementFilterDropdownOpen)}
                                        >
                                            Filter By: {statementFilter === "all" ? "All" : statementFilter}
                                            <ChevronDown size={14} />
                                        </button>
                                        {isStatementFilterDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[180px]">
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementFilter === "all" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementFilter("all"); setIsStatementFilterDropdownOpen(false); }}>All</div>
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementFilter === "invoices" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementFilter("invoices"); setIsStatementFilterDropdownOpen(false); }}>Invoices</div>
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementFilter === "payments" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementFilter("payments"); setIsStatementFilterDropdownOpen(false); }}>Payments</div>
                                                <div className={`px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 ${statementFilter === "credit-notes" ? "bg-blue-50 text-blue-600" : ""}`} onClick={() => { setStatementFilter("credit-notes"); setIsStatementFilterDropdownOpen(false); }}>Credit Notes</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        className={`p-2 bg-white text-[#156372] hover:bg-[#EAF4F6] border border-gray-300 rounded-md transition-colors shadow-sm ${isStatementDownloading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                                        title="PDF"
                                        onClick={handleDownloadPDF}
                                        disabled={isStatementDownloading}
                                    >
                                        {isStatementDownloading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                    </button>
                                    <button
                                        className="flex items-center gap-2 px-4 py-2 bg-[#156372] text-white rounded-md text-sm font-medium cursor-pointer hover:bg-[#0D4A52] transition-colors shadow-sm"
                                        onClick={() => {
                                            const { startDate, endDate } = getStatementDateRange();
                                            navigate(`/sales/customers/${id}/send-email-statement`, {
                                                state: {
                                                    startDate,
                                                    endDate,
                                                    filterBy: statementFilter
                                                }
                                            });
                                        }}
                                    >
                                        <Mail size={16} />
                                        Send Email
                                    </button>
                                </div>
                            </div>

                            {/* Statement Document - A4 Style */}
                            <div
                                className="bg-white shadow-lg mx-auto print-content"
                                style={{
                                    width: '210mm',
                                    minHeight: '297mm',
                                    padding: '40px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {/* Document Header */}
                                <div className="flex justify-between items-start mb-12">
                                    {/* Left Side: Logo and Company Info */}
                                    <div className="flex gap-6 items-start">
                                        {/* Logo */}
                                        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                            {organizationProfile?.logo ? (
                                                <img
                                                    src={organizationProfile.logo}
                                                    alt="Organization Logo"
                                                    className="w-full h-full object-contain"
                                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="text-4xl">📖</div>
                                            )}
                                        </div>

                                        {/* Company Details */}
                                        <div className="flex flex-col">
                                            <div className="text-[18px] font-bold text-gray-900 mb-1">
                                                {organizationProfile?.organizationName || organizationProfile?.name || "TABAN ENTERPRISES"}
                                            </div>
                                            <div className="text-[14px] text-gray-600 leading-relaxed">
                                                {organizationProfile?.address?.street1 && <div>{organizationProfile.address.street1}</div>}
                                                {organizationProfile?.address?.street2 && <div>{organizationProfile.address.street2}</div>}
                                                <div>
                                                    {[
                                                        organizationProfile?.address?.city,
                                                        organizationProfile?.address?.state,
                                                        organizationProfile?.address?.zipCode,
                                                    ].filter(Boolean).join(", ")}
                                                </div>
                                                {organizationProfile?.address?.country && <div>{organizationProfile.address.country}</div>}
                                                <div className="mt-1">{ownerEmail?.email || organizationProfile?.email || ""}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Title and Date */}
                                    <div className="text-right">
                                        <h2 className="text-[32px] font-bold text-gray-900 mb-2">STATEMENT</h2>
                                        <div className="text-[14px] text-gray-600">
                                            {(() => {
                                                const { startDate, endDate } = getStatementDateRange();
                                                return `${startDate.toLocaleDateString('en-GB')} To ${endDate.toLocaleDateString('en-GB')}`;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Bill To Section */}
                                <div className="mb-8">
                                    <div className="text-[14px] font-bold text-gray-900 mb-2">To</div>
                                    <div className="text-[16px] font-medium text-blue-600">{displayName}</div>
                                </div>

                                {/* Account Summary Mini Table */}
                                <div className="mb-10 w-[300px] ml-auto">
                                    <div className="border-t border-b border-gray-200 divide-y divide-gray-100">
                                        <div className="flex justify-between py-2 text-[13px]">
                                            <span className="text-gray-600">Opening Balance</span>
                                            <span className="font-medium text-gray-900">{organizationProfile?.baseCurrency || "KES"} {parseFloat(String(customer?.openingBalance ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between py-2 text-[13px]">
                                            <span className="text-gray-600">Invoiced Amount</span>
                                            <span className="font-medium text-gray-900">{organizationProfile?.baseCurrency || "KES"} {invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total || inv.amount || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between py-2 text-[13px]">
                                            <span className="text-gray-600">Amount Received</span>
                                            <span className="font-medium text-gray-900">{organizationProfile?.baseCurrency || "KES"} {payments.reduce((sum, p) => sum + parseFloat(String(p.amountReceived || p.amount || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-1">
                                        <span className="text-[14px] font-bold text-gray-900">Balance Due</span>
                                        <span className="text-[14px] font-bold text-gray-900">{organizationProfile?.baseCurrency || "KES"} {(parseFloat(String(customer?.openingBalance || 0)) + invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total || inv.amount || 0)), 0) - payments.reduce((sum, p) => sum + parseFloat(String(p.amountReceived || p.amount || 0)), 0) - creditNotes.reduce((sum, cn) => sum + parseFloat(String(cn.total || cn.amount || 0)), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                {/* Main Transactions Table */}
                                <div className="mb-0">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-[#3d3d3d]">
                                                <th className="py-3 px-4 text-left text-[12px] font-semibold text-white">Date</th>
                                                <th className="py-3 px-4 text-left text-[12px] font-semibold text-white">Transactions</th>
                                                <th className="py-3 px-4 text-left text-[12px] font-semibold text-white">Details</th>
                                                <th className="py-3 px-4 text-right text-[12px] font-semibold text-white">Amount</th>
                                                <th className="py-3 px-4 text-right text-[12px] font-semibold text-white">Payments</th>
                                                <th className="py-3 px-4 text-right text-[12px] font-semibold text-white">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Opening Balance row if exists */}
                                            {parseFloat(String(customer?.openingBalance || 0)) !== 0 && (
                                                <tr className="bg-white">
                                                    <td className="py-3 px-4 text-[13px] text-gray-900">01 Jan {new Date().getFullYear()}</td>
                                                    <td className="py-3 px-4 text-[13px] text-gray-900">***Opening Balance***</td>
                                                    <td className="py-3 px-4 text-[13px] text-gray-600"></td>
                                                    <td className="py-3 px-4 text-[13px] text-gray-900 text-right">{parseFloat(String(customer?.openingBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="py-3 px-4 text-[13px] text-gray-900 text-right">0.00</td>
                                                    <td className="py-3 px-4 text-[13px] text-gray-900 text-right">{parseFloat(String(customer?.openingBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            )}
                                            {statementTransactions.map((transaction, index) => {
                                                // Calculate row index considering opening balance
                                                const rowIndex = parseFloat(String(customer?.openingBalance || 0)) !== 0 ? index + 1 : index;
                                                const isEven = rowIndex % 2 === 0;

                                                return (
                                                    <tr key={transaction.id} className={isEven ? "bg-white" : "bg-gray-50"}>
                                                        <td className="py-3 px-4 text-[13px] text-gray-900">{new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')}</td>
                                                        <td className="py-3 px-4 text-[13px] text-gray-900">{transaction.type}</td>
                                                        <td className="py-3 px-4 text-[13px] text-blue-600">
                                                            {transaction.detailsLink || ""}
                                                        </td>
                                                        <td className="py-3 px-4 text-[13px] text-gray-900 text-right">{transaction.amount !== 0 ? transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</td>
                                                        <td className="py-3 px-4 text-[13px] text-gray-900 text-right">{transaction.payments !== 0 ? transaction.payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</td>
                                                        <td className="py-3 px-4 text-[13px] text-gray-900 text-right">{transaction.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Transactions Bottom Balance */}
                                <div className="flex justify-end gap-16 py-4 px-4 border-t-2 border-gray-300 mt-2">
                                    <div className="text-[14px] font-bold text-gray-900">Balance Due</div>
                                    <div className="text-[14px] font-bold text-gray-900">
                                        $ {statementTransactions.length > 0 ? statementTransactions[statementTransactions.length - 1].balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : parseFloat(String(customer?.openingBalance ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {
                isPrintStatementsModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Print Customer statements</h2>
                                <button
                                    className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                                    onClick={() => setIsPrintStatementsModalOpen(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600 mb-6">
                                    You can print your customer's statements for the selected date range.
                                </p>

                                <div className="mb-4" ref={startDatePickerRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <div
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white cursor-pointer hover:bg-gray-50"
                                        onClick={() => {
                                            setIsStartDatePickerOpen(!isStartDatePickerOpen);
                                            setIsEndDatePickerOpen(false);
                                        }}
                                    >
                                        {formatDateForDisplay(printStatementStartDate)}
                                    </div>
                                    {isStartDatePickerOpen && renderCalendar(
                                        startDateCalendarMonth,
                                        printStatementStartDate,
                                        (date) => {
                                            setPrintStatementStartDate(date);
                                            setIsStartDatePickerOpen(false);
                                        },
                                        () => setStartDateCalendarMonth(new Date(startDateCalendarMonth.getFullYear(), startDateCalendarMonth.getMonth() - 1, 1)),
                                        () => setStartDateCalendarMonth(new Date(startDateCalendarMonth.getFullYear(), startDateCalendarMonth.getMonth() + 1, 1))
                                    )}
                                </div>

                                <div className="mb-4" ref={endDatePickerRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                    <div
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white cursor-pointer hover:bg-gray-50"
                                        onClick={() => {
                                            setIsEndDatePickerOpen(!isEndDatePickerOpen);
                                            setIsStartDatePickerOpen(false);
                                        }}
                                    >
                                        {formatDateForDisplay(printStatementEndDate)}
                                    </div>
                                    {isEndDatePickerOpen && renderCalendar(
                                        endDateCalendarMonth,
                                        printStatementEndDate,
                                        (date) => {
                                            setPrintStatementEndDate(date);
                                            setIsEndDatePickerOpen(false);
                                        },
                                        () => setEndDateCalendarMonth(new Date(endDateCalendarMonth.getFullYear(), endDateCalendarMonth.getMonth() - 1, 1)),
                                        () => setEndDateCalendarMonth(new Date(endDateCalendarMonth.getFullYear(), endDateCalendarMonth.getMonth() + 1, 1))
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700"
                                    onClick={handlePrintStatementsSubmit}
                                >
                                    Print Statements
                                </button>
                                <button
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50"
                                    onClick={() => setIsPrintStatementsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Merge Customers Modal */}
            {
                isMergeModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-[500px] mx-4">
                            <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 m-0">Merge Customers</h2>
                                <button
                                    className="flex items-center justify-center w-7 h-7 bg-white border-2 border-blue-600 rounded text-red-500 cursor-pointer hover:bg-red-50"
                                    onClick={() => {
                                        setIsMergeModalOpen(false);
                                        setMergeTargetCustomer(null);
                                        setMergeCustomerSearch("");
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-700 mb-4">
                                    Select a customer profile with whom you'd like to merge <strong>{customer?.name || customer?.displayName || displayName}</strong>. Once merged, the transactions of <strong>{customer?.name || customer?.displayName || displayName}</strong> will be transferred, and this customer record will be marked as inactive.
                                </p>
                                <div className="relative" ref={mergeCustomerDropdownRef}>
                                    <div
                                        className="flex items-center justify-between w-full py-2.5 px-3.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer transition-colors hover:border-gray-400"
                                        onClick={() => {
                                            setIsMergeCustomerDropdownOpen(!isMergeCustomerDropdownOpen);
                                            setMergeCustomerSearch("");
                                        }}
                                    >
                                        <span className={mergeTargetCustomer ? "text-gray-700" : "text-gray-400"}>
                                            {mergeTargetCustomer ? mergeTargetCustomer.name || mergeTargetCustomer.displayName : "Select Customer"}
                                        </span>
                                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isMergeCustomerDropdownOpen ? "rotate-180" : ""}`} />
                                    </div>
                                    {isMergeCustomerDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[1002] overflow-hidden">
                                            <div className="flex items-center gap-2 py-2.5 px-3.5 border-b border-gray-200">
                                                <Search size={16} className="text-gray-400 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    value={mergeCustomerSearch}
                                                    onChange={(e) => setMergeCustomerSearch(e.target.value)}
                                                    autoFocus
                                                    className="flex-1 border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto">
                                                {filteredMergeCustomers.length > 0 ? (
                                                    filteredMergeCustomers.map((customer, index) => (
                                                        <div
                                                            key={`${customer.id}-${index}`}
                                                            className={`py-2.5 px-3.5 text-sm cursor-pointer transition-colors ${mergeTargetCustomer?.id === customer.id ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
                                                            onClick={() => {
                                                                setMergeTargetCustomer(customer);
                                                                setIsMergeCustomerDropdownOpen(false);
                                                                setMergeCustomerSearch("");
                                                            }}
                                                        >
                                                            {customer.name || customer.displayName} {customer.companyName && `(${customer.companyName})`}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-2.5 px-3.5 text-sm text-gray-500">No customers found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 py-4 px-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                                <button
                                    className="py-2.5 px-5 text-sm font-medium text-white bg-red-600 border-none rounded-md cursor-pointer transition-colors hover:bg-red-700"
                                    onClick={handleMergeSubmit}
                                >
                                    Continue
                                </button>
                                <button
                                    className="py-2.5 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400"
                                    onClick={() => {
                                        setIsMergeModalOpen(false);
                                        setMergeTargetCustomer(null);
                                        setMergeCustomerSearch("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Associate Templates Modal */}
            {
                isAssociateTemplatesModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Associate Templates</h2>
                                <button
                                    className="p-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50 cursor-pointer"
                                    onClick={() => setIsAssociateTemplatesModalOpen(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600 mb-6">
                                    Associate PDF templates to this customer.
                                </p>

                                <div className="mb-6 pb-4 border-b border-gray-200 last:border-b-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-gray-900">PDF Templates</h3>
                                        <button
                                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                            onClick={() => navigate("/settings/customization/pdf-templates")}
                                        >
                                            <Plus size={16} />
                                            New PDF Template
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-sm text-gray-700">Customer Statement</label>
                                            <select
                                                className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                                                value={pdfTemplates.customerStatement}
                                                onChange={(e) => handleTemplateSelect("pdf", "customerStatement", e.target.value)}
                                            >
                                                {pdfTemplateOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-sm text-gray-700">Quotes</label>
                                            <select
                                                className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                                                value={pdfTemplates.quotes}
                                                onChange={(e) => handleTemplateSelect("pdf", "quotes", e.target.value)}
                                            >
                                                {pdfTemplateOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-sm text-gray-700">Invoices</label>
                                            <select
                                                className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                                                value={pdfTemplates.invoices}
                                                onChange={(e) => handleTemplateSelect("pdf", "invoices", e.target.value)}
                                            >
                                                {pdfTemplateOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-sm text-gray-700">Credit Notes</label>
                                            <select
                                                className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                                                value={pdfTemplates.creditNotes}
                                                onChange={(e) => handleTemplateSelect("pdf", "creditNotes", e.target.value)}
                                            >
                                                {pdfTemplateOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-sm text-gray-700">Payment Thank You</label>
                                            <select
                                                className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                                                value={pdfTemplates.paymentThankYou}
                                                onChange={(e) => handleTemplateSelect("pdf", "paymentThankYou", e.target.value)}
                                            >
                                                {pdfTemplateOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                                <button
                                    className="px-4 py-2 text-white rounded-md text-sm font-medium cursor-pointer transition-colors"
                                    style={{ background: "linear-gradient(90deg, #156372 0%, #0D4A52 100%)" }}
                                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                                    onClick={handleAssociateTemplatesSave}
                                >
                                    Save
                                </button>
                                <button
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50"
                                    onClick={() => setIsAssociateTemplatesModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Clone Modal */}
            {
                isCloneModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto customer-detail-clone-modal">
                            <div className="p-6">
                                <p className="text-sm text-gray-600 mb-6">
                                    Select the contact type under which you want to create the new cloned contact.
                                </p>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="cloneContactType"
                                            value="customer"
                                            checked={cloneContactType === "customer"}
                                            onChange={(e) => setCloneContactType(e.target.value)}
                                        />
                                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center"></span>
                                        <span className="text-sm font-medium text-gray-700">Customer</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="cloneContactType"
                                            value="vendor"
                                            checked={cloneContactType === "vendor"}
                                            onChange={(e) => setCloneContactType(e.target.value)}
                                        />
                                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center"></span>
                                        <span className="text-sm font-medium text-gray-700">Vendor</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                                <button
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 flex items-center gap-2 ${isCloning ? "opacity-70 cursor-not-allowed" : ""}`}
                                    onClick={() => handleCloneSubmit()}
                                    disabled={isCloning}
                                >
                                    {isCloning && <Loader2 size={14} className="animate-spin" />}
                                    {isCloning ? "Cloning..." : "Proceed"}
                                </button>
                                <button
                                    className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50 ${isCloning ? "opacity-70 cursor-not-allowed" : ""}`}
                                    onClick={() => setIsCloneModalOpen(false)}
                                    disabled={isCloning}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Configure Portal Access Modal */}
            {
                isConfigurePortalModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Configure Portal Access</h2>
                                <button
                                    className="flex items-center justify-center w-7 h-7 bg-white border-2 border-blue-600 rounded text-red-500 cursor-pointer hover:bg-red-50 transition-colors"
                                    onClick={() => setIsConfigurePortalModalOpen(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">NAME</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">EMAIL ADDRESS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portalAccessContacts.length > 0 ? (
                                                portalAccessContacts.map((contact) => (
                                                    <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={contact.hasAccess}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                        setPortalAccessContacts(prev =>
                                                                            prev.map(c =>
                                                                                c.id === contact.id ? { ...c, hasAccess: e.target.checked } : c
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                                />
                                                                <span className="text-sm text-gray-900">{contact.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {contact.email ? (
                                                                <span className="text-sm text-gray-900">{contact.email}</span>
                                                            ) : (
                                                                <button
                                                                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer"
                                                                    onClick={() => {
                                                                        const email = prompt("Enter email address:");
                                                                        if (email) {
                                                                            setPortalAccessContacts(prev =>
                                                                                prev.map(c =>
                                                                                    c.id === contact.id ? { ...c, email: email } : c
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    Add Email
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={2} className="py-8 text-center text-sm text-gray-500">
                                                        No contacts available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-start gap-3 p-6 border-t border-gray-200">
                                <button
                                    className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-red-700 transition-colors"
                                    onClick={async () => {
                                        // Save portal access configuration
                                        if (customer) {
                                            const updatedContactPersons = customer.contactPersons?.map(contact => {
                                                const portalContact = portalAccessContacts.find(pc =>
                                                    pc.name.includes(contact.firstName) && pc.name.includes(contact.lastName)
                                                );
                                                return portalContact ? { ...contact, hasPortalAccess: portalContact.hasAccess, email: portalContact.email || contact.email } : contact;
                                            }) || [];

                                            // If customer has no contact persons but we have portal access contacts, create them
                                            if ((!customer.contactPersons || customer.contactPersons.length === 0) && portalAccessContacts.length > 0) {
                                                const mainContact = portalAccessContacts[0];
                                                if (mainContact.id === 'customer-main') {
                                                    // Update customer directly
                                                    try {
                                                        await customersAPI.update(customer.id, {
                                                            ...customer,
                                                            enablePortal: mainContact.hasAccess,
                                                            email: mainContact.email || customer.email
                                                        });
                                                    } catch (error) {
                                                        alert('Failed to update customer: ' + (error.message || 'Unknown error'));
                                                    }
                                                }
                                            } else {
                                                try {
                                                    await customersAPI.update(customer.id, {
                                                        ...customer,
                                                        contactPersons: updatedContactPersons,
                                                        enablePortal: portalAccessContacts.some(c => c.hasAccess)
                                                    });
                                                } catch (error) {
                                                    alert('Failed to update customer: ' + (error.message || 'Unknown error'));
                                                }
                                            }

                                            // Refresh customer data
                                            const refreshResponse = await customersAPI.getById(customer.id);
                                            const updatedCustomer = refreshResponse?.success ? refreshResponse.data : null;
                                            if (updatedCustomer) {
                                                setCustomer(updatedCustomer);
                                            }
                                        }
                                        setIsConfigurePortalModalOpen(false);
                                    }}
                                >
                                    Save
                                </button>
                                <button
                                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setIsConfigurePortalModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Link to Vendor Modal */}
            {
                isLinkToVendorModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Link {customer?.name || customer?.displayName || "Customer"} to Vendor
                                </h2>
                                <button
                                    className="flex items-center justify-center w-7 h-7 bg-white border-2 border-blue-600 rounded text-red-500 cursor-pointer hover:bg-red-50 transition-colors"
                                    onClick={() => {
                                        setIsLinkToVendorModalOpen(false);
                                        setSelectedVendor(null);
                                        setVendorSearch("");
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                                    You're about to link this customer to a vendor. As a result the customer profile of the contact will be linked to the vendor profile of the other contact. This process will allow you to view receivables and payables for the contact from the contact's overview section.
                                </p>

                                {/* Vendor Selection Dropdown */}
                                <div className="relative" ref={vendorDropdownRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Choose a vendor to link
                                    </label>
                                    <button
                                        className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-700 hover:border-blue-500 transition-colors text-left"
                                        onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                                    >
                                        <span className={selectedVendor ? "text-gray-900" : "text-gray-400"}>
                                            {selectedVendor ? selectedVendor.name || selectedVendor.formData?.displayName || selectedVendor.formData?.companyName || selectedVendor.formData?.vendorName : "Choose a vendor to link"}
                                        </span>
                                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isVendorDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>
                                    {isVendorDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-hidden">
                                            <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
                                                <Search size={16} className="text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search vendors..."
                                                    value={vendorSearch}
                                                    onChange={(e) => setVendorSearch(e.target.value)}
                                                    className="flex-1 text-sm bg-transparent focus:outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {vendors
                                                    .filter(vendor => {
                                                        const searchTerm = vendorSearch.toLowerCase();
                                                        const vendorName = (vendor.name || vendor.formData?.displayName || vendor.formData?.companyName || vendor.formData?.vendorName || "").toLowerCase();
                                                        return vendorName.includes(searchTerm);
                                                    })
                                                    .map((vendor) => {
                                                        const vendorName = vendor.name || vendor.formData?.displayName || vendor.formData?.companyName || vendor.formData?.vendorName || "";
                                                        const isSelected = selectedVendor?.id === vendor.id;
                                                        return (
                                                            <div
                                                                key={vendor.id}
                                                                className={`p-3 cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${isSelected ? "bg-blue-50 border-l-4 border-blue-600" : ""
                                                                    }`}
                                                                onClick={() => {
                                                                    setSelectedVendor(vendor);
                                                                    setIsVendorDropdownOpen(false);
                                                                    setVendorSearch("");
                                                                }}
                                                            >
                                                                <span className="text-sm font-medium text-gray-900">{vendorName}</span>
                                                                {isSelected && (
                                                                    <Check size={16} className="text-blue-600" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                {vendors.filter(vendor => {
                                                    const searchTerm = vendorSearch.toLowerCase();
                                                    const vendorName = (vendor.name || vendor.formData?.displayName || vendor.formData?.companyName || vendor.formData?.vendorName || "").toLowerCase();
                                                    return vendorName.includes(searchTerm);
                                                }).length === 0 && (
                                                        <div className="p-3 text-sm text-gray-500 text-center">
                                                            No vendors found
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-start gap-3 p-6 border-t border-gray-200">
                                <button
                                    className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    onClick={async () => {
                                        if (selectedVendor && customer) {
                                            // Link customer to vendor
                                            const vendorName = selectedVendor.name || selectedVendor.formData?.displayName || selectedVendor.formData?.companyName || selectedVendor.formData?.vendorName || "";
                                            const customerId = String(customer.id || customer._id || "");
                                            const selectedVendorId = String(selectedVendor.id || selectedVendor._id || "");
                                            const previousLinkedVendorId = String(customer.linkedVendorId || "").trim();
                                            try {
                                                await customersAPI.update(customerId, {
                                                    ...customer,
                                                    linkedVendorId: selectedVendorId,
                                                    linkedVendorName: vendorName
                                                });

                                                await vendorsAPI.update(selectedVendorId, {
                                                    linkedCustomerId: customerId,
                                                    linkedCustomerName: customer.name || customer.displayName || ""
                                                });

                                                if (previousLinkedVendorId && previousLinkedVendorId !== selectedVendorId) {
                                                    try {
                                                        await vendorsAPI.update(previousLinkedVendorId, {
                                                            linkedCustomerId: null,
                                                            linkedCustomerName: null
                                                        });
                                                    } catch (unlinkError) {
                                                    }
                                                }
                                            } catch (error: any) {
                                                alert('Failed to update customer: ' + (error.message || 'Unknown error'));
                                                return;
                                            }

                                            // Refresh customer data
                                            await refreshData();

                                            toast.success(`Customer "${customer.name || customer.displayName}" has been linked to vendor "${vendorName}"`);
                                        }
                                        setIsLinkToVendorModalOpen(false);
                                        setSelectedVendor(null);
                                        setVendorSearch("");
                                    }}
                                    disabled={!selectedVendor}
                                >
                                    Link
                                </button>
                                <button
                                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        setIsLinkToVendorModalOpen(false);
                                        setSelectedVendor(null);
                                        setVendorSearch("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Contact Person Modal */}
            {
                isAddContactPersonModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Add Contact Person</h2>
                                <button
                                    className="flex items-center justify-center w-7 h-7 bg-white border-2 border-blue-600 rounded text-red-500 cursor-pointer hover:bg-red-50 transition-colors"
                                    onClick={() => {
                                        setIsAddContactPersonModalOpen(false);
                                        setNewContactPerson({
                                            salutation: "Mr",
                                            firstName: "",
                                            lastName: "",
                                            email: "",
                                            workPhone: "",
                                            mobile: "",
                                            skype: "",
                                            designation: "",
                                            department: "",
                                            enablePortalAccess: true
                                        });
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Name Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="relative">
                                            <select
                                                value={newContactPerson.salutation}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewContactPerson(prev => ({ ...prev, salutation: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
                                            >
                                                <option value="Mr">Mr</option>
                                                <option value="Mrs">Mrs</option>
                                                <option value="Ms">Ms</option>
                                                <option value="Dr">Dr</option>
                                                <option value="Prof">Prof</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            value={newContactPerson.firstName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, firstName: e.target.value }))}
                                            className="col-span-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            value={newContactPerson.lastName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, lastName: e.target.value }))}
                                            className="col-span-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Email Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={newContactPerson.email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Phone Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="tel"
                                            placeholder="Work Phone"
                                            value={newContactPerson.workPhone}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, workPhone: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Mobile"
                                            value={newContactPerson.mobile}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, mobile: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Skype Name/Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Skype Name/Number</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">S</span>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Skype Name/Number"
                                            value={newContactPerson.skype}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, skype: e.target.value }))}
                                            className="w-full pl-11 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Other Details */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Other Details</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Designation"
                                            value={newContactPerson.designation}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, designation: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Department"
                                            value={newContactPerson.department}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, department: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Enable Portal Access */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="enablePortalAccess"
                                            checked={newContactPerson.enablePortalAccess}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContactPerson(prev => ({ ...prev, enablePortalAccess: e.target.checked }))}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="enablePortalAccess" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                                                Enable portal access
                                            </label>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                This customer will be able to see all their transactions with your organization by logging in to the portal using their email address.{" "}
                                                <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">Learn More</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-start gap-3 p-6 border-t border-gray-200">
                                <button
                                    className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-red-700 transition-colors"
                                    onClick={async () => {
                                        if (customer && id) {
                                            const contactPerson = {
                                                id: Date.now(),
                                                salutation: newContactPerson.salutation,
                                                firstName: newContactPerson.firstName,
                                                lastName: newContactPerson.lastName,
                                                email: newContactPerson.email,
                                                workPhone: newContactPerson.workPhone,
                                                mobile: newContactPerson.mobile,
                                                skype: newContactPerson.skype,
                                                designation: newContactPerson.designation,
                                                department: newContactPerson.department,
                                                hasPortalAccess: newContactPerson.enablePortalAccess,
                                                enablePortal: newContactPerson.enablePortalAccess
                                            };

                                            const updatedContactPersons = [...(customer.contactPersons || []), contactPerson];

                                            const updatedCustomer = {
                                                ...customer,
                                                contactPersons: updatedContactPersons
                                            };

                                            try {
                                                await customersAPI.update(id, updatedCustomer);
                                                setCustomer(updatedCustomer);
                                            } catch (error) {
                                                alert('Failed to update customer: ' + (error.message || 'Unknown error'));
                                            }

                                            setIsAddContactPersonModalOpen(false);
                                            setNewContactPerson({
                                                salutation: "Mr",
                                                firstName: "",
                                                lastName: "",
                                                email: "",
                                                workPhone: "",
                                                mobile: "",
                                                skype: "",
                                                designation: "",
                                                department: "",
                                                enablePortalAccess: true
                                            });
                                        }
                                    }}
                                >
                                    Save
                                </button>
                                <button
                                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        setIsAddContactPersonModalOpen(false);
                                        setNewContactPerson({
                                            salutation: "Mr",
                                            firstName: "",
                                            lastName: "",
                                            email: "",
                                            workPhone: "",
                                            mobile: "",
                                            skype: "",
                                            designation: "",
                                            department: "",
                                            enablePortalAccess: true
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Address Modal */}
            {
                showAddressModal && typeof document !== 'undefined' && document.body && createPortal(
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 99999,
                        }}
                        onClick={() => setShowAddressModal(false)}
                    >
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                width: "100%",
                                maxWidth: "500px",
                                maxHeight: "90vh",
                                overflowY: "auto",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "20px 24px",
                                borderBottom: "1px solid #e5e7eb",
                            }}>
                                <h2 style={{
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    color: "#111827",
                                    margin: 0,
                                }}>
                                    {addressType === "billing" ? "Billing Address" : "Shipping Address"}
                                </h2>
                                <button
                                    onClick={() => setShowAddressModal(false)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <X size={20} style={{ color: "#6b7280" }} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: "24px" }}>
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        Attention
                                    </label>
                                    <input
                                        type="text"
                                        value={addressFormData.attention}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, attention: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                        }}
                                        placeholder=""
                                    />
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        Country/Region
                                    </label>
                                    <select
                                        value={addressFormData.country}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            backgroundColor: "#ffffff",
                                        }}
                                    >
                                        <option value="">Select or type to add</option>
                                        <option value="US">United States</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="CA">Canada</option>
                                        <option value="AU">Australia</option>
                                        <option value="KE">Kenya</option>
                                        <option value="AW">Aruba</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        Address
                                    </label>
                                    <div style={{ marginBottom: "8px" }}>
                                        <input
                                            type="text"
                                            value={addressFormData.addressLine1}
                                            onChange={(e) => setAddressFormData({ ...addressFormData, addressLine1: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                            }}
                                            placeholder="Address Line 1"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={addressFormData.addressLine2}
                                            onChange={(e) => setAddressFormData({ ...addressFormData, addressLine2: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                            }}
                                            placeholder="Address Line 2"
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={addressFormData.city}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                        }}
                                        placeholder=""
                                    />
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        State
                                    </label>
                                    <select
                                        value={addressFormData.state}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            backgroundColor: "#ffffff",
                                        }}
                                    >
                                        <option value="">Select or type to add</option>
                                        <option value="CA">California</option>
                                        <option value="NY">New York</option>
                                        <option value="TX">Texas</option>
                                        <option value="FL">Florida</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        ZIP Code
                                    </label>
                                    <input
                                        type="text"
                                        value={addressFormData.zipCode}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, zipCode: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                        }}
                                        placeholder=""
                                    />
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={addressFormData.phone}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                        }}
                                        placeholder=""
                                    />
                                </div>

                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "8px",
                                    }}>
                                        Fax Number
                                    </label>
                                    <input
                                        type="text"
                                        value={addressFormData.faxNumber}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, faxNumber: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                        }}
                                        placeholder=""
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: "12px",
                                padding: "20px 24px",
                                borderTop: "1px solid #e5e7eb",
                            }}>
                                <button
                                    onClick={() => setShowAddressModal(false)}
                                    style={{
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        borderRadius: "6px",
                                        border: "1px solid #d1d5db",
                                        backgroundColor: "#ffffff",
                                        color: "#374151",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        // Save address data
                                        if (!customer || !id) return;

                                        const updatedCustomer = { ...customer };
                                        if (addressType === "billing") {
                                            updatedCustomer.billingAddress = {
                                                attention: addressFormData.attention || '',
                                                country: addressFormData.country || '',
                                                street1: addressFormData.addressLine1 || '',
                                                street2: addressFormData.addressLine2 || '',
                                                city: addressFormData.city || '',
                                                state: addressFormData.state || '',
                                                zipCode: addressFormData.zipCode || '',
                                                phone: addressFormData.phone || '',
                                                fax: addressFormData.faxNumber || ''
                                            };
                                            // Also keep flat fields for backward compatibility
                                            updatedCustomer.billingAttention = addressFormData.attention;
                                            updatedCustomer.billingCountry = addressFormData.country;
                                            updatedCustomer.billingStreet1 = addressFormData.addressLine1;
                                            updatedCustomer.billingStreet2 = addressFormData.addressLine2;
                                            updatedCustomer.billingCity = addressFormData.city;
                                            updatedCustomer.billingState = addressFormData.state;
                                            updatedCustomer.billingZipCode = addressFormData.zipCode;
                                            updatedCustomer.billingPhone = addressFormData.phone;
                                            updatedCustomer.billingFax = addressFormData.faxNumber;
                                        } else {
                                            updatedCustomer.shippingAddress = {
                                                attention: addressFormData.attention || '',
                                                country: addressFormData.country || '',
                                                street1: addressFormData.addressLine1 || '',
                                                street2: addressFormData.addressLine2 || '',
                                                city: addressFormData.city || '',
                                                state: addressFormData.state || '',
                                                zipCode: addressFormData.zipCode || '',
                                                phone: addressFormData.phone || '',
                                                fax: addressFormData.faxNumber || ''
                                            };
                                            // Also keep flat fields for backward compatibility
                                            updatedCustomer.shippingAttention = addressFormData.attention;
                                            updatedCustomer.shippingCountry = addressFormData.country;
                                            updatedCustomer.shippingStreet1 = addressFormData.addressLine1;
                                            updatedCustomer.shippingStreet2 = addressFormData.addressLine2;
                                            updatedCustomer.shippingCity = addressFormData.city;
                                            updatedCustomer.shippingState = addressFormData.state;
                                            updatedCustomer.shippingZipCode = addressFormData.zipCode;
                                            updatedCustomer.shippingPhone = addressFormData.phone;
                                            updatedCustomer.shippingFax = addressFormData.faxNumber;
                                        }

                                        // Update customer using API
                                        try {
                                            await customersAPI.update(id, updatedCustomer);
                                            // Reload customer to get updated data from API
                                            const response = await customersAPI.getById(id);
                                            if (response && response.data) {
                                                const normalizedComments = normalizeComments(response.data.comments);
                                                const mappedCustomer = {
                                                    ...response.data,
                                                    billingStreet1: response.data.billingAddress?.street1 || response.data.billingStreet1 || '',
                                                    billingStreet2: response.data.billingAddress?.street2 || response.data.billingStreet2 || '',
                                                    billingCity: response.data.billingAddress?.city || response.data.billingCity || '',
                                                    billingState: response.data.billingAddress?.state || response.data.billingState || '',
                                                    billingZipCode: response.data.billingAddress?.zipCode || response.data.billingZipCode || '',
                                                    billingPhone: response.data.billingAddress?.phone || response.data.billingPhone || '',
                                                    billingFax: response.data.billingAddress?.fax || response.data.billingFax || '',
                                                    billingAttention: response.data.billingAddress?.attention || response.data.billingAttention || '',
                                                    billingCountry: response.data.billingAddress?.country || response.data.billingCountry || '',
                                                    shippingStreet1: response.data.shippingAddress?.street1 || response.data.shippingStreet1 || '',
                                                    shippingStreet2: response.data.shippingAddress?.street2 || response.data.shippingStreet2 || '',
                                                    shippingCity: response.data.shippingAddress?.city || response.data.shippingCity || '',
                                                    shippingState: response.data.shippingAddress?.state || response.data.shippingState || '',
                                                    shippingZipCode: response.data.shippingAddress?.zipCode || response.data.shippingZipCode || '',
                                                    shippingPhone: response.data.shippingAddress?.phone || response.data.shippingPhone || '',
                                                    shippingFax: response.data.shippingAddress?.fax || response.data.shippingFax || '',
                                                    shippingAttention: response.data.shippingAddress?.attention || response.data.shippingAttention || '',
                                                    shippingCountry: response.data.shippingAddress?.country || response.data.shippingCountry || '',
                                                    comments: normalizedComments
                                                };
                                                setCustomer(mappedCustomer);
                                                setComments(normalizedComments);
                                            }
                                            toast.success(`${addressType === "billing" ? "Billing" : "Shipping"} address saved successfully`);
                                        } catch (error) {
                                            toast.error('Failed to update address: ' + (error.message || 'Unknown error'));
                                        }

                                        setShowAddressModal(false);
                                    }}
                                    style={{
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: "#2563eb",
                                        color: "#ffffff",
                                        cursor: "pointer",
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Outlook Integration Modal */}
            {
                isOutlookIntegrationModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Outlook Integration</h2>
                                <button
                                    className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white hover:bg-blue-700 cursor-pointer"
                                    onClick={() => setIsOutlookIntegrationModalOpen(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Outlook Logo */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        {/* Outlook Logo - Blue envelope with O and grid pattern */}
                                        <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700"></div>
                                            {/* Grid pattern background - representing other Office apps */}
                                            <div className="absolute inset-0 opacity-30">
                                                <div className="grid grid-cols-3 gap-0.5 p-1.5">
                                                    {[...Array(9)].map((_, i) => (
                                                        <div key={i} className="bg-white/40 rounded-sm h-2"></div>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* White O letter */}
                                            <div className="relative z-10 text-white text-4xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>O</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Heading */}
                                <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
                                    Connect your Outlook account
                                </h3>

                                {/* Benefits List */}
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700">
                                            Associate emails to transactions for reference.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700">
                                            Include mail attachments into transactions.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700">
                                            Add email conversations to a transaction's activity history.
                                        </span>
                                    </li>
                                </ul>

                                {/* Learn More Link */}
                                <div className="mb-6">
                                    <a
                                        href="#"
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        Learn more about Outlook integration
                                    </a>
                                </div>

                                {/* Agreement Statement */}
                                <div className="mb-6 text-sm text-gray-600">
                                    I agree to the provider's{" "}
                                    <a
                                        href="#"
                                        className="text-blue-600 hover:text-blue-700 hover:underline"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        terms of use
                                    </a>{" "}
                                    and{" "}
                                    <a
                                        href="#"
                                        className="text-blue-600 hover:text-blue-700 hover:underline"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        privacy policy
                                    </a>{" "}
                                    and understand that the rights to use this product do not come from Zoho.
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            // Handle Outlook integration enable
                                            setIsOutlookIntegrationModalOpen(false);
                                            // Add your integration logic here
                                            alert("Outlook integration enabled!");
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 cursor-pointer transition-colors"
                                    >
                                        Enable Integration
                                    </button>
                                    <button
                                        onClick={() => setIsOutlookIntegrationModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Zoho Mail Integration Modal */}
            {
                isZohoMailIntegrationModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Zoho Mail Integration</h2>
                                <button
                                    className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white hover:bg-blue-700 cursor-pointer"
                                    onClick={() => setIsZohoMailIntegrationModalOpen(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Zoho Mail Logo/Icon */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        {/* Email Envelope Icon - Blue outline with golden-yellow inner flap */}
                                        <div className="w-20 h-20 relative">
                                            {/* Envelope base - blue outline */}
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                {/* Envelope outline */}
                                                <path
                                                    d="M10 30 L50 55 L90 30 L90 80 L10 80 Z"
                                                    fill="none"
                                                    stroke="#2563eb"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                {/* Inner flap - golden yellow */}
                                                <path
                                                    d="M10 30 L50 55 L90 30"
                                                    fill="#fbbf24"
                                                    stroke="#fbbf24"
                                                    strokeWidth="2"
                                                />
                                                {/* Envelope opening line */}
                                                <line
                                                    x1="10"
                                                    y1="30"
                                                    x2="90"
                                                    y2="30"
                                                    stroke="#2563eb"
                                                    strokeWidth="3"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Heading */}
                                <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
                                    Connect your Zoho Mail account
                                </h3>

                                {/* Benefits List */}
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700">
                                            Associate emails to transactions for reference.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700">
                                            Include mail attachments into transactions.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700">
                                            Add email conversations to a transaction's activity history.
                                        </span>
                                    </li>
                                </ul>

                                {/* Learn More Link */}
                                <div className="mb-6">
                                    <a
                                        href="#"
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        Learn more about Zoho Mail integration
                                    </a>
                                </div>

                                {/* Agreement Statement */}
                                <div className="mb-6 text-sm text-gray-600">
                                    I agree to the provider's{" "}
                                    <a
                                        href="#"
                                        className="text-blue-600 hover:text-blue-700 hover:underline"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        terms of use
                                    </a>{" "}
                                    and{" "}
                                    <a
                                        href="#"
                                        className="text-blue-600 hover:text-blue-700 hover:underline"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        privacy policy
                                    </a>{" "}
                                    and understand that the rights to use this product do not come from Zoho.
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            // Handle Zoho Mail integration enable
                                            setIsZohoMailIntegrationModalOpen(false);
                                            // Add your integration logic here
                                            alert("Zoho Mail integration enabled!");
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 cursor-pointer transition-colors"
                                    >
                                        Enable Integration
                                    </button>
                                    <button
                                        onClick={() => setIsZohoMailIntegrationModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Customer Confirmation Modal */}
            {
                isDeleteModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsDeleteModalOpen(false);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Customer</h2>
                                <p className="text-gray-700 mb-6">
                                    Are you sure you want to delete this customer? This action cannot be undone.
                                </p>
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await customersAPI.delete(id);
                                                setIsDeleteModalOpen(false);
                                                navigate("/sales/customers");
                                                toast.success('Customer deleted successfully');
                                            } catch (error) {
                                                toast.error('Failed to delete customer: ' + (error.message || 'Unknown error'));
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-red-600 text-white rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Invite Customer Modal */}
            {
                isInviteModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]"
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                            if (e.target === e.currentTarget) {
                                setIsInviteModalOpen(false);
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Invite Customer</h2>
                                    <button
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Invite Method Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Invite Method</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setInviteMethod('email')}
                                            className={`px-4 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${inviteMethod === 'email'
                                                ? 'text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            style={inviteMethod === 'email' ? { backgroundColor: '#156372' } : {}}
                                        >
                                            <Mail size={16} className="inline mr-2" />
                                            Email
                                        </button>
                                        <button
                                            onClick={() => setInviteMethod('social')}
                                            className={`px-4 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${inviteMethod === 'social'
                                                ? 'text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            style={inviteMethod === 'social' ? { backgroundColor: '#156372' } : {}}
                                        >
                                            <UserPlus size={16} className="inline mr-2" />
                                            Social
                                        </button>
                                    </div>
                                </div>

                                {/* Email Invite Form */}
                                {inviteMethod === 'email' && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={inviteEmail || customer?.email || customer?.contactPersons?.[0]?.email || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 rounded-md"
                                            style={{ '--tw-ring-color': '#156372' } as React.CSSProperties}
                                            onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target as HTMLElement).style.borderColor = '#156372'}
                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target as HTMLElement).style.borderColor = '#d1d5db'}
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            An invitation email will be sent to this address
                                        </p>
                                    </div>
                                )}

                                {/* Social Media Invite Options */}
                                {inviteMethod === 'social' && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Share via Social Media & Messaging
                                        </label>
                                        <div className="space-y-2">
                                            <button
                                                onClick={async () => {
                                                    const customerName = customer?.name || customer?.displayName || 'Customer';
                                                    const customerEmail = inviteEmail || customer?.email || customer?.contactPersons?.[0]?.email || '';
                                                    const inviteMessage = `Hello ${customerName},\n\nYou have been invited to join our customer portal. Please click the link below to access your account:\n\n${window.location.href}\n\nThank you!`;
                                                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
                                                    window.open(whatsappUrl, '_blank');
                                                    toast.success('Opening WhatsApp...');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-white rounded-md text-sm font-medium cursor-pointer transition-colors"
                                                style={{ backgroundColor: '#25D366' }}
                                                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.backgroundColor = '#20BA5A'}
                                                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.backgroundColor = '#25D366'}
                                            >
                                                <span className="text-lg">💚</span>
                                                Send via WhatsApp
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const customerName = customer?.name || customer?.displayName || 'Customer';
                                                    const shareText = `Invite ${customerName} to join our customer portal`;
                                                    const shareUrl = window.location.href;
                                                    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
                                                    window.open(facebookUrl, '_blank', 'width=600,height=400');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                                            >
                                                <span className="text-lg">📘</span>
                                                Share on Facebook
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const customerName = customer?.name || customer?.displayName || 'Customer';
                                                    const shareText = `Invite ${customerName} to join our customer portal`;
                                                    const shareUrl = window.location.href;
                                                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                                    window.open(twitterUrl, '_blank', 'width=600,height=400');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 bg-sky-500 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-sky-600 transition-colors"
                                            >
                                                <span className="text-lg">🐦</span>
                                                Share on Twitter
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const customerName = customer?.name || customer?.displayName || 'Customer';
                                                    const shareText = `Invite ${customerName} to join our customer portal`;
                                                    const shareUrl = window.location.href;
                                                    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                                                    window.open(linkedinUrl, '_blank', 'width=600,height=400');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-700 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-blue-800 transition-colors"
                                            >
                                                <span className="text-lg">💼</span>
                                                Share on LinkedIn
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const customerName = customer?.name || customer?.displayName || 'Customer';
                                                    const shareText = `Invite ${customerName} to join our customer portal: ${window.location.href}`;
                                                    if (navigator.share) {
                                                        try {
                                                            await navigator.share({
                                                                title: 'Customer Portal Invitation',
                                                                text: shareText,
                                                            });
                                                        } catch (err) {
                                                        }
                                                    } else {
                                                        // Fallback: copy to clipboard
                                                        navigator.clipboard.writeText(shareText);
                                                        toast.success('Invitation link copied to clipboard!');
                                                    }
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                                            >
                                                <span className="text-lg">📋</span>
                                                Copy Invitation Link
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setIsInviteModalOpen(false);
                                            setInviteEmail('');
                                            setInviteMethod('email');
                                        }}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    {inviteMethod === 'email' && (
                                        <button
                                            onClick={async (e) => {
                                                const emailToSend = inviteEmail || customer?.email || customer?.contactPersons?.[0]?.email;
                                                if (!emailToSend || !emailToSend.trim()) {
                                                    toast.error('Please enter an email address');
                                                    return;
                                                }

                                                // Validate email format
                                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                if (!emailRegex.test(emailToSend.trim())) {
                                                    toast.error('Please enter a valid email address');
                                                    return;
                                                }

                                                const button = e.currentTarget;
                                                const originalText = button.textContent;

                                                try {
                                                    // Show loading state
                                                    button.disabled = true;
                                                    button.textContent = 'Sending...';
                                                    button.style.opacity = '0.7';

                                                    const response = await customersAPI.sendInvitation(id, {
                                                        email: emailToSend.trim(),
                                                        method: 'email'
                                                    });

                                                    if (response && response.success) {
                                                        toast.success(`✅ Invitation email sent successfully to ${emailToSend.trim()}`);
                                                        setIsInviteModalOpen(false);
                                                        setInviteEmail('');
                                                        setShowInviteCard(true);
                                                    } else {
                                                        throw new Error(response?.message || 'Failed to send invitation');
                                                    }
                                                } catch (error) {
                                                    const errorMessage = error.data?.message || error.data?.error || error.message || 'Unknown error';

                                                    toast.error(`❌ Failed to send invitation: ${errorMessage}`, {
                                                        autoClose: 5000
                                                    });
                                                    // Reset button
                                                    button.disabled = false;
                                                    button.textContent = originalText;
                                                    button.style.opacity = '1';
                                                }
                                            }}
                                            className="px-6 py-2.5 text-white rounded-md text-sm font-medium cursor-pointer transition-all"
                                            style={{ backgroundColor: '#156372' }}
                                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.backgroundColor = '#0f4d5a'}
                                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLElement).style.backgroundColor = '#156372'}
                                        >
                                            Send Invitation
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
        // </div >
    );
}



