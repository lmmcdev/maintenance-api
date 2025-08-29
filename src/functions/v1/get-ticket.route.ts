// src/functions/v1/get-ticket.route.ts
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { TicketService } from "../../services/ticket.service";
import { ok, withHttp, idParamSchema } from "../../shared";

export const getTicketById = withHttp(
  async (
    req: HttpRequest,
    ctx: InvocationContext
  ): Promise<HttpResponseInit> => {
    const { id } = idParamSchema.parse((req as any).params ?? {});

    const ticketService = await TicketService.createInstance();
    const ticket = await ticketService.getTicket(id);
    return ok(ctx, ticket);
  }
);

app.http("tickets-getById", {
  methods: ["GET"],
  route: "v1/tickets/{id}",
  authLevel: "function",
  handler: getTicketById,
});
