import * as tf from '@tensorflow/tfjs-node';

async function createModel() {
  // Create a sequential model for window detection
  const model = tf.sequential();

  // Add convolutional layers
  model.add(tf.layers.conv2d({
    inputShape: [640, 640, 3],
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(tf.layers.conv2d({
    filters: 128,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Flatten and add dense layers
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({
    units: 512,
    activation: 'relu'
  }));
  model.add(tf.layers.dropout({ rate: 0.5 }));

  // Output layer for bounding box prediction (x, y, width, height, confidence)
  model.add(tf.layers.dense({
    units: 5,
    activation: 'sigmoid'  // Normalized coordinates and confidence
  }));

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['accuracy']
  });

  return model;
}

async function trainModel(model: tf.Sequential, trainData: tf.Tensor4D, trainLabels: tf.Tensor2D) {
  // Train the model
  await model.fit(trainData, trainLabels, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
      }
    }
  });
}

async function main() {
  try {
    // Create model
    const model = await createModel();
    console.log('Model created successfully');

    // TODO: Load and preprocess training data
    // This is a placeholder - you'll need to provide actual training data
    const trainData = tf.randomNormal([100, 640, 640, 3]);
    const trainLabels = tf.randomUniform([100, 5]);

    // Train model
    console.log('Starting model training...');
    await trainModel(model, trainData, trainLabels);
    console.log('Model training completed');

    // Save model
    const modelPath = 'public/models/window-detection/model.json';
    await model.save(`file://${modelPath}`);
    console.log(`Model saved to ${modelPath}`);

    // Clean up
    trainData.dispose();
    trainLabels.dispose();
    model.dispose();
  } catch (error) {
    console.error('Error training model:', error);
  }
}

main();
