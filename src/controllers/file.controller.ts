import { catchRequestAsync } from "@/utils/catchAsync";
import { routeModel } from "@/utils/verifyModel";
import { fileService } from "@/services";

const show = catchRequestAsync(async (req, res) => {
  const file = routeModel(req.models.file);

  const fileStream = await fileService.getFileStream(file);

  // Set response headers for image display
  res.setHeader("Content-Type", file.type); // Adjust content type as needed

  fileStream.pipe(res); // Pipe the file stream to the response
});

export default {
  show,
};
