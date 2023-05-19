import { EventEmitter } from "events";

import { Dispatcher } from "flux";

import StableSwapStore from "./stableSwapStore";
import Helper from "./helper";

const dispatcher = new Dispatcher<any>();
const emitter = new EventEmitter();

const stableSwapStore = new StableSwapStore(dispatcher, emitter);
const helper = new Helper();

export default {
  stableSwapStore: stableSwapStore,
  helper,
  dispatcher: dispatcher,
  emitter: emitter,
};
