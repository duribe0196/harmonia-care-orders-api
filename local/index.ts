import { handleHttpRequests } from "../src/handlers";
import * as addProductToOrder from "./events/add-product-to-order";
import * as getOrder from "./events/get-order";

const eventName = process.argv[3];
let response;
(async () => {
  switch (eventName) {
    case "init-order":
      response = await handleHttpRequests(
        addProductToOrder.event as any,
        addProductToOrder.context as any,
        addProductToOrder.cb,
      );
      console.log("----------RESPONSE-----------\n", response);
      break;
    case "get-order":
      response = await handleHttpRequests(
        getOrder.event as any,
        getOrder.context as any,
        getOrder.cb,
      );
      console.log("----------RESPONSE-----------\n", response);
      break;

    default:
      break;
  }

  process.exit(0);
})();
