import React from "react";
import { Link } from "react-router-dom";
import type { Business } from "../../types";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import { InheritedEditPanel } from "../../../../shared/components/common/InheritedEditPanel";
import { ContactInput } from "../../../../shared/components/common/ContactInformationToggle";
import { ArrowUpRight, Building2, Mail, Phone, type LucideIcon } from "lucide-react";
import { TextField } from "../../../../shared/components/forms/fields/TextField";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import { Trans, useTranslation } from "react-i18next";

const CARD = "rounded-2xl border border-border bg-surface p-4";
// Full width on phones and tablets, 40% of the row on desktop.
const FIELD_WIDTH = "w-full lg:w-2/5";

const ValueLine = ({ icon: Icon, value, empty }: { icon: LucideIcon; value?: string | null; empty: string }) => (
  <span className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-foreground-1">
    <Icon className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
    {value ? value : <span className="font-normal text-foreground-3 dark:text-foreground-2">{empty}</span>}
  </span>
);

// Same look as the Settings link on the industry card.
const BusinessProfileLink = ({ children }: { children?: React.ReactNode }) => (
  <Link
    to="/account"
    className="inline-flex items-center gap-0.5 rounded-sm font-semibold text-foreground-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
  >
    {children}
    <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden="true" />
  </Link>
);

interface MarketplaceDetailsSectionProps {
  business: Business | null;
  useBusinessName: boolean;
  setUseBusinessName: (value: boolean) => void;
  name: string;
  setName: (value: string) => void;
  useBusinessEmail: boolean;
  setUseBusinessEmail: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  useBusinessPhone: boolean;
  setUseBusinessPhone: (value: boolean) => void;
  phone: string;
  setPhone: (value: string) => void;
  useBusinessDescription: boolean;
  setUseBusinessDescription: (value: boolean) => void;
  description: string;
  setDescription: (value: string) => void;
  nameError?: string;
  emailError?: string;
  phoneError?: string;
  descriptionError?: string;
  brandPhoto?: React.ReactNode;
}

export const MarketplaceDetailsSection: React.FC<
  MarketplaceDetailsSectionProps
> = ({
  business,
  useBusinessName,
  setUseBusinessName,
  name,
  setName,
  useBusinessEmail,
  setUseBusinessEmail,
  email,
  setEmail,
  useBusinessPhone,
  setUseBusinessPhone,
  phone,
  setPhone,
  useBusinessDescription,
  setUseBusinessDescription,
  description,
  setDescription,
  nameError,
  emailError,
  phoneError,
  descriptionError,
  brandPhoto,
}) => {
  const { t } = useTranslation("marketplace");
  const empty = t("details.businessName.notAvailable");
  const shownDescription = useBusinessDescription ? business?.description : description;

  return (
    <div className="space-y-6">
      <SectionDivider
        title={t("details.title")}
        className="uppercase tracking-wider text-foreground-2"
      />

      <InheritedEditPanel
        id="marketplace-name"
        className={CARD}
        title={t("details.businessName.label")}
        helperText={
          useBusinessName
            ? t("details.businessName.useBusinessDescription")
            : t("details.businessName.customDescription")
        }
        summary={<ValueLine icon={Building2} value={useBusinessName ? business?.name : name} empty={empty} />}
        isCustom={!useBusinessName}
        revertLabel={t("details.businessName.useBusiness")}
        onRevert={() => setUseBusinessName(true)}
        forceOpen={!!nameError}
      >
        <div className={FIELD_WIDTH}>
          <TextField
            id="marketplace-name-field"
            label={t("details.businessName.customLabel")}
            placeholder={t("details.businessName.placeholder")}
            value={useBusinessName ? business?.name || "" : name}
            onChange={(v) => {
              if (useBusinessName) setUseBusinessName(false);
              setName(v);
            }}
            error={nameError}
            required={false}
            icon={Building2}
            className="!pt-0"
          />
        </div>
      </InheritedEditPanel>

      <div className={CARD} role="group" aria-labelledby="marketplace-contact-title">
        <p id="marketplace-contact-title" className="text-base font-medium text-foreground-1">
          {t("details.contact.title")}
        </p>
        <p className="mt-1 text-sm text-foreground-3 dark:text-foreground-2">
          {useBusinessEmail && useBusinessPhone
            ? t("details.contact.helperTextOn")
            : t("details.contact.helperTextOff")}
        </p>

        <InheritedEditPanel
          id="marketplace-email"
          className="mt-4 border-t border-border-subtle pt-4"
          title={t("details.contact.emailLabel")}
          titleFor="marketplace-email-field"
          titleClassName="text-sm"
          summary={<ValueLine icon={Mail} value={useBusinessEmail ? business?.email : email} empty={empty} />}
          isCustom={!useBusinessEmail}
          revertLabel={t("details.contact.useBusinessEmail")}
          onRevert={() => setUseBusinessEmail(true)}
          forceOpen={!!emailError}
        >
          <div className={FIELD_WIDTH}>
            <ContactInput
              id="marketplace-email-field"
              kind="email"
              value={useBusinessEmail ? business?.email || "" : email}
              onChange={(v) => {
                if (useBusinessEmail) setUseBusinessEmail(false);
                setEmail(v);
              }}
              error={emailError}
            />
          </div>
        </InheritedEditPanel>

        <InheritedEditPanel
          id="marketplace-phone"
          className="mt-4 border-t border-border-subtle pt-4"
          title={t("details.contact.phoneLabel")}
          titleFor="marketplace-phone-field"
          titleClassName="text-sm"
          summary={<ValueLine icon={Phone} value={useBusinessPhone ? business?.phone : phone} empty={empty} />}
          isCustom={!useBusinessPhone}
          revertLabel={t("details.contact.useBusinessPhone")}
          onRevert={() => setUseBusinessPhone(true)}
          forceOpen={!!phoneError}
        >
          <div className={FIELD_WIDTH}>
            <ContactInput
              id="marketplace-phone-field"
              kind="phone"
              value={useBusinessPhone ? business?.phone || "" : phone}
              onChange={(v) => {
                if (useBusinessPhone) setUseBusinessPhone(false);
                setPhone(v);
              }}
              error={phoneError}
            />
          </div>
        </InheritedEditPanel>
      </div>

      {/* Brand photo sits right above the description on every screen size. */}
      {brandPhoto}

      <InheritedEditPanel
        id="marketplace-description"
        className={CARD}
        title={t("details.description.label")}
        titleFor="marketplaceDescription"
        helperText={
          useBusinessDescription ? (
            <Trans
              t={t}
              i18nKey="details.description.useBusinessDescription"
              components={{ settingsLink: <BusinessProfileLink /> }}
            />
          ) : (
            t("details.description.customDescription")
          )
        }
        summary={
          shownDescription ? (
            <p className="text-sm leading-relaxed text-foreground-1">{shownDescription}</p>
          ) : (
            <p className="text-sm text-foreground-3 dark:text-foreground-2">{empty}</p>
          )
        }
        isCustom={!useBusinessDescription}
        revertLabel={t("details.description.useBusiness")}
        onRevert={() => setUseBusinessDescription(true)}
        forceOpen={!!descriptionError}
      >
        <TextareaField
          id="marketplaceDescription"
          label=""
          placeholder={t("details.description.placeholder")}
          value={useBusinessDescription ? business?.description || "" : description}
          onChange={(v) => {
            if (useBusinessDescription) setUseBusinessDescription(false);
            setDescription(v);
          }}
          maxLength={500}
          rows={3}
          error={descriptionError}
          className="!pt-0"
        />
      </InheritedEditPanel>
    </div>
  );
};

export default MarketplaceDetailsSection;
