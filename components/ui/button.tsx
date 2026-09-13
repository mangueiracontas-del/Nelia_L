import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "ghost";
}

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  const base =
    "rounded-lg px-4 py-2 font-semibold disabled:opacity-50 transition-colors";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    gold: "bg-gold text-zinc-950 hover:bg-gold-light",
    ghost: "bg-transparent border border-zinc-700 text-zinc-200 hover:border-zinc-500",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
