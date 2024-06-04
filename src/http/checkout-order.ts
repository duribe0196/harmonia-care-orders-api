import mongoose, { MongooseError } from "mongoose";

import ShoppingCart from "./ShoppingCart";
import User from "../db/models/user";
import Joi from "joi";
import Order from "../db/models/order";

interface IRequestBody {
  orderId: mongoose.Types.ObjectId;
  sessionId: string;
  paymentMethod: string;
  deliveryAddress: string;
  specialInstructions?: string;
}

interface ICheckoutOrderArgs {
  requestBody: IRequestBody;
  userSub: string;
}

export default async function checkoutOrder(
  args: ICheckoutOrderArgs,
): Promise<{ body: string; statusCode: number }> {
  try {
    const { requestBody, userSub } = args;
    const schema = Joi.object({
      orderId: Joi.string().hex().length(24).required(),
      sessionId: Joi.string().uuid({ version: "uuidv4" }),
      paymentMethod: Joi.string().required(),
      deliveryAddress: Joi.string().required(),
      specialInstructions: Joi.string().optional(),
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
    const orderFound = await Order.findById(requestBody.orderId);
    if (!orderFound) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Order not found" }),
      };
    }

    const shoppingCart = new ShoppingCart(
      user?.id || null,
      requestBody.sessionId,
    );
    const updatedCart = shoppingCart.checkout(
      requestBody.paymentMethod,
      requestBody.deliveryAddress,
      requestBody.specialInstructions,
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
        body: JSON.stringify({ message: "Error doing checkout of the order" }),
      };
    }
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Something went wrong doing checkout of the order",
      }),
    };
  }
}
