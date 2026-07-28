// useConfirmRadix.tsx
import * as React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import {
  modalScrim,
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
  modalDestructive,
} from '../components/ui/modal-tokens';

type MaybeNode = React.ReactNode | string | null | undefined;

export type ConfirmOptions = {
    /** Short small-caps caption above the title — gives the dialog editorial weight. */
    eyebrow?: string;
    title?: MaybeNode;
    content?: MaybeNode;
    confirmationText?: string;
    cancellationText?: string;
    showCancel?: boolean;
    /** If true, clicking the overlay or pressing Escape will dismiss as "cancel". */
    dismissible?: boolean;
    /** If true, paints the confirm button with a destructive style. */
    destructive?: boolean;

    /** Extra class for the dialog panel. */
    className?: string;

    /** Fully customize the actions row; you must call onConfirm / onCancel yourself. */
    renderActions?: (args: {
        onCancel: () => void;
        onConfirm: () => void;
        options: ConfirmOptions;
    }) => React.ReactNode;

    /** New: lifecycle callbacks */
    onConfirm?: (payload: any) => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
    /** Fires after either confirm/cancel, receives the final result. */
    onClose?: (result: boolean) => void | Promise<void>;

    /** Close the dialog before running callbacks (default: true). */
    closeBeforeCallbacks?: boolean;
};

type Resolver = {
    resolve: (value: boolean) => void;
    reject: (reason?: any) => void;
};

type State = {
    open: boolean;
    options: ConfirmOptions;
    resolver?: Resolver;
};

// Title/confirm/cancel are filled with translated text inside the hook via translatedDefaults.
const defaults: ConfirmOptions = {
    content: undefined,
    showCancel: true,
    dismissible: false, // AlertDialog behavior by default
    destructive: false,
    closeBeforeCallbacks: true,
};

export function useConfirmRadix() {
    const { t } = useTranslation('auth');
    const translatedDefaults = React.useMemo<ConfirmOptions>(() => ({
        ...defaults,
        title: t('common.areYouSure'),
        confirmationText: t('common.yes'),
        cancellationText: t('common.no'),
    }), [t]);

    const [state, setState] = React.useState<State>({
        open: false,
        options: defaults,
    });

    // Track how the dialog is attempting to close so we resolve correctly
    const intentRef = React.useRef<'confirm' | 'cancel' | 'dismiss' | null>(null);

    const confirm = React.useCallback((opts?: ConfirmOptions) => {
        return new Promise<boolean>((resolve, reject) => {
            setState({
                open: true,
                options: { ...translatedDefaults, ...(opts ?? {}) },
                resolver: { resolve, reject },
            });
        });
    }, [translatedDefaults]);

    const finish = React.useCallback(
        async (result: boolean) => {
            // Snapshot current options/resolver to avoid stale closures after setState
            const { options, resolver } = state;
            const {
                onConfirm,
                onCancel,
                onClose,
                closeBeforeCallbacks = true,
            } = options;

            // Optionally close first for a snappy UI
            if (closeBeforeCallbacks) {
                setState({ open: false, options: translatedDefaults, resolver: undefined });
            }

            try {
                if (result) {
                    await onConfirm?.({ todo: true });
                } else {
                    await onCancel?.();
                }
                await onClose?.(result);

                if (!closeBeforeCallbacks) {
                    setState({ open: false, options: translatedDefaults, resolver: undefined });
                }
                resolver?.resolve(result);
            } catch (err) {
                if (!closeBeforeCallbacks) {
                    setState({ open: false, options: translatedDefaults, resolver: undefined });
                }
                resolver?.reject(err);
            }
        },
        [state, translatedDefaults]
    );

    const onConfirmClick = React.useCallback(() => {
        intentRef.current = 'confirm';
    }, []);
    const onCancelClick = React.useCallback(() => {
        intentRef.current = 'cancel';
    }, []);
    const onDismiss = React.useCallback(() => {
        intentRef.current = 'dismiss';
    }, []);

    const handleOpenChange = React.useCallback(
        (nextOpen: boolean) => {
            if (nextOpen) return; // opening
            // closing: decide outcome and run callbacks
            const intent = intentRef.current;
            intentRef.current = null;
            const result = intent === 'confirm';
            void finish(result);
        },
        [finish]
    );

    const Panel: React.FC<{
        eyebrow?: string;
        title?: MaybeNode;
        content?: MaybeNode;
        destructive?: boolean;
        showCancel?: boolean;
        confirmationText: string;
        cancellationText: string;
        className?: string;
        renderActions?: ConfirmOptions['renderActions'];
        Root: any; Portal: any; Overlay: any; Content: any; Title: any; Description: any; Action?: any; Cancel?: any; Close?: any;
        attachDismissHandlers?: (props: Record<string, any>) => Record<string, any>;
        useActionWrappers: 'alert' | 'dialog';
    }> = ({
              eyebrow,
              title,
              content,
              destructive,
              showCancel,
              confirmationText,
              cancellationText,
              className,
              renderActions,
              Root, Portal, Overlay, Content, Title, Description, Action, Cancel, Close,
              attachDismissHandlers = (p) => p,
              useActionWrappers,
          }) => {
        const baseContentProps = attachDismissHandlers({
            className: modalPanel,
        });

        const overlayProps = {
            className: modalScrim,
        };

        const confirmPillClass = destructive ? modalDestructive : modalPrimary;

        return (
            <Root open onOpenChange={handleOpenChange}>
                <Portal>
                    <Overlay {...overlayProps} />
                    <Content {...baseContentProps} className={`${baseContentProps.className} ${className ?? ''}`}>
                        {eyebrow && (
                            <div className={modalEyebrow}>{eyebrow}</div>
                        )}
                        {title != null && (
                            <Title className={modalTitleCompact}>
                                {title}
                            </Title>
                        )}
                        {content != null && (
                            <Description asChild>
                                <div className={`mt-3 ${modalBody}`}>
                                    {content}
                                </div>
                            </Description>
                        )}

                        <div className={`mt-7 ${modalFooterRowRight}`}>
                            {renderActions ? (
                                renderActions({
                                    onCancel: onCancelClick,
                                    onConfirm: onConfirmClick,
                                    options: state.options,
                                })
                            ) : (
                                <>
                                    {showCancel && (useActionWrappers === 'alert' ? (
                                        <Cancel asChild>
                                            <button onClick={onCancelClick} className={modalCancel}>
                                                {cancellationText}
                                            </button>
                                        </Cancel>
                                    ) : (
                                        <Close asChild>
                                            <button onClick={onCancelClick} className={modalCancel}>
                                                {cancellationText}
                                            </button>
                                        </Close>
                                    ))}

                                    {useActionWrappers === 'alert' ? (
                                        <Action asChild>
                                            <button onClick={onConfirmClick} autoFocus className={confirmPillClass}>
                                                {confirmationText}
                                            </button>
                                        </Action>
                                    ) : (
                                        <Close asChild>
                                            <button onClick={onConfirmClick} autoFocus className={confirmPillClass}>
                                                {confirmationText}
                                            </button>
                                        </Close>
                                    )}
                                </>
                            )}
                        </div>
                    </Content>
                </Portal>
            </Root>
        );
    };

    const ConfirmDialog = React.useCallback(() => {
        const { open, options } = state;
        if (!open) return null;

        const {
            eyebrow,
            title,
            content,
            confirmationText = translatedDefaults.confirmationText!,
            cancellationText = translatedDefaults.cancellationText!,
            showCancel = true,
            dismissible = false,
            destructive = false,
            className,
            renderActions,
        } = options;

        if (dismissible) {
            // Use Dialog so overlay/Escape will close. Treat those as cancel.
            return (
                <Panel
                    eyebrow={eyebrow}
                    title={title}
                    content={content}
                    destructive={destructive}
                    showCancel={showCancel}
                    confirmationText={confirmationText}
                    cancellationText={cancellationText}
                    className={className}
                    renderActions={renderActions}
                    Root={Dialog.Root}
                    Portal={Dialog.Portal}
                    Overlay={Dialog.Overlay}
                    Content={Dialog.Content}
                    Title={Dialog.Title}
                    Description={Dialog.Description}
                    Close={Dialog.Close}
                    useActionWrappers="dialog"
                    attachDismissHandlers={(props) => ({
                        ...props,
                        onEscapeKeyDown: () => onDismiss(),
                        onPointerDownOutside: () => onDismiss(),
                    })}
                />
            );
        }

        // Non-dismissible, safer: use AlertDialog
        return (
            <Panel
                eyebrow={eyebrow}
                title={title}
                content={content}
                destructive={destructive}
                showCancel={showCancel}
                confirmationText={confirmationText}
                cancellationText={cancellationText}
                className={className}
                renderActions={renderActions}
                Root={AlertDialog.Root}
                Portal={AlertDialog.Portal}
                Overlay={AlertDialog.Overlay}
                Content={AlertDialog.Content}
                Title={AlertDialog.Title}
                Description={AlertDialog.Description}
                Action={AlertDialog.Action}
                Cancel={AlertDialog.Cancel}
                useActionWrappers="alert"
                attachDismissHandlers={(props) => ({
                    ...props,
                    // Block overlay/Escape (AlertDialog blocks by default; keeping explicit)
                    onEscapeKeyDown: (e: any) => e.preventDefault(),
                    onPointerDownOutside: (e: any) => e.preventDefault(),
                })}
            />
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.open, state.options]); // options stable per open cycle

    return { ConfirmDialog, confirm };
}
