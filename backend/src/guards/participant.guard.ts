import { Request } from "express";
import { routeModel } from "utils/verifyModel";

const participant = async (req: Request): Promise<boolean | string> => {
  const registration = routeModel(req.models.registration);

  // TODO Check, if the auth user is the participant
  return false;
};

export default participant;
