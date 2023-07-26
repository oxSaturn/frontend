import { describe, it, expect } from "vitest";

import { transformLayerZeroTokenSymbol } from "../pages/api/pairs";
import { Pair } from "../stores/types/types";

const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
describe("transformLayerZeroTokenSymbol", function () {
  it("should stay intact", async function () {
    let pair = {
      token0: {
        address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        symbol: "UNI",
      },
      token1: {
        address: WETH,
        symbol: "WETH",
      },
      stable: false,
    };
    let newPair = transformLayerZeroTokenSymbol(pair as Pair);
    expect(newPair.symbol).toBe("vAMM-UNI/WETH");
  });
  it('should prefix "lz" to token0', async function () {
    let pair = {
      token0: {
        address: "0x28a92dde19d9989f39a49905d7c9c2fac7799bdf",
        symbol: "USDC",
      },
      token1: {
        address: WETH,
        symbol: "WETH",
      },
      stable: false,
    };
    let newPair = transformLayerZeroTokenSymbol(pair as Pair);
    expect(newPair.symbol).toBe("vAMM-lzUSDC/WETH");
  });

  it('should prefix "lz" to token1', async function () {
    let pair = {
      token0: {
        address: WETH,
        symbol: "WETH",
      },
      token1: {
        address: "0x28a92dde19d9989f39a49905d7c9c2fac7799bdf",
        symbol: "USDC",
      },
      stable: false,
    };
    let newPair = transformLayerZeroTokenSymbol(pair as Pair);
    expect(newPair.symbol).toBe("vAMM-WETH/lzUSDC");
  });

  it('should prefix "lz" to both tokens', async function () {
    let pair = {
      token0: {
        address: "0x28a92dde19d9989f39a49905d7c9c2fac7799bdf",
        symbol: "USDC",
      },
      token1: {
        address: "0x91a40c733c97a6e1bf876eaf9ed8c08102eb491f",
        symbol: "DAI",
      },
      stable: true,
    };
    let newPair = transformLayerZeroTokenSymbol(pair as Pair);
    expect(newPair.symbol).toBe("sAMM-lzUSDC/lzDAI");
  });
});
