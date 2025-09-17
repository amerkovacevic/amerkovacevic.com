import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/classnames";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground hover:bg-brand-strong focus-visible:outline-brand-accent",
  secondary:
    "border border-border-light bg-surface-overlay text-brand-strong hover:border-brand-muted dark:bg-surface-overlayDark dark:hover:border-brand-subtle",
  ghost:
    "bg-transparent text-brand-subtle hover:bg-surface-overlay dark:hover:bg-surface-overlayDark",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonStyles({ variant = "primary", size = "md", className }: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-brand-full font-medium transition-all duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", leftIcon, rightIcon, children, type = "button", ...props },
    ref
  ) => {
    return (
      <button ref={ref} type={type} className={buttonStyles({ variant, size, className })} {...props}>
        {leftIcon ? <span className="shrink-0 text-sm">{leftIcon}</span> : null}
        <span className="whitespace-nowrap">{children}</span>
        {rightIcon ? <span className="shrink-0 text-sm">{rightIcon}</span> : null}
      </button>
    );
  }
);

Button.displayName = "Button";
