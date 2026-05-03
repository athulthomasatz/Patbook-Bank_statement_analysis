import { useEffect, useState } from "react";

export default function PageTransition({ children, className = "" }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // small delay so CSS transition runs on mount
    const id = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={`page-transition ${entered ? "enter" : ""} ${className}`}>{children}</div>
  );
}
