import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Checkbox } from "@support-hub/ui";

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  disabled
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Checkbox 
            checked={field.value} 
            disabled={disabled}
            onCheckedChange={field.onChange} 
            id={name}
          />
        )}
      />
      <span>{label}</span>
    </label>
  );
}
