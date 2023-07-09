import { type Address, isAddress } from "viem";
export function transferNftReducer(
  state: {
    address: string;
    helperText: string;
    error: boolean;
    currentAddress?: Address;
  },
  action: { type: string; payload: string }
) {
  switch (action.type) {
    case "address":
      let helperText = "";
      let error = false;
      const { payload } = action;
      if (payload === "") {
        helperText = "";
        error = false;
      } else {
        if (!isAddress(payload)) {
          helperText = "Invalid Address";
          error = true;
        } else if (
          payload.toLowerCase() === state.currentAddress?.toLowerCase()
        ) {
          helperText = "Cannot transfer to self";
          error = true;
        }
      }
      return { ...state, address: action.payload, helperText, error };
    default:
      return state;
  }
}
