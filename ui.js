// UI Management
function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    const allMenus = document.querySelectorAll('.context-menu');
    
    allMenus.forEach(m => m.style.display = 'none');
    
    if (menu.style.display === 'none') {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

function switchTab(tabName) {
    // タブ切り替え
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function selectObject(name) {
    const obj = blenderWeb.objects.find(o => o.name === name);
    if (obj) {
        blenderWeb.selectObject(obj);
    }
}

function setTransformMode(mode) {
    blenderWeb.setTransformMode(mode);
}

function setShadeMode(mode) {
    blenderWeb.setShadeMode(mode);
}

function toggleXray() {
    blenderWeb.toggleXray();
}

function fitAll() {
    blenderWeb.fitAll();
}

function updateTransform() {
    blenderWeb.updateTransform();
}

function updateMaterial() {
    blenderWeb.updateMaterial();
}

function addObject(type) {
    blenderWeb.addObject(type);
}

function deleteSelected() {
    blenderWeb.deleteSelected();
}

function duplicateSelected() {
    blenderWeb.duplicateSelected();
}

function addModifier(type) {
    console.log('Add modifier:', type);
    // モディファイアー追加ロジック
}

function undo() {
    blenderWeb.undo();
}

function redo() {
    blenderWeb.redo();
}

function toggleEditMode() {
    console.log('Toggle edit mode');
}

function applyTransforms() {
    if (!blenderWeb.selectedObject) return;
    blenderWeb.selectedObject.geometry.translate(
        blenderWeb.selectedObject.position.x,
        blenderWeb.selectedObject.position.y,
        blenderWeb.selectedObject.position.z
    );
    blenderWeb.selectedObject.position.set(0, 0, 0);
}

function setSmoothShading() {
    if (!blenderWeb.selectedObject) return;
    if (blenderWeb.selectedObject.geometry) {
        blenderWeb.selectedObject.geometry.computeVertexNormals();
        blenderWeb.selectedObject.material.flatShading = false;
    }
}

function setFlatShading() {
    if (!blenderWeb.selectedObject) return;
    if (blenderWeb.selectedObject.geometry) {
        blenderWeb.selectedObject.material.flatShading = true;
    }
}

function newProject() {
    if (confirm('Create new project? Current changes will be lost.')) {
        location.reload();
    }
}

function openProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                loadProjectData(data);
            } catch (err) {
                alert('Failed to load project: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function saveProject() {
    const projectData = {
        version: '1.0',
        scene: blenderWeb.scene.toJSON(),
        objects: blenderWeb.objects.map(obj => ({
            name: obj.name,
            type: obj.userData.type,
            position: obj.position,
            rotation: obj.rotation,
            scale: obj.scale,
            material: obj.material ? obj.material.toJSON() : null
        }))
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blender-project-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function exportProject() {
    const format = prompt('Export format (gltf/obj/fbx):', 'gltf');
    if (!format) return;
    
    alert(`Export to ${format} coming soon!`);
    // Export logic would go here
}

function loadProjectData(data) {
    console.log('Loading project:', data);
    // Project loading logic
}

function showHelp() {
    alert(`
Blender Web - Keyboard Shortcuts
================================
G - Move (Transform Mode)
R - Rotate
S - Scale
X - Toggle X-Ray
Z - Solid Shading
Shift+Z - Rendered Mode
Alt+Z - X-Ray Toggle
Delete - Delete Selected
Shift+D - Duplicate
Ctrl+Z - Undo
Ctrl+Shift+Z - Redo
A - Select All
Home - Frame All
Mouse Wheel - Zoom
Right Click + Drag - Rotate View
    `);
}

function showAbout() {
    alert(`
Blender Web v1.0
A web-based 3D modeling tool
Built with Three.js
================================
Created for web-based 3D creation
Features:
- Full 3D modeling capabilities
- Real-time rendering
- Material editing
- Object manipulation
- Scene management
    `);
}

// 秒単位でフレームを更新
document.getElementById('timeline-slider').addEventListener('input', (e) => {
    const frame = parseInt(e.target.value);
    document.getElementById('frame-display').textContent = 'Frame: ' + frame;
});

// メニュー外をクリックで閉じる
document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-item') && !e.target.closest('.menu-bar')) {
        document.querySelectorAll('.context-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});
