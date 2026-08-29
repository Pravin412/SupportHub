"use client";

type LoadingIndicatorProps = {
  themeColor?: string;
  className?: string;
};

export function LoadingIndicator({ themeColor = "#0f766e", className = "" }: LoadingIndicatorProps) {
  const dots = Array.from({ length: 20 });

  return (
    <div className={`relative grid h-20 w-20 place-items-center ${className}`}>
      <div className="absolute inset-0 animate-spin rounded-full duration-loader">
        {dots.map((_, index) => {
          const opacity = 1 - index / dots.length;
          return (
            <span
              key={index}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
              style={{
                backgroundColor: themeColor,
                opacity: Math.max(opacity, 0.18),
                transform: `rotate(${index * (360 / dots.length)}deg) translate(34px)`,
                transformOrigin: "0 0"
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
