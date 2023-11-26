import { ComponentCollection, FunctionFactory, Serializer } from "survey-core";
import {
  address,
  country,
  dateOfBirth,
  role,
} from "@camp-registration/common/form/questions";
import {
  htmlDate,
  isAdult,
  isMinor,
  subtractYears,
} from "@camp-registration/common/form/functions";
import { campDataType } from "@camp-registration/common/form/property";

ComponentCollection.Instance.add(address);
ComponentCollection.Instance.add(country);
ComponentCollection.Instance.add(dateOfBirth);
ComponentCollection.Instance.add(role);

FunctionFactory.Instance.register("isMinor", isMinor, false);
FunctionFactory.Instance.register("isAdult", isAdult, false);
FunctionFactory.Instance.register("subtractYears", subtractYears, false);
FunctionFactory.Instance.register("htmlDate", htmlDate, false);

Serializer.addProperty("question", campDataType);

Serializer.getProperty("file", "storeDataAsText").visible = false;
Serializer.getProperty("file", "storeDataAsText").defaultValue = false;
