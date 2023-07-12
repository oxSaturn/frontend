import { useAccount, useBalance, useWaitForTransaction } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { type ReactNode, useReducer, useMemo } from "react";

import { LoadingSVG } from "../common/LoadingSVG";

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
  useStakeFvmGetReward,
  useStakeFvmWithdraw,
} from "../../lib/wagmiGen";
import { formatCurrency } from "../../utils/utils";

import { useRewardTokens } from "./lib/useRewardTokens";
import { reducer } from "./lib/reducer";
import { useApr } from "./lib/useApr";
import { useTotalStaked } from "./lib/useTotalStaked";

const buttonClasses =
  "flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60";

const inputClasses =
  "w-full px-2 py-2 text-white hover:ring-1 hover:ring-cyan focus:outline-none focus:ring-1 focus:ring-cyan border-cyan-900/50 border bg-transparent";

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

  const { data: totalStaked } = useTotalStaked();

  const { data: fvmBalance, refetch: refetchFvmBalance } = useBalance({
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
    data: approveFVMTx,
    isLoading: isWritingApprove,
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
    data: stakeFVMTx,
    isLoading: isWritingStake,
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

  const {
    data: earned,
    isFetching: isFetchingEarned,
    refetch: refetchEarned,
  } = useRewardTokens();

  const filteredEarned = useMemo(() => {
    return earned?.filter((e) => Number(e.amount) > 0);
  }, [earned]);

  const { data: aprs } = useApr();

  // prepare claim
  const { config: claimConfig } = usePrepareStakeFvmGetReward({
    args: [address!, filteredEarned?.map((e) => e.address) ?? []],
    enabled: !!address && !!filteredEarned && filteredEarned.length > 0,
  });

  // claim
  const {
    write: claim,
    data: claimTx,
    isLoading: isWritingClaim,
  } = useStakeFvmGetReward(claimConfig);

  // wait for claim receipt
  const { isFetching: waitingClaimReceipt } = useWaitForTransaction({
    hash: claimTx?.hash,
    onSuccess: () => {
      refetchEarned();
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

  // init unstake, wallet will ask for confirmation
  // isLoading is true when user confirms
  const {
    write: unstakeFVM,
    data: unstakeFVMTx,
    isLoading: isWritingUnstake,
  } = useStakeFvmWithdraw(unstakeConfig);

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
    <div className="mx-5 sm:mx-auto sm:max-w-lg space-y-10 font-sono">
      <h1 className="text-3xl">
        Stake {GOV_TOKEN_SYMBOL} to earn o{GOV_TOKEN_SYMBOL}
      </h1>
      <div className="space-y-5">
        <Section>
          <SubHeader text="Stake" />
          <div className="flex justify-between">
            <span>Total Staked</span>
            <span
              className="underline cursor-pointer"
              onClick={() => {
                dispatch({ type: "stake", payload: fvmBalance?.formatted! });
              }}
            >
              ${formatCurrency(totalStaked)}
            </span>
          </div>
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
          <div className="flex items-start justify-between">
            <div>APR</div>
            <div className="flex flex-col">
              {aprs && aprs.length > 0 ? (
                aprs
                  .filter((apr) => Number(apr.minApr) > 0)
                  .map((apr) => (
                    <div
                      key={apr.address}
                      className="flex items-center justify-end gap-2"
                    >
                      <div>
                        {apr.minApr} - ${apr.maxApr}%
                      </div>
                      <div>{apr.symbol}</div>
                    </div>
                  ))
              ) : (
                <div>0.00</div>
              )}
            </div>
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
                waitingApproveReceipt || isWritingApprove ? (
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
                waitingStakeReceipt || isWritingStake ? (
                  <button className={buttonClasses} disabled>
                    Staking {GOV_TOKEN_SYMBOL}{" "}
                    <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                  </button>
                ) : (
                  <button
                    className={buttonClasses}
                    onClick={stakeFVM}
                    disabled={!stakeConfig.request}
                  >
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
          <div>
            {filteredEarned &&
              filteredEarned.map((e) => (
                <div key={e.address} className="flex justify-between">
                  <span>{e.symbol}</span>
                  <span>
                    {isFetchingEarned ? (
                      <LoadingSVG className="animate-spin h-5 w-5" />
                    ) : (
                      formatCurrency(e.amount)
                    )}
                  </span>
                </div>
              ))}
            {filteredEarned && filteredEarned.length === 0 && (
              <div className="flex items-center justify-between">
                Nothing earned yet
              </div>
            )}
          </div>

          <div>
            <button
              onClick={claim}
              className={buttonClasses}
              disabled={
                waitingClaimReceipt ||
                isWritingClaim ||
                !filteredEarned ||
                filteredEarned?.length === 0
              }
            >
              {waitingClaimReceipt || isWritingClaim ? (
                <>
                  Claiming
                  <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                </>
              ) : (
                "Claim"
              )}
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
                disabled={
                  waitingUnstakeReceipt ||
                  isWritingUnstake ||
                  // enabled only when
                  // 1. user has input a number
                  // 2. the unstake tx will likely be successful
                  // 3. user has more staked balance than input number
                  !(
                    Number.isNaN(parseFloat(state.unstakeNumber)) === false &&
                    unstakeConfig.request &&
                    (stakedBalance &&
                    stakedBalance >=
                      parseUnits(state.unstakeNumber, GOV_TOKEN_DECIMALS)
                      ? true
                      : false)
                  )
                }
                className={buttonClasses}
              >
                {waitingUnstakeReceipt || isWritingUnstake ? (
                  <>
                    Withdrawing
                    <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                  </>
                ) : (
                  "Withdraw"
                )}
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
