import { PageWrapper } from "../../components/common/PageWrapper";
import { StakeFVM } from "../../components/stake/StakeFVM";

export default function Stake() {
  return (
    <PageWrapper
      placeholder={
        <div className="relative z-10">
          <h1 className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl">
            Stake
          </h1>
          <p className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg">
            Stake your FVM to earn oFVM!
          </p>
        </div>
      }
    >
      <StakeFVM />
    </PageWrapper>
  );
}
