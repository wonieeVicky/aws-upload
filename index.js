const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();

// context 안에는 함수 실행에 관한 정보가 포함
exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; // nodebird-vicky
  const Key = event.Records[0].s3.object.key; // folder + filename
  const filename = Key.split("/")[Key.split("/").length - 1]; // filename
  const ext = Key.split(".")[Key.split(".").length - 1]; // 확장자(png, jpg ..)
  const requiredFormat = ext === "jpg" ? "jpeg" : ext; // sharp에서는 jpg 대신 jpeg 사용한다.
  console.log("name", filename, "ext", ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise(); // Buffer로 가져오기 - s3 설정 권한 열어준 이유(getObject)
    console.log("original", s3Object.Body.length); // 사진 용량
    const resizedImage = await sharp(s3Object.Body) // 리사이징
      .resize(400, 400, { fit: "inside" })
      .toFormat(requiredFormat)
      .toBuffer(); // 16진수 데이터(Buffer 데이터)로 반환된다.
    await s3
      .putObject({
        // thumb 폴더에 저장 - s3 설정 권한 열어준 이유(putObject)
        Bucket,
        Key: `thumb/${filename}`, // original/vicky.png 20mb -> thumb/vicky.png 4mb
        Body: resizedImage,
      })
      .promise();
    console.log("put", resizedImage.length);
    return callback(null, `thumb/${filename}`); // 에러 발생 시 첫번째 인수 사용, 성공 시 두번째 인수 실행 - http 로 람다 호출 시 callback 사용
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
