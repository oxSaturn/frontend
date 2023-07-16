import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (_open: boolean) => void;
} & TooltipPrimitive.TooltipProps) {
  return (
    <TooltipPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <TooltipPrimitive.Trigger>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        sideOffset={5}
        {...props}
        className="radix-state-delayed-open:radix-side-bottom:animate-slideUpAndFade radix-state-delayed-open:radix-side-left:animate-slideRightAndFade radix-state-delayed-open:radix-side-top:animate-slideDownAndFade select-none border border-accent bg-background px-4 py-2 text-sm leading-none text-secondary shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity] max-w-radix-tooltip-content-available-width radix-state-delayed-open:radix-side-right:animate-slideLeftAndFade"
      >
        {content}
        <TooltipPrimitive.Arrow className="fill-accent" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  );
}
