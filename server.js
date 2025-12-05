const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const app = express();

// ======================
//  CORS + JSON
// ======================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// ======================
//  STATIC FILE
//  Cho phép mở ảnh trực tiếp qua URL
//  Ví dụ: http://localhost:3000/uploads/ProjectA/abc.png
// ======================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
//  MULTER STORAGE
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.params.folder;
    const uploadPath = path.join(__dirname, "uploads", folder);

    // Tự động tạo folder nếu chưa có
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

// ======================
//  UPLOAD FILE
// ======================
app.post("/upload/:folder", upload.single("file"), (req, res) => {
  const folder = req.params.folder;

  return res.json({
    message: "Upload thành công",
    file: {
      name: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `${req.protocol}://${req.get("host")}/uploads/${folder}/${
        req.file.filename
      }`,
    },
  });
});

// ======================
//  LẤY DANH SÁCH FILE TRONG FOLDER
// ======================
app.get("/files/:folder", (req, res) => {
  const folder = req.params.folder;
  const folderPath = path.join(__dirname, "uploads", folder);

  if (!fs.existsSync(folderPath)) return res.json([]);

  const files = fs.readdirSync(folderPath).map((filename) => {
    const filePath = path.join(folderPath, filename);
    const stat = fs.statSync(filePath);

    return {
      name: filename,
      size: stat.size,
      url: `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`,
    };
  });

  return res.json(files);
});

// ======================
//  XÓA FILE
// ======================
app.delete("/delete/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, "uploads", folder, filename);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: "Không tìm thấy file" });

  fs.unlinkSync(filePath);

  return res.json({ message: "Xóa file thành công" });
});

// ======================
//  SWAGGER
// ======================
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Upload API",
    version: "1.0.0",
  },
  paths: {
    "/upload/{folder}": {
      post: {
        summary: "Upload file vào folder",
        parameters: [
          {
            name: "folder",
            in: "path",
            required: true,
            description: "Tên folder (ProjectA, ProjectB...)",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Upload thành công" } },
      },
    },

    "/files/{folder}": {
      get: {
        summary: "Lấy danh sách file",
        parameters: [
          {
            name: "folder",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Danh sách file" } },
      },
    },

    "/delete/{folder}/{filename}": {
      delete: {
        summary: "Xóa file",
        parameters: [
          {
            name: "folder",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "filename",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Xóa thành công" } },
      },
    },
  },
};

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ======================
app.listen(3000, () =>
  console.log("🚀 Server chạy tại: http://localhost:3000/swagger")
);
