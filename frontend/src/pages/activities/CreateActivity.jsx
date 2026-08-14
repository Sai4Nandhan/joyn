import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, MapPin, Calendar, Users, IndianRupee, Eye, AlertCircle, ShieldCheck } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { CATEGORY_OPTIONS, createActivityRequest } from '../../services/activityService.js';
import { LocationPicker } from '../../components/activities/LocationPicker.jsx';
import { ActivityPreviewCard } from '../../components/activities/ActivityPreviewCard.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useLocationContext } from '../../context/LocationContext.jsx';

const STEPS = [
  { id: 1, label: 'Details', icon: Sparkles },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Schedule', icon: Calendar },
  { id: 4, label: 'Participants & Cost', icon: Users },
  { id: 5, label: 'Preview', icon: Eye },
];

const initialForm = {
  title: '',
  description: '',
  category: CATEGORY_OPTIONS[0].value,
  startAt: '',
  endAt: '',
  meetingPoint: '',
  address: '',
  capacityMin: 1,
  capacityMax: 10,
  isFree: true,
  costAmount: 0,
};

function buildPayload(form, locationData) {
  const lng = locationData.lng;
  const lat = locationData.lat;
  const placeName = locationData.placeName || form.meetingPoint || 'Selected Location';

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    schedule: {
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
    },
    approxLocation: {
      placeName,
      point: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)],
      },
    },
    exactLocation: {
      address: form.address.trim() || locationData.address || '',
      meetingPoint: form.meetingPoint.trim() || '',
      mapUrl: locationData.mapUrl || null,
      point: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)],
      },
    },
    capacity: {
      min: Number(form.capacityMin || 1),
      max: Number(form.capacityMax || 10),
    },
    cost: {
      isFree: form.isFree,
      amount: form.isFree ? 0 : Number(form.costAmount || 0),
      currency: 'INR',
    },
  };
}

export default function CreateActivity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: userLocation } = useLocationContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [locationData, setLocationData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize location if user context location is available
  useEffect(() => {
    if (!locationData && userLocation && userLocation.lat != null && userLocation.lng != null) {
      setLocationData({
        lat: userLocation.lat,
        lng: userLocation.lng,
        placeName: userLocation.placeName || 'Current City',
        address: userLocation.placeName || '',
        mapUrl: `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`,
        source: 'context',
      });
    }
  }, [userLocation, locationData]);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    if (!form.title.trim() || form.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    }
    if (!form.description.trim() || form.description.trim().length < 20) {
      errs.description = 'Description must be at least 20 characters long.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs = {};
    if (!locationData || locationData.lat == null || locationData.lng == null) {
      errs.location = 'Please search, detect GPS, or paste a map link to set the location.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errs = {};
    if (!form.startAt) {
      errs.startAt = 'Please select a start date and time.';
    } else if (new Date(form.startAt) <= new Date()) {
      errs.startAt = 'Start time must be in the future.';
    }

    if (!form.endAt) {
      errs.endAt = 'Please select an end date and time.';
    } else if (form.startAt && new Date(form.endAt) <= new Date(form.startAt)) {
      errs.endAt = 'End time must be after start time.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    const errs = {};
    const min = Number(form.capacityMin);
    const max = Number(form.capacityMax);
    if (isNaN(max) || max < 1) {
      errs.capacityMax = 'Maximum capacity must be at least 1 participant.';
    }
    if (min > max) {
      errs.capacityMin = 'Minimum capacity cannot exceed maximum capacity.';
    }
    if (!form.isFree && (isNaN(Number(form.costAmount)) || Number(form.costAmount) < 0)) {
      errs.costAmount = 'Please enter a valid cost amount.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();
    else if (currentStep === 4) isValid = validateStep4();

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Publish Handler
  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);

    // Final pre-publish verification check
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      setServerError('Please resolve form errors before publishing.');
      return;
    }

    if (!locationData || locationData.lat == null || locationData.lng == null) {
      setServerError('Location coordinates missing. Please select a valid location.');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload(form, locationData);
      const activity = await createActivityRequest(payload);
      navigate(`/activities/${activity.id}`);
    } catch (err) {
      const message = err.response?.data?.details?.[0]?.msg || err.response?.data?.message;
      setServerError(message || 'Failed to publish activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Discover
          </button>

          <span className="text-xs font-bold text-slate-400">
            Step {currentStep} of 5
          </span>
        </div>

        {/* Progress Bar / Step Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id);
                  }}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-violet-600 to-rose-600 text-white shadow-md shadow-violet-500/20'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-pointer'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Form Builder (Left) + Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Form Steps */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 lg:p-8">
            {serverError && (
              <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 flex gap-3 text-xs text-rose-600 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* STEP 1: DETAILS */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-display">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                      What are you planning?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Give your activity a clear, catchy title and detailed description.
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Activity Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={update('title')}
                      placeholder="e.g. Saturday Night Box Cricket Tournament"
                      className={`h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 transition-all ${
                        fieldErrors.title
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-violet-500/20'
                      }`}
                    />
                    {fieldErrors.title && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.title}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={update('category')}
                      className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Description *
                    </label>
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={update('description')}
                      placeholder="Describe what you'll be doing, rules, requirements, or what participants should bring..."
                      className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950 border p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 transition-all ${
                        fieldErrors.description
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-violet-500/20'
                      }`}
                    />
                    {fieldErrors.description && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.description}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: LOCATION */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-display">
                      <MapPin className="h-5 w-5 text-rose-500" />
                      Where is the activity?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Search for a place, use your GPS, or paste a Google/Apple Maps link.
                    </p>
                  </div>

                  {/* Location Picker Component */}
                  <div>
                    <LocationPicker
                      value={locationData}
                      onChange={(data) => {
                        setLocationData(data);
                        if (fieldErrors.location) setFieldErrors((p) => ({ ...p, location: null }));
                      }}
                    />
                    {fieldErrors.location && (
                      <p className="mt-2 text-xs text-rose-500 font-medium">{fieldErrors.location}</p>
                    )}
                  </div>

                  {/* Meeting Point Instructions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Exact Meeting Point <span className="font-normal text-slate-400">(Revealed after approval)</span>
                      </label>
                      <input
                        type="text"
                        value={form.meetingPoint}
                        onChange={update('meetingPoint')}
                        placeholder="e.g. Turf Gate 2, next to Cafe Coffee Day"
                        className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Address <span className="font-normal text-slate-400">(Optional details)</span>
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={update('address')}
                        placeholder="e.g. H.No 12-3, Main Road, Hanamkonda"
                        className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: SCHEDULE */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-display">
                      <Calendar className="h-5 w-5 text-amber-500" />
                      When does it happen?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Set a future date and start/end time.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={form.startAt}
                        onChange={update('startAt')}
                        className={`h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border px-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 transition-all cursor-pointer ${
                          fieldErrors.startAt
                            ? 'border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-violet-500/20'
                        }`}
                      />
                      {fieldErrors.startAt && (
                        <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.startAt}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={form.endAt}
                        onChange={update('endAt')}
                        className={`h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border px-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 transition-all cursor-pointer ${
                          fieldErrors.endAt
                            ? 'border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-violet-500/20'
                        }`}
                      />
                      {fieldErrors.endAt && (
                        <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.endAt}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PARTICIPANTS & COST */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-display">
                      <Users className="h-5 w-5 text-emerald-500" />
                      Who can join & Costs?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Set member capacity and expense sharing details.
                    </p>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Participant Capacity
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Minimum</span>
                        <input
                          type="number"
                          min={1}
                          value={form.capacityMin}
                          onChange={update('capacityMin')}
                          className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Maximum *</span>
                        <input
                          type="number"
                          min={1}
                          value={form.capacityMax}
                          onChange={update('capacityMax')}
                          className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                      </div>
                    </div>
                    {fieldErrors.capacityMax && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.capacityMax}</p>
                    )}
                    {fieldErrors.capacityMin && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.capacityMin}</p>
                    )}
                  </div>

                  {/* Costs */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Expense Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, isFree: true, costAmount: 0 }))}
                        className={`h-12 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                          form.isFree
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <Check className={`h-4 w-4 ${form.isFree ? 'opacity-100' : 'opacity-0'}`} />
                        Free Activity
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, isFree: false }))}
                        className={`h-12 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                          !form.isFree
                            ? 'bg-violet-500/10 border-violet-500/40 text-violet-500'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <IndianRupee className="h-4 w-4" />
                        Split Expenses
                      </button>
                    </div>

                    {!form.isFree && (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Estimated Cost Per Person (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={form.costAmount}
                          onChange={update('costAmount')}
                          placeholder="e.g. 250"
                          className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                        {fieldErrors.costAmount && (
                          <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.costAmount}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: PREVIEW & PUBLISH */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-display">
                      <Eye className="h-5 w-5 text-violet-500" />
                      Ready to publish?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Review your activity details before publishing to JOYN members nearby.
                    </p>
                  </div>

                  {/* Summary list */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Title:</span>
                      <span className="font-bold">{form.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="font-bold uppercase">{form.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-bold">{locationData?.placeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capacity:</span>
                      <span className="font-bold">Max {form.capacityMax} members</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cost:</span>
                      <span className="font-bold">{form.isFree ? 'Free' : `₹${form.costAmount}`}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="h-13 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 text-sm font-extrabold text-white transition-all hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      'Publish Activity Now'
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Nav Controls */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 text-xs font-bold text-white hover:opacity-95 transition-all flex items-center gap-1.5 shadow-md shadow-violet-500/10 cursor-pointer"
                >
                  Next Step <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Dynamic Preview Card (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-24">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-violet-500" />
                Live Participant Card Preview
              </span>
            </div>

            <ActivityPreviewCard
              form={form}
              locationData={locationData}
              user={user}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
