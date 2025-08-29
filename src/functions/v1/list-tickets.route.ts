import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import { ok, withHttp } from "../../shared";

export const listTicketsHandler = withHttp(
  async (
    req: HttpRequest,
    ctx: InvocationContext
  ): Promise<HttpResponseInit> => {
    // Here you would typically call a service to create the ticket
    // For this example, we'll just return the received data
    return ok(ctx, {});
  }
);

app.http("tickets-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "v1/tickets",
  handler: listTicketsHandler,
});
