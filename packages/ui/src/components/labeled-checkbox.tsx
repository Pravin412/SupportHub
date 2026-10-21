"use client";

import * as React from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { cn } from "../lib/utils";

export interface LabeledCheckboxProps extends Omit<React.ComponentPropsWithoutRef<typeof Checkbox>, "children"> {
  /** Text shown next to the checkbox. */
  label: React.ReactNode;
  /** Helper text under the label. */
  description?: React.ReactNode;
  /** Classes for the outer label element. */
  className?: string;
  /** Classes for the label element. */
  labelClassName?: string;
  /** Classes for the checkbox itself. */
  checkboxClassName?: string;
}

/**
 * Checkbox with its label. Clicking the label text toggles the checkbox.
 *
 * <LabeledCheckbox label="Ask details on new conversation" checked={on} onCheckedChange={(v) => setOn(v === true)} />
 */
const LabeledCheckbox = React.forwardRef<React.ElementRef<typeof Checkbox>, LabeledCheckboxProps>(
  ({ label, description, className, labelClassName, checkboxClassName, id, disabled, ...checkboxProps }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center gap-2">
          <Checkbox ref={ref} id={checkboxId} disabled={disabled} className={checkboxClassName} {...checkboxProps} />
          <Label htmlFor={checkboxId} className={cn("font-normal leading-normal text-slate-700", disabled && "cursor-not-allowed opacity-60", labelClassName)}>
            {label}
          </Label>
        </div>
        {description && <p className="pl-6 text-xs text-muted">{description}</p>}
      </div>
    );
  }
);
LabeledCheckbox.displayName = "LabeledCheckbox";

export { LabeledCheckbox };
