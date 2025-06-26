"use client";
import AddCaseCategoryModal from "@/components/admin/case-categories/AddModal";
import EditCaseCategoryModal from "@/components/admin/case-categories/EditModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Button from "@/components/ui/button/Button";
import { setLoading } from '@/store/features/uiSlice';
import { fetchWithError } from '@/utils/apiErrorHandler';
import { CircleStackIcon, PencilIcon, PlusIcon, SparklesIcon, TagIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";


const CaseCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [hasCaseCategoryUpdateAccess, setHasCaseCategoryUpdateAccess] = useState(false);

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
      const result = await fetchWithError('/api/case-categories', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
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


  useEffect(() => {
    if (token) {
      fetchCaseCategories();
      // Fetch access rights
      const fetchAccess = async () => {
        dispatch(setLoading(true));
        try {
          const data = await fetchWithError('/api/user/profile', {
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
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-blue-500 drop-shadow-lg animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white/90 tracking-tight mt-2">
                Case Categories & Packages
            </h1>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                A complete overview of all available treatment categories and their pricing packages.
            </p>
        </div>

        <div className="flex justify-end mb-6">
            {hasCaseCategoryUpdateAccess && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Category
                </Button>
            )}
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div 
                key={category._id} 
                className={`bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-800/80 overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out ${!category.active ? 'opacity-50' : ''}`}
                style={{ animation: `fadeInUp 0.5s ${index * 0.1}s both` }}
              >
                <div className="p-6 border-b-2 border-dashed border-gray-200 dark:border-gray-700/60 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800/80 dark:to-gray-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
                                <TagIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 truncate">
                                {category.category}
                            </h2>
                        </div>
                        <div className="flex items-center shrink-0">
                            {hasCaseCategoryUpdateAccess && (
                                <>
                                  <Button onClick={() => handleOpenEditModal(category)} variant="ghost" size="sm" className="p-2">
                                      <PencilIcon className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                                  </Button>
                                  <Button onClick={() => openConfirmationModal(category._id)} variant="ghost" size="sm" className="p-2">
                                      <TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-600" />
                                  </Button>
                                </>
                            )}
                        </div>
                    </div>
                    {!category.active && (
                         <div className="mt-2 text-xs font-semibold uppercase text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-300 px-2 py-1 rounded-full inline-block">
                            Inactive
                        </div>
                    )}
                </div>
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <CircleStackIcon className="h-5 w-5" />
                        Available Packages
                    </h3>
                    <ul className="space-y-3">
                        {category.plans.map((plan) => (
                            <li key={plan._id || plan.value} className="flex justify-between items-center p-3 bg-gray-50/80 dark:bg-gray-800/60 rounded-lg shadow-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-200">{plan.label}</span>
                                <span className="font-mono text-sm px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 rounded-full">
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
          <div className="text-center py-16 px-6 bg-white/50 dark:bg-gray-900/50 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800">
            <TagIcon className="h-16 w-16 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">No Categories Found</h3>
            <p className="mt-2 text-gray-500">There are currently no active case categories to display.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default CaseCategoriesPage;