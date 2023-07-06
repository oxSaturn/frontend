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
        <Paper className="fixed top-0 flex h-full w-full flex-col flex-wrap items-center justify-center bg-[rgba(17,23,41,0.2)] p-12 text-center shadow-none max-lg:my-auto max-lg:mt-24 max-lg:mb-0 lg:h-[100vh] lg:w-full">
          {props.placeholder}
        </Paper>
      )}
    </div>
  );
}