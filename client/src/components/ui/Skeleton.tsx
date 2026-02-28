import { cn } from '../../lib/utils'; // Assuming this utility exists based on Kanban.tsx imports

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/10", className)}
            {...props}
        />
    );
}

export { Skeleton };
