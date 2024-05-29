import {IOrderProduct} from "../db/models/order";
import Product from "../db/models/product";
import ShoppingCart from "./ShoppingCart";
import {MongooseError} from "mongoose";
import User from "../db/models/user";

interface IInitOrderArgs {
  product: IOrderProduct;
  userSub?: string;
  sessionId: string;
}

export default async function addProductsToOrder(
  args: IInitOrderArgs,
): Promise<{ body: string; statusCode: number; sessionId?: string; }> {
  const {
    product,
    userSub,
    sessionId,
  } = args;
  console.log("Init order - init new order with product", product.productId);

  try {
    const user = await User.findOne({sub: userSub})
    const productFound = await Product.findById(product.productId)
    if (!productFound) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }
    const newShoppingCart = new ShoppingCart(user?.id, sessionId);
    const updatedCart = await newShoppingCart.addProduct(product.productId, product.quantity)
    return {
      statusCode: 200,
      body: JSON.stringify(updatedCart),
      sessionId: sessionId
    };
  } catch (e: unknown) {
    if(e instanceof MongooseError){
        console.error(e)
        return {
          statusCode: 500,
          body: JSON.stringify({ message: "Error updating order" }),
        };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Something went wrong" }),
    }

  }
}