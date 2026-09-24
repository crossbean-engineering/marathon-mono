import { normalizeGhPhone, ghPhoneError } from '../../utils';

export function PhoneField({ value, onChange, error, disabled, label, className }: any) {
  // Show the validation hint once the user has typed something invalid
  const validationError = error || (value ? ghPhoneError(value) : null);

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{label || "Phone Number"}</label>
      <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground">
          +233
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          maxLength={10}
          onChange={(e) => onChange(normalizeGhPhone(e.target.value))}
          className={`w-full px-4 py-3 border bg-background rounded-r-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            validationError ? "border-red-500" : "border-input"
          }`}
          placeholder="24XXXXXXX"
        />
      </div>
      {validationError && <p className="text-red-500 text-sm mt-1">{validationError}</p>}
    </div>
  );
}
