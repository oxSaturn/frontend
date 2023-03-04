import React from "react";
import { DialogContent, Dialog, Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

import Unlock from "./unlock";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function UnlockModal({
  closeModal,
  modalOpen,
}: {
  closeModal: () => void;
  modalOpen: boolean;
}) {
  const fullScreen = window.innerWidth < 576;

  return (
    <Dialog
      open={modalOpen}
      onClose={closeModal}
      fullWidth={true}
      maxWidth={"sm"}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
    >
      <DialogContent>
        <Unlock closeModal={closeModal} />
      </DialogContent>
    </Dialog>
  );
}

export default UnlockModal;
