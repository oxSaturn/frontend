interface State {
  stakeNumber: string;
  unstakeNumber: string;
}

interface Action {
  type: "stake" | "unstake";
  payload: string;
}

export function reducer(state: State, action: Action) {
  switch (action.type) {
    case "stake":
      return { ...state, stakeNumber: action.payload };
    case "unstake":
      return { ...state, unstakeNumber: action.payload };
    default:
      return { ...state };
  }
}
