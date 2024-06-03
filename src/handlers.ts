import * as dotenv from "dotenv";
dotenv.config();
import { APIGatewayEvent, Context, Callback } from "aws-lambda";
import { v4 as uuid } from "uuid";
import { getNotFoundResponse, parseCookies } from "./utils";
import addProductsToOrder from "./http/add-product-to-order";
import removeProductFromOrder from "./http/remove-product-from-order";
import connectDB from "./db";
import mongoose from "mongoose";
import Joi from "joi";

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
  console.log(JSON.stringify(event, null, 2));
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
  const cookies = parseCookies(event.headers["Cookie"]);

  await connectDB();
  switch (resource) {
    case "POST-/public/order":
    case "POST-/auth/order":
      const schema = Joi.object({
        productId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().positive().required(),
        sessionId: Joi.string().uuid({ version: "uuidv4" }),
      });

      requestBody.sessionId = cookies["session_id"] || uuid();
      const { error, value } = schema.validate(requestBody);

      if (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Validation error",
            details: error.details,
          }),
        };
      }

      const productIdToAdd = new mongoose.Types.ObjectId(requestBody.productId);
      const quantity = parseInt(requestBody.quantity);
      return await addProductsToOrder({
        userSub: userSub,
        sessionId: requestBody.sessionId,
        product: { productId: productIdToAdd, quantity: quantity },
      });

    case `PUT-/public/order/remove-product/${event.pathParameters?.orderId}`:
    case `PUT-/auth/order/remove-product/${event.pathParameters?.orderId}`:
      requestBody.sessionId = cookies["session_id"];
      requestBody.orderId = event.pathParameters?.orderId;

      const removeProductSchema = Joi.object({
        productId: Joi.string().hex().length(24).required(),
        sessionId: Joi.string().uuid({ version: "uuidv4" }),
        orderId: Joi.string().hex().length(24).required(),
      });

      const { error: removeError, value: removeValue } =
        removeProductSchema.validate(requestBody);

      if (removeError) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Validation error",
            details: removeError.details,
          }),
        };
      }

      const productIdToRemove = new mongoose.Types.ObjectId(
        requestBody.productId,
      );
      const orderId = new mongoose.Types.ObjectId(requestBody.orderId);

      return await removeProductFromOrder({
        orderId: orderId,
        productId: productIdToRemove,
        sessionId: requestBody.sessionId,
        userSub,
      });

    default:
      return getNotFoundResponse(path, httpMethod);
  }
};
