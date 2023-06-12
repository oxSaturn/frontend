import { EventEmitter } from "events";

import Helper from "./helper";

const emitter = new EventEmitter();
const helper = new Helper();

export default {
  helper,
  emitter,
};
