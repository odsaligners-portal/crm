"use client";
import React, { useState, useRef, useEffect } from "react";
import TeethSelector from "@/components/all/TeethSelector";
import { countriesData } from "@/utils/countries";
import {
  imageLabels,
  modelLabels,
  interproximalReductionOptions,
  measureOfIPROptions,
  extractionOptions,
} from "@/constants/data";
import { storage } from "@/utils/firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const countries = Object.keys(countriesData);

const DentalExaminationForm = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [patientId, setPatientId] = useState(null); // Add patient ID state
  const [caseId, setCaseId] = useState(null); // Add case ID state
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    gender: "",
    country: "",
    state: "",
    city: "",
    primaryAddress: "",
    shippingAddressType: "Primary Address",
    shippingAddress: "",
    billingAddress: "",
    pastMedicalHistory: "",
    pastDentalHistory: "",
    chiefComplaint: "",
    natureOfAvailability: "",
    followUpMonths: "",
    oralHabits: "",
    otherHabitSpecification: "",
    familyHistory: "",
    // Add case category and package fields
    caseType: "",
    singleArchType: "",
    caseCategory: "",
    selectedPrice: "",
    caseCategoryDetails: "",
    treatmentPlan: "",
    // Add doctor and planner fields
    userId: "",
    plannerId: "",
    extraction: { required: false, comments: "" },
    interproximalReduction: {
      detail1: "",
      detail2: "",
      detail3: "",
      detail4: "",
    },
    measureOfIPR: { detailA: "", detailB: "", detailC: "" },
    // ... existing fields continue ...
    facialConvex: "",
    facialConcave: "",
    facialStraight: "",
    lipPostureTonicity: "",
    lipCompetence: "",
    maxOpening: "",
    protrusion: "",
    rightExcursion: "",
    leftExcursion: "",
    tmjComments: "",
    gum: "",
    frenalAttachmentLocation: "",
    frenalAttachmentType: "",
    tongue: "",
    oralMucosa: "",
    gingivalRecessionTeeth: [],
    gingivalRecessionComments: "",
    // Detailed Hard Tissue Examination
    cariesTeeth: [],
    missingToothTeeth: [],
    impactedToothTeeth: [],
    supernumeraryToothTeeth: [],
    hasSupernumeraryTooth: false,
    supernumeraryToothDescription: "",
    endodonticallyTreatedToothTeeth: [],
    occlusalWearTeeth: [],
    prosthesisTeeth: [],
    prosthesisComments: "",
    // Maxillary Arc
    maxillaryArcShape: "",
    maxillaryArcSymmetry: "",
    maxillaryArcAlignment: "",
    // Mandibular Arch
    mandibularArcShape: [],
    mandibularArcSymmetry: "",
    mandibularArcAlignment: "",
    // Midline Assessment
    midlineCoincide: "",
    midlineShiftedLeft: "",
    midlineShiftedRight: "",
    // Anterio Posterior Relationship
    molarRelation: "",
    molarRelationComments: "",
    canineRelation: "",
    canineRelationComments: "",
    overjet: "",
    overbite: "",
    // Transverse Relationship
    transverseRelationshipTeeth: [],
    transverseRelationshipComments: "",
    // Treatment Plan for Patient Concern
    treatmentPlanProtrusion: false,
    treatmentPlanCrowding: false,
    treatmentPlanSpacing: false,
    treatmentPlanOpenBite: false,
    treatmentPlanOverBite: false,
    treatmentPlanOverJet: false,
    treatmentPlanMidlineShift: false,
    treatmentPlanUnderbite: false,
    treatmentPlanAsymmetricJaw: false,
    treatmentPlanGummySmile: false,
    treatmentPlanCrossbite: false,
    treatmentPlanNarrowArch: false,
    treatmentPlanClassI: false,
    treatmentPlanClassIIDiv1: false,
    treatmentPlanClassIIDiv2: false,
    treatmentPlanClassIII: false,
    treatmentPlanComments: "",
    // How to Gain Space

    iprType: "",
    iprMeasure: "",
    gainSpaceExtraction: "",
    gainSpaceExtractionTeeth: [],
    extractionType: "",
    gainSpaceDistalization: "",
    gainSpaceDistalizationTeeth: [],
    gainSpaceProclination: "",
    gainSpaceProclinationTeeth: [],
    expansionType: "",
    anyOtherComments: "",
  });

  // Add case categories state
  const [caseCategories, setCaseCategories] = useState([]);
  const [isLoadingCaseCategories, setIsLoadingCaseCategories] = useState(false);
  const [countrySpecificCategories, setCountrySpecificCategories] = useState(
    [],
  );
  const [defaultCategories, setDefaultCategories] = useState([]);

  // Add doctors and planners state
  const [doctors, setDoctors] = useState([]);
  const [planners, setPlanners] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingPlanners, setIsLoadingPlanners] = useState(false);

  // File upload state
  const [fileKeys, setFileKeys] = useState(Array(13).fill(undefined));
  const [imageUrls, setImageUrls] = useState(Array(13).fill(undefined));
  const [progresses, setProgresses] = useState(Array(13).fill(0));

  const searchParams = useSearchParams();

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      const patientIdFromUrl = searchParams.get("id");
      if (patientIdFromUrl) {
        setPatientId(patientIdFromUrl);
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/patients/update-details?id=${patientIdFromUrl}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();

            // Load all basic patient details
            if (data.patientName) {
              setFormData((prev) => ({
                ...prev,
                patientName: data.patientName,
              }));
            }
            if (data.age) {
              setFormData((prev) => ({ ...prev, age: data.age }));
            }
            if (data.gender) {
              setFormData((prev) => ({ ...prev, gender: data.gender }));
            }
            if (data.country) {
              setFormData((prev) => ({ ...prev, country: data.country }));
            }
            if (data.state) {
              setFormData((prev) => ({ ...prev, state: data.state }));
            }
            if (data.city) {
              setFormData((prev) => ({ ...prev, city: data.city }));
            }
            if (data.pastMedicalHistory) {
              setFormData((prev) => ({
                ...prev,
                pastMedicalHistory: data.pastMedicalHistory,
              }));
            }
            if (data.pastDentalHistory) {
              setFormData((prev) => ({
                ...prev,
                pastDentalHistory: data.pastDentalHistory,
              }));
            }
            if (data.chiefComplaint) {
              setFormData((prev) => ({
                ...prev,
                chiefComplaint: data.chiefComplaint,
              }));
            }
            if (data.natureOfAvailability) {
              setFormData((prev) => ({
                ...prev,
                natureOfAvailability: data.natureOfAvailability,
              }));
            }
            // Load followUpMonths from either root level or dentalExamination
            const followUpMonthsValue =
              data.followUpMonths ||
              (data.dentalExamination && data.dentalExamination.followUpMonths);
            if (followUpMonthsValue) {
              setFormData((prev) => ({
                ...prev,
                followUpMonths: followUpMonthsValue,
              }));
            }
            if (data.oralHabits) {
              setFormData((prev) => ({ ...prev, oralHabits: data.oralHabits }));
            }
            if (data.otherHabitSpecification) {
              setFormData((prev) => ({
                ...prev,
                otherHabitSpecification: data.otherHabitSpecification,
              }));
            }
            if (data.familyHistory) {
              setFormData((prev) => ({
                ...prev,
                familyHistory: data.familyHistory,
              }));
            }
            if (data.caseType) {
              setFormData((prev) => ({ ...prev, caseType: data.caseType }));
            }
            if (data.singleArchType) {
              setFormData((prev) => ({
                ...prev,
                singleArchType: data.singleArchType,
              }));
            }
            if (data.caseCategory) {
              setFormData((prev) => ({
                ...prev,
                caseCategory: data.caseCategory,
              }));
            }
            if (data.selectedPrice) {
              setFormData((prev) => ({
                ...prev,
                selectedPrice: data.selectedPrice,
              }));
            }
            if (data.caseCategoryDetails) {
              setFormData((prev) => ({
                ...prev,
                caseCategoryDetails: data.caseCategoryDetails,
              }));
            }
            if (data.treatmentPlan) {
              setFormData((prev) => ({
                ...prev,
                treatmentPlan: data.treatmentPlan,
              }));
            }
            // Load doctor and planner IDs
            if (data.userId) {
              setFormData((prev) => ({ ...prev, userId: data.userId }));
            }
            if (data.plannerId) {
              setFormData((prev) => ({ ...prev, plannerId: data.plannerId }));
            }

            // Load additional dental examination fields if they exist at the root level
            if (data.facialConvex) {
              setFormData((prev) => ({
                ...prev,
                facialConvex: data.facialConvex,
              }));
            }
            if (data.facialConcave) {
              setFormData((prev) => ({
                ...prev,
                facialConcave: data.facialConcave,
              }));
            }
            if (data.facialStraight) {
              setFormData((prev) => ({
                ...prev,
                facialStraight: data.facialStraight,
              }));
            }
            if (data.lipPostureTonicity) {
              setFormData((prev) => ({
                ...prev,
                lipPostureTonicity: data.lipPostureTonicity,
              }));
            }
            if (data.lipCompetence) {
              setFormData((prev) => ({
                ...prev,
                lipCompetence: data.lipCompetence,
              }));
            }
            if (data.maxOpening) {
              setFormData((prev) => ({ ...prev, maxOpening: data.maxOpening }));
            }
            if (data.protrusion) {
              setFormData((prev) => ({ ...prev, protrusion: data.protrusion }));
            }
            if (data.rightExcursion) {
              setFormData((prev) => ({
                ...prev,
                rightExcursion: data.rightExcursion,
              }));
            }
            if (data.leftExcursion) {
              setFormData((prev) => ({
                ...prev,
                leftExcursion: data.leftExcursion,
              }));
            }
            if (data.tmjComments) {
              setFormData((prev) => ({
                ...prev,
                tmjComments: data.tmjComments,
              }));
            }

            // Load dental examination data if available
            if (data.dentalExamination) {
              setFormData((prev) => ({
                ...prev,
                ...data.dentalExamination,
              }));
            }

            if (data.cariesTeeth) {
              setFormData((prev) => ({
                ...prev,
                cariesTeeth: data.cariesTeeth,
              }));
            }
            if (data.missingToothTeeth) {
              setFormData((prev) => ({
                ...prev,
                missingToothTeeth: data.missingToothTeeth,
              }));
            }
            if (data.impactedToothTeeth) {
              setFormData((prev) => ({
                ...prev,
                impactedToothTeeth: data.impactedToothTeeth,
              }));
            }
            if (data.supernumeraryToothTeeth) {
              setFormData((prev) => ({
                ...prev,
                supernumeraryToothTeeth: data.supernumeraryToothTeeth,
                hasSupernumeraryTooth: true, // If teeth are selected, assume yes
              }));
            }
            if (data.hasSupernumeraryTooth !== undefined) {
              setFormData((prev) => ({
                ...prev,
                hasSupernumeraryTooth: data.hasSupernumeraryTooth,
              }));
            }
            if (data.supernumeraryToothDescription) {
              setFormData((prev) => ({
                ...prev,
                supernumeraryToothDescription:
                  data.supernumeraryToothDescription,
              }));
            }
            if (data.endodonticallyTreatedToothTeeth) {
              setFormData((prev) => ({
                ...prev,
                endodonticallyTreatedToothTeeth:
                  data.endodonticallyTreatedToothTeeth,
              }));
            }
            if (data.occlusalWearTeeth) {
              setFormData((prev) => ({
                ...prev,
                occlusalWearTeeth: data.occlusalWearTeeth,
              }));
            }
            if (data.prosthesisTeeth) {
              setFormData((prev) => ({
                ...prev,
                prosthesisTeeth: data.prosthesisTeeth,
              }));
            }
            if (data.prosthesisComments) {
              setFormData((prev) => ({
                ...prev,
                prosthesisComments: data.prosthesisComments,
              }));
            }
            if (data.iprType) {
              setFormData((prev) => ({
                ...prev,
                iprType: data.iprType,
              }));
            }
            if (data.iprMeasure) {
              setFormData((prev) => ({
                ...prev,
                iprMeasure: data.iprMeasure,
              }));
            }
            if (data.extractionType) {
              setFormData((prev) => ({
                ...prev,
                extractionType: data.extractionType,
              }));
            }
            if (data.gainSpaceExtraction) {
              setFormData((prev) => ({
                ...prev,
                gainSpaceExtraction: data.gainSpaceExtraction,
              }));
            }
            if (data.gainSpaceExtractionTeeth) {
              setFormData((prev) => ({
                ...prev,
                gainSpaceExtractionTeeth: data.gainSpaceExtractionTeeth,
              }));
            }
            if (data.expansionType) {
              setFormData((prev) => ({
                ...prev,
                expansionType: data.expansionType,
              }));
            }
            if (data.mandibularArcShape) {
              setFormData((prev) => ({
                ...prev,
                mandibularArcShape: Array.isArray(data.mandibularArcShape)
                  ? data.mandibularArcShape
                  : [data.mandibularArcShape],
              }));
            }

            // Also load address fields from the main patient data
            if (data.primaryAddress !== undefined) {
              setFormData((prev) => ({
                ...prev,
                primaryAddress: data.primaryAddress,
              }));
            }
            if (data.shippingAddressType !== undefined) {
              setFormData((prev) => ({
                ...prev,
                shippingAddressType: data.shippingAddressType,
              }));
            }
            if (data.shippingAddress !== undefined) {
              setFormData((prev) => ({
                ...prev,
                shippingAddress: data.shippingAddress,
              }));
            }
            if (data.billingAddress !== undefined) {
              setFormData((prev) => ({
                ...prev,
                billingAddress: data.billingAddress,
              }));
            }
            // Load caseId if available
            if (data.caseId) {
              setCaseId(data.caseId);
            }
            if (data.dentalExaminationFiles) {
              // Load existing files
              const newImageUrls = [...imageUrls];
              const newFileKeys = [...fileKeys];

              Object.keys(data.dentalExaminationFiles).forEach((key, index) => {
                const files = data.dentalExaminationFiles[key];
                if (files && files.length > 0) {
                  newImageUrls[index] = files[0].fileUrl;
                  newFileKeys[index] = files[0].fileKey;
                }
              });

              setImageUrls(newImageUrls);
              setFileKeys(newFileKeys);
            }
            toast.success("✅ Patient data loaded successfully from database");
          } else {
            const errorMessage = await extractErrorMessage(response);
            toast.error(`❌ ${errorMessage}`);
          }
        } catch (error) {
          console.error("Error loading existing data:", error);
          const errorMessage = error.message || "Failed to load existing data";
          toast.error(`❌ ${errorMessage}`);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadExistingData();
  }, [searchParams]);

  // Load doctors and planners when component mounts
  useEffect(() => {
    const loadDoctorsAndPlanners = async () => {
      try {
        // Load doctors
        setIsLoadingDoctors(true);
        const doctorsResponse = await fetch("/api/user/profile?role=doctor", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
          },
        });
        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          setDoctors(doctorsData.doctors || []);
        }

        // Load planners
        setIsLoadingPlanners(true);
        const plannersResponse = await fetch(
          "/api/admin/other-admins?role=planner",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
            },
          },
        );
        if (plannersResponse.ok) {
          const plannersData = await plannersResponse.json();
          setPlanners(plannersData.admins || []);
        }
      } catch (error) {
        console.error("Error loading doctors and planners:", error);
        toast.error("Failed to load doctors and planners");
      } finally {
        setIsLoadingDoctors(false);
        setIsLoadingPlanners(false);
      }
    };

    loadDoctorsAndPlanners();
  }, []);

  useEffect(() => {
    loadCaseCategories(formData.country);
  }, [formData.country]);

  // Load case categories function - moved outside useEffect for accessibility
  const loadCaseCategories = async (country = null) => {
    try {
      setIsLoadingCaseCategories(true);

      // Simple API call - the API automatically handles country + defaults
      let url = "/api/case-categories?active=true";
      if (country) {
        url += `&country=${encodeURIComponent(country)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const categories = data.data || [];

        // Set all categories (API already filters them correctly)
        setCaseCategories(categories);

        // Update the breakdown for UI display
        const countrySpecific = categories.filter(
          (cat) => cat.country === country,
        );
        const defaults = categories.filter(
          (cat) => cat.categoryType === "default",
        );

        setCountrySpecificCategories(countrySpecific);
        setDefaultCategories(defaults);
      } else {
        console.error("Failed to load case categories");
        setCaseCategories([]);
        setCountrySpecificCategories([]);
        setDefaultCategories([]);
      }
    } catch (error) {
      console.error("Error loading case categories", error);
      setCaseCategories([]);
      setCountrySpecificCategories([]);
      setDefaultCategories([]);
    } finally {
      setIsLoadingCaseCategories(false);
    }
  };

  // Helper function to extract error messages from API responses
  const extractErrorMessage = async (response) => {
    try {
      const errorData = await response.json();
      return (
        errorData.message ||
        errorData.error ||
        errorData.details ||
        "An error occurred"
      );
    } catch {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        return errorText || "An error occurred";
      } catch {
        return "An error occurred";
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested object fields
    if (
      name.startsWith("extraction.") ||
      name.startsWith("interproximalReduction.") ||
      name.startsWith("measureOfIPR.")
    ) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    } else {
      if (name === "caseCategory") {
        setFormData((prev) => ({ ...prev, selectedPrice: "" }));
      }

      // Handle country change - fetch case categories and reset related fields
      if (name === "country") {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          // Reset case category related fields when country changes
          caseCategory: "",
          selectedPrice: "",
          caseCategoryDetails: "",
          // Also reset state and city since they depend on country
          state: "",
          city: "",
        }));

        // Reset category breakdown when country changes
        setCountrySpecificCategories([]);
        setDefaultCategories([]);

        // Load case categories for the selected country
        if (value) {
          loadCaseCategories(value);
        } else {
          // If no country selected, load default categories
          loadCaseCategories();
        }
        return; // Return early to avoid setting the value again
      }

      // Special handling for followUpMonths to ensure it's stored as a string
      if (name === "followUpMonths") {
        setFormData((prev) => ({
          ...prev,
          [name]: value.toString(), // Ensure it's stored as a string
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      }
    }
  };

  const handleGingivalRecessionSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      gingivalRecessionTeeth: prev.gingivalRecessionTeeth.includes(toothNumber)
        ? prev.gingivalRecessionTeeth.filter((t) => t !== toothNumber)
        : [...prev.gingivalRecessionTeeth, toothNumber],
    }));
  };

  // Detailed Hard Tissue Examination handlers
  const handleCariesSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      cariesTeeth: prev.cariesTeeth.includes(toothNumber)
        ? prev.cariesTeeth.filter((t) => t !== toothNumber)
        : [...prev.cariesTeeth, toothNumber],
    }));
  };

  const handleMissingToothSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      missingToothTeeth: prev.missingToothTeeth.includes(toothNumber)
        ? prev.missingToothTeeth.filter((t) => t !== toothNumber)
        : [...prev.missingToothTeeth, toothNumber],
    }));
  };

  const handleImpactedToothSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      impactedToothTeeth: prev.impactedToothTeeth.includes(toothNumber)
        ? prev.impactedToothTeeth.filter((t) => t !== toothNumber)
        : [...prev.impactedToothTeeth, toothNumber],
    }));
  };

  const handleSupernumeraryToothSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      supernumeraryToothTeeth: prev.supernumeraryToothTeeth.includes(
        toothNumber,
      )
        ? prev.supernumeraryToothTeeth.filter((t) => t !== toothNumber)
        : [...prev.supernumeraryToothTeeth, toothNumber],
    }));
  };

  const handleSupernumeraryToothToggle = (hasSupernumerary) => {
    setFormData((prev) => ({
      ...prev,
      hasSupernumeraryTooth: hasSupernumerary,
      // Clear description if no supernumerary tooth
      supernumeraryToothDescription: hasSupernumerary
        ? prev.supernumeraryToothDescription
        : "",
    }));
  };

  const handleEndodonticallyTreatedToothSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      endodonticallyTreatedToothTeeth:
        prev.endodonticallyTreatedToothTeeth.includes(toothNumber)
          ? prev.endodonticallyTreatedToothTeeth.filter(
              (t) => t !== toothNumber,
            )
          : [...prev.endodonticallyTreatedToothTeeth, toothNumber],
    }));
  };

  const handleOcclusalWearSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      occlusalWearTeeth: prev.occlusalWearTeeth.includes(toothNumber)
        ? prev.occlusalWearTeeth.filter((t) => t !== toothNumber)
        : [...prev.occlusalWearTeeth, toothNumber],
    }));
  };

  const handleTransverseRelationshipSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      transverseRelationshipTeeth: prev.transverseRelationshipTeeth.includes(
        toothNumber,
      )
        ? prev.transverseRelationshipTeeth.filter((t) => t !== toothNumber)
        : [...prev.transverseRelationshipTeeth, toothNumber],
    }));
  };

  // How to Gain Space handlers

  const handleGainSpaceExtractionSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      gainSpaceExtractionTeeth: prev.gainSpaceExtractionTeeth.includes(
        toothNumber,
      )
        ? prev.gainSpaceExtractionTeeth.filter((t) => t !== toothNumber)
        : [...prev.gainSpaceExtractionTeeth, toothNumber],
    }));
  };

  const handleGainSpaceDistalizationSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      gainSpaceDistalizationTeeth: prev.gainSpaceDistalizationTeeth.includes(
        toothNumber,
      )
        ? prev.gainSpaceDistalizationTeeth.filter((t) => t !== toothNumber)
        : [...prev.gainSpaceDistalizationTeeth, toothNumber],
    }));
  };

  const handleGainSpaceProclinationSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      gainSpaceProclinationTeeth: prev.gainSpaceProclinationTeeth.includes(
        toothNumber,
      )
        ? prev.gainSpaceProclinationTeeth.filter((t) => t !== toothNumber)
        : [...prev.gainSpaceProclinationTeeth, toothNumber],
    }));
  };

  const handleProsthesisSelection = (toothNumber) => {
    setFormData((prev) => ({
      ...prev,
      prosthesisTeeth: prev.prosthesisTeeth.includes(toothNumber)
        ? prev.prosthesisTeeth.filter((t) => t !== toothNumber)
        : [...prev.prosthesisTeeth, toothNumber],
    }));
  };

  const handleMandibularArcShapeChange = (shape) => {
    setFormData((prev) => ({
      ...prev,
      mandibularArcShape: prev.mandibularArcShape.includes(shape)
        ? prev.mandibularArcShape.filter((s) => s !== shape)
        : [...prev.mandibularArcShape, shape],
    }));
  };

  const handleSaveAndNext = async (nextTab) => {
    // Validate follow-up months when traveling is selected
    if (
      formData.natureOfAvailability === "traveling" &&
      !formData.followUpMonths
    ) {
      toast.error(
        "⚠️ Please specify how often the patient can return for follow-ups (e.g., every 3, 6, or 12 months)",
      );
      return;
    }

    // Validate case information
    if (!formData.caseType) {
      toast.error(
        "📋 Please select whether this is a Single Arch or Double Arch case",
      );
      return;
    }
    if (!formData.caseCategory) {
      toast.error(
        "🏷️ Please select the appropriate case category for treatment planning",
      );
      return;
    }
    if (!formData.selectedPrice) {
      toast.error("💰 Please select a treatment package to continue");
      return;
    }
    if (!formData.userId) {
      toast.error("👨‍⚕️ Please assign a doctor to this case");
      return;
    }

    try {
      // Prepare file data for files tab
      let fileData = {};
      if (activeTab === "files") {
        fileData = {
          img1: imageUrls[0]
            ? [
                {
                  fileUrl: imageUrls[0],
                  fileKey: fileKeys[0],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img2: imageUrls[1]
            ? [
                {
                  fileUrl: imageUrls[1],
                  fileKey: fileKeys[1],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img3: imageUrls[2]
            ? [
                {
                  fileUrl: imageUrls[2],
                  fileKey: fileKeys[2],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img4: imageUrls[3]
            ? [
                {
                  fileUrl: imageUrls[3],
                  fileKey: fileKeys[3],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img5: imageUrls[4]
            ? [
                {
                  fileUrl: imageUrls[4],
                  fileKey: fileKeys[4],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img6: imageUrls[5]
            ? [
                {
                  fileUrl: imageUrls[5],
                  fileKey: fileKeys[5],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img7: imageUrls[6]
            ? [
                {
                  fileUrl: imageUrls[6],
                  fileKey: fileKeys[6],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img8: imageUrls[7]
            ? [
                {
                  fileUrl: imageUrls[7],
                  fileKey: fileKeys[7],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img9: imageUrls[8]
            ? [
                {
                  fileUrl: imageUrls[8],
                  fileKey: fileKeys[8],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img10: imageUrls[9]
            ? [
                {
                  fileUrl: imageUrls[9],
                  fileKey: fileKeys[9],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img11: imageUrls[10]
            ? [
                {
                  fileUrl: imageUrls[10],
                  fileKey: fileKeys[10],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          model1: imageUrls[11]
            ? [
                {
                  fileUrl: imageUrls[11],
                  fileKey: fileKeys[11],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          model2: imageUrls[12]
            ? [
                {
                  fileUrl: imageUrls[12],
                  fileKey: fileKeys[12],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
        };
      }

      // If this is the first time, create a new patient record
      if (!patientId) {
        const requestBody = {
          ...formData,
          dentalExamination: formData,
          dentalExaminationFiles: fileData,
          userId: formData.userId, // Set userId to selected doctor's ID
          plannerId: formData.plannerId,
        };

        const response = await fetch("/api/patients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const result = await response.json();
          setPatientId(result._id);
          // Set caseId if available in the response
          if (result.caseId) {
            setCaseId(result.caseId);
          }

          // Update URL query parameters to include the new patient ID
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set("id", result._id);
          const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
          window.history.replaceState({}, "", newUrl);

          toast.success(
            `✅ ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab data saved successfully!`,
          );
        } else {
          const errorMessage = await extractErrorMessage(response);
          toast.error(`❌ ${errorMessage}`);
          return;
        }
      } else {
        // Update existing patient record

        const requestBody = {
          ...formData,
          dentalExamination: formData,
          dentalExaminationFiles: fileData,
          userId: formData.userId, // Set userId to selected doctor's ID
          plannerId: formData.plannerId,
        };

        const response = await fetch(
          `/api/patients/update-details?id=${patientId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (response.ok) {
          toast.success(
            `✅ ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab data saved successfully!`,
          );
        } else {
          const errorMessage = await extractErrorMessage(response);
          toast.error(`❌ ${errorMessage}`);
          return;
        }
      }

      // Move to next tab
      setActiveTab(nextTab);
    } catch (error) {
      console.error("Error saving data:", error);
      const errorMessage = error.message || "An error occurred while saving";
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate follow-up months when traveling is selected
    if (
      formData.natureOfAvailability === "traveling" &&
      !formData.followUpMonths
    ) {
      toast.error(
        "⚠️ Please specify how often the patient can return for follow-ups (e.g., every 3, 6, or 12 months)",
      );
      return;
    }

    // Validate case information
    if (!formData.caseType) {
      toast.error(
        "📋 Please select whether this is a Single Arch or Double Arch case",
      );
      return;
    }
    if (!formData.caseCategory) {
      toast.error(
        "🏷️ Please select the appropriate case category for treatment planning",
      );
      return;
    }
    if (!formData.selectedPrice) {
      toast.error("💰 Please select a treatment package to continue");
      return;
    }
    if (!formData.userId) {
      toast.error("👨‍⚕️ Please assign a doctor to this case");
      return;
    }

    try {
      if (!patientId) {
        // Create new patient record
        const fileData = {
          img1: imageUrls[0]
            ? [
                {
                  fileUrl: imageUrls[0],
                  fileKey: fileKeys[0],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img2: imageUrls[1]
            ? [
                {
                  fileUrl: imageUrls[1],
                  fileKey: fileKeys[1],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img3: imageUrls[2]
            ? [
                {
                  fileUrl: imageUrls[2],
                  fileKey: fileKeys[2],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img4: imageUrls[3]
            ? [
                {
                  fileUrl: imageUrls[3],
                  fileKey: fileKeys[3],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img5: imageUrls[4]
            ? [
                {
                  fileUrl: imageUrls[4],
                  fileKey: fileKeys[4],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img6: imageUrls[5]
            ? [
                {
                  fileUrl: imageUrls[5],
                  fileKey: fileKeys[5],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img7: imageUrls[6]
            ? [
                {
                  fileUrl: imageUrls[6],
                  fileKey: fileKeys[6],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img8: imageUrls[7]
            ? [
                {
                  fileUrl: imageUrls[7],
                  fileKey: fileKeys[7],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img9: imageUrls[8]
            ? [
                {
                  fileUrl: imageUrls[8],
                  fileKey: fileKeys[8],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img10: imageUrls[9]
            ? [
                {
                  fileUrl: imageUrls[9],
                  fileKey: fileKeys[9],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img11: imageUrls[10]
            ? [
                {
                  fileUrl: imageUrls[10],
                  fileKey: fileKeys[10],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          model1: imageUrls[11]
            ? [
                {
                  fileUrl: imageUrls[11],
                  fileKey: fileKeys[11],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          model2: imageUrls[12]
            ? [
                {
                  fileUrl: imageUrls[12],
                  fileKey: fileKeys[12],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
        };

        const requestBody = {
          ...formData,
          dentalExamination: formData,
          dentalExaminationFiles: fileData,
          userId: formData.userId, // Set userId to selected doctor's ID
          plannerId: formData.plannerId,
        };

        const response = await fetch("/api/patients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const result = await response.json();
          setPatientId(result._id);
          // Set caseId if available in the response
          if (result.caseId) {
            setCaseId(result.caseId);
          }

          // Update URL query parameters to include the new patient ID
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set("id", result._id);
          const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
          window.history.replaceState({}, "", newUrl);
          router.push(`/admin/patients/view-patient-details?id=${result._id}`);
          toast.success(
            "🎉 Dental examination form submitted successfully! New patient record created.",
          );
        } else {
          const errorMessage = await extractErrorMessage(response);
          toast.error(`❌ ${errorMessage}`);
        }
      } else if (patientId) {
        // Update existing patient record
        const fileData = {
          img1: imageUrls[0]
            ? [
                {
                  fileUrl: imageUrls[0],
                  fileKey: fileKeys[0],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img2: imageUrls[1]
            ? [
                {
                  fileUrl: imageUrls[1],
                  fileKey: fileKeys[1],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img3: imageUrls[2]
            ? [
                {
                  fileUrl: imageUrls[2],
                  fileKey: fileKeys[2],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img4: imageUrls[3]
            ? [
                {
                  fileUrl: imageUrls[3],
                  fileKey: fileKeys[3],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img5: imageUrls[4]
            ? [
                {
                  fileUrl: imageUrls[4],
                  fileKey: fileKeys[4],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img6: imageUrls[5]
            ? [
                {
                  fileUrl: imageUrls[5],
                  fileKey: fileKeys[5],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img7: imageUrls[6]
            ? [
                {
                  fileUrl: imageUrls[6],
                  fileKey: fileKeys[6],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img8: imageUrls[7]
            ? [
                {
                  fileUrl: imageUrls[7],
                  fileKey: fileKeys[7],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img9: imageUrls[8]
            ? [
                {
                  fileUrl: imageUrls[8],
                  fileKey: fileKeys[8],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img10: imageUrls[9]
            ? [
                {
                  fileUrl: imageUrls[9],
                  fileKey: fileKeys[9],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          img11: imageUrls[10]
            ? [
                {
                  fileUrl: imageUrls[10],
                  fileKey: fileKeys[10],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          model1: imageUrls[11]
            ? [
                {
                  fileUrl: imageUrls[11],
                  fileKey: fileKeys[11],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          model2: imageUrls[12]
            ? [
                {
                  fileUrl: imageUrls[12],
                  fileKey: fileKeys[12],
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
        };

        const requestBody = {
          ...formData,
          dentalExamination: formData,
          dentalExaminationFiles: fileData,
          userId: formData.userId, // Set userId to selected doctor's ID
          plannerId: formData.plannerId,
        };

        const response = await fetch(
          `/api/patients/update-details?id=${patientId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (response.ok) {
          const result = await response.json();
          // Set caseId if available in the response
          if (result.caseId) {
            setCaseId(result.caseId);
          }
          toast.success(
            "🎉 Dental examination form submitted successfully! All patient data has been saved to the database.",
          );
          router.push(`/admin/patients/view-patient-details?id=${result._id}`);
        } else {
          const errorMessage = await extractErrorMessage(response);
          toast.error(`❌ ${errorMessage}`);
        }
      } else {
        toast.success("🎉 Form submitted successfully! ");
        router.push(`/admin/patients/view-patient-details?id=${result._id}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error.message || "An error occurred while submitting the form";
      toast.error(`❌ ${errorMessage}`);
    }
  };

  // File upload handlers
  const handleFileUpload = async (file, idx) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const isImageSlot = idx < 11;
    const isModelSlot = idx >= 11;

    if (
      (isImageSlot && !["jpg", "jpeg", "png"].includes(fileExtension)) ||
      (isModelSlot && !["ply", "stl"].includes(fileExtension))
    ) {
      toast.error(
        "❌ Invalid file type for this slot. Please use the correct file format.",
      );
      return;
    }

    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const storagePath = `dental-examination/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) =>
        setProgresses((p) => {
          const n = [...p];
          n[idx] = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          return n;
        }),
      (error) => {
        toast.error(
          `❌ File upload failed: ${error.message || "Unknown error occurred"}`,
        );
        setProgresses((p) => {
          const n = [...p];
          n[idx] = 0;
          return n;
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrls((p) => {
            const n = [...p];
            n[idx] = downloadURL;
            return n;
          });
          setFileKeys((p) => {
            const n = [...p];
            n[idx] = storagePath;
            return n;
          });
          toast.success("✅ File uploaded successfully!");
        });
      },
    );
  };

  const handleDeleteFile = async (idx) => {
    const fileKey = fileKeys[idx];
    if (!fileKey) return;
    const fileRef = ref(storage, fileKey);
    try {
      await deleteObject(fileRef);
      setImageUrls((p) => {
        const n = [...p];
        n[idx] = undefined;
        return n;
      });
      setFileKeys((p) => {
        const n = [...p];
        n[idx] = undefined;
        return n;
      });
      setProgresses((p) => {
        const n = [...p];
        n[idx] = 0;
        return n;
      });
      toast.success("✅ File deleted successfully!");
    } catch (error) {
      toast.error(
        `❌ Failed to delete file: ${error.message || "Unknown error occurred"}`,
      );
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      const path = new URL(url).pathname.split("/").pop() || "";
      return decodeURIComponent(path).substring(path.indexOf("-") + 1);
    } catch {
      return "file";
    }
  };

  const UploadComponent = ({ idx }) => {
    const onDrop = (acceptedFiles) =>
      acceptedFiles.length > 0 && handleFileUpload(acceptedFiles[0], idx);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false,
      accept:
        idx < 11
          ? { "image/jpeg": [], "image/png": [] }
          : { "application/octet-stream": [".ply", ".stl"] },
    });
    const isModelSlot = idx >= 11;
    const fileUrl = imageUrls[idx];
    const fileName = fileUrl ? getFileNameFromUrl(fileUrl) : "";
    const fileExt = fileName.split(".").pop()?.toLowerCase();

    // Background images for different upload slots
    const getBackgroundImage = (idx) => {
      if (idx < 11) {
        const backgroundImages = [
          "/images/upload/upper-arch.jpeg", // Upper arch
          "/images/upload/lower-arch.jpeg", // Lower arch
          "/images/upload/Anterior-View-Arch.jpeg", // Anterior View
          "/images/upload/Left-View.jpeg", // Left View
          "/images/upload/right-view.jpeg", // Right View
          "/images/upload/open-mouth-with-teeth.jpeg", // Open Mouth
          "/images/upload/profile.jpeg", // Profile View
          "/images/upload/frontal.jpeg", // Frontal View
          "/images/upload/smiling.jpeg", // Smiling
          // Lateral Radiograph (placeholder)
        ];
        return backgroundImages[idx];
      }
      return null;
    };

    const backgroundImage = getBackgroundImage(idx);

    return (
      <div className="group rounded-xl p-2 text-center transition-all duration-300 hover:bg-gray-50/50">
        <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
          {idx < 11 ? imageLabels[idx] : modelLabels[idx - 11]}
        </label>
        {!fileUrl ? (
          progresses[idx] > 0 ? (
            <div className="mt-2 w-full">
              <div className="mb-1 flex justify-between">
                <span className="text-sm font-medium text-blue-700">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-blue-700">
                  {Math.round(progresses[idx])}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${progresses[idx]}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`group/upload relative mt-2 flex ${idx < 9 ? "h-72" : "h-36"} w-full cursor-pointer appearance-none items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-105 focus:outline-none ${
                isDragActive
                  ? "scale-105 border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 shadow-xl ring-4 shadow-blue-500/30 ring-blue-500/20"
                  : "border-gray-300 bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-lg"
              }`}
            >
              <input {...getInputProps()} />

              {/* Background Image */}
              {backgroundImage && (
                <div
                  className="absolute inset-0 transition-all duration-500 group-hover/upload:scale-105 group-hover/upload:opacity-70"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}

              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-white/50 transition-all duration-300 group-hover/upload:from-white/70 group-hover/upload:via-white/50 group-hover/upload:to-white/30" />

              <div
                className={`relative z-10 flex ${idx < 9 ? "h-full items-end justify-center gap-3" : "flex-col items-center gap-2"} py-2`}
              >
                <div
                  className={`rounded-full p-4 shadow-lg transition-all duration-300 ${
                    isDragActive
                      ? "scale-110 bg-blue-500 text-white shadow-blue-500/50"
                      : "bg-white/90 text-blue-600 group-hover/upload:scale-110 group-hover/upload:bg-blue-500 group-hover/upload:text-white group-hover/upload:shadow-blue-500/50"
                  }`}
                >
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div
                  className={`${idx < 9 ? "mb-2 text-start" : "mb-2 text-center"}`}
                >
                  <span className="block text-sm font-semibold text-gray-800 subpixel-antialiased group-hover/upload:text-gray-900">
                    Drop file or{" "}
                    <span className="font-semibold text-blue-600 underline subpixel-antialiased group-hover/upload:text-blue-700">
                      browse
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-gray-600 group-hover/upload:text-gray-700">
                    {idx < 11 ? "JPEG, PNG" : "PLY, STL"}
                  </span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="group relative mx-auto mt-2 max-w-xs">
            <div className="flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
              {idx < 11 ? (
                <img
                  src={fileUrl}
                  alt=""
                  className="h-36 w-full rounded-xl object-contain"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-3">
                  {/* 3D Model Icon */}
                  <div className="mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"
                      />
                    </svg>
                  </div>
                  <p className="mb-2 text-center text-sm font-semibold break-all text-gray-700 subpixel-antialiased">
                    {fileName}
                  </p>
                  <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    {fileExt?.toUpperCase()}
                  </div>
                  <a
                    href={fileUrl}
                    download={fileName}
                    className="mt-2 text-xs font-medium text-blue-600 underline transition-colors hover:text-blue-700"
                    title="Download 3D model"
                  >
                    Download
                  </a>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDeleteFile(idx)}
                className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:shadow-xl"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Case category and package options
  const caseCategoryOptions = caseCategories.map((cat) => ({
    label: cat.category,
    value: cat.category,
    isCountrySpecific: !!cat.country,
    isDefault: cat.categoryType === "default",
  }));

  const priceOptions = caseCategories.reduce((acc, cat) => {
    acc[cat.category] = cat.plans.map((plan) => ({
      label: plan.label,
      value: plan.value,
    }));
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with Case ID */}
      {caseId && (
        <div className="sticky top-20 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex justify-end">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-3 text-white shadow-lg">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-semibold tracking-wide subpixel-antialiased">
                  Case ID: {caseId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center space-x-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-700">
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="font-medium">Loading patient data...</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {/* Enhanced Tab Navigation */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3 rounded-3xl border border-white/20 bg-white/90 p-3 shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("general")}
              className={`group flex items-center gap-3 rounded-2xl px-8 py-4 font-semibold subpixel-antialiased transition-all duration-500 ${
                activeTab === "general"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "general"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span>General Information</span>
            </button>

            <button
              onClick={() => setActiveTab("clinical")}
              className={`group flex items-center gap-3 rounded-2xl px-8 py-4 font-semibold subpixel-antialiased transition-all duration-500 ${
                activeTab === "clinical"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "clinical"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                </svg>
              </div>
              <span>Clinical Information</span>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`group flex items-center gap-3 rounded-2xl px-8 py-4 font-semibold subpixel-antialiased transition-all duration-500 ${
                activeTab === "files"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "files"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span>Files Upload</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tab Content */}
          {activeTab === "general" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h1 className="bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-4xl font-semibold text-transparent subpixel-antialiased">
                  General Information
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Patient's basic details and personal information
                </p>
              </div>
              <div className="space-y-8">
                {/* Patient Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 subpixel-antialiased">
                      Patient Information
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Patient Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="patientName"
                          value={formData.patientName}
                          onChange={handleInputChange}
                          placeholder="Enter patient name"
                          className="w-full rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Age
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Age"
                          className="w-full rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 9V7a4 4 0 118 0v2m-4 0h4m-4 0v6m4-6v6"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Gender
                      </label>
                      <div className="relative">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Assignment */}
                    <div className="group col-span-3">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Assign Doctor *
                      </label>
                      <div className="relative">
                        <select
                          name="userId"
                          value={formData.userId}
                          onChange={handleInputChange}
                          className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100"
                          required
                          disabled={isLoadingDoctors}
                        >
                          <option value="">
                            {isLoadingDoctors
                              ? "Loading doctors..."
                              : doctors.length === 0
                                ? "No doctors available"
                                : "Select Doctor"}
                          </option>
                          {doctors.map((doctor) => (
                            <option key={doctor._id} value={doctor._id}>
                              {doctor.name} ({doctor.email})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        {isLoadingDoctors && (
                          <div className="absolute top-1/2 right-12 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Planner Assignment */}
                    <div className="group col-span-3">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Assign Planner
                      </label>
                      <div className="relative">
                        <select
                          name="plannerId"
                          value={formData.plannerId}
                          onChange={handleInputChange}
                          className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100"
                          disabled={isLoadingPlanners}
                        >
                          <option value="">
                            {isLoadingPlanners
                              ? "Loading planners..."
                              : planners.length === 0
                                ? "No planners available"
                                : "Select Planner"}
                          </option>
                          {planners.map((planner) => (
                            <option key={planner._id} value={planner._id}>
                              {planner.name} ({planner.email})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        {isLoadingPlanners && (
                          <div className="absolute top-1/2 right-12 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-green-100 p-3">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 subpixel-antialiased">
                      Location Information
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                        >
                          <option value="">Select Country</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">
                        State/Province
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        disabled={!formData.country}
                        className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      >
                        <option value="">Select State/Province</option>
                        {formData.country &&
                          countriesData[formData.country] &&
                          countriesData[formData.country].map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city name"
                        className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-purple-100 p-3">
                      <svg
                        className="h-6 w-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 subpixel-antialiased">
                      Address Information
                    </h2>
                  </div>
                  <div className="space-y-6">
                    {/* Shipping Address */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shipping Address
                      </label>
                      <div className="mb-4 flex items-center space-x-6">
                        <label className="flex cursor-pointer items-center">
                          <input
                            type="radio"
                            name="shippingAddressType"
                            value="Primary Address"
                            checked={
                              formData.shippingAddressType === "Primary Address"
                            }
                            onChange={handleInputChange}
                            className="mr-2 accent-blue-500"
                          />
                          Primary Address
                        </label>
                        <label className="flex cursor-pointer items-center">
                          <input
                            type="radio"
                            name="shippingAddressType"
                            value="Alternate Address"
                            checked={
                              formData.shippingAddressType ===
                              "Alternate Address"
                            }
                            onChange={handleInputChange}
                            className="mr-2 accent-blue-500"
                          />
                          Alternate Address
                        </label>
                      </div>
                      {formData.shippingAddressType === "Primary Address" ? (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Primary Address
                          </label>
                          <textarea
                            name="primaryAddress"
                            value={formData.primaryAddress}
                            onChange={handleInputChange}
                            placeholder="Enter primary address"
                            rows="3"
                            maxLength={1500}
                            className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                              formData.primaryAddress &&
                              formData.primaryAddress.length > 1500
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500">
                              Character limit: 1500
                            </span>
                            <span
                              className={`font-medium ${
                                formData.primaryAddress &&
                                formData.primaryAddress.length > 1500
                                  ? "text-red-600"
                                  : formData.primaryAddress &&
                                      formData.primaryAddress.length > 1400
                                    ? "text-orange-500"
                                    : "text-gray-600"
                              }`}
                            >
                              {formData.primaryAddress
                                ? formData.primaryAddress.length
                                : 0}
                              /1500
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Alternate Shipping Address
                          </label>
                          <textarea
                            name="shippingAddress"
                            value={formData.shippingAddress}
                            onChange={handleInputChange}
                            placeholder="Enter new shipping address"
                            rows="3"
                            maxLength={1500}
                            className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                              formData.shippingAddress &&
                              formData.shippingAddress.length > 1500
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500">
                              Character limit: 1500
                            </span>
                            <span
                              className={`font-medium ${
                                formData.shippingAddress &&
                                formData.shippingAddress.length > 1500
                                  ? "text-red-600"
                                  : formData.shippingAddress &&
                                      formData.shippingAddress.length > 1400
                                    ? "text-red-500"
                                    : "text-gray-600"
                              }`}
                            >
                              {formData.shippingAddress
                                ? formData.shippingAddress.length
                                : 0}
                              /1500
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Billing Address */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Billing Details
                      </label>
                      <textarea
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        placeholder="Enter billing details"
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.billingAddress &&
                          formData.billingAddress.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.billingAddress &&
                            formData.billingAddress.length > 1500
                              ? "text-red-600"
                              : formData.billingAddress &&
                                  formData.billingAddress.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.billingAddress
                            ? formData.billingAddress.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical History Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xl font-semibold text-gray-700 subpixel-antialiased">
                        Chief Complaint
                      </label>
                      <textarea
                        name="chiefComplaint"
                        value={formData.chiefComplaint}
                        onChange={handleInputChange}
                        placeholder="Enter Chief Complaint details..."
                        rows="4"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.chiefComplaint &&
                          formData.chiefComplaint.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.chiefComplaint &&
                            formData.chiefComplaint.length > 1500
                              ? "text-red-600"
                              : formData.chiefComplaint &&
                                  formData.chiefComplaint.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.chiefComplaint
                            ? formData.chiefComplaint.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xl font-semibold text-gray-700 subpixel-antialiased">
                        Past Medical History
                      </label>
                      <textarea
                        name="pastMedicalHistory"
                        value={formData.pastMedicalHistory}
                        onChange={handleInputChange}
                        placeholder="Enter past medical history details..."
                        rows="4"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.pastMedicalHistory &&
                          formData.pastMedicalHistory.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.pastMedicalHistory &&
                            formData.pastMedicalHistory.length > 1500
                              ? "text-red-600"
                              : formData.pastMedicalHistory &&
                                  formData.pastMedicalHistory.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.pastMedicalHistory
                            ? formData.pastMedicalHistory.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xl font-semibold text-gray-700 subpixel-antialiased">
                        Past Dental History
                      </label>
                      <textarea
                        name="pastDentalHistory"
                        value={formData.pastDentalHistory}
                        onChange={handleInputChange}
                        placeholder="Enter past dental history details..."
                        rows="4"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.pastDentalHistory &&
                          formData.pastDentalHistory.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.pastDentalHistory &&
                            formData.pastDentalHistory.length > 1500
                              ? "text-red-600"
                              : formData.pastDentalHistory &&
                                  formData.pastDentalHistory.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.pastDentalHistory
                            ? formData.pastDentalHistory.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nature of Availability Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Nature of Availability
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="local"
                        name="natureOfAvailability"
                        value="local"
                        checked={formData.natureOfAvailability === "local"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="local"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        Local – Available for regular follow-ups
                      </label>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="traveling"
                        name="natureOfAvailability"
                        value="traveling"
                        checked={formData.natureOfAvailability === "traveling"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="traveling"
                        className="ml-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap text-gray-700"
                      >
                        Traveling{" "}
                        {formData.natureOfAvailability === "traveling" && (
                          <>
                            - Available every
                            <input
                              type="text"
                              name="followUpMonths"
                              value={formData.followUpMonths}
                              onChange={handleInputChange}
                              placeholder="Enter number of months"
                              min="1"
                              max="24"
                              required={
                                formData.natureOfAvailability === "traveling"
                              }
                              className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                                formData.natureOfAvailability === "traveling" &&
                                !formData.followUpMonths
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            months for follow-up
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  {/* {formData.natureOfAvailability === "traveling" && (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Follow-up Frequency (months): *
                      </label>
                      <input
                        type="text"
                        name="followUpMonths"
                        value={formData.followUpMonths}
                        onChange={handleInputChange}
                        placeholder="Enter number of months"
                        min="1"
                        max="24"
                        required={formData.natureOfAvailability === "traveling"}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.natureOfAvailability === "traveling" &&
                          !formData.followUpMonths
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {formData.natureOfAvailability === "traveling" &&
                        !formData.followUpMonths && (
                          <p className="mt-1 text-sm text-red-600">
                            ⚠️ Please specify how often the patient can return
                            for follow-ups (e.g., every 3, 6, or 12 months)
                          </p>
                        )}
                    </div>
                  )} */}
                </div>

                {/* Any Existing Oral Habits Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Any Existing Oral Habits
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="noHabit"
                        name="oralHabits"
                        value="noHabit"
                        checked={formData.oralHabits === "noHabit"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="noHabit"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        No Habit
                      </label>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="thumbSucking"
                        name="oralHabits"
                        value="thumbSucking"
                        checked={formData.oralHabits === "thumbSucking"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="thumbSucking"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        Thumb Sucking
                      </label>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="mouthBreathing"
                        name="oralHabits"
                        value="mouthBreathing"
                        checked={formData.oralHabits === "mouthBreathing"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="mouthBreathing"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        Mouth Breathing
                      </label>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="lipSucking"
                        name="oralHabits"
                        value="lipSucking"
                        checked={formData.oralHabits === "lipSucking"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="lipSucking"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        Lip Sucking
                      </label>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="bruxism"
                        name="oralHabits"
                        value="bruxism"
                        checked={formData.oralHabits === "bruxism"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="bruxism"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        Bruxism
                      </label>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-50 p-3">
                      <input
                        type="radio"
                        id="anyOtherHabit"
                        name="oralHabits"
                        value="anyOtherHabit"
                        checked={formData.oralHabits === "anyOtherHabit"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="anyOtherHabit"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        Any Other, please specify
                      </label>
                    </div>
                    {formData.oralHabits === "anyOtherHabit" && (
                      <div className="ml-7">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Please specify other habit:
                        </label>
                        <input
                          type="text"
                          name="otherHabitSpecification"
                          value={formData.otherHabitSpecification}
                          onChange={handleInputChange}
                          placeholder="Enter other habit details..."
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Family History Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Family History
                  </h2>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Family History of any dental or skeletal malocclusions,
                      Cleft Lip/Palate Etc
                    </label>
                    <textarea
                      name="familyHistory"
                      value={formData.familyHistory}
                      onChange={handleInputChange}
                      placeholder="Enter family history details..."
                      rows="4"
                      maxLength={1500}
                      className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        formData.familyHistory &&
                        formData.familyHistory.length > 1500
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">
                        Character limit: 1500
                      </span>
                      <span
                        className={`font-medium ${
                          formData.familyHistory &&
                          formData.familyHistory.length > 1500
                            ? "text-red-600"
                            : formData.familyHistory &&
                                formData.familyHistory.length > 1400
                              ? "text-orange-500"
                              : "text-gray-600"
                        }`}
                      >
                        {formData.familyHistory
                          ? formData.familyHistory.length
                          : 0}
                        /1500
                      </span>
                    </div>
                  </div>
                </div>

                {/* Case Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-orange-100 p-3">
                      <svg
                        className="h-6 w-6 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 subpixel-antialiased">
                      Case Information
                    </h2>
                  </div>
                  <div className="space-y-6">
                    {/* Case Type */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Case Type *
                      </label>
                      <div className="flex items-center space-x-6">
                        <label className="flex cursor-pointer items-center">
                          <input
                            type="radio"
                            name="caseType"
                            value="Single Arch"
                            checked={
                              formData.caseType === "Single Arch" ||
                              formData.caseType === "Upper Arch" ||
                              formData.caseType === "Lower Arch"
                            }
                            onChange={handleInputChange}
                            className="mr-2 accent-blue-500"
                            required
                          />
                          Single Arch
                        </label>
                        <label className="flex cursor-pointer items-center">
                          <input
                            type="radio"
                            name="caseType"
                            value="Double Arch"
                            checked={formData.caseType === "Double Arch"}
                            onChange={handleInputChange}
                            className="mr-2 accent-blue-500"
                            required
                          />
                          Double Arch
                        </label>
                      </div>
                      {/* Show dropdown if Single Arch is selected */}
                      {(formData.caseType === "Single Arch" ||
                        formData.caseType === "Upper Arch" ||
                        formData.caseType === "Lower Arch") && (
                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Arch *
                          </label>
                          <select
                            name="singleArchType"
                            value={formData.singleArchType}
                            onChange={handleInputChange}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="">Select Arch Type</option>
                            <option value="Upper Arch">Upper Arch</option>
                            <option value="Lower Arch">Lower Arch</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Case Category - Fetched based on selected country + default categories */}
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Case Category *
                      </label>
                      <div className="relative">
                        <select
                          name="caseCategory"
                          value={formData.caseCategory}
                          onChange={handleInputChange}
                          className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100"
                          required
                          disabled={isLoadingCaseCategories}
                        >
                          <option value="">
                            {isLoadingCaseCategories
                              ? "Loading categories..."
                              : caseCategoryOptions.length === 0
                                ? "No categories available"
                                : "Select Case Category"}
                          </option>
                          {caseCategoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        {isLoadingCaseCategories && (
                          <div className="absolute top-1/2 right-12 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Package Selection appears when case category is selected */}
                    {formData.caseCategory && (
                      <div className="group">
                        <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                          Package *
                        </label>
                        <div className="relative">
                          <select
                            name="selectedPrice"
                            value={formData.selectedPrice}
                            onChange={handleInputChange}
                            className="w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                            required
                          >
                            <option value="">Select Package</option>
                            {(priceOptions[formData.caseCategory] || []).map(
                              (option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ),
                            )}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Case Category Details */}
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
                        Case Category Comments
                      </label>
                      <div className="relative">
                        <textarea
                          name="caseCategoryDetails"
                          value={formData.caseCategoryDetails}
                          onChange={handleInputChange}
                          placeholder="Enter case category details..."
                          rows="4"
                          maxLength={1500}
                          className={`w-full resize-none rounded-xl border-2 bg-white/80 px-4 py-3 text-gray-900 placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none ${
                            formData.caseCategoryDetails &&
                            formData.caseCategoryDetails.length > 1500
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
                          }`}
                        />
                        <div className="absolute top-3 right-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between text-sm">
                        <span className="font-medium text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-semibold subpixel-antialiased ${
                            formData.caseCategoryDetails &&
                            formData.caseCategoryDetails.length > 1500
                              ? "text-red-600"
                              : formData.caseCategoryDetails &&
                                  formData.caseCategoryDetails.length > 1400
                                ? "text-orange-500"
                                : "text-blue-600"
                          }`}
                        >
                          {formData.caseCategoryDetails
                            ? formData.caseCategoryDetails.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "clinical" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                    />
                  </svg>
                </div>
                <h1 className="bg-gradient-to-r from-gray-800 via-green-800 to-emerald-800 bg-clip-text text-4xl font-semibold text-transparent subpixel-antialiased">
                  Clinical Information
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Patient's dental examination and treatment details
                </p>
              </div>
              <div className="space-y-8">
                {/* Facial Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Facial
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Convex
                      </label>
                      <textarea
                        name="facialConvex"
                        value={formData.facialConvex}
                        onChange={handleInputChange}
                        placeholder="Enter convex facial form details..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.facialConvex &&
                          formData.facialConvex.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.facialConvex &&
                            formData.facialConvex.length > 1500
                              ? "text-red-600"
                              : formData.facialConvex &&
                                  formData.facialConvex.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.facialConvex
                            ? formData.facialConvex.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Concave
                      </label>
                      <textarea
                        name="facialConcave"
                        value={formData.facialConcave}
                        onChange={handleInputChange}
                        placeholder="Enter concave facial form details..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.facialConcave &&
                          formData.facialConcave.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.facialConcave &&
                            formData.facialConcave.length > 1500
                              ? "text-red-600"
                              : formData.facialConcave &&
                                  formData.facialConcave.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.facialConcave
                            ? formData.facialConcave.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Straight
                      </label>
                      <textarea
                        name="facialStraight"
                        value={formData.facialStraight}
                        onChange={handleInputChange}
                        placeholder="Enter straight facial form details..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.facialStraight &&
                          formData.facialStraight.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.facialStraight &&
                            formData.facialStraight.length > 1500
                              ? "text-red-600"
                              : formData.facialStraight &&
                                  formData.facialStraight.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.facialStraight
                            ? formData.facialStraight.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lip Posture & Tonicity Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Lip Posture & Tonicity
                  </h2>
                  <div>
                    <textarea
                      name="lipPostureTonicity"
                      value={formData.lipPostureTonicity}
                      onChange={handleInputChange}
                      placeholder="Enter lip posture and tonicity details..."
                      rows="3"
                      maxLength={1500}
                      className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        formData.lipPostureTonicity &&
                        formData.lipPostureTonicity.length > 1500
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">
                        Character limit: 1500
                      </span>
                      <span
                        className={`font-medium ${
                          formData.lipPostureTonicity &&
                          formData.lipPostureTonicity.length > 1500
                            ? "text-red-600"
                            : formData.lipPostureTonicity &&
                                formData.lipPostureTonicity.length > 1400
                              ? "text-orange-500"
                              : "text-gray-600"
                        }`}
                      >
                        {formData.lipPostureTonicity
                          ? formData.lipPostureTonicity.length
                          : 0}
                        /1500
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lip Competence Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Lip Competence
                  </h2>
                  <div>
                    <textarea
                      name="lipCompetence"
                      value={formData.lipCompetence}
                      onChange={handleInputChange}
                      placeholder="Enter lip competence details..."
                      rows="3"
                      maxLength={1500}
                      className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        formData.lipCompetence &&
                        formData.lipCompetence.length > 1500
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">
                        Character limit: 1500
                      </span>
                      <span
                        className={`font-medium ${
                          formData.lipCompetence &&
                          formData.lipCompetence.length > 1500
                            ? "text-red-600"
                            : formData.lipCompetence &&
                                formData.lipCompetence.length > 1400
                              ? "text-orange-500"
                              : "text-gray-600"
                        }`}
                      >
                        {formData.lipCompetence
                          ? formData.lipCompetence.length
                          : 0}
                        /1500
                      </span>
                    </div>
                  </div>
                </div>

                {/* TMJ Examination Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    TMJ Examination
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Max Opening
                      </label>
                      <textarea
                        name="maxOpening"
                        value={formData.maxOpening}
                        onChange={handleInputChange}
                        placeholder="Enter max opening details..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.maxOpening &&
                          formData.maxOpening.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.maxOpening &&
                            formData.maxOpening.length > 1500
                              ? "text-red-600"
                              : formData.maxOpening &&
                                  formData.maxOpening.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.maxOpening ? formData.maxOpening.length : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                    {/* <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Protrusion:{" "}
                        <input
                          type="number"
                          name="protrusion"
                          value={formData.protrusion}
                          onChange={handleInputChange}
                          placeholder=""
                          className="w-16 rounded border border-gray-300 px-1 py-0 text-center focus:outline-none"
                        />{" "}
                        mm, <span className="mx-3">Right Excursion:</span>
                        <input
                          type="number"
                          name="rightExcursion"
                          value={formData.rightExcursion}
                          onChange={handleInputChange}
                          placeholder=""
                          className="w-16 rounded border border-gray-300 px-1 py-0 text-center focus:outline-none"
                        />{" "}
                        mm, <span className="mx-3">Left Excursion:</span>
                        <input
                          type="number"
                          name="leftExcursion"
                          value={formData.leftExcursion}
                          onChange={handleInputChange}
                          placeholder=""
                          className="w-16 rounded border border-gray-300 px-1 py-0 text-center focus:outline-none"
                        />{" "}
                        mm
                      </label>
                    </div> */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Any Other Comments
                      </label>
                      <textarea
                        name="tmjComments"
                        value={formData.tmjComments}
                        onChange={handleInputChange}
                        placeholder="Enter any additional TMJ examination comments..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.tmjComments &&
                          formData.tmjComments.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.tmjComments &&
                            formData.tmjComments.length > 1500
                              ? "text-red-600"
                              : formData.tmjComments &&
                                  formData.tmjComments.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.tmjComments
                            ? formData.tmjComments.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Soft Tissue Examination Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Soft Tissue Examination
                  </h2>
                  <div className="space-y-4">
                    {/* Gum Section */}
                    <div>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Gum
                          </label>
                          <textarea
                            name="gum"
                            value={formData.gum}
                            onChange={handleInputChange}
                            placeholder="Enter gum examination findings..."
                            rows="3"
                            maxLength={1500}
                            className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                              formData.gum && formData.gum.length > 1500
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500">
                              Character limit: 1500
                            </span>
                            <span
                              className={`font-medium ${
                                formData.gum && formData.gum.length > 1500
                                  ? "text-red-600"
                                  : formData.gum && formData.gum.length > 1400
                                    ? "text-orange-500"
                                    : "text-gray-600"
                              }`}
                            >
                              {formData.gum ? formData.gum.length : 0}/1500
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Frenal Attachment
                          </label>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="frenalUpper"
                                  name="frenalAttachmentLocation"
                                  value="upper"
                                  checked={
                                    formData.frenalAttachmentLocation ===
                                    "upper"
                                  }
                                  onChange={handleInputChange}
                                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                  htmlFor="frenalUpper"
                                  className="ml-2 text-sm font-medium text-gray-700"
                                >
                                  Upper
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="frenalLower"
                                  name="frenalAttachmentLocation"
                                  value="lower"
                                  checked={
                                    formData.frenalAttachmentLocation ===
                                    "lower"
                                  }
                                  onChange={handleInputChange}
                                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                  htmlFor="frenalLower"
                                  className="ml-2 text-sm font-medium text-gray-700"
                                >
                                  Lower
                                </label>
                              </div>
                            </div>
                            {formData.frenalAttachmentLocation && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                  {formData.frenalAttachmentLocation === "upper"
                                    ? "Upper"
                                    : "Lower"}{" "}
                                  Frenal Attachment:
                                </label>
                                <select
                                  name="frenalAttachmentType"
                                  value={formData.frenalAttachmentType}
                                  onChange={handleInputChange}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                  <option value="">Select...</option>
                                  <option value="high">High</option>
                                  <option value="low">Low</option>
                                  <option value="normal">Normal</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tongue Section */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Tongue
                      </label>
                      <textarea
                        name="tongue"
                        value={formData.tongue}
                        onChange={handleInputChange}
                        placeholder="Enter tongue examination findings..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.tongue && formData.tongue.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.tongue && formData.tongue.length > 1500
                              ? "text-red-600"
                              : formData.tongue && formData.tongue.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.tongue ? formData.tongue.length : 0}/1500
                        </span>
                      </div>
                    </div>

                    {/* Oral Mucosa Section */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Oral Mucosa
                      </label>
                      <textarea
                        name="oralMucosa"
                        value={formData.oralMucosa}
                        onChange={handleInputChange}
                        placeholder="Enter oral mucosa examination findings..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.oralMucosa &&
                          formData.oralMucosa.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.oralMucosa &&
                            formData.oralMucosa.length > 1500
                              ? "text-red-600"
                              : formData.oralMucosa &&
                                  formData.oralMucosa.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.oralMucosa ? formData.oralMucosa.length : 0}
                          /1500
                        </span>
                      </div>
                    </div>

                    {/* Gingival Recession Section */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Gingival Recession:
                      </label>
                      <p className="mb-4 text-sm text-gray-500 italic">
                        (Click on teeth with gingival recession)
                      </p>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={handleGingivalRecessionSelection}
                          selectedTeeth={formData.gingivalRecessionTeeth}
                        />
                      </div>
                      <div className="rounded-md bg-gray-50 p-3"></div>
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Gingival Recession Comments:
                        </label>
                        <textarea
                          name="gingivalRecessionComments"
                          value={formData.gingivalRecessionComments}
                          onChange={handleInputChange}
                          placeholder="Enter comments about gingival recession findings..."
                          rows="3"
                          maxLength={1500}
                          className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            formData.gingivalRecessionComments &&
                            formData.gingivalRecessionComments.length > 1500
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-gray-500">
                            Character limit: 1500
                          </span>
                          <span
                            className={`font-medium ${
                              formData.gingivalRecessionComments &&
                              formData.gingivalRecessionComments.length > 1500
                                ? "text-red-600"
                                : formData.gingivalRecessionComments &&
                                    formData.gingivalRecessionComments.length >
                                      1400
                                  ? "text-orange-500"
                                  : "text-gray-600"
                            }`}
                          >
                            {formData.gingivalRecessionComments
                              ? formData.gingivalRecessionComments.length
                              : 0}
                            /1500
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Hard Tissue Examination Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Detailed Hard Tissue Examination
                  </h2>
                  <p className="mb-6 text-sm text-gray-500 italic">
                    (Select teeth for each condition using the charts below)
                  </p>

                  <div className="space-y-8">
                    {/* Caries Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Caries (Select tooth)
                      </h3>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={handleCariesSelection}
                          selectedTeeth={formData.cariesTeeth}
                        />
                      </div>
                    </div>

                    {/* Missing Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Missing Tooth (Select tooth)
                      </h3>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={handleMissingToothSelection}
                          selectedTeeth={formData.missingToothTeeth}
                        />
                      </div>
                    </div>

                    {/* Impacted Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Impacted Tooth (Select tooth)
                      </h3>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={handleImpactedToothSelection}
                          selectedTeeth={formData.impactedToothTeeth}
                        />
                      </div>
                    </div>

                    {/* Supernumerary Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Supernumerary Tooth
                      </h3>

                      {/* Yes/No Buttons */}
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Does the patient have supernumerary teeth?
                        </label>
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => handleSupernumeraryToothToggle(true)}
                            className={`rounded-md px-4 py-2 font-medium transition-colors ${
                              formData.hasSupernumeraryTooth
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSupernumeraryToothToggle(false)
                            }
                            className={`rounded-md px-4 py-2 font-medium transition-colors ${
                              !formData.hasSupernumeraryTooth &&
                              formData.hasSupernumeraryTooth !== undefined
                                ? "bg-red-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Description Box - Only visible when Yes is selected */}
                      {formData.hasSupernumeraryTooth && (
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Description of supernumerary teeth:
                          </label>
                          <textarea
                            name="supernumeraryToothDescription"
                            value={formData.supernumeraryToothDescription}
                            onChange={handleInputChange}
                            placeholder="Describe the supernumerary teeth, their location, and any relevant details..."
                            rows="3"
                            maxLength={500}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <div className="mt-2 text-sm text-gray-500">
                            Character limit: 500
                          </div>
                        </div>
                      )}

                      {/* Teeth Selector - Only visible when Yes is selected */}
                      {formData.hasSupernumeraryTooth && (
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Select affected teeth:
                          </label>
                          <TeethSelector
                            onTeethSelect={handleSupernumeraryToothSelection}
                            selectedTeeth={formData.supernumeraryToothTeeth}
                          />
                        </div>
                      )}
                    </div>

                    {/* Endodontically Treated Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Endodontically Treated Tooth (Select tooth)
                      </h3>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={
                            handleEndodonticallyTreatedToothSelection
                          }
                          selectedTeeth={
                            formData.endodonticallyTreatedToothTeeth
                          }
                        />
                      </div>
                    </div>

                    {/* Occlusal Wear Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Occlusal Wear (Select tooth)
                      </h3>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={handleOcclusalWearSelection}
                          selectedTeeth={formData.occlusalWearTeeth}
                        />
                      </div>
                    </div>

                    {/* Prosthesis Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Prosthesis (Crown, Bridge, Implant - Select tooth)
                      </h3>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={handleProsthesisSelection}
                          selectedTeeth={formData.prosthesisTeeth}
                        />
                      </div>

                      {/* Prosthesis Comments */}
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Comment (In case of ceramic crown or implant, please
                          specify):
                        </label>
                        <textarea
                          name="prosthesisComments"
                          value={formData.prosthesisComments}
                          onChange={handleInputChange}
                          placeholder="Specify details about ceramic crowns, implants, or other prosthesis types..."
                          rows="3"
                          maxLength={1500}
                          className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            formData.prosthesisComments &&
                            formData.prosthesisComments.length > 1500
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-gray-500">
                            Character limit: 1500
                          </span>
                          <span
                            className={`font-medium ${
                              formData.prosthesisComments &&
                              formData.prosthesisComments.length > 1500
                                ? "text-red-600"
                                : formData.prosthesisComments &&
                                    formData.prosthesisComments.length > 1400
                                  ? "text-orange-500"
                                  : "text-gray-600"
                            }`}
                          >
                            {formData.prosthesisComments
                              ? formData.prosthesisComments.length
                              : 0}
                            /1500
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maxillary Arc Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Maxillary Arc
                  </h2>
                  <div className="space-y-6">
                    {/* Shape */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shape:
                      </label>
                      <textarea
                        name="maxillaryArcShape"
                        value={formData.maxillaryArcShape}
                        onChange={handleInputChange}
                        placeholder="Describe the shape of the maxillary arch..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.maxillaryArcShape &&
                          formData.maxillaryArcShape.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.maxillaryArcShape &&
                            formData.maxillaryArcShape.length > 1500
                              ? "text-red-600"
                              : formData.maxillaryArcShape &&
                                  formData.maxillaryArcShape.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.maxillaryArcShape
                            ? formData.maxillaryArcShape.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>

                    {/* Arch Symmetry */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Symmetry:
                      </label>
                      <textarea
                        name="maxillaryArcSymmetry"
                        value={formData.maxillaryArcSymmetry}
                        onChange={handleInputChange}
                        placeholder="Describe the symmetry of the maxillary arch..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.maxillaryArcSymmetry &&
                          formData.maxillaryArcSymmetry.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.maxillaryArcSymmetry &&
                            formData.maxillaryArcSymmetry.length > 1500
                              ? "text-red-600"
                              : formData.maxillaryArcSymmetry &&
                                  formData.maxillaryArcSymmetry.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.maxillaryArcSymmetry
                            ? formData.maxillaryArcSymmetry.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>

                    {/* Arch Alignment */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Alignment:
                      </label>
                      <textarea
                        name="maxillaryArcAlignment"
                        value={formData.maxillaryArcAlignment}
                        onChange={handleInputChange}
                        placeholder="Describe the alignment of the maxillary arch..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.maxillaryArcAlignment &&
                          formData.maxillaryArcAlignment.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.maxillaryArcAlignment &&
                            formData.maxillaryArcAlignment.length > 1500
                              ? "text-red-600"
                              : formData.maxillaryArcAlignment &&
                                  formData.maxillaryArcAlignment.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.maxillaryArcAlignment
                            ? formData.maxillaryArcAlignment.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mandibular Arch Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Mandibular Arch
                  </h2>
                  <div className="space-y-6">
                    {/* Shape */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shape:
                      </label>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {/* U-Shaped Arch */}
                        <div
                          className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                            formData.mandibularArcShape.includes(
                              "U-Shaped Arch (Broad Arch)",
                            )
                              ? "border-blue-500 bg-white"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() =>
                            handleMandibularArcShapeChange(
                              "U-Shaped Arch (Broad Arch)",
                            )
                          }
                        >
                          <div className="relative mb-2">
                            <img
                              src="/images/teeth-shape/u-shape.jpeg"
                              alt="U-Shaped Arch"
                              className="h-24 w-full rounded-md object-cover"
                            />
                            {formData.mandibularArcShape.includes(
                              "U-Shaped Arch (Broad Arch)",
                            ) && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-md mix-blend-multiply">
                                <div className="rounded-full bg-blue-500 p-1 shadow-lg">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-center text-xs font-medium text-gray-700">
                            U-Shaped Arch
                          </p>
                          <p className="text-center text-xs text-gray-500">
                            (Broad Arch)
                          </p>
                        </div>

                        {/* V-Shaped Arch */}
                        <div
                          className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                            formData.mandibularArcShape.includes(
                              "V-Shaped Arch (Narrow Arch)",
                            )
                              ? "border-blue-500 bg-white"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() =>
                            handleMandibularArcShapeChange(
                              "V-Shaped Arch (Narrow Arch)",
                            )
                          }
                        >
                          <div className="relative mb-2">
                            <img
                              src="/images/teeth-shape/v-shape.jpeg"
                              alt="V-Shaped Arch"
                              className="h-24 w-full rounded-md object-cover"
                            />
                            {formData.mandibularArcShape.includes(
                              "V-Shaped Arch (Narrow Arch)",
                            ) && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-md mix-blend-multiply">
                                <div className="rounded-full bg-blue-500 p-1 shadow-lg">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-center text-xs font-medium text-gray-700">
                            V-Shaped Arch
                          </p>
                          <p className="text-center text-xs text-gray-500">
                            (Narrow Arch)
                          </p>
                        </div>

                        {/* Square-shaped Arch */}
                        <div
                          className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                            formData.mandibularArcShape.includes(
                              "Square-shaped Arch",
                            )
                              ? "border-blue-500 bg-white"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() =>
                            handleMandibularArcShapeChange("Square-shaped Arch")
                          }
                        >
                          <div className="relative mb-2">
                            <img
                              src="/images/teeth-shape/square-shape.jpeg"
                              alt="Square-shaped Arch"
                              className="h-24 w-full rounded-md object-cover"
                            />
                            {formData.mandibularArcShape.includes(
                              "Square-shaped Arch",
                            ) && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-md mix-blend-multiply">
                                <div className="rounded-full bg-blue-500 p-1 shadow-lg">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-center text-xs font-medium text-gray-700">
                            Square-shaped Arch
                          </p>
                        </div>

                        {/* Ovoid Arch */}
                        <div
                          className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                            formData.mandibularArcShape.includes("Ovoid Arch")
                              ? "border-blue-500 bg-white"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() =>
                            handleMandibularArcShapeChange("Ovoid Arch")
                          }
                        >
                          <div className="relative mb-2">
                            <img
                              src="/images/teeth-shape/ovoid-shape.jpeg"
                              alt="Ovoid Arch"
                              className="h-24 w-full rounded-md object-cover"
                            />
                            {formData.mandibularArcShape.includes(
                              "Ovoid Arch",
                            ) && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-md mix-blend-multiply">
                                <div className="rounded-full bg-blue-500 p-1 shadow-lg">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-center text-xs font-medium text-gray-700">
                            Ovoid Arch
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arch Symmetry */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Symmetry:
                      </label>
                      <textarea
                        name="mandibularArcSymmetry"
                        value={formData.mandibularArcSymmetry}
                        onChange={handleInputChange}
                        placeholder="Describe the symmetry of the mandibular arch..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.mandibularArcSymmetry &&
                          formData.mandibularArcSymmetry.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.mandibularArcSymmetry &&
                            formData.mandibularArcSymmetry.length > 1500
                              ? "text-red-600"
                              : formData.mandibularArcSymmetry &&
                                  formData.mandibularArcSymmetry.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.mandibularArcSymmetry
                            ? formData.mandibularArcSymmetry.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>

                    {/* Arch Alignment */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Alignment:
                      </label>
                      <textarea
                        name="mandibularArcAlignment"
                        value={formData.mandibularArcAlignment}
                        onChange={handleInputChange}
                        placeholder="Describe the alignment of the mandibular arch..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.mandibularArcAlignment &&
                          formData.mandibularArcAlignment.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.mandibularArcAlignment &&
                            formData.mandibularArcAlignment.length > 1500
                              ? "text-red-600"
                              : formData.mandibularArcAlignment &&
                                  formData.mandibularArcAlignment.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.mandibularArcAlignment
                            ? formData.mandibularArcAlignment.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Midline Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Midline
                  </h2>
                  <div className="space-y-6">
                    {/* Coincide with Facial Midline */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Coincide with Facial Midline:
                      </label>
                      <select
                        name="midlineCoincide"
                        value={formData.midlineCoincide}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="upper">Upper</option>
                        <option value="lower">Lower</option>
                        <option value="both">Both</option>
                      </select>
                    </div>

                    {/* Shifted to Left */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shifted to Left:
                      </label>
                      <select
                        name="midlineShiftedLeft"
                        value={formData.midlineShiftedLeft}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="upper">Upper</option>
                        <option value="lower">Lower</option>
                      </select>
                    </div>

                    {/* Shifted to Right */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shifted to Right:
                      </label>
                      <select
                        name="midlineShiftedRight"
                        value={formData.midlineShiftedRight}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="upper">Upper</option>
                        <option value="lower">Lower</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Anterio Posterior Relationship Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Anterio Posterior Relationship
                  </h2>
                  <div className="space-y-6">
                    {/* Molar Relation */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Molar Relation:
                      </label>
                      <select
                        name="molarRelation"
                        value={formData.molarRelation}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="class1">Class 1</option>
                        <option value="class2">Class 2</option>
                        <option value="class3">Class 3</option>
                      </select>

                      {/* Molar Relation Comments */}
                      <div className="mt-3">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Molar Relation Comments:
                        </label>
                        <textarea
                          name="molarRelationComments"
                          value={formData.molarRelationComments}
                          onChange={handleInputChange}
                          placeholder="Enter comments about molar relation..."
                          rows="3"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Canine Relation */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Canine Relation:
                      </label>
                      <select
                        name="canineRelation"
                        value={formData.canineRelation}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="class1">Class 1</option>
                        <option value="class2">Class 2</option>
                        <option value="class3">Class 3</option>
                      </select>

                      {/* Canine Relation Comments */}
                      <div className="mt-3">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Canine Relation Comments:
                        </label>
                        <textarea
                          name="canineRelationComments"
                          value={formData.canineRelationComments}
                          onChange={handleInputChange}
                          placeholder="Enter comments about canine relation..."
                          rows="3"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Overjet */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Overjet:
                      </label>
                      <textarea
                        name="overjet"
                        value={formData.overjet}
                        onChange={handleInputChange}
                        placeholder="Enter overjet measurements and observations..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.overjet && formData.overjet.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.overjet && formData.overjet.length > 1500
                              ? "text-red-600"
                              : formData.overjet &&
                                  formData.overjet.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.overjet ? formData.overjet.length : 0}/1500
                        </span>
                      </div>
                    </div>

                    {/* Overbite */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Overbite:
                      </label>
                      <textarea
                        name="overbite"
                        value={formData.overbite}
                        onChange={handleInputChange}
                        placeholder="Enter overbite measurements and observations..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.overbite && formData.overbite.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.overbite && formData.overbite.length > 1500
                              ? "text-red-600"
                              : formData.overbite &&
                                  formData.overbite.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.overbite ? formData.overbite.length : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transverse Relationship Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Transverse Relationship
                  </h2>
                  <p className="mb-4 text-sm text-gray-500 italic">
                    (Select teeth with Scissor Bite/Cross Bite)
                  </p>

                  <div className="space-y-6">
                    {/* Teeth Selection Chart */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Select Teeth with Transverse Issues:
                      </label>
                      <div className="mb-4">
                        <TeethSelector
                          onTeethSelect={handleTransverseRelationshipSelection}
                          selectedTeeth={formData.transverseRelationshipTeeth}
                        />
                      </div>
                      <div className="rounded-md bg-gray-50 p-3"></div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Transverse Relationship Comments:
                      </label>
                      <textarea
                        name="transverseRelationshipComments"
                        value={formData.transverseRelationshipComments}
                        onChange={handleInputChange}
                        placeholder="Enter detailed observations about scissor bite, cross bite, and transverse relationships..."
                        rows="3"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.transverseRelationshipComments &&
                          formData.transverseRelationshipComments.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.transverseRelationshipComments &&
                            formData.transverseRelationshipComments.length >
                              1500
                              ? "text-red-600"
                              : formData.transverseRelationshipComments &&
                                  formData.transverseRelationshipComments
                                    .length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.transverseRelationshipComments
                            ? formData.transverseRelationshipComments.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment Plan for Patient Concern Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Treatment Plan
                  </h2>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Patient Concern:
                  </label>

                  <div className="space-y-6">
                    {/* Treatment Plan Checkboxes */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {/* Protrusion */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanProtrusion
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanProtrusion:
                              !prev.treatmentPlanProtrusion,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanProtrusion}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Protrusion</span>
                      </div>

                      {/* Crowding */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanCrowding
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanCrowding: !prev.treatmentPlanCrowding,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanCrowding}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Crowding</span>
                      </div>

                      {/* Spacing */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanSpacing
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanSpacing: !prev.treatmentPlanSpacing,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanSpacing}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Spacing</span>
                      </div>

                      {/* Open Bite */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanOpenBite
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanOpenBite: !prev.treatmentPlanOpenBite,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanOpenBite}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Open Bite</span>
                      </div>

                      {/* Over Bite */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanOverBite
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanOverBite: !prev.treatmentPlanOverBite,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanOverBite}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Over Bite</span>
                      </div>

                      {/* Over Jet */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanOverJet
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanOverJet: !prev.treatmentPlanOverJet,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanOverJet}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Over Jet</span>
                      </div>

                      {/* Midline Shift */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanMidlineShift
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanMidlineShift:
                              !prev.treatmentPlanMidlineShift,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanMidlineShift}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">
                          Midline Shift
                        </span>
                      </div>

                      {/* Underbite */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanUnderbite
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanUnderbite:
                              !prev.treatmentPlanUnderbite,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanUnderbite}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Underbite</span>
                      </div>

                      {/* Asymmetric Jaw */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanAsymmetricJaw
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanAsymmetricJaw:
                              !prev.treatmentPlanAsymmetricJaw,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanAsymmetricJaw}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">
                          Asymmetric Jaw
                        </span>
                      </div>

                      {/* Gummy Smile */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanGummySmile
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanGummySmile:
                              !prev.treatmentPlanGummySmile,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanGummySmile}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Gummy Smile</span>
                      </div>

                      {/* Crossbite */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanCrossbite
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanCrossbite:
                              !prev.treatmentPlanCrossbite,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanCrossbite}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Crossbite</span>
                      </div>

                      {/* Narrow Arch */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanNarrowArch
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanNarrowArch:
                              !prev.treatmentPlanNarrowArch,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanNarrowArch}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Narrow Arch</span>
                      </div>

                      {/* Class I */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanClassI
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanClassI: !prev.treatmentPlanClassI,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanClassI}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Class I</span>
                      </div>

                      {/* Class II Div 1 */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanClassIIDiv1
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanClassIIDiv1:
                              !prev.treatmentPlanClassIIDiv1,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanClassIIDiv1}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">
                          Class II Div 1
                        </span>
                      </div>

                      {/* Class II Div 2 */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanClassIIDiv2
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanClassIIDiv2:
                              !prev.treatmentPlanClassIIDiv2,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanClassIIDiv2}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">
                          Class II Div 2
                        </span>
                      </div>

                      {/* Class III */}
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 hover:scale-105 ${
                          formData.treatmentPlanClassIII
                            ? "border-blue-500 bg-blue-100 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            treatmentPlanClassIII: !prev.treatmentPlanClassIII,
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.treatmentPlanClassIII}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span className="text-sm font-medium">Class III</span>
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Treatment Plan Comments:
                      </label>
                      <textarea
                        name="treatmentPlanComments"
                        value={formData.treatmentPlanComments}
                        onChange={handleInputChange}
                        placeholder="Enter detailed treatment plan recommendations and additional observations..."
                        rows="4"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.treatmentPlanComments &&
                          formData.treatmentPlanComments.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.treatmentPlanComments &&
                            formData.treatmentPlanComments.length > 1500
                              ? "text-red-600"
                              : formData.treatmentPlanComments &&
                                  formData.treatmentPlanComments.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.treatmentPlanComments
                            ? formData.treatmentPlanComments.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* How to Gain Space Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-2xl font-semibold text-gray-700 subpixel-antialiased">
                    How to Gain Space
                  </h2>
                  <div className="space-y-8">
                    {/* IPR */}
                    <div className="flex flex-wrap justify-between space-y-6 pr-20">
                      {/* IPR Type Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          IPR/Interproximal Reduction
                        </h3>
                        <div className="space-y-3">
                          {interproximalReductionOptions.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="iprType"
                                value={option}
                                checked={formData.iprType === option}
                                onChange={handleInputChange}
                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm font-medium text-gray-700">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Measure of IPR Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Measure of IPR (preference)
                        </h3>
                        <div className="space-y-3">
                          {measureOfIPROptions.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="iprMeasure"
                                value={option}
                                checked={formData.iprMeasure === option}
                                onChange={handleInputChange}
                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm font-medium text-gray-700">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Expansion */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Expansion
                        </h3>
                        <div className="space-y-3">
                          {extractionOptions.map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="expansionType"
                                value={option}
                                checked={formData.expansionType === option}
                                onChange={handleInputChange}
                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm font-medium text-gray-700">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Extraction */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-lg font-medium text-gray-700">
                          Extraction:
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceExtraction"
                              value="yes"
                              checked={formData.gainSpaceExtraction === "yes"}
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Yes
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceExtraction"
                              value="no"
                              checked={formData.gainSpaceExtraction === "no"}
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              No
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceExtraction"
                              value="Plan as required"
                              checked={
                                formData.gainSpaceExtraction ===
                                "Plan as required"
                              }
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Plan as required
                            </span>
                          </label>
                        </div>
                      </div>

                      {formData.gainSpaceExtraction === "yes" && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Select Teeth for Extraction (Select tooth):
                          </label>
                          <TeethSelector
                            onTeethSelect={handleGainSpaceExtractionSelection}
                            selectedTeeth={formData.gainSpaceExtractionTeeth}
                          />
                        </div>
                      )}
                    </div>

                    {/* Distalization */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-lg font-medium text-gray-700">
                          Distalization:
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceDistalization"
                              value="yes"
                              checked={
                                formData.gainSpaceDistalization === "yes"
                              }
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Yes
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceDistalization"
                              value="no"
                              checked={formData.gainSpaceDistalization === "no"}
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              No
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceDistalization"
                              value="Plan as required"
                              checked={
                                formData.gainSpaceDistalization ===
                                "Plan as required"
                              }
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Plan as required
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* {formData.gainSpaceDistalization === "yes" && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Select Teeth for Distalization (Select tooth):
                          </label>
                          <TeethSelector
                            onTeethSelect={
                              handleGainSpaceDistalizationSelection
                            }
                            selectedTeeth={formData.gainSpaceDistalizationTeeth}
                          />
                        </div>
                      )} */}
                    </div>

                    {/* Proclination */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-lg font-medium text-gray-700">
                          Proclination:
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceProclination"
                              value="yes"
                              checked={formData.gainSpaceProclination === "yes"}
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Yes
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceProclination"
                              value="no"
                              checked={formData.gainSpaceProclination === "no"}
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              No
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gainSpaceProclination"
                              value="Plan as required"
                              checked={
                                formData.gainSpaceProclination ===
                                "Plan as required"
                              }
                              onChange={handleInputChange}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Plan as required
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* {formData.gainSpaceProclination === "yes" && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Select Teeth for Proclination (Select tooth):
                          </label>
                          <TeethSelector
                            onTeethSelect={handleGainSpaceProclinationSelection}
                            selectedTeeth={formData.gainSpaceProclinationTeeth}
                          />
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>

                {/* Any Other Comments Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700 subpixel-antialiased">
                    Any Other Comments
                  </h2>
                  <p className="mb-6 text-sm text-gray-500 italic">
                    (Please specify any additional comments or observations)
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Additional Comments:
                      </label>
                      <textarea
                        name="anyOtherComments"
                        value={formData.anyOtherComments}
                        onChange={handleInputChange}
                        placeholder="Enter any additional comments, observations, or special notes..."
                        rows="6"
                        maxLength={1500}
                        className={`w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          formData.anyOtherComments &&
                          formData.anyOtherComments.length > 1500
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-500">
                          Character limit: 1500
                        </span>
                        <span
                          className={`font-medium ${
                            formData.anyOtherComments &&
                            formData.anyOtherComments.length > 1500
                              ? "text-red-600"
                              : formData.anyOtherComments &&
                                  formData.anyOtherComments.length > 1400
                                ? "text-orange-500"
                                : "text-gray-600"
                          }`}
                        >
                          {formData.anyOtherComments
                            ? formData.anyOtherComments.length
                            : 0}
                          /1500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files Upload Tab */}
          {activeTab === "files" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="bg-gradient-to-r from-gray-800 via-purple-800 to-pink-800 bg-clip-text text-4xl font-semibold text-transparent subpixel-antialiased">
                  Files Upload
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Upload patient images, X-rays, and 3D models
                </p>
              </div>
              <div className="space-y-8">
                {/* Intraoral Photo Section - First 6 uploads (slots 0-5) */}
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-200 p-3">
                      <svg
                        className="h-6 w-6 text-blue-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-blue-800 subpixel-antialiased">
                        📸 Intraoral Photo
                      </h2>
                      <p className="text-blue-600">
                        Upload photos of the patient's teeth and oral cavity
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {imageLabels.slice(0, 6).map((_, idx) => (
                      <UploadComponent key={idx} idx={idx} />
                    ))}
                  </div>
                </div>

                {/* Facial Section - Next 3 uploads (slots 6-8) */}
                <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-green-200 p-3">
                      <svg
                        className="h-6 w-6 text-green-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-green-800 subpixel-antialiased">
                        👤 Facial
                      </h2>
                      <p className="text-green-600">
                        Upload photos showing the patient's facial features and
                        profile
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {imageLabels.slice(6, 9).map((_, idx) => (
                      <UploadComponent key={idx + 6} idx={idx + 6} />
                    ))}
                  </div>
                </div>

                {/* X-ray Section - Remaining 2 uploads (slots 9-10) */}
                <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-purple-200 p-3">
                      <svg
                        className="h-6 w-6 text-purple-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-purple-800 subpixel-antialiased">
                        🔬 X-ray
                      </h2>
                      <p className="text-purple-600">
                        Upload radiographic images for diagnostic purposes
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {imageLabels.slice(9, 11).map((_, idx) => (
                      <UploadComponent key={idx + 9} idx={idx + 9} />
                    ))}
                  </div>
                </div>

                {/* 3D Models Section */}
                <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-orange-200 p-3">
                      <svg
                        className="h-6 w-6 text-orange-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-orange-800 subpixel-antialiased">
                        🎯 3D Models (PLY/STL)
                      </h2>
                      <p className="text-orange-600">
                        Upload 3D model files for treatment planning and
                        visualization
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {modelLabels.map((_, idx) => (
                      <UploadComponent key={idx + 11} idx={idx + 11} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Navigation Buttons */}
          <div className="mt-12 flex items-center justify-between">
            {activeTab === "general" && (
              <div className="w-full text-center">
                <button
                  type="button"
                  onClick={() => {
                    // Save data to DB and move to next tab
                    handleSaveAndNext("clinical");
                  }}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-4 font-semibold text-white subpixel-antialiased shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40"
                >
                  <span>Next</span>
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            )}

            {activeTab === "clinical" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    // Save data to DB and move to previous tab
                    handleSaveAndNext("general");
                  }}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-4 font-semibold text-white subpixel-antialiased shadow-xl shadow-gray-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gray-500/40"
                >
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 17l-5-5m0 0l5-5m-5 5h12"
                    />
                  </svg>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Save data to DB and move to next tab
                    handleSaveAndNext("files");
                  }}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-4 font-semibold text-white subpixel-antialiased shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40"
                >
                  <span>Next</span>
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </>
            )}

            {activeTab === "files" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    // Save data to DB and move to previous tab
                    handleSaveAndNext("clinical");
                  }}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-4 font-semibold text-white subpixel-antialiased shadow-xl shadow-gray-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gray-500/40"
                >
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 17l-5-5m0 0l5-5m-5 5h12"
                    />
                  </svg>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Submit the complete form
                    handleSubmit(new Event("submit"));
                  }}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-10 py-4 font-semibold text-white subpixel-antialiased shadow-xl shadow-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/40"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Submit Case</span>
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DentalExaminationForm;
