"use client";
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { toast } from 'react-toastify';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useSelector } from 'react-redux';

const AddCaseCategoryModal = ({ isOpen, onClose, onCategoryAdded }) => {
  const [formData, setFormData] = useState({
    category: '',
    plans: [{ label: '', value: '' }],
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        category: '',
        plans: [{ label: '', value: '' }],
        active: true
      });
    }
  }, [isOpen]);

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
    if (formData.plans.length > 1) {
      const newPlans = formData.plans.filter((_, i) => i !== index);
      setFormData({ ...formData, plans: newPlans });
    } else {
      toast.error("At least one package is required.");
    }
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
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/case-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Category added successfully!');
        if(onCategoryAdded) {
          onCategoryAdded();
        }
        onClose();
      } else {
        throw new Error(result.message || 'Failed to add category');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} alignTop={true} showCloseButton={false}>
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20 flex flex-col max-h-[90vh]">
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700/50 shrink-0">
          <h2 className="text-2xl font-bold">Add New Case Category</h2>
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
                          placeholder="e.g., Cosmetic Dentistry"
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
                    {isSubmitting ? 'Adding...' : 'Add Category'}
                </Button>
            </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddCaseCategoryModal; 