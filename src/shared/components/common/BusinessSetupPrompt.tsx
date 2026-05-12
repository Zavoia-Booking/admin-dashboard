import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, Users, Wrench } from 'lucide-react';
import {
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalPrimary,
  ModalArrow,
} from '../ui/modal-tokens';

interface BusinessSetupPromptProps {
  eyebrow?: string;
  title?: string;
  message?: string;
  ctaLabel?: string;
  onClickNavigateTo?: string; // default: '/welcome'
}

const BusinessSetupPrompt: React.FC<BusinessSetupPromptProps> = ({
  eyebrow = 'Setup · Required',
  title = 'Complete your business setup',
  message = 'Before inviting team members, creating services, or adding locations, please finish setting up your business information.',
  ctaLabel = 'Finish business setup',
  onClickNavigateTo = '/welcome',
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-7 sm:p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col items-center gap-5">
        <div className="inline-flex items-center gap-3 rounded-full bg-neutral-100 px-4 py-2 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          <Building2 className="h-5 w-5" />
          <Users className="h-5 w-5" />
          <Wrench className="h-5 w-5" />
          <MapPin className="h-5 w-5" />
        </div>
        {eyebrow && <div className={modalEyebrow}>{eyebrow}</div>}
        <h3 className={modalTitleCompact}>{title}</h3>
        <p className={`mx-auto max-w-[420px] ${modalBody}`}>{message}</p>
        {ctaLabel && (
          <button
            type="button"
            onClick={() => navigate(onClickNavigateTo)}
            className={`${modalPrimary} mt-1`}
          >
            <span>{ctaLabel}</span>
            <ModalArrow />
          </button>
        )}
      </div>
    </div>
  );
};

export default BusinessSetupPrompt;
