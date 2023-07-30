import { PageWrapper } from "../../components/common/PageWrapper";
import { VeBoost } from "../../components/veboost/veboost";

export default function Stake() {
  return (
    <PageWrapper
      placeholder={
        <div className="relative z-10">
          <h1 className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl">
            Create boosted veNFT
          </h1>
          <p className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg">
            This transaction will take the amount of WETH chosen and use it to
            market buy BVM, then match it with BVM at the rate displayed, and
            lock all of that in a new max locked veBVM NFT into your wallet.
          </p>
        </div>
      }
    >
      <VeBoost />
    </PageWrapper>
  );
}
