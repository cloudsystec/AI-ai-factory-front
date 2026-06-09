import { BRAND_NAME, BRAND_LOGO } from "../brand.js";

function resolveSrc(variant, theme) {
  if (variant === "symbol") return BRAND_LOGO.symbol;
  if (variant === "lockup") return BRAND_LOGO.lockupDark;
  if (variant === "wordmark") {
    return theme === "dark" ? BRAND_LOGO.wordmarkDark : BRAND_LOGO.wordmarkLight;
  }
  return theme === "light" ? BRAND_LOGO.fullLight : BRAND_LOGO.fullDark;
}

/**
 * @param {{
 *   variant?: "full" | "lockup" | "symbol" | "wordmark",
 *   theme?: "dark" | "light",
 *   className?: string,
 *   href?: string,
 *   linkClassName?: string,
 * }} props
 */
export default function BrandLogo({
  variant = "full",
  theme = "dark",
  className = "",
  href,
  linkClassName = "",
}) {
  const src = resolveSrc(variant, theme);
  const img = (
    <img
      src={src}
      alt={BRAND_NAME}
      className={className}
      decoding="async"
    />
  );

  if (href) {
    return (
      <a href={href} className={`brand-logo-link ${linkClassName}`.trim()}>
        {img}
        <span className="sr-only">{BRAND_NAME}</span>
      </a>
    );
  }

  return img;
}
