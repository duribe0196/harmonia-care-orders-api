import * as dotenv from "dotenv";
dotenv.config();
import { APIGatewayEvent, Context, Callback } from "aws-lambda";
import { v4 as uuid } from "uuid";
import { getNotFoundResponse, parseCookies } from "./utils";
import addProductsToOrder from "./http/add-product-to-order";
import removeProductFromOrder from "./http/remove-product-from-order";
import checkoutOrder from "./http/checkout-order";
import connectDB from "./db";

export const handleHttpRequests = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
) => {
  const httpMethod = event.httpMethod;
  const path = event.path;
  console.log(
    `handleHttpRequests - Received method ${httpMethod} in the path ${path}`,
  );
  // Attempt to parse the request body if present
  let requestBody;
  if (event.body) {
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid JSON format in request body.",
        }),
      };
    }
  } else {
    requestBody = {};
  }

  const resource = `${httpMethod}-${path}`;
  console.log(`handleHttpRequests - will process ${resource}`);
  const userSub = event.requestContext.authorizer?.claims?.sub;
  const cookies = parseCookies(event.headers["Cookie"]);

  await connectDB();
  switch (resource) {
    case "POST-/public/order":
    case "POST-/auth/order":
      requestBody.sessionId = cookies["session_id"] || uuid();
      return await addProductsToOrder({ requestBody, userSub });

    case `PUT-/public/order/remove-product/${event.pathParameters?.orderId}`:
    case `PUT-/auth/order/remove-product/${event.pathParameters?.orderId}`:
      requestBody.sessionId = cookies["session_id"];
      requestBody.orderId = event.pathParameters?.orderId;

      return await removeProductFromOrder({
        requestBody,
        userSub,
      });

    case `PUT-/public/order/checkout/${event.pathParameters?.orderId}`:
    case `PUT-/auth/order/checkout/${event.pathParameters?.orderId}`:
      requestBody.sessionId = cookies["session_id"];
      requestBody.orderId = event.pathParameters?.orderId;
      return await checkoutOrder({ userSub, requestBody });

    default:
      console.log(
        `handleHttpRequests - No matching route found for ${resource}`,
      );
      return getNotFoundResponse(path, httpMethod);
  }
};
