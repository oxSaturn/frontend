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

    emitter.on(ACTIONS.WARNING, showWarn);
    return () => {
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
