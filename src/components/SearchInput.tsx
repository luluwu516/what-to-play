// A controlled text input with a trailing ✕ clear button (shown only when
// there's text). Enter triggers onSubmit; Escape clears.
export function SearchInput({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  className = "",
  inputClassName = "",
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}) {
  const clear = onClear ?? (() => onChange(""));
  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit();
          if (e.key === "Escape" && value) clear();
        }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        className={`w-full pr-10 ${inputClassName}`}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-cocoa/60 hover:bg-cocoa/10 active:bg-cocoa/20"
        >
          ✕
        </button>
      )}
    </div>
  );
}
