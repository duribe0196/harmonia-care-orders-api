import mongoose, { Document, Schema } from "mongoose";

export interface IOrderProduct {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export enum OrderStatus {
  PENDING = "pending",
  CHECKOUT = "checkout",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface IOrder {
  userId: mongoose.Schema.Types.ObjectId | null;
  sessionId: string | null;
  products: IOrderProduct[];
  statusHistory: {
    status: OrderStatus;
    date: Date;
    updatedBy?: mongoose.Schema.Types.ObjectId;
  }[];
  orderStatus: OrderStatus;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
  specialInstructions?: string;
  paymentMethod: string;
  deliveryAddress: string;
  contactNumber: string;
  email: string;
}

export type IOrderDocument = IOrder & Document;

const orderSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(OrderStatus),
          required: true,
        },
        date: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ID of the user who made the change
      },
    ],
    orderStatus: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    totalPrice: { type: Number },
    specialInstructions: { type: String },
    paymentMethod: { type: String },
    deliveryAddress: { type: String },
    contactNumber: { type: String },
    email: { type: String },
  },
  { timestamps: true },
);

orderSchema.pre<IOrderDocument>("save", function (next) {
  if (this.isModified("orderStatus")) {
    const lastStatus = this.statusHistory[this.statusHistory.length - 1];
    if (!lastStatus || lastStatus.status !== this.orderStatus) {
      this.statusHistory.push({
        status: this.orderStatus,
        date: new Date(),
        updatedBy: this.get("_updatedBy"), // Assume this field is set manually before saving
      });
    }
  }
  next();
});

export default mongoose.model<IOrderDocument>("Order", orderSchema);
