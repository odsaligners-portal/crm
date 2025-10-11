"use client";
import Button from "@/components/ui/button/Button";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import PrivacyPolicyModal from "@/components/admin/privacy-policies/PrivacyPolicyModal";

const PrivacyPoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  const [hasDistributerUpdateAccess, setHasDistributerUpdateAccess] =
    useState(false);

  const fetchPrivacyPolicies = async () => {
    dispatch(setLoading(true));
    try {
      const result = await fetchWithError("/api/privacy-policies", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPolicies(result.data || []);
    } catch (err) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedPolicy(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (policy) => {
    setSelectedPolicy(policy);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPolicy(null);
    setIsModalOpen(false);
  };

  const handlePolicySubmitted = () => {
    fetchPrivacyPolicies();
  };

  const handleDeletePolicy = async (policyId) => {
    if (!policyId) return;

    dispatch(setLoading(true));
    try {
      await fetchWithError(`/api/privacy-policies?id=${policyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Privacy policy deleted successfully.");
      fetchPrivacyPolicies();
    } catch (err) {
      // fetchWithError handles toast
    } finally {
      setIsConfirmModalOpen(false);
      setPolicyToDelete(null);
      dispatch(setLoading(false));
    }
  };

  const openConfirmationModal = (policyId) => {
    setPolicyToDelete(policyId);
    setIsConfirmModalOpen(true);
  };

  useEffect(() => {
    if (token) {
      fetchPrivacyPolicies();
      // Fetch access rights
      const fetchAccess = async () => {
        dispatch(setLoading(true));
        try {
          const data = await fetchWithError("/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(data);
          setHasDistributerUpdateAccess(!!data.user?.distributerAccess);
        } catch (err) {
          // fetchWithError handles toast
          setHasDistributerUpdateAccess(false);
        } finally {
          dispatch(setLoading(false));
        }
      };
      fetchAccess();
    }
  }, [token, dispatch]);

  return (
    <>
      <PrivacyPolicyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        policy={selectedPolicy}
        mode={modalMode}
        onPolicySubmitted={handlePolicySubmitted}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => handleDeletePolicy(policyToDelete)}
        title="Delete Terms and Conditions"
        message="Are you sure you want to delete these terms and conditions? This action cannot be undone."
        confirmButtonText="Delete"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 animate-pulse text-blue-500 drop-shadow-lg" />
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl dark:text-white/90">
              Terms and Conditions
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Manage distributor-specific terms and conditions
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total items: {policies.length}
            </div>

            {hasDistributerUpdateAccess && (
              <Button onClick={handleOpenCreateModal}>
                <PlusIcon className="mr-2 h-5 w-5" />
                Add Terms & Conditions
              </Button>
            )}
          </div>

          {policies.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {policies.map((policy, index) => (
                <div
                  key={policy._id}
                  className={`transform overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 shadow-lg backdrop-blur-lg transition-transform duration-300 ease-in-out hover:-translate-y-2 dark:border-gray-800/80 dark:bg-gray-900/70 ${!policy.active ? "opacity-50" : ""}`}
                  style={{ animation: `fadeInUp 0.5s ${index * 0.1}s both` }}
                >
                  <div className="border-b-2 border-dashed border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:border-gray-700/60 dark:from-gray-800/80 dark:to-gray-900/50">
                    <div className="flex items-start justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="shrink-0 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/50">
                          <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white/90">
                            {policy.title}
                          </h2>
                          <div className="mt-2 flex flex-col gap-1">
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                              {policy.distributerId?.name ||
                                "Unknown Distributor"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Version: {policy.version}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        {hasDistributerUpdateAccess && (
                          <>
                            <Button
                              onClick={() => handleOpenEditModal(policy)}
                              variant="ghost"
                              size="sm"
                              className="p-2"
                            >
                              <PencilIcon className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                            </Button>
                            <Button
                              onClick={() => openConfirmationModal(policy._id)}
                              variant="ghost"
                              size="sm"
                              className="p-2"
                            >
                              <TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {!policy.active && (
                      <div className="mt-3 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-500 uppercase subpixel-antialiased dark:bg-red-900/50 dark:text-red-300">
                        Inactive
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div
                        className="prose prose-sm dark:prose-invert line-clamp-4 max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: policy.content.substring(0, 200) + "...",
                        }}
                      />
                    </div>

                    {policy.lastUpdatedBy && (
                      <div className="mt-4 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        <div>
                          Last updated by:{" "}
                          <span className="font-medium">
                            {policy.lastUpdatedBy.name}
                          </span>
                        </div>
                        <div>
                          {new Date(policy.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white/50 px-6 py-16 text-center shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-2xl font-semibold text-gray-700 subpixel-antialiased dark:text-gray-200">
                No Terms and Conditions Found
              </h3>
              <p className="mt-2 text-gray-500">
                Create your first terms and conditions to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PrivacyPoliciesPage;
