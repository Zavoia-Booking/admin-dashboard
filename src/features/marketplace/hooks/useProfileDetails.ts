import { useState, useEffect, useMemo } from 'react';
import type { Business } from '../types';
import { requiredEmailError, isE164, sanitizePhoneToE164Draft, validateBusinessName, validateDescription } from '../../../shared/utils/validation';

interface UseProfileDetailsProps {
  business: Business | null;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplacePhone?: string | null;
  marketplaceDescription?: string | null;
  useBusinessName: boolean;
  useBusinessEmail: boolean;
  useBusinessPhone: boolean;
  useBusinessDescription: boolean;
  allowOnlineBooking: boolean;
  isVisible: boolean;
  selectedIndustryTags: { id: number; name: string }[];
}

export function useProfileDetails({
  business,
  marketplaceName,
  marketplaceEmail,
  marketplacePhone,
  marketplaceDescription,
  useBusinessName: initialUseBusinessName,
  useBusinessEmail: initialUseBusinessEmail,
  useBusinessPhone: initialUseBusinessPhone,
  useBusinessDescription: initialUseBusinessDescription,
  allowOnlineBooking: initialAllowOnlineBooking,
  isVisible: initialIsVisible,
  selectedIndustryTags: initialSelectedIndustryTags,
}: UseProfileDetailsProps) {
  const [useBusinessName, setUseBusinessName] = useState<boolean>(initialUseBusinessName);
  const [useBusinessEmail, setUseBusinessEmail] = useState<boolean>(initialUseBusinessEmail);
  const [useBusinessPhone, setUseBusinessPhone] = useState<boolean>(initialUseBusinessPhone);
  const [useBusinessDescription, setUseBusinessDescription] = useState<boolean>(initialUseBusinessDescription);
  
  const [name, setName] = useState<string>(marketplaceName || business?.name || '');
  const [email, setEmail] = useState<string>(marketplaceEmail || business?.email || '');
  const [phone, setPhone] = useState<string>(marketplacePhone || business?.phone || '');
  const [description, setDescription] = useState<string>(marketplaceDescription || business?.description || '');
  
  const [onlineBooking, setOnlineBooking] = useState<boolean>(initialAllowOnlineBooking);
  const [isVisible, setIsVisible] = useState<boolean>(initialIsVisible);
  const [selectedIndustryTags, setSelectedIndustryTags] = useState<{ id: number; name: string }[]>(initialSelectedIndustryTags);

  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [industryTagsError, setIndustryTagsError] = useState<string | null>(null);

  // Clear/validate errors when toggle changes
  useEffect(() => {
    if (useBusinessName) {
      setNameError(null);
    } else {
      const error = validateBusinessName(name);
      setNameError(error);
    }
  }, [useBusinessName, name]);

  useEffect(() => {
    if (useBusinessEmail) {
      setEmailError(null);
    } else {
      // Validate when switching to custom email - use helper
      const error = requiredEmailError("Email", email);
      setEmailError(error);
    }
  }, [useBusinessEmail, email]);

  useEffect(() => {
    if (useBusinessPhone) {
      setPhoneError(null);
    } else {
      // Validate when switching to custom phone - replicate react-hook-form validation logic
      if (!phone || phone.trim().length === 0) {
        setPhoneError("Phone number is required");
      } else if (!isE164(phone)) {
        setPhoneError("Enter a valid phone number");
      } else {
        setPhoneError(null);
      }
    }
  }, [useBusinessPhone, phone]);

  useEffect(() => {
    if (useBusinessDescription) {
      setDescriptionError(null);
    } else {
      if (!description || !description.trim()) {
        setDescriptionError(null);
      } else {
        const error = validateDescription(description, 500);
        setDescriptionError(error);
      }
    }
  }, [useBusinessDescription, description]);

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handlePhoneChange = (value: string) => {
    const sanitized = sanitizePhoneToE164Draft(value);
    setPhone(sanitized);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
  };

  // Sync state when props change
  useEffect(() => {
    setUseBusinessName(initialUseBusinessName);
    setUseBusinessEmail(initialUseBusinessEmail);
    setUseBusinessPhone(initialUseBusinessPhone);
    setUseBusinessDescription(initialUseBusinessDescription);
    setName(marketplaceName || business?.name || '');
    setEmail(marketplaceEmail || business?.email || '');
    setPhone(marketplacePhone || business?.phone || '');
    setDescription(marketplaceDescription || business?.description || '');
    setOnlineBooking(initialAllowOnlineBooking);
    setIsVisible(initialIsVisible);
    setSelectedIndustryTags(initialSelectedIndustryTags);
  }, [
    initialUseBusinessName,
    initialUseBusinessEmail,
    initialUseBusinessPhone,
    initialUseBusinessDescription,
    marketplaceName,
    marketplaceEmail,
    marketplacePhone,
    marketplaceDescription,
    business?.name,
    business?.email,
    business?.phone,
    business?.description,
    initialAllowOnlineBooking,
    initialIsVisible,
    initialSelectedIndustryTags,
  ]);

  // Check if profile details are dirty
  const isDirty = useMemo(() => {
    return (
      useBusinessName !== initialUseBusinessName ||
      useBusinessEmail !== initialUseBusinessEmail ||
      useBusinessPhone !== initialUseBusinessPhone ||
      useBusinessDescription !== initialUseBusinessDescription ||
      name !== (marketplaceName || business?.name || '') ||
      email !== (marketplaceEmail || business?.email || '') ||
      phone !== (marketplacePhone || business?.phone || '') ||
      description !== (marketplaceDescription || business?.description || '') ||
      onlineBooking !== initialAllowOnlineBooking ||
      isVisible !== initialIsVisible ||
      JSON.stringify(selectedIndustryTags.map(t => t.id).sort()) !== JSON.stringify(initialSelectedIndustryTags.map(t => t.id).sort())
    );
  }, [
    useBusinessName, initialUseBusinessName,
    useBusinessEmail, initialUseBusinessEmail,
    useBusinessPhone, initialUseBusinessPhone,
    useBusinessDescription, initialUseBusinessDescription,
    name, marketplaceName, business?.name,
    email, marketplaceEmail, business?.email,
    phone, marketplacePhone, business?.phone,
    description, marketplaceDescription, business?.description,
    onlineBooking, initialAllowOnlineBooking,
    isVisible, initialIsVisible,
    selectedIndustryTags, initialSelectedIndustryTags
  ]);

  // Check if there are validation errors (only matters when using custom contact)
  const hasValidationErrors = useMemo(() => {
    // Check custom business name errors
    if (!useBusinessName && nameError) {
      return true;
    }

    // If using business contact for both, no validation errors matter
    if (useBusinessEmail && useBusinessPhone) {
      return false;
    }
    
    // If using custom email, check if there's an error
    if (!useBusinessEmail && emailError) {
      return true;
    }
    
    // If using custom phone, check if there's an error
    if (!useBusinessPhone && phoneError) {
      return true;
    }

    // Check custom business description errors
    if (!useBusinessDescription && descriptionError) {
      return true;
    }

    if (selectedIndustryTags.length === 0) {
      return true;
    }
    
    return false;
  }, [useBusinessName, nameError, useBusinessEmail, useBusinessPhone, emailError, phoneError, useBusinessDescription, descriptionError, selectedIndustryTags]);

  // Validate before save
  const validateBeforeSave = () => {
    let isValid = true;

    // Validate custom business name
    if (!useBusinessName) {
      const error = validateBusinessName(name);
      setNameError(error);
      if (error) isValid = false;
    }

    // Only validate custom fields
    if (!useBusinessEmail) {
      const error = requiredEmailError("Email", email);
      setEmailError(error);
      if (error) isValid = false;
    }

    if (!useBusinessPhone) {
      if (!phone || phone.trim().length === 0) {
        setPhoneError("Phone number is required");
        isValid = false;
      } else if (!isE164(phone)) {
        setPhoneError("Enter a valid phone number");
        isValid = false;
      }
    }

    // Validate custom business description
    if (!useBusinessDescription && description && description.trim()) {
      const error = validateDescription(description, 500);
      setDescriptionError(error);
      if (error) isValid = false;
    }

    // Validate industry tags
    if (selectedIndustryTags.length === 0) {
      setIndustryTagsError("Please select at least one industry tag");
      isValid = false;
    } else {
      setIndustryTagsError(null);
    }

    return isValid;
  };

  return {
    // State
    useBusinessName,
    useBusinessEmail,
    useBusinessPhone,
    useBusinessDescription,
    name,
    email,
    phone,
    description,
    onlineBooking,
    isVisible,
    selectedIndustryTags,
    isDirty,
    nameError,
    emailError,
    phoneError,
    descriptionError,
    industryTagsError,
    hasValidationErrors,
    // Setters
    setUseBusinessName,
    setUseBusinessEmail,
    setUseBusinessPhone,
    setUseBusinessDescription,
    setName: handleNameChange,
    setEmail: handleEmailChange,
    setPhone: handlePhoneChange,
    setDescription,
    setOnlineBooking,
    setIsVisible,
    setSelectedIndustryTags,
    validateBeforeSave,
  };
}

