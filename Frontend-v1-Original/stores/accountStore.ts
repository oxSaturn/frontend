import EventEmitter from "events";

import { Dispatcher } from "flux";
import { Address } from "viem";
import { WalletClient } from "wagmi";

import { ACTIONS } from "./constants/constants";

class Store {
  dispatcher: Dispatcher<any>;
  emitter: EventEmitter;
  store: {
    address: null | Address;
    walletClient: null | WalletClient;
  };

  constructor(dispatcher: Dispatcher<any>, emitter: EventEmitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      address: null,
      walletClient: null,
    };

    dispatcher.register(
      function (this: Store, payload: { type: string }) {
        switch (payload.type) {
          case ACTIONS.CONFIGURE:
            this.configure();
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore = <K extends keyof Store["store"]>(index: K) => {
    return this.store[index];
  };

  setStore(obj: { [key: string]: any }) {
    this.store = { ...this.store, ...obj };
    return this.emitter.emit(ACTIONS.STORE_UPDATED);
  }

  configure = async () => {
    setTimeout(
      () =>
        this.dispatcher.dispatch({
          type: ACTIONS.CONFIGURE_SS,
        }),
      100
    );
    this.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
    this.emitter.emit(ACTIONS.CONFIGURE_RETURNED);
  };
}

export default Store;
