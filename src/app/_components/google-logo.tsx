import Image from "next/image";

export function GoogleLogo() {
  return (
    <Image
      // Official asset: https://developers.google.com/identity/branding-guidelines
      src="/logo/google-g.png"
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className="size-5 shrink-0 object-contain"
    />
  );
}
