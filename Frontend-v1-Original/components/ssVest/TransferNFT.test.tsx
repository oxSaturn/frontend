import { describe, it, expect } from "vitest";

import { reducer } from "./TransferNFT";

const blackhole = "0x0000000000000000000000000000000000000000";

// write unit tests for reducer
describe("TransferNFT reducer", () => {
  it("should return the initial state", () => {
    expect(
      reducer(
        {
          address: "",
          helperText: "",
          error: false,
        },
        { type: "", payload: "" }
      )
    ).toEqual({
      address: "",
      helperText: "",
      error: false,
    });
  });

  it("should handle address", () => {
    expect(
      reducer(
        {
          address: "",
          helperText: "",
          error: false,
        },
        { type: "address", payload: blackhole }
      )
    ).toEqual({
      address: blackhole,
      helperText: "",
      error: false,
    });
  });

  it("should handle address with invalid address", () => {
    expect(
      reducer(
        {
          address: "",
          helperText: "",
          error: false,
        },
        { type: "address", payload: "invalid" }
      )
    ).toEqual({
      address: "invalid",
      helperText: "Invalid Address",
      error: true,
    });
  });

  it("should handle address with self address", () => {
    expect(
      reducer(
        {
          address: "",
          helperText: "",
          error: false,
          currentAddress: blackhole,
        },
        { type: "address", payload: blackhole }
      )
    ).toEqual({
      address: blackhole,
      helperText: "Cannot transfer to self",
      error: true,
      currentAddress: blackhole,
    });
  });
});
