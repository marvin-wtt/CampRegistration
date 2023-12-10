import { ComponentCollection, Serializer, FunctionFactory } from "survey-core";
import { init } from "@camp-registration/common/form";

// Static components are somehow not the same for Node.js
export const initSurveyJS = () => {
  init(ComponentCollection.Instance, FunctionFactory.Instance, Serializer);
};
