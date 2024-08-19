var express = require("express");
var router = express.Router();
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
/* GET home page. */

const client = new S3Client({
  region: "ap-northeast-1",
});

router.get("/", async (req, res, next) => {
  const filename = req.query.filename;
  const command = new GetObjectCommand({
    Bucket: "cloud-internship-project3-s3",
    Key: filename,
  });
  try {
    const response = await client.send(command);
    const str = await response.Body.transformToString();
    console.log(str);
  } catch (err) {
    console.log(err);
  }
  res.render("index", { title: "Express" });
});

module.exports = router;
