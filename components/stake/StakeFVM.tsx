import { useAccount, useBalance, useWaitForTransaction } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { type ReactNode, useReducer } from "react";

import {
  GOV_TOKEN_ADDRESS,
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_SYMBOL,
  STAKING_ADDRESS,
} from "../../stores/constants/contracts";

import {
  useErc20Allowance,
  useErc20Approve,
  usePrepareErc20Approve,
  usePrepareStakeFvmDeposit,
  usePrepareStakeFvmGetReward,
  usePrepareStakeFvmWithdraw,
  useStakeFvmBalanceOf,
  useStakeFvmDeposit,
  useStakeFvmEarned,
  useStakeFvmGetReward,
  useStakeFvmWithdraw,
} from "../../lib/wagmiGen";
import { LoadingSVG } from "../common/LoadingSVG";
import { PRO_OPTIONS } from "../../stores/constants/constants";

const buttonClasses =
  "inline-flex items-center bg-blue/70 text-white hover:bg-blue/50 transition-colors duration-200 px-3 py-1";

const inputClasses =
  "w-full px-2 py-2 text-white hover:ring-1 hover:ring-cyan focus:outline-none focus:ring-1 focus:ring-cyan border-cyan-900/50 border bg-transparent";

interface State {
  stakeNumber: string;
  unstakeNumber: string;
}

interface Action {
  type: "stake" | "unstake";
  payload: string;
}

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "stake":
      return { ...state, stakeNumber: action.payload };
    case "unstake":
      return { ...state, unstakeNumber: action.payload };
    default:
      return { ...state };
  }
}

function SubHeader(props: { text: string }) {
  return <h2 className="text-2xl text-white">{props.text}</h2>;
}

function Section(props: { children: ReactNode }) {
  return (
    <div className="bg-green-900 space-y-3 p-5 border border-cyan-900/70 rounded-md">
      {props.children}
    </div>
  );
}

export function StakeFVM() {
  const { address } = useAccount();

  const [state, dispatch] = useReducer(reducer, {
    stakeNumber: "",
    unstakeNumber: "",
  });

  /**
   * Stake related hooks
   */

  const {
    data: fvmBalance,
    isFetching: isFetchingFvmBalance,
    refetch: refetchFvmBalance,
  } = useBalance({
    address: address!,
    token: GOV_TOKEN_ADDRESS,
    enabled: !!GOV_TOKEN_ADDRESS && !!address,
  });

  const {
    data: stakedBalance,
    isFetching: isFetchingStakedBalance,
    refetch: refetchStakedBalance,
  } = useStakeFvmBalanceOf({
    args: [address!],
    enabled: !!address,
  });

  const {
    data: isApprovalNeeded,
    isRefetching: isRefetchingAllowance,
    refetch: refetchAllowance,
  } = useErc20Allowance({
    address: GOV_TOKEN_ADDRESS,
    args: [address!, STAKING_ADDRESS],
    enabled: !!address,
    select: (allowance) => {
      return allowance < parseUnits(state.stakeNumber, GOV_TOKEN_DECIMALS);
    },
  });

  // prepare approve
  const { config: approveConfig } = usePrepareErc20Approve({
    address: GOV_TOKEN_ADDRESS,
    args: [STAKING_ADDRESS, parseUnits(state.stakeNumber, GOV_TOKEN_DECIMALS)],
    enabled: !!address && !!state.stakeNumber && isApprovalNeeded,
  });

  // approve
  const {
    write: approveFVM,
    isLoading: userApprovingFVM,
    data: approveFVMTx,
  } = useErc20Approve(approveConfig);

  // wait for approve receipt
  const { isFetching: waitingApproveReceipt } = useWaitForTransaction({
    hash: approveFVMTx?.hash,
    onSuccess: () => {
      refetchAllowance();
    },
  });

  // prepare stake
  const { config: stakeConfig } = usePrepareStakeFvmDeposit({
    args: [parseUnits(state.stakeNumber, GOV_TOKEN_DECIMALS), 0n],
    enabled: !!address && !!state.stakeNumber && !isApprovalNeeded,
  });

  // stake
  const {
    write: stakeFVM,
    isLoading: userStakingFVM,
    data: stakeFVMTx,
  } = useStakeFvmDeposit(stakeConfig);

  // wait for stake receipt
  const { isFetching: waitingStakeReceipt } = useWaitForTransaction({
    hash: stakeFVMTx?.hash,
    onSuccess: () => {
      dispatch({ type: "stake", payload: "" });
      refetchFvmBalance();
      refetchStakedBalance();
      refetchEarned();
    },
  });

  /**
   * Rewards related hooks
   */
  // we have only oFVM rewards
  const {
    data: earned,
    isLoading: isFetchingEarned,
    refetch: refetchEarned,
  } = useStakeFvmEarned({
    args: [PRO_OPTIONS.oFVM.tokenAddress, address!],
    enabled: !!address,
  });

  // prepare claim
  const { config: claimConfig } = usePrepareStakeFvmGetReward({
    args: [address!, [PRO_OPTIONS.oFVM.tokenAddress as `0x${string}`]],
    enabled: !!address,
  });

  // claim
  const {
    write: claim,
    isLoading: userClaiming,
    data: claimTx,
  } = useStakeFvmGetReward(claimConfig);

  // wait for claim receipt
  const { isFetching: waitingClaimReceipt } = useWaitForTransaction({
    hash: claimTx?.hash,
    onSuccess: () => {
      // nothing to do
    },
  });

  /**
   * Unstake related hooks
   */

  // prepare unstake
  const { config: unstakeConfig } = usePrepareStakeFvmWithdraw({
    args: [parseUnits(state.unstakeNumber, GOV_TOKEN_DECIMALS)],
    enabled: !!parseFloat(state.unstakeNumber),
  });

  // unstake confirmation modal
  const { write: unstakeFVM, data: unstakeFVMTx } =
    useStakeFvmWithdraw(unstakeConfig);

  // wait for unstake receipt
  const { isFetching: waitingUnstakeReceipt } = useWaitForTransaction({
    hash: unstakeFVMTx?.hash,
    onSuccess: () => {
      dispatch({ type: "unstake", payload: "" });
      refetchFvmBalance();
      refetchStakedBalance();
    },
  });

  if (isApprovalNeeded === undefined) return null;

  return (
    <div className="mx-5 sm:mx-auto sm:max-w-lg space-y-10">
      <h1 className="text-3xl">
        Stake {GOV_TOKEN_SYMBOL} to earn o{GOV_TOKEN_SYMBOL}
      </h1>
      <div className="space-y-5">
        <Section>
          <SubHeader text="Stake" />
          <div className="flex justify-between">
            <span>{GOV_TOKEN_SYMBOL} balance</span>
            <span
              className="underline cursor-pointer"
              onClick={() => {
                dispatch({ type: "stake", payload: fvmBalance?.formatted! });
              }}
            >
              {fvmBalance?.formatted}
            </span>
          </div>
          <div className="space-y-2">
            <input
              type="number"
              min={0}
              className={inputClasses}
              placeholder="0.0"
              value={state.stakeNumber}
              onChange={(e) => {
                dispatch({ type: "stake", payload: e.target.value });
              }}
            />
            <div>
              {isApprovalNeeded ? (
                waitingApproveReceipt ? (
                  <button className={buttonClasses} disabled>
                    Approving {GOV_TOKEN_SYMBOL}{" "}
                    <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                  </button>
                ) : isRefetchingAllowance ? (
                  <button className={buttonClasses} disabled>
                    Approved
                  </button>
                ) : (
                  <button className={buttonClasses} onClick={approveFVM}>
                    Approve {GOV_TOKEN_SYMBOL}
                  </button>
                )
              ) : null}

              {!isApprovalNeeded ? (
                waitingStakeReceipt ? (
                  <button className={buttonClasses} disabled>
                    Staking {GOV_TOKEN_SYMBOL}{" "}
                    <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                  </button>
                ) : (
                  <button className={buttonClasses} onClick={stakeFVM}>
                    Stake {GOV_TOKEN_SYMBOL}
                  </button>
                )
              ) : null}
              {/* todo, should notify when stake successfully? */}
            </div>
          </div>
        </Section>

        <Section>
          <SubHeader text="Earned" />
          <div className="flex justify-between">
            <span>o{GOV_TOKEN_SYMBOL}</span>
            <span>
              {isFetchingEarned ? (
                <LoadingSVG className="animate-spin h-5 w-5" />
              ) : (
                formatUnits(earned ?? 0n, GOV_TOKEN_DECIMALS)
              )}
            </span>
          </div>

          <div>
            <button onClick={claim} className={buttonClasses}>
              Claim{" "}
              {waitingClaimReceipt ? (
                <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
              ) : null}
            </button>
          </div>
        </Section>

        <Section>
          <SubHeader text="Withdraw" />
          <div className="flex justify-between">
            <span>Staked {GOV_TOKEN_SYMBOL}</span>
            <span
              className="underline cursor-pointer"
              onClick={() => {
                dispatch({
                  type: "unstake",
                  payload: formatUnits(stakedBalance ?? 0n, GOV_TOKEN_DECIMALS),
                });
              }}
            >
              {isFetchingStakedBalance ? (
                <LoadingSVG className="animate-spin h-5 w-5" />
              ) : (
                formatUnits(stakedBalance ?? 0n, GOV_TOKEN_DECIMALS)
              )}
            </span>
          </div>
          <div className="space-y-2">
            <input
              type="number"
              min={0}
              className={inputClasses}
              placeholder="0.0"
              value={state.unstakeNumber}
              onChange={(e) => {
                dispatch({ type: "unstake", payload: e.target.value });
              }}
            />
            <div>
              <button
                onClick={() => {
                  if (parseFloat(state.unstakeNumber)) {
                    unstakeFVM?.();
                  }
                }}
                className={buttonClasses}
              >
                Withdraw{" "}
                {waitingUnstakeReceipt ? (
                  <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                ) : null}
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
