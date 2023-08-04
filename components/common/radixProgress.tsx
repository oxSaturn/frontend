import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

export function Progress({ progress = 0 }) {
  return (
    <ProgressPrimitive.Root
      className="relative overflow-hidden bg-secondary rounded-lg w-full h-[25px]"
      style={{
        // Fix overflow clipping in Safari
        // https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0
        transform: "translateZ(0)",
      }}
      value={progress}
    >
      <ProgressPrimitive.Indicator
        className="bg-cyan w-full h-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
