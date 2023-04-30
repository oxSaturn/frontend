import React from "react";
import { Typography, Button, CircularProgress } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useConnect } from "wagmi";
import { canto } from "viem/chains";

const Unlock = ({ closeModal }: { closeModal: () => void }) => {
  return (
    <div className="relative flex h-auto flex-[1]">
      <div
        className="absolute -right-2 -top-2 cursor-pointer"
        onClick={closeModal}
      >
        <Close />
      </div>
      <div className="m-auto flex flex-wrap p-3 pt-40 text-center lg:pt-3">
        <Connectors />
      </div>
    </div>
  );
};

function Connectors() {
  const width = window.innerWidth;
  const { connectors } = useConnect({ chainId: canto.id });
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: width > 576 ? "space-between" : "center",
        alignItems: "center",
      }}
    >
      {connectors.map((connector) => (
        <div key={connector.id}>
          <button onClick={() => connector.connect()}>
            Connect {connector.name}
          </button>
        </div>
      ))}
      {/* // if (name === "MetaMask") {
        //   url = "/connectors/icn-metamask.svg";
        //   descriptor = "Connect to your MetaMask wallet";
        // } else if (name === "WalletConnect") {
        //   url = "/connectors/walletConnectIcon.svg";
        //   descriptor = "Scan with WalletConnect to connect";
        // } else if (name === "TrustWallet") {
        //   url = "/connectors/trustWallet.png";
        //   descriptor = "Connect to your TrustWallet";
        // } else if (name === "Portis") {
        //   url = "/connectors/portisIcon.png";
        //   descriptor = "Connect with your Portis account";
        // } else if (name === "Fortmatic") {
        //   url = "/connectors/fortmaticIcon.png";
        //   descriptor = "Connect with your Fortmatic account";
        // } else if (name === "Ledger") {
        //   url = "/connectors/icn-ledger.svg";
        //   descriptor = "Connect with your Ledger Device";
        // } else if (name === "Squarelink") {
        //   url = "/connectors/squarelink.png";
        //   descriptor = "Connect with your Squarelink account";
        // } else if (name === "Trezor") {
        //   url = "/connectors/trezor.png";
        //   descriptor = "Connect with your Trezor Device";
        // } else if (name === "Torus") {
        //   url = "/connectors/torus.jpg";
        //   descriptor = "Connect with your Torus account";
        // } else if (name === "Authereum") {
        //   url = "/connectors/icn-aethereum.svg";
        //   descriptor = "Connect with your Authereum account";
        // } else if (name === "WalletLink") {
        //   display = "Coinbase Wallet";
        //   url = "/connectors/coinbaseWalletIcon.svg";
        //   descriptor = "Connect to your Coinbase wallet";
        // } else if (name === "Frame") {
        //   return "";
        // } */}
    </div>
  );
}

export default Unlock;
