import * as dotenv from "dotenv";
dotenv.config();
import { APIGatewayEvent, Context, Callback } from "aws-lambda";
import { v4 as uuid } from "uuid";
import { getNotFoundResponse } from "./utils";
import initOrder from "./http/init-order";
import connectDB from "./db";
import mongoose from "mongoose";

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
  }

  const resource = `${httpMethod}-${path}`;
  const userSub = event.requestContext.authorizer?.claims?.sub;

  await connectDB();
  switch (resource) {
    case "POST-/order/create":
      const sessionId = requestBody.sessionId || event.headers['Cookie'] || uuid();
      const productId = new mongoose.Types.ObjectId(requestBody.productId);
      const quantity = parseInt(requestBody.quantity);
      return await initOrder({userSub: userSub, sessionId: sessionId, product: {productId: productId, quantity: quantity}});

    default:
      return getNotFoundResponse(path, httpMethod);
  }
};
