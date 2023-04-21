import React from "react";


import { ACTIONS } from "../../stores/constants/constants";
import stores from "../../stores";

import Snackbar from "./snackbar";
const emitter = stores.emitter;

const SnackbarController = () => {
  const [state, setState] = React.useState<{
    open: boolean;
    snackbarType: null | string;
    snackbarMessage: null | string;
  }>({
    open: false,
    snackbarType: null,
    snackbarMessage: null,
  });

  React.useEffect(() => {
    const showError = (error: Error) => {
      const snackbarObj = {
        snackbarMessage: null,
        snackbarType: null,
        open: false,
      };
      setState(snackbarObj);

      if (process.env.NODE_ENV === "development") {
        setTimeout(() => {
          const snackbarObj = {
            snackbarMessage: error.toString(),
            snackbarType: "Error",
            open: true,
          };
          setState(snackbarObj);
        });
      }
    };

    const showHash = ({ txHash }: { txHash: string }) => {
      const snackbarObj = {
        snackbarMessage: null,
        snackbarType: null,
        open: false,
      };
      setState(snackbarObj);

      setTimeout(() => {
        const snackbarObj = {
          snackbarMessage: txHash,
          snackbarType: "Hash",
          open: true,
        };
        setState(snackbarObj);
      });
    };

    const showWarn = ({ warning }: { warning: string }) => {
      const snackbarObj = {
        snackbarMessage: null,
        snackbarType: null,
        open: false,
      };
      setState(snackbarObj);

      setTimeout(() => {
        const snackbarObj = {
          snackbarMessage: warning,
          snackbarType: "Warning",
          open: true,
        };
        setState(snackbarObj);
      });
    };

    emitter.on(ACTIONS.ERROR, showError);
    emitter.on(ACTIONS.TX_SUBMITTED, showHash);
    emitter.on(ACTIONS.WARNING, showWarn);
    return () => {
      emitter.removeListener(ACTIONS.ERROR, showError);
      emitter.removeListener(ACTIONS.TX_SUBMITTED, showHash);
      emitter.removeListener(ACTIONS.WARNING, showWarn);
    };
  }, []);

  const { snackbarType, snackbarMessage, open } = state;
  return (
    <>
      {open ? (
        <Snackbar type={snackbarType} message={snackbarMessage} open={true} />
      ) : (
        <div />
      )}
    </>
  );
};

export default SnackbarController;
