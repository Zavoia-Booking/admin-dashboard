import { User } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../ui/avatar";
import { cn } from "../../lib/utils";
import { getAvatarBgColor } from "../../../features/setupWizard/components/StepTeam";

/**
 * Person avatar — single source of truth for how we render a customer,
 * team member, or professional avatar across the entire app (reviews,
 * calendar, assignments, dashboard, etc).
 *
 * Recipe:
 * - Hash-derived pastel HSL background per person via `getAvatarBgColor`
 * - Uppercased initials when first/last name is present
 * - Lucide `<User />` icon fallback when the person has no name (guests)
 * - Hairline border via `border border-border`
 * - Foreground-1 initials text (semantic, theme-aware)
 *
 * Sizing + typography are consumer-controlled via className /
 * initialsClassName / iconClassName so the component fits every surface
 * without encoding context-specific defaults.
 */

export function getPersonInitials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function getPersonColorKey(
  id: number | string,
  firstName?: string,
  lastName?: string,
): string {
  return `${id}-${firstName ?? ""}-${lastName ?? ""}`;
}

interface PersonAvatarProps {
  /**
   * Stable identifier used to seed the deterministic pastel background.
   * Pass a customer/staff numeric id when available, otherwise the email
   * or any other unique-per-person string.
   */
  id: number | string;
  firstName?: string;
  lastName?: string;
  profileImage?: string | null;
  /**
   * Optional CSS color string that wins over the hash-derived background.
   * Used by calendar staff avatars to adopt the active `staffColorMap` color
   * when `colorCoding='staff'` is on, so avatars stay in sync with the
   * appointment block they belong to.
   */
  colorOverride?: string;
  /** Sizing + extra classes (e.g. `"size-6 mt-0.5"`, `"h-10 w-10"`). */
  className?: string;
  /** Text size + weight for the fallback initials (e.g. `"text-[10px] font-semibold"`). */
  initialsClassName?: string;
  /** Size class for the `<User />` icon shown when the person has no name. Defaults to `h-1/2 w-1/2`. */
  iconClassName?: string;
}

export function PersonAvatar({
  id,
  firstName,
  lastName,
  profileImage,
  colorOverride,
  className,
  initialsClassName,
  iconClassName,
}: PersonAvatarProps) {
  const initials = getPersonInitials(firstName, lastName);
  const hashedBg = getAvatarBgColor(getPersonColorKey(id, firstName, lastName));
  const backgroundColor = colorOverride ?? hashedBg;

  return (
    <Avatar className={cn("shrink-0 border border-border", className)}>
      {profileImage && (
        <AvatarImage src={profileImage} alt={firstName ?? ""} />
      )}
      {initials ? (
        <AvatarFallback
          className={cn("leading-none text-foreground-1", initialsClassName)}
          style={{ backgroundColor }}
        >
          {initials}
        </AvatarFallback>
      ) : (
        <AvatarFallback className="bg-surface-active text-foreground-3 leading-none">
          <User className={cn("h-1/2 w-1/2", iconClassName)} />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
