import React from "react";
import { create } from "zustand";

import Snackbar from "./snackbar";

interface SnackBarState {
  open: boolean;
  snackbarType: undefined | string;
  snackbarMessage: undefined | string;
  setState: (_state: {
    open: boolean;
    snackbarType: undefined | string;
    snackbarMessage: undefined | string;
  }) => void;
}

export const useSnackbarStore = create<SnackBarState>()((set) => ({
  open: false,
  snackbarType: undefined,
  snackbarMessage: undefined,
  setState: (state: {
    open: boolean;
    snackbarType: undefined | string;
    snackbarMessage: undefined | string;
  }) => set(state),
}));

const SnackbarController = () => {
  const { open, snackbarType, snackbarMessage } = useSnackbarStore();

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
