import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { NetworkConnector } from "@web3-react/network-connector";

const POLLING_INTERVAL = 12000;
const RPC_URLS = {
  740: "https://eth.plexnode.wtf/",
  7700: "https://eca5-219-73-56-235.ngrok.io/", //TODO set it to new node
  31337: "https://eca5-219-73-56-235.ngrok.io/", //TODO set it to new node
};

let obj: {
  [key: number]: string;
} = {
  7700: RPC_URLS[7700],
};

if (process.env.NEXT_PUBLIC_CHAINID === "740") {
  obj = { 740: RPC_URLS[740] };
}

export const network = new NetworkConnector({ urls: obj });

export const injected = new InjectedConnector({
  supportedChainIds: [parseInt(process.env.NEXT_PUBLIC_CHAINID)],
});

export const walletconnect = new WalletConnectConnector({
  rpc: obj,
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAINID),
  bridge: "https://bridge.walletconnect.org",
  qrcode: true,
});

export const walletlink = new WalletLinkConnector({
  url: RPC_URLS[process.env.NEXT_PUBLIC_CHAINID],
  appName: "Velocimeter",
  supportedChainIds: [parseInt(process.env.NEXT_PUBLIC_CHAINID)],
});
