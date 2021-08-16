// varients for video
var video = document.getElementById("video");
var canvasVideo = document.createElement('canvas');

// varients for webcam
var webcam = document.getElementById('webcam');
var canvasWebcam = document.createElement('canvas');


// canvas size
canvasWebcam.width = webcam.offsetWidth;
canvasWebcam.height = webcam.offsetHeight;
canvasVideo.width = video.offsetWidth;
canvasVideo.height = video.offsetHeight;

// varients for detecting 17 keypoints of pose in frame
// let detectorConfig, detector, context;
let detectorConfig, detector;
var videoPose, webcamPose;

console.log(canvasVideo.width, canvasVideo.height)


// video play and pause
function playVideo() { 
    video.play();
    window.requestAnimationFrame(captureVideo);
  } 
  function pauseVideo() { 
    video.pause(); 
  } 


// called automatically when the page is loaded
window.onload = async function () {
    // detect poses
    // detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
    // detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig); 
    
    // feed webcam
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
        console.log('webcam works!')
        console.log(stream)
        webcam.srcObject = stream;
    })
    .catch(function (err0r) {
        console.log("Something went wrong!");
    });

    window.requestAnimationFrame(capture);
}


async function capture() {
    // context 용도 다시 찾기
    var context = canvasWebcam.getContext('2d').drawImage(webcam, 0, 0, canvasWebcam.width, canvasWebcam.height);
    webcamPose = await detector.estimatePoses(canvasWebcam);
    console.log("webcam detect : ", webcamPose);
    window.requestAnimationFrame(capture);
}

async function captureVideo() {
    // context 용도 다시 찾기
    var context = canvasVideo.getContext('2d').drawImage(video, 0, 0, canvasVideo.width, canvasVideo.height);
    videoPose = await detector.estimatePoses(canvasVideo);
    // console.log("video detect : ", videoPose[0].keypoints);
    // var weightedDistance = pns.poseSimilarity(webcamPose[0].keypoints, videoPose[0].keypoints);
    var weightedDistance = poseSimilarity(webcamPose[0].keypoints, videoPose[0].keypoints);

    console.log(weightedDistance);
    window.requestAnimationFrame(captureVideo);
}

// function weightedDistanceMatchin(vectorPose1XY, vectorPose2XY, vectorConfidences){
//     const summation1 = 1/vectorConfidences[vectorConfidences.length -1];
//     var summation2 = 0;

//     for (var i = 0; i<vectorPose1XY.length; i++){
//         var confIndex = Math.floor(i/2); 
//         summation2 += vectorConfidences[confIndex] * Math.abs(vectorPose1XY[i] - vectorPose2XY[i]);
//     }
//     return summation1 * summation2;
// }

// function vectorizeAndNormalize(pose, options){
//     var _a = convertPoseToVector(pose, options.customWeight);

//     vectorPoseXY = _a[0];
//     vectorPoseTransform = _a[1];
//     vectorPoseConfidences = _a[2];

//     vectorPoseXY = scaleAndTranslate(vectorPoseXY, vectorPoseTransform);

//     vectorPoseXY = L2Normalization(vectorPoseXY);

//     return [vectorPoseXY, vectorPoseConfidences];
// }

// function convertPoseToVectors(pose, weightOption) {
//     var vectorPoseXY = [];

//     var translateX = Number.POSITIVE_INFINITY;
//     var translateY = Number.POSITIVE_INFINITY;
//     var scaler = Number.NEGATIVE_INFINITY;
    
//     var vectorScoresSum = 0;
//     var vectorScores = [];

//     // get weightOption if exists
//     var mode, scores;
//     if (weightOption) {
//         mode = weightOption.mode;
//         if (!mode || typeof mode !== 'string')
//             throw new TypeError("[Bad customWeight option] A mode must be specified and should be either 'multiply', 'replace' or 'add'.");
//         scores = weightOption.scores;
//         if (typeof scores !== 'object' && !Array.isArray(scores))
//             throw new TypeError("[Bad customWeight option] scores must be Object or Number[].\n      Please refer the document https://github.com/freshsomebody/posenet-similarity to set it correctly.");
//     }
//     pose.keypoints.forEach(function (point, index) {
//         var x = point.position.x;
//         var y = point.position.y;
//         vectorPoseXY.push(x, y);
//         translateX = Math.min(translateX, x);
//         translateY = Math.min(translateY, y);
//         scaler = Math.max(scaler, Math.max(x, y));
//         var score = point.score;
//         // modify original score according to the weightOption
//         if (mode && scores) {
//             var scoreModifier = false;
//             // try to get scores from the weightOption
//             if (scores[point.part] || scores[point.part] === 0)
//                 scoreModifier = scores[point.part];
//             if (scores[index] || scores[index] === 0)
//                 scoreModifier = scores[index];
//             // manipulate the original score
//             if ((scoreModifier || scoreModifier === 0) && typeof scoreModifier === 'number') {
//                 switch (mode) {
//                     case 'multiply':
//                         score *= scoreModifier;
//                         break;
//                     case 'replace':
//                         score = scoreModifier;
//                         break;
//                     case 'add':
//                         score += scoreModifier;
//                         break;
//                     default:
//                         throw new Error("[Bad customWeight option] A mode must be specified and should be either 'multiply', 'replace' or 'add'");
//                 }
//             }
//         }
//         vectorScoresSum += score;
//         vectorScores.push(score);
//     });
//     vectorScores.push(vectorScoresSum);
//     return [
//         vectorPoseXY,
//         [translateX / scaler, translateY / scaler, scaler],
//         vectorScores
//     ];
// }

// function scaleAndTranslate(vectorPoseXY, transformValues) {
//     var transX = transformValues[0], transY = transformValues[1], scaler = transformValues[2];
//     return vectorPoseXY.map(function (position, index) {
//         return (index % 2 === 0 ?
//             position / scaler - transX :
//             position / scaler - transY);
//     });
// }

// function L2Normalization(vectorPoseXY) {
//     var absVectorPoseXY = 0;
//     vectorPoseXY.forEach(function (position) {
//         absVectorPoseXY += Math.pow(position, 2);
//     });
//     absVectorPoseXY = Math.sqrt(absVectorPoseXY);
//     return vectorPoseXY.map(function (position) {
//         return position / absVectorPoseXY;
//     });
// }

// function poseSimilarity(pose1, pose2, overridenOptions) {
//     // check inputted poses
//     if (!pose1 || !pose1.keypoints ||
//         !pose2 || !pose2.keypoints) {
//         throw new Error('[Bad pose parameters] Please check your pose objects again.');
//     }
//     if (pose1.keypoints.length === 0 || pose2.keypoints.length === 0) {
//         throw new Error('[Bad pose parameters] Found pose object(s) with empty keypoint.');
//     }
//     if (pose1.keypoints.length !== pose2.keypoints.length) {
//         throw new Error('[Bad pose parameters] The keypoint lengths of the two pose objects are not the same.');
//     }
//     // merge options
//     var defaultOptions = {
//         strategy: 'weightedDistance'
//     };
//     var options = Object.assign({}, defaultOptions, overridenOptions);
//     var _a = vectorizeAndNormalize(pose1, options), vectorPose1XY = _a[0], vectorPose1Scores = _a[1];
//     var vectorPose2XY = vectorizeAndNormalize(pose2, options)[0];
//     // execute strategy
//     // if strategy is given by the string form
//     if (typeof options.strategy === 'string') {
//         switch (options.strategy) {
//             case 'cosineSimilarity':
//                 return cosineSimilarity(vectorPose1XY, vectorPose2XY);
//             case 'cosineDistance':
//                 return cosineDistanceMatching(vectorPose1XY, vectorPose2XY);
//             case 'weightedDistance':
//                 return weightedDistanceMatching(vectorPose1XY, vectorPose2XY, vectorPose1Scores);
//             default:
//                 throw new Error("[Bad strategy option] It should be either 'cosineSimilarity', 'cosineDistance' or 'weightedDistance' (default).");
//         }
//         // if strategy is given by a custom function
//     }
//     else if (typeof options.strategy === 'function') {
//         return options.strategy(vectorPose1XY, vectorPose2XY, vectorPose1Scores);
//     }
//     else {
//         throw new TypeError("[Bad strategy option] It only accepts string or function types of values.");
//     }
// }