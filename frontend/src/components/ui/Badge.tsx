interface BadgeProps {
  children: React.ReactNode;
  variant?: 'beginner' | 'intermediate' | 'advanced' | 'published' | 'pending' | 'draft' | 'rejected' | 'default';
}

const variantClasses: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
  published: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-800',
  default: 'bg-blue-100 text-blue-800',
};

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
