import { createPublicClient, http, fallback } from "viem";
import { canto } from "viem/chains";

const dexvaults = http("https://canto.dexvaults.com");
const plexnode = http("https://mainnode.plexnode.org:8545");
const nodestake = http("https://jsonrpc.canto.nodestake.top");
const slingshot = http("https://canto.slingshot.finance");
const neobase = http("https://canto.neobase.one");

const client = createPublicClient({
  chain: canto,
  transport: fallback([dexvaults, plexnode, nodestake, slingshot, neobase], {
    rank: {
      interval: 30_000,
    },
  }),
});

export default client;
