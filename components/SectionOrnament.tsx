// Reusable SVG lotus ornament divider used between section headings
export default function SectionOrnament({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Left line */}
      <div className="flex-1 max-w-[80px] h-px bg-gradient-to-r from-transparent to-[#C9976E]/40" />

      {/* Lotus SVG */}
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Center petal */}
        <path d="M24 4 Q24 0 24 0 Q28 8 24 14 Q20 8 24 0 Z" fill="#C9976E" opacity="0.7" />
        {/* Left inner petal */}
        <path d="M24 14 Q18 6 14 8 Q16 14 24 14 Z" fill="#C9976E" opacity="0.5" />
        {/* Right inner petal */}
        <path d="M24 14 Q30 6 34 8 Q32 14 24 14 Z" fill="#C9976E" opacity="0.5" />
        {/* Left outer petal */}
        <path d="M24 14 Q12 4 8 10 Q12 16 24 14 Z" fill="#C9976E" opacity="0.3" />
        {/* Right outer petal */}
        <path d="M24 14 Q36 4 40 10 Q36 16 24 14 Z" fill="#C9976E" opacity="0.3" />
        {/* Left far petal */}
        <path d="M24 14 Q6 8 2 16 Q8 20 24 14 Z" fill="#C9976E" opacity="0.15" />
        {/* Right far petal */}
        <path d="M24 14 Q42 8 46 16 Q40 20 24 14 Z" fill="#C9976E" opacity="0.15" />
        {/* Stem base */}
        <path d="M21 14 Q24 22 24 26 Q24 22 27 14" stroke="#C9976E" strokeWidth="1" opacity="0.4" fill="none" />
        {/* Water ripples */}
        <ellipse cx="24" cy="24" rx="10" ry="2.5" stroke="#C9976E" strokeWidth="0.8" opacity="0.25" fill="none" />
        <ellipse cx="24" cy="26" rx="16" ry="3" stroke="#C9976E" strokeWidth="0.5" opacity="0.12" fill="none" />
        {/* Center glow dot */}
        <circle cx="24" cy="10" r="1.5" fill="#D4A85A" opacity="0.9" />
      </svg>

      {/* Right line */}
      <div className="flex-1 max-w-[80px] h-px bg-gradient-to-l from-transparent to-[#C9976E]/40" />
    </div>
  );
}
