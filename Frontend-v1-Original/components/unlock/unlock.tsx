import React from "react";
import { Typography, Button, CircularProgress } from "@mui/material";
import { Close } from "@mui/icons-material";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { ExternalProvider, Web3Provider } from "@ethersproject/providers";
import { AbstractConnector } from "@web3-react/abstract-connector";

import { ACTIONS } from "../../stores/constants/constants";

const { ERROR, CONNECTION_DISCONNECTED, CONNECTION_CONNECTED, CONFIGURE_SS } =
  ACTIONS;

import stores from "../../stores";

const Unlock = ({ closeModal }: { closeModal: () => void }) => {
  const [state, setState] = React.useState<{
    loading: boolean;
    error: Error | null;
  }>({
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    const error = (err: Error) => {
      setState({ loading: false, error: err });
    };

    const connectionConnected = () => {
      stores.dispatcher.dispatch({
        type: CONFIGURE_SS,
        content: { connected: true },
      });

      if (closeModal != null) {
        closeModal();
      }
    };

    const connectionDisconnected = () => {
      stores.dispatcher.dispatch({
        type: CONFIGURE_SS,
        content: { connected: false },
      });
      if (closeModal != null) {
        closeModal();
      }
    };

    stores.emitter.on(CONNECTION_CONNECTED, connectionConnected);
    stores.emitter.on(CONNECTION_DISCONNECTED, connectionDisconnected);
    stores.emitter.on(ERROR, error);
    return () => {
      stores.emitter.removeListener(CONNECTION_CONNECTED, connectionConnected);
      stores.emitter.removeListener(
        CONNECTION_DISCONNECTED,
        connectionDisconnected
      );
      stores.emitter.removeListener(ERROR, error);
    };
  }, []);

  return (
    <div className="relative flex h-auto flex-[1]">
      <div
        className="absolute -right-2 -top-2 cursor-pointer"
        onClick={closeModal}
      >
        <Close />
      </div>
      <div className="m-auto flex flex-wrap p-3 pt-40 text-center lg:pt-3">
        <Web3ReactProvider getLibrary={getLibrary}>
          <MyComponent closeModal={closeModal} />
        </Web3ReactProvider>
      </div>
    </div>
  );
};

function getLibrary(provider: ExternalProvider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
}

function onConnectionClicked(
  currentConnector: (typeof stores.accountStore.store)["connectorsByName"][keyof (typeof stores.accountStore.store)["connectorsByName"]],
  name: keyof (typeof stores.accountStore.store)["connectorsByName"],
  setActivatingConnector: (connect: AbstractConnector) => void,
  activate: (
    connector: AbstractConnector,
    onError?: ((error: Error) => void) | undefined,
    throwErrors?: boolean | undefined
  ) => Promise<void>
) {
  const connectorsByName = stores.accountStore.getStore("connectorsByName");
  setActivatingConnector(currentConnector);
  activate(connectorsByName[name]);
}

function MyComponent({ closeModal }: { closeModal: () => void }) {
  const context = useWeb3React();

  const { connector, library, account, activate, active, error } = context;
  const connectorsByName = stores.accountStore.getStore("connectorsByName");

  const [activatingConnector, setActivatingConnector] =
    React.useState<AbstractConnector>();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  React.useEffect(() => {
    if (account && active && library) {
      stores.accountStore.setStore({
        account: { address: account },
        web3context: context,
      });
      stores.emitter.emit(CONNECTION_CONNECTED);
      stores.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
    }
  }, [account, active, closeModal, context, library]);

  const width = window.innerWidth;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: width > 576 ? "space-between" : "center",
        alignItems: "center",
      }}
    >
      {Object.keys(connectorsByName).map((name) => {
        const currentConnector =
          connectorsByName[
            name as keyof (typeof stores.accountStore.store)["connectorsByName"]
          ];
        const activating = currentConnector === activatingConnector;
        const connected = currentConnector === connector;
        const disabled = !!activatingConnector || !!error;

        let url;
        let display = name;
        let descriptor = "";
        if (name === "MetaMask") {
          url = "/connectors/icn-metamask.svg";
          descriptor = "Connect to your MetaMask wallet";
        } else if (name === "WalletConnect") {
          url = "/connectors/walletConnectIcon.svg";
          descriptor = "Scan with WalletConnect to connect";
        } else if (name === "TrustWallet") {
          url = "/connectors/trustWallet.png";
          descriptor = "Connect to your TrustWallet";
        } else if (name === "Portis") {
          url = "/connectors/portisIcon.png";
          descriptor = "Connect with your Portis account";
        } else if (name === "Fortmatic") {
          url = "/connectors/fortmaticIcon.png";
          descriptor = "Connect with your Fortmatic account";
        } else if (name === "Ledger") {
          url = "/connectors/icn-ledger.svg";
          descriptor = "Connect with your Ledger Device";
        } else if (name === "Squarelink") {
          url = "/connectors/squarelink.png";
          descriptor = "Connect with your Squarelink account";
        } else if (name === "Trezor") {
          url = "/connectors/trezor.png";
          descriptor = "Connect with your Trezor Device";
        } else if (name === "Torus") {
          url = "/connectors/torus.jpg";
          descriptor = "Connect with your Torus account";
        } else if (name === "Authereum") {
          url = "/connectors/icn-aethereum.svg";
          descriptor = "Connect with your Authereum account";
        } else if (name === "WalletLink") {
          display = "Coinbase Wallet";
          url = "/connectors/coinbaseWalletIcon.svg";
          descriptor = "Connect to your Coinbase wallet";
        } else if (name === "Frame") {
          return "";
        }

        return (
          <div
            key={name}
            style={{
              padding: "0px",
              display: "flex",
              margin: width > 576 ? "12px 0px" : "0px",
            }}
          >
            <Button
              style={{
                width: width > 576 ? "350px" : "calc(100vw - 100px)",
                height: "200px",
                backgroundColor: "rgba(0,0,0,0.05)",
                border: "1px solid rgba(108,108,123,0.2)",
                color: "rgba(108,108,123,1)",
              }}
              variant="contained"
              onClick={() => {
                onConnectionClicked(
                  currentConnector,
                  name as keyof (typeof stores.accountStore.store)["connectorsByName"],
                  setActivatingConnector,
                  activate
                );
              }}
              disableElevation
              color="secondary"
              disabled={disabled}
            >
              <div
                style={{
                  height: "160px",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                }}
              >
                <img
                  style={{
                    width: "60px",
                    height: "60px",
                  }}
                  src={url}
                  alt=""
                />
                <Typography
                  style={{ color: "#FFFFFF", marginBottom: "-15px" }}
                  variant={"h2"}
                >
                  {display}
                </Typography>
                <Typography style={{ color: "#7E99B0" }} variant={"body2"}>
                  {descriptor}
                </Typography>
                {activating && (
                  <CircularProgress size={15} style={{ marginRight: "10px" }} />
                )}
                {!activating && connected && (
                  <div
                    style={{
                      background: "#4caf50",
                      borderRadius: "10px",
                      width: "10px",
                      height: "10px",
                      marginRight: "0px",
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                    }}
                  ></div>
                )}
              </div>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default Unlock;
