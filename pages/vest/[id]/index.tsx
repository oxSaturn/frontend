import { Typography, SvgIcon } from "@mui/material";

import Vesting from "../../../components/ssVest/ssVest";
import { PageWrapper } from "../../../components/common/PageWrapper";

function BalanceIcon({ className }: { className: string }) {
  return (
    <SvgIcon viewBox="0 0 64 64" strokeWidth="1" className={className}>
      <g strokeWidth="1" transform="translate(0, 0)">
        <rect
          data-color="color-2"
          x="9"
          y="10"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          width="46"
          height="40"
          strokeLinejoin="miter"
        ></rect>{" "}
        <line
          data-color="color-2"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          x1="14"
          y1="57"
          x2="14"
          y2="61"
          strokeLinejoin="miter"
        ></line>{" "}
        <line
          data-color="color-2"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          x1="50"
          y1="57"
          x2="50"
          y2="61"
          strokeLinejoin="miter"
        ></line>{" "}
        <rect
          x="2"
          y="3"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          width="60"
          height="54"
          strokeLinejoin="miter"
        ></rect>{" "}
        <line
          data-cap="butt"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeMiterlimit="10"
          x1="27.757"
          y1="25.757"
          x2="22.103"
          y2="20.103"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        ></line>{" "}
        <line
          data-cap="butt"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeMiterlimit="10"
          x1="36.243"
          y1="25.757"
          x2="41.897"
          y2="20.103"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        ></line>{" "}
        <line
          data-cap="butt"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeMiterlimit="10"
          x1="36.243"
          y1="34.243"
          x2="41.897"
          y2="39.897"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        ></line>{" "}
        <line
          data-cap="butt"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeMiterlimit="10"
          x1="27.757"
          y1="34.243"
          x2="22.103"
          y2="39.897"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        ></line>{" "}
        <circle
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          cx="32"
          cy="30"
          r="14"
          strokeLinejoin="miter"
        ></circle>{" "}
        <circle
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          cx="32"
          cy="30"
          r="6"
          strokeLinejoin="miter"
        ></circle>
      </g>
    </SvgIcon>
  );
}

function Vest() {
  return (
    <PageWrapper
      placeholder={
        <>
          <BalanceIcon className="mb-8 -mt-20 text-7xl sm:text-8xl" />
          <Typography
            className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
            variant="h1"
          >
            Vest
          </Typography>
          <Typography
            className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
            variant="body2"
          >
            Lock your BVM to earn rewards and governance rights. Each locked
            position is created and represented as an NFT, meaning you can hold
            multiple locked positions.
          </Typography>
        </>
      }
    >
      <Vesting />
    </PageWrapper>
  );
}

export default Vest;
