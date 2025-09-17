import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

import { cn } from "../../lib/classnames";

type CardPadding = "none" | "sm" | "md" | "lg";

const PADDING: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "surface-card transition-shadow duration-200",
          "hover:shadow-brand",
          PADDING[padding],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
