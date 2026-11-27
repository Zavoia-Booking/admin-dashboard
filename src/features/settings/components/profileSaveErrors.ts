import { isAxiosError } from 'axios';
import type { TFunction } from 'i18next';
import { getErrorMessage, getValidationFieldErrors } from '../../../shared/utils/error';

export const profileLinkLimits = {
  instagramUrl: 150,
  facebookUrl: 150,
  tiktokUrl: 255,
  websiteUrl: 255,
  pinterestUrl: 255,
} as const;

export function profileSaveErrors(error: unknown, t: TFunction): Record<string, string> {
  if (!isAxiosError(error)) return {};
  const data = error.response?.data;
  const fields = getValidationFieldErrors(error);
  const messages: Record<string, string> = {};

  // A server still on the previous DTO may reject the new name properties.
  // This is a request-level compatibility failure the user cannot fix by editing.
  if (fields && Object.values(fields).some(rules => rules.includes('whitelistValidation'))) return {};

  if (fields) {
    for (const [field, rules] of Object.entries(fields)) {
      if (Object.hasOwn(profileLinkLimits, field)) {
        const max = profileLinkLimits[field as keyof typeof profileLinkLimits];
        messages[field] = rules.includes('maxLength')
          ? t('common:validation.maxLengthGeneric', { max })
          : t('common:validation.url');
      } else if (field === 'firstName' || field === 'lastName' || field === 'name') {
        const isBusinessName = field === 'name';
        const key = isBusinessName ? 'businessName' : field;
        if (rules.includes('isNotEmpty')) {
          messages[key] = isBusinessName ? t('common:validation.businessName') :
            t('common:validation.required', { field: t(`common:validation.fields.${field}`) });
        } else if (rules.includes('minLength')) {
          messages[key] = t('common:validation.minLength2Generic');
        } else if (rules.includes('maxLength')) {
          messages[key] = t('common:validation.maxLengthGeneric', { max: isBusinessName ? 70 : 32 });
        } else {
          messages[key] = t(isBusinessName ? 'common:validation.nameSpecialChars' : 'common:validation.personNameSpecialChars');
        }
      } else if (field === 'phone') {
        messages.businessPhone = t('common:validation.phoneInvalid');
      } else if (field === 'industryId') {
        messages.industryId = t(rules.includes('exists') ? 'messages:BUSINESS.E04' : 'common:validation.industryRequired');
      } else if (field === 'businessCurrency') {
        messages.businessCurrency = t('common:validation.currencyInvalid');
      } else if (field === 'description') {
        messages.description = t('common:validation.descriptionUnsafeChars');
      }
    }
  }

  // Older API deployments return only these messages during a rolling update.
  const legacy = Array.isArray(data?.message) ? data.message : [data?.message];
  if (!messages.websiteUrl && legacy.includes('websiteUrl must be a valid URL')) {
    messages.websiteUrl = t('common:validation.url');
  }
  if (!messages.industryId && legacy.includes('BUSINESS.E04')) {
    messages.industryId = t('messages:BUSINESS.E04');
  }
  return messages;
}

export function profileRequestError(error: unknown, fallback: string): string {
  if (isAxiosError(error) && (!error.response || error.response.status === 429)) {
    return getErrorMessage(error, fallback);
  }
  return fallback;
}
