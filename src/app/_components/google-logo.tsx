import Image from "next/image";

export function GoogleLogo() {
  return (
    <Image
      // Official asset: https://developers.google.com/identity/branding-guidelines
      src="/logo/google-g.png"
      alt=""
      aria-hidden="true"
      width={28}
      height={28}
      className="size-7 shrink-0 rounded-full bg-white object-contain p-1"
    />
  );
}
