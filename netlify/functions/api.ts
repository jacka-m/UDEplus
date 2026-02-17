import serverless from "serverless-http";
import { createServer } from "../../server";

const app = createServer();

export const handler = serverless(app, {
  request(req) {
    // When Netlify routes /api/auth/login → /.netlify/functions/api/auth/login,
    // it strips the /api prefix. Express routes are all registered as /api/...,
    // so we restore that prefix here before Express processes the request.
    req.url = "/api" + req.url;
  },
});