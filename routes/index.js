var express = require("express");
var router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");
const e = require("express");
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
  // const params = {
  //   TableName: "S3MetadataTable",
  // };
  try {
    //   const data = await dynamoDBClient.send(new ScanCommand(params));
    //   let items;
    //   if (data.Items) {
    //     console.log("Items retrieved successfully:", data.Items);
    //     items = data.Items.map((el) => {
    //       if (el.filename) {
    //         return el.filename.S;
    //       } else {
    //         return el.filename;
    //       }
    //     });
    //   } else {
    //     console.log("No items found.");
    //     items = [];
    //   }
    res.render("index", { bucket: "cloud-internship-project3-s3", items });
  } catch (err) {
    console.error("Error retrieving items from DynamoDB:", err);
    throw new Error("Could not retrieve items from DynamoDB");
  }
});

router.get("/:filename", async (req, res) => {
  const filename = req.params.filename;
  const command = new GetObjectCommand({
    Bucket: "cloud-internship-project3-s3",
    Key: filename,
  });
  try {
    const response = await client.send(command);
    const str = await response.Body.transformToString();
    res.render("detail", { filename, content: str });
  } catch (err) {
    console.log(err);
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("Không có file để upload");
  }

  let r = (Math.random() + 1).toString(36).substring(7);
  const params = {
    Bucket: "cloud-internship-project3-s3",
    Key: req.file.originalname + r,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  const dynamoDBParams = {
    TableName: "S3MetadataTable",
    Item: {
      id: { S: req.file.originalname },
      filename: { S: req.file.originalname },
      s3Uri: {
        S: `s3://cloud-internship-project3-s3/${req.file.originalname}`,
      },
      uploadTime: { S: new Date().toISOString() },
    },
  };
  try {
    await client.send(new PutObjectCommand(params));
    await ddbDocClient.send(new PutItemCommand(dynamoDBParams));
    res.render("upload", { filename: req.file.originalname });
  } catch (err) {
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).send("Xảy ra lỗi khi upload");
  }
});

module.exports = router;
