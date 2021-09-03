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
var weightedDistance;

console.log(canvasVideo.width, canvasVideo.height)
var compareFlag = false;

// video play and pause
function playVideo() { 
    video.play();
    compareFlag = true;
    window.requestAnimationFrame(captureVideo);
  } 
  function pauseVideo() { 
    video.pause(); 
    compareFlag = false;
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

    // distance test code
    // var img1 = document.getElementById("compare1");
    // var img2 = document.getElementById("compare2");
    // var pose1 = await detector.estimatePoses(img1);
    // var pose2 = await detector.estimatePoses(img2);

    // if(pose1.length > 0 && pose2.length > 0){
    //     var testweightedDistance = poseSimilarity(pose1[0].keypoints, pose2[0].keypoints);
    //     console.log("distance : ", testweightedDistance);
    // }


    // window.requestAnimationFrame(capture);
}



async function capture() {
    // context 용도 다시 찾기
    var context = canvasWebcam.getContext('2d').drawImage(webcam, 0, 0, canvasWebcam.width, canvasWebcam.height);
    webcamPose = await detector.estimatePoses(canvasWebcam);

    // console.log("webcam detect : ", webcamPose);
    // window.requestAnimationFrame(capture);

    // if( webcamPose.length > 0){
    //     weightedDistance = poseSimilarity(webcamPose[0].keypoints, webcamPose[0].keypoints);
    //     console.log("distance : ", weightedDistance);
    // // }
    // if (compareFlag){
    //     console.log("webcam detect : ", webcamPose[0].keypoints);
    //     window.requestAnimationFrame(capture);
    // }
}

// const WeightOption = {
//     mode: 'multiply',
//     scores: Object | number[]
// };
// const Options = {
//     strategy: 'weightedDistance',
//     customWeight: WeightOption
// };

async function captureVideo() {
    // context 용도 다시 찾기
    var context = canvasVideo.getContext('2d').drawImage(video, 0, 0, canvasVideo.width, canvasVideo.height);
    videoPose = await detector.estimatePoses(canvasVideo);
    // console.log("video detect : ", videoPose[0].keypoints);

    // if(videoPose.length > 0 && webcamPose.length > 0){
    //     weightedDistance = poseSimilarity(webcamPose[0].keypoints, videoPose[0].keypoints);
    //     console.log("distance : ", weightedDistance);
    // }
    // window.requestAnimationFrame(captureVideo);

    if(compareFlag){
        window.requestAnimationFrame(capture);
        window.requestAnimationFrame(captureVideo);
        console.log("detect : ", videoPose[0].keypoints, webcamPose[0].keypoints);
        if(videoPose.length > 0 && webcamPose.length > 0){
            weightedDistance = poseSimilarity(webcamPose[0].keypoints, videoPose[0].keypoints);
            console.log("distance : ", weightedDistance);
        }
    }
}

function weightedDistanceMatching(vectorPose1XY, vectorPose2XY, vectorConfidences){
    const summation1 = 1/vectorConfidences[vectorConfidences.length -1];
    var summation2 = 0;

    for (var i = 0; i<vectorPose1XY.length; i++){
        var confIndex = Math.floor(i/2); 
        summation2 += vectorConfidences[confIndex] * Math.abs(vectorPose1XY[i] - vectorPose2XY[i]);
    }
    return summation1 * summation2;
}

function convertPoseToVector(pose) {
    var vectorPoseXY = [];

    var translateX = Number.POSITIVE_INFINITY;
    var translateY = Number.POSITIVE_INFINITY;
    var scaler = Number.NEGATIVE_INFINITY;
    
    var vectorScoresSum = 0;
    var vectorScores = [];

    // get weightOption if exists
    var mode = 'add'
    var scores = Array;

    pose.forEach(function (point, index) {
        var x = point.x;
        var y = point.y;
        vectorPoseXY.push(x, y);
        translateX = Math.min(translateX, x);
        translateY = Math.min(translateY, y);
        scaler = Math.max(scaler, Math.max(x, y));
        var score = point.score;
        // modify original score according to the weightOption
        if (mode && scores) {
            var scoreModifier = false;
            // try to get scores from the weightOption
            if (scores[point.name] || scores[point.name] === 0)
                scoreModifier = scores[point.name];
            if (scores[index] || scores[index] === 0)
                scoreModifier = scores[index];
            // manipulate the original score
            if ((scoreModifier || scoreModifier === 0) && typeof scoreModifier === 'number') {
                switch (mode) {
                    case 'multiply':
                        score *= scoreModifier;
                        break;
                    case 'replace':
                        score = scoreModifier;
                        break;
                    case 'add':
                        score += scoreModifier;
                        break;
                    default:
                        throw new Error("[Bad customWeight option] A mode must be specified and should be either 'multiply', 'replace' or 'add'");
                }
            }
        }
        vectorScoresSum += score;
        vectorScores.push(score);
    });
    vectorScores.push(vectorScoresSum);
    return [
        vectorPoseXY,
        [translateX / scaler, translateY / scaler, scaler],
        vectorScores
    ];
}

function scaleAndTranslate(vectorPoseXY, transformValues) {
    var transX = transformValues[0], transY = transformValues[1], scaler = transformValues[2];
    return vectorPoseXY.map(function (position, index) {
        return (index % 2 === 0 ?
            position / scaler - transX :
            position / scaler - transY);
    });
}

function L2Normalization(vectorPoseXY) {
    var absVectorPoseXY = 0;
    vectorPoseXY.forEach(function (position) {
        absVectorPoseXY += Math.pow(position, 2);
    });
    absVectorPoseXY = Math.sqrt(absVectorPoseXY);
    return vectorPoseXY.map(function (position) {
        return position / absVectorPoseXY;s
    });
}
function vectorizeAndNormalize(pose){
    var _a = convertPoseToVector(pose);

    vectorPoseXY = _a[0];
    vectorPoseTransform = _a[1];
    vectorPoseConfidences = _a[2];

    vectorPoseXY = scaleAndTranslate(vectorPoseXY, vectorPoseTransform);

    vectorPoseXY = L2Normalization(vectorPoseXY);

    return [vectorPoseXY, vectorPoseConfidences];
}

function poseSimilarity(pose1, pose2) {
    // merge options
    var _a = vectorizeAndNormalize(pose1)
    vectorPose1XY = _a[0];
    vectorPose1Scores = _a[1];

    var vectorPose2XY = vectorizeAndNormalize(pose2)[0];
    console.log("compare", vectorPose1XY, vectorPose2XY)
    // execute strategy
    // if strategy is given by the string form
    return weightedDistanceMatching(vectorPose1XY, vectorPose2XY, vectorPose1Scores);
}