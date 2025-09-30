import Image from "next/image";
import Link from "next/link";

export function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image src="/logo.png" alt="Rozo Logo" width={32} height={32} />
      <span className="font-bold text-xl text-white">ROZO Banana</span>
    </Link>
  );
}
