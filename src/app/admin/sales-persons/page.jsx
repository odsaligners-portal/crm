"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import { MdPersonAdd, MdGroup } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { toast } from "react-toastify";

export default function SalesPersonsPage() {
  const { user, token } = useSelector((state) => state.auth) || {};
  const [salesPersons, setSalesPersons] = useState([]);
  const [error, setError] = useState(null);
  const [superAdminId, setSuperAdminId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(user?.id || null);
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({ name: "", mobile: "", email: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salesPersonToDelete, setSalesPersonToDelete] = useState(null);

  // Accounts Team State
  const [accountsTeam, setAccountsTeam] = useState([]);
  const [accountsForm, setAccountsForm] = useState({ name: "", mobile: "", email: "" });
  const [accountsFormError, setAccountsFormError] = useState("");
  const [accountsIsSubmitting, setAccountsIsSubmitting] = useState(false);
  const { isOpen: isAccountsOpen, openModal: openAccountsModal, closeModal: closeAccountsModal } = useModal();
  const [showDeleteAccountsModal, setShowDeleteAccountsModal] = useState(false);
  const [accountsToDelete, setAccountsToDelete] = useState(null);

  useEffect(() => {
    setSuperAdminId(process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || "");
    setCurrentUserId(user?.id || null);
  }, [user]);

  useEffect(() => {
    async function fetchSalesPersons() {
      try {
        const res = await fetch("/api/admin/sales-persons", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch sales persons");
        const data = await res.json();
        setSalesPersons(data.salesPersons || []);
      } catch (err) {
        setError("Failed to fetch sales persons");
      }
    }
    if (token && currentUserId && superAdminId && currentUserId === superAdminId) {
      fetchSalesPersons();
    }
  }, [token, currentUserId, superAdminId]);

  useEffect(() => {
    async function fetchAccountsTeam() {
      try {
        const res = await fetch("/api/admin/accounts-team", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch accounts team");
        const data = await res.json();
        setAccountsTeam(data.accountsTeam || []);
      } catch (err) {
        setError("Failed to fetch accounts team");
      }
    }
    if (token && currentUserId && superAdminId && currentUserId === superAdminId) {
      fetchAccountsTeam();
    }
  }, [token, currentUserId, superAdminId]);

  const isSuperAdmin = currentUserId && superAdminId && currentUserId === superAdminId;

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/sales-persons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create sales person");
      setSalesPersons((prev) => [...prev, data.salesPerson]);
      setForm({ name: "", mobile: "", email: "" });
      closeModal();
      toast.success("Sales person created successfully!");
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message || "Failed to create sales person");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!salesPersonToDelete) return;
    try {
      const res = await fetch("/api/admin/sales-persons", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: salesPersonToDelete._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete sales person");
      setSalesPersons((prev) => prev.filter((sp) => sp._id !== salesPersonToDelete._id));
      setShowDeleteModal(false);
      setSalesPersonToDelete(null);
      toast.success("Sales person deleted successfully!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to delete sales person");
    }
  };

  const handleAccountsInputChange = (e) => {
    setAccountsForm({ ...accountsForm, [e.target.name]: e.target.value });
    setAccountsFormError("");
  };

  const handleAccountsCreate = async (e) => {
    e.preventDefault();
    setAccountsIsSubmitting(true);
    setAccountsFormError("");
    try {
      const res = await fetch("/api/admin/accounts-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(accountsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create accounts team member");
      setAccountsTeam((prev) => [...prev, data.accountsMember]);
      setAccountsForm({ name: "", mobile: "", email: "" });
      closeAccountsModal();
      toast.success("Accounts team member created successfully!");
    } catch (err) {
      setAccountsFormError(err.message);
      toast.error(err.message || "Failed to create accounts team member");
    } finally {
      setAccountsIsSubmitting(false);
    }
  };

  const handleAccountsDelete = async () => {
    if (!accountsToDelete) return;
    try {
      const res = await fetch("/api/admin/accounts-team", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: accountsToDelete._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete accounts team member");
      setAccountsTeam((prev) => prev.filter((a) => a._id !== accountsToDelete._id));
      setShowDeleteAccountsModal(false);
      setAccountsToDelete(null);
      toast.success("Accounts team member deleted successfully!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to delete accounts team member");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-12">
        {/* Accounts Team Table */}
        <div className="mb-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg flex items-center gap-2">
                <MdGroup className="inline-block text-blue-500" size={32} /> Accounts Team
              </h1>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
                Manage and view all accounts team members in the system
              </p>
            </div>
            <Button startIcon={<MdPersonAdd />} onClick={openAccountsModal} size="md">
              Create Accounts Team Member
            </Button>
          </div>
          <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />
          {accountsTeam.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mt-2">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Mobile</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {accountsTeam.map((a, idx) => (
                        <TableRow
                          key={a._id || idx}
                          className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <TableCell className="font-semibold text-gray-700 dark:text-gray-300 text-center py-2 px-3">{a.name}</TableCell>
                          <TableCell className="font-medium text-center py-2 px-3">{a.mobile}</TableCell>
                          <TableCell className="font-medium text-center py-2 px-3">{a.email}</TableCell>
                          <TableCell className="text-center py-2 px-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAccountsToDelete(a);
                                setShowDeleteAccountsModal(true);
                              }}
                              startIcon={<FaTrash className="text-red-500" />}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">No accounts team members found.</div>
          )}
          <Modal isOpen={isAccountsOpen} onClose={closeAccountsModal} className="max-w-[400px] p-5">
            <form onSubmit={handleAccountsCreate}>
              <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Create Accounts Team Member</h4>
              <div className="space-y-4">
                <Input
                  label="Name"
                  name="name"
                  value={accountsForm.name}
                  onChange={handleAccountsInputChange}
                  required
                  placeholder="Enter name"
                />
                <Input
                  label="Mobile"
                  name="mobile"
                  value={accountsForm.mobile}
                  onChange={handleAccountsInputChange}
                  required
                  placeholder="Enter mobile number"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={accountsForm.email}
                  onChange={handleAccountsInputChange}
                  required
                  placeholder="Enter email address"
                />
                {accountsFormError && <div className="text-red-500 text-sm">{accountsFormError}</div>}
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <Button variant="outline" onClick={closeAccountsModal} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={accountsIsSubmitting}>
                  {accountsIsSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Modal>
          <ConfirmationModal
            isOpen={showDeleteAccountsModal}
            onClose={() => { setShowDeleteAccountsModal(false); setAccountsToDelete(null); }}
            onConfirm={handleAccountsDelete}
            title="Delete Accounts Team Member"
            message={accountsToDelete ? `Are you sure you want to delete '${accountsToDelete.name}'? This action cannot be undone.` : ''}
            confirmButtonText="Delete"
            cancelButtonText="Cancel"
          />
        </div>
        {/* Sales Persons Table (existing) */}
        <div className="mb-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg flex items-center gap-2">
                <MdGroup className="inline-block text-blue-500" size={32} /> Sales Team
              </h1>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
                Manage and view all sales persons in the system
              </p>
            </div>
            <Button startIcon={<MdPersonAdd />} onClick={openModal} size="md">
              Create Sales Person
            </Button>
          </div>
          <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />
          {salesPersons.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mt-2">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Name
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Mobile
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Email
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {salesPersons.map((sp, idx) => (
                        <TableRow
                          key={sp._id || idx}
                          className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <TableCell className="font-semibold text-gray-700 dark:text-gray-300 text-center py-2 px-3">{sp.name}</TableCell>
                          <TableCell className="font-medium text-center py-2 px-3">{sp.mobile}</TableCell>
                          <TableCell className="font-medium text-center py-2 px-3">{sp.email}</TableCell>
                          <TableCell className="text-center py-2 px-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSalesPersonToDelete(sp);
                                setShowDeleteModal(true);
                              }}
                              startIcon={<FaTrash className="text-red-500" />}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">No sales persons found.</div>
          )}
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[400px] p-5">
        <form onSubmit={handleCreate}>
          <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Create Sales Person</h4>
          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              required
              placeholder="Enter name"
            />
            <Input
              label="Mobile"
              name="mobile"
              value={form.mobile}
              onChange={handleInputChange}
              required
              placeholder="Enter mobile number"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              required
              placeholder="Enter email address"
            />
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="outline" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSalesPersonToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Sales Person"
        message={salesPersonToDelete ? `Are you sure you want to delete '${salesPersonToDelete.name}'? This action cannot be undone.` : ''}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
} 