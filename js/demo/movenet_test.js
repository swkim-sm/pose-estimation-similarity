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

// This is for multi pose 
// const detectorConfig = {
// modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
// enableTracking: true,
// trackerType: poseDetection.TrackerType.BoundingBox
// };

// called automatically when the page is loaded
window.onload = async function () {
    // detect poses
    detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

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
    // var context = canvasWebcam.getContext('2d').drawImage(webcam, 0, 0, canvasWebcam.width, canvasWebcam.height);
    // webcamPose = await detector.estimatePoses(canvasWebcam);
    const webcamPose = await detector.estimatePoses(canvasWebcam);
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
