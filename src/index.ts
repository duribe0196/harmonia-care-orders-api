import { APIGatewayEvent, Context, Callback } from "aws-lambda";
import { handleHttpRequests } from "./handlers";

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
): Promise<any> => {
  return await handleHttpRequests(event, context, callback);
};
