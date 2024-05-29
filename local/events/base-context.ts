export const getBaseContext = () => {
  return {
    callbackWaitsForEmptyEventLoop: true,
    functionVersion: "$LATEST",
    functionName: "MyFunction",
    memoryLimitInMB: "128",
    logGroupName: "/aws/lambda/MyFunction",
    logStreamName: "2020/04/12/[$LATEST]abcdef1234567890abcdef1234567890",
    invokedFunctionArn:
      "arn:aws:lambda:us-east-1:123456789012:function:MyFunction",
    awsRequestId: "abcdef-12345-uuid",
    identity: {
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
    },
    clientContext: null,
    getRemainingTimeInMillis: function () {
      // returns the remaining execution time till the function will be terminated
    },
  };
};
