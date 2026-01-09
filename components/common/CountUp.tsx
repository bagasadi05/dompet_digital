import React, { useEffect, useState } from 'react';

interface CountUpProps {
    end: number;
    duration?: number;
    decimals?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    formattingFn?: (value: number) => string;
}

const CountUp: React.FC<CountUpProps> = ({
    end,
    duration = 2000,
    decimals = 0,
    className = '',
    prefix = '',
    suffix = '',
    formattingFn
}) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function: easeOutExpo (starts fast, slows down at the end)
            const easeOutExpo = (x: number): number => {
                return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
            };

            const currentCount = easeOutExpo(percentage) * end;

            setCount(currentCount);

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure it lands exactly on the end value
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [end, duration]);

    const formattedValue = formattingFn
        ? formattingFn(count)
        : count.toFixed(decimals);

    return (
        <span className={className}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
};

export default CountUp;
