// Enhanced Toast Component
// File: frontend/src/components/ui/toast.tsx

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import styled from "styled-components"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = styled(ToastPrimitives.Viewport)`
  position: fixed;
  top: 0;
  z-index: 100;
  display: flex;
  max-height: 100vh;
  width: 100%;
  flex-direction: column;
  padding: 1rem;
  
  @media (min-width: 640px) {
    bottom: 0;
    right: 0;
    top: auto;
    flex-direction: column-reverse;
    padding: 1rem;
    max-width: 420px;
  }
`

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const StyledToast = styled(ToastPrimitives.Root)<{ variant?: "default" | "destructive" }>`
  position: relative;
  pointer-events: auto;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  column-gap: 1rem;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid;
  padding: 1.5rem 2rem 1.5rem 1.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  ${({ variant = "default" }) => {
    switch (variant) {
      case "destructive":
        return `
          border-color: #ef4444;
          background-color: #ef4444;
          color: #fef2f2;
        `;
      default:
        return `
          border-color: #374151;
          background-color: #1f2937;
          color: #f9fafb;
        `;
    }
  }}

  &[data-state="open"] {
    animation: slide-in-from-top-full 0.15s ease-out;
  }

  &[data-state="closed"] {
    animation: slide-out-to-right-full 0.15s ease-in;
  }

  @media (min-width: 640px) {
    &[data-state="open"] {
      animation: slide-in-from-bottom-full 0.15s ease-out;
    }
  }

  @keyframes slide-in-from-top-full {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slide-in-from-bottom-full {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slide-out-to-right-full {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }
`

const ToastAction = styled(ToastPrimitives.Action)`
  display: inline-flex;
  height: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid;
  background-color: transparent;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  .group[data-variant="destructive"] & {
    border-color: rgba(254, 242, 242, 0.2);
    color: #ef4444;

    &:hover {
      border-color: rgba(239, 68, 68, 0.3);
      background-color: rgba(239, 68, 68, 0.1);
    }

    &:focus {
      outline-color: #ef4444;
    }
  }
`

const ToastClose = styled(ToastPrimitives.Close)`
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  border-radius: 6px;
  padding: 0.25rem;
  color: inherit;
  opacity: 0.7;
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }

  &:focus {
    opacity: 1;
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  .group[data-variant="destructive"] & {
    color: #fca5a5;

    &:hover {
      color: #ef4444;
    }

    &:focus {
      outline-color: #ef4444;
    }
  }
`

const ToastTitle = styled(ToastPrimitives.Title)`
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
`

const ToastDescription = styled(ToastPrimitives.Description)`
  font-size: 0.875rem;
  opacity: 0.9;
  line-height: 1.25;
`

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>

type ToastActionElement = React.ReactElement<typeof ToastAction>

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ variant, ...props }, ref) => {
  return (
    <StyledToast
      ref={ref}
      variant={variant}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastCloseButton = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ ...props }, ref) => (
  <ToastClose ref={ref} {...props}>
    <X className="h-4 w-4" />
  </ToastClose>
))
ToastCloseButton.displayName = ToastPrimitives.Close.displayName

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastCloseButton as ToastClose
}
