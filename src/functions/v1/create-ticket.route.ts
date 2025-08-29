import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import { ok, withHttp } from "../../shared";
import { TicketService } from "../../services/ticket.service";
import { TicketCreateSchema } from "../../schemas/ticket.schema";
import { parse } from "path";
import { parseJson } from "../../shared/request";

export const createTicketHandler = withHttp(
  async (
    req: HttpRequest,
    ctx: InvocationContext
  ): Promise<HttpResponseInit> => {
    const body = await parseJson(req, TicketCreateSchema);

    const ticketService = await TicketService.createInstance();
    const ticket = await ticketService.createTicket(body);
    return ok(ctx, ticket);
  }
);

app.http("tickets-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "v1/tickets",
  handler: createTicketHandler,
});
