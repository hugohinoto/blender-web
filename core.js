// Core Blender Web Engine
class BlenderWeb {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.selectedObject = null;
        this.objects = [];
        this.transformMode = 'move';
        this.shadeMode = 'solid';
        this.undoStack = [];
        this.redoStack = [];
        this.gizmo = null;
        this.grid = null;
        this.orbitControls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = Date.now();
        this.animationFrame = 0;
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupGrid();
        this.setupDefaultObjects();
        this.setupEventListeners();
        this.setupOrbitControls();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 200, 1000);
    }

    setupCamera() {
        const width = window.innerWidth - 300 - 250;
        const height = window.innerHeight - 40 - 100;
        this.camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );
        this.camera.position.set(7, 5, 7);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        const container = document.getElementById('viewport');
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(
            window.innerWidth - 300 - 250,
            window.innerHeight - 40 - 100
        );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // キーライト
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
        keyLight.position.set(10, 10, 10);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.left = -20;
        keyLight.shadow.camera.right = 20;
        keyLight.shadow.camera.top = 20;
        keyLight.shadow.camera.bottom = -20;
        this.scene.add(keyLight);

        // フィルライト
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 5, -10);
        this.scene.add(fillLight);

        // バックライト
        const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
        backLight.position.set(0, 10, -10);
        this.scene.add(backLight);
    }

    setupGrid() {
        this.grid = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(this.grid);

        // アクシスヘルパー
        const axisHelper = new THREE.AxesHelper(5);
        this.scene.add(axisHelper);
    }

    setupDefaultObjects() {
        // デフォルトカメラ
        const cameraObj = new THREE.Object3D();
        cameraObj.name = 'Camera';
        cameraObj.userData.type = 'Camera';
        this.scene.add(cameraObj);
        this.objects.push(cameraObj);

        // デフォルトライト
        const lightObj = new THREE.Object3D();
        lightObj.name = 'Light';
        lightObj.userData.type = 'Light';
        this.scene.add(lightObj);
        this.objects.push(lightObj);

        // デフォルトキューブ
        const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x0099ff });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.name = 'Cube';
        cube.userData.type = 'Mesh';
        cube.userData.originalMaterial = cubeMaterial.clone();
        this.scene.add(cube);
        this.objects.push(cube);
    }

    setupOrbitControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.autoRotate = false;
        this.orbitControls.autoRotateSpeed = 2;
    }

    setupEventListeners() {
        // ビューポートクリック
        this.renderer.domElement.addEventListener('click', (e) => this.onViewportClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // キーボード
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // ウィンドウリサイズ
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onViewportClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0) {
            const obj = intersects[0].object;
            while (obj.parent && obj.parent !== this.scene) {
                obj = obj.parent;
            }
            this.selectObject(obj);
        } else {
            this.deselectAll();
        }
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    onKeyDown(event) {
        switch(event.key.toLowerCase()) {
            case 'g':
                event.preventDefault();
                this.setTransformMode('move');
                break;
            case 'r':
                event.preventDefault();
                this.setTransformMode('rotate');
                break;
            case 's':
                event.preventDefault();
                this.setTransformMode('scale');
                break;
            case 'x':
                if (event.altKey) {
                    event.preventDefault();
                    this.toggleXray();
                }
                break;
            case 'z':
                event.preventDefault();
                if (event.shiftKey) {
                    this.setShadeMode('rendered');
                } else {
                    this.setShadeMode('solid');
                }
                break;
            case 'delete':
            case 'backspace':
                event.preventDefault();
                this.deleteSelected();
                break;
            case 'd':
                if (event.shiftKey) {
                    event.preventDefault();
                    this.duplicateSelected();
                }
                break;
            case 'a':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.selectAll();
                }
                break;
            case 'z':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                }
                break;
        }
    }

    onWindowResize() {
        const width = window.innerWidth - 300 - 250;
        const height = window.innerHeight - 40 - 100;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    selectObject(obj) {
        this.deselectAll();
        this.selectedObject = obj;
        
        // ハイライト効果
        if (obj.userData.type === 'Mesh') {
            obj.material = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.3
            });
        }

        // UIを更新
        this.updatePropertiesPanel();
        this.updateOutliner();
        
        // ログ
        console.log('Selected:', obj.name);
    }

    deselectAll() {
        if (this.selectedObject && this.selectedObject.userData.type === 'Mesh') {
            if (this.selectedObject.userData.originalMaterial) {
                this.selectedObject.material = this.selectedObject.userData.originalMaterial.clone();
            }
        }
        this.selectedObject = null;
        this.updateOutliner();
    }

    addObject(type) {
        let geometry, material, mesh;
        const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x0099ff });

        switch(type) {
            case 'Cube':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                break;
            case 'Sphere':
                geometry = new THREE.SphereGeometry(1, 32, 32);
                break;
            case 'Cylinder':
                geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
                break;
            case 'Cone':
                geometry = new THREE.ConeGeometry(1, 2, 32);
                break;
            case 'Plane':
                geometry = new THREE.PlaneGeometry(2, 2);
                break;
            default:
                return;
        }

        mesh = new THREE.Mesh(geometry, defaultMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = type;
        mesh.userData.type = 'Mesh';
        mesh.userData.originalMaterial = defaultMaterial.clone();
        
        this.scene.add(mesh);
        this.objects.push(mesh);
        this.selectObject(mesh);
        this.pushUndo();
    }

    deleteSelected() {
        if (!this.selectedObject) return;
        this.scene.remove(this.selectedObject);
        this.objects = this.objects.filter(obj => obj !== this.selectedObject);
        this.selectedObject = null;
        this.updateOutliner();
        this.pushUndo();
    }

    duplicateSelected() {
        if (!this.selectedObject) return;
        const clone = this.selectedObject.clone();
        clone.position.add(new THREE.Vector3(1, 1, 1));
        this.scene.add(clone);
        this.objects.push(clone);
        this.selectObject(clone);
        this.pushUndo();
    }

    setTransformMode(mode) {
        this.transformMode = mode;
        document.querySelectorAll('.tool-btn').forEach((btn, idx) => {
            btn.classList.remove('active');
        });
        const modeMap = { 'move': 0, 'rotate': 1, 'scale': 2 };
        if (modeMap[mode] !== undefined) {
            document.querySelectorAll('.tool-btn')[modeMap[mode]].classList.add('active');
        }
    }

    setShadeMode(mode) {
        this.shadeMode = mode;
        // シェーディング変更ロジック
        console.log('Shade mode:', mode);
    }

    toggleXray() {
        if (!this.selectedObject) return;
        this.selectedObject.material.transparent = !this.selectedObject.material.transparent;
        this.selectedObject.material.opacity = this.selectedObject.material.transparent ? 0.5 : 1.0;
    }

    fitAll() {
        const box = new THREE.Box3().setFromObject(this.scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        this.camera.position.z = cameraZ;
        this.camera.lookAt(box.getCenter(new THREE.Vector3()));
        this.orbitControls.target.copy(box.getCenter(new THREE.Vector3()));
    }

    updateTransform() {
        if (!this.selectedObject) return;

        const locX = parseFloat(document.getElementById('loc-x').value) || 0;
        const locY = parseFloat(document.getElementById('loc-y').value) || 0;
        const locZ = parseFloat(document.getElementById('loc-z').value) || 0;
        const rotX = parseFloat(document.getElementById('rot-x').value) || 0;
        const rotY = parseFloat(document.getElementById('rot-y').value) || 0;
        const rotZ = parseFloat(document.getElementById('rot-z').value) || 0;
        const scaleX = parseFloat(document.getElementById('scale-x').value) || 1;
        const scaleY = parseFloat(document.getElementById('scale-y').value) || 1;
        const scaleZ = parseFloat(document.getElementById('scale-z').value) || 1;

        this.selectedObject.position.set(locX, locY, locZ);
        this.selectedObject.rotation.order = 'XYZ';
        this.selectedObject.rotation.set(
            THREE.MathUtils.degToRad(rotX),
            THREE.MathUtils.degToRad(rotY),
            THREE.MathUtils.degToRad(rotZ)
        );
        this.selectedObject.scale.set(scaleX, scaleY, scaleZ);
    }

    updateMaterial() {
        if (!this.selectedObject || !this.selectedObject.material) return;

        const baseColor = document.getElementById('base-color').value;
        const metallic = parseFloat(document.getElementById('metallic').value);
        const roughness = parseFloat(document.getElementById('roughness').value);
        const emission = parseFloat(document.getElementById('emission').value);

        this.selectedObject.material.color.setHex(parseInt(baseColor.slice(1), 16));
        this.selectedObject.material.metallic = metallic;
        this.selectedObject.material.roughness = roughness;
        this.selectedObject.material.emissiveIntensity = emission;

        // 値表示の更新
        document.getElementById('metallic-value').textContent = metallic.toFixed(2);
        document.getElementById('roughness-value').textContent = roughness.toFixed(2);
        document.getElementById('emission-value').textContent = emission.toFixed(2);
    }

    updatePropertiesPanel() {
        if (!this.selectedObject) return;

        document.getElementById('loc-x').value = this.selectedObject.position.x.toFixed(2);
        document.getElementById('loc-y').value = this.selectedObject.position.y.toFixed(2);
        document.getElementById('loc-z').value = this.selectedObject.position.z.toFixed(2);

        document.getElementById('rot-x').value = THREE.MathUtils.radToDeg(this.selectedObject.rotation.x).toFixed(2);
        document.getElementById('rot-y').value = THREE.MathUtils.radToDeg(this.selectedObject.rotation.y).toFixed(2);
        document.getElementById('rot-z').value = THREE.MathUtils.radToDeg(this.selectedObject.rotation.z).toFixed(2);

        document.getElementById('scale-x').value = this.selectedObject.scale.x.toFixed(2);
        document.getElementById('scale-y').value = this.selectedObject.scale.y.toFixed(2);
        document.getElementById('scale-z').value = this.selectedObject.scale.z.toFixed(2);

        if (this.selectedObject.material) {
            const color = new THREE.Color(this.selectedObject.material.color);
            document.getElementById('base-color').value = '#' + color.getHexString();
            document.getElementById('metallic').value = this.selectedObject.material.metallic;
            document.getElementById('roughness').value = this.selectedObject.material.roughness;
            document.getElementById('emission').value = this.selectedObject.material.emissiveIntensity || 0;
        }

        document.getElementById('selected-name').textContent = this.selectedObject.name;
    }

    updateOutliner() {
        const outliner = document.getElementById('outliner');
        outliner.innerHTML = '';

        this.objects.forEach(obj => {
            const item = document.createElement('div');
            item.className = 'outliner-item';
            if (obj === this.selectedObject) {
                item.classList.add('selected');
            }
            
            const icon = obj.userData.type === 'Mesh' ? '📦' : 
                        obj.userData.type === 'Light' ? '💡' : '📷';
            
            item.innerHTML = `<span class="outliner-icon">${icon}</span> ${obj.name}`;
            item.onclick = () => this.selectObject(obj);
            outliner.appendChild(item);
        });
    }

    selectAll() {
        // 全オブジェクト選択（複数選択）
    }

    pushUndo() {
        this.undoStack.push(JSON.stringify(this.scene.toJSON()));
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(JSON.stringify(this.scene.toJSON()));
        const state = this.undoStack.pop();
        // シーン復元ロジック
        console.log('Undo');
    }

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(JSON.stringify(this.scene.toJSON()));
        const state = this.redoStack.pop();
        // シーン復元ロジック
        console.log('Redo');
    }

    updateStats() {
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            document.getElementById('fps').textContent = this.fps;
        }
        document.getElementById('object-count').textContent = this.objects.length;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
        this.updateStats();
        this.animationFrame++;
    }
}

// OrbitControls (Three.jsから簡易実装)
class OrbitControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = new THREE.Vector3();
        this.enableDamping = false;
        this.dampingFactor = 0.1;
        this.autoRotate = false;
        this.autoRotateSpeed = 2;
        this.rotateSpeed = 0.005;
        this.zoomSpeed = 0.1;
        
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };

        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.domElement.addEventListener('wheel', (e) => this.onMouseWheel(e));
    }

    onMouseDown(event) {
        if (event.button === 2) { // 右クリック
            this.isDragging = true;
            this.previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }

    onMouseMove(event) {
        if (!this.isDragging) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        this.sphericalDelta.theta -= deltaX * this.rotateSpeed;
        this.sphericalDelta.phi -= deltaY * this.rotateSpeed;

        this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    onMouseUp(event) {
        this.isDragging = false;
    }

    onMouseWheel(event) {
        event.preventDefault();
        const direction = this.camera.position.clone().sub(this.target).normalize();
        const distance = this.camera.position.distanceTo(this.target);
        
        if (event.deltaY > 0) {
            this.camera.position.copy(this.target.clone().add(direction.multiplyScalar(distance * 1.1)));
        } else {
            this.camera.position.copy(this.target.clone().add(direction.multiplyScalar(distance * 0.9)));
        }
    }

    update() {
        const offset = this.camera.position.clone().sub(this.target);
        this.spherical.setFromVector3(offset);
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        this.sphericalDelta.set(0, 0, 0);

        this.spherical.makeSafe();
        offset.setFromSpherical(this.spherical);
        
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
    }
}

// グローバルインスタンス
let blenderWeb;

document.addEventListener('DOMContentLoaded', () => {
    blenderWeb = new BlenderWeb();
});
