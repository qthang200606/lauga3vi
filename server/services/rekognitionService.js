const {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  CreateCollectionCommand,
  DescribeCollectionCommand,
  CreateUserCommand,
  IndexFacesCommand,
  AssociateFacesCommand,
  ListFacesCommand,
  DeleteFacesCommand,
  DeleteUserCommand,
  SearchUsersByImageCommand,
} = require("@aws-sdk/client-rekognition");

const REGION = process.env.AWS_REGION || "ap-southeast-1";

const COLLECTION_ID =
  process.env.AWS_REKOGNITION_COLLECTION ||
  "lauga3vi-employees";

const FACE_MATCH_THRESHOLD = Number(
  process.env.AWS_FACE_MATCH_THRESHOLD || 95
);

const LIVENESS_THRESHOLD = Number(
  process.env.AWS_LIVENESS_THRESHOLD || 90
);

const rekognition = new RekognitionClient({
  region: REGION,
});


// =====================================================
// COLLECTION
// =====================================================

const ensureCollection = async () => {
  try {
    await rekognition.send(
      new DescribeCollectionCommand({
        CollectionId: COLLECTION_ID,
      })
    );

    return COLLECTION_ID;
  } catch (error) {
    if (
      error.name !== "ResourceNotFoundException"
    ) {
      throw error;
    }

    await rekognition.send(
      new CreateCollectionCommand({
        CollectionId: COLLECTION_ID,
      })
    );

    return COLLECTION_ID;
  }
};


// =====================================================
// LIVENESS SESSION
// =====================================================

const createLivenessSession = async () => {
  await ensureCollection();

  const result = await rekognition.send(
    new CreateFaceLivenessSessionCommand({
      Settings: {
        AuditImagesLimit: 0,
      },
    })
  );

  return {
    sessionId: result.SessionId,
    region: REGION,
  };
};


// =====================================================
// GET LIVENESS RESULT
// =====================================================

const getLivenessResult = async (sessionId) => {
  const result = await rekognition.send(
    new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId,
    })
  );

  return result;
};


// =====================================================
// CREATE REKOGNITION USER
// =====================================================

const createRekognitionUser = async (
  rekognitionUserId
) => {
  try {
    await rekognition.send(
      new CreateUserCommand({
        CollectionId: COLLECTION_ID,
        UserId: rekognitionUserId,
      })
    );
  } catch (error) {
    // User đã tồn tại thì không cần tạo lại
    if (error.name !== "ConflictException") {
      throw error;
    }
  }

  return rekognitionUserId;
};


// =====================================================
// ENROLL FACE
// =====================================================

const enrollFace = async ({
  rekognitionUserId,
  imageBytes,
}) => {
  await ensureCollection();

  await createRekognitionUser(
    rekognitionUserId
  );

  const indexResult = await rekognition.send(
    new IndexFacesCommand({
      CollectionId: COLLECTION_ID,

      Image: {
        Bytes: imageBytes,
      },

      ExternalImageId:
        rekognitionUserId,

      MaxFaces: 1,

      QualityFilter: "HIGH",
    })
  );

  if (
    !indexResult.FaceRecords ||
    indexResult.FaceRecords.length !== 1
  ) {
    throw new Error(
      "Không thể đăng ký khuôn mặt. Hình ảnh phải có đúng một khuôn mặt."
    );
  }

  const faceId =
    indexResult.FaceRecords[0].Face?.FaceId;

  if (!faceId) {
    throw new Error(
      "AWS không trả về FaceId."
    );
  }

  await rekognition.send(
    new AssociateFacesCommand({
      CollectionId: COLLECTION_ID,

      UserId: rekognitionUserId,

      FaceIds: [faceId],

      UserMatchThreshold: 90,
    })
  );

  return {
    faceId,
    rekognitionUserId,
  };
};


// =====================================================
// GET EMPLOYEE FACE IDS
// =====================================================

const getEmployeeFaces = async (
  rekognitionUserId
) => {
  const result = await rekognition.send(
    new ListFacesCommand({
      CollectionId: COLLECTION_ID,
      UserId: rekognitionUserId,
      MaxResults: 100,
    })
  );

  return (result.Faces || []).map(
    (face) => face.FaceId
  );
};


// =====================================================
// DELETE EMPLOYEE FACES
// =====================================================

const deleteEmployeeFaces = async (
  rekognitionUserId
) => {
  const faceIds =
    await getEmployeeFaces(
      rekognitionUserId
    );

  if (faceIds.length > 0) {
    await rekognition.send(
      new DeleteFacesCommand({
        CollectionId: COLLECTION_ID,
        FaceIds: faceIds,
      })
    );
  }

  try {
    await rekognition.send(
      new DeleteUserCommand({
        CollectionId: COLLECTION_ID,
        UserId: rekognitionUserId,
      })
    );
  } catch (error) {
    if (
      error.name !==
      "ResourceNotFoundException"
    ) {
      throw error;
    }
  }

  return faceIds;
};


// =====================================================
// VERIFY FACE
// =====================================================

const verifyFace = async ({
  imageBytes,
  expectedRekognitionUserId,
}) => {
  const result = await rekognition.send(
    new SearchUsersByImageCommand({
      CollectionId: COLLECTION_ID,

      Image: {
        Bytes: imageBytes,
      },

      MaxUsers: 5,

      QualityFilter: "HIGH",

      UserMatchThreshold:
        FACE_MATCH_THRESHOLD,
    })
  );

  const matches =
    result.UserMatches || [];

  const matchedUser = matches.find(
    (item) =>
      item.User?.UserId ===
      expectedRekognitionUserId
  );

  if (!matchedUser) {
    return {
      verified: false,
      similarity: 0,
    };
  }

  return {
    verified: true,
    similarity:
      matchedUser.Similarity || 0,
  };
};


module.exports = {
  REGION,
  COLLECTION_ID,
  LIVENESS_THRESHOLD,

  createLivenessSession,
  getLivenessResult,

  enrollFace,
  verifyFace,

  getEmployeeFaces,
  deleteEmployeeFaces,
};