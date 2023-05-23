import EventEmitter from "events";

import { Dispatcher } from "flux";

import { ACTIONS } from "./constants/constants";

class Store {
  dispatcher: Dispatcher<any>;
  emitter: EventEmitter;

  constructor(dispatcher: Dispatcher<any>, emitter: EventEmitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

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
