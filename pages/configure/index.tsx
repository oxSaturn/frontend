import Image from "next/image";

function Configure() {
  return (
    <div className="w-100 h-100 relative flex min-h-screen flex-col items-center justify-center bg-none">
      <Image
        src="/images/only_bvm_blue.png"
        width="100"
        height="100"
        alt="BVM by Velocimeter logo"
      />
      <div className="pointer-events-none absolute top-0 right-0 -z-10 h-full w-full bg-appBackground" />
    </div>
  );
}

export default Configure;
