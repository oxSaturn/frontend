import { type Ref, forwardRef, HTMLAttributes } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

export const Slider = forwardRef(function Slider(
  props: SliderPrimitive.SliderProps & HTMLAttributes<HTMLSpanElement>,
  forwardedRef: Ref<HTMLSpanElement>
) {
  return (
    <SliderPrimitive.Root {...props} ref={forwardedRef}>
      <SliderPrimitive.Track className="relative h-[3px] grow rounded-full bg-black">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-white" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-5 w-5 rounded-[10px] bg-white hover:bg-violet-100 focus:outline focus:outline-secondary"
        aria-label="Discount"
      />
    </SliderPrimitive.Root>
  );
});
