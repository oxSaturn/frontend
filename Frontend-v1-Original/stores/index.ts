import { Dispatcher } from "flux";
import { EventEmitter } from "events";

import AccountStore from "./accountStore";
import StableSwapStore from "./stableSwapStore";
import Helper from "./helperStore";

const dispatcher = new Dispatcher<any>();
const emitter = new EventEmitter();

const accountStore = new AccountStore(dispatcher, emitter);
const stableSwapStore = new StableSwapStore(dispatcher, emitter);
const helper = new Helper();

export default {
  accountStore: accountStore,
  stableSwapStore: stableSwapStore,
  helper,
  dispatcher: dispatcher,
  emitter: emitter,
};
