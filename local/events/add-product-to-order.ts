import { getBaseEvent } from "./base-event";
import { getBaseContext } from "./base-context";
import { IOrderProduct } from "../../src/db/models/order";
const body = {
  productId: '664f8c798e7b8aff86bdb2ef', quantity: 1
};

const event = getBaseEvent({
  path: "/order",
  method: "POST",
  body,
});
const context = getBaseContext();
const cb = (data: any) => data;

export { event, context, cb };
