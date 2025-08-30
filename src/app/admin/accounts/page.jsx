"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import { MdPersonAdd, MdGroup } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { toast } from "react-toastify";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function SalesPersonsPage() {
  const { user, token } = useSelector((state) => state.auth) || {};
  const [error, setError] = useState(null);
  const [hasAccountsAccess, setHasAccountsAccess] = useState(false);

  // Accounts Team State
  const [accountsTeam, setAccountsTeam] = useState([]);
  const [accountsForm, setAccountsForm] = useState({
    name: "",
    mobile: "",
    email: "",
  });
  const [accountsFormError, setAccountsFormError] = useState("");
  const [accountsIsSubmitting, setAccountsIsSubmitting] = useState(false);
  const {
    isOpen: isAccountsOpen,
    openModal: openAccountsModal,
    closeModal: closeAccountsModal,
  } = useModal();
  const [showDeleteAccountsModal, setShowDeleteAccountsModal] = useState(false);
  const [accountsToDelete, setAccountsToDelete] = useState(null);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasAccountsAccess(false);
        return;
      }
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setHasAccountsAccess(data.user?.addSalesPersonAccess);
      } catch (err) {
        setHasAccountsAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

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

    fetchAccountsTeam();
  }, [token]);

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
      if (!res.ok)
        throw new Error(
          data.message || "Failed to create accounts team member",
        );
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
      if (!res.ok)
        throw new Error(
          data.message || "Failed to delete accounts team member",
        );
      setAccountsTeam((prev) =>
        prev.filter((a) => a._id !== accountsToDelete._id),
      );
      setShowDeleteAccountsModal(false);
      setAccountsToDelete(null);
      toast.success("Accounts team member deleted successfully!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to delete accounts team member");
    }
  };

  if (!hasAccountsAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-white p-8 text-center shadow-xl dark:bg-gray-900">
          <h2 className="mb-2 text-2xl font-semibold text-red-600 subpixel-antialiased">
            Access Denied
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      {/* Accounts Team Section */}
      <div className="mb-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
              <MdGroup className="inline-block text-blue-500" size={32} />{" "}
              Accounts Team
            </h1>
            <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
              Manage and view all accounts team members in the system
            </p>
          </div>
          <Button
            startIcon={<MdPersonAdd />}
            onClick={openAccountsModal}
            size="md"
          >
            Create Accounts Team Member
          </Button>
        </div>
        <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />
        {accountsTeam.length > 0 ? (
          <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="text-theme-xs px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400"
                      >
                        S.N.
                      </TableCell>
                      <TableCell
                        isHeader
                        className="text-theme-xs px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400"
                      >
                        Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="text-theme-xs px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400"
                      >
                        Mobile
                      </TableCell>
                      <TableCell
                        isHeader
                        className="text-theme-xs px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400"
                      >
                        Email
                      </TableCell>
                      <TableCell
                        isHeader
                        className="text-theme-xs px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {accountsTeam.map((a, idx) => (
                      <TableRow
                        key={a._id || idx}
                        className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <TableCell className="px-3 py-2 text-center font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                          {a.name}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center font-medium">
                          {a.mobile}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center font-medium">
                          {a.email}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center">
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
          <div className="mt-8 text-center text-gray-500">
            No accounts team members found.
          </div>
        )}
        <Modal
          isOpen={isAccountsOpen}
          onClose={closeAccountsModal}
          className="max-w-[400px] p-5"
        >
          <form onSubmit={handleAccountsCreate}>
            <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Create Accounts Team Member
            </h4>
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
              {accountsFormError && (
                <div className="text-sm text-red-500">{accountsFormError}</div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeAccountsModal}
                type="button"
              >
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
          onClose={() => {
            setShowDeleteAccountsModal(false);
            setAccountsToDelete(null);
          }}
          onConfirm={handleAccountsDelete}
          title="Delete Accounts Team Member"
          message={
            accountsToDelete
              ? `Are you sure you want to delete '${accountsToDelete.name}'? This action cannot be undone.`
              : ""
          }
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />
      </div>
    </div>
  );
}
