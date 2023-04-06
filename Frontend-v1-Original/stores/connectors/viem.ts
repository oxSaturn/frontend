import { createPublicClient, http, fallback } from "viem";
import { canto } from "viem/chains";

const dexvaults = http("https://canto.dexvaults.com");
const plexnode = http("https://mainnode.plexnode.org:8545");
const nodestake = http("https://jsonrpc.canto.nodestake.top");
const slingshot = http("https://canto.slingshot.finance");
const chandrastation = http("https://canto.evm.chandrastation.com/");
// going to remove neobase because it sends back empty data when can't fetch, this breaks the fallback
// const neobase = http("https://canto.neobase.one");

const client = createPublicClient({
  chain: canto,
  transport: fallback(
    [dexvaults, plexnode, nodestake, slingshot, chandrastation],
    {
      rank: {
        interval: 30_000,
      },
    }
  ),
});

export default client;
