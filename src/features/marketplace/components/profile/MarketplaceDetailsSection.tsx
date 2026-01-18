import React, { useState } from "react";
import { Switch } from "../../../../shared/components/ui/switch";
import type { Business } from "../../types";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import ContactInformationToggle from "../../../../shared/components/common/ContactInformationToggle";
import { Building2 } from "lucide-react";
import { TextField } from "../../../../shared/components/forms/fields/TextField";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import { cn } from "../../../../shared/lib/utils";
import { Badge } from "../../../../shared/components/ui/badge";
import { useTranslation } from "react-i18next";

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
}) => {
  const [focusName, setFocusName] = useState(false);
  const [focusContact, setFocusContact] = useState(false);
  const [focusDescription, setFocusDescription] = useState(false);
  const { t } = useTranslation("marketplace");

  return (
    <div className="space-y-6">
      <SectionDivider
        title={t("details.title")}
        className="uppercase tracking-wider text-foreground-2"
      />

      {/* Business Name Card */}
      <div
        className={cn(
          "group relative rounded-2xl p-4 border transition-all duration-300 flex flex-col gap-3",
          useBusinessName
            ? "border-info-300 bg-info-100 dark:bg-surface-hover/30 dark:border-border-strong"
            : "bg-surface-active dark:bg-surface border-border"
        )}
      >
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              "text-base font-medium cursor-pointer",
              useBusinessName ? "text-neutral-900 dark:text-foreground-1" : "text-foreground-1"
            )}
          >
            {t("details.businessName.label")}
          </h3>
          <Switch
            checked={useBusinessName}
            onCheckedChange={(checked) => {
              setUseBusinessName(checked);
              if (!checked) setFocusName(true);
            }}
            className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
          />
        </div>
        <p
          className={cn(
            "text-sm",
            useBusinessName
              ? "text-neutral-900 dark:text-foreground-2"
              : "text-foreground-3 dark:text-foreground-2"
          )}
        >
          {useBusinessName
            ? t("details.businessName.useBusinessDescription")
            : t("details.businessName.customDescription")}
        </p>

        {useBusinessName ? (
          <div className="text-sm pt-4 border-t border-info-200">
            <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-foreground-1 font-medium w-fit">
              <Building2 className="h-4 w-4 text-neutral-900 dark:text-foreground-1" />
              {business?.name || "N/A"}
            </span>
          </div>
        ) : (
          <div className="mt-4 pt-2 border-t border-border">
            <TextField
              id="marketplace-name-field"
              label={t("details.businessName.customLabel")}
              placeholder={t("details.businessName.placeholder")}
              value={name}
              onChange={(v) => {
                setName(v);
                setFocusName(false);
              }}
              error={nameError}
              required={false}
              icon={Building2}
              className="!pt-0"
              autoFocus={focusName}
            />
          </div>
        )}

        {!useBusinessName && (
          <div className="absolute bottom-3 right-4 pointer-events-none">
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
            >
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-neutral-900 dark:text-foreground-1">
                {t("details.businessName.custom")}
              </span>
            </Badge>
          </div>
        )}
      </div>

      <ContactInformationToggle
        id="marketplace-contact-toggle"
        useInheritedContact={useBusinessEmail && useBusinessPhone}
        onToggleChange={(checked) => {
          setUseBusinessEmail(checked);
          setUseBusinessPhone(checked);
          if (!checked) setFocusContact(true);
        }}
        inheritedEmail={business?.email || ""}
        inheritedPhone={business?.phone || ""}
        inheritedLabel={t("details.contact.inheritedLabel")}
        localEmail={email}
        onEmailChange={(v) => {
          setEmail(v);
          setFocusContact(false);
        }}
        localPhone={phone}
        onPhoneChange={setPhone}
        emailError={emailError}
        phoneError={phoneError}
        showPhone={true}
        showEmail={true}
        title={t("details.contact.title")}
        emailLabel={t("details.contact.emailLabel")}
        phoneLabel={t("details.contact.phoneLabel")}
        helperTextOn={t("details.contact.helperTextOn")}
        helperTextOff={t("details.contact.helperTextOff")}
        className="!rounded-2xl"
        autoFocusOnToggle={focusContact}
      />

      {/* Business Description Card */}
      <div
        className={cn(
          "group relative rounded-2xl p-4 border transition-all duration-300 flex flex-col gap-3",
          useBusinessDescription
            ? "bg-white dark:bg-surface border-border"
            : "border-border-strong bg-surface-active dark:bg-surface shadow-sm"
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-foreground-1 cursor-pointer">
            {t("details.description.label")}
          </h3>
          <Switch
            checked={useBusinessDescription}
            onCheckedChange={(checked) => {
              setUseBusinessDescription(checked);
              if (!checked) setFocusDescription(true);
            }}
            className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
          />
        </div>
        <p
          className={cn(
            "text-sm",
            useBusinessDescription
              ? "text-foreground-3 dark:text-foreground-2"
              : "text-foreground-2"
          )}
        >
          {useBusinessDescription
            ? t("details.description.useBusinessDescription")
            : t("details.description.customDescription")}
        </p>

        <div className="relative">
          {useBusinessDescription ? (
            <div
              className={cn(
                "p-4 rounded-xl border transition-colors min-h-[100px] flex items-center",
                business?.description
                  ? "bg-muted/30 dark:bg-neutral-900 border-border hover:border-border-strong"
                  : "bg-muted/10 dark:bg-muted/5 border-dashed border-border-strong/30"
              )}
            >
              {business?.description ? (
                <p className="text-sm text-foreground-2 dark:text-foreground-1 leading-relaxed">
                  {business.description}
                </p>
              ) : (
                <p className="text-sm text-foreground-3 dark:text-foreground-2 italic w-full text-left">
                  {t("details.description.noDescription")}
                </p>
              )}
            </div>
          ) : (
            <TextareaField
              id="marketplaceDescription"
              label=""
              placeholder={t("details.description.placeholder")}
              value={description}
              onChange={(v) => {
                setDescription(v);
                setFocusDescription(false);
              }}
              maxLength={500}
              rows={3}
              error={descriptionError}
              className="!pt-0"
              autoFocus={focusDescription}
            />
          )}
        </div>

        {!useBusinessDescription && (
          <div className="absolute bottom-3 right-4 pointer-events-none">
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
            >
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-neutral-900 dark:text-foreground-1">
                {t("details.description.custom")}
              </span>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceDetailsSection;
