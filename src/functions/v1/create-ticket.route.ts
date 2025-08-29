import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import { ok, withHttp } from "../../shared";

export const createTicketHandler = withHttp(
  async (
    req: HttpRequest,
    ctx: InvocationContext
  ): Promise<HttpResponseInit> => {
    const ticketData = req.body;

    // Here you would typically call a service to create the ticket
    // For this example, we'll just return the received data
    return ok(ctx, ticketData);
  }
);

app.http("tickets-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "v1/tickets",
  handler: createTicketHandler,
});
