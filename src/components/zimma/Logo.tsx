
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center object-cover ${className}`}>
      <img 
        src="/logo-zimma.png" 
        alt="Zimma Logo" 
        className="h-30 w-auto" 
      /> <span className="block min-[766px]:max-[1100px]:hidden text-[30px] text-[#1E293]  font-bold tracking-tight mt-4">Zimma </span>
    </div>
  );
}