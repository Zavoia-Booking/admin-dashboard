import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      closeButton
      className="toaster group"
      toastOptions={{
        className: "cursor-default",
      }}
      style={
        {
          "--width": "min(320px, calc(100vw - 32px))",
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
