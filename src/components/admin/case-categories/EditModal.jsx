"use client";
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { setLoading } from '@/store/features/uiSlice';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const EditCaseCategoryModal = ({ isOpen, onClose, category, onCategoryUpdated }) => {
  const [formData, setFormData] = useState(null);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { isLoading: isSubmitting } = useSelector((state) => state.ui);

  useEffect(() => {
    if (category) {
      setFormData({
        category: category.category,
        plans: JSON.parse(JSON.stringify(category.plans)),
        active: category.active
      });
    }
  }, [category]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, category: e.target.value });
  };

  const handlePlanChange = (index, e) => {
    const newPlans = [...formData.plans];
    newPlans[index][e.target.name] = e.target.value;
    setFormData({ ...formData, plans: newPlans });
  };

  const addPlan = () => {
    setFormData({ ...formData, plans: [...formData.plans, { label: '', value: '' }] });
  };

  const removePlan = (index) => {
    const newPlans = formData.plans.filter((_, i) => i !== index);
    setFormData({ ...formData, plans: newPlans });
  };
  
  const handleToggleActive = () => {
    setFormData({ ...formData, active: !formData.active });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || formData.plans.some(p => !p.label || !p.value)) {
        toast.error("Please fill in all category and package fields.");
        return;
    }
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/case-categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: category._id,
          ...formData
        })
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Category updated successfully!');
        if(onCategoryUpdated) {
          onCategoryUpdated();
        }
        onClose();
      } else {
        throw new Error(result.message || 'Failed to update category');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} alignTop={true} showCloseButton={false}>
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20 flex flex-col max-h-[90vh]">
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700/50 shrink-0">
          <h2 className="text-2xl font-bold">Edit Case Category</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
            <div className="p-6 overflow-y-auto flex-grow min-h-0">
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="category">Category Name</Label>
                        <Input
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Status</Label>
                        <div 
                            onClick={handleToggleActive}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors duration-300 ${formData.active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${formData.active ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Packages</Label>
                        {formData.plans.map((plan, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                            <Input
                            name="label"
                            placeholder="Package Name (e.g., Lite)"
                            value={plan.label}
                            onChange={(e) => handlePlanChange(index, e)}
                            required
                            />
                            <Input
                            name="value"
                            placeholder="Price (e.g., $1000)"
                            value={plan.value}
                            onChange={(e) => handlePlanChange(index, e)}
                            required
                            />
                            <Button type="button" onClick={() => removePlan(index)} variant="danger" className="p-2 h-10 shrink-0">
                            <TrashIcon className="h-5 w-5" />
                            </Button>
                        </div>
                        ))}
                        <Button type="button" onClick={addPlan} variant="outline" className="mt-2">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Package
                        </Button>
                    </div>
                </div>
            </div>
            <div className="p-6 flex justify-end gap-4 border-t border-gray-200 dark:border-gray-700/50 shrink-0">
                <Button type="button" onClick={onClose} variant="secondary">
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Category'}
                </Button>
            </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditCaseCategoryModal; 