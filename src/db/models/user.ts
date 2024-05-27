import { Schema, model, Document } from "mongoose";

export enum UserRole {
  OWNER = "owner",
  USER = "user",
}

interface IUser {
  sub: string;
  name: string;
  contactNumber: string;
  email: string;
  address: string;
  role: UserRole;
}

type IUserDocument = IUser & Document;

const userSchema: Schema = new Schema(
  {
    name: { type: String },
    contactNumber: { type: String, unique: true },
    email: { type: String, unique: true, required: true },
    address: { type: String },
    role: { type: String, required: true, enum: Object.values(UserRole) },
    sub: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

const User = model<IUserDocument>("User", userSchema);

export default User;
