import { Dispatcher } from "flux";
import { EventEmitter } from "events";

import AccountStore from "./accountStore";
import StableSwapStore from "./stableSwapStore";

const dispatcher = new Dispatcher<any>();
const emitter = new EventEmitter();

const accountStore = new AccountStore(dispatcher, emitter);
const stableSwapStore = new StableSwapStore(dispatcher, emitter);

export default {
  accountStore: accountStore,
  stableSwapStore: stableSwapStore,
  dispatcher: dispatcher,
  emitter: emitter,
};
