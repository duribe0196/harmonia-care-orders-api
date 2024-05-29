import { getBaseEvent } from "./base-event";
import { getBaseContext } from "./base-context";

const event = getBaseEvent({
  path: "/order",
  method: "GET",
});
const context = getBaseContext();
const cb = (data: any) => data;

export { event, context, cb };
