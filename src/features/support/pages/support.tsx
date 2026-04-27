import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { PageHeader } from "../../../shared/components/layouts/PageHeader";
import { Button } from "../../../shared/components/ui/button";
import { Badge } from "../../../shared/components/ui/badge";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Spinner } from "../../../shared/components/ui/spinner";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { EmptyState } from "../../../shared/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../../shared/components/ui/dialog";
import {
  listTicketsAction,
  getTicketByIdAction,
  createTicketAction,
  addMessageAction,
  closeTicketAction,
  clearCurrentTicketAction,
} from "../actions";
import {
  getTicketsSelector,
  getCurrentTicketSelector,
  getTicketsLoadingSelector,
  getIsFetchingTicketSelector,
  getIsCreatingTicketSelector,
  getIsSendingMessageSelector,
  getIsClosingTicketSelector,
} from "../selectors";
import {
  Plus,
  ArrowLeft,
  MessageSquare,
  Bug,
  HelpCircle,
  Send,
  Lock,
  LifeBuoy,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { SupportTicket, TicketCategory, TicketStatus, TicketHistoryEntry } from "../types";
import { cn } from "../../../shared/lib/utils";

interface EnrichedHistoryEntry extends TicketHistoryEntry {
  timestamp?: string;
}

function formatRelativeDate(isoString: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t("dates.today");
  if (diffDays === 1) return t("dates.yesterday");
  if (diffDays < 7) return t("dates.daysAgo", { count: diffDays });
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getTicketHistory(ticket: SupportTicket): EnrichedHistoryEntry[] {
  if (ticket.details?.history) return ticket.details.history;
  if (ticket.details?.messages) {
    return ticket.details.messages.map((m) => ({
      message: m.text,
      createdBy: m.from === "admin" ? "admin" : ticket.createdBy,
      timestamp: m.timestamp,
    }));
  }
  return [];
}

const STATUS_CLASSES: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200",
  CLOSED: "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border-neutral-200",
  REOPENED: "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200",
};

const CATEGORY_ICONS: Record<TicketCategory, typeof Bug> = {
  bug: Bug,
  question: HelpCircle,
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation("support");
  const config = { label: t(`status.${status}`), className: STATUS_CLASSES[status] };
  return (
    <Badge className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: TicketCategory | null }) {
  const { t } = useTranslation("support");
  if (!category) return null;
  const Icon = CATEGORY_ICONS[category];
  const label = t(`category.${category}`);
  return (
    <Badge variant="outline" className="text-xs gap-1 text-foreground-2 border-border">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

const STATUS_ICONS: Record<TicketStatus, typeof Bug> = {
  OPEN: AlertTriangle,
  IN_PROGRESS: Clock,
  CLOSED: Lock,
  REOPENED: AlertTriangle,
};

function TicketCardSkeleton() {
  return (
    <div className="rounded-xl ring-1 ring-border bg-surface overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header: icon + id + date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
          <Skeleton className="h-3.5 w-14 rounded" />
        </div>
        {/* Subject */}
        <Skeleton className="h-4 w-3/4 rounded" />
        {/* Preview */}
        <Skeleton className="h-3.5 w-full rounded" />
        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}

function TicketListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <TicketCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="border-b border-border bg-surface-hover/40 flex-shrink-0 px-3 py-2.5 md:px-4 md:py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="flex items-center justify-between gap-2 pl-8 md:pl-9">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      {/* Messages skeleton */}
      <div className="flex-1 py-4 px-4 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-16 w-3/5 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-20 w-2/3 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-12 w-1/2 rounded-2xl" />
        </div>
      </div>
      {/* Input skeleton */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-border">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function TicketListItem({
  ticket,
  onClick,
}: {
  ticket: SupportTicket;
  onClick: () => void;
}) {
  const { t } = useTranslation("support");
  const messagesCount = ticket.messagesCount ?? getTicketHistory(ticket).length;
  const lastMsg = ticket.lastMessage?.message ?? getTicketHistory(ticket).at(-1)?.message ?? "";
  const subject = ticket.details?.subject || lastMsg;
  const subjectLine = subject.length > 80 ? subject.slice(0, 80) + "..." : subject;
  const hasExplicitSubject = !!ticket.details?.subject;
  const previewLine = hasExplicitSubject && lastMsg
    ? (lastMsg.length > 120 ? lastMsg.slice(0, 120) + "..." : lastMsg)
    : null;
  const StatusIcon = STATUS_ICONS[ticket.status];
  const isClosed = ticket.status === "CLOSED";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
        "bg-surface hover:bg-surface-hover",
        ticket.hasUnread
          ? "ring-1 ring-primary/30 hover:ring-primary/50"
          : "ring-1 ring-border hover:ring-border-strong",
      )}
    >
      {/* Top accent bar for unread tickets */}
      {ticket.hasUnread && (
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
      )}

      <div className="p-4 space-y-3">
        {/* Header: Status icon + ID + Date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-lg",
              isClosed
                ? "bg-neutral-100 dark:bg-neutral-800"
                : ticket.status === "IN_PROGRESS"
                  ? "bg-warning-bg"
                  : "bg-info-bg",
            )}>
              <StatusIcon className={cn(
                "h-3.5 w-3.5",
                isClosed
                  ? "text-neutral-500 dark:text-neutral-400"
                  : ticket.status === "IN_PROGRESS"
                    ? "text-warning"
                    : "text-info",
              )} />
            </div>
            <span className="text-xs font-medium text-foreground-3 tabular-nums">
              {t("ticket.ticketId", { id: ticket.id })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {ticket.hasUnread && (
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
            <span className="text-xs text-foreground-3">{formatRelativeDate(ticket.createdAt, t)}</span>
          </div>
        </div>

        {/* Subject */}
        <p className={cn(
          "text-sm font-semibold leading-snug line-clamp-2",
          isClosed ? "text-foreground-2" : "text-foreground-1",
        )}>
          {subjectLine}
        </p>

        {/* Preview */}
        {previewLine && (
          <p className="text-[13px] text-foreground-3 leading-relaxed line-clamp-2">
            {previewLine}
          </p>
        )}

        {/* Footer: Badges + Meta */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={ticket.status} />
            <CategoryBadge category={ticket.category} />
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {messagesCount}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-foreground-3/50 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

function ConversationView({
  ticket,
  isSending,
  isClosing,
  onSendMessage,
  onClose,
  onBack,
}: {
  ticket: SupportTicket;
  isSending: boolean;
  isClosing: boolean;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation("support");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isClosed = ticket.status === "CLOSED";
  const history = getTicketHistory(ticket);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <div className="border-b border-border bg-surface-hover/40 flex-shrink-0 px-3 py-2.5 md:px-4 md:py-3 space-y-2">
        {/* Row 1: Back + Ticket ID + Close button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Button variant="ghost" size="icon" className="flex-shrink-0 -ml-1 h-8 w-8" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground-1 truncate">
              {t("ticket.ticketId", { id: ticket.id })}
            </span>
          </div>
          {!isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isClosing}
              className="flex-shrink-0 h-8 text-xs"
            >
              {isClosing ? t("ticket.closing") : t("ticket.closeTicket")}
            </Button>
          )}
        </div>
        {/* Row 2: Badges + Date */}
        <div className="flex items-center justify-between gap-2 pl-8 md:pl-9">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={ticket.status} />
            <CategoryBadge category={ticket.category} />
          </div>
          <span className="text-[11px] text-foreground-3 flex-shrink-0">
            {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3 min-h-0">
        {history.map((entry, i) => {
          const isAdmin = entry.createdBy === "admin";
          const isOwnMessage = !isAdmin;

          return (
            <div
              key={i}
              className={cn(
                "flex",
                isOwnMessage ? "justify-end" : "justify-start",
              )}
            >
              <div className={cn(
                "max-w-[80%] flex flex-col gap-0.5",
                isOwnMessage ? "items-end" : "items-start",
              )}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
                    isOwnMessage
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-surface-active text-foreground-1 rounded-bl-sm",
                  )}
                >
                  {isAdmin && (
                    <p className="text-[10px] font-semibold mb-1 opacity-60 uppercase tracking-wide">
                      {t("ticket.supportTeam")}
                    </p>
                  )}
                  {entry.message}
                </div>
                {entry.timestamp && (
                  <span className="text-[10px] text-foreground-3 px-1">
                    {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-border">
        {isClosed ? (
          <div className="flex items-center justify-center gap-2 py-3 text-foreground-3 text-sm">
            <Lock className="h-4 w-4" />
            {t("ticket.ticketClosed")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("ticket.typeMessage")}
              className="min-h-10 max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || isSending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function NewTicketDialog({
  open,
  onOpenChange,
  isCreating,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  onSubmit: (category: TicketCategory, message: string) => void;
}) {
  const { t } = useTranslation("support");
  const [category, setCategory] = useState<TicketCategory>("question");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(category, message.trim());
  };

  useEffect(() => {
    if (!open) {
      setCategory("question");
      setMessage("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md !rounded-2xl !p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold text-foreground-1">
                {t("dialog.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                {t("dialog.description")}
              </DialogDescription>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border dark:bg-border-strong" />

          {/* Form body */}
          <div className="px-5 py-5 sm:px-6 space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-1">{t("dialog.categoryLabel")}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("question")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-full !px-3 !py-1.5 !min-h-0 !h-auto text-sm font-medium border transition-colors cursor-pointer",
                    category === "question"
                      ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                      : "border-border bg-surface text-foreground-2 hover:bg-surface-hover",
                  )}
                >
                  <HelpCircle className="h-4 w-4" />
                  {t("category.question")}
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("bug")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-full !px-3 !py-1.5 !min-h-0 !h-auto text-sm font-medium border transition-colors cursor-pointer",
                    category === "bug"
                      ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                      : "border-border bg-surface text-foreground-2 hover:bg-surface-hover",
                  )}
                >
                  <Bug className="h-4 w-4" />
                  {t("category.bugReport")}
                </button>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-1">{t("dialog.messageLabel")}</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("dialog.messagePlaceholder")}
                className="min-h-32 resize-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                maxLength={10000}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border dark:bg-border-strong" />

          {/* Footer */}
          <div className="px-5 py-4 sm:px-6 flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={() => onOpenChange(false)}
              className="h-11 w-32 cursor-pointer"
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              type="submit"
              rounded="full"
              disabled={!message.trim() || isCreating}
              className="group h-11 flex-1 cursor-pointer gap-2"
            >
              {isCreating ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  {t("ticket.submitTicket")}
                  <Send className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SupportPage() {
  const { t } = useTranslation("support");
  const dispatch = useDispatch();
  const tickets = useSelector(getTicketsSelector);
  const currentTicket = useSelector(getCurrentTicketSelector);
  const isLoading = useSelector(getTicketsLoadingSelector);
  const isFetchingTicket = useSelector(getIsFetchingTicketSelector);
  const isCreating = useSelector(getIsCreatingTicketSelector);
  const isSending = useSelector(getIsSendingMessageSelector);
  const isClosing = useSelector(getIsClosingTicketSelector);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  useEffect(() => {
    dispatch(listTicketsAction.request());
  }, [dispatch]);

  useEffect(() => {
    const ticketIdParam = searchParams.get("ticketId");
    if (ticketIdParam) {
      const id = Number(ticketIdParam);
      if (!Number.isNaN(id)) {
        setSelectedTicketId(id);
        dispatch(getTicketByIdAction.request({ id }));
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch]);

  const handleSelectTicket = useCallback((id: number) => {
    setSelectedTicketId(id);
    dispatch(getTicketByIdAction.request({ id }));
  }, [dispatch]);

  const handleBack = useCallback(() => {
    setSelectedTicketId(null);
    dispatch(clearCurrentTicketAction());
    dispatch(listTicketsAction.request());
  }, [dispatch]);

  const handleCreateTicket = useCallback((category: TicketCategory, message: string) => {
    dispatch(createTicketAction.request({ category, message }));
    setIsNewTicketOpen(false);
  }, [dispatch]);

  const handleSendMessage = useCallback((message: string) => {
    if (!selectedTicketId) return;
    dispatch(addMessageAction.request({ ticketId: selectedTicketId, message }));
  }, [dispatch, selectedTicketId]);

  const handleCloseTicket = useCallback(() => {
    if (!selectedTicketId) return;
    dispatch(closeTicketAction.request({ id: selectedTicketId }));
  }, [dispatch, selectedTicketId]);

  // Navigate back to the list after a ticket is successfully closed
  const prevIsClosing = useRef(false);
  useEffect(() => {
    if (prevIsClosing.current && !isClosing && selectedTicketId !== null) {
      setSelectedTicketId(null);
      dispatch(clearCurrentTicketAction());
    }
    prevIsClosing.current = isClosing;
  }, [isClosing, selectedTicketId, dispatch]);

  const filteredTickets = tickets;

  const showConversation = selectedTicketId !== null;

  const newTicketButton = !showConversation ? (
    <Button
      onClick={() => setIsNewTicketOpen(true)}
      size="sm"
      rounded="full"
      className="btn-primary shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold gap-1.5 !px-3.5 text-xs"
    >
      <Plus className="size-3.5 shrink-0" />
      {t("ticket.newTicket")}
    </Button>
  ) : undefined;

  return (
    <AppLayout headerRightContent={newTicketButton}>
      <div className="space-y-4 px-2 py-4 md:px-0 md:py-0 md:space-y-6">
        {/* Page Header */}
        <PageHeader
          title={t("page.title")}
          rightContent={
            !showConversation && (
              <Button
                onClick={() => setIsNewTicketOpen(true)}
                className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto"
              >
                <Plus className="h-4 w-4" />
                <span>{t("ticket.newTicket")}</span>
              </Button>
            )
          }
        />

        {showConversation ? (
          <div className="px-2 md:px-0">
            <div
              className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col"
              style={{ height: "calc(100dvh - 140px)" }}
            >
              {isFetchingTicket || !currentTicket?.details ? (
                <ConversationSkeleton />
              ) : (
                <ConversationView
                  ticket={currentTicket}
                  isSending={isSending}
                  isClosing={isClosing}
                  onSendMessage={handleSendMessage}
                  onClose={handleCloseTicket}
                  onBack={handleBack}
                />
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Ticket List */}
            <div className="px-2 md:px-0">
              {isLoading ? (
                <TicketListSkeleton />
              ) : filteredTickets.length === 0 ? (
                <EmptyState
                  title={t("empty.noTickets")}
                  description={t("empty.description")}
                  icon={LifeBuoy}
                  actionButton={{
                    label: t("empty.createFirst"),
                    onClick: () => setIsNewTicketOpen(true),
                    icon: Plus,
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTickets.map((ticket) => (
                    <TicketListItem
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => handleSelectTicket(ticket.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

        <NewTicketDialog
          open={isNewTicketOpen}
          onOpenChange={setIsNewTicketOpen}
          isCreating={isCreating}
          onSubmit={handleCreateTicket}
        />
    </AppLayout>
  );
}
