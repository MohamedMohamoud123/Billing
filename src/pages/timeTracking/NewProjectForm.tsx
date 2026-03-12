import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { customersAPI, projectsAPI } from "../../services/api";
import { getCurrentUser } from "../../services/auth";
import toast from "react-hot-toast";
import NewCustomerForm from "./NewCustomerForm";
import { Search, Download, Plus, X, ChevronDown, Check } from "lucide-react";
import { useCurrency } from "../../hooks/useCurrency";

export default function NewProjectForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { code: rawCurrencyCode } = useCurrency();
  const baseCurrencyCode = rawCurrencyCode ? rawCurrencyCode.split(' ')[0].substring(0, 3).toUpperCase() : "KES";
  const [formData, setFormData] = useState({
    projectName: "",
    projectCode: "",
    customerName: "",
    customerId: "",
    enableCustomerApproval: true,
    billingMethod: "",
    description: "",
    costBudget: "",
    revenueBudget: "",
    hoursBudgetType: "",
    totalBudgetHours: "",
    enableTimeEntryApprovals: true,
    projectManagerApproverId: "",
    addToWatchlist: true
  });
  const [showHoursBudget, setShowHoursBudget] = useState(false);

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showBillingDropdown, setShowBillingDropdown] = useState(false);
  const [billingSearch, setBillingSearch] = useState("");

  const billingMethodOptions = [
    { value: "fixed", label: "Fixed Cost for Project" },
    { value: "project-hours", label: "Based on Project Hours" },
    { value: "task-hours", label: "Based on Task Hours" },
    { value: "staff-hours", label: "Based on Staff Hours" }
  ];
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
  const [advancedSearchType, setAdvancedSearchType] = useState("Display Name");
  const [advancedSearchValue, setAdvancedSearchValue] = useState("");
  const [advancedSearchResults, setAdvancedSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedSearchTypeDropdown, setShowAdvancedSearchTypeDropdown] = useState(false);
  const [showImportTasksModal, setShowImportTasksModal] = useState(false);
  const [selectedProjectForImport, setSelectedProjectForImport] = useState("");

  // User dropdown states - declared early to avoid hoisting issues
  const [openUserDropdown, setOpenUserDropdown] = useState(null); // Track which user row has dropdown open
  const [userSearch, setUserSearch] = useState({}); // Search term for each user dropdown

  // Load customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const response = await customersAPI.getAll();
        // Handle response format: { success: true, data: [...] } or direct array
        const data = Array.isArray(response)
          ? response
          : (response?.data || []);

        // Transform database customers to match frontend format
        const transformedCustomers = data.map(customer => ({
          id: customer._id || customer.id,
          name: customer.name || customer.displayName || '',
          displayName: customer.name || customer.displayName || '',
          companyName: customer.companyName || customer.company || '',
          firstName: customer.firstName || customer.name?.split(' ')[0] || '',
          lastName: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
          email: customer.email || '',
          phone: customer.phone || customer.workPhone || customer.mobile || '',
          workPhone: customer.workPhone || customer.phone || '',
          mobile: customer.mobile || customer.phone || '',
          ...customer // Keep all other fields
        }));

        setCustomers(transformedCustomers);
      } catch (error) {
        console.error("Error loading customers:", error);
        toast.error("Failed to load customers: " + (error.message || "Unknown error"));
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();

    // Listen for customer updates (when new customer is created)
    const handleCustomerUpdate = () => {
      fetchCustomers();
    };
    window.addEventListener('customerUpdated', handleCustomerUpdate);

    return () => {
      window.removeEventListener('customerUpdated', handleCustomerUpdate);
    };
  }, []);

  // Pre-populate form data from location state (when coming from quote)
  useEffect(() => {
    if (location.state) {
      const { customerName } = location.state;
      if (customerName) {
        setFormData(prev => ({
          ...prev,
          customerName: customerName
        }));
      }
    }
  }, [location.state]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAdvancedSearchTypeDropdown && !event.target.closest('[data-dropdown]')) {
        setShowAdvancedSearchTypeDropdown(false);
      }
      if (showBillingDropdown && !event.target.closest('[data-billing-dropdown]')) {
        setShowBillingDropdown(false);
      }
      if (showCustomerDropdown && !event.target.closest('[data-customer-dropdown]')) {
        setShowCustomerDropdown(false);
      }
      if (openUserDropdown && !event.target.closest(`[data-user-dropdown="${openUserDropdown}"]`)) {
        setOpenUserDropdown(null);
      }
    };

    if (showAdvancedSearchTypeDropdown || showBillingDropdown || showCustomerDropdown || openUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdvancedSearchTypeDropdown, showBillingDropdown, showCustomerDropdown, openUserDropdown]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // User dropdown states (openUserDropdown and userSearch already declared above, just adding additional state)
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load available users from system
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        // Try to get users from auth/me or create a simple endpoint
        // For now, we'll use a combination of current user and a mock list
        const currentUser = getCurrentUser();
        const usersList = [];

        if (currentUser) {
          usersList.push({
            id: currentUser.id,
            name: currentUser.name || "",
            email: currentUser.email || "",
          });
        }

        // Add some default users (you can replace this with an API call)
        usersList.push(
          { id: 2, name: "JIRDE HUSSEIN KHALIF", email: "jirdehusseinkhalif@gmail.com" },
          { id: 3, name: "tabanaaaa", email: "tabanaaaa@gmail.com" },
          { id: 4, name: "user2", email: "user2@example.com" },
          { id: 5, name: "user3", email: "user3@example.com" }
        );

        setAvailableUsers(usersList);
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Initialize users with logged-in user as default
  const getInitialUsers = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      return [{
        id: 1,
        name: currentUser.name || "",
        email: currentUser.email || "",
        userId: currentUser.id,
        costPerHour: "0",
        isEditable: false
      }];
    }
    return [];
  };

  const [users, setUsers] = useState(getInitialUsers);

  const [tasks, setTasks] = useState([
    { id: 1, taskName: "Task Name", description: "Description", billable: true }
  ]);

  // Filter users based on search
  const getFilteredUsers = (userId) => {
    const searchTerm = (userSearch[userId] || "").toLowerCase();
    return availableUsers.filter(u =>
      u.name.toLowerCase().includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm)
    );
  };

  const addUser = () => {
    const newUserId = users.length + 1;
    setUsers([...users, { id: newUserId, name: "", email: "", costPerHour: "0", isEditable: true }]);
  };

  const removeUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const updateUser = (id, field, value) => {
    setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const addTask = () => {
    setTasks([...tasks, { id: tasks.length + 1, taskName: "", description: "", billable: false, budgetHours: "" }]);
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const getUserIdentifier = (user) => {
    const candidate = user?.userId || user?.id || "";
    return String(candidate || "").trim();
  };

  const approverOptions = users
    .map((user) => ({
      id: getUserIdentifier(user),
      name: String(user?.name || "").trim(),
      email: String(user?.email || "").trim(),
    }))
    .filter((user) => user.id && user.name);

  // Keep approver selection in sync with the selected users list.
  useEffect(() => {
    setFormData((prev) => {
      const approvalsEnabled = Boolean(prev.enableTimeEntryApprovals);
      if (!approvalsEnabled) {
        if (!prev.projectManagerApproverId) return prev;
        return { ...prev, projectManagerApproverId: "" };
      }

      const currentApproverId = String(prev.projectManagerApproverId || "").trim();
      const stillValid = approverOptions.some((option) => option.id === currentApproverId);
      if (stillValid) return prev;

      const firstApproverId = approverOptions[0]?.id || "";
      if (firstApproverId === currentApproverId) return prev;

      return { ...prev, projectManagerApproverId: firstApproverId };
    });
  }, [users]);

  // Helper functions for advanced search
  const handleAdvancedSearch = () => {
    let results = [];

    if (advancedSearchValue.trim() === "") {
      results = customers;
    } else {
      const searchLower = advancedSearchValue.toLowerCase();
      results = customers.filter(customer => {
        const name = (customer.name || customer.displayName || "").toLowerCase();
        const company = (customer.companyName || customer.company || "").toLowerCase();
        const firstName = (customer.firstName || customer.name?.split(' ')[0] || "").toLowerCase();
        const lastName = (customer.lastName || customer.name?.split(' ').slice(1).join(' ') || "").toLowerCase();
        const email = (customer.email || "").toLowerCase();
        const phone = (customer.phone || customer.workPhone || customer.mobile || "").toLowerCase();

        switch (advancedSearchType) {
          case "Display Name": return name.includes(searchLower);
          case "Company Name": return company.includes(searchLower);
          case "First Name": return firstName.includes(searchLower);
          case "Last Name": return lastName.includes(searchLower);
          case "Email": return email.includes(searchLower);
          case "Phone": return phone.includes(searchLower);
          default: return name.includes(searchLower);
        }
      });
    }

    setAdvancedSearchResults(results);
    setCurrentPage(1);
  };

  const handleSelectCustomer = (customer) => {
    setFormData({
      ...formData,
      customerName: customer.name || customer.displayName,
      customerId: customer.id || customer._id
    });
    setCustomerSearch("");
    setShowAdvancedSearchModal(false);
    setAdvancedSearchValue("");
    setAdvancedSearchResults([]);
  };

  // Pagination helpers
  const itemsPerPage = 10;
  const totalPages = Math.ceil(advancedSearchResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = advancedSearchResults.slice(startIndex, startIndex + itemsPerPage);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.projectName || !formData.customerName || !formData.billingMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.customerId) {
      toast.error("Please select a valid customer");
      return;
    }

    if (formData.enableTimeEntryApprovals && !formData.projectManagerApproverId) {
      toast.error("Please select a Project Manager/Approver");
      return;
    }

    try {
      const selectedApprover = users.find(
        (user) => getUserIdentifier(user) === String(formData.projectManagerApproverId || "").trim()
      );

      const newProject = {
        name: formData.projectName,
        projectNumber: formData.projectCode || undefined,
        description: formData.description || '',
        billingRate: formData.costBudget ? parseFloat(formData.costBudget) : 0,
        budget: formData.revenueBudget ? parseFloat(formData.revenueBudget) : 0,
        status: 'planning',
        billable: true,
        startDate: new Date(),
        customerApprovalEnabled: Boolean(formData.enableCustomerApproval),
        customerApprovalRequired: Boolean(formData.enableCustomerApproval),
        timeEntryApprovalEnabled: Boolean(formData.enableTimeEntryApprovals),
        approvalRequired: Boolean(formData.enableTimeEntryApprovals),
        customer: formData.customerId,
      };

      // Map assigned users
      const assignedUserIds = users
        .filter(u => u.userId && typeof u.userId === 'string' && u.userId.match(/^[0-9a-fA-F]{24}$/))
        .map(u => u.userId);

      if (assignedUserIds.length > 0) {
        newProject.assignedTo = assignedUserIds;
      }

      const userCostRates = users
        .filter(u => u.userId && typeof u.userId === 'string' && u.userId.match(/^[0-9a-fA-F]{24}$/))
        .map(u => ({
          user: u.userId,
          costPerHour: Number(u.costPerHour || 0),
        }));

      if (userCostRates.length > 0) {
        newProject.userCostRates = userCostRates;
      }

      if (formData.enableTimeEntryApprovals && formData.projectManagerApproverId) {
        newProject.projectManagerApproverId = String(formData.projectManagerApproverId);
        newProject.projectManagerApprover = {
          user: String(formData.projectManagerApproverId),
          name: selectedApprover?.name || "",
          email: selectedApprover?.email || "",
        };
      }

      if (tasks.length > 0) {
        newProject.tasks = tasks.map(task => ({
          taskName: task.taskName || '',
          description: task.description || '',
          billable: task.billable !== undefined ? task.billable : true,
          budgetHours: task.budgetHours || '',
        }));
      }

      if (formData.hoursBudgetType) {
        newProject.hoursBudgetType = formData.hoursBudgetType;
        if (formData.hoursBudgetType === 'total-project-hours' && formData.totalBudgetHours) {
          newProject.totalBudgetHours = formData.totalBudgetHours;
        }
        if (formData.hoursBudgetType === 'hours-per-staff' && users.length > 0) {
          newProject.userBudgetHours = users
            .filter(u => u.userId && typeof u.userId === 'string' && u.userId.match(/^[0-9a-fA-F]{24}$/))
            .map(u => ({
              user: u.userId,
              budgetHours: u.budgetHours || '',
            }));
        }
      }

      // Cleanup
      Object.keys(newProject).forEach(key => {
        if (newProject[key] === undefined) delete newProject[key];
      });

      const response = await projectsAPI.create(newProject);
      toast.success("Project created successfully!");

      const isEmbeddedQuickAction = new URLSearchParams(location.search).get("embed") === "1";
      if (isEmbeddedQuickAction && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "quick-action-created", entity: "project", data: response?.data || null }, window.location.origin);
      }

      window.dispatchEvent(new Event('projectUpdated'));
      navigate("/time-tracking/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project");
    }
  };


  return (
    <div className="w-full h-full bg-[#f8fafc] overflow-y-auto relative z-[1]">
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 m-0">
            New Project
          </h2>
          <button
            onClick={() => navigate("/time-tracking/projects")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6">
        {/* Project Details Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">

          <h3 className="text-base font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Project Details
          </h3>

          <div className="grid grid-cols-1 gap-y-6">
            {/* Project Name */}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-[#ef4444] w-full sm:w-[200px] mb-1 sm:mb-0">
                Project Name*
              </label>
              <div className="flex-1 max-w-[500px]">
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Project Code */}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-gray-700 w-full sm:w-[200px] mb-1 sm:mb-0">
                Project Code
              </label>
              <div className="flex-1 max-w-[500px]">
                <input
                  type="text"
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors"
                />
              </div>
            </div>


            {/* Customer Name */}
            <div className="flex flex-col sm:flex-row sm:items-start pt-1">
              <label className="text-sm font-medium text-[#ef4444] w-full sm:w-[200px] mb-1 sm:mb-0 pt-2">
                Customer Name*
              </label>
              <div className="flex-1 max-w-[500px]">
                <div className="flex gap-2 relative" data-customer-dropdown>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={formData.customerName || customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setFormData({ ...formData, customerName: e.target.value });
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Select customer"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors bg-white"
                    />
                    <div
                      onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 cursor-pointer p-1"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                    <button
                      onClick={() => {
                        setShowAdvancedSearchModal(true);
                        setShowCustomerDropdown(false);
                      }}
                      className="absolute right-0 top-0 bottom-0 bg-[#10b981] hover:bg-[#059669] text-white rounded-r-md px-3 flex items-center justify-center transition-colors"
                    >
                      <Search className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  {showCustomerDropdown && (
                    <div className="absolute top-full left-0 right-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-[#156372]"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {loadingCustomers ? (
                          <div className="p-4 text-center">
                            <div className="w-6 h-6 border-2 border-[#156372] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-gray-500 text-sm">Loading customers...</div>
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center">
                            <div className="text-gray-500 text-sm mb-3">NO RESULTS FOUND</div>
                            <button
                              onClick={() => {
                                setShowCustomerDropdown(false);
                                setShowNewCustomerForm(true);
                              }}
                              className="text-[#156372] hover:text-[#0D4A52] font-medium text-sm flex items-center justify-center gap-2 w-full"
                            >
                              <Plus className="w-4 h-4" /> New Customer
                            </button>
                          </div>
                        ) : (
                          <div>
                            {filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    customerName: customer.name || customer.displayName,
                                    customerId: customer.id || customer._id
                                  });
                                  setCustomerSearch("");
                                  setShowCustomerDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
                              >
                                {customer.name || customer.displayName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {filteredCustomers.length > 0 && (
                        <button
                          onClick={() => {
                            setShowCustomerDropdown(false);
                            setShowNewCustomerForm(true);
                          }}
                          className="p-3 border-t border-gray-100 text-[#156372] hover:bg-[#156372]/10 font-medium text-sm flex items-center justify-center gap-2 w-full transition-colors sticky bottom-0 bg-white"
                        >
                          <Plus className="w-4 h-4" /> New Customer
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.enableCustomerApproval)}
                      onChange={(e) => setFormData({ ...formData, enableCustomerApproval: e.target.checked })}
                      className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981] cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">
                      Enable Customer Approval for the time entries of this project
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Billing Method */}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-[#ef4444] w-full sm:w-[200px] mb-1 sm:mb-0">
                Billing Method*
              </label>
              <div className="flex-1 max-w-[500px] relative" data-billing-dropdown>
                <button
                  type="button"
                  onClick={() => {
                    setShowBillingDropdown(!showBillingDropdown);
                    setBillingSearch("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left bg-white outline-none flex items-center justify-between"
                >
                  <span className={`${formData.billingMethod ? 'text-gray-800' : 'text-gray-400'}`}>
                    {formData.billingMethod
                      ? billingMethodOptions.find(opt => opt.value === formData.billingMethod)?.label || "Select billing method"
                      : "Select billing method"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showBillingDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showBillingDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={billingSearch}
                          onChange={(e) => setBillingSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-[#156372]"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto">
                      {billingMethodOptions
                        .filter(option =>
                          option.label.toLowerCase().includes(billingSearch.toLowerCase())
                        )
                        .map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              setFormData({ ...formData, billingMethod: option.value });
                              setShowBillingDropdown(false);
                              setBillingSearch("");
                            }}
                            className={`px-4 py-2 cursor-pointer text-sm flex items-center justify-between hover:bg-gray-50 ${formData.billingMethod === option.value ? 'bg-[#156372]/10 text-[#156372] font-medium' : 'text-gray-700'
                              }`}
                          >
                            <span>{option.label}</span>
                            {formData.billingMethod === option.value && (
                              <Check className="w-4 h-4 text-[#156372]" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col sm:flex-row sm:items-start">
              <label className="text-sm font-medium text-gray-700 w-full sm:w-[200px] mb-1 sm:mb-0 pt-2">
                Description
              </label>
              <div className="flex-1 max-w-[500px]">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Max. 2000 characters"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Budget
          </h3>

          <div className="grid grid-cols-1 gap-y-6">
            {/* Cost Budget */}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-gray-700 w-full sm:w-[200px] mb-1 sm:mb-0 flex items-center gap-1">
                Cost Budget
                <span className="text-gray-400 cursor-help">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 6v2M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </label>
              <div className="flex-1 max-w-[500px]">
                <div className="flex items-stretch border border-gray-300 rounded-md overflow-hidden focus-within:border-[#156372] focus-within:ring-1 focus-within:ring-[#156372] transition-colors">
                  <div className="bg-gray-50 px-3 flex items-center border-r border-gray-300 text-sm text-gray-500 min-w-[60px] justify-center">
                    {baseCurrencyCode || "KES"}
                  </div>
                  <input
                    type="text"
                    value={formData.costBudget}
                    onChange={(e) => setFormData({ ...formData, costBudget: e.target.value })}
                    className="w-full px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Revenue Budget */}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-gray-700 w-full sm:w-[200px] mb-1 sm:mb-0 flex items-center gap-1">
                Revenue Budget
                <span className="text-gray-400 cursor-help">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 6v2M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </label>
              <div className="flex-1 max-w-[500px]">
                <div className="flex items-stretch border border-gray-300 rounded-md overflow-hidden focus-within:border-[#156372] focus-within:ring-1 focus-within:ring-[#156372] transition-colors">
                  <div className="bg-gray-50 px-3 flex items-center border-r border-gray-300 text-sm text-gray-500 min-w-[60px] justify-center">
                    {baseCurrencyCode || "KES"}
                  </div>
                  <input
                    type="text"
                    value={formData.revenueBudget}
                    onChange={(e) => setFormData({ ...formData, revenueBudget: e.target.value })}
                    className="w-full px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Add budget link */}
            <div className="sm:ml-[200px]">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowHoursBudget(true);
                }}
                className="text-blue-500 hover:text-blue-600 text-sm hover:underline"
              >
                Add budget for project hours.
              </a>
            </div>
          </div>
        </div>


        {/* Hours Budget Type */}
        {showHoursBudget && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="text-sm font-medium text-gray-700 min-w-[150px] sm:text-right flex items-center justify-end gap-1">
                Hours Budget Type
                <span className="text-gray-400 group relative inline-block cursor-help hover:text-gray-600">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 6v2M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </label>
              <div className="flex-1 relative">
                <select
                  value={formData.hoursBudgetType}
                  onChange={(e) => setFormData({ ...formData, hoursBudgetType: e.target.value, totalBudgetHours: "" })}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors bg-white appearance-none"
                >
                  <option value="">Select hours budget type</option>
                  <option value="total-project-hours">Total Project Hours (HH:MM)</option>
                  <option value="hours-per-task">Hours Per Task</option>
                  <option value="hours-per-staff">Hours Per Staff</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Helper text based on selection */}
            {formData.hoursBudgetType === "total-project-hours" && (
              <div className="pl-0 sm:pl-[166px] text-sm text-gray-600 mt-1">
                If you select this option, you can track your budget for the total project hours.
              </div>
            )}
            {formData.hoursBudgetType === "hours-per-task" && (
              <div className="pl-0 sm:pl-[166px] text-sm text-gray-600 mt-1">
                If you select this option, you can track your budget for the project tasks.
              </div>
            )}
            {formData.hoursBudgetType === "hours-per-staff" && (
              <div className="pl-0 sm:pl-[166px] text-sm text-gray-600 mt-1">
                If you select this option, you can track your budget for the staff hours.
              </div>
            )}

            {/* Total Budget Hours field - shown when "Total Project Hours" is selected */}
            {formData.hoursBudgetType === "total-project-hours" && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-4">
                <label className="text-sm font-medium text-red-500 min-w-[150px] sm:text-right flex items-center justify-end gap-1">
                  Total Budget Hours<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.totalBudgetHours}
                  onChange={(e) => setFormData({ ...formData, totalBudgetHours: e.target.value })}
                  placeholder="Budget Hours (HH:MM)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors"
                />
              </div>
            )}
          </>
        )}

      {/* Users Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Users</h3>

        <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[#64748b]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-16">S.NO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">USER</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">EMAIL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[240px]">
                  <div className="flex items-center gap-1">
                    COST PER HOUR
                    <span className="text-gray-400 cursor-help">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 6v2M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 relative">
                    {user.isEditable ? (
                      <div className="relative" data-user-dropdown={user.id}>
                        <div className="relative">
                          <input
                            type="text"
                            value={user.name || ""}
                            onChange={(e) => {
                              updateUser(user.id, "name", e.target.value);
                              setUserSearch({ ...userSearch, [user.id]: e.target.value });
                              setOpenUserDropdown(user.id);
                            }}
                            onFocus={() => setOpenUserDropdown(user.id)}
                            placeholder="Select user"
                            className="w-full px-2 py-1.5 pr-8 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors bg-white"
                          />
                          <div
                            onClick={() => setOpenUserDropdown(openUserDropdown === user.id ? null : user.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 z-10"
                          >
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openUserDropdown === user.id ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                        {openUserDropdown === user.id && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl max-h-[300px] overflow-hidden flex flex-col z-[99999]">
                            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={userSearch[user.id] || ""}
                                  onChange={(e) => {
                                    setUserSearch({ ...userSearch, [user.id]: e.target.value });
                                  }}
                                  placeholder="Search"
                                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-[#156372]"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto flex-1">
                              {loadingUsers ? (
                                <div className="p-4 text-center">
                                  <div className="w-4 h-4 border-2 border-[#156372] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                  <div className="text-gray-500 text-sm">Loading users...</div>
                                </div>
                              ) : getFilteredUsers(user.id).length === 0 ? (
                                <div className="p-4 text-center">
                                  <div className="text-gray-500 text-sm mb-3">NO RESULTS FOUND</div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenUserDropdown(null);
                                    }}
                                    className="text-[#156372] hover:text-[#0D4A52] font-medium text-sm flex items-center justify-center gap-2 w-full hover:underline"
                                  >
                                    <Plus className="w-4 h-4" /> Invite User
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {getFilteredUsers(user.id).map((availableUser) => (
                                    <div
                                      key={availableUser.id}
                                      onClick={() => {
                                        setUsers(users.map(u =>
                                          u.id === user.id
                                            ? {
                                              ...u,
                                              name: availableUser.name,
                                              email: availableUser.email,
                                              userId: availableUser.id,
                                              costPerHour: u.costPerHour || "0",
                                            }
                                            : u
                                        ));
                                        setOpenUserDropdown(null);
                                        setUserSearch({ ...userSearch, [user.id]: "" });
                                      }}
                                      className="px-4 py-2 hover:bg-[#156372]/10 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
                                    >
                                      {availableUser.name}
                                    </div>
                                  ))}
                                  <div className="border-t border-gray-100 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenUserDropdown(null);
                                      }}
                                      className="w-full px-4 py-2 text-[#156372] hover:bg-[#156372]/10 hover:text-[#0D4A52] font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" /> Invite User
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <input
                      type="email"
                      value={user.email || ""}
                      onChange={(e) => updateUser(user.id, "email", e.target.value)}
                      placeholder="Email"
                      readOnly={!user.isEditable}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors ${!user.isEditable
                        ? "bg-gray-100 cursor-not-allowed text-gray-500"
                        : "bg-white"
                        }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-stretch border border-gray-300 rounded overflow-hidden focus-within:border-[#156372] focus-within:ring-1 focus-within:ring-[#156372] transition-colors bg-white">
                      <div className="bg-gray-50 px-2.5 flex items-center border-r border-gray-300 text-xs text-gray-600 min-w-[52px] justify-center">
                        {baseCurrencyCode || "KES"}
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={user.costPerHour || "0"}
                        onChange={(e) => updateUser(user.id, "costPerHour", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm outline-none"
                      />
                    </div>
                  </td>
                  {formData.hoursBudgetType === "hours-per-staff" && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <input
                        type="text"
                        value={user.budgetHours || ""}
                        onChange={(e) => updateUser(user.id, "budgetHours", e.target.value)}
                        placeholder="HH:MM"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors bg-white"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addUser}
          className="text-blue-500 hover:text-blue-600 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

    <div className="mt-8 pt-8 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-gray-700 w-full sm:w-[300px] mb-2 sm:mb-0 flex items-center gap-1">
          Enable Approvals for time entries?
          <span className="text-gray-400 cursor-help">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 6v2M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={Boolean(formData.enableTimeEntryApprovals)}
              onChange={() => setFormData((prev) => ({ ...prev, enableTimeEntryApprovals: true }))}
              className="w-4 h-4 text-[#10b981] border-gray-300 focus:ring-[#10b981] cursor-pointer"
            />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={!formData.enableTimeEntryApprovals}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  enableTimeEntryApprovals: false,
                  projectManagerApproverId: "",
                }))
              }
              className="w-4 h-4 text-[#10b981] border-gray-300 focus:ring-[#10b981] cursor-pointer"
            />
            No
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-[#ef4444] w-full sm:w-[300px] mb-2 sm:mb-0">
          Project Manager/Approver*
        </label>
        <div className="relative flex-1 max-w-[420px]">
          <select
            value={formData.projectManagerApproverId}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                projectManagerApproverId: e.target.value,
              }))
            }
            disabled={!formData.enableTimeEntryApprovals}
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors bg-white appearance-none disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
          >
            <option value="">Select User</option>
            {approverOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {formData.enableTimeEntryApprovals && approverOptions.length === 0 && (
        <div className="pl-0 sm:pl-[200px] mb-6 text-xs text-red-500 font-medium italic">
          Please add at least one user before selecting a Project Manager/Approver.
        </div>
      )}

      {/* Project Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 m-0">Project Tasks</h3>
          <button
            type="button"
            onClick={() => setShowImportTasksModal(true)}
            className="text-[#10b981] hover:text-[#059669] text-sm flex items-center gap-1.5 hover:underline bg-transparent border-none cursor-pointer font-medium"
          >
            <Download className="w-4 h-4" />
            Import project tasks from existing projects
          </button>
        </div>

        <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[#64748b]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-16">S.NO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">TASK NAME</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">DESCRIPTION</th>
                {formData.hoursBudgetType === "hours-per-task" && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32">BUDGET HOURS</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32">BILLABLE</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr key={task.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <input
                      type="text"
                      value={task.taskName}
                      onChange={(e) => updateTask(task.id, "taskName", e.target.value)}
                      placeholder="Task name"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <textarea
                      value={task.description}
                      onChange={(e) => updateTask(task.id, "description", e.target.value)}
                      rows={1}
                      placeholder="Description"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors resize-y min-h-[34px]"
                    />
                  </td>
                  {formData.hoursBudgetType === "hours-per-task" && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <input
                        type="text"
                        value={task.budgetHours || ""}
                        onChange={(e) => updateTask(task.id, "budgetHours", e.target.value)}
                        placeholder="HH:MM"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-[#156372] focus:ring-1 focus:ring-[#156372] transition-colors bg-white font-mono"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between gap-4">
                      <input
                        type="checkbox"
                        checked={task.billable}
                        onChange={(e) => updateTask(task.id, "billable", e.target.checked)}
                        className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addTask}
          className="text-[#10b981] hover:text-[#059669] px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-emerald-50"
        >
          <Plus className="w-4 h-4" />
          Add Project Task
        </button>
      </div>

      {/* Watchlist Checkbox */}
      <div className="mb-8 px-2">
        <label className="flex items-center gap-3 cursor-pointer group w-fit">
          <input
            type="checkbox"
            checked={formData.addToWatchlist}
            onChange={(e) => setFormData({ ...formData, addToWatchlist: e.target.checked })}
            className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981] cursor-pointer shadow-sm"
          />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            Add to the watchlist on my dashboard
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start gap-4 p-8 bg-white rounded-lg shadow-sm border border-gray-100 mb-10">
        <button
          type="button"
          onClick={handleSave}
          className="px-12 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-md text-sm font-bold transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-offset-2"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => navigate("/time-tracking/projects")}
          className="px-12 py-2.5 border border-gray-200 text-gray-600 rounded-md text-sm font-bold hover:bg-gray-50 transition-all hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>

    </div>

    {/* New Customer Form Modal */}
    {showNewCustomerForm && (
      <NewCustomerForm
        onClose={() => setShowNewCustomerForm(false)}
        onSave={(newCustomer) => {
          // Trigger a refresh of the customer list
          window.dispatchEvent(new Event('customerUpdated'));
          setFormData({
            ...formData,
            customerName: newCustomer.name || newCustomer.displayName,
            customerId: newCustomer.id || newCustomer._id
          });
          setShowNewCustomerForm(false);
          toast.success("Customer created successfully!");
        }}
      />
    )}

    {/* Advanced Customer Search Modal */}
    {showAdvancedSearchModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-start justify-center pt-20 px-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowAdvancedSearchModal(false);
        }}
      >
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
          {/* Modal Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800 m-0">Advanced Customer Search</h2>
            <button
              onClick={() => setShowAdvancedSearchModal(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Controls */}
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white">
            <div className="relative" data-dropdown>
              <button
                onClick={() => setShowAdvancedSearchTypeDropdown(!showAdvancedSearchTypeDropdown)}
                className="w-full md:w-[200px] px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 flex items-center justify-between hover:border-[#10b981] transition-all"
              >
                <span>{advancedSearchType}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showAdvancedSearchTypeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-[2001] overflow-hidden py-1 border border-gray-200">
                  {["Display Name", "Company Name", "First Name", "Last Name", "Email", "Phone"].map((type) => (
                    <div
                      key={type}
                      onClick={() => {
                        setAdvancedSearchType(type);
                        setShowAdvancedSearchTypeDropdown(false);
                      }}
                      className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${advancedSearchType === type
                          ? 'bg-emerald-50 text-[#10b981] font-bold'
                          : 'hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={advancedSearchValue}
                onChange={(e) => setAdvancedSearchValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdvancedSearch(); }}
                placeholder={`Search by ${advancedSearchType.toLowerCase()}...`}
                className="w-full px-5 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#10b981] focus:ring-4 focus:ring-emerald-50 transition-all pr-12"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            </div>
            <button
              onClick={handleAdvancedSearch}
              className="px-8 py-3 bg-[#10b981] text-white rounded-lg text-sm font-bold hover:bg-[#059669] transition-all shadow-md active:scale-95"
            >
              Search
            </button>
          </div>

          {/* Results Table */}
          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">CUSTOMER NAME</th>
                  <th className="px-8 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">EMAIL</th>
                  <th className="px-8 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">COMPANY</th>
                  <th className="px-8 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">PHONE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400 italic">
                      {advancedSearchValue ? "No matching customers found" : "Enter a search term to begin"}
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="cursor-pointer hover:bg-emerald-50/50 transition-colors group"
                    >
                      <td className="px-8 py-4">
                        <div className="text-sm font-bold text-gray-800 group-hover:text-[#10b981] transition-colors">{customer.name || "-"}</div>
                      </td>
                      <td className="px-8 py-4 text-sm text-gray-500">{customer.email || "-"}</td>
                      <td className="px-8 py-4 text-sm text-gray-500">{customer.companyName || customer.name || "-"}</td>
                      <td className="px-8 py-4 text-sm text-gray-500 font-mono italic">{customer.phone || customer.workPhone || customer.mobile || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="text-sm text-gray-500 font-medium">
                Showing <span className="text-gray-900">{startIndex + 1}</span> to <span className="text-gray-900">{Math.min(startIndex + itemsPerPage, advancedSearchResults.length)}</span> of <span className="text-gray-900">{advancedSearchResults.length}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
                >
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <div className="flex items-center px-4 font-bold text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
                >
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Import Project Tasks Modal */}
    {showImportTasksModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setShowImportTasksModal(false); }}
      >
        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 m-0">Import Tasks</h2>
            <button
              onClick={() => { setShowImportTasksModal(false); setSelectedProjectForImport(""); }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Select Source Project</label>
            <div className="relative">
              <select
                value={selectedProjectForImport}
                onChange={(e) => setSelectedProjectForImport(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#10b981] focus:ring-4 focus:ring-emerald-50 appearance-none transition-all pr-12 font-medium text-gray-700 shadow-sm"
              >
                <option value="">Choose a project...</option>
                {(() => {
                  const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                  return existingProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName || project.name}
                    </option>
                  ));
                })()}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="mt-4 text-xs text-gray-500 italic">This will add all tasks from the selected project to your current task list.</p>
          </div>

          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <button
              onClick={() => { setShowImportTasksModal(false); setSelectedProjectForImport(""); }}
              className="px-6 py-2.5 text-gray-600 font-bold text-sm hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!selectedProjectForImport) {
                  toast.error("Please select a project to import tasks from");
                  return;
                }
                const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                const selectedProject = existingProjects.find(p => p.id === selectedProjectForImport);
                if (selectedProject && selectedProject.tasks && selectedProject.tasks.length > 0) {
                  const importedTasks = selectedProject.tasks.map((task, index) => ({
                    id: Date.now() + index,
                    taskName: task.taskName || task.name || "",
                    description: task.description || "",
                    billable: task.billable !== undefined ? task.billable : true
                  }));
                  setTasks([...tasks, ...importedTasks]);
                  setShowImportTasksModal(false);
                  setSelectedProjectForImport("");
                  toast.success(`Successfully imported ${importedTasks.length} task(s)`);
                } else {
                  toast.error("Selected project has no tasks to import");
                }
              }}
              className="px-8 py-2.5 bg-[#10b981] text-white rounded-lg text-sm font-bold hover:bg-[#059669] transition-all shadow-md active:scale-95"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
