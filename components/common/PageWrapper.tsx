import { useAccount } from "wagmi";
interface Props {
  children: React.ReactNode;
  placeholder: React.ReactNode;
}
export function PageWrapper(props: Props) {
  const { address } = useAccount();
  return (
    <div className="flex h-full w-full flex-shrink-0 flex-grow flex-col">
      {address ? (
        <div>{props.children}</div>
      ) : (
        <div className="flex h-full w-full flex-grow flex-col items-center justify-center px-10 text-center shadow-none md:bg-transparent lg:w-full">
          {props.placeholder}
        </div>
      )}
    </div>
  );
}
