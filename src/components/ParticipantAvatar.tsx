import { Participant } from "@/types/expense";

interface ParticipantAvatarProps {
  participant: Participant | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export function ParticipantAvatar({ 
  participant, 
  size = "md",
  className = ""
}: ParticipantAvatarProps) {
  if (!participant) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium ${className}`}
      >
        ?
      </div>
    );
  }

  const initial = participant.name.charAt(0).toUpperCase();

  if (participant.avatarType === 'image' && participant.avatarImage) {
    return (
      <img
        src={participant.avatarImage}
        alt={participant.name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  // Color avatar - use the stored color (hex or tailwind class)
  const isHexColor = participant.avatar.startsWith('#');
  
  if (isHexColor) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium ${className}`}
        style={{ backgroundColor: participant.avatar }}
      >
        {initial}
      </div>
    );
  }

  // Fallback to tailwind class
  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${participant.avatar} flex items-center justify-center text-primary-foreground font-medium ${className}`}
    >
      {initial}
    </div>
  );
}

// Helper to get participant by ID
export function getParticipantById(participants: Participant[], id: string): Participant | undefined {
  return participants.find((p) => p.id === id);
}
