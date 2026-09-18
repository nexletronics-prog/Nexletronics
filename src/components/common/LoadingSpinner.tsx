export function LoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center py-10"
      aria-label="Loading"
      role="status"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#D4AF37]" />
    </div>
  );
}

export default LoadingSpinner;