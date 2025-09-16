import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type AvatarProps = React.HTMLAttributes<HTMLDivElement>;
export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />
  );
}

export type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
};

export function AvatarImage({ className, alt = "", src, width = 40, height = 40 }: AvatarImageProps) {
  return (
    <Image
      className={cn("object-cover w-full h-full", className)}
      alt={alt}
      src={src}
      width={width}
      height={height}
    />
  );
}

export type AvatarFallbackProps = React.HTMLAttributes<HTMLSpanElement>;
export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
