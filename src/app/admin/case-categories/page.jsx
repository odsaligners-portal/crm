"use client";
import AddCaseCategoryModal from "@/components/admin/case-categories/AddModal";
import EditCaseCategoryModal from "@/components/admin/case-categories/EditModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Button from "@/components/ui/button/Button";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import {
  CircleStackIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon,
  TrashIcon,
  FunnelIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const CaseCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [hasCaseCategoryUpdateAccess, setHasCaseCategoryUpdateAccess] =
    useState(false);

  // Get unique countries from categories
  const getUniqueCountries = () => {
    const countries = categories
      .filter((cat) => cat.categoryType === "country-specific" && cat.country)
      .map((cat) => cat.country);
    return [...new Set(countries)].sort();
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...categories];

    if (filterType !== "all") {
      filtered = filtered.filter((cat) => cat.categoryType === filterType);
    }

    if (filterCountry !== "all") {
      filtered = filtered.filter(
        (cat) =>
          cat.categoryType === "default" || cat.country === filterCountry,
      );
    }

    setFilteredCategories(filtered);
  }, [categories, filterType, filterCountry]);

  const handleOpenEditModal = (category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedCategory(null);
    setIsEditModalOpen(false);
  };

  const fetchCaseCategories = async () => {
    dispatch(setLoading(true));
    try {
      const result = await fetchWithError("/api/case-categories", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCategories(result.data || []);
    } catch (err) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCategoryUpdated = () => {
    fetchCaseCategories();
  };

  const handleCategoryAdded = () => {
    fetchCaseCategories();
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) return;

    dispatch(setLoading(true));
    try {
      await fetchWithError(`/api/case-categories?id=${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Category deleted successfully.");
      fetchCaseCategories(); // Refresh the list
    } catch (err) {
      // fetchWithError handles toast
    } finally {
      setIsConfirmModalOpen(false);
      setCategoryToDelete(null);
      dispatch(setLoading(false));
    }
  };

  const openConfirmationModal = (categoryId) => {
    setCategoryToDelete(categoryId);
    setIsConfirmModalOpen(true);
  };

  const resetFilters = () => {
    setFilterType("all");
    setFilterCountry("all");
  };

  useEffect(() => {
    if (token) {
      fetchCaseCategories();
      // Fetch access rights
      const fetchAccess = async () => {
        dispatch(setLoading(true));
        try {
          const data = await fetchWithError("/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setHasCaseCategoryUpdateAccess(!!data.user?.caseCategoryUpdateAccess);
        } catch (err) {
          // fetchWithError handles toast
          setHasCaseCategoryUpdateAccess(false);
        } finally {
          dispatch(setLoading(false));
        }
      };
      fetchAccess();
    }
  }, [token, dispatch]);

  return (
    <>
      <EditCaseCategoryModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        category={selectedCategory}
        onCategoryUpdated={handleCategoryUpdated}
      />
      <AddCaseCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCategoryAdded={handleCategoryAdded}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => handleDeleteCategory(categoryToDelete)}
        title="Delete Case Category"
        message="Are you sure you want to delete this case category? This action cannot be undone."
        confirmButtonText="Delete"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <SparklesIcon className="mx-auto h-12 w-12 animate-pulse text-blue-500 drop-shadow-lg" />
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl dark:text-white/90">
              Case Categories & Packages
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Manage default and country-specific treatment categories with
              their pricing packages.
            </p>
          </div>

          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-3">
              {/* Filter by Type */}
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="default">Default Categories</option>
                  <option value="country-specific">Country-Specific</option>
                </select>
              </div>

              {/* Filter by Country */}
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-gray-500" />
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Countries</option>
                  {getUniqueCountries().map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              {(filterType !== "all" || filterCountry !== "all") && (
                <Button onClick={resetFilters} variant="outline" size="sm">
                  Reset Filters
                </Button>
              )}
            </div>

            {hasCaseCategoryUpdateAccess && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusIcon className="mr-2 h-5 w-5" />
                Add New Category
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCategories.length} of {categories.length}{" "}
            categories
          </div>

          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category, index) => (
                <div
                  key={category._id}
                  className={`transform overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 shadow-lg backdrop-blur-lg transition-transform duration-300 ease-in-out hover:-translate-y-2 dark:border-gray-800/80 dark:bg-gray-900/70 ${!category.active ? "opacity-50" : ""}`}
                  style={{ animation: `fadeInUp 0.5s ${index * 0.1}s both` }}
                >
                  <div className="border-b-2 border-dashed border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:border-gray-700/60 dark:from-gray-800/80 dark:to-gray-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="shrink-0 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/50">
                          <TagIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-2xl font-semibold text-gray-800 subpixel-antialiased dark:text-white/90">
                            {category.category}
                          </h2>
                          <div className="mt-1 flex items-center gap-2">
                            {category.categoryType === "default" && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  category.categoryType === "default"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                }`}
                              >
                                🌍 Default
                              </span>
                            )}
                            {category.categoryType === "country-specific" &&
                              category.country && (
                                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                  {category.country}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        {hasCaseCategoryUpdateAccess && (
                          <>
                            <Button
                              onClick={() => handleOpenEditModal(category)}
                              variant="ghost"
                              size="sm"
                              className="p-2"
                            >
                              <PencilIcon className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                            </Button>
                            <Button
                              onClick={() =>
                                openConfirmationModal(category._id)
                              }
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

                    {category.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    )}

                    {!category.active && (
                      <div className="mt-2 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-500 uppercase subpixel-antialiased dark:bg-red-900/50 dark:text-red-300">
                        Inactive
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-600 subpixel-antialiased dark:text-gray-300">
                      <CircleStackIcon className="h-5 w-5" />
                      Available Packages
                    </h3>
                    <ul className="space-y-3">
                      {category.plans.map((plan) => (
                        <li
                          key={plan._id || plan.value}
                          className="flex items-center justify-between rounded-lg bg-gray-50/80 p-3 shadow-sm dark:bg-gray-800/60"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {plan.label}
                          </span>
                          <span className="rounded-full bg-blue-100 px-3 py-1 font-mono text-sm text-blue-800 dark:bg-blue-900/70 dark:text-blue-200">
                            {plan.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white/50 px-6 py-16 text-center shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <TagIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-2xl font-semibold text-gray-700 subpixel-antialiased dark:text-gray-200">
                {categories.length === 0
                  ? "No Categories Found"
                  : "No Categories Match Filters"}
              </h3>
              <p className="mt-2 text-gray-500">
                {categories.length === 0
                  ? "There are currently no active case categories to display."
                  : "Try adjusting your filters to see more categories."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CaseCategoriesPage;
