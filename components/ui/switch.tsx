import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <label className={cn("relative inline-flex h-6 w-11 cursor-pointer items-center", className)}>
    <input type="checkbox" className="peer sr-only" ref={ref} {...props} />
    <div className="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-cyan-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-300/60" />
    <span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
  </label>
));
Switch.displayName = "Switch";

