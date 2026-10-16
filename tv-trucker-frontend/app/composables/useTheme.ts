export type Theme = "dark" | "light";

// Kept in a cookie (not localStorage) so the server renders the right theme and nothing flashes.
export function useTheme() {
  const theme = useCookie<Theme>("tvt_theme", { default: () => "dark", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const setTheme = (value: Theme) => {
    theme.value = value;
  };
  const toggleTheme = () => setTheme(theme.value === "light" ? "dark" : "light");
  return { theme, setTheme, toggleTheme };
}
