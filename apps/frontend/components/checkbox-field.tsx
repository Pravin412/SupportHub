import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Checkbox } from "@support-hub/ui";

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Checkbox 
            checked={field.value} 
            onCheckedChange={field.onChange} 
            id={name}
          />
        )}
      />
      <span>{label}</span>
    </label>
  );
}
