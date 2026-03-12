import { sharedInputLabelClass } from '@/shared/components/public-visual-system';

type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false
}: FormInputProps) {
  return (
    <label className="block">
      <span className={sharedInputLabelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-accent focus:bg-[#050a15] focus:ring-1 focus:ring-accent focus:shadow-[0_0_15px_#00b4d8] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}
