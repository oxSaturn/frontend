import { useState } from "react";
import { Dialog } from "@mui/material";

export default function WarningModal({
  close,
  acceptWarning,
}: {
  close: () => void;
  acceptWarning: () => void;
}) {
  const [accepted, setAccepted] = useState(false);

  const onClose = () => {
    if (accepted) {
      acceptWarning();
    }
    close();
  };
  return (
    <Dialog open={true} onClose={onClose} className="fixed z-[10030]">
      <div className="flex max-w-lg flex-col items-center justify-center rounded-[10px] border border-primary p-10">
        <img
          src="/images/icon-warning.svg"
          className="mb-4 h-10"
          alt="triangle warning icon"
        />
        <div className="mb-4 text-xl font-extrabold leading-none tracking-tight text-white md:text-2xl lg:text-4xl">
          Voting Information
        </div>
        <div className="text-left text-base font-normal text-lime-50">
          You must cast votes each epoch in order to get bribes.
          <br />
          However, voting weights do carry over to the next epoch and direct FVM
          emissions. If you don&apos;t want to change your votes, just press
          &apos;Cast&nbsp;Votes&apos; button.
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1">
            <label htmlFor="showAgain">Do not show again</label>
            <input
              id="showAgain"
              type="checkbox"
              onChange={(e) => setAccepted(e.target.checked)}
            />
          </div>
          <button
            onClick={onClose}
            className="mr-2 mb-2 rounded-lg border border-primary px-5 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-green-900 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
