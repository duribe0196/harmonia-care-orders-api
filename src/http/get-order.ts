import Joi from "joi";
import { MongooseError } from "mongoose";

import ShoppingCart from "./ShoppingCart";
import User from "../db/models/user";

interface IGetOrderArgs {
  requestBody: { sessionId: string };
  userSub: string;
}

export default async function addProductsToOrder(
  args: IGetOrderArgs,
): Promise<{ body: string; statusCode: number }> {
  try {
    const { requestBody, userSub } = args;
    const schema = Joi.object({
      userSub: Joi.string().optional(),
      sessionId: Joi.string().uuid({ version: "uuidv4" }),
    });
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

    const user = userSub ? await User.findOne({ sub: userSub }) : null;
    const shoppingCart = new ShoppingCart(
      user?.id || null,
      requestBody.sessionId,
    );

    const updatedCart = await shoppingCart.getOrderDetails();
    return {
      statusCode: 200,
      body: JSON.stringify(updatedCart),
    };
  } catch (e: unknown) {
    if (e instanceof MongooseError) {
      console.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error adding product to order" }),
      };
    }
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Something went wrong adding product to order",
      }),
    };
  }
}
