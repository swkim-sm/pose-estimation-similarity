// import '@tensorflow/tfjs-backend-webgl';
// import '@mediapipe/pose';

// import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';

// tfjsWasm.setWasmPaths(
// `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`);

// import * as posedetection from '@tensorflow-models/pose-detection';

import { Camera } from './camera.js';
import { STATE } from './params.js';
import { setupStats } from './stats_panel.js';
import { setBackendAndEnvFlags } from './util.js';


let detector, camera, stats;
let rafId, videoContext;
// let detectorConfig;
// let videoPoses, webcamPoses;
let startInferenceTime, numInferences = 0;
let inferenceTimeSum = 0, lastPanelUpdate = 0;

// varients for video
var video = document.getElementById("video");
var canvasVideo = document.createElement('canvas');

canvasVideo.width = video.offsetWidth;
canvasVideo.height = video.offsetHeight;

// varients for webcam
var webcam = document.getElementById('webcam');
var canvasWebcam = document.createElement('output');

var weightedDistance;
var webcamPoses, videoPoses;


// // canvas size
// canvasWebcam.width = webcam.offsetWidth;
// canvasWebcam.height = webcam.offsetHeight;
// canvasVideo.width = video.offsetWidth;
// canvasVideo.height = video.offsetHeight;

// varients for detecting 17 keypoints of pose in frame
// let detectorConfig, detector, context;

// console.log(canvasVideo.width, canvasVideo.height)


// // video play and pause
// function playVideo() {
//     video.play();
//     window.requestAnimationFrame(captureVideo);
// }
// function pauseVideo() {
//     video.pause();
// }


// called automatically when the page is loaded
// window.onload = async function () {
//     // detect poses
//     // detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
//     detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
//     // detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig); 

//     // feed webcam
//     navigator.mediaDevices.getUserMedia({ video: true })
//         .then(function (stream) {
//             console.log('webcam works!')
//             console.log(stream)
//             webcam.srcObject = stream;
//         })
//         .catch(function (err0r) {
//             console.log("Something went wrong!");
//         });

//     window.requestAnimationFrame(capture);

// }

//skeleton overlay
function beginEstimatePosesStats() {
    startInferenceTime = (performance || Date).now();
}

function endEstimatePosesStats() {
    const endInferenceTime = (performance || Date).now();
    inferenceTimeSum += endInferenceTime - startInferenceTime;
    ++numInferences;

    const panelUpdateMilliseconds = 1000;
    if (endInferenceTime - lastPanelUpdate >= panelUpdateMilliseconds) {
        const averageInferenceTime = inferenceTimeSum / numInferences;
        inferenceTimeSum = 0;
        numInferences = 0;
        stats.customFpsPanel.update(
            1000.0 / averageInferenceTime, 120 /* maxValue */);
        lastPanelUpdate = endInferenceTime;
    }
}

async function renderResult() {

    if (camera.webcam.readyState < 2) {
        await new Promise((resolve) => {
            camera.webcam.onloadeddata = () => {
                resolve(webcam);
            };
        });
    }


    // FPS only counts the time it takes to finish estimatePoses.
    beginEstimatePosesStats();

    webcamPoses = await detector.estimatePoses(
        camera.webcam,
        { flipHorizontal: false });

    //maxPoses: STATE.modelConfig.maxPoses,
    videoPoses = await detector.estimatePoses(video, { flipHorizontal: false });

    endEstimatePosesStats();

    camera.drawCtx();

    // The null check makes sure the UI is not in the middle of changing to a
    // different model. If during model change, the result is from an old model,
    // which shouldn't be rendered.
    if (webcamPoses.length > 0 && !STATE.isModelChanged) {
        camera.drawResults(webcamPoses);

        if (videoPoses.length > 0) {
            weightedDistance = poseSimilarity(videoPoses[0].keypoints, webcamPoses[0].keypoints);
            console.log("weight:", weightedDistance);
        }

    }
}

async function renderPrediction() {
    await renderResult();
    rafId = requestAnimationFrame(renderPrediction);
};

async function app() {

    stats = setupStats();

    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);

    camera = await Camera.setupCamera(STATE.camera);

    await setBackendAndEnvFlags(STATE.flags, STATE.backend);

    renderPrediction();

};


function weightedDistanceMatching(vectorPose1XY, vectorPose2XY, vectorConfidences) {
    const summation1 = 1 / vectorConfidences[vectorConfidences.length - 1];
    var summation2 = 0;

    for (var i = 0; i < vectorPose1XY.length; i++) {
        var confIndex = Math.floor(i / 2);
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
        return position / absVectorPoseXY; s
    });
}
function vectorizeAndNormalize(pose) {
    var _a = convertPoseToVector(pose);
    var vectorPoseXY = _a[0];
    var vectorPoseTransform = _a[1];
    var vectorPoseConfidences = _a[2];

    vectorPoseXY = scaleAndTranslate(vectorPoseXY, vectorPoseTransform);

    vectorPoseXY = L2Normalization(vectorPoseXY);

    return [vectorPoseXY, vectorPoseConfidences];
}

function poseSimilarity(pose1, pose2) {
    // merge options
    var _a = vectorizeAndNormalize(pose1)
    var vectorPose1XY = _a[0];
    var vectorPose1Scores = _a[1];
    // console.log("pose1", pose1);
    // console.log("pose2", pose2);

    var vectorPose2XY = vectorizeAndNormalize(pose2)[0];
    // console.log("compare", vectorPose1XY, vectorPose2XY)
    // execute strategy
    // if strategy is given by the string form
    return weightedDistanceMatching(vectorPose1XY, vectorPose2XY, vectorPose1Scores);
}
app();