import { PageWrapper } from "../../components/common/PageWrapper";
import { VeBoost } from "../../components/veboost/veboost";
import { W_NATIVE_SYMBOL } from "../../stores/constants/constants";
import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

export default function VeBoostPage() {
  return (
    <PageWrapper
      placeholder={
        <div className="relative z-10">
          <h1 className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl">
            Create boosted veNFT
          </h1>
          <p className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg">
            This transaction will take the amount of {W_NATIVE_SYMBOL} chosen
            and use it to market buy {GOV_TOKEN_SYMBOL}, then match it with{" "}
            {GOV_TOKEN_SYMBOL} at the rate displayed, and lock all of that in a
            new max locked ve
            {GOV_TOKEN_SYMBOL} NFT into your wallet.
          </p>
        </div>
      }
    >
      <VeBoost />
    </PageWrapper>
  );
}
