import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Badge } from "../../../shared/components/ui/badge";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Spinner } from "../../../shared/components/ui/spinner";
import { EmptyState } from "../../../shared/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
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
  CircleDot,
  Send,
  Lock,
  LifeBuoy,
} from "lucide-react";
import type { SupportTicket, TicketCategory, TicketStatus, TicketHistoryEntry } from "../types";
import { cn } from "../../../shared/lib/utils";

function getTicketHistory(ticket: SupportTicket): TicketHistoryEntry[] {
  if (ticket.details?.history) return ticket.details.history;
  if (ticket.details?.messages) {
    return ticket.details.messages.map((m) => ({
      message: m.text,
      createdBy: m.from === "admin" ? "admin" : ticket.createdBy,
    }));
  }
  return [];
}

const STATUS_CLASSES: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  CLOSED: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
  REOPENED: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
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
    <Badge variant="outline" className="text-xs gap-1">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function TicketListItem({
  ticket,
  onClick,
}: {
  ticket: SupportTicket;
  onClick: () => void;
}) {
  const history = getTicketHistory(ticket);
  const firstMessage = history[0]?.message || ticket.details?.subject || "";
  const preview = firstMessage.length > 120 ? firstMessage.slice(0, 120) + "..." : firstMessage;
  const date = new Date(ticket.createdAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-colors cursor-pointer",
        "hover:bg-surface-hover hover:border-border-strong",
        "bg-card",
        ticket.hasUnread && "border-primary/40 bg-primary/[0.03] dark:bg-primary/[0.06]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={ticket.category} />
            <StatusBadge status={ticket.status} />
            {ticket.hasUnread && (
              <span className="flex h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm text-foreground-1 line-clamp-2">{preview}</p>
          <div className="flex items-center gap-3 text-xs text-foreground-3">
            <span>{formattedDate}</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {history.length}
            </span>
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
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground-1">{t("ticket.ticketId", { id: ticket.id })}</span>
              <CategoryBadge category={ticket.category} />
              <StatusBadge status={ticket.status} />
            </div>
            <p className="text-xs text-foreground-3 mt-0.5">
              {t("ticket.created", {
                date: new Date(ticket.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
              })}
            </p>
          </div>
        </div>
        {!isClosed && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isClosing}
          >
            {isClosing ? t("ticket.closing") : t("ticket.closeTicket")}
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
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
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  isOwnMessage
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-surface-hover dark:bg-neutral-800 text-foreground-1 rounded-bl-md",
                )}
              >
                {isAdmin && (
                  <p className="text-xs font-medium mb-1 opacity-70">{t("ticket.supportTeam")}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{entry.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="flex items-center justify-center gap-2 py-4 border-t border-border text-foreground-3 text-sm">
          <Lock className="h-4 w-4" />
          {t("ticket.ticketClosed")}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 pt-4 border-t border-border">
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-1">{t("dialog.categoryLabel")}</label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {t("category.question")}
                    </div>
                  </SelectItem>
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      {t("category.bugReport")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-1">{t("dialog.messageLabel")}</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("dialog.messagePlaceholder")}
                className="min-h-28"
                maxLength={10000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" disabled={!message.trim() || isCreating}>
              {isCreating ? t("ticket.submitting") : t("ticket.submitTicket")}
            </Button>
          </DialogFooter>
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
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");

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

  const filteredTickets = statusFilter === "all"
    ? tickets
    : tickets.filter((t) => t.status === statusFilter);

  const showConversation = selectedTicketId !== null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-4 w-full border-b border-border-strong hidden md:block">
          <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
            {t("page.title")}
          </h1>
        </div>

        {showConversation ? (
          <div className="px-4 md:px-0">
            <Card className="overflow-hidden">
              <CardContent className="p-4 md:p-6 h-[calc(100vh-220px)] flex flex-col">
                {isFetchingTicket || !currentTicket?.details ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Spinner size="lg" />
                  </div>
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
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 md:px-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(["all", "OPEN", "IN_PROGRESS", "REOPENED", "CLOSED"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? "default" : "outline"}
                    size="sm"
                    rounded="full"
                    onClick={() => setStatusFilter(s)}
                  >
                    {t(`status.${s}`)}
                  </Button>
                ))}
              </div>
              <Button size="sm" onClick={() => setIsNewTicketOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {t("ticket.newTicket")}
              </Button>
            </div>

            {/* Ticket List */}
            <div className="px-4 md:px-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : filteredTickets.length === 0 ? (
                tickets.length === 0 ? (
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
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                    <CircleDot className="h-10 w-10 text-foreground-3" />
                    <p className="text-sm text-foreground-3">
                      {t("empty.noMatch")}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      {t("empty.clearFilter")}
                    </Button>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
