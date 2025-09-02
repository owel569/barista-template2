
export type IconComponent = React.ComponentType<{
  className?: string;
  size?: string | number;
}>;

export type LucideIconProps = {
  className?: string;
  size?: string | number;
};

export function createIconWrapper<T extends React.ComponentType<any>>(
  IconComponent: T
): React.ComponentType<{ className?: string }> {
  return function WrappedIcon({ className }: { className?: string }) {
    return <IconComponent className={className} />;
  };
}
