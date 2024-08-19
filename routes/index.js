var express = require("express");
var router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutItemCommand } = require("@aws-sdk/client-dynamodb");
const {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");
/* GET home page. */

const client = new S3Client({
  region: "ap-northeast-1",
  credentials: null,
});

const dynamoDBClient = new DynamoDBClient({
  region: "ap-northeast-1", // e.g., 'us-east-1'
  credentials: null,
});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", async (req, res, next) => {
  // const filename = req.query.filename;
  // const command = new GetObjectCommand({
  //   Bucket: "cloud-internship-project3-s3",
  //   Key: filename,
  // });
  // try {
  //   const response = await client.send(command);
  //   const str = await response.Body.transformToString();
  //   console.log(str);
  // } catch (err) {
  //   console.log(err);
  // }
  res.render("index", { bucket: "cloud-internship-project3-s3" });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  console.log(req.file);
  console.log(req.file.originalname);
  if (!req.file) {
    return res.status(400).send("Không có file để upload");
  }

  const params = {
    Bucket: "cloud-internship-project3-s3",
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  const dynamoDBParams = {
    TableName: "S3MetadataTable",
    Item: {
      id: { S: req.file.originalname },
      originalName: { S: req.file.originalname },
      s3Uri: `s3://cloud-internship-project3-s3/${req.file.originalname}`,
      uploadTime: { S: new Date().toISOString() },
    },
  };
  try {
    await client.send(new PutObjectCommand(params));
    await ddbDocClient.send(new PutItemCommand(dynamoDBParams));
    res.render("upload", { filename: req.file.originalname });
  } catch (err) {
    console.error(err);
    res.status(500).send("Xảy ra lỗi khi upload");
  }
});

module.exports = router;
