import EventEmitter from "events";

import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import BigNumber from "bignumber.js";

import {
  getContract,
  formatUnits,
  parseUnits,
  formatEther,
  parseEther,
  type WalletClient,
  type WriteContractReturnType,
  isAddress,
  BaseError,
} from "viem";
import { canto } from "viem/chains";
import { getAccount, getWalletClient } from "@wagmi/core";

import { Dispatcher } from "flux";

import { queryClient } from "../pages/_app";
import { formatCurrency } from "../utils/utils";

import tokenlistArb from "../mainnet-arb-token-list.json";
import tokenlistCan from "../mainnet-canto-token-list.json";

import {
  ACTIONS,
  CONTRACTS,
  MAX_UINT256,
  ZERO_ADDRESS,
  NATIVE_TOKEN,
  W_NATIVE_ADDRESS,
  W_NATIVE_ABI,
  PAIR_DECIMALS,
} from "./constants/constants";
import viemClient, { chunkArray, multicallChunks } from "./connectors/viem";

import {
  BaseAsset,
  Pair,
  RouteAsset,
  VeToken,
  Vote,
  VestNFT,
  GovToken,
  Votes,
  QuoteSwapResponse,
  Bribe,
  VeDistReward,
  ITransaction,
  Gauge,
  hasGauge,
  TransactionStatus,
} from "./types/types";

import stores from ".";

const isArbitrum = process.env.NEXT_PUBLIC_CHAINID === "42161";

const tokenlist = isArbitrum ? tokenlistArb : tokenlistCan;

const CANTO_OPTION_TOKEN = "0x9f9A1Aa08910867F38359F4287865c4A1162C202";
class Store {
  dispatcher: Dispatcher<any>;
  emitter: EventEmitter;
  store: {
    baseAssets: BaseAsset[];
    swapAssets: BaseAsset[];
    routeAssets: RouteAsset[];
    govToken: GovToken | null;
    veToken: VeToken | null;
    pairs: Pair[];
    vestNFTs: VestNFT[];
    rewards: {
      xBribes: Gauge[];
      xxBribes: Gauge[];
      rewards: Gauge[];
      BLOTR_rewards: Gauge[];
      veDist: VeDistReward[];
    };
    updateDate: number;
    tokenPrices: Map<string, number>;
    tvl: number;
    tbv: number;
    circulatingSupply: number;
    marketCap: number;
  };

  constructor(dispatcher: Dispatcher<any>, emitter: EventEmitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      baseAssets: [],
      swapAssets: [],
      routeAssets: [],
      govToken: null,
      veToken: null,
      pairs: [],
      vestNFTs: [],
      rewards: {
        xBribes: [],
        xxBribes: [],
        rewards: [],
        BLOTR_rewards: [],
        veDist: [],
      },
      updateDate: 0,
      tokenPrices: new Map(),
      tvl: 0,
      tbv: 0,
      circulatingSupply: 0,
      marketCap: 0,
    };

    dispatcher.register(
      function (this: Store, payload: { type: string; content: any }) {
        console.log("<< Payload of dispatched event", payload);
        switch (payload.type) {
          case ACTIONS.CONFIGURE_SS:
            this.configure();
            break;
          case ACTIONS.GET_BALANCES:
            this.getBalances();
            break;
          case ACTIONS.SEARCH_ASSET:
            this.searchBaseAsset(payload);
            break;

          case ACTIONS.UPDATED:
            break;

          // LIQUIDITY
          case ACTIONS.CREATE_PAIR_AND_STAKE:
            this.createPairStake(payload);
            break;
          case ACTIONS.CREATE_PAIR_AND_DEPOSIT:
            this.createPairDeposit(payload);
            break;
          case ACTIONS.ADD_LIQUIDITY:
            this.addLiquidity(payload);
            break;
          case ACTIONS.STAKE_LIQUIDITY:
            this.stakeLiquidity(payload);
            break;
          case ACTIONS.ADD_LIQUIDITY_AND_STAKE:
            this.addLiquidityAndStake(payload);
            break;
          case ACTIONS.QUOTE_ADD_LIQUIDITY:
            this.quoteAddLiquidity(payload);
            break;
          case ACTIONS.GET_LIQUIDITY_BALANCES:
            this.getLiquidityBalances(payload);
            break;
          case ACTIONS.REMOVE_LIQUIDITY:
            this.removeLiquidity(payload);
            break;
          case ACTIONS.UNSTAKE_AND_REMOVE_LIQUIDITY:
            this.unstakeAndRemoveLiquidity(payload);
            break;
          case ACTIONS.QUOTE_REMOVE_LIQUIDITY:
            this.quoteRemoveLiquidity(payload);
            break;
          case ACTIONS.UNSTAKE_LIQUIDITY:
            this.unstakeLiquidity(payload);
            break;
          case ACTIONS.CREATE_GAUGE:
            this.createGauge(payload);
            break;

          // SWAP
          case ACTIONS.QUOTE_SWAP:
            this.quoteSwap(payload);
            break;
          case ACTIONS.SWAP:
            this.swap(payload);
            break;

          // WRAP / UNWRAP:
          case ACTIONS.WRAP_UNWRAP:
            this.wrapOrUnwrap(payload);
            break;

          // VESTING
          case ACTIONS.GET_VEST_NFTS:
            this.getVestNFTs();
            break;
          case ACTIONS.CREATE_VEST:
            this.createVest(payload);
            break;
          case ACTIONS.INCREASE_VEST_AMOUNT:
            this.increaseVestAmount(payload);
            break;
          case ACTIONS.INCREASE_VEST_DURATION:
            this.increaseVestDuration(payload);
            break;
          case ACTIONS.RESET_VEST:
            this.resetVest(payload);
            break;
          case ACTIONS.WITHDRAW_VEST:
            this.withdrawVest(payload);
            break;
          case ACTIONS.MERGE_NFT:
            this.mergeNft(payload);
            break;

          //VOTE
          case ACTIONS.VOTE:
            this.vote(payload);
            break;
          case ACTIONS.GET_VEST_VOTES:
            this.getVestVotes(payload);
            break;
          case ACTIONS.CREATE_BRIBE:
            this.createBribe(payload);
            break;
          // case ACTIONS.GET_VEST_BALANCES:
          //   this.getVestBalances(payload);
          //   break;

          //REWARDS
          case ACTIONS.GET_REWARD_BALANCES:
            this.getRewardBalances(payload);
            break;
          case ACTIONS.CLAIM_X_BRIBE:
            this.claimXBribes(payload);
            break;
          case ACTIONS.CLAIM_XX_BRIBE:
            this.claimXXBribes(payload);
            break;

          case ACTIONS.CLAIM_REWARD:
            this.claimRewards(payload);
            break;
          case ACTIONS.CLAIM_BLOTR_REWARD:
            this.claimBlotrRewards(payload);
            break;
          case ACTIONS.CLAIM_VE_DIST:
            this.claimVeDist(payload);
            break;
          case ACTIONS.CLAIM_ALL_REWARDS:
            this.claimAllRewards(payload);
            break;

          case ACTIONS.BRIBE_AUTO_BRIBE:
            this.bribeAutoBribe(payload);
            break;

          case ACTIONS.BUY:
            this.buy(payload);
            break;
          case ACTIONS.CLAIM_EARNED:
            this.claimEarned(payload);
            break;
          case ACTIONS.CLAIM_REF_EARNED:
            this.claimRefEarned(payload);
            break;

          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore = <K extends keyof Store["store"]>(index: K) => {
    return this.store[index];
  };

  setStore = (obj: { [key: string]: any }) => {
    this.store = { ...this.store, ...obj };
    return this.emitter.emit(ACTIONS.STORE_UPDATED);
  };

  getNFTByID = async (id: string) => {
    try {
      const vestNFTs = this.getStore("vestNFTs");
      let theNFT = vestNFTs.filter((vestNFT) => {
        return vestNFT.id == id;
      });

      if (theNFT.length > 0) {
        return theNFT[0];
      }

      const address = getAccount().address;
      if (!address) {
        console.warn("address not found");
        return null;
      }

      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");
      if (!veToken || !govToken) {
        console.warn("veToken or govToken not found");
        return null;
      }

      const vestingContract = {
        abi: CONTRACTS.VE_TOKEN_ABI,
        address: CONTRACTS.VE_TOKEN_ADDRESS,
      } as const;

      const nftsLength = await viemClient.readContract({
        ...vestingContract,
        functionName: "balanceOf",
        args: [address],
      });
      const arr = Array.from(
        { length: parseInt(nftsLength.toString()) },
        (v, i) => i
      );

      const nfts: VestNFT[] = await Promise.all(
        arr.map(async (idx) => {
          const tokenIndex = await viemClient.readContract({
            ...vestingContract,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(idx)],
          });
          const [[lockedAmount, lockedEnd], lockValue, voted, totalSupply] =
            await viemClient.multicall({
              allowFailure: false,
              multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
              contracts: [
                {
                  ...vestingContract,
                  functionName: "locked",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "balanceOfNFT",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "voted",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "totalSupply",
                },
              ],
            });

          const [actionedInCurrentEpoch, lastVoted] =
            await this._checkNFTActionEpoch(tokenIndex.toString());

          return {
            id: tokenIndex.toString(),
            lockEnds: lockedEnd.toString(),
            lockAmount: formatUnits(lockedAmount, govToken.decimals),
            lockValue: formatUnits(lockValue, veToken.decimals),
            actionedInCurrentEpoch,
            reset: actionedInCurrentEpoch && !voted,
            lastVoted,
            influence:
              Number(formatUnits(lockValue, veToken.decimals)) /
              Number(formatUnits(totalSupply, veToken.decimals)),
          };
        })
      );

      this.setStore({ vestNFTs: nfts });

      theNFT = nfts.filter((nft) => {
        return nft.id == id;
      });

      if (theNFT.length > 0) {
        return theNFT[0];
      }

      return null;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  _updateVestNFTByID = async (id: string) => {
    try {
      const vestNFTs = this.getStore("vestNFTs");
      let theNFT = vestNFTs.filter((vestNFT) => {
        return vestNFT.id == id;
      });

      if (theNFT.length == 0) {
        return null;
      }

      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");
      if (!veToken || !govToken) {
        console.warn("veToken or govToken not found");
        return null;
      }

      const vestingContract = {
        abi: CONTRACTS.VE_TOKEN_ABI,
        address: CONTRACTS.VE_TOKEN_ADDRESS,
      } as const;

      const tokenIndex = await viemClient.readContract({
        ...vestingContract,
        functionName: "tokenOfOwnerByIndex",
        args: [account, BigInt(id)],
      });

      const [[lockedAmount, lockedEnd], lockValue, voted, totalSupply] =
        await viemClient.multicall({
          allowFailure: false,
          multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
          contracts: [
            {
              ...vestingContract,
              functionName: "locked",
              args: [tokenIndex],
            },
            {
              ...vestingContract,
              functionName: "balanceOfNFT",
              args: [tokenIndex],
            },
            {
              ...vestingContract,
              functionName: "voted",
              args: [tokenIndex],
            },
            {
              ...vestingContract,
              functionName: "totalSupply",
            },
          ],
        });

      const [actionedInCurrentEpoch, lastVoted] =
        await this._checkNFTActionEpoch(id);

      const newVestNFTs: VestNFT[] = vestNFTs.map((nft) => {
        if (nft.id == id) {
          return {
            id: id,
            lockEnds: lockedEnd.toString(),
            lockAmount: formatUnits(lockedAmount, govToken.decimals),
            lockValue: formatUnits(lockValue, veToken.decimals),
            actionedInCurrentEpoch,
            reset: actionedInCurrentEpoch && !voted,
            lastVoted,
            influence:
              Number(formatUnits(lockValue, veToken.decimals)) /
              Number(formatUnits(totalSupply, veToken.decimals)),
          };
        }

        return nft;
      });

      this.setStore({ vestNFTs: newVestNFTs });
      this.emitter.emit(ACTIONS.UPDATED);
      return null;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  getPairByAddress = async (pairAddress: `0x${string}`) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const pairs = this.getStore("pairs");
      const filteredPairs = pairs.filter((pair) => {
        return pair.address.toLowerCase() == pairAddress.toLowerCase();
      });

      if (filteredPairs.length > 0) {
        const pc = {
          abi: CONTRACTS.PAIR_ABI,
          address: pairAddress,
        } as const;

        const [totalSupply, reserve0, reserve1, balanceOf] =
          await viemClient.multicall({
            allowFailure: false,
            multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
            contracts: [
              {
                ...pc,
                functionName: "totalSupply",
              },
              {
                ...pc,
                functionName: "reserve0",
              },
              {
                ...pc,
                functionName: "reserve1",
              },
              {
                ...pc,
                functionName: "balanceOf",
                args: [account],
              },
            ],
          });

        const returnPair = filteredPairs[0];
        returnPair.balance = formatUnits(balanceOf, PAIR_DECIMALS);
        returnPair.totalSupply = formatUnits(totalSupply, PAIR_DECIMALS);
        returnPair.reserve0 = formatUnits(reserve0, returnPair.token0.decimals);
        returnPair.reserve1 = formatUnits(reserve1, returnPair.token1.decimals);

        return returnPair;
      }

      const pairContract = {
        abi: CONTRACTS.PAIR_ABI,
        address: pairAddress,
      } as const;
      const gaugesContract = {
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
      } as const;

      const totalWeight = await viemClient.readContract({
        ...gaugesContract,
        functionName: "totalWeight",
      });

      const [
        token0,
        token1,
        totalSupply,
        symbol,
        reserve0,
        reserve1,
        decimals,
        balanceOf,
        stable,
        gaugeAddress,
        gaugeWeight,
      ] = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: [
          {
            ...pairContract,
            functionName: "token0",
          },
          {
            ...pairContract,
            functionName: "token1",
          },
          {
            ...pairContract,
            functionName: "totalSupply",
          },
          {
            ...pairContract,
            functionName: "symbol",
          },
          {
            ...pairContract,
            functionName: "reserve0",
          },
          {
            ...pairContract,
            functionName: "reserve1",
          },
          {
            ...pairContract,
            functionName: "decimals",
          },
          {
            ...pairContract,
            functionName: "balanceOf",
            args: [account],
          },
          {
            ...pairContract,
            functionName: "stable",
          },
          {
            ...gaugesContract,
            functionName: "gauges",
            args: [pairAddress],
          },
          {
            ...gaugesContract,
            functionName: "weights",
            args: [pairAddress],
          },
        ],
      });

      const token0Contract = {
        abi: CONTRACTS.ERC20_ABI,
        address: token0,
      } as const;

      const token1Contract = {
        abi: CONTRACTS.ERC20_ABI,
        address: token1,
      } as const;

      const [
        token0Symbol,
        token0Decimals,
        token0Balance,
        token1Symbol,
        token1Decimals,
        token1Balance,
      ] = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: [
          {
            ...token0Contract,
            functionName: "symbol",
          },
          {
            ...token0Contract,
            functionName: "decimals",
          },
          {
            ...token0Contract,
            functionName: "balanceOf",
            args: [account],
          },
          {
            ...token1Contract,
            functionName: "symbol",
          },
          {
            ...token1Contract,
            functionName: "decimals",
          },
          {
            ...token1Contract,
            functionName: "balanceOf",
            args: [account],
          },
        ],
      });

      const thePair: Pair = {
        address: pairAddress,
        symbol: symbol,
        decimals: decimals,
        stable,
        token0: {
          address: token0,
          symbol: token0Symbol,
          balance: formatUnits(
            token0Balance,
            parseInt(token0Decimals.toString())
          ),
          decimals: parseInt(token0Decimals.toString()),
          name: "",
          logoURI: "",
          local: false,
        },
        token1: {
          address: token1,
          symbol: token1Symbol,
          balance: formatUnits(
            token1Balance,
            parseInt(token1Decimals.toString())
          ),
          decimals: parseInt(token1Decimals.toString()),
          name: "",
          logoURI: "",
          local: false,
        },
        apr: 0,
        oblotr_apr: 0,
        total_supply: 0,
        token0_address: token0,
        token1_address: token1,
        balance: formatUnits(balanceOf, decimals),
        totalSupply: formatUnits(totalSupply, decimals),
        reserve0: formatUnits(reserve0, parseInt(token0Decimals.toString())),
        reserve1: formatUnits(reserve1, parseInt(token1Decimals.toString())),
        tvl: 0,
        gauge_address: gaugeAddress,
        isStable: stable,
      };

      if (gaugeAddress !== ZERO_ADDRESS) {
        const gaugeContract = {
          abi: CONTRACTS.GAUGE_ABI,
          address: gaugeAddress,
        } as const;

        const external_bribe = await viemClient.readContract({
          ...gaugeContract,
          functionName: "external_bribe",
        });

        const wrapped_bribe_address = await viemClient.readContract({
          address: CONTRACTS.WXB_ADDRESS,
          abi: CONTRACTS.BRIBE_FACTORY_ABI,
          functionName: "oldBribeToNew",
          args: [external_bribe],
        });
        const x_wrapped_bribe_address = await viemClient.readContract({
          address: CONTRACTS.X_WXB_ADDRESS,
          abi: CONTRACTS.BRIBE_FACTORY_ABI,
          functionName: "oldBribeToNew",
          args: [external_bribe],
        });
        const xx_wrapped_bribe_address = await viemClient.readContract({
          address: CONTRACTS.XX_WXB_ADDRESS,
          abi: CONTRACTS.BRIBE_FACTORY_ABI,
          functionName: "oldBribeToNew",
          args: [external_bribe],
        });

        //wrapped bribe address is coming from api. if the api doesnt work this will break
        const bribeContract = {
          abi: CONTRACTS.BRIBE_ABI,
          address: wrapped_bribe_address,
        } as const;
        const bribeContractInstance = getContract({
          ...bribeContract,
          publicClient: viemClient,
        });
        const x_bribeContract = {
          abi: CONTRACTS.BRIBE_ABI,
          address: x_wrapped_bribe_address,
        } as const;
        const x_bribeContractInstance = getContract({
          ...x_bribeContract,
          publicClient: viemClient,
        });
        const xx_bribeContract = {
          abi: CONTRACTS.BRIBE_ABI,
          address: xx_wrapped_bribe_address,
        } as const;
        const xx_bribeContractInstance = getContract({
          ...xx_bribeContract,
          publicClient: viemClient,
        });

        const [totalSupply, gaugeBalance, bribeAddress] =
          await viemClient.multicall({
            allowFailure: false,
            multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
            contracts: [
              {
                ...gaugeContract,
                functionName: "totalSupply",
              },
              {
                ...gaugeContract,
                functionName: "balanceOf",
                args: [account],
              },
              {
                ...gaugesContract,
                functionName: "external_bribes",
                args: [gaugeAddress],
              },
            ],
          });

        const tokensLength =
          await bribeContractInstance.read.rewardsListLength();
        const x_tokensLength =
          await x_bribeContractInstance.read.rewardsListLength();
        const xx_tokensLength =
          await xx_bribeContractInstance.read.rewardsListLength();

        const arry = Array.from(
          { length: parseInt(tokensLength.toString()) },
          (v, i) => i
        );
        const x_arry = Array.from(
          { length: parseInt(x_tokensLength.toString()) },
          (v, i) => i
        );
        const xx_arry = Array.from(
          { length: parseInt(xx_tokensLength.toString()) },
          (v, i) => i
        );

        const bribes = await Promise.all(
          arry.map(async (idx) => {
            const tokenAddress = await bribeContractInstance.read.rewards([
              BigInt(idx),
            ]);

            const token = await this.getBaseAsset(tokenAddress);
            if (!token) {
              throw new Error("No token found. getPairByAddress");
            }

            const rewardRate = await viemClient.readContract({
              ...gaugeContract,
              functionName: "rewardRate",
              args: [tokenAddress],
            });

            return {
              token: token,
              rewardAmount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
              reward_ammount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
              rewardAmmount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
            };
          })
        );
        const x_bribes = await Promise.all(
          x_arry.map(async (idx) => {
            const tokenAddress = await x_bribeContractInstance.read.rewards([
              BigInt(idx),
            ]);

            const token = await this.getBaseAsset(tokenAddress);
            if (!token) {
              throw new Error("No token found. getPairByAddress");
            }

            const rewardRate = await viemClient.readContract({
              ...gaugeContract,
              functionName: "rewardRate",
              args: [tokenAddress],
            });

            return {
              token: token,
              rewardAmount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
              reward_ammount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
              rewardAmmount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
            };
          })
        );
        const xx_bribes = await Promise.all(
          xx_arry.map(async (idx) => {
            const tokenAddress = await xx_bribeContractInstance.read.rewards([
              BigInt(idx),
            ]);

            const token = await this.getBaseAsset(tokenAddress);
            if (!token) {
              throw new Error("No token found. getPairByAddress");
            }

            const rewardRate = await viemClient.readContract({
              ...gaugeContract,
              functionName: "rewardRate",
              args: [tokenAddress],
            });

            return {
              token: token,
              rewardAmount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
              reward_ammount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
              rewardAmmount: Number(
                formatUnits(rewardRate * BigInt(604800), token.decimals)
              ),
            };
          })
        );

        const weightPercent = (
          (Number(gaugeWeight) * 100) /
          Number(totalWeight)
        ).toFixed(2);

        thePair.gauge = {
          address: gaugeAddress,
          apr: 0,
          votes: 0,
          tbv: 0,
          reward: 0,
          bribeAddress: bribeAddress,
          bribe_address: bribeAddress,
          decimals: 18,
          balance: formatEther(gaugeBalance),
          totalSupply: formatEther(totalSupply),
          total_supply: Number(formatEther(totalSupply)),
          weight: formatEther(gaugeWeight),
          weightPercent,
          bribes: bribes,
          x_bribes: x_bribes,
          xx_bribes: xx_bribes,
          wrapped_bribe_address,
          x_wrapped_bribe_address,
          xx_wrapped_bribe_address,
        };
      }

      pairs.push(thePair);
      this.setStore({ pairs: pairs });

      return thePair;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  getPair = async (
    addressA: `0x${string}`,
    addressB: `0x${string}`,
    stab: boolean
  ) => {
    if (addressA === NATIVE_TOKEN.symbol) {
      addressA = W_NATIVE_ADDRESS as `0x${string}`;
    }
    if (addressB === NATIVE_TOKEN.symbol) {
      addressB = W_NATIVE_ADDRESS as `0x${string}`;
    }

    const account = getAccount().address;
    if (!account) {
      console.warn("account not found");
      return null;
    }

    const pairs = this.getStore("pairs");
    let thePair: any = pairs.filter((pair) => {
      return (
        (pair.token0.address.toLowerCase() == addressA.toLowerCase() &&
          pair.token1.address.toLowerCase() == addressB.toLowerCase() &&
          pair.stable == stab) ||
        (pair.token0.address.toLowerCase() == addressB.toLowerCase() &&
          pair.token1.address.toLowerCase() == addressA.toLowerCase() &&
          pair.stable == stab)
      );
    });
    if (thePair.length > 0) {
      const pc = {
        abi: CONTRACTS.PAIR_ABI,
        address: thePair[0].address,
      } as const;

      const [totalSupply, reserve0, reserve1, balanceOf] =
        await viemClient.multicall({
          allowFailure: false,
          multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
          contracts: [
            {
              ...pc,
              functionName: "totalSupply",
            },
            {
              ...pc,
              functionName: "reserve0",
            },
            {
              ...pc,
              functionName: "reserve1",
            },
            {
              ...pc,
              functionName: "balanceOf",
              args: [account],
            },
          ],
        });

      const returnPair = thePair[0];
      returnPair.balance = formatUnits(balanceOf, PAIR_DECIMALS);
      returnPair.totalSupply = formatUnits(totalSupply, PAIR_DECIMALS);
      returnPair.reserve0 = formatUnits(reserve0, returnPair.token0.decimals);
      returnPair.reserve1 = formatUnits(reserve1, returnPair.token1.decimals);

      return returnPair;
    }

    const factoryContract = getContract({
      abi: CONTRACTS.FACTORY_ABI,
      address: CONTRACTS.FACTORY_ADDRESS,
      publicClient: viemClient,
    });
    const pairAddress = await factoryContract.read.getPair([
      addressA,
      addressB,
      stab,
    ]);

    if (pairAddress && pairAddress != ZERO_ADDRESS) {
      const pairContract = {
        abi: CONTRACTS.PAIR_ABI,
        address: pairAddress,
      } as const;
      const gaugesContract = {
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
      } as const;

      const totalWeight = await viemClient.readContract({
        ...gaugesContract,
        functionName: "totalWeight",
      });

      const [
        token0,
        token1,
        totalSupply,
        symbol,
        reserve0,
        reserve1,
        decimals,
        balanceOf,
        stable,
        gaugeAddress,
        gaugeWeight,
      ] = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: [
          {
            ...pairContract,
            functionName: "token0",
          },
          {
            ...pairContract,
            functionName: "token1",
          },
          {
            ...pairContract,
            functionName: "totalSupply",
          },
          {
            ...pairContract,
            functionName: "symbol",
          },
          {
            ...pairContract,
            functionName: "reserve0",
          },
          {
            ...pairContract,
            functionName: "reserve1",
          },
          {
            ...pairContract,
            functionName: "decimals",
          },
          {
            ...pairContract,
            functionName: "balanceOf",
            args: [account],
          },
          {
            ...pairContract,
            functionName: "stable",
          },
          {
            ...gaugesContract,
            functionName: "gauges",
            args: [pairAddress],
          },
          {
            ...gaugesContract,
            functionName: "weights",
            args: [pairAddress],
          },
        ],
      });

      const token0Contract = {
        abi: CONTRACTS.ERC20_ABI,
        address: token0,
      } as const;

      const token1Contract = {
        abi: CONTRACTS.ERC20_ABI,
        address: token1,
      } as const;

      const [
        token0Symbol,
        token0Decimals,
        token0Balance,
        token1Symbol,
        token1Decimals,
        token1Balance,
      ] = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: [
          {
            ...token0Contract,
            functionName: "symbol",
          },
          {
            ...token0Contract,
            functionName: "decimals",
          },
          {
            ...token0Contract,
            functionName: "balanceOf",
            args: [account],
          },
          {
            ...token1Contract,
            functionName: "symbol",
          },
          {
            ...token1Contract,
            functionName: "decimals",
          },
          {
            ...token1Contract,
            functionName: "balanceOf",
            args: [account],
          },
        ],
      });

      thePair = {
        address: pairAddress,
        symbol: symbol,
        decimals: decimals,
        stable,
        token0: {
          address: token0,
          symbol: token0Symbol,
          balance: formatUnits(
            token0Balance,
            parseInt(token0Decimals.toString())
          ),
          decimals: parseInt(token0Decimals.toString()),
        },
        token1: {
          address: token1,
          symbol: token1Symbol,
          balance: formatUnits(
            token1Balance,
            parseInt(token1Decimals.toString())
          ),
          decimals: parseInt(token1Decimals.toString()),
        },
        balance: formatUnits(balanceOf, decimals),
        totalSupply: formatUnits(totalSupply, decimals),
        reserve0: formatUnits(reserve0, parseInt(token0Decimals.toString())),
        reserve1: formatUnits(reserve1, parseInt(token1Decimals.toString())),
        tvl: 0,
      };

      if (gaugeAddress !== ZERO_ADDRESS) {
        const gaugeContract = {
          abi: CONTRACTS.GAUGE_ABI,
          address: gaugeAddress,
        } as const;
        //wrapped bribe address is coming from api. if the api doesnt work this will break
        const bribeContract = {
          abi: CONTRACTS.BRIBE_ABI,
          address: thePair.gauge.wrapped_bribe_address,
        } as const;
        const bribeContractInstance = getContract({
          ...bribeContract,
          publicClient: viemClient,
        });
        const x_bribeContract = {
          abi: CONTRACTS.BRIBE_ABI,
          address: thePair.gauge.x_wrapped_bribe_address,
        } as const;
        const x_bribeContractInstance = getContract({
          ...x_bribeContract,
          publicClient: viemClient,
        });
        const xx_bribeContract = {
          abi: CONTRACTS.BRIBE_ABI,
          address: thePair.gauge.xx_wrapped_bribe_address,
        } as const;
        const xx_bribeContractInstance = getContract({
          ...xx_bribeContract,
          publicClient: viemClient,
        });

        const [totalSupply, gaugeBalance, bribeAddress] =
          await viemClient.multicall({
            allowFailure: false,
            multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
            contracts: [
              {
                ...gaugeContract,
                functionName: "totalSupply",
              },
              {
                ...gaugeContract,
                functionName: "balanceOf",
                args: [account],
              },
              {
                ...gaugesContract,
                functionName: "external_bribes",
                args: [gaugeAddress],
              },
            ],
          });

        const tokensLength =
          await bribeContractInstance.read.rewardsListLength();
        const x_tokensLength =
          await x_bribeContractInstance.read.rewardsListLength();
        const xx_tokensLength =
          await xx_bribeContractInstance.read.rewardsListLength();

        const arry = Array.from(
          { length: parseInt(tokensLength.toString()) },
          (v, i) => i
        );
        const x_arry = Array.from(
          { length: parseInt(x_tokensLength.toString()) },
          (v, i) => i
        );
        const xx_arry = Array.from(
          { length: parseInt(xx_tokensLength.toString()) },
          (v, i) => i
        );

        const bribes = await Promise.all(
          arry.map(async (idx) => {
            const tokenAddress = await bribeContractInstance.read.rewards([
              BigInt(idx),
            ]);

            const token = await this.getBaseAsset(tokenAddress);
            if (!token) {
              return null;
            }

            const rewardRate = await viemClient.readContract({
              ...gaugeContract,
              functionName: "rewardRate",
              args: [tokenAddress],
            });

            return {
              token: token,
              rewardAmount: formatUnits(
                rewardRate * BigInt(604800),
                token.decimals
              ),
            };
          })
        );
        const x_bribes = await Promise.all(
          x_arry.map(async (idx) => {
            const tokenAddress = await x_bribeContractInstance.read.rewards([
              BigInt(idx),
            ]);

            const token = await this.getBaseAsset(tokenAddress);
            if (!token) {
              return null;
            }

            const rewardRate = await viemClient.readContract({
              ...gaugeContract,
              functionName: "rewardRate",
              args: [tokenAddress],
            });

            return {
              token: token,
              rewardAmount: formatUnits(
                rewardRate * BigInt(604800),
                token.decimals
              ),
            };
          })
        );
        const xx_bribes = await Promise.all(
          xx_arry.map(async (idx) => {
            const tokenAddress = await xx_bribeContractInstance.read.rewards([
              BigInt(idx),
            ]);

            const token = await this.getBaseAsset(tokenAddress);
            if (!token) {
              return null;
            }

            const rewardRate = await viemClient.readContract({
              ...gaugeContract,
              functionName: "rewardRate",
              args: [tokenAddress],
            });

            return {
              token: token,
              rewardAmount: formatUnits(
                rewardRate * BigInt(604800),
                token.decimals
              ),
            };
          })
        );

        const weightPercent = (
          (Number(gaugeWeight) * 100) /
          Number(totalWeight)
        ).toFixed(2);

        thePair.gauge = {
          address: gaugeAddress,
          bribeAddress: bribeAddress,
          decimals: 18,
          balance: formatEther(gaugeBalance),
          totalSupply: formatEther(totalSupply),
          weight: formatEther(gaugeWeight),
          weightPercent,
          bribes: bribes,
          x_bribes: x_bribes,
          xx_bribes: xx_bribes,
        };
      }

      pairs.push(thePair);
      this.setStore({ pairs: pairs });

      return thePair;
    }

    return null;
  };

  removeBaseAsset = (asset: BaseAsset) => {
    try {
      let localBaseAssets: BaseAsset[] = [];
      const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

      if (localBaseAssetsString && localBaseAssetsString !== "") {
        localBaseAssets = JSON.parse(localBaseAssetsString);

        localBaseAssets = localBaseAssets.filter((obj) => {
          return obj.address.toLowerCase() !== asset.address.toLowerCase();
        });

        localStorage.setItem(
          "stableSwap-assets",
          JSON.stringify(localBaseAssets)
        );

        let baseAssets = this.getStore("baseAssets");
        baseAssets = baseAssets.filter((obj) => {
          return (
            obj.address.toLowerCase() !== asset.address.toLowerCase() &&
            asset.local === true
          );
        });

        this.setStore({ baseAssets: baseAssets });
        this.updateSwapAssets(baseAssets);
        this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED, baseAssets);
      }
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  getLocalAssets = () => {
    try {
      let localBaseAssets = [];
      const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

      if (localBaseAssetsString && localBaseAssetsString !== "") {
        localBaseAssets = JSON.parse(localBaseAssetsString);
      }

      return localBaseAssets;
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };

  getBaseAsset = async (
    address: `0x${string}`,
    save?: boolean,
    getBalance?: boolean
  ) => {
    try {
      const baseAssets = this.getStore("baseAssets");

      const theBaseAsset = baseAssets.filter((as) => {
        return as.address.toLowerCase() === address.toLowerCase();
      });
      if (theBaseAsset.length > 0) {
        return theBaseAsset[0];
      }

      // not found, so we search the blockchain for it.
      const baseAssetContract = {
        abi: CONTRACTS.ERC20_ABI,
        address: address,
      } as const;

      const [symbol, decimals, name] = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: [
          {
            ...baseAssetContract,
            functionName: "symbol",
          },
          {
            ...baseAssetContract,
            functionName: "decimals",
          },
          {
            ...baseAssetContract,
            functionName: "name",
          },
        ],
      });

      const newBaseAsset: BaseAsset = {
        address: address,
        symbol: symbol,
        name: name,
        decimals: parseInt(decimals.toString()),
        logoURI: null,
        local: true,
        balance: null,
        isWhitelisted: undefined,
        listingFee: undefined,
      };

      if (getBalance) {
        const account = getAccount().address;
        if (account) {
          const balanceOf = await viemClient.readContract({
            ...baseAssetContract,
            functionName: "balanceOf",
            args: [account],
          });
          newBaseAsset.balance = formatUnits(balanceOf, newBaseAsset.decimals);
        }
      }

      //only save when a user adds it. don't for when we lookup a pair and find he asset.
      if (save) {
        let localBaseAssets = this.getLocalAssets();
        localBaseAssets = [...localBaseAssets, newBaseAsset];
        localStorage.setItem(
          "stableSwap-assets",
          JSON.stringify(localBaseAssets)
        );

        const baseAssets = this.getStore("baseAssets");
        const storeBaseAssets = [...baseAssets, newBaseAsset];

        this.setStore({ baseAssets: storeBaseAssets });
        this.updateSwapAssets(storeBaseAssets);
        this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED, storeBaseAssets);
      }

      return newBaseAsset;
    } catch (ex) {
      console.log(ex);
      // this.emitter.emit(ACTIONS.ERROR, ex)
      return null;
    }
  };

  // DISPATCHER FUNCTIONS
  configure = async () => {
    try {
      this.setStore({ govToken: this._getGovTokenBase() });
      this.setStore({ veToken: this._getVeTokenBase() });
      this.setStore({ baseAssets: await this._getBaseAssets() });
      // this.setStore({ routeAssets: await this._getRouteAssets() }); // We dont need it because we use firebird router
      this.setStore({ pairs: await this._getPairs() });
      this.setStore({ swapAssets: this._getSwapAssets() });
      this.setStore({ updateDate: await stores.helper.getActivePeriod() });
      this.setStore({
        circulatingSupply: await stores.helper.getCirculatingSupply(), // TODO move to api
      });
      this.setStore({
        marketCap: await stores.helper.getMarketCap(), // TODO move to api
      });

      this.emitter.emit(ACTIONS.UPDATED);
      this.emitter.emit(ACTIONS.CONFIGURED_SS);

      setTimeout(() => {
        this.dispatcher.dispatch({ type: ACTIONS.GET_BALANCES });
      }, 1);
    } catch (ex) {
      console.log(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getBaseAssets = async () => {
    try {
      // const response = await fetch(
      //   `${process.env.NEXT_PUBLIC_API}/api/v1/assets`,
      //   {
      //     method: 'get',
      //     headers: {
      //       Authorization: `Basic ${process.env.NEXT_PUBLIC_API_TOKEN}`
      //     }
      //   }
      // )
      // const baseAssetsCall = await response.json()

      let baseAssets = tokenlist;

      const set = new Set<string>(baseAssets.map((asset) => asset.address));
      if (!set.has(NATIVE_TOKEN.address)) baseAssets.unshift(NATIVE_TOKEN);

      let localBaseAssets = this.getLocalAssets();

      return [...baseAssets, ...localBaseAssets];
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };

  _getRouteAssets = async () => {
    try {
      const response = await fetch(`/api/routes`);
      const routeAssetsCall = await response.json();
      return routeAssetsCall.data as RouteAsset[];
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };

  _getPairs = async () => {
    try {
      const response = await fetch(`/api/pairs`);

      const pairsCall = await response.json();

      this.setStore({ tokenPrices: new Map(pairsCall.prices) });
      this.setStore({ tvl: pairsCall.tvl });
      this.setStore({ tbv: pairsCall.tbv });

      return pairsCall.data;
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };

  _getSwapAssets = () => {
    const baseAssets = this.getStore("baseAssets");
    const pairs = this.getStore("pairs");
    const set = new Set<string>();
    set.add(NATIVE_TOKEN.address.toLowerCase());
    pairs.forEach((pair) => {
      set.add(pair.token0.address.toLowerCase());
      set.add(pair.token1.address.toLowerCase());
    });
    const baseAssetsWeSwap = baseAssets.filter((asset) =>
      set.has(asset.address.toLowerCase())
    );
    return [...baseAssetsWeSwap];
  };
  updateSwapAssets = (payload: BaseAsset[]) => {
    const pairs = this.getStore("pairs");
    const set = new Set<string>();
    set.add(NATIVE_TOKEN.address.toLowerCase());
    pairs.forEach((pair) => {
      set.add(pair.token0.address.toLowerCase());
      set.add(pair.token1.address.toLowerCase());
    });
    const baseAssetsWeSwap = payload.filter((asset) =>
      set.has(asset.address.toLowerCase())
    );
    this.setStore({ swapAssets: baseAssetsWeSwap });
    this.emitter.emit(ACTIONS.SWAP_ASSETS_UPDATED, baseAssetsWeSwap);
  };

  _getGovTokenBase = () => {
    return {
      address: CONTRACTS.GOV_TOKEN_ADDRESS,
      name: CONTRACTS.GOV_TOKEN_NAME,
      symbol: CONTRACTS.GOV_TOKEN_SYMBOL,
      decimals: CONTRACTS.GOV_TOKEN_DECIMALS,
      logoURI: CONTRACTS.GOV_TOKEN_LOGO,
    };
  };

  _getVeTokenBase = () => {
    return {
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      name: CONTRACTS.VE_TOKEN_NAME,
      symbol: CONTRACTS.VE_TOKEN_SYMBOL,
      decimals: CONTRACTS.VE_TOKEN_DECIMALS,
      logoURI: CONTRACTS.VE_TOKEN_LOGO,
    };
  };

  getBalances = async () => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      this._getGovTokenInfo(account);
      await this._getBaseAssetInfo(account);
      await this._getPairInfo(account);
    } catch (ex) {
      console.log(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getVestNFTs = async (address: `0x${string}`) => {
    try {
      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");
      if (!veToken || !govToken) {
        throw new Error("veToken or govToken not found");
      }

      const vestingContract = {
        abi: CONTRACTS.VE_TOKEN_ABI,
        address: CONTRACTS.VE_TOKEN_ADDRESS,
      } as const;

      const nftsLength = await viemClient.readContract({
        ...vestingContract,
        functionName: "balanceOf",
        args: [address],
      });

      const arr = Array.from(
        { length: parseInt(nftsLength.toString()) },
        (v, i) => i
      );

      const nfts: VestNFT[] = await Promise.all(
        arr.map(async (idx) => {
          const tokenIndex = await viemClient.readContract({
            ...vestingContract,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(idx)],
          });
          const [[lockedAmount, lockedEnd], lockValue, voted, totalSupply] =
            await viemClient.multicall({
              allowFailure: false,
              multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
              contracts: [
                {
                  ...vestingContract,
                  functionName: "locked",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "balanceOfNFT",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "voted",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "totalSupply",
                },
              ],
            });

          const [actionedInCurrentEpoch, lastVoted] =
            await this._checkNFTActionEpoch(tokenIndex.toString());

          // probably do some decimals math before returning info. Maybe get more info. I don't know what it returns.
          return {
            id: tokenIndex.toString(),
            lockEnds: lockedEnd.toString(),
            lockAmount: formatUnits(lockedAmount, govToken.decimals),
            lockValue: formatUnits(lockValue, veToken.decimals),
            actionedInCurrentEpoch,
            reset: actionedInCurrentEpoch && !voted,
            lastVoted,
            influence:
              Number(formatUnits(lockValue, veToken.decimals)) /
              Number(formatUnits(totalSupply, veToken.decimals)),
          };
        })
      );

      this.setStore({ vestNFTs: nfts });
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getGovTokenInfo = async (address: `0x${string}`) => {
    try {
      const govToken = this.getStore("govToken");
      if (!govToken) {
        console.warn("govToken not found");
        return null;
      }

      const balanceOf = await viemClient.readContract({
        abi: CONTRACTS.GOV_TOKEN_ABI,
        address: CONTRACTS.GOV_TOKEN_ADDRESS,
        functionName: "balanceOf",
        args: [address],
      });

      govToken.balanceOf = balanceOf.toString();
      govToken.balance = formatUnits(balanceOf, govToken.decimals);

      this.setStore({ govToken });
      this.emitter.emit(ACTIONS.UPDATED);

      this._getVestNFTs(address);
    } catch (ex) {
      console.log(ex);
    }
  };

  _getPairInfo = async (address: `0x${string}`, overridePairs?: Pair[]) => {
    try {
      let pairs: Pair[] = [];

      if (overridePairs) {
        pairs = overridePairs;
      } else {
        pairs = this.getStore("pairs");
      }

      const gaugesContract = {
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
      } as const;

      const totalWeight = await viemClient.readContract({
        ...gaugesContract,
        functionName: "totalWeight",
      });

      const pairCalls = pairs.flatMap((pair) => {
        return [
          {
            address: pair.address,
            abi: CONTRACTS.PAIR_ABI,
            functionName: "totalSupply",
          },
          {
            address: pair.address,
            abi: CONTRACTS.PAIR_ABI,
            functionName: "reserve0",
          },
          {
            address: pair.address,
            abi: CONTRACTS.PAIR_ABI,
            functionName: "reserve1",
          },
          {
            address: pair.address,
            abi: CONTRACTS.PAIR_ABI,
            functionName: "balanceOf",
            args: [address],
          },
        ] as const;
      });
      const pairCallsChunks = chunkArray(pairCalls, 100);
      const pairsData = await multicallChunks(pairCallsChunks);

      const ps = await Promise.all(
        pairs.map(async (pair, i) => {
          try {
            const token0 = await this.getBaseAsset(
              pair.token0.address,
              false,
              true
            );
            const token1 = await this.getBaseAsset(
              pair.token1.address,
              false,
              true
            );

            const [totalSupply, reserve0, reserve1, balanceOf] =
              pairsData.slice(i * 4, i * 4 + 4);

            pair.token0 = token0 != null ? token0 : pair.token0;
            pair.token1 = token1 != null ? token1 : pair.token1;
            pair.balance = formatUnits(balanceOf, PAIR_DECIMALS);
            pair.totalSupply = formatUnits(totalSupply, PAIR_DECIMALS);
            pair.reserve0 = formatUnits(reserve0, pair.token0.decimals);
            pair.reserve1 = formatUnits(reserve1, pair.token1.decimals);

            return pair;
          } catch (ex) {
            console.log("EXCEPTION 1");
            console.log(pair);
            console.log(ex);
            return pair;
          }
        })
      );

      this.setStore({ pairs: ps });
      this.emitter.emit(ACTIONS.UPDATED);

      const gauges = ps.filter(hasGauge);

      const gaugesAliveCalls = gauges.map((pair) => {
        return {
          ...gaugesContract,
          functionName: "isAlive",
          args: [pair.gauge.address],
        } as const;
      });
      const gaugesAliveCallsChunks = chunkArray(gaugesAliveCalls);
      const gaugesAliveData = await multicallChunks(gaugesAliveCallsChunks);

      const gaugesCalls = gauges.flatMap((pair) => {
        return [
          {
            address: pair.gauge.address,
            abi: CONTRACTS.GAUGE_ABI,
            functionName: "totalSupply",
          },
          {
            address: pair.gauge.address,
            abi: CONTRACTS.GAUGE_ABI,
            functionName: "balanceOf",
            args: [address],
          },
          {
            ...gaugesContract,
            functionName: "weights",
            args: [pair.address],
          },
        ] as const;
      });
      const gaugesCallsChunks = chunkArray(gaugesCalls);
      const gaugesData = await multicallChunks(gaugesCallsChunks);

      // this is to increment index only if pair hasGauge
      let outerIndex = 0;
      const ps1 = ps.map((pair) => {
        try {
          if (hasGauge(pair)) {
            const isAliveGauge = gaugesAliveData[outerIndex];

            const [totalSupply, gaugeBalance, gaugeWeight] = gaugesData.slice(
              outerIndex * 3,
              outerIndex * 3 + 3
            );

            const bribes = pair.gauge.bribes.map((bribe) => {
              bribe.rewardAmount = 0;
              return bribe;
            });
            pair.gauge.xx_bribes.forEach((xx_bribe) => {
              const bribe = bribes.find(
                (b) => b.token.address === xx_bribe.token.address
              );
              if (bribe) {
                bribe.rewardAmount = xx_bribe.rewardAmmount;
              } else {
                bribes.push({
                  token: xx_bribe.token,
                  rewardAmount: xx_bribe.rewardAmmount,
                  reward_ammount: xx_bribe.rewardAmmount,
                  rewardAmmount: xx_bribe.rewardAmmount,
                });
              }
            });

            pair.gauge.balance = formatEther(gaugeBalance);
            pair.gauge.totalSupply = formatEther(totalSupply);

            // in ps totalSupply for reassgined to string from number (api sends number)
            pair.gauge.reserve0 =
              parseFloat(pair.totalSupply as `${number}`) > 0
                ? BigNumber(pair.reserve0)
                    .times(pair.gauge.totalSupply)
                    .div(pair.totalSupply)
                    .toFixed(pair.token0.decimals)
                : "0";
            // in ps totalSupply for reassgined to string from number (api sends number)
            pair.gauge.reserve1 =
              parseFloat(pair.totalSupply as `${number}`) > 0
                ? BigNumber(pair.reserve1)
                    .times(pair.gauge.totalSupply)
                    .div(pair.totalSupply)
                    .toFixed(pair.token1.decimals)
                : "0";
            pair.gauge.weight = formatEther(gaugeWeight);
            pair.gauge.weightPercent = (
              (Number(gaugeWeight) * 100) /
              Number(totalWeight)
            ).toFixed(2);
            // NOTE: this is being used in votes table to show aggregated bribes and x_bribes
            pair.gaugebribes = bribes;
            pair.isAliveGauge = isAliveGauge;
            if (isAliveGauge === false) pair.apr = 0;

            outerIndex++;
          }

          return pair;
        } catch (ex) {
          console.log("EXCEPTION 2");
          console.log(pair);
          console.log(ex);
          return pair;
        }
      });

      this.setStore({ pairs: ps1 });
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.log(ex);
    }
  };

  _getBaseAssetInfo = async (address: `0x${string}`) => {
    try {
      const baseAssets = this.getStore("baseAssets");
      if (!baseAssets) {
        console.warn("baseAssets not found");
        return null;
      }

      const voterContract = {
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
      } as const;

      let baseAssetsWithBalances: BaseAsset[] = [];

      const nativeToken = baseAssets.find(
        (asset) => asset.address === NATIVE_TOKEN.symbol
      );
      if (nativeToken) {
        const balance = await viemClient.getBalance({
          address,
        });
        baseAssetsWithBalances.push({
          ...nativeToken,
          balance: formatUnits(balance, nativeToken.decimals),
          isWhitelisted: true,
        } as const);
      }

      const baseAssetsWithoutNativeToken = baseAssets
        .map((asset) => {
          if (asset.address !== NATIVE_TOKEN.symbol) {
            return asset;
          }
        })
        .filter((asset): asset is BaseAsset => asset !== undefined);
      if (baseAssetsWithoutNativeToken.length === 0) {
        console.warn("error in base assets logic");
        return null;
      }

      const baseAssetsWhitelistedCalls = baseAssetsWithoutNativeToken.map(
        (asset) => {
          return {
            ...voterContract,
            functionName: "isWhitelisted",
            args: [asset.address],
          } as const;
        }
      );

      const baseAssetsBalancesCalls = baseAssetsWithoutNativeToken.map(
        (asset) => {
          return {
            abi: CONTRACTS.ERC20_ABI,
            address: asset.address,
            functionName: "balanceOf",
            args: [address],
          } as const;
        }
      );

      const whitelistedCallsChunks = chunkArray(baseAssetsWhitelistedCalls);
      const baseAssetsWhitelistedResults = await multicallChunks(
        whitelistedCallsChunks
      );

      const balancesCallsChunks = chunkArray(baseAssetsBalancesCalls);
      const baseAssetsBalancesResults = await multicallChunks(
        balancesCallsChunks
      );

      for (let i = 0; i < baseAssetsWithoutNativeToken.length; i++) {
        baseAssetsWithBalances.push({
          ...baseAssetsWithoutNativeToken[i],
          balance: formatUnits(
            baseAssetsBalancesResults[i],
            baseAssetsWithoutNativeToken[i].decimals
          ),
          isWhitelisted: baseAssetsWhitelistedResults[i],
        });
      }
      baseAssets.forEach((baseAsset) => {
        const baseAssetWithBalance = baseAssetsWithBalances.find(
          (baseAssetWithBalance) =>
            baseAssetWithBalance.address === baseAsset.address
        );
        if (baseAssetWithBalance) {
          baseAsset.balance = baseAssetWithBalance.balance;
          baseAsset.isWhitelisted = baseAssetWithBalance.isWhitelisted;
        }
      });

      this.setStore({ baseAssets: baseAssetsWithBalances });
      this.updateSwapAssets(baseAssetsWithBalances);
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.log(ex);
    }
  };

  searchBaseAsset = async (payload: {
    type: string;
    content: { address: `0x${string}` };
  }) => {
    try {
      let localBaseAssets: BaseAsset[] = [];
      const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

      if (localBaseAssetsString && localBaseAssetsString !== "") {
        localBaseAssets = JSON.parse(localBaseAssetsString);
      }

      const theBaseAsset = localBaseAssets.filter((as) => {
        return (
          as.address.toLowerCase() === payload.content.address.toLowerCase()
        );
      });
      if (theBaseAsset.length > 0) {
        this.emitter.emit(ACTIONS.ASSET_SEARCHED, theBaseAsset);
        return;
      }

      const baseAssetContract = {
        abi: CONTRACTS.ERC20_ABI,
        address: payload.content.address,
      } as const;

      const [symbol, decimals, name] = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: [
          {
            ...baseAssetContract,
            functionName: "symbol",
          },
          {
            ...baseAssetContract,
            functionName: "decimals",
          },
          {
            ...baseAssetContract,
            functionName: "name",
          },
        ],
      });

      const newBaseAsset: BaseAsset = {
        address: payload.content.address,
        symbol: symbol,
        name: name,
        decimals: parseInt(decimals.toString()),
        balance: null,
        local: true,
        logoURI: "",
      };

      localBaseAssets = [...localBaseAssets, newBaseAsset];
      localStorage.setItem(
        "stableSwap-assets",
        JSON.stringify(localBaseAssets)
      );

      const baseAssets = this.getStore("baseAssets");
      const storeBaseAssets = [...baseAssets, ...localBaseAssets];

      this.setStore({ baseAssets: storeBaseAssets });

      this.emitter.emit(ACTIONS.ASSET_SEARCHED, newBaseAsset);
    } catch (ex) {
      console.log(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createPairStake = async (payload: {
    type: string;
    content: {
      token0: BaseAsset;
      token1: BaseAsset;
      amount0: string;
      amount1: string;
      isStable: boolean;
      token: any; // any coz we are not using it
      slippage: string;
    };
  }) => {
    try {
      const context = this;

      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const {
        token0,
        token1,
        amount0,
        amount1,
        isStable: stable,
        slippage,
      } = payload.content;

      let toki0 = token0.address;
      let toki1 = token1.address;
      if (token0.address === NATIVE_TOKEN.symbol) {
        toki0 = W_NATIVE_ADDRESS as `0x${string}`;
      }
      if (token1.address === NATIVE_TOKEN.symbol) {
        toki1 = W_NATIVE_ADDRESS as `0x${string}`;
      }

      const pairFor = await viemClient.readContract({
        abi: CONTRACTS.FACTORY_ABI,
        address: CONTRACTS.FACTORY_ADDRESS,
        functionName: "getPair",
        args: [toki0, toki1, stable],
      });

      if (pairFor && pairFor !== ZERO_ADDRESS) {
        await context.updatePairsCall(account);
        this.emitter.emit(ACTIONS.ERROR, "Pair already exists");
        return null;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();
      let createGaugeTXID = this.getTXUUID();
      let stakeAllowanceTXID = this.getTXUUID();
      let stakeTXID = this.getTXUUID();

      //DOD A CHECK FOR IF THE POOL ALREADY EXISTS

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
        type: "Liquidity",
        verb: "Liquidity Pool Created",
        transactions: [
          {
            uuid: allowance0TXID,
            description: `Checking your ${token0.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: allowance1TXID,
            description: `Checking your ${token1.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Create liquidity pool`,
            status: "WAITING",
          },
          {
            uuid: createGaugeTXID,
            description: `Create gauge`,
            status: "WAITING",
          },
          {
            uuid: stakeAllowanceTXID,
            description: `Checking your pool allowance`,
            status: "WAITING",
          },
          {
            uuid: stakeTXID,
            description: `Stake LP tokens in the gauge`,
            status: "WAITING",
          },
        ],
      });

      let allowance0: string | null = "0";
      let allowance1: string | null = "0";

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== NATIVE_TOKEN.symbol) {
        allowance0 = await this._getDepositAllowance(token0, account);
        if (!allowance0) throw new Error("Couldnt get allowance");
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== NATIVE_TOKEN.symbol) {
        allowance1 = await this._getDepositAllowance(token1, account);
        if (!allowance1) throw new Error("Couldnt get allowance");
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        await this.writeApprove(
          walletClient,
          allowance0TXID,
          token0.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      if (BigNumber(allowance1).lt(amount1)) {
        await this.writeApprove(
          walletClient,
          allowance1TXID,
          token1.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100);
      const sendAmount0 = BigNumber(amount0)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1 = BigNumber(amount1)
        .times(10 ** token1.decimals)
        .toFixed(0);
      const deadline = "" + moment().add(600, "seconds").unix();
      const sendAmount0Min = BigNumber(amount0)
        .times(sendSlippage)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1Min = BigNumber(amount1)
        .times(sendSlippage)
        .times(10 ** token1.decimals)
        .toFixed(0);

      await this.writeAddLiquidity(
        walletClient,
        depositTXID,
        token0,
        token1,
        stable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        deadline
      );

      let tok0 = token0.address;
      let tok1 = token1.address;
      if (token0.address === NATIVE_TOKEN.symbol) {
        tok0 = W_NATIVE_ADDRESS as `0x${string}`;
      }
      if (token1.address === NATIVE_TOKEN.symbol) {
        tok1 = W_NATIVE_ADDRESS as `0x${string}`;
      }

      const _pairFor = await viemClient.readContract({
        abi: CONTRACTS.FACTORY_ABI,
        address: CONTRACTS.FACTORY_ADDRESS,
        functionName: "getPair",
        args: [tok0, tok1, stable],
      });

      // SUBMIT CREATE GAUGE TRANSACTION
      await this.writeCreateGauge(walletClient, createGaugeTXID, _pairFor);

      const gaugeAddress = await viemClient.readContract({
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
        functionName: "gauges",
        args: [_pairFor],
      });

      const balanceOf = await viemClient.readContract({
        abi: CONTRACTS.PAIR_ABI,
        address: _pairFor,
        functionName: "balanceOf",
        args: [account],
      });

      const pair = (await this.getPairByAddress(_pairFor)) as Gauge | null; // this has to have gauge because it was created moment ago

      const stakeAllowance = await this._getStakeAllowance(
        pair,
        account,
        _pairFor
      );
      if (!stakeAllowance) throw new Error("stakeAllowance is null");

      if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allow the router to spend your ${
            pair?.symbol ?? "LP token"
          }`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allowance on ${pair?.symbol ?? "LP token"} sufficient`,
          status: "DONE",
        });
      }

      if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
        await this.writeApprove(
          walletClient,
          stakeAllowanceTXID,
          _pairFor,
          gaugeAddress
        );
      }

      await this.writeDeposit(walletClient, stakeTXID, gaugeAddress, balanceOf);

      await context.updatePairsCall(account);

      this.emitter.emit(ACTIONS.PAIR_CREATED, _pairFor);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createPairDeposit = async (payload: {
    type: string;
    content: {
      token0: BaseAsset;
      token1: BaseAsset;
      amount0: string;
      amount1: string;
      isStable: boolean;
      token: any; // any coz we are not using it
      slippage: string;
    };
  }) => {
    try {
      const context = this;

      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const {
        token0,
        token1,
        amount0,
        amount1,
        isStable: stable,
        slippage,
      } = payload.content;

      let toki0 = token0.address;
      let toki1 = token1.address;
      if (token0.address === NATIVE_TOKEN.symbol) {
        toki0 = W_NATIVE_ADDRESS as `0x${string}`;
      }
      if (token1.address === NATIVE_TOKEN.symbol) {
        toki1 = W_NATIVE_ADDRESS as `0x${string}`;
      }

      const pairFor = await viemClient.readContract({
        abi: CONTRACTS.FACTORY_ABI,
        address: CONTRACTS.FACTORY_ADDRESS,
        functionName: "getPair",
        args: [toki0, toki1, stable],
      });

      if (pairFor && pairFor !== ZERO_ADDRESS) {
        await context.updatePairsCall(account);
        this.emitter.emit(ACTIONS.ERROR, "Pair already exists");
        return null;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();
      let createGaugeTXID = this.getTXUUID();

      //DOD A CHECK FOR IF THE POOL ALREADY EXISTS

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
        type: "Liquidity",
        verb: "Liquidity Pool Created",
        transactions: [
          {
            uuid: allowance0TXID,
            description: `Checking your ${token0.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: allowance1TXID,
            description: `Checking your ${token1.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Create liquidity pool`,
            status: "WAITING",
          },
          {
            uuid: createGaugeTXID,
            description: `Create gauge`,
            status: "WAITING",
          },
        ],
      });

      let allowance0: string | null = "0";
      let allowance1: string | null = "0";

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== NATIVE_TOKEN.symbol) {
        allowance0 = await this._getDepositAllowance(token0, account);
        if (!allowance0) throw new Error("Error getting allowance0");
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== NATIVE_TOKEN.symbol) {
        allowance1 = await this._getDepositAllowance(token1, account);
        if (!allowance1) throw new Error("couldnt get allowance");
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        await this.writeApprove(
          walletClient,
          allowance0TXID,
          token0.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      if (BigNumber(allowance1).lt(amount1)) {
        await this.writeApprove(
          walletClient,
          allowance1TXID,
          token1.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100);
      const sendAmount0 = BigNumber(amount0)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1 = BigNumber(amount1)
        .times(10 ** token1.decimals)
        .toFixed(0);
      const deadline = "" + moment().add(600, "seconds").unix();
      const sendAmount0Min = BigNumber(amount0)
        .times(sendSlippage)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1Min = BigNumber(amount1)
        .times(sendSlippage)
        .times(10 ** token1.decimals)
        .toFixed(0);

      await this.writeAddLiquidity(
        walletClient,
        depositTXID,
        token0,
        token1,
        stable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        deadline
      );

      let tok0 = token0.address;
      let tok1 = token1.address;
      if (token0.address === NATIVE_TOKEN.symbol) {
        tok0 = W_NATIVE_ADDRESS as `0x${string}`;
      }
      if (token1.address === NATIVE_TOKEN.symbol) {
        tok1 = W_NATIVE_ADDRESS as `0x${string}`;
      }

      const _pairFor = await viemClient.readContract({
        abi: CONTRACTS.FACTORY_ABI,
        address: CONTRACTS.FACTORY_ADDRESS,
        functionName: "getPair",
        args: [tok0, tok1, stable],
      });

      // SUBMIT CREATE GAUGE TRANSACTION
      await this.writeCreateGauge(walletClient, createGaugeTXID, _pairFor);

      await context.updatePairsCall(account);

      this.emitter.emit(ACTIONS.PAIR_CREATED, _pairFor);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  updatePairsCall = async (address: `0x${string}`) => {
    try {
      // update pairs is same endpoint in API. Pairs are updated in sync on backend
      const response = await fetch(`/api/pairs`);
      const pairsCall = await response.json();
      this.setStore({ pairs: pairsCall.data });

      await this._getPairInfo(address, pairsCall.data);
    } catch (ex) {
      console.log(ex);
    }
  };

  sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  getTXUUID = () => {
    return uuidv4();
  };

  addLiquidity = async (payload: {
    type: string;
    content: {
      token0: BaseAsset;
      token1: BaseAsset;
      amount0: string;
      amount1: string;
      minLiquidity: any;
      pair: Pair;
      slippage: string;
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("walletClient not found");
        return null;
      }

      const { token0, token1, amount0, amount1, pair, slippage } =
        payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Add liquidity to ${pair.symbol}`,
        verb: "Liquidity Added",
        type: "Liquidity",
        transactions: [
          {
            uuid: allowance0TXID,
            description: `Checking your ${token0.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: allowance1TXID,
            description: `Checking your ${token1.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Deposit tokens in the pool`,
            status: "WAITING",
          },
        ],
      });

      let allowance0: string | null = "0";
      let allowance1: string | null = "0";

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== NATIVE_TOKEN.symbol) {
        allowance0 = await this._getDepositAllowance(token0, account);
        if (!allowance0) throw new Error("Error getting allowance");
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== NATIVE_TOKEN.symbol) {
        allowance1 = await this._getDepositAllowance(token1, account);
        if (!allowance1) throw new Error("couldnt get allowance");
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        await this.writeApprove(
          walletClient,
          allowance0TXID,
          token0.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      if (BigNumber(allowance1).lt(amount1)) {
        await this.writeApprove(
          walletClient,
          allowance1TXID,
          token1.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100);
      const sendAmount0 = BigNumber(amount0)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1 = BigNumber(amount1)
        .times(10 ** token1.decimals)
        .toFixed(0);
      const deadline = "" + moment().add(600, "seconds").unix();
      const sendAmount0Min = BigNumber(amount0)
        .times(sendSlippage)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1Min = BigNumber(amount1)
        .times(sendSlippage)
        .times(10 ** token1.decimals)
        .toFixed(0);

      await this.writeAddLiquidity(
        walletClient,
        depositTXID,
        token0,
        token1,
        pair.stable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        deadline
      );

      this._getPairInfo(account);
      this._getSpecificAssetInfo(account, token0.address);
      this._getSpecificAssetInfo(account, token1.address);
      this.emitter.emit(ACTIONS.LIQUIDITY_ADDED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  stakeLiquidity = async (payload: {
    type: string;
    content: { pair: Gauge; token: any };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { pair } = payload.content;

      let stakeAllowanceTXID = this.getTXUUID();
      let stakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Stake ${pair.symbol} in the gauge`,
        type: "Liquidity",
        verb: "Liquidity Staked",
        transactions: [
          {
            uuid: stakeAllowanceTXID,
            description: `Checking your ${pair.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: stakeTXID,
            description: `Stake LP tokens in the gauge`,
            status: "WAITING",
          },
        ],
      });

      const stakeAllowance = await this._getStakeAllowance(pair, account);
      if (!stakeAllowance) throw new Error("Error getting stake allowance");

      const balanceOf = await viemClient.readContract({
        abi: CONTRACTS.PAIR_ABI,
        address: pair.address,
        functionName: "balanceOf",
        args: [account],
      });

      if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (!pair.gauge?.address) throw new Error("Gauge address is undefined");

      if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
        await this.writeApprove(
          walletClient,
          stakeAllowanceTXID,
          pair.address,
          pair.gauge.address
        );
      }

      await this.writeDeposit(
        walletClient,
        stakeTXID,
        pair.gauge.address,
        balanceOf
      );

      this._getPairInfo(account);
      this.emitter.emit(ACTIONS.LIQUIDITY_STAKED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  addLiquidityAndStake = async (payload: {
    type: string;
    content: {
      token0: BaseAsset;
      token1: BaseAsset;
      amount0: string;
      amount1: string;
      minLiquidity: string;
      pair: Gauge;
      token: any;
      slippage: string;
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const {
        token0,
        token1,
        amount0,
        amount1,
        minLiquidity,
        pair,

        slippage,
      } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let stakeAllowanceTXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();
      let stakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Add liquidity to ${pair.symbol}`,
        type: "Liquidity",
        verb: "Liquidity Added",
        transactions: [
          {
            uuid: allowance0TXID,
            description: `Checking your ${token0.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: allowance1TXID,
            description: `Checking your ${token1.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: stakeAllowanceTXID,
            description: `Checking your ${pair.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Deposit tokens in the pool`,
            status: "WAITING",
          },
          {
            uuid: stakeTXID,
            description: `Stake LP tokens in the gauge`,
            status: "WAITING",
          },
        ],
      });

      let allowance0: string | null = "0";
      let allowance1: string | null = "0";

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== NATIVE_TOKEN.symbol) {
        allowance0 = await this._getDepositAllowance(token0, account);
        if (!allowance0) throw new Error();
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== NATIVE_TOKEN.symbol) {
        allowance1 = await this._getDepositAllowance(token1, account);
        if (!allowance1) throw new Error("couldnt get allowance");
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      const stakeAllowance = await this._getStakeAllowance(pair, account);
      if (!stakeAllowance) throw new Error("Error getting stake allowance");

      if (BigNumber(stakeAllowance).lt(minLiquidity)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        await this.writeApprove(
          walletClient,
          allowance0TXID,
          token0.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      if (BigNumber(allowance1).lt(amount1)) {
        await this.writeApprove(
          walletClient,
          allowance1TXID,
          token1.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      if (!pair.gauge?.address) throw new Error("Gauge address is undefined");

      if (BigNumber(stakeAllowance).lt(minLiquidity)) {
        await this.writeApprove(
          walletClient,
          stakeAllowanceTXID,
          pair.address,
          pair.gauge.address
        );
      }

      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100);
      const sendAmount0 = BigNumber(amount0)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1 = BigNumber(amount1)
        .times(10 ** token1.decimals)
        .toFixed(0);
      const deadline = "" + moment().add(600, "seconds").unix();
      const sendAmount0Min = BigNumber(amount0)
        .times(sendSlippage)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1Min = BigNumber(amount1)
        .times(sendSlippage)
        .times(10 ** token1.decimals)
        .toFixed(0);

      await this.writeAddLiquidity(
        walletClient,
        depositTXID,
        token0,
        token1,
        pair.stable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        deadline
      );

      const balanceOf = await viemClient.readContract({
        abi: CONTRACTS.PAIR_ABI,
        address: pair.address,
        functionName: "balanceOf",
        args: [account],
      });

      await this.writeDeposit(
        walletClient,
        stakeTXID,
        pair.gauge.address,
        balanceOf
      );

      this._getPairInfo(account);
      this._getSpecificAssetInfo(account, token0.address);
      this._getSpecificAssetInfo(account, token1.address);
      this.emitter.emit(ACTIONS.ADD_LIQUIDITY_AND_STAKED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getDepositAllowance = async (token: BaseAsset, address: `0x${string}`) => {
    try {
      const allowance = await viemClient.readContract({
        address: token.address,
        abi: CONTRACTS.ERC20_ABI,
        functionName: "allowance",
        args: [address, CONTRACTS.ROUTER_ADDRESS],
      });

      return formatUnits(allowance, token.decimals);
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  _getStakeAllowance = async (
    pair: Gauge | null,
    address: `0x${string}`,
    pairAddress?: `0x${string}`
  ) => {
    try {
      if (pair === null && !!pairAddress) {
        const tokenContract = {
          abi: CONTRACTS.ERC20_ABI,
          address: pairAddress,
        } as const;
        const allowance = await viemClient.readContract({
          ...tokenContract,
          functionName: "allowance",
          args: [address, pairAddress],
        });
        return formatUnits(allowance, PAIR_DECIMALS);
      } else if (pair !== null) {
        const tokenContract = {
          abi: CONTRACTS.ERC20_ABI,
          address: pair.address,
        } as const;
        const allowance = await viemClient.readContract({
          ...tokenContract,
          functionName: "allowance",
          args: [address, pair.gauge.address],
        });
        return formatUnits(allowance, PAIR_DECIMALS);
      }
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  _getWithdrawAllowance = async (pair: Pair, address: `0x${string}`) => {
    try {
      const allowance = await viemClient.readContract({
        address: pair.address,
        abi: CONTRACTS.ERC20_ABI,
        functionName: "allowance",
        args: [address, CONTRACTS.ROUTER_ADDRESS],
      });

      return formatUnits(allowance, PAIR_DECIMALS);
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  quoteAddLiquidity = async (payload: {
    type: string;
    content: {
      pair: Pair;
      token0: BaseAsset;
      token1: BaseAsset;
      amount0: `${number}` | "";
      amount1: `${number}` | "";
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const { pair, token0, token1, amount0, amount1 } = payload.content;

      if (!pair || !token0 || !token1 || amount0 == "" || amount1 == "") {
        return null;
      }

      const sendAmount0 = parseUnits(amount0, token0.decimals);
      const sendAmount1 = parseUnits(amount1, token1.decimals);

      let addy0 = token0.address;
      let addy1 = token1.address;

      if (token0.address === NATIVE_TOKEN.symbol) {
        addy0 = W_NATIVE_ADDRESS as `0x${string}`;
      }
      if (token1.address === NATIVE_TOKEN.symbol) {
        addy1 = W_NATIVE_ADDRESS as `0x${string}`;
      }

      const [, liquidity] = await viemClient.readContract({
        address: CONTRACTS.ROUTER_ADDRESS,
        abi: CONTRACTS.ROUTER_ABI,
        functionName: "quoteAddLiquidity",
        args: [addy0, addy1, pair.stable, sendAmount0, sendAmount1],
      });

      const returnVal = {
        inputs: {
          token0,
          token1,
          amount0,
          amount1,
        },
        output: formatUnits(liquidity, PAIR_DECIMALS),
      };
      this.emitter.emit(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, returnVal);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  getLiquidityBalances = async (payload: {
    type: string;
    content: { pair: Pair };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const { pair } = payload.content;

      if (!pair) {
        return;
      }

      const token0Contract = {
        abi: CONTRACTS.ERC20_ABI,
        address: pair.token0.address,
      } as const;
      const token1Contract = {
        abi: CONTRACTS.ERC20_ABI,
        address: pair.token1.address,
      } as const;
      const pairContract = {
        abi: CONTRACTS.ERC20_ABI,
        address: pair.address,
      } as const;

      const balanceCalls = [
        {
          ...token0Contract,
          functionName: "balanceOf",
          args: [account],
        },
        {
          ...token1Contract,
          functionName: "balanceOf",
          args: [account],
        },
        {
          ...pairContract,
          functionName: "balanceOf",
          args: [account],
        },
      ] as const;

      const [token0Balance, token1Balance, poolBalance] =
        await viemClient.multicall({
          allowFailure: false,
          multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
          contracts: balanceCalls,
        });

      const returnVal: {
        token0: string;
        token1: string;
        pool: string;
        gauge: string | null;
      } = {
        token0: formatUnits(token0Balance, pair.token0.decimals),
        token1: formatUnits(token1Balance, pair.token1.decimals),
        pool: formatEther(poolBalance),
        gauge: null,
      };

      let gaugeBalance;
      if (pair.gauge) {
        gaugeBalance = await viemClient.readContract({
          address: pair.gauge.address,
          abi: CONTRACTS.ERC20_ABI,
          functionName: "balanceOf",
          args: [account],
        });
      }

      if (pair.gauge) {
        returnVal.gauge = gaugeBalance ? formatEther(gaugeBalance) : null;
      }

      this.emitter.emit(ACTIONS.GET_LIQUIDITY_BALANCES_RETURNED, returnVal);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  removeLiquidity = async (payload: {
    type: string;
    content: {
      token0: BaseAsset;
      token1: BaseAsset;
      pair: Pair;
      slippage: string;
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { token0, token1, pair, slippage } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let withdrawTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Remove liquidity from ${pair.symbol}`,
        type: "Liquidity",
        verb: "Liquidity Removed",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your ${pair.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: withdrawTXID,
            description: `Withdraw tokens from the pool`,
            status: "WAITING",
          },
        ],
      });

      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getWithdrawAllowance(pair, account);
      if (!allowance) throw new Error("Error getting withdraw allowance");
      if (!pair.balance) throw new Error("No pair balance");
      if (BigNumber(allowance).lt(pair.balance)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(pair.balance)) {
        await this.writeApprove(
          walletClient,
          allowanceTXID,
          pair.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      // SUBMIT WITHDRAW TRANSACTION
      const sendAmount = BigNumber(pair.balance)
        .times(10 ** PAIR_DECIMALS)
        .toFixed(0);

      const [amountA, amountB] = await viemClient.readContract({
        address: CONTRACTS.ROUTER_ADDRESS,
        abi: CONTRACTS.ROUTER_ABI,
        functionName: "quoteRemoveLiquidity",
        args: [token0.address, token1.address, pair.stable, BigInt(sendAmount)],
      });

      const sendSlippage = BigNumber(100).minus(slippage).div(100);
      const deadline = "" + moment().add(600, "seconds").unix();
      const sendAmount0Min = BigNumber(amountA.toString())
        .times(sendSlippage)
        .toFixed(0);
      const sendAmount1Min = BigNumber(amountB.toString())
        .times(sendSlippage)
        .toFixed(0);

      await this.writeRemoveLiquidty(
        walletClient,
        withdrawTXID,
        token0.address,
        token1.address,
        pair.stable,
        BigInt(sendAmount),
        sendAmount0Min,
        sendAmount1Min,
        deadline
      );

      this._getPairInfo(account);
      this._getSpecificAssetInfo(account, token0.address);
      this._getSpecificAssetInfo(account, token1.address);
      this.emitter.emit(ACTIONS.LIQUIDITY_REMOVED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  unstakeAndRemoveLiquidity = async (payload: {
    type: string;
    content: {
      token0: BaseAsset;
      token1: BaseAsset;
      amount: string;
      amount0: string;
      amount1: string;
      pair: Gauge;
      slippage: string;
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { token0, token1, amount, amount0, amount1, pair, slippage } =
        payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let withdrawTXID = this.getTXUUID();
      let unstakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Remove liquidity from ${pair.symbol}`,
        type: "Liquidity",
        verb: "Liquidity Removed",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your ${pair.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: unstakeTXID,
            description: `Unstake LP tokens from the gauge`,
            status: "WAITING",
          },
          {
            uuid: withdrawTXID,
            description: `Withdraw tokens from the pool`,
            status: "WAITING",
          },
        ],
      });

      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getWithdrawAllowance(pair, account);
      if (!allowance) throw new Error("Error getting withdraw allowance");

      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        await this.writeApprove(
          walletClient,
          allowanceTXID,
          pair.address,
          CONTRACTS.ROUTER_ADDRESS
        );
      }

      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100);
      const sendAmount = BigNumber(amount)
        .times(10 ** PAIR_DECIMALS)
        .toFixed(0);
      const deadline = "" + moment().add(600, "seconds").unix();
      const sendAmount0Min = BigNumber(amount0)
        .times(sendSlippage)
        .times(10 ** token0.decimals)
        .toFixed(0);
      const sendAmount1Min = BigNumber(amount1)
        .times(sendSlippage)
        .times(10 ** token1.decimals)
        .toFixed(0);

      const withdrawFunction = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: pair.gauge?.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "withdraw",
          args: [BigInt(sendAmount)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(unstakeTXID, withdrawFunction);

      const balanceOf = await viemClient.readContract({
        abi: CONTRACTS.PAIR_ABI,
        address: pair.address,
        functionName: "balanceOf",
        args: [account],
      });

      await this.writeRemoveLiquidty(
        walletClient,
        withdrawTXID,
        token0.address,
        token1.address,
        pair.stable,
        balanceOf,
        sendAmount0Min,
        sendAmount1Min,
        deadline
      );

      this._getPairInfo(account);
      this._getSpecificAssetInfo(account, token0.address);
      this._getSpecificAssetInfo(account, token1.address);
      this.emitter.emit(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  unstakeLiquidity = async (payload: {
    type: string;
    content: { amount: string; pair: Gauge };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { amount, pair } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let unstakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Unstake liquidity from gauge`,
        type: "Liquidity",
        verb: "Liquidity Unstaked",
        transactions: [
          {
            uuid: unstakeTXID,
            description: `Unstake LP tokens from the gauge`,
            status: "WAITING",
          },
        ],
      });

      // SUBMIT WITHDRAW TRANSACTION
      const sendAmount = BigNumber(amount)
        .times(10 ** PAIR_DECIMALS)
        .toFixed(0);

      const withdrawFunction = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: pair.gauge?.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "withdraw",
          args: [BigInt(sendAmount)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(unstakeTXID, withdrawFunction);

      this._getPairInfo(account);
      this.emitter.emit(ACTIONS.LIQUIDITY_UNSTAKED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  quoteRemoveLiquidity = async (payload: {
    type: string;
    content: {
      pair: Pair;
      token0: BaseAsset;
      token1: BaseAsset;
      withdrawAmount: `${number}` | "";
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const { pair, token0, token1, withdrawAmount } = payload.content;

      if (!pair || !token0 || !token1 || withdrawAmount == "") {
        return null;
      }

      const routerContract = {
        abi: CONTRACTS.ROUTER_ABI,
        address: CONTRACTS.ROUTER_ADDRESS,
      } as const;

      const sendWithdrawAmount = parseEther(withdrawAmount);

      const [amountA, amountB] = await viemClient.readContract({
        ...routerContract,
        functionName: "quoteRemoveLiquidity",
        args: [token0.address, token1.address, pair.stable, sendWithdrawAmount],
      });

      const returnVal = {
        inputs: {
          token0,
          token1,
          withdrawAmount,
        },
        output: {
          amount0: formatUnits(amountA, token0.decimals),
          amount1: formatUnits(amountB, token1.decimals),
        },
      };
      this.emitter.emit(ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED, returnVal);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createGauge = async (payload: { type: string; content: { pair: Pair } }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { pair } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let createGaugeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Create liquidity gauge for ${pair.token0.symbol}/${pair.token1.symbol}`,
        type: "Liquidity",
        verb: "Gauge Created",
        transactions: [
          {
            uuid: createGaugeTXID,
            description: `Create gauge`,
            status: "WAITING",
          },
        ],
      });

      await this.writeCreateGauge(walletClient, createGaugeTXID, pair.address);

      await this.updatePairsCall(account);

      this.emitter.emit(ACTIONS.CREATE_GAUGE_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  quoteSwap = async (payload: {
    type: string;
    content: {
      fromAsset: BaseAsset;
      toAsset: BaseAsset;
      fromAmount: string;
      slippage: number;
    };
  }) => {
    const address = getAccount().address;
    if (!address) throw new Error("no address");
    try {
      const res = await fetch("/api/firebird-router", {
        method: "POST",
        body: JSON.stringify({
          payload,
          address,
        }),
      });
      const resJson = (await res.json()) as QuoteSwapResponse;

      const returnValue = resJson;

      this.emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, returnValue);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, null);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  swap = async (payload: {
    type: string;
    content: {
      quote: QuoteSwapResponse;
      fromAsset: BaseAsset;
      toAsset: BaseAsset;
    };
  }) => {
    try {
      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const [account] = await walletClient.getAddresses();

      const { quote, fromAsset, toAsset } = payload.content;

      const fromAmount = BigNumber(quote.maxReturn.totalFrom)
        .div(10 ** fromAsset.decimals)
        .toFixed(fromAsset.decimals);

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let swapTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`,
        type: "Swap",
        verb: "Swap Successful",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your ${fromAsset.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: swapTXID,
            description: `Swap ${formatCurrency(fromAmount)} ${
              fromAsset.symbol
            } for ${toAsset.symbol}`,
            status: "WAITING",
          },
        ],
      });

      let allowance: string | null = "0";

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (fromAsset.address !== NATIVE_TOKEN.symbol) {
        allowance = await this._getFirebirdSwapAllowance(
          fromAsset,
          account,
          quote
        );
        if (!allowance) throw new Error("Couldn't fetch allowance");
        if (BigNumber(allowance).lt(fromAmount)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowanceTXID,
            description: `Allow the router to spend your ${fromAsset.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowanceTXID,
            description: `Allowance on ${fromAsset.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${fromAsset.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (!allowance) throw new Error("Couldn't fetch allowance");
      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(fromAmount)) {
        await this.writeApprove(
          walletClient,
          allowanceTXID,
          fromAsset.address,
          quote.encodedData.router
        );
      }

      // SUBMIT SWAP TRANSACTION
      if (
        quote.maxReturn.from === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ) {
        try {
          this.emitter.emit(ACTIONS.TX_PENDING, { uuid: swapTXID });
          const txHash = await walletClient.sendTransaction({
            account,
            to: quote.encodedData.router,
            value: BigInt(quote.maxReturn.totalFrom),
            data: quote.encodedData.data,
            gasPrice: BigInt(quote.maxReturn.gasPrice),
            chain: canto,
          });
          const receipt = await viemClient.waitForTransactionReceipt({
            hash: txHash,
          });
          if (receipt.status === "success") {
            this.emitter.emit(ACTIONS.TX_CONFIRMED, {
              uuid: swapTXID,
              txHash: receipt.transactionHash,
            });
          }
        } catch (error) {
          if (!(error as Error).toString().includes("-32601")) {
            if ((error as Error).message) {
              this.emitter.emit(ACTIONS.TX_REJECTED, {
                uuid: swapTXID,
                error: this._mapError((error as Error).message),
              });
            }
            this.emitter.emit(ACTIONS.TX_REJECTED, {
              uuid: swapTXID,
              error: error,
            });
          }
        }
      } else {
        try {
          this.emitter.emit(ACTIONS.TX_PENDING, { uuid: swapTXID });
          const txHash = await walletClient.sendTransaction({
            account,
            to: quote.encodedData.router,
            value: undefined,
            data: quote.encodedData.data,
            gasPrice: BigInt(quote.maxReturn.gasPrice),
            chain: canto,
          });
          const receipt = await viemClient.waitForTransactionReceipt({
            hash: txHash,
          });
          if (receipt.status === "success") {
            this.emitter.emit(ACTIONS.TX_CONFIRMED, {
              uuid: swapTXID,
              txHash: receipt.transactionHash,
            });
          }
        } catch (error) {
          if (!(error as Error).toString().includes("-32601")) {
            if ((error as Error).message) {
              this.emitter.emit(ACTIONS.TX_REJECTED, {
                uuid: swapTXID,
                error: this._mapError((error as Error).message),
              });
            }
            this.emitter.emit(ACTIONS.TX_REJECTED, {
              uuid: swapTXID,
              error: error,
            });
          }
        }
      }

      this._getSpecificAssetInfo(account, fromAsset.address);
      this._getSpecificAssetInfo(account, toAsset.address);
      this._getPairInfo(account);

      this.emitter.emit(ACTIONS.SWAP_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  wrapOrUnwrap = async (payload: {
    type: string;
    content: { fromAsset: BaseAsset; toAsset: BaseAsset; fromAmount: string };
  }) => {
    try {
      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }
      const [account] = await walletClient.getAddresses();

      const {
        fromAsset: { address: fromAddress, symbol: fromSymbol },
        toAsset: { address: toAddress, symbol: toSymbol },
        fromAmount,
      } = payload.content;
      const isWrap = fromSymbol === "CANTO";
      const action = isWrap ? "Wrap" : "Unwrap";

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      const wrapUnwrapTXID = this.getTXUUID();
      const tx: ITransaction = {
        title: `${action} ${fromSymbol} for ${toSymbol}`,
        type: action,
        verb: `${action} Successful`,
        transactions: [
          {
            uuid: wrapUnwrapTXID,
            description: `${action} ${formatCurrency(
              fromAmount
            )} ${fromSymbol} for ${toSymbol}`,
            status: TransactionStatus.WAITING,
          },
        ],
      };

      this.emitter.emit(ACTIONS.TX_ADDED, tx);

      // SUBMIT WRAP_UNWRAP TRANSACTION
      const sendFromAmount = BigNumber(fromAmount)
        .times(10 ** 18)
        .toFixed(0);

      await this.writeWrapUnwrap(
        walletClient,
        isWrap ? toAddress : fromAddress,
        isWrap,
        wrapUnwrapTXID,
        sendFromAmount
      );

      this._getSpecificAssetInfo(account, fromAddress);
      this._getSpecificAssetInfo(account, toAddress);

      this.emitter.emit(ACTIONS.WRAP_UNWRAP_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getSpecificAssetInfo = async (
    address: `0x${string}`,
    assetAddress: `0x${string}`
  ) => {
    try {
      const baseAssets = this.getStore("baseAssets");
      if (!baseAssets) {
        console.warn("baseAssets not found");
        return null;
      }

      const ba = await Promise.all(
        baseAssets.map(async (asset) => {
          if (asset.address.toLowerCase() === assetAddress.toLowerCase()) {
            if (asset.address === NATIVE_TOKEN.symbol) {
              let bal = await viemClient.getBalance({
                address,
              });
              asset.balance = formatUnits(bal, asset.decimals);
            } else {
              const balanceOf = await viemClient.readContract({
                address: asset.address,
                abi: CONTRACTS.ERC20_ABI,
                functionName: "balanceOf",
                args: [address],
              });

              asset.balance = formatUnits(balanceOf, asset.decimals);
            }
          }

          return asset;
        })
      );

      this.setStore({ baseAssets: ba });
      this.updateSwapAssets(ba);
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  _getFirebirdSwapAllowance = async (
    token: BaseAsset,
    address: `0x${string}`,
    quote: QuoteSwapResponse
  ) => {
    try {
      const allowance = await viemClient.readContract({
        address: token.address,
        abi: CONTRACTS.ERC20_ABI,
        functionName: "allowance",
        args: [address, quote.encodedData.router],
      });

      return formatUnits(allowance, token.decimals);
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  // _getSwapAllowance = async (
  //   token: BaseAsset,
  //   account: { address: string }
  // ) => {
  //   try {
  //     const allowance = await viemClient.readContract({
  //       address: token.address ,
  //       abi: CONTRACTS.ERC20_ABI,
  //       functionName: "allowance",
  //       args: [account , CONTRACTS.ROUTER_ADDRESS],
  //     });

  //     return formatUnits(allowance, token.decimals);
  //   } catch (ex) {
  //     console.error(ex);
  //     return null;
  //   }
  // };

  getVestNFTs = async () => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");
      if (!veToken || !govToken) {
        throw new Error("veToken or govToken not found");
      }

      const vestingContract = {
        abi: CONTRACTS.VE_TOKEN_ABI,
        address: CONTRACTS.VE_TOKEN_ADDRESS,
      } as const;

      const nftsLength = await viemClient.readContract({
        ...vestingContract,
        functionName: "balanceOf",
        args: [account],
      });

      const arr = Array.from(
        { length: parseInt(nftsLength.toString()) },
        (v, i) => i
      );

      const nfts = await Promise.all(
        arr.map(async (idx) => {
          const tokenIndex = await viemClient.readContract({
            ...vestingContract,
            functionName: "tokenOfOwnerByIndex",
            args: [account, BigInt(idx)] as const,
          });

          const [[lockedAmount, lockedEnd], lockValue, voted, totalSupply] =
            await viemClient.multicall({
              allowFailure: false,
              multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
              contracts: [
                {
                  ...vestingContract,
                  functionName: "locked",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "balanceOfNFT",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "voted",
                  args: [tokenIndex],
                },
                {
                  ...vestingContract,
                  functionName: "totalSupply",
                },
              ],
            });

          const [actionedInCurrentEpoch, lastVoted] =
            await this._checkNFTActionEpoch(tokenIndex.toString());

          // probably do some decimals math before returning info. Maybe get more info. I don't know what it returns.
          return {
            id: tokenIndex.toString(),
            lockEnds: lockedEnd.toString(),
            lockAmount: formatUnits(lockedAmount, govToken.decimals),
            lockValue: formatUnits(lockValue, veToken.decimals),
            actionedInCurrentEpoch,
            reset: actionedInCurrentEpoch && !voted,
            lastVoted,
            influence:
              Number(formatUnits(lockValue, veToken.decimals)) /
              Number(formatUnits(totalSupply, veToken.decimals)),
          };
        })
      );

      this.setStore({ vestNFTs: nfts });
      this.emitter.emit(ACTIONS.VEST_NFTS_RETURNED, nfts);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createVest = async (payload: {
    type: string;
    content: { amount: string; unlockTime: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const govToken = this.getStore("govToken");
      if (!govToken) throw new Error("No gov token");
      const { amount, unlockTime } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let vestTXID = this.getTXUUID();

      const unlockString = moment()
        .add(unlockTime, "seconds")
        .format("YYYY-MM-DD");

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Vest ${govToken.symbol} until ${unlockString}`,
        type: "Vest",
        verb: "Vest Created",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your ${govToken.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: vestTXID,
            description: `Vesting your tokens`,
            status: "WAITING",
          },
        ],
      });

      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getVestAllowance(govToken, account);
      if (!allowance) throw new Error("Error getting allowance in create vest");
      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the vesting contract to use your ${govToken.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${govToken.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        await this.writeApprove(
          walletClient,
          allowanceTXID,
          govToken.address,
          CONTRACTS.VE_TOKEN_ADDRESS
        );
      }

      // SUBMIT VEST TRANSACTION
      const sendAmount = BigNumber(amount)
        .times(10 ** govToken.decimals)
        .toFixed(0);

      const writeCreateLock = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VE_TOKEN_ADDRESS,
          abi: CONTRACTS.VE_TOKEN_ABI,
          functionName: "create_lock",
          args: [BigInt(sendAmount), BigInt(unlockTime)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(vestTXID, writeCreateLock);

      this._getGovTokenInfo(account);
      this.getNFTByID("fetchAll");

      this.emitter.emit(ACTIONS.CREATE_VEST_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getVestAllowance = async (token: GovToken, address: `0x${string}`) => {
    try {
      const allowance = await viemClient.readContract({
        address: token.address,
        abi: CONTRACTS.ERC20_ABI,
        functionName: "allowance",
        args: [address, CONTRACTS.VE_TOKEN_ADDRESS],
      });

      return formatUnits(allowance, token.decimals);
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  increaseVestAmount = async (payload: {
    type: string;
    content: { amount: string; tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const govToken = this.getStore("govToken");
      if (!govToken)
        throw new Error("Error getting gov token in increase vest");
      const { amount, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let vestTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Increase vest amount on token #${tokenID}`,
        type: "Vest",
        verb: "Vest Increased",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your ${govToken.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: vestTXID,
            description: `Increasing your vest amount`,
            status: "WAITING",
          },
        ],
      });

      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getVestAllowance(govToken, account);
      if (!allowance)
        throw new Error("Error getting allowance in increase vest");
      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow vesting contract to use your ${govToken.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${govToken.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        await this.writeApprove(
          walletClient,
          allowanceTXID,
          govToken.address,
          CONTRACTS.VE_TOKEN_ADDRESS
        );
      }

      // SUBMIT INCREASE TRANSACTION
      const sendAmount = BigNumber(amount)
        .times(10 ** govToken.decimals)
        .toFixed(0);

      const writeIncreaseAmount = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VE_TOKEN_ADDRESS,
          abi: CONTRACTS.VE_TOKEN_ABI,
          functionName: "increase_amount",
          args: [BigInt(tokenID), BigInt(sendAmount)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(vestTXID, writeIncreaseAmount);

      this._getGovTokenInfo(account);
      this._updateVestNFTByID(tokenID);

      this.emitter.emit(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  increaseVestDuration = async (payload: {
    type: string;
    content: { unlockTime: string; tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { tokenID, unlockTime } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let vestTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Increase unlock time on token #${tokenID}`,
        type: "Vest",
        verb: "Vest Increased",
        transactions: [
          {
            uuid: vestTXID,
            description: `Increasing your vest duration`,
            status: "WAITING",
          },
        ],
      });

      const writeIncreaseDuration = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VE_TOKEN_ADDRESS,
          abi: CONTRACTS.VE_TOKEN_ABI,
          functionName: "increase_unlock_time",
          args: [BigInt(tokenID), BigInt(unlockTime)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(vestTXID, writeIncreaseDuration);

      this._updateVestNFTByID(tokenID);

      this.emitter.emit(ACTIONS.INCREASE_VEST_DURATION_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  resetVest = async (payload: {
    type: string;
    content: { tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }
      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let rewardsTXID = this.getTXUUID();
      let rebaseTXID = this.getTXUUID();
      let resetTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Reset veNFT #${tokenID}`,
        type: "Reset",
        verb: "Vest Reseted",
        transactions: [
          {
            uuid: rewardsTXID,
            description: `Checking unclaimed bribes`,
            status: "WAITING",
          },
          {
            uuid: rebaseTXID,
            description: `Checking unclaimed rebase distribution`,
            status: "WAITING",
          },
          {
            uuid: resetTXID,
            description: `Resetting your veNFT`,
            status: "WAITING",
          },
        ],
      });

      // CHECK unclaimed bribes
      await this.getRewardBalances({ type: "internal", content: { tokenID } });
      const rewards = this.getStore("rewards");

      if (rewards.xxBribes.length > 0) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rewardsTXID,
          description: `Unclaimed bribes found, claiming`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rewardsTXID,
          description: `No unclaimed bribes found`,
          status: "DONE",
        });
      }

      if (rewards.xxBribes.length > 0) {
        const sendGauges = rewards.xxBribes.map((pair) => {
          return pair.gauge.xx_wrapped_bribe_address;
        });
        const sendTokens = rewards.xxBribes.map((pair) => {
          return pair.gauge.xx_bribesEarned!.map((bribe) => {
            return (bribe as Bribe).token.address;
          });
        });

        await this.writeClaimBribes(
          walletClient,
          rewardsTXID,
          sendGauges,
          sendTokens,
          tokenID
        );
      }

      if (rewards.veDist.length > 0) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rebaseTXID,
          description: `Claiming rebase distribution`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rebaseTXID,
          description: `No unclaimed rebase`,
          status: "DONE",
        });
      }

      if (rewards.veDist.length > 0) {
        const writeClaim = async () => {
          const { request } = await viemClient.simulateContract({
            account,
            address: CONTRACTS.VE_DIST_ADDRESS,
            abi: CONTRACTS.VE_DIST_ABI,
            functionName: "claim",
            args: [BigInt(tokenID)],
          });
          const txHash = await walletClient.writeContract(request);
          return txHash;
        };
        await this._writeContractWrapper(rebaseTXID, writeClaim);
      }

      const writeReset = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VOTER_ADDRESS,
          abi: CONTRACTS.VOTER_ABI,
          functionName: "reset",
          args: [BigInt(tokenID)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(resetTXID, writeReset);

      this._updateVestNFTByID(tokenID);

      this.emitter.emit(ACTIONS.RESET_VEST_RETURNED);
    } catch (e) {
      console.log(e);
      console.log("RESET VEST ERROR");
    }
  };

  withdrawVest = async (payload: {
    type: string;
    content: { tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let rewards01TXID = this.getTXUUID();
      let rewards0TXID = this.getTXUUID();
      let resetTXID = this.getTXUUID();
      let vestTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Withdraw vest amount on token #${tokenID}`,
        type: "Vest",
        verb: "Vest Withdrawn",
        transactions: [
          {
            uuid: rewards01TXID,
            description: `Checking unclaimed bribes`,
            status: "WAITING",
          },
          {
            uuid: rewards0TXID,
            description: `Checking unclaimed bribes`,
            status: "WAITING",
          },
          {
            uuid: resetTXID,
            description: `Checking if your has votes`,
            status: "WAITING",
          },
          {
            uuid: vestTXID,
            description: `Withdrawing your expired tokens`,
            status: "WAITING",
          },
        ],
      });

      // CHECK unclaimed bribes
      await this.getRewardBalances({ type: "internal", content: { tokenID } });
      const rewards = this.getStore("rewards");

      if (rewards.xxBribes.length > 0) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rewards01TXID,
          description: `Unclaimed bribes found, claiming`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rewards01TXID,
          description: `No unclaimed bribes found`,
          status: "DONE",
        });
      }
      if (rewards.xBribes.length > 0) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rewards0TXID,
          description: `Unclaimed bribes found, claiming`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: rewards0TXID,
          description: `No unclaimed bribes found`,
          status: "DONE",
        });
      }

      if (rewards.xxBribes.length > 0) {
        const sendGauges = rewards.xxBribes.map((pair) => {
          return pair.gauge.xx_wrapped_bribe_address;
        });
        const sendTokens = rewards.xxBribes.map((pair) => {
          return pair.gauge.xx_bribesEarned!.map((bribe) => {
            return (bribe as Bribe).token.address;
          });
        });

        await this.writeClaimBribes(
          walletClient,
          rewards01TXID,
          sendGauges,
          sendTokens,
          tokenID
        );
      }
      if (rewards.xBribes.length > 0) {
        const sendGauges = rewards.xBribes.map((pair) => {
          return pair.gauge.x_wrapped_bribe_address;
        });
        const sendTokens = rewards.xBribes.map((pair) => {
          return pair.gauge.x_bribesEarned!.map((bribe) => {
            return (bribe as Bribe).token.address;
          });
        });

        await this.writeClaimBribes(
          walletClient,
          rewards0TXID,
          sendGauges,
          sendTokens,
          tokenID
        );
      }

      // CHECK if veNFT has votes
      const voted = await this._checkNFTVoted(tokenID);

      if (!!voted) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: resetTXID,
          description: `NFT has votes, resetting`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: resetTXID,
          description: `NFT doesn't have votes`,
          status: "DONE",
        });
      }

      if (!!voted) {
        const writeReset = async () => {
          const { request } = await viemClient.simulateContract({
            account,
            address: CONTRACTS.VOTER_ADDRESS,
            abi: CONTRACTS.VOTER_ABI,
            functionName: "reset",
            args: [BigInt(tokenID)],
          });
          const txHash = await walletClient.writeContract(request);
          return txHash;
        };

        await this._writeContractWrapper(resetTXID, writeReset);
      }

      const writeWithdrawLock = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VE_TOKEN_ADDRESS,
          abi: CONTRACTS.VE_TOKEN_ABI,
          functionName: "withdraw",
          args: [BigInt(tokenID)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(vestTXID, writeWithdrawLock);

      this._updateVestNFTByID(tokenID);

      this.emitter.emit(ACTIONS.WITHDRAW_VEST_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  mergeNft = async (payload: {
    type: string;
    content: { from: string; to: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }
      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }
      const { from, to } = payload.content;

      let mergeTXID = this.getTXUUID();
      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Merge NFT #${from} into #${to}`,
        verb: "NFT Merged",
        transactions: [
          {
            uuid: mergeTXID,
            description: `Merging NFT #${from} into #${to}`,
            status: "WAITING",
          },
        ],
      });

      const writeMergeLock = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VE_TOKEN_ADDRESS,
          abi: CONTRACTS.VE_TOKEN_ABI,
          functionName: "merge",
          args: [BigInt(from), BigInt(to)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(mergeTXID, writeMergeLock);

      this.emitter.emit(ACTIONS.MERGE_NFT_RETURNED);
    } catch (e) {
      console.log(e);
      this.emitter.emit(ACTIONS.ERROR, e);
    }
  };

  // actioned in current epoch
  // either vote or reset, not both
  // reset would update lastVoted value as well
  _checkNFTActionEpoch = async (tokenID: string) => {
    const _lastVoted = await this._checkNFTLastVoted(tokenID);

    // if last voted eq 0, means never voted
    if (_lastVoted === BigInt("0")) return [false, _lastVoted] as const;
    const lastVoted = parseInt(_lastVoted.toString());

    let nextEpochTimestamp = this.getStore("updateDate");
    // if user goes straight to vest page, updateDate maybe not set yet
    if (nextEpochTimestamp === 0) {
      nextEpochTimestamp = await stores.helper.getActivePeriod();
    }

    // 7 days epoch length
    const actionedInCurrentEpoch =
      lastVoted > nextEpochTimestamp - 7 * 24 * 60 * 60;
    return [actionedInCurrentEpoch, _lastVoted] as const;
  };

  _checkNFTLastVoted = async (tokenID: string) => {
    const _lastVoted = await viemClient.readContract({
      address: CONTRACTS.VOTER_ADDRESS,
      abi: CONTRACTS.VOTER_ABI,
      functionName: "lastVoted",
      args: [BigInt(tokenID)],
    });
    return _lastVoted;
  };

  _checkNFTVoted = async (tokenID: string) => {
    const voted = await viemClient.readContract({
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      abi: CONTRACTS.VE_TOKEN_ABI,
      functionName: "voted",
      args: [BigInt(tokenID)],
    });

    return voted;
  };

  vote = async (payload: {
    type: string;
    content: { votes: Votes; tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      // const govToken = this.getStore("govToken");
      const { tokenID, votes } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      const voteTXID = this.getTXUUID();

      // NOTE understand OR learn why 'await' needed here and all similar places (only one tx makes it done right away)
      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Cast vote using token #${tokenID}`,
        verb: "Votes Cast",
        transactions: [
          {
            uuid: voteTXID,
            description: `Cast votes`,
            status: "WAITING",
          },
        ],
      });

      const pairs = this.getStore("pairs");
      const deadGauges: string[] = [];

      const onlyVotes = votes.filter((vote) => {
        return BigNumber(vote.value).gt(0) || BigNumber(vote.value).lt(0);
      });

      const votesAddresses = onlyVotes.map((vote) => vote.address);
      const p = pairs.filter((pair) => {
        return votesAddresses.includes(pair.address);
      });
      p.forEach((pair) => {
        if (pair.isAliveGauge === false) {
          deadGauges.push(pair.symbol);
        }
      });

      if (deadGauges.length > 0) {
        const error_message = `Gauges ${deadGauges.join(
          ", "
        )} are dead and cannot be voted on`;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: voteTXID,
          description: error_message,
        });
        throw new Error(error_message);
      }

      const tokens = onlyVotes.map((vote) => {
        return vote.address;
      });

      const voteCounts = onlyVotes.map((vote) => {
        return BigInt(BigNumber(vote.value).times(100).toFixed(0));
      });

      const writeVote = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VOTER_ADDRESS,
          abi: CONTRACTS.VOTER_ABI,
          functionName: "vote",
          args: [BigInt(tokenID), tokens, voteCounts],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };

      await this._writeContractWrapper(voteTXID, writeVote);

      this.emitter.emit(ACTIONS.VOTE_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  getVestVotes = async (payload: {
    type: string;
    content: { tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const { tokenID } = payload.content;
      const pairs = this.getStore("pairs");

      if (!pairs) {
        return null;
      }

      if (!tokenID) {
        return;
      }

      const filteredPairs = pairs.filter((pair) => {
        return pair && pair.gauge && pair.gauge.address;
      });

      const gaugesContract = {
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
      } as const;

      const calls = filteredPairs.map((pair) => {
        return {
          ...gaugesContract,
          functionName: "votes",
          args: [BigInt(tokenID), pair.address],
        } as const;
      });

      const voteCounts = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: calls,
      });

      let votes: Vote[] = [];

      const totalVotes = voteCounts.reduce((curr, acc) => {
        let num = acc > 0 ? acc : acc * BigInt(-1);
        return curr + num;
      }, BigInt(0));

      for (let i = 0; i < voteCounts.length; i++) {
        votes.push({
          address: filteredPairs[i].address,
          votePercent:
            totalVotes > 0 || totalVotes < 0
              ? parseFloat(
                  ((voteCounts[i] * BigInt(100)) / totalVotes).toString()
                ).toFixed(0)
              : "0",
        });
      }

      this.emitter.emit(ACTIONS.VEST_VOTES_RETURNED, votes);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createBribe = async (payload: {
    type: string;
    content: { asset: BaseAsset; amount: string; gauge: Gauge };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { asset, amount, gauge } = payload.content;

      if (gauge.gauge.xx_wrapped_bribe_address === ZERO_ADDRESS) {
        console.warn("gauge does not have a bribe address");
        return null;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let bribeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Create bribe on ${gauge.token0.symbol}/${gauge.token1.symbol}`,
        verb: "Bribe Created",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your ${asset.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: bribeTXID,
            description: `Create bribe`,
            status: "WAITING",
          },
        ],
      });

      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getBribeAllowance(asset, gauge, account);
      if (!allowance) throw new Error("Error getting bribe allowance");
      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the bribe contract to spend your ${asset.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${asset.symbol} sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        await this.writeApprove(
          walletClient,
          allowanceTXID,
          asset.address,
          gauge.gauge.xx_wrapped_bribe_address
        );
      }

      const sendAmount = BigNumber(amount)
        .times(10 ** asset.decimals)
        .toFixed(0);

      // SUBMIT BRIBE TRANSACTION
      // we bribe xx_wrapped_bribe_address
      const writeCreateBribe = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: gauge.gauge.xx_wrapped_bribe_address,
          abi: CONTRACTS.BRIBE_ABI,
          functionName: "notifyRewardAmount",
          args: [asset.address, BigInt(sendAmount)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(bribeTXID, writeCreateBribe);

      this._getGovTokenInfo(account);
      this._getSpecificAssetInfo(account, asset.address);

      await this.updatePairsCall(account);
      this.emitter.emit(ACTIONS.BRIBE_CREATED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getBribeAllowance = async (
    token: BaseAsset,
    pair: Gauge,
    address: `0x${string}`
  ) => {
    try {
      const allowance = await viemClient.readContract({
        address: token.address,
        abi: CONTRACTS.ERC20_ABI,
        functionName: "allowance",
        // We only bribe x_wrapped_bribe_address
        args: [address, pair.gauge.xx_wrapped_bribe_address],
      });

      return formatUnits(allowance, token.decimals);
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  _getBuyAllowanceNOTE = async (
    tokenAddress: `0x${string}`,
    launchpadProjectAddress: `0x${string}`,
    account: `0x${string}` | null
  ) => {
    try {
      if (!account) throw Error("No account found");
      const allowance = await viemClient.readContract({
        address: tokenAddress,
        abi: CONTRACTS.ERC20_ABI,
        functionName: "allowance",
        args: [account, launchpadProjectAddress],
      });

      return formatEther(allowance);
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  getRewardBalances = async (payload: {
    type: string;
    content: { tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const { tokenID } = payload.content;

      const pairs = this.getStore("pairs");
      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");
      if (!veToken || !govToken)
        throw new Error(
          "Error getting veToken and govToken in getRewardBalances"
        );

      const gauges = pairs.filter(hasGauge);

      if (typeof window.structuredClone === "undefined") {
        throw new Error(
          "Your browser does not support structuredClone. Please use a different browser."
        );
      }

      const x_filteredPairs = structuredClone(gauges);
      const xx_filteredPairs = structuredClone(gauges);
      const filteredPairs2 = structuredClone(gauges);
      const filteredPairs3 = structuredClone(gauges);

      let veDistReward: VeDistReward[] = [];
      let x_filteredBribes: Gauge[] = []; // Pair with gauge rewardType set to "XBribe"
      let xx_filteredBribes: Gauge[] = []; // Pair with gauge rewardType set to "XBribe"

      if (tokenID) {
        const x_calls = x_filteredPairs.flatMap((pair) =>
          pair.gauge.x_bribes.map(
            (bribe) =>
              ({
                address: pair.gauge.x_wrapped_bribe_address,
                abi: CONTRACTS.BRIBE_ABI,
                functionName: "earned",
                args: [bribe.token.address, BigInt(tokenID)],
              } as const)
          )
        );
        const x_callsChunks = chunkArray(x_calls, 100);

        const x_earnedBribesAllPairs = await multicallChunks(x_callsChunks);

        const xx_calls = x_filteredPairs.flatMap((pair) =>
          pair.gauge.xx_bribes.map(
            (bribe) =>
              ({
                address: pair.gauge.xx_wrapped_bribe_address,
                abi: CONTRACTS.BRIBE_ABI,
                functionName: "earned",
                args: [bribe.token.address, BigInt(tokenID)],
              } as const)
          )
        );
        const xx_callsChunks = chunkArray(xx_calls, 100);

        const xx_earnedBribesAllPairs = await multicallChunks(xx_callsChunks);

        x_filteredPairs.forEach((pair) => {
          const x_earnedBribesPair = x_earnedBribesAllPairs.splice(
            0,
            pair.gauge.x_bribes.length
          );
          pair.gauge.x_bribesEarned = pair.gauge.x_bribes.map((bribe, i) => {
            return {
              ...bribe,
              earned: formatUnits(
                x_earnedBribesPair[i],
                bribe.token.decimals
              ) as `${number}`,
            };
          });
        });

        xx_filteredPairs.forEach((pair) => {
          const xx_earnedBribesPair = xx_earnedBribesAllPairs.splice(
            0,
            pair.gauge.xx_bribes.length
          );
          pair.gauge.xx_bribesEarned = pair.gauge.xx_bribes.map((bribe, i) => {
            return {
              ...bribe,
              earned: formatUnits(
                xx_earnedBribesPair[i],
                bribe.token.decimals
              ) as `${number}`,
            };
          });
        });

        x_filteredBribes = x_filteredPairs
          .filter((pair) => {
            if (
              pair.gauge.x_bribesEarned &&
              pair.gauge.x_bribesEarned.length > 0
            ) {
              let shouldReturn = false;

              for (let i = 0; i < pair.gauge.x_bribesEarned.length; i++) {
                if (
                  pair.gauge.x_bribesEarned[i].earned &&
                  parseUnits(
                    pair.gauge.x_bribesEarned[i].earned as `${number}`,
                    pair.gauge.x_bribes[i].token.decimals
                  ) > 0
                ) {
                  shouldReturn = true;
                }
              }

              return shouldReturn;
            }

            return false;
          })
          .map((pair) => {
            pair.rewardType = "XBribe";
            return pair;
          });

        xx_filteredBribes = xx_filteredPairs
          .filter((pair) => {
            if (
              pair.gauge.xx_bribesEarned &&
              pair.gauge.xx_bribesEarned.length > 0
            ) {
              let shouldReturn = false;

              for (let i = 0; i < pair.gauge.xx_bribesEarned.length; i++) {
                if (
                  pair.gauge.xx_bribesEarned[i].earned &&
                  parseUnits(
                    pair.gauge.xx_bribesEarned[i].earned as `${number}`,
                    pair.gauge.xx_bribes[i].token.decimals
                  ) > 0
                ) {
                  shouldReturn = true;
                }
              }

              return shouldReturn;
            }

            return false;
          })
          .map((pair) => {
            pair.rewardType = "XXBribe";
            return pair;
          });

        const veDistEarned = await viemClient.readContract({
          address: CONTRACTS.VE_DIST_ADDRESS,
          abi: CONTRACTS.VE_DIST_ABI,
          functionName: "claimable",
          args: [BigInt(tokenID)],
        });

        const vestNFTs = this.getStore("vestNFTs");
        let theNFT = vestNFTs.filter((vestNFT) => {
          return vestNFT.id === tokenID;
        });

        if (veDistEarned > 0) {
          veDistReward.push({
            token: theNFT[0],
            lockToken: veToken,
            rewardToken: govToken,
            earned: formatUnits(veDistEarned, govToken.decimals),
            rewardType: "Distribution",
          });
        }
      }

      const rewardsCalls = filteredPairs2.map((pair) => {
        return {
          address: pair.gauge.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "earned",
          args: [CONTRACTS.GOV_TOKEN_ADDRESS, account],
        } as const;
      });

      const BLOTR_rewardsCalls = filteredPairs3.map((pair) => {
        return {
          address: pair.gauge.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "earned",
          args: [CANTO_OPTION_TOKEN, account],
        } as const;
      });

      const rewardsEarnedCallResult = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: rewardsCalls,
      });

      const BLOTR_rewardsEarnedCallResult = await viemClient.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: BLOTR_rewardsCalls,
      });

      const rewardsEarned = [...filteredPairs2];
      const BLOTR_rewardsEarned = [...filteredPairs3];

      for (let i = 0; i < rewardsEarned.length; i++) {
        rewardsEarned[i].gauge.rewardsEarned = formatEther(
          rewardsEarnedCallResult[i]
        );
      }

      for (let i = 0; i < BLOTR_rewardsEarned.length; i++) {
        BLOTR_rewardsEarned[i].gauge.BLOTR_rewardsEarned = formatEther(
          BLOTR_rewardsEarnedCallResult[i]
        );
      }

      const filteredRewards: Gauge[] = []; // Pair with rewardType set to "Reward"
      const filteredBlotrRewards: Gauge[] = []; // Pair with rewardType set to "Reward"
      for (let j = 0; j < rewardsEarned.length; j++) {
        let pair = Object.assign({}, rewardsEarned[j]);
        if (
          pair.gauge &&
          pair.gauge.rewardsEarned &&
          parseEther(pair.gauge.rewardsEarned as `${number}`) > 0
        ) {
          pair.rewardType = "Reward";
          filteredRewards.push(pair);
        }
      }
      for (let j = 0; j < BLOTR_rewardsEarned.length; j++) {
        let pair = Object.assign({}, BLOTR_rewardsEarned[j]);
        if (
          pair.gauge &&
          pair.gauge.BLOTR_rewardsEarned &&
          parseEther(pair.gauge.BLOTR_rewardsEarned as `${number}`) > 0
        ) {
          pair.rewardType = "oBLOTR_Reward";
          filteredBlotrRewards.push(pair);
        }
      }

      const rewards: Store["store"]["rewards"] = {
        xBribes: x_filteredBribes,
        xxBribes: xx_filteredBribes,
        rewards: filteredRewards,
        BLOTR_rewards: filteredBlotrRewards,
        veDist: veDistReward,
      };

      this.setStore({
        rewards,
      });

      this.emitter.emit(ACTIONS.REWARD_BALANCES_RETURNED, rewards);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimXBribes = async (payload: {
    type: string;
    content: {
      pair: Gauge;
      tokenID: string;
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { pair, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`,
        verb: "Rewards Claimed",
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming your bribes`,
            status: "WAITING",
          },
        ],
      });

      // SUBMIT CLAIM TRANSACTION
      const sendGauges = [pair.gauge.x_wrapped_bribe_address];
      const sendTokens = [
        pair.gauge.x_bribesEarned!.map((bribe) => {
          return (bribe as Bribe).token.address;
        }),
      ];
      await this.writeClaimBribes(
        walletClient,
        claimTXID,
        sendGauges,
        sendTokens,
        tokenID
      );

      this.getRewardBalances({
        type: "Internal rewards balances",
        content: { tokenID },
      });
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimXXBribes = async (payload: {
    type: string;
    content: {
      pair: Gauge;
      tokenID: string;
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { pair, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`,
        verb: "Rewards Claimed",
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming your bribes`,
            status: "WAITING",
          },
        ],
      });

      // SUBMIT CLAIM TRANSACTION
      const sendGauges = [pair.gauge.xx_wrapped_bribe_address];
      const sendTokens = [
        pair.gauge.xx_bribesEarned!.map((bribe) => {
          return (bribe as Bribe).token.address;
        }),
      ];
      await this.writeClaimBribes(
        walletClient,
        claimTXID,
        sendGauges,
        sendTokens,
        tokenID
      );

      this.getRewardBalances({
        type: "Internal rewards balances",
        content: { tokenID },
      });
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
      this.getBalances();
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimAllRewards = async (payload: {
    type: string;
    content: {
      pairs: Store["store"]["rewards"][keyof Store["store"]["rewards"]];
      tokenID: string;
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { pairs, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claim01TXID = this.getTXUUID();
      let claim0TXID = this.getTXUUID();
      let rewardClaimTXIDs: string[] = [];
      let oblotr_rewardClaimTXIDs: string[] = [];
      let distributionClaimTXIDs: string[] = [];

      let xBribePairs = (pairs as Gauge[]).filter((pair) => {
        return pair.rewardType === "XBribe";
      });
      let xxBribePairs = (pairs as Gauge[]).filter((pair) => {
        return pair.rewardType === "XXBribe";
      });

      let rewardPairs = (pairs as Gauge[]).filter((pair) => {
        return pair.rewardType === "Reward";
      });

      let oBlotrRewardPairs = (pairs as Gauge[]).filter((pair) => {
        return pair.rewardType === "oBLOTR_Reward";
      });

      let distribution = (pairs as VeDistReward[]).filter((pair) => {
        return pair.rewardType === "Distribution";
      });

      const sendGauges01 = xxBribePairs.map((pair) => {
        return pair.gauge.xx_wrapped_bribe_address;
      });
      const sendTokens01 = xxBribePairs.map((pair) => {
        return pair.gauge.xx_bribesEarned!.map((bribe) => {
          return (bribe as Bribe).token.address;
        });
      });
      const sendGauges0 = xBribePairs.map((pair) => {
        return pair.gauge.x_wrapped_bribe_address;
      });
      const sendTokens0 = xBribePairs.map((pair) => {
        return pair.gauge.x_bribesEarned!.map((bribe) => {
          return (bribe as Bribe).token.address;
        });
      });

      if (
        xBribePairs.length == 0 &&
        xxBribePairs.length == 0 &&
        rewardPairs.length == 0 &&
        oBlotrRewardPairs.length == 0
      ) {
        this.emitter.emit(ACTIONS.ERROR, "Nothing to claim");
        this.emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED);
        return;
      }

      let sendOBJ: {
        title: string;
        verb: string;
        transactions: ITransaction["transactions"];
      } = {
        title: `Claim all rewards`,
        verb: "Rewards Claimed",
        transactions: [],
      };

      if (xxBribePairs.length > 0) {
        sendOBJ.transactions.push({
          uuid: claim01TXID,
          description: `Claiming all your available bribes`,
          status: TransactionStatus.WAITING,
        });
      }
      if (xBribePairs.length > 0) {
        sendOBJ.transactions.push({
          uuid: claim0TXID,
          description: `Claiming all your available bribes`,
          status: TransactionStatus.WAITING,
        });
      }

      if (rewardPairs.length > 0) {
        for (let i = 0; i < rewardPairs.length; i++) {
          const newClaimTX = this.getTXUUID();

          rewardClaimTXIDs.push(newClaimTX);
          sendOBJ.transactions.push({
            uuid: newClaimTX,
            description: `Claiming reward for ${rewardPairs[i].symbol}`,
            status: TransactionStatus.WAITING,
          });
        }
      }
      if (oBlotrRewardPairs.length > 0) {
        for (let i = 0; i < oBlotrRewardPairs.length; i++) {
          const newClaimTX = this.getTXUUID();

          oblotr_rewardClaimTXIDs.push(newClaimTX);
          sendOBJ.transactions.push({
            uuid: newClaimTX,
            description: `Claiming reward for ${oBlotrRewardPairs[i].symbol}`,
            status: TransactionStatus.WAITING,
          });
        }
      }

      if (distribution.length > 0) {
        for (let i = 0; i < distribution.length; i++) {
          const newClaimTX = this.getTXUUID();

          distributionClaimTXIDs.push(newClaimTX);
          sendOBJ.transactions.push({
            uuid: newClaimTX,
            description: `Claiming distribution for NFT #${distribution[i].token.id}`,
            status: TransactionStatus.WAITING,
          });
        }
      }

      await this.emitter.emit(ACTIONS.TX_ADDED, sendOBJ);

      if (xxBribePairs.length > 0) {
        await this.writeClaimBribes(
          walletClient,
          claim01TXID,
          sendGauges01,
          sendTokens01,
          tokenID
        );
      }
      if (xBribePairs.length > 0) {
        await this.writeClaimBribes(
          walletClient,
          claim0TXID,
          sendGauges0,
          sendTokens0,
          tokenID
        );
      }

      if (rewardPairs.length > 0) {
        for (let i = 0; i < rewardPairs.length; i++) {
          const writeGetReward = async () => {
            const { request } = await viemClient.simulateContract({
              account,
              address: rewardPairs[i].gauge.address,
              abi: CONTRACTS.GAUGE_ABI,
              functionName: "getReward",
              args: [account, [CONTRACTS.GOV_TOKEN_ADDRESS]],
            });
            const txHash = await walletClient.writeContract(request);
            return txHash;
          };
          await this._writeContractWrapper(rewardClaimTXIDs[i], writeGetReward);
        }
      }

      if (oBlotrRewardPairs.length > 0) {
        for (let i = 0; i < oBlotrRewardPairs.length; i++) {
          const writeGetReward = async () => {
            const { request } = await viemClient.simulateContract({
              account,
              address: oBlotrRewardPairs[i].gauge.address,
              abi: CONTRACTS.GAUGE_ABI,
              functionName: "getReward",
              args: [account, [CANTO_OPTION_TOKEN]],
            });
            const txHash = await walletClient.writeContract(request);
            return txHash;
          };
          await this._writeContractWrapper(
            oblotr_rewardClaimTXIDs[i],
            writeGetReward
          );
        }
      }

      if (distribution.length > 0) {
        for (let i = 0; i < distribution.length; i++) {
          const writeClaim = async () => {
            const { request } = await viemClient.simulateContract({
              account,
              address: CONTRACTS.VE_DIST_ADDRESS,
              abi: CONTRACTS.VE_DIST_ABI,
              functionName: "claim",
              args: [BigInt(tokenID)],
            });
            const txHash = await walletClient.writeContract(request);
            return txHash;
          };
          await this._writeContractWrapper(
            distributionClaimTXIDs[i],
            writeClaim
          );
        }
      }

      this.getRewardBalances({
        type: "Internal reward balances",
        content: { tokenID },
      });
      this.emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED);
      this.getBalances();
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimRewards = async (payload: {
    type: string;
    content: { pair: Gauge; tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { pair, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`,
        verb: "Rewards Claimed",
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming your rewards`,
            status: "WAITING",
          },
        ],
      });

      const writeGetReward = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: pair.gauge?.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "getReward",
          args: [account, [CONTRACTS.GOV_TOKEN_ADDRESS]],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(claimTXID, writeGetReward);

      this.getRewardBalances({
        type: "internal reward balances",
        content: { tokenID },
      });
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
      this._getSpecificAssetInfo(account, CONTRACTS.GOV_TOKEN_ADDRESS);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimBlotrRewards = async (payload: {
    type: string;
    content: { pair: Gauge; tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { pair, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`,
        verb: "Rewards Claimed",
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming your rewards`,
            status: "WAITING",
          },
        ],
      });

      const writeGetReward = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: pair.gauge?.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "getReward",
          args: [account, [CANTO_OPTION_TOKEN]],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(claimTXID, writeGetReward);

      this.getRewardBalances({
        type: "internal reward balances",
        content: { tokenID },
      });
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
      this._getSpecificAssetInfo(account, CONTRACTS.GOV_TOKEN_ADDRESS);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimVeDist = async (payload: {
    type: string;
    content: { tokenID: string };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim distribution for NFT #${tokenID}`,
        verb: "Rewards Claimed",
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming your distribution`,
            status: "WAITING",
          },
        ],
      });

      const writeClaim = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: CONTRACTS.VE_DIST_ADDRESS,
          abi: CONTRACTS.VE_DIST_ABI,
          functionName: "claim",
          args: [BigInt(tokenID)],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(claimTXID, writeClaim);

      this.getRewardBalances({
        type: "internal reward balances",
        content: { tokenID },
      });
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  bribeAutoBribe = async (payload: {
    type: string;
    content: { address: `0x${string}` };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { address } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let bribeTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Bribe AutoBribe`,
        verb: "Bribed",
        transactions: [
          {
            uuid: bribeTXID,
            description: `Bribing AutoBribe`,
            status: "WAITING",
          },
        ],
      });

      const writeBribeAutoBribe = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: address,
          abi: CONTRACTS.AUTO_BRIBE_ABI,
          functionName: "bribe",
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(bribeTXID, writeBribeAutoBribe);

      queryClient.invalidateQueries(["autoBribes"]);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  buy = async (payload: {
    type: string;
    content: {
      amount: `${number}`;
      refCode: string;
      projectAddress: string | string[];
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { amount, refCode, projectAddress } = payload.content;

      const sendAmount = parseEther(amount);

      const refCodeToSend = isAddress(refCode) ? refCode : ZERO_ADDRESS;

      if (Array.isArray(projectAddress) || !isAddress(projectAddress)) {
        console.warn("projectAddress is not a valid address");
        return null;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let buyTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Participate in Launchpad`,
        verb: "Participated",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your NOTE allowance`,
            status: "WAITING",
          },
          {
            uuid: buyTXID,
            description: `Buy worth of ${amount} NOTE`,
            status: "WAITING",
          },
        ],
      });

      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getBuyAllowanceNOTE(
        "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
        projectAddress,
        account
      );
      if (!allowance) throw new Error("Error getting bribe allowance");
      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the bribe contract to spend your $NOTE`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on $NOTE sufficient`,
          status: "DONE",
        });
      }

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        await this.writeApprove(
          walletClient,
          allowanceTXID,
          "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
          projectAddress
        );
      }

      const writeBuy = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: projectAddress,
          abi: CONTRACTS.FAIR_AUCTION_ABI,
          functionName: "buy",
          args: [sendAmount, refCodeToSend],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(buyTXID, writeBuy);

      queryClient.invalidateQueries({
        queryKey: [
          "launchpadProject",
          "noteAsset",
          "userClaimableAndClaimableRefEarnings",
        ],
      });
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimEarned = async (payload: {
    type: string;
    content: {
      projectAddress: string | string[];
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { projectAddress } = payload.content;

      if (Array.isArray(projectAddress) || !isAddress(projectAddress)) {
        console.warn("projectAddress is not a valid address");
        return null;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim Earned Amount`,
        verb: "Claimed",
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming`,
            status: "WAITING",
          },
        ],
      });

      const writeClaim = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: projectAddress,
          abi: CONTRACTS.FAIR_AUCTION_ABI,
          functionName: "claim",
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(claimTXID, writeClaim);

      queryClient.invalidateQueries({
        queryKey: ["userClaimableAndClaimableRefEarnings"],
      });
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimRefEarned = async (payload: {
    type: string;
    content: {
      projectAddress: string | string[];
    };
  }) => {
    try {
      const account = getAccount().address;
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const walletClient = await getWalletClient({ chainId: canto.id });
      if (!walletClient) {
        console.warn("wallet");
        return null;
      }

      const { projectAddress } = payload.content;

      if (Array.isArray(projectAddress) || !isAddress(projectAddress)) {
        console.warn("projectAddress is not a valid address");
        return null;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      await this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Claim Ref Earned Amount`,
        verb: "Claimed",
        transactions: [
          {
            uuid: claimTXID,
            description: `Claiming`,
            status: "WAITING",
          },
        ],
      });

      const writeClaim = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: projectAddress,
          abi: CONTRACTS.FAIR_AUCTION_ABI,
          functionName: "claimRefEarnings",
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await this._writeContractWrapper(claimTXID, writeClaim);

      queryClient.invalidateQueries({
        queryKey: ["userClaimableAndClaimableRefEarnings"],
      });
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  writeApprove = async (
    walletClient: WalletClient,
    txId: string,
    tokenAddress: `0x${string}`,
    approveTo: `0x${string}`
  ) => {
    const [account] = await walletClient.getAddresses();
    const write = async () => {
      const { request } = await viemClient.simulateContract({
        account,
        address: tokenAddress,
        abi: CONTRACTS.ERC20_ABI,
        functionName: "approve",
        args: [approveTo, BigInt(MAX_UINT256)],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    await this._writeContractWrapper(txId, write);
  };

  writeWrapUnwrap = async (
    walletClient: WalletClient,
    targetWrapper: `0x${string}`,
    isWrap: boolean,
    wrapUnwrapTXID: string,
    sendFromAmount: string
  ) => {
    const [account] = await walletClient.getAddresses();
    const wNativeTokenContract = {
      address: targetWrapper,
      abi: W_NATIVE_ABI,
    } as const;
    const writeWrap = async () => {
      const { request } = await viemClient.simulateContract({
        ...wNativeTokenContract,
        account,
        functionName: "deposit",
        args: undefined,
        value: BigInt(sendFromAmount),
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    const writeUnwrap = async () => {
      const { request } = await viemClient.simulateContract({
        ...wNativeTokenContract,
        account,
        functionName: "withdraw",
        args: [BigInt(sendFromAmount)],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    if (isWrap) {
      await this._writeContractWrapper(wrapUnwrapTXID, writeWrap);
    } else {
      await this._writeContractWrapper(wrapUnwrapTXID, writeUnwrap);
    }
  };

  writeAddLiquidity = async (
    walletClient: WalletClient,
    depositTXID: string,
    token0: BaseAsset,
    token1: BaseAsset,
    stable: boolean,
    sendAmount0: string,
    sendAmount1: string,
    sendAmount0Min: string,
    sendAmount1Min: string,
    deadline: string
  ) => {
    const [account] = await walletClient.getAddresses();
    const routerContract = {
      abi: CONTRACTS.ROUTER_ABI,
      address: CONTRACTS.ROUTER_ADDRESS,
    } as const;
    const writeWithoutNativeToken = async () => {
      const { request } = await viemClient.simulateContract({
        ...routerContract,
        account,
        functionName: "addLiquidity",
        args: [
          token0.address,
          token1.address,
          stable,
          BigInt(sendAmount0),
          BigInt(sendAmount1),
          BigInt(sendAmount0Min),
          BigInt(sendAmount1Min),
          account,
          BigInt(deadline),
        ],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    const writeWithNativeTokenFirst = async () => {
      const { request } = await viemClient.simulateContract({
        ...routerContract,
        account,
        functionName: "addLiquidityETH",
        args: [
          token1.address,
          stable,
          BigInt(sendAmount1),
          BigInt(sendAmount1Min),
          BigInt(sendAmount0Min),
          account,
          BigInt(deadline),
        ],
        value: BigInt(sendAmount0),
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    const writeWithNativeTokenSecond = async () => {
      const { request } = await viemClient.simulateContract({
        ...routerContract,
        account,
        functionName: "addLiquidityETH",
        args: [
          token0.address,
          stable,
          BigInt(sendAmount0),
          BigInt(sendAmount0Min),
          BigInt(sendAmount1Min),
          account,
          BigInt(deadline),
        ],
        value: BigInt(sendAmount1),
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    if (
      token0.address !== NATIVE_TOKEN.symbol &&
      token1.address !== NATIVE_TOKEN.symbol
    ) {
      await this._writeContractWrapper(depositTXID, writeWithoutNativeToken);
    } else if (token0.address === NATIVE_TOKEN.symbol) {
      await this._writeContractWrapper(depositTXID, writeWithNativeTokenFirst);
    } else {
      await this._writeContractWrapper(depositTXID, writeWithNativeTokenSecond);
    }
  };

  writeRemoveLiquidty = async (
    walletClient: WalletClient,
    withdrawTXID: string,
    token0Address: `0x${string}`,
    token1Address: `0x${string}`,
    stable: boolean,
    sendAmount: bigint,
    sendAmount0Min: string,
    sendAmount1Min: string,
    deadline: string
  ) => {
    const [account] = await walletClient.getAddresses();
    const write = async () => {
      const { request } = await viemClient.simulateContract({
        account,
        abi: CONTRACTS.ROUTER_ABI,
        address: CONTRACTS.ROUTER_ADDRESS,
        functionName: "removeLiquidity",
        args: [
          token0Address,
          token1Address,
          stable,
          sendAmount,
          BigInt(sendAmount0Min),
          BigInt(sendAmount1Min),
          account,
          BigInt(deadline),
        ],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    await this._writeContractWrapper(withdrawTXID, write);
  };

  writeCreateGauge = async (
    walletClient: WalletClient,
    createGaugeTXID: string,
    pairAddress: `0x${string}`
  ) => {
    const [account] = await walletClient.getAddresses();
    const write = async () => {
      const { request } = await viemClient.simulateContract({
        account,
        address: CONTRACTS.VOTER_ADDRESS,
        abi: CONTRACTS.VOTER_ABI,
        functionName: "createGauge",
        args: [pairAddress],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    await this._writeContractWrapper(createGaugeTXID, write);
  };

  writeDeposit = async (
    walletClient: WalletClient,
    stakeTXID: string,
    gaugeAddress: `0x${string}`,
    balanceOf: bigint
  ) => {
    const [account] = await walletClient.getAddresses();
    const write = async () => {
      const { request } = await viemClient.simulateContract({
        account,
        abi: CONTRACTS.GAUGE_ABI,
        address: gaugeAddress,
        functionName: "deposit",
        args: [balanceOf, BigInt(0)],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    await this._writeContractWrapper(stakeTXID, write);
  };

  writeClaimBribes = async (
    walletClient: WalletClient,
    txId: string,
    sendGauges: `0x${string}`[],
    sendTokens: `0x${string}`[][],
    tokenID: string
  ) => {
    const [account] = await walletClient.getAddresses();
    const write = async () => {
      const { request } = await viemClient.simulateContract({
        account,
        address: CONTRACTS.VOTER_ADDRESS,
        abi: CONTRACTS.VOTER_ABI,
        functionName: "claimBribes",
        args: [sendGauges, sendTokens, BigInt(tokenID)],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    await this._writeContractWrapper(txId, write);
  };

  protected _writeContractWrapper = async (
    txId: string,
    write: () => Promise<WriteContractReturnType>
  ) => {
    try {
      this.emitter.emit(ACTIONS.TX_PENDING, { uuid: txId });

      const txHash = await write();

      const receipt = await viemClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status === "success") {
        this.emitter.emit(ACTIONS.TX_CONFIRMED, {
          uuid: txId,
          txHash: receipt.transactionHash,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        this.emitter.emit(ACTIONS.TX_REJECTED, {
          uuid: txId,
          error: this._mapError(error.message),
        });
        return;
      }
      if (error instanceof BaseError) {
        this.emitter.emit(ACTIONS.TX_REJECTED, {
          uuid: txId,
          error: error.details,
        });
        return;
      }
      this.emitter.emit(ACTIONS.TX_REJECTED, {
        uuid: txId,
        error: error,
      });
    }
  };

  protected _mapError = (error: string) => {
    const errorMap = new Map<string, string>([
      // this happens with slingshot and metamask
      [
        "invalid height",
        "Canto RPC issue. Please try reload page/switch RPC/switch networks back and forth",
      ],
      [
        "attached",
        "You have already voted with this token or your nft is attached",
      ],
      ["TOKEN ALREADY VOTED", "You have already voted with this token"],
      [
        "TOKEN_ALREADY_VOTED_THIS_EPOCH",
        "You have already voted with this token",
      ],
      [
        "INSUFFICIENT A BALANCE",
        "Router doesn't have enough 'token in' balance",
      ],
      [
        "INSUFFICIENT_A_BALANCE",
        "Router doesn't have enough 'token in' balance",
      ],
      [
        "INSUFFICIENT B BALANCE",
        "Router doesn't have enough 'token out' balance",
      ],
      [
        "INSUFFICIENT_B_BALANCE",
        "Router doesn't have enough 'token out' balance",
      ],
      // some wallet some rpc not sure
      [
        "EIP-1559",
        "Canto RPC issue. Please try reload page/switch RPC/switch networks back and forth",
      ],
      // this happens in rubby
      [
        "request failed with status code 502",
        "Canto RPC issue. Please try reload page/switch RPC/switch networks back and forth",
      ],
      [
        "Request failed with status code 429",
        "RPC is being rate limited. Please try reload page/switch RPC/switch networks back and forth",
      ],
    ]);

    for (const [key, value] of errorMap) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return error;
  };
}

export default Store;
