import { icons, LucideProps } from "lucide-react";

interface LucideIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export function LucideIcon({ name, ...props }: LucideIconProps) {
  const IconComponent = icons[name as keyof typeof icons];
  
  if (!IconComponent) {
    // Fallback to a default icon if the name doesn't exist
    const FallbackIcon = icons.Package;
    return <FallbackIcon {...props} />;
  }
  
  return <IconComponent {...props} />;
}
