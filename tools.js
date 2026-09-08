// Tools and Advanced Features
class TransformGizmo {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.gizmo = new THREE.Group();
        this.scene.add(this.gizmo);
        this.setupGizmo();
    }

    setupGizmo() {
        // X軸（赤）
        const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        const xGeometry = new THREE.ConeGeometry(0.1, 0.5, 16);
        const xMesh = new THREE.Mesh(xGeometry, xMaterial);
        xMesh.position.x = 0.5;
        xMesh.rotation.z = -Math.PI / 2;
        this.gizmo.add(xMesh);

        // Y軸（緑）
        const yMaterial = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
        const yGeometry = new THREE.ConeGeometry(0.1, 0.5, 16);
        const yMesh = new THREE.Mesh(yGeometry, yMaterial);
        yMesh.position.y = 0.5;
        this.gizmo.add(yMesh);

        // Z軸（青）
        const zMaterial = new THREE.MeshBasicMaterial({ color: 0x4444ff });
        const zGeometry = new THREE.ConeGeometry(0.1, 0.5, 16);
        const zMesh = new THREE.Mesh(zGeometry, zMaterial);
        zMesh.position.z = 0.5;
        zMesh.rotation.x = Math.PI / 2;
        this.gizmo.add(zMesh);
    }

    show() {
        this.gizmo.visible = true;
    }

    hide() {
        this.gizmo.visible = false;
    }

    setPosition(x, y, z) {
        this.gizmo.position.set(x, y, z);
    }
}

class MeshModifier {
    static addSubdivisionSurface(mesh) {
        // Subdivision surface modifier
        if (mesh.geometry) {
            const modifier = {
                type: 'subdivision',
                levels: 2
            };
            mesh.userData.modifiers = mesh.userData.modifiers || [];
            mesh.userData.modifiers.push(modifier);
        }
    }

    static addBevel(mesh, amount = 0.1) {
        // Bevel modifier
        if (mesh.geometry) {
            const modifier = {
                type: 'bevel',
                amount: amount
            };
            mesh.userData.modifiers = mesh.userData.modifiers || [];
            mesh.userData.modifiers.push(modifier);
        }
    }

    static addMirror(mesh, axis = 'x') {
        // Mirror modifier
        if (mesh.geometry) {
            const modifier = {
                type: 'mirror',
                axis: axis
            };
            mesh.userData.modifiers = mesh.userData.modifiers || [];
            mesh.userData.modifiers.push(modifier);
        }
    }

    static addWeld(mesh, threshold = 0.01) {
        // Weld modifier - merge nearby vertices
        if (mesh.geometry) {
            const positions = mesh.geometry.attributes.position.array;
            const merged = [];
            
            for (let i = 0; i < positions.length; i += 3) {
                let found = false;
                for (let j = 0; j < merged.length; j += 3) {
                    const dist = Math.sqrt(
                        Math.pow(positions[i] - merged[j], 2) +
                        Math.pow(positions[i + 1] - merged[j + 1], 2) +
                        Math.pow(positions[i + 2] - merged[j + 2], 2)
                    );
                    if (dist < threshold) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    merged.push(positions[i], positions[i + 1], positions[i + 2]);
                }
            }
        }
    }

    static addSolidify(mesh, thickness = 0.1) {
        // Solidify modifier - make hollow surface solid
        const modifier = {
            type: 'solidify',
            thickness: thickness
        };
        mesh.userData.modifiers = mesh.userData.modifiers || [];
        mesh.userData.modifiers.push(modifier);
    }

    static addSmooth(mesh, strength = 0.5) {
        // Smooth modifier
        const modifier = {
            type: 'smooth',
            strength: strength
        };
        mesh.userData.modifiers = mesh.userData.modifiers || [];
        mesh.userData.modifiers.push(modifier);
    }
}

// メッシュ操作ツール
class MeshTools {
    static selectEdges(mesh) {
        if (!mesh.geometry) return;
        mesh.userData.selectMode = 'edge';
    }

    static selectFaces(mesh) {
        if (!mesh.geometry) return;
        mesh.userData.selectMode = 'face';
    }

    static selectVertices(mesh) {
        if (!mesh.geometry) return;
        mesh.userData.selectMode = 'vertex';
    }

    static extrude(mesh, amount = 1) {
        // Extrude selected faces/vertices
        if (!mesh.geometry) return;
        mesh.userData.operation = {
            type: 'extrude',
            amount: amount
        };
    }

    static inset(mesh, amount = 0.1) {
        // Inset selected faces
        if (!mesh.geometry) return;
        mesh.userData.operation = {
            type: 'inset',
            amount: amount
        };
    }

    static loopCut(mesh, position = 0.5) {
        // Add edge loop
        if (!mesh.geometry) return;
        mesh.userData.operation = {
            type: 'loopcut',
            position: position
        };
    }

    static bevel(mesh, amount = 0.1) {
        // Bevel edges
        if (!mesh.geometry) return;
        mesh.userData.operation = {
            type: 'bevel',
            amount: amount
        };
    }

    static delete(mesh, mode = 'vertex') {
        // Delete selected vertices/edges/faces
        if (!mesh.geometry) return;
        mesh.userData.operation = {
            type: 'delete',
            mode: mode
        };
    }

    static merge(mesh, threshold = 0.001) {
        // Merge vertices
        if (!mesh.geometry) return;
        mesh.userData.operation = {
            type: 'merge',
            threshold: threshold
        };
    }
}

// アニメーション&キーフレーム
class AnimationController {
    constructor(scene) {
        this.scene = scene;
        this.mixer = null;
        this.actions = [];
        this.currentFrame = 0;
        this.totalFrames = 250;
        this.fps = 24;
        this.isPlaying = false;
    }

    setupMixer() {
        if (!this.mixer) {
            this.mixer = new THREE.AnimationMixer(this.scene);
        }
    }

    setKeyframe(object, frame, property, value) {
        // オブジェクトのキーフレームを設定
        if (!object.userData.keyframes) {
            object.userData.keyframes = {};
        }
        if (!object.userData.keyframes[frame]) {
            object.userData.keyframes[frame] = {};
        }
        object.userData.keyframes[frame][property] = value;
    }

    getKeyframe(object, frame, property) {
        if (!object.userData.keyframes || !object.userData.keyframes[frame]) {
            return null;
        }
        return object.userData.keyframes[frame][property];
    }

    interpolate(frame, object) {
        // フレーム間の値を補間
        const keyframes = object.userData.keyframes;
        if (!keyframes) return;

        let prevFrame = 0;
        let nextFrame = this.totalFrames;

        for (const f in keyframes) {
            const frameNum = parseInt(f);
            if (frameNum <= frame && frameNum > prevFrame) {
                prevFrame = frameNum;
            }
            if (frameNum >= frame && frameNum < nextFrame) {
                nextFrame = frameNum;
            }
        }

        if (prevFrame === nextFrame) return;

        const t = (frame - prevFrame) / (nextFrame - prevFrame);
        const prevData = keyframes[prevFrame];
        const nextData = keyframes[nextFrame];

        for (const prop in prevData) {
            if (nextData[prop] !== undefined) {
                const interpolated = this.lerp(prevData[prop], nextData[prop], t);
                this.applyProperty(object, prop, interpolated);
            }
        }
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    applyProperty(object, prop, value) {
        if (prop.startsWith('position')) {
            const axis = prop.split('.')[1];
            object.position[axis] = value;
        } else if (prop.startsWith('rotation')) {
            const axis = prop.split('.')[1];
            object.rotation[axis] = value;
        } else if (prop.startsWith('scale')) {
            const axis = prop.split('.')[1];
            object.scale[axis] = value;
        }
    }

    play() {
        this.isPlaying = true;
    }

    pause() {
        this.isPlaying = false;
    }

    stop() {
        this.isPlaying = false;
        this.currentFrame = 0;
    }

    update() {
        if (this.isPlaying) {
            this.currentFrame++;
            if (this.currentFrame >= this.totalFrames) {
                this.currentFrame = 0;
            }

            // すべてのオブジェクトにキーフレームを適用
            this.scene.children.forEach(obj => {
                if (obj.userData.keyframes) {
                    this.interpolate(this.currentFrame, obj);
                }
            });
        }
    }
}

// パーティクルシステム
class ParticleSystem {
    constructor(scene, emitterPosition, count = 1000) {
        this.scene = scene;
        this.particles = [];
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            sizeAttenuation: true
        });

        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = emitterPosition.x + (Math.random() - 0.5);
            positions[i * 3 + 1] = emitterPosition.y + (Math.random() - 0.5);
            positions[i * 3 + 2] = emitterPosition.z + (Math.random() - 0.5);
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
    }

    update() {
        const positions = this.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 0.01; // 落下
        }
        this.geometry.attributes.position.needsUpdate = true;
    }
}

// ペイント/テクスチャツール
class TexturePainter {
    constructor(object) {
        this.object = object;
        this.brushSize = 0.1;
        this.brushStrength = 0.5;
        this.brushColor = new THREE.Color(0xffffff);
    }

    setBrushSize(size) {
        this.brushSize = size;
    }

    setBrushColor(color) {
        this.brushColor.setHex(color);
    }

    paint(point) {
        // テクスチャペイント処理
        if (!this.object.material.map) {
            // テクスチャキャンバスを作成
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1024, 1024);

            const texture = new THREE.CanvasTexture(canvas);
            this.object.material.map = texture;
        }

        // ペイント処理
        const canvas = this.object.material.map.image;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + this.brushColor.getHexString();
        ctx.fillRect(
            point.x * canvas.width - this.brushSize * 50,
            point.y * canvas.height - this.brushSize * 50,
            this.brushSize * 100,
            this.brushSize * 100
        );
        this.object.material.map.needsUpdate = true;
    }
}

// グローバル関数として公開
function addModifier(type) {
    if (!blenderWeb.selectedObject) return;
    
    switch(type) {
        case 'subdivision':
            MeshModifier.addSubdivisionSurface(blenderWeb.selectedObject);
            break;
        case 'bevel':
            MeshModifier.addBevel(blenderWeb.selectedObject);
            break;
        case 'mirror':
            MeshModifier.addMirror(blenderWeb.selectedObject);
            break;
        case 'solidify':
            MeshModifier.addSolidify(blenderWeb.selectedObject);
            break;
        case 'smooth':
            MeshModifier.addSmooth(blenderWeb.selectedObject);
            break;
    }
    console.log('Modifier added:', type);
}
