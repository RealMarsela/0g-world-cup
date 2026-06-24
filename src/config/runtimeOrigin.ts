export function canUseBrowserEmbeddedWallets() {
  if (typeof window === "undefined") return true;

  const { protocol, hostname } = window.location;
  return (
    protocol === "https:" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}
