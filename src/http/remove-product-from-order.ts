import User from "../db/models/user";
import Product from "../db/models/product";
import ShoppingCart from "./ShoppingCart";
import mongoose, { MongooseError } from "mongoose";

interface IRemoveProductFromOrderArgs {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userSub: string;
  sessionId: string;
}

export default async function removeProductFromOrder(
  args: IRemoveProductFromOrderArgs,
) {
  const { productId, userSub, sessionId, orderId } = args;
  try {
    let user;
    if (userSub) user = await User.findOne({ sub: userSub });
    const productFound = await Product.findById(productId);
    if (!productFound) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }
    const newShoppingCart = new ShoppingCart(user?.id || null, sessionId);
    const updatedCart = await newShoppingCart.removeProduct(productId);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedCart),
    };
  } catch (e: unknown) {
    if (e instanceof MongooseError) {
      console.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error updating order" }),
      };
    }
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Something went wrong" }),
    };
  }
}
