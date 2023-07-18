import { catchRequestAsync } from "../utils/catchAsync";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { resource } from "../resources/resource";
import { bedService } from "../services";
import { bedResource } from "../resources";

const update = catchRequestAsync(async (req, res) => {
  const { bedId } = req.params;
  const data = req.body;
  const bed = await bedService.updateBedById(bedId, data.registration_id);
  if (bed == null) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Update without response."
    );
  }
  res.json(resource(bedResource(bed)));
});

export default {
  update,
};
