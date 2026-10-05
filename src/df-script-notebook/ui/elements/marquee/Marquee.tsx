import React from "react";
import clsx from "clsx";
import styles from "./marquee.module.css";
import { MarqueeProps } from "./types";

export const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
  (
    {
      children,
      className,
      pxPerSecond = 30,
      gapPx = 48,
      pauseOnLoop = false,
      noFadeLeft = false,
      noFadeRight = false,
      fadeColor,
      internalClassNames = {},
      style: styleProp = {},
      ...rest
    },
    ref
  ) => {
    const internalContainerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLHeadingElement>(null);

    const [duration, setDuration] = React.useState(0);
    const [isOverflowing, setIsOverflowing] = React.useState(false);

    React.useImperativeHandle(ref, () => internalContainerRef.current! as HTMLDivElement, []);

    React.useEffect(() => {
      const checkOverflowAndSetDuration = () => {
        if (!internalContainerRef.current || !contentRef.current) return;

        const containerWidth = internalContainerRef.current.clientWidth;
        const contentWidth = contentRef.current.scrollWidth;
        const textWidth = contentWidth - gapPx / 2;
        const isTextWidthOverflowing = textWidth > containerWidth;

        if (isTextWidthOverflowing !== isOverflowing) {
          setIsOverflowing(isTextWidthOverflowing);
        }

        setDuration(isTextWidthOverflowing ? contentWidth / pxPerSecond : 0);
      };

      const container = internalContainerRef.current;
      if (!container) return;

      checkOverflowAndSetDuration();

      const resizeObserver = new ResizeObserver(checkOverflowAndSetDuration);
      resizeObserver.observe(container);

      return () => resizeObserver.unobserve(container);
    }, [children, pxPerSecond, gapPx, isOverflowing]);

    return (
      <div
        data-is-overflowing={isOverflowing}
        className={clsx("contents")}
      >
        <div
          ref={internalContainerRef}
          className={clsx(
            className,
            styles.marqueeContainer,
            isOverflowing && styles.isOverflowing,
            isOverflowing && pauseOnLoop ? styles.paused : styles.continuous,
            isOverflowing && noFadeLeft && styles.noFadeLeft,
            isOverflowing && noFadeRight && styles.noFadeRight
          )}
          style={{
            ...styleProp,
            "--marquee-fade-color": fadeColor,
            ...(isOverflowing ? { animationDuration: `${duration}s` } : {}),
          } as React.CSSProperties}
          {...rest}
        >
          <div className={clsx(styles.marqueeContent, internalClassNames?.marqueeContent)}>
            <h3
              ref={contentRef}
              className={clsx(styles.marqueeText, internalClassNames?.marqueeText)}
              style={{ paddingInlineEnd: `${gapPx / 2}px` }}
            >
              {children}
            </h3>
            <h3
              className={clsx(styles.marqueeText, internalClassNames?.marqueeText, {
                hidden: !isOverflowing,
              })}
              aria-hidden="true"
              style={{ paddingInlineEnd: `${gapPx / 2}px` }}
            >
              {children}
            </h3>
          </div>
        </div>
      </div>
    );
  }
);

Marquee.displayName = "Marquee";

export default Marquee;
