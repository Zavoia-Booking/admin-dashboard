import type { TFunction } from "i18next";
import type { BusinessNotification } from "./types";

/**
 * Notifications are stored with an English title/body plus their type and
 * data. The list renders them from type + data in the language the dashboard
 * is in now, so one business-wide notification reads right for each viewer and
 * follows a language switch. The stored English text stays the fallback: for
 * types without a translation here, and for rows created before their data
 * carried every field the text needs.
 */

// Stand-ins the API wrote into data.customerName when a booking had no name.
const PLACEHOLDER_CUSTOMER_NAMES = new Set(["", "A customer", "Customer", "Walk-in"]);

interface LocalizedNotification {
  title: string;
  body: string;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function dateLocale(language: string): string {
  return language.toLowerCase().startsWith("ro") ? "ro-RO" : "en-GB";
}

function formatDateTime(iso: unknown, language: string): string | null {
  const value = str(iso);
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(dateLocale(language), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function localizeNotification(
  notification: BusinessNotification,
  t: TFunction,
  language: string,
): LocalizedNotification {
  const stored = { title: notification.title, body: notification.body };
  const data = notification.data ?? {};
  const key = `items.${notification.type}`;

  const customer = (name: unknown, fallbackKey = "items.fallbackCustomer") => {
    const value = str(name);
    return value && !PLACEHOLDER_CUSTOMER_NAMES.has(value) ? value : t(fallbackKey);
  };
  const service = str(data.serviceName) ?? t("items.fallbackService");

  switch (notification.type) {
    case "appointment_cancelled_by_customer":
    case "appointment_assigned":
    case "appointment_unassigned":
    case "appointment_cancelled": {
      const date = formatDateTime(data.scheduledAt, language);
      if (!date || !("customerName" in data)) return stored;
      return {
        title: t(`${key}.title`),
        body: t(`${key}.body`, { customer: customer(data.customerName), service, date }),
      };
    }

    case "appointment_rescheduled_by_customer":
    case "appointment_rescheduled_by_team_member":
    case "appointment_rescheduled": {
      const from = formatDateTime(data.originalScheduledAt, language);
      const to = formatDateTime(data.newScheduledAt, language);
      if (!from || !to || !("customerName" in data)) return stored;
      return {
        title: t(`${key}.title`),
        body: t(`${key}.body`, { customer: customer(data.customerName), service, from, to }),
      };
    }

    case "appointment_status_review": {
      const list = Array.isArray(data.appointments) ? data.appointments : null;
      if (!list || list.length === 0) return stored;
      const count = list.length;
      const lines = list.map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return t(`${key}.line`, {
          time: str(row.time) ?? "",
          customer: customer(row.customerName, "items.walkIn"),
          service: str(row.serviceName) ?? t("items.fallbackService"),
        });
      });
      return {
        title: t(`${key}.title`, { count }),
        body: `${t(`${key}.body`, { count })}\n\n${lines.join("\n")}`,
      };
    }

    case "sms_credits_low": {
      const count = data.remainingCredits;
      if (typeof count !== "number") return stored;
      return { title: t(`${key}.title`), body: t(`${key}.body`, { count }) };
    }

    case "sms_credits_depleted":
    case "support_reply":
      return { title: t(`${key}.title`), body: t(`${key}.body`) };

    case "team_member_accepted_invitation":
    case "team_member_left_organisation": {
      const member = str(data.memberName);
      if (!member) return stored;
      return { title: t(`${key}.title`), body: t(`${key}.body`, { member }) };
    }

    default:
      return stored;
  }
}
