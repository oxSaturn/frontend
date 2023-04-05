import Image from "next/image";

function Configure() {
  return (
    <div className="w-100 h-100 relative flex min-h-screen flex-col items-center justify-center bg-none">
      <Image src="/images/logo-icon-configure.png" width="100%" height="100%" />
      <div className="pointer-events-none absolute top-0 right-0 -z-10 h-full w-full bg-[#040105]" />
      <div className="pointer-events-none absolute bottom-4 left-4 -z-10 h-[512px] w-[512px] bg-[#d6d6d6] opacity-50 blur-[256px]" />
      <div className="pointer-events-none absolute top-4 right-4 -z-10 h-[512px] w-[512px] bg-[#00f3cb] opacity-50 blur-[256px]" />
    </div>
  );
}

export default Configure;
