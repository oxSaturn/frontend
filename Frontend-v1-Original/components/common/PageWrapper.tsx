import { Paper } from "@mui/material";
import { useAccount } from "wagmi";
interface Props {
  children: React.ReactNode;
  placeholder: React.ReactNode;
}
export function PageWrapper(props: Props) {
  const { address } = useAccount();
  return (
    <div className="relative mt-0 flex h-full w-full flex-col pt-8">
      {address ? (
        <div>{props.children}</div>
      ) : (
        <Paper className="fixed top-0 flex h-[calc(100%-150px)] w-full flex-col flex-wrap items-center justify-center bg-appBackground p-12 text-center shadow-none after:absolute after:top-0 after:left-0 after:hidden after:h-full after:w-full after:bg-waves after:bg-cover after:bg-no-repeat max-lg:my-auto max-lg:mt-24 max-lg:mb-0 after:xs:block lg:h-[100vh] lg:w-full">
          {props.placeholder}
        </Paper>
      )}
    </div>
  );
}
