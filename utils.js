function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        // you should paste the response of the chatGPT here:
        0.21650635, -0.1913417, 0.375, 0.3,
  0.34150636, 0.4330127, -0.1913417, -0.03,
  -0.375, 0.34150636, 0.21650635, 0,
  0, 0, 0, 1
    ]);
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    // calculate the model view matrix by using the transformation
    // methods and return the modelView matrix in this method
    initial_matrix = createIdentityMatrix();
    translator = createTranslationMatrix(0.3,-0.25,0);
    scaler = createScaleMatrix(0.5,0.5,1);
    rotater_x_30 = createRotationMatrix_X(30);
    rotater_y_45_2 = createRotationMatrix_Y(45);
    rotater_z_60_3 = createRotationMatrix_Z(60);

    step_1 = multiplyMatrices(rotater_z_60_3,rotater_y_45_2);
    step_2 = multiplyMatrices(step_1,rotater_x_30);

    step_3 = multiplyMatrices(step_2, scaler);   
    step_4 = multiplyMatrices(step_3,translator);
    step_5 = multiplyMatrices(step_4, initial_matrix);
    
    const transformationMatrix2 = step_5;

    return (transformationMatrix2);
}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */

function getInterpolatedMatrix(startTime) {
    // Get current time in seconds
    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - (startTime / 1000); // Convert startTime to seconds

    // Set up constants for the periodic movement
    const period = 10; // Total animation period in seconds
    const progress = elapsedTime % period; // Get the current progress within the cycle (0 to 10 seconds)

    // Calculate interpolation factor
    let t;
    if (progress < period / 2) {
        // First half of the cycle: from initial to target
        t = progress / (period / 2); // Linearly interpolates from 0 to 1
    } else {
        // Second half of the cycle: from target back to initial
        t = (period - progress) / (period / 2); // Linearly interpolates from 1 to 0
    }

    // Get the initial (identity) and target matrices (transformed)
    const initialMatrix = createIdentityMatrix(); // Identity matrix (no transformation)
    const targetMatrix = getModelViewMatrix(); // Target transformation matrix

    // Create a new matrix to store the interpolated result (4x4 matrix)
    const interpolatedMatrix = new Float32Array(16);

    // Perform linear interpolation for each element in the matrix
    for (let i = 0; i < 16; i++) {
        interpolatedMatrix[i] = initialMatrix[i] * (1 - t) + targetMatrix[i] * t;
    }

    return interpolatedMatrix; // Return the interpolated matrix
}
