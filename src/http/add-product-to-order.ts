import Joi from "joi";
import { MongooseError } from "mongoose";

import Product from "../db/models/product";
import ShoppingCart from "./ShoppingCart";
import User from "../db/models/user";
import { IOrderProduct } from "../db/models/order";

interface IAddProductToOrderArgs {
  requestBody: IOrderProduct & { sessionId: string };
  userSub: string;
}

export default async function addProductsToOrder(
  args: IAddProductToOrderArgs,
): Promise<{ body: string; statusCode: number }> {
  try {
    const { requestBody, userSub } = args;
    const schema = Joi.object({
      productId: Joi.string().hex().length(24).required(),
      quantity: Joi.number().integer().positive().required(),
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
    const productFound = await Product.findById(requestBody.productId);
    if (!productFound) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }
    const newShoppingCart = new ShoppingCart(
      user?.id || null,
      requestBody.sessionId,
    );
    const updatedCart = await newShoppingCart.addProduct(
      requestBody.productId,
      requestBody.quantity,
    );

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
