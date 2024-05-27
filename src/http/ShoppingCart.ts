import mongoose from "mongoose";
import Order, {IOrderDocument, IOrderProduct, OrderStatus} from "../db/models/order";
import Product from "../db/models/product";

class ShoppingCart {
  private readonly userId: mongoose.Schema.Types.ObjectId | null;
  private readonly sessionId: string;

  constructor(userId: mongoose.Schema.Types.ObjectId | null, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
  }

  private async initializeCart(): Promise<IOrderDocument> {
    let cart: IOrderDocument | null = null;
    if (this.userId) {
      cart = await Order.findOne({ userId: this.userId, orderStatus: { $in: [OrderStatus.PENDING, OrderStatus.CHECKOUT] } });
    } else if (this.sessionId) {
      cart = await Order.findOne({ sessionId: this.sessionId, orderStatus: { $in: [OrderStatus.PENDING, OrderStatus.CHECKOUT] } });
    }

    if (!cart) {
      cart = new Order({
        userId: this.userId,
        sessionId: this.sessionId,
        products: [],
        statusHistory: [{
          status: OrderStatus.PENDING,
          date: new Date(),
        }],
        orderStatus: OrderStatus.PENDING,
        totalPrice: 0,
        paymentMethod: '',
        deliveryAddress: '',
      });
      await cart.save();
    }
    return cart;
  }

  async addProduct(productId: mongoose.Types.ObjectId, quantity: number): Promise<IOrderDocument> {
    const cart = await this.initializeCart();
    if (cart.orderStatus === OrderStatus.COMPLETED || cart.orderStatus === OrderStatus.CANCELLED) {
      throw new Error("Cannot add products to a completed or cancelled order");
    }
    const existingProduct = cart.products.find(p => p.productId.equals(productId));
    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ productId, quantity });
    }
    cart.totalPrice = await this.calculateTotalPrice(cart.products);
    await cart.save();
    return cart;
  }

  async removeProduct(productId: mongoose.Types.ObjectId): Promise<IOrderDocument> {
    const cart = await this.initializeCart();
    if (cart.orderStatus === OrderStatus.COMPLETED || cart.orderStatus === OrderStatus.CANCELLED) {
      throw new Error("Cannot remove products from a completed or cancelled order");
    }
    cart.products = cart.products.filter(p => !p.productId.equals(productId));
    cart.totalPrice = await this.calculateTotalPrice(cart.products);
    await cart.save();
    return cart;
  }

  async updateProductQuantity(productId: mongoose.Types.ObjectId, quantity: number): Promise<IOrderDocument> {
    const cart = await this.initializeCart();
    if (cart.orderStatus === OrderStatus.COMPLETED || cart.orderStatus === OrderStatus.CANCELLED) {
      throw new Error("Cannot update product quantities in a completed or cancelled order");
    }
    const product = cart.products.find(p => p.productId.equals(productId));
    if (product) {
      product.quantity = quantity;
    }
    cart.totalPrice = await this.calculateTotalPrice(cart.products);
    await cart.save();
    return cart;
  }

  async getProducts(): Promise<IOrderProduct[]> {
    const cart = await this.initializeCart();
    return cart.products;
  }

  async checkout(paymentMethod: string, deliveryAddress: string, specialInstructions?: string): Promise<IOrderDocument> {
    const cart = await this.initializeCart();
    if (cart.orderStatus !== OrderStatus.PENDING) {
      throw new Error("Only pending orders can be checked out");
    }
    cart.paymentMethod = paymentMethod;
    cart.deliveryAddress = deliveryAddress;
    cart.specialInstructions = specialInstructions;
    cart.orderStatus = OrderStatus.CHECKOUT;
    await cart.save();
    return cart;
  }

  async completeOrder(): Promise<IOrderDocument> {
    const cart = await this.initializeCart();
    if (cart.orderStatus !== OrderStatus.CHECKOUT) {
      throw new Error("Only orders in checkout can be completed");
    }
    cart.orderStatus = OrderStatus.COMPLETED;
    await cart.save();
    return cart;
  }

  async cancelOrder(): Promise<IOrderDocument> {
    const cart = await this.initializeCart();
    if (cart.orderStatus === OrderStatus.COMPLETED || cart.orderStatus === OrderStatus.CANCELLED) {
      throw new Error("Cannot cancel a completed or already cancelled order");
    }
    cart.orderStatus = OrderStatus.CANCELLED;
    await cart.save();
    return cart;
  }

  private async calculateTotalPrice(products: IOrderProduct[]): Promise<number> {
    let totalPrice = 0;
    for (const product of products) {
      const productDetails = await Product.findById(product.productId);
      if (productDetails) {
        totalPrice += productDetails.price.amount * product.quantity;
      }
    }
    return totalPrice;
  }

  async getOrderDetails(): Promise<IOrderDocument> {
    return await this.initializeCart();
  }
}

export default ShoppingCart;
