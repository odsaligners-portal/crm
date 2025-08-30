"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { setLoading } from "@/store/features/uiSlice";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

// List of countries for selection
const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Greece",
  "Portugal",
  "Ireland",
  "Iceland",
  "Luxembourg",
  "Malta",
  "Cyprus",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Slovenia",
  "Slovakia",
  "Croatia",
  "Serbia",
  "Montenegro",
  "Bosnia and Herzegovina",
  "North Macedonia",
  "Albania",
  "Kosovo",
  "Moldova",
  "Ukraine",
  "Belarus",
  "Russia",
  "Georgia",
  "Armenia",
  "Azerbaijan",
  "Turkey",
  "Israel",
  "Lebanon",
  "Jordan",
  "Syria",
  "Iraq",
  "Iran",
  "Saudi Arabia",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "United Arab Emirates",
  "Oman",
  "Yemen",
  "Egypt",
  "Libya",
  "Tunisia",
  "Algeria",
  "Morocco",
  "Sudan",
  "South Sudan",
  "Ethiopia",
  "Eritrea",
  "Djibouti",
  "Somalia",
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Burundi",
  "Democratic Republic of the Congo",
  "Republic of the Congo",
  "Gabon",
  "Equatorial Guinea",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Niger",
  "Nigeria",
  "Benin",
  "Togo",
  "Ghana",
  "Ivory Coast",
  "Liberia",
  "Sierra Leone",
  "Guinea",
  "Guinea-Bissau",
  "Senegal",
  "The Gambia",
  "Mauritania",
  "Mali",
  "Burkina Faso",
  "Cape Verde",
  "São Tomé and Príncipe",
  "Angola",
  "Zambia",
  "Zimbabwe",
  "Botswana",
  "Namibia",
  "South Africa",
  "Lesotho",
  "Eswatini",
  "Madagascar",
  "Mauritius",
  "Seychelles",
  "Comoros",
  "Mayotte",
  "Réunion",
  "China",
  "Japan",
  "South Korea",
  "North Korea",
  "Mongolia",
  "Taiwan",
  "Hong Kong",
  "Macau",
  "Vietnam",
  "Laos",
  "Cambodia",
  "Thailand",
  "Myanmar",
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Philippines",
  "Brunei",
  "East Timor",
  "India",
  "Pakistan",
  "Afghanistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Bhutan",
  "Maldives",
  "Kazakhstan",
  "Uzbekistan",
  "Turkmenistan",
  "Tajikistan",
  "Kyrgyzstan",
  "Australia",
  "New Zealand",
  "Papua New Guinea",
  "Fiji",
  "Solomon Islands",
  "Vanuatu",
  "New Caledonia",
  "French Polynesia",
  "Samoa",
  "Tonga",
  "Tuvalu",
  "Kiribati",
  "Nauru",
  "Palau",
  "Micronesia",
  "Marshall Islands",
  "Cook Islands",
  "Niue",
  "Mexico",
  "Guatemala",
  "Belize",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Panama",
  "Cuba",
  "Jamaica",
  "Haiti",
  "Dominican Republic",
  "Puerto Rico",
  "Trinidad and Tobago",
  "Barbados",
  "Grenada",
  "Saint Vincent and the Grenadines",
  "Saint Lucia",
  "Dominica",
  "Antigua and Barbuda",
  "Saint Kitts and Nevis",
  "Brazil",
  "Argentina",
  "Chile",
  "Peru",
  "Bolivia",
  "Paraguay",
  "Uruguay",
  "Ecuador",
  "Colombia",
  "Venezuela",
  "Guyana",
  "Suriname",
  "French Guiana",
].sort();

const EditCaseCategoryModal = ({
  isOpen,
  onClose,
  category,
  onCategoryUpdated,
}) => {
  const [formData, setFormData] = useState(null);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { isLoading: isSubmitting } = useSelector((state) => state.ui);

  useEffect(() => {
    if (category) {
      setFormData({
        category: category.category,
        categoryType: category.categoryType || "default",
        country: category.country || "",
        description: category.description || "",
        plans: JSON.parse(JSON.stringify(category.plans)),
        active: category.active,
      });
    }
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Reset country when switching to default type
    if (name === "categoryType" && value === "default") {
      setFormData((prev) => ({ ...prev, [name]: value, country: "" }));
    }
  };

  const handlePlanChange = (index, e) => {
    const newPlans = [...formData.plans];
    newPlans[index][e.target.name] = e.target.value;
    setFormData({ ...formData, plans: newPlans });
  };

  const addPlan = () => {
    setFormData({
      ...formData,
      plans: [...formData.plans, { label: "", value: "" }],
    });
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

    // Validation
    if (
      !formData.category ||
      formData.plans.some((p) => !p.label || !p.value)
    ) {
      toast.error("Please fill in all category and package fields.");
      return;
    }

    if (formData.categoryType === "country-specific" && !formData.country) {
      toast.error("Please select a country for country-specific categories.");
      return;
    }

    dispatch(setLoading(true));
    try {
      const response = await fetch("/api/case-categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: category._id,
          ...formData,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Category updated successfully!");
        if (onCategoryUpdated) {
          onCategoryUpdated();
        }
        onClose();
      } else {
        throw new Error(result.message || "Failed to update category");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      alignTop={true}
      showCloseButton={false}
    >
      <div className="relative flex max-h-[90vh] flex-col rounded-2xl border border-white/20 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl backdrop-blur-lg dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50">
        <div className="shrink-0 border-b border-gray-200 p-6 text-center dark:border-gray-700/50">
          <h2 className="text-2xl font-semibold subpixel-antialiased">
            Edit Case Category
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-grow flex-col"
        >
          <div className="min-h-0 flex-grow overflow-y-auto p-6">
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

              <div>
                <Label htmlFor="categoryType">Category Type</Label>
                <select
                  id="categoryType"
                  name="categoryType"
                  value={formData.categoryType}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="default">
                    Default (Available for all countries)
                  </option>
                  <option value="country-specific">Country-Specific</option>
                </select>
              </div>

              {formData.categoryType === "country-specific" && (
                <div>
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this category..."
                  rows="3"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <div
                  onClick={handleToggleActive}
                  className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-300 ${formData.active ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formData.active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </div>
              </div>

              <div>
                <Label>Packages</Label>
                {formData.plans.map((plan, index) => (
                  <div key={index} className="mb-2 flex items-center gap-2">
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
                    <Button
                      type="button"
                      onClick={() => removePlan(index)}
                      variant="danger"
                      className="h-10 shrink-0 p-2"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={addPlan}
                  variant="outline"
                  className="mt-2"
                >
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Add Package
                </Button>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-4 border-t border-gray-200 p-6 dark:border-gray-700/50">
            <Button type="button" onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditCaseCategoryModal;
