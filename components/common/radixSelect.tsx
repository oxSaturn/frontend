import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";

export const Select = React.forwardRef(function Select(
  {
    children,
    ...props
  }: { children: React.ReactNode } & SelectPrimitive.SelectProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        ref={forwardedRef}
        className="flex items-center justify-center"
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon className="text-primary">
          <ArrowDropDown />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={1}
          className="bg-secondary p-3"
        >
          <SelectPrimitive.ScrollUpButton>
            <ArrowDropDown />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton>
            <ArrowDropUp />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});

export const SelectItem = React.forwardRef(function SelectItem(
  {
    children,
    ...props
  }: { children: React.ReactNode } & SelectPrimitive.SelectItemProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <SelectPrimitive.Item
      {...props}
      ref={forwardedRef}
      className="relative flex h-[25px] select-none items-center px-3 leading-none data-[highlighted]:bg-primary data-[highlighted]:text-black data-[highlighted]:outline-none"
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
