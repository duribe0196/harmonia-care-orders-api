import Joi from "joi";
import { MongooseError } from "mongoose";

import User from "../db/models/user";
import Product from "../db/models/product";
import ShoppingCart from "./ShoppingCart";
import { IOrderProduct } from "../db/models/order";

interface IRemoveProductFromOrderArgs {
  requestBody: IOrderProduct & { sessionId: string };
  userSub: string;
}

export default async function removeProductFromOrder(
  args: IRemoveProductFromOrderArgs,
) {
  const { requestBody, userSub } = args;
  try {
    const schema = Joi.object({
      productId: Joi.string().hex().length(24).required(),
      sessionId: Joi.string().uuid({ version: "uuidv4" }),
      orderId: Joi.string().hex().length(24).required(),
    });

    const { error: removeError, value: removeValue } =
      schema.validate(requestBody);

    if (removeError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Validation error",
          details: removeError.details,
        }),
      };
    }

    const user = userSub ? await User.findOne({ sub: userSub }) : null;
    const productFound = await Product.findById(requestBody.productId);
    if (!productFound) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }
    const shoppingCart = new ShoppingCart(
      user?.id || null,
      requestBody.sessionId,
    );
    const updatedCart = await shoppingCart.removeProduct(requestBody.productId);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedCart),
    };
  } catch (e: unknown) {
    if (e instanceof MongooseError) {
      console.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error removing product from order" }),
      };
    }
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Something went wrong removing product from order",
      }),
    };
  }
}
