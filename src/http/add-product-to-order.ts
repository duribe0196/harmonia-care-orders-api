import { IOrderProduct } from "../db/models/order";
import Product from "../db/models/product";
import ShoppingCart from "./ShoppingCart";
import { MongooseError } from "mongoose";
import User from "../db/models/user";

interface IAddProductToOrderArgs {
  product: IOrderProduct;
  userSub?: string;
  sessionId: string;
}

export default async function addProductsToOrder(
  args: IAddProductToOrderArgs,
): Promise<{ body: string; statusCode: number }> {
  const { product, userSub, sessionId } = args;
  try {
    let user;
    console.log(
      `Add product to order - init new order with product ${product.productId.toString()}`,
    );
    if (userSub) {
      console.log(
        `Add product to order - looking for user with sub ${userSub}`,
      );
      user = await User.findOne({ sub: userSub });
    }
    console.log(
      `Add product to order - looking for product ${product.productId.toString()}`,
    );
    const productFound = await Product.findById(product.productId);
    if (!productFound) {
      console.error(
        `Add product to order - No product found ${product.productId.toString()}`,
      );
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }
    const requestorMessage = user?.id
      ? "user id: " + user?.id
      : "session id: " + sessionId;
    console.log(`Add product to order - getting order for ${requestorMessage}`);
    const newShoppingCart = new ShoppingCart(user?.id || null, sessionId);

    console.log(
      `Add product to order - adding product for order - for ${requestorMessage}`,
    );
    const updatedCart = await newShoppingCart.addProduct(
      product.productId,
      product.quantity,
    );
    console.log(
      `Add product to order - product added for order - for ${requestorMessage}`,
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
