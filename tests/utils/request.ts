import supertest from "supertest";
import app from "../../src/app";
import {SuperAgentRequest} from "superagent";


export const request = () => {
  return supertest(app);
}

export const withJsonHeader = <Req extends SuperAgentRequest> (request: Req): Req => {
  return request.set("Accept", "application/json")
}

export const withAuthToken = <Req extends SuperAgentRequest> (request: Req, token: string): Req => {
  return request.set("Authorization", `Bearer ${token}`);
}
