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
  contactNumber: string;
  email: string;
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
    console.log(
      `checkoutOrder - starting checkout for order ${requestBody.orderId}`,
    );
    const schema = Joi.object({
      orderId: Joi.string().hex().length(24).required(),
      sessionId: Joi.string().uuid({ version: "uuidv4" }),
      paymentMethod: Joi.string().required(),
      contactNumber: Joi.string().required(),
      email: Joi.string().email(),
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
    const updatedCart = await shoppingCart.checkout({
      deliveryAddress: requestBody.deliveryAddress,
      contactNumber: requestBody.contactNumber,
      email: requestBody.email,
      specialInstructions: requestBody.specialInstructions,
      paymentMethod: requestBody.paymentMethod,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(updatedCart),
    };
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof MongooseError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error doing checkout of the order" }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Something went wrong doing checkout of the order",
      }),
    };
  }
}
