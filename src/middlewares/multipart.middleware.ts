import multer from "multer";
import { orderedUuid } from "../utils/uuid";
import config from "../config";
import fs from "fs";

const multiPart = () => {
  const tmpDir = config.storage.tmpDir;

  const tmpStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
      const fileName = orderedUuid();
      const fileExtension = file.originalname.split(".").pop();
      cb(null, `${fileName}.${fileExtension}`);
    },
  });

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const upload = multer({
    storage: tmpStorage,
  });

  return upload.any();
};

export default multiPart;
