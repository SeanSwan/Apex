import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

async function loadModel() {
  const model = await cocoSsd.load();
  return model;
}

async function detectObjects(model, video) {
  const predictions = await model.detect(video);
  return predictions;
}

function getDetectionSound() {
  // Return a base64 encoded short audio file or a URL to an audio file
  // For simple implementation, we can use a base64 encoded "beep" sound
  return "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAHnAA3NzdPT09nZ2d/f3+Xl5evr6/Hx8ff39/n5+fn5+f39/f///8AAAA5TEFNRTMuMTAwAZYAAAAALgAABSAJARpDAAACoAAAB5yQRkxHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAOwgYOSAMM0OhBwhjJYQhBBuQtI0wVKDE5CGN1gqQGAAAA0gAAAAATK2tLagWi////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8xMZ//sQZEIPwgYCSAMMSOg/QUjdYKgBBsQjIUwxJiEHg+OlhiTE///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8="
}

export { loadModel, detectObjects, getDetectionSound };

// import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import '@tensorflow/tfjs';

// async function loadModel() {
//   const model = await cocoSsd.load();
//   return model;
// }

// async function detectObjects(model, video) {
//   const predictions = await model.detect(video);
//   return predictions;
// }

// export { loadModel, detectObjects };