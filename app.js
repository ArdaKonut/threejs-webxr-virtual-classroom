import * as THREE from "three";
import { OrbitControls } from './libs/OrbitControls.js'; // Camera navigation, allowing users to inspect the scene interactively.
import Stats from './libs/stats.module.js'; // Runtime performance monitoring (FPS).
import { GLTFLoader } from './libs/GLTFLoader.js'; // glTF/GLB format is used, widely supported in real-time 3D pipelines.
import { GUI } from './libs/dat.gui.module.js'; // Graphical User Interface implementation.
import { VRButton } from './libs/VRButton.js'; // Browser-based VR compatibility.

// Stats Variables
const stats = new Stats();
stats.showPanel( 0 ); // 0 = fps, 1 = ms, 2 = mb, 3 = custom

// Global Variables.
var renderer = new THREE.WebGLRenderer();
var scene = new THREE.Scene();
var camera;
var plane; 
var video;
document.body.appendChild(stats.dom);
var controls;
const aspectRatio = (window.innerWidth / window.innerHeight);

// VR Setup
document.body.appendChild( VRButton.createButton( renderer ) );
renderer.xr.enabled = true;

// Variables for Animation.
let mixers = [] ;
let clocks=[  new THREE.Clock(),new THREE.Clock()]

// Graphical User Interface Variables.
let gui = new GUI();

// Audio Variables
const listener = new THREE.AudioListener();
const sound = new THREE.Audio( listener );
const posSound = new THREE.PositionalAudio ( listener ); // Spatial 3D Sound
// Volume/panning changes based on:
// - Camera distance
// - Listener orientation
// - 3D position
// This simulates real-world sound behaviour

// Loading Manager for Multi Texture loading
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {console.log('Multi Tex loaded')}
loadingManager.onProgress = function () {}
loadingManager.onError = function () {console.log('Multi Tex ERROR')}

// Sound Cube
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({color:0xf0f099, wireframe:true})
 )

function createControlPanel(){
    // Video Controller
    const cntlPanel = gui.addFolder('Video Controller');
    const startVideo = { play: function() { video.play(); } };
    cntlPanel.add(startVideo, 'play');
    const pauseVideo = { pause: function() { video.pause(); } };
    cntlPanel.add(pauseVideo, 'pause');
    const stopVideo = { stop: function() { video.pause(); video.currentTime = 0;}};
    cntlPanel.add(stopVideo, 'stop');

    const muteVid = {muteee: function() { muteVideo(); }};
    cntlPanel.add(muteVid, 'muteee').name("Mute");

    const unmuteVid = {unmute: function(){ unmuteVideo(); }};
    cntlPanel.add(unmuteVid, 'unmute').name("Unmute");

    cntlPanel.open();
    
    // Audio Controller
    const audioPanel = gui.addFolder('Dog Sound Controller');
    const playObj = { play:function(){posSound.play() }};
    const stopObj = { stop:function() { posSound.stop() }};

    audioPanel.add(stopObj, 'stop');
    audioPanel.add(playObj, 'play');
    console.log(cube.position);
    audioPanel.add(cube.position, "x", -5, 5, 0.001).name("Panner");
    
    const muteObj = { mute:function(){
        posSound.setVolume(0);
        sound.setVolume(0);
    }};
        audioPanel.add(muteObj, 'mute').name("Mute ");

    const unMute = {unMute:function() {
        posSound.setVolume(1);
        sound.setVolume(1);
    }};
    audioPanel.add(unMute, 'unMute').name("Unmute");

    audioPanel.open()
}

// Mute Video function for Video
function muteVideo() {
    video.muted = true;
    posSound.setVolume(0);
    sound.setVolume(0);

}
// UnMute Video function for video.
function unmuteVideo() {
    video.muted = false;
    posSound.setVolume(1);
    sound.setVolume(1);

}

function createRenderer() {
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
}

function createScene() {
    scene.background = new THREE.Color('grey');
    // Create a transparent material for the cube
    const transparentMaterial = new THREE.MeshBasicMaterial({ transparent:true, opacity:0});
    cube.material = transparentMaterial;
    scene.add(cube);
}

function createCamera() {
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    controls = new OrbitControls(camera, renderer.domElement);
    camera.lookAt(scene.position);
    camera.position.z = 10;
    camera.add(listener);

}

function createLights(){

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    ambientLight.castShadow = true;
    scene.add(ambientLight);

    // Directional Light 
    const directionalLight = new THREE.DirectionalLight(0xffffff );
    directionalLight.position.set(2, 5, 2);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    // Directional Light Helper
    //const helper = new THREE.DirectionalLight( directionalLight, 0.5);
    //scene.add(helper);

    // SpotLight w/ helper(for brick sphere)
    const spotLight = new THREE.SpotLight(0xffa500, 0.8, 7, 42, 0.5, 0.5); // SpotLight( color : Integer, intensity : Float, distance : Float, angle : Radians, penumbra : Float, decay : Float )
    spotLight.position.set(-4, 4.4, -1.8);
    spotLight.scale.set(0.2, 0.2, 0.2);
    spotLight.castShadow = true;
    scene.add(spotLight);

    //const spotLightHelper = new THREE.SpotLightHelper ( spotLight );
    //scene.add( spotLightHelper );
    
    // SpotLight w/ helper(for planet sphere)
    const spotLightTwo = new THREE.SpotLight(0xffa500, 0.8, 7, 42, 0.5, 0.5); // SpotLight( color : Integer, intensity : Float, distance : Float, angle : Radians, penumbra : Float, decay : Float )
    spotLightTwo.position.set(5.4, 4.6, -1.8);
    spotLightTwo.scale.set(0.2, 0.2, 0.2);
    spotLightTwo.castShadow = true;
    scene.add(spotLightTwo);

    //const spotLightHelper = new THREE.SpotLightHelper ( spotLightTwo );
    //scene.add( spotLightHelper );

    // Console message for the lights
    console.log("Spot Light, Ambient Light and Directional Light all loaded!");

}

// Overall Goal:
// This function converts a normal HTML video into a live texture that can be rendered onto a 3D Object.
function playAudio() {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./assets/dog.mp3', function(buffer){
        posSound.setBuffer(buffer);
        posSound.setRefDistance(10); // Adjust the reference distance as needed.
        posSound.setVolume(1);
        sound.play();

        cube.add(posSound); // The positional audio is attached to cube. Moving the cube moves the sound source.
    });
}

function playVideo() {
    // retrieves the HTML video element from the DOM.
    video = document.getElementById('videoPlayer');
    // Three.js creates a dynamic GPU texture from the video frames:
    // HTML video updates -> Current frame copied for GPU texture -> Texture rendered on 3D object.
    // So the video becomes a real-time animated texture.
    const videoTex = new THREE.VideoTexture(video);

    // Adjust Texture Filtering

    // Mipmaps are smaller pre-generated versions of textures. 
    // Normally used for performance, anti-aliasing and distant rendering.
    // Why disabled? Because the texture changes every frame.
    videoTex.generateMipMaps = false; 

    // Linear Filtering -> Smooths pixels together (Smooth Interpolation) -> Blocky pixelated output without it!
    videoTex.minFilter = THREE.LinearFilter; // Minification Filter -> Used when texture becomes smaller than original size (Ex: TV far away in scene.)
    videoTex.magFilter = THREE.LinearFilter; // Magnification Filter -> Used when texture becomes enlarged. (Ex: Camera close to screen.)
    videoTex.format = THREE.RGBAFormat;

    // Appropriate Material for the scene -> Now the video assigned to a material.
    const videoMat =  new THREE.MeshLambertMaterial({ map: videoTex });
    // Lambert Material -> Lighting interaction, diffuse shading

    // Update the material of the plane. (The plane geometry becomes the screen)
    plane.material = videoMat; 

    // Hide the HTML video element. -> We don't want users seeing both (HTML video and 3D video screen). So we hide the DOM element.
    video.style.display = 'none';

    // The hidden HTML video still powers the texture. (Feeds GPU texture and appears inside the 3D world.)

    // Play the audio
    playAudio();
}

// Plane Geometry for Video
function planeGeometry(){
    const videoWidth = 854;
    const videoHeight = 480;
    const aspectRatio =  videoWidth / videoHeight;

    const planeWidth = 10;
    const planeHeight = planeWidth / aspectRatio

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    plane = new THREE.Mesh( geometry, material );

    plane.geometry.dispose();
    plane.geometry = geometry;
    plane.position.set(0.98, 3.6, -6.60);
    scene.add( plane )
}

function createControls(){
    document.addEventListener("keydown", onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
      var keyCode = event.which;
      if (keyCode == 32) { //space bar
          video.play();
        console.log("play");
      } else if (keyCode == 80) { // p key
          video.pause();
        console.log("pause");
      } else if (keyCode == 83) { // s key
                  video.pause();
                  video.currentTime = 0;
        console.log("stop");
      } else if (keyCode == 82) { // r key
                  video.currentTime = 0;
                  // controls.update();
                  stats.update();
        console.log("reset");
      } 
}}

function createSphere() {
    //create geometry
    var sphereGeometry = new THREE.SphereGeometry(.8, 64, 32);
    
    //load texture
    var sphereTexture = new THREE.Texture();
    var loader = new THREE.ImageLoader();
    loader.load('./assets/Planet_2_d.png', function(image){
        sphereTexture.image = image;
        sphereTexture.needsUpdate = true;
    });

    //create material
    var sphereMaterial = new THREE.MeshPhongMaterial();
    sphereMaterial.map =sphereTexture;

    var sphereMesh = new THREE.Mesh(sphereGeometry,sphereMaterial);
    sphereMesh.name = 'sphere';

    sphereMesh.position.set(6.9, 5.5, -2);
    scene.add(sphereMesh);

}

function createClouds() {
    var sphereGeometry = new THREE.SphereGeometry(0.805, 64, 32);

    //load texture
    var cloudsTexture = new THREE.Texture();
    var loader = new THREE.ImageLoader();
    loader.load('./assets/fair_clouds_1k.png', function(image){
        cloudsTexture.image = image;
        cloudsTexture.needsUpdate = true;
    });

    var cloudsMaterial = new THREE.MeshPhongMaterial();
    cloudsMaterial.map = cloudsTexture;
    cloudsMaterial.transparent = true;

    var cloudsMesh = new THREE.Mesh(sphereGeometry, cloudsMaterial);
    cloudsMesh.name = 'clouds';

    cloudsMesh.position.set(6.9, 5.5, -2);
    scene.add(cloudsMesh);

}

function multiTexGeometry(){

    const textLoader = new THREE.TextureLoader(loadingManager);
    const colTexture = textLoader.load('./assets/brick-wall_albedo.png');
    const normalTexture = textLoader.load('./assets/brick-wall_normal-ogl.png');
    const heightTexture = textLoader.load('./assets/brick-wall_height.png');
    const aoTexture = textLoader.load('./assets/brick-wall_ao.png');


    const geometry = new THREE.SphereGeometry( 0.8, 1024, 1024 );
    const material = new THREE.MeshStandardMaterial({map: colTexture});
    material.normalMap = normalTexture;
    material.displacementMap = heightTexture;
    material.displacementScale = 0.004;
    material.aoMap = aoTexture;
    material.aoMapIntensity = 0.35;

    let mtxSphere = new THREE.Mesh( geometry, material );
    mtxSphere.name = 'mtxMesh'

    mtxSphere.position.set(-4.8, 5.5, -2);

   scene.add( mtxSphere);
}
    
async function loadModel() {
    const loader = new GLTFLoader(); // Use GLTFLoader for GLB files

    // Define an array to store loaded models
    const models= []; 

    // Define an array of model paths
    const modelPaths = [
        './assets/updated_dog.glb',
        './assets/updated_doggo.glb',
        './assets/updated_scene.glb',
    ];

    for (const path of modelPaths) {
        await new Promise((resolve, reject) => {
            loader.load(
                path,
                function(gltf){
                    models.push(gltf.scene);

                    // Store the animations
                    if (gltf.animations.length > 0) {
                       
                        console.log(gltf.animations[0])
                        // Checks whether imported GLB models contain animations
                        // and then plays them using THREE.AnimationMixer.
                        let mixer = new THREE.AnimationMixer(gltf.scene);
                     
                            mixer.clipAction(gltf.animations[0]).play();
                       
                        mixers.push(mixer);
                    
                    }

                    resolve();
                },
                // onProgress callback function
                function(xhr){
                    console.log((xhr.loaded / xhr.total * 100) +'% loaded');
                },
                // onError callback function
                function(error){
                    console.error('An error occured while loading the model', error);
                    reject(error);
                }
            );
        });
    }

    // Add loaded models to the scene
    for (const model of models) {
        scene.add(model);
        model.castShadow = true;
    }

    // Reposition each model individually
    models[0].position.set(-6.8, 2.085, 0.72); // the dog on the desk
    models[1].position.set(-2, 0, 2.2); // the dog on the floor
    models[2].position.set(2, 0, -5); // Scene

    // Rescale each model individually
    models[0].scale.set(2.7, 2.7, 2.7); // Scale the dog.
    models[1].scale.set(1.05, 1.05, 1.05); // Scale the dog.
    models[2].scale.set(1.04, 1.04, 1.04); // Scale the scene.

    // Rotate models
    models[0].rotation.set(0, -1.15, 0);

    playVideo();
    // render the scene
    animate();
}

// GLSL(OpenGL Shading Language) -> Runs directly on the GPU
// Adding custom shading materials!

// Vertex shader -> runs once per vertex.
// vertex shader for a basic Phong shader.

// Phong-like lighting combines:
// 1. Ambient (Base illumination)
// 2. Diffuse (Surface Brightness)
// 3. Specular (Shiny highlights)

// To note: "varying" means send this value from vertex shader to fragment shader!
const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }

`;

// Fragment shader -> Runs per pixel(technically per fragment).
// Fragment shader for a basic Phong shader.
const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));

        // Lambertian lighting (diffuse lighting simulates light spreading across rough surfaces(concrete, cloth, matte paint, walls and etc.))
        float diffuse = max(dot(normal, lightDir), 0.0);

        // Phong specular reflection (simulates shiny reflections (polished metals, glossy plastics, wet surfaces and etc.))
        vec3 reflectDir = reflect(-lightDir, normal);
        float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

        // Combine diffuse and specular components
        vec3 color = vec3(1.0, 0.5, 0.31); // Object color
        vec3 lightColor = vec3(1.0, 1.0, 1.0); // Light color
        vec3 finalColor = (0.5 * color * diffuse) + (specular * lightColor);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Create a new material with custom shaders
const phongMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});

// Create a geometry (e.g., a sphere)
const geometry = new THREE.SphereGeometry(0.6, 32, 32);

// Create a mesh using the geometry and the custom material
const mesh = new THREE.Mesh(geometry, phongMaterial);
mesh.position.set(-6.65, 5.5, -2);

// Add the mesh to the scene
scene.add(mesh);


// Normal Rendering -> Normally light transitions smoothly: Bright -> Medium -> Dark
// Toon Rendering (like cartoons/anime) -> Intentionally removes smooth gradients. -> Bright -> Hard Edge -> Dark

// Vertex Shader for Toon Shader
const vertexShaderTwo = `

// Vertex shader
varying vec3 vNormal;

void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}


`;

// Fragment Shader for Toon Shader
// Normal Rendering: Lighting transitions smoothly: Bright -> Medium -> Dark
// Toon Rendering: Intentionally removes smooth gradients(like cartoons/anime): Bright -> Hard Edge -> Dark
const fragmentShaderTwo = `
// Fragment shader
varying vec3 vNormal;

void main() {
    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0)); // Direction to light source
    float intensity = dot(normalize(vNormal), lightDir); // Lambert shading

    // Apply toon shading -> Creates stepped lighting
    if (intensity > 0.95) {
        gl_FragColor = vec4(1.0, 0.8, 0.6, 1.0); // High intensity color
    } else if (intensity > 0.5) {
        gl_FragColor = vec4(0.6, 0.6, 0.6, 1.0); // Medium intensity color
    } else {
        gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0); // Low intensity color
    }
}

`;

// Create a new material with custom shaders
const phongMaterialTwo = new THREE.ShaderMaterial({
    vertexShader: vertexShaderTwo,
    fragmentShader: fragmentShaderTwo
});

// Create a geometry (e.g., a sphere)
const geometryTwo = new THREE.SphereGeometry(0.6, 32, 32);

// Create a mesh using the geometry and the custom material
const meshTwo = new THREE.Mesh(geometryTwo, phongMaterialTwo);
meshTwo.position.set(8.75, 5.5, -2);

// Add the mesh to the scene
scene.add(meshTwo);

// Vertex shader for Fresnel Shader
const vertexShaderThree = `varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vNormal = normalMatrix * normal;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment Shader for Fresnel Shader
// Real World Fresnel -> Surfaces reflect more light at grazing angles.
// In Computer Graphics, Fresnel is often used for holograms, force fiels, glowing outlines, glass and etc.
// It looks Sci-Fi -> (center = darker, edges = glowing) Creates a stylized futuristic appearance.
const fragmentShaderThree = ` 
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vPosition);

    float fresnel = pow(1.0 - dot(normal, viewDir), 3.0); // Fresnel effect

    // Apply Fresnel to color
    vec3 color = vec3(0.0, 0.5, 1.0); // Base color
    vec3 finalColor = mix(color, vec3(1.0), fresnel);

    gl_FragColor = vec4(finalColor, 1.0);
}

`;

// Create a new material with custom shaders
const phongMaterialThree = new THREE.ShaderMaterial({
    vertexShader: vertexShaderThree,
    fragmentShader: fragmentShaderThree
});

// Create a geometry (e.g., a sphere)
const geometryThree = new THREE.BoxGeometry(1.35, 0.8, 2.0);

// Create a mesh using the geometry and the custom material
const meshThree = new THREE.Mesh(geometryThree, phongMaterialThree);
meshThree.position.set(11, 0.365, 0);

// Add the mesh to the scene
scene.add(meshThree);

function init(){
    createCamera();
    createRenderer();
    createScene();
    loadModel();
    createLights();
    createSphere();
    createClouds();
    planeGeometry();
    createControlPanel();
    createControls();
    multiTexGeometry();
    // Assign the video element
    video = document.getElementById('videoPlayer');
    playVideo(video);
}

function animate() {
    renderer.setAnimationLoop( function () { // This is a rendering loop. This continuously repeats. 
    // WebXR requires special timing synchronization. 'setAnimationLoop' integrates with XR devices properly.
        scene.getObjectByName('sphere').rotation.y += 0.00035; // Update object rotations.
        scene.getObjectByName('clouds').rotation.y += 0.0008;
        scene.getObjectByName('mtxMesh').rotation.y += 0.0005;
        if(mixers) {
            mixers.forEach((mixer,i)=>{
            mixer.update(clocks[i].getDelta())}); // What time we currently are in the animation loop. Update animationmixers.  
    }
                controls.update(); // Update camera controls
                renderer.render(scene, camera); // Render the scene
                stats.update(); // Update performance monitor.
    } );

}

init();
// Axes Helper
//const axesHelper = new THREE.AxesHelper(8);
//scene.add(axesHelper);
