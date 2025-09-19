"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  total_amount: number;
  tax_amount: number;
  subtotal_amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
  client_id: string;
  company_id: string;
  clients: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name?: string;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as HTMLElement;
        // Don't close if clicking on dropdown button or dropdown content
        if (
          !target.closest("[data-dropdown-button]") &&
          !target.closest("[data-dropdown-menu]")
        ) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdown]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // First get user's company
      const { data: companies } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user?.id)
        .limit(1);

      const company = companies && companies.length > 0 ? companies[0] : null;

      if (!company) {
        setError("No company found. Please complete your setup.");
        return;
      }

      // Get invoices with client info
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          clients!inner(first_name, last_name, email, phone, company_name)
        `
        )
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;

      setInvoices(invoicesData || []);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (
    invoiceId: string,
    invoiceNumber: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
      showSuccess("Invoice deleted successfully");
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      showError("Failed to delete invoice");
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${invoice.clients.first_name} ${invoice.clients.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (invoice.clients.company_name &&
        invoice.clients.company_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="h-4 w-4 text-gray-500" />;
      case "sent":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      sent: { color: "bg-blue-100 text-blue-800", label: "Sent" },
      paid: { color: "bg-green-100 text-green-800", label: "Paid" },
      overdue: { color: "bg-red-100 text-red-800", label: "Overdue" },
      cancelled: { color: "bg-gray-100 text-gray-800", label: "Cancelled" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {getStatusIcon(status)}
        <span className="ml-1">{config.label}</span>
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading invoices...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
              <button
                onClick={fetchInvoices}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                <p className="text-gray-600 mt-1">
                  Manage your invoices and payments
                </p>
              </div>
              <Link
                href="/invoices/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search invoices by number, title, or client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div
              className="max-w-7xl mx-auto px-6 py-6"
              style={{ position: "relative" }}
            >
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No invoices found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {invoices.length === 0
                      ? "Get started by creating your first invoice."
                      : "Try adjusting your search or filters."}
                  </p>
                  {invoices.length === 0 && (
                    <div className="mt-6">
                      <Link
                        href="/invoices/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg overflow-visible">
                  <div className="h-[100%]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInvoices.map((invoice) => (
                          <tr
                            key={invoice.id}
                            onClick={() =>
                              router.push(`/invoices/${invoice.id}`)
                            }
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {invoice.invoice_number}
                                    </div>
                                    <div className="text-sm text-gray-600 truncate max-w-48">
                                      {invoice.title}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {invoice.clients.first_name}{" "}
                                    {invoice.clients.last_name}
                                  </div>
                                  {invoice.clients.company_name && (
                                    <div className="text-sm text-gray-600">
                                      {invoice.clients.company_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(invoice.total_amount)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(invoice.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {invoice.due_date
                                  ? new Date(
                                      invoice.due_date
                                    ).toLocaleDateString()
                                  : "No due date"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(
                                invoice.created_at
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    if (openDropdown === invoice.id) {
                                      setOpenDropdown(null);
                                    } else {
                                      // Calculate position relative to button
                                      const rect =
                                        e.currentTarget.getBoundingClientRect();
                                      setDropdownPosition({
                                        top: rect.bottom + window.scrollY,
                                        right: window.innerWidth - rect.right,
                                      });
                                      setOpenDropdown(invoice.id);
                                    }
                                  }}
                                  className="flex items-center p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                                  data-dropdown-button
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {openDropdown === invoice.id && (
                                  <div
                                    className="absolute right-0 z-[9999] mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
                                    data-dropdown-menu
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      right: "0",
                                      zIndex: 9999,
                                    }}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/invoices/${invoice.id}`);
                                        setOpenDropdown(null);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Eye className="h-4 w-4 mr-3 text-gray-400" />
                                      View Invoice
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          `/invoices/${invoice.id}/edit`
                                        );
                                        setOpenDropdown(null);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Edit className="h-4 w-4 mr-3 text-gray-400" />
                                      Edit Invoice
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        handleDeleteInvoice(
                                          invoice.id,
                                          invoice.invoice_number
                                        );
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4 mr-3 text-red-500" />
                                      Delete Invoice
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
