import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Business } from '../types';
import { requiredEmailError, isE164, sanitizePhoneToE164Draft, validateBusinessName, validateDescription } from '../../../shared/utils/validation';

interface UseProfileDetailsProps {
  business: Business | null;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplacePhone?: string | null;
  marketplaceDescription?: string | null;
  // Business-page (microsite) content
  tagline?: string | null;
  aboutContent?: string | null;
  brandColorHex?: string | null;
  businessSlug?: string | null;
  useBusinessName: boolean;
  useBusinessEmail: boolean;
  useBusinessPhone: boolean;
  useBusinessDescription: boolean;
  selectedIndustryTags: { id: number; name: string }[];
}

export function useProfileDetails({
  business,
  marketplaceName,
  marketplaceEmail,
  marketplacePhone,
  marketplaceDescription,
  tagline: initialTagline,
  aboutContent: initialAboutContent,
  brandColorHex: initialBrandColorHex,
  businessSlug: initialBusinessSlug,
  useBusinessName: initialUseBusinessName,
  useBusinessEmail: initialUseBusinessEmail,
  useBusinessPhone: initialUseBusinessPhone,
  useBusinessDescription: initialUseBusinessDescription,
  selectedIndustryTags: initialSelectedIndustryTags,
}: UseProfileDetailsProps) {
  const { t } = useTranslation('marketplace');
  const [useBusinessName, setUseBusinessName] = useState<boolean>(initialUseBusinessName);
  const [useBusinessEmail, setUseBusinessEmail] = useState<boolean>(initialUseBusinessEmail);
  const [useBusinessPhone, setUseBusinessPhone] = useState<boolean>(initialUseBusinessPhone);
  const [useBusinessDescription, setUseBusinessDescription] = useState<boolean>(initialUseBusinessDescription);

  const [name, setName] = useState<string>(marketplaceName || business?.name || '');
  const [email, setEmail] = useState<string>(marketplaceEmail || business?.email || '');
  const [phone, setPhone] = useState<string>(marketplacePhone || business?.phone || '');
  const [description, setDescription] = useState<string>(marketplaceDescription || business?.description || '');

  // Business-page (microsite) content
  const [tagline, setTagline] = useState<string>(initialTagline || '');
  const [aboutContent, setAboutContent] = useState<string>(initialAboutContent || '');
  const [brandColorHex, setBrandColorHex] = useState<string>(initialBrandColorHex || '');
  const [businessSlug, setBusinessSlug] = useState<string>(initialBusinessSlug || '');

  const [selectedIndustryTags, setSelectedIndustryTags] = useState<{ id: number; name: string }[]>(initialSelectedIndustryTags);

  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [industryTagsError, setIndustryTagsError] = useState<string | null>(null);
  // Business-page field errors (format only; slug uniqueness is checked separately + on publish)
  const [taglineError, setTaglineError] = useState<string | null>(null);
  const [brandColorError, setBrandColorError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Clear/validate errors when toggle changes
  useEffect(() => {
    if (useBusinessName) {
      setNameError(null);
    } else {
      const error = validateBusinessName(name, t);
      setNameError(error);
    }
  }, [useBusinessName, name, t]);

  useEffect(() => {
    if (useBusinessEmail) {
      setEmailError(null);
    } else {
      const error = requiredEmailError('email', email, t);
      setEmailError(error);
    }
  }, [useBusinessEmail, email, t]);

  useEffect(() => {
    if (useBusinessPhone) {
      setPhoneError(null);
    } else {
      if (!phone || phone.trim().length === 0) {
        setPhoneError(t('common:validation.phoneRequired'));
      } else if (!isE164(phone)) {
        setPhoneError(t('common:validation.phoneInvalid'));
      } else {
        setPhoneError(null);
      }
    }
  }, [useBusinessPhone, phone, t]);

  useEffect(() => {
    if (useBusinessDescription) {
      setDescriptionError(null);
    } else {
      if (!description || !description.trim()) {
        setDescriptionError(null);
      } else {
        const error = validateDescription(description, t, 500);
        setDescriptionError(error);
      }
    }
  }, [useBusinessDescription, description, t]);

  // Business-page field validation (all optional; only flag malformed non-empty values)
  useEffect(() => {
    setTaglineError(tagline.length > 200 ? t('businessPage.errors.taglineTooLong') : null);
  }, [tagline, t]);

  useEffect(() => {
    setBrandColorError(
      brandColorHex && !/^#[0-9a-fA-F]{6}$/.test(brandColorHex)
        ? t('businessPage.errors.brandColorInvalid')
        : null,
    );
  }, [brandColorHex, t]);

  useEffect(() => {
    setSlugError(
      businessSlug && !/^[a-z0-9-]{3,100}$/.test(businessSlug)
        ? t('businessPage.errors.slugInvalid')
        : null,
    );
  }, [businessSlug, t]);

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
    setTagline(initialTagline || '');
    setAboutContent(initialAboutContent || '');
    setBrandColorHex(initialBrandColorHex || '');
    setBusinessSlug(initialBusinessSlug || '');
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
    initialTagline,
    initialAboutContent,
    initialBrandColorHex,
    initialBusinessSlug,
    business?.name,
    business?.email,
    business?.phone,
    business?.description,
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
      tagline !== (initialTagline || '') ||
      aboutContent !== (initialAboutContent || '') ||
      brandColorHex !== (initialBrandColorHex || '') ||
      businessSlug !== (initialBusinessSlug || '') ||
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
    tagline, initialTagline,
    aboutContent, initialAboutContent,
    brandColorHex, initialBrandColorHex,
    businessSlug, initialBusinessSlug,
    selectedIndustryTags, initialSelectedIndustryTags
  ]);

  // Check if there are validation errors (only matters when using custom contact)
  const hasValidationErrors = useMemo(() => {
    // Check custom business name errors
    if (!useBusinessName && nameError) {
      return true;
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

    // Malformed business-page fields block publish.
    if (taglineError || brandColorError || slugError) {
      return true;
    }

    return false;
  }, [useBusinessName, nameError, useBusinessEmail, useBusinessPhone, emailError, phoneError, useBusinessDescription, descriptionError, selectedIndustryTags, taglineError, brandColorError, slugError]);

  // Validate before save
  const validateBeforeSave = () => {
    let isValid = true;

    // Validate custom business name
    if (!useBusinessName) {
      const error = validateBusinessName(name, t);
      setNameError(error);
      if (error) isValid = false;
    }

    // Only validate custom fields
    if (!useBusinessEmail) {
      const error = requiredEmailError('email', email, t);
      setEmailError(error);
      if (error) isValid = false;
    }

    if (!useBusinessPhone) {
      if (!phone || phone.trim().length === 0) {
        setPhoneError(t('common:validation.phoneRequired'));
        isValid = false;
      } else if (!isE164(phone)) {
        setPhoneError(t('common:validation.phoneInvalid'));
        isValid = false;
      }
    }

    // Validate custom business description
    if (!useBusinessDescription && description && description.trim()) {
      const error = validateDescription(description, t, 500);
      setDescriptionError(error);
      if (error) isValid = false;
    }

    // Validate industry tags
    if (selectedIndustryTags.length === 0) {
      setIndustryTagsError(t('common:validation.industryTagsRequired'));
      isValid = false;
    } else {
      setIndustryTagsError(null);
    }

    // Validate business-page fields (optional, but reject malformed non-empty values)
    if (tagline.length > 200) {
      setTaglineError(t('businessPage.errors.taglineTooLong'));
      isValid = false;
    }
    if (brandColorHex && !/^#[0-9a-fA-F]{6}$/.test(brandColorHex)) {
      setBrandColorError(t('businessPage.errors.brandColorInvalid'));
      isValid = false;
    }
    if (businessSlug && !/^[a-z0-9-]{3,100}$/.test(businessSlug)) {
      setSlugError(t('businessPage.errors.slugInvalid'));
      isValid = false;
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
    tagline,
    aboutContent,
    brandColorHex,
    businessSlug,
    selectedIndustryTags,
    isDirty,
    nameError,
    emailError,
    phoneError,
    descriptionError,
    industryTagsError,
    taglineError,
    brandColorError,
    slugError,
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
    setTagline,
    setAboutContent,
    setBrandColorHex,
    setBusinessSlug,
    setSelectedIndustryTags,
    validateBeforeSave,
  };
}

