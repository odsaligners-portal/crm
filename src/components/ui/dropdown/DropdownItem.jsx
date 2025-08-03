import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const DropdownItem = ({
  tag = "button",
  href,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  className = "",
  children,
}) => {
  const combinedClasses = `${baseClassName} ${className}`.trim();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const router = typeof window !== 'undefined' ? undefined : undefined; // placeholder for SSR safety

  const handleClick = (event) => {
    if (tag === "button") {
      event.preventDefault();
    }
    if (onClick) onClick();
    if (onItemClick) onItemClick();
    // If this is a link to the current route, force reload
    if (tag === "a" && href && pathname === href) {
      event.preventDefault();
      window.location.href = href;
    }
  };

  if (tag === "a" && href) {
    return (
      <Link href={href} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  );
};
