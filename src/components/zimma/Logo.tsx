
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center object-cover ${className}`}>
      <img 
        src="/logo-zimma.png" 
        alt="Zimma Logo" 
        className="h-30 w-auto" 
      /> <span className="block text-[30px] color-[#1e293b]  font-bold tracking-tight mt-4">Zimma </span>
    </div>
  );
}