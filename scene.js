
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

console.log("Scene module loaded");

class SolarScene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.labelRenderer = null;
        this.controls = null;

        // Objects
        this.house = null;
        this.panels = [];
        this.batteryMesh = null;
        this.batteryLevelMesh = null;
        this.evMesh = null;
        this.evStatusLight = null;

        this.sunLight = null;
        this.ambientLight = null;
        this.sunMesh = null; // Visible sun sphere

        // Labels
        this.labels = {
            solar: null,
            battery: null,
            ev: null,
            load: null,
            grid: null
        };

        this.init();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 150);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 15, 30);
        this.camera.lookAt(0, 5, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Label Renderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through
        this.container.appendChild(this.labelRenderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.target.set(0, 2, 0);
        // Important: Controls are attached to WebGL canvas, but label layer is on top.
        // We need to attach listeners to label renderer or make label renderer pass events.
        // Actually OrbitControls attaches to domElement.
        // Since labelRenderer is on top, we should attach controls to labelRenderer.domElement OR make labelRenderer pointer-events: none.
        // I set pointer-events: none on labelRenderer above, so events go to WebGL canvas. Good.

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(50, 50, 0);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.scene.add(this.sunLight);

        // Visible Sun Sphere
        const sunGeo = new THREE.SphereGeometry(2, 16, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sunMesh);

        // Ground
        const groundGeo = new THREE.CircleGeometry(100, 64);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 1 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        this.createHouse();
        this.createBattery();
        this.createEV();
        this.createGrid();

        // Handle Resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createLabel(title, cssClass) {
        const div = document.createElement('div');
        div.className = `label-container ${cssClass}`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'label-title';
        titleDiv.textContent = title;
        div.appendChild(titleDiv);

        const valueDiv = document.createElement('div');
        valueDiv.className = 'label-value';
        valueDiv.textContent = '--';
        div.appendChild(valueDiv);

        return {
            element: div,
            valueElement: valueDiv,
            object: new CSS2DObject(div)
        };
    }

    createHouse() {
        const houseGroup = new THREE.Group();

        // Main Body
        const bodyGeo = new THREE.BoxGeometry(10, 6, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 3;
        body.castShadow = true;
        body.receiveShadow = true;
        houseGroup.add(body);

        // Roof (Prism)
        const roofHeight = 4;
        const roofGeo = new THREE.ConeGeometry(8, roofHeight, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 6 + (roofHeight / 2);
        roof.rotation.y = Math.PI / 4;
        roof.scale.set(1, 1, 0.8); // Flatten width to match house aspect
        roof.castShadow = true;
        houseGroup.add(roof);

        // Solar Panels
        const panelGroup = new THREE.Group();
        const panelGeo = new THREE.PlaneGeometry(6, 3);
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x1e3a8a,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x000000,
            emissiveIntensity: 0.5
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);

        panel.position.set(0, 7.2, 2.2);
        panel.rotation.x = -Math.PI / 4; // 45 deg slope

        panelGroup.add(panel);
        houseGroup.add(panelGroup);
        this.panels.push(panel);

        this.house = houseGroup;
        this.scene.add(this.house);

        // Labels
        // Solar Label
        this.labels.solar = this.createLabel('Solar', 'label-solar');
        this.labels.solar.object.position.set(0, 9, 2);
        houseGroup.add(this.labels.solar.object);

        // Load Label
        this.labels.load = this.createLabel('House Load', 'label-load');
        this.labels.load.object.position.set(0, 3, 5); // Front of house
        houseGroup.add(this.labels.load.object);
    }

    createBattery() {
        const group = new THREE.Group();

        // Casing
        const caseGeo = new THREE.BoxGeometry(2, 3, 1);
        const caseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const casing = new THREE.Mesh(caseGeo, caseMat);
        casing.position.y = 1.5;
        casing.castShadow = true;
        group.add(casing);

        // Level Indicator Background
        const indBackGeo = new THREE.BoxGeometry(0.5, 2.5, 0.1);
        const indBackMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const indBack = new THREE.Mesh(indBackGeo, indBackMat);
        indBack.position.set(0, 1.5, 0.51);
        group.add(indBack);

        // Level Bar (Green)
        const barGeo = new THREE.BoxGeometry(0.5, 1, 0.1);
        const barMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        this.batteryLevelMesh = new THREE.Mesh(barGeo, barMat);
        this.batteryLevelMesh.position.set(0, 0.5, 0.52);
        group.add(this.batteryLevelMesh);

        group.position.set(6, 0, 2); // Side of house
        this.scene.add(group);
        this.batteryMesh = group;

        // Battery Label
        this.labels.battery = this.createLabel('Battery', 'label-batt');
        this.labels.battery.object.position.set(0, 4, 0);
        group.add(this.labels.battery.object);
    }

    createEV() {
        const group = new THREE.Group();

        // Car Body
        const bodyGeo = new THREE.BoxGeometry(4.5, 1.5, 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1;
        body.castShadow = true;
        group.add(body);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(2.5, 1, 1.8);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(-0.5, 2.25, 0);
        cabin.castShadow = true;
        group.add(cabin);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });

        const positions = [
            [-1.5, 0.6, 1],
            [1.5, 0.6, 1],
            [-1.5, 0.6, -1],
            [1.5, 0.6, -1]
        ];

        positions.forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.x = Math.PI / 2;
            w.position.set(...pos);
            group.add(w);
        });

        // Charging Indicator (Light)
        const lightGeo = new THREE.SphereGeometry(0.2);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.evStatusLight = new THREE.Mesh(lightGeo, lightMat);
        this.evStatusLight.position.set(-2.2, 1.5, 0.8); // Rear/Side
        this.evStatusLight.visible = false;
        group.add(this.evStatusLight);

        group.position.set(-8, 0, 4);
        group.rotation.y = Math.PI / 6;
        this.scene.add(group);
        this.evMesh = group;

        // EV Label
        this.labels.ev = this.createLabel('EV Charging', 'label-ev');
        this.labels.ev.object.position.set(0, 3, 0);
        group.add(this.labels.ev.object);
    }

    createGrid() {
        // Simple representation of Grid connection (e.g., a power pole or just a point in space)
        const group = new THREE.Group();

        const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 4;
        group.add(pole);

        const crossGeo = new THREE.BoxGeometry(3, 0.2, 0.2);
        const cross = new THREE.Mesh(crossGeo, poleMat);
        cross.position.y = 7;
        group.add(cross);

        group.position.set(-15, 0, -10);
        this.scene.add(group);

        // Grid Label
        this.labels.grid = this.createLabel('Grid Net', 'label-grid');
        this.labels.grid.object.position.set(0, 8.5, 0);
        group.add(this.labels.grid.object);

        // Wire to house?
        // Let's draw a line?
        // For now, keep it simple.
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }

    // API for App
    updateState(data) {
        if (!data) return;

        // 1. Sun Position
        const angle = (data.hour - 6) * (Math.PI / 12); // -PI/2 to 3PI/2
        const radius = 80;
        const sunX = Math.cos(angle) * radius;
        const sunY = Math.sin(angle) * radius;

        if (sunY > -10) {
            this.sunLight.intensity = Math.max(0, Math.sin(angle) * 1.5);
            this.scene.background.setHSL(0.6, 0.5, Math.max(0.05, Math.sin(angle) * 0.5 + 0.1));
        } else {
            this.sunLight.intensity = 0;
            this.scene.background.setHSL(0.6, 0.5, 0.05); // Night
        }

        this.sunLight.position.set(sunX, Math.max(sunY, -10), 0);
        this.sunMesh.position.copy(this.sunLight.position);

        // 2. Battery SOC
        const soc = data.batt_soc / 100;
        const maxH = 2.4;
        const h = maxH * soc;
        this.batteryLevelMesh.scale.y = Math.max(0.01, h);
        this.batteryLevelMesh.position.y = 0.25 + (h / 2 * 1);
        this.batteryLevelMesh.material.color.setHSL(soc * 0.3, 1, 0.5);

        // 3. EV Charging
        if (data.ev_w > 100) {
            this.evStatusLight.visible = true;
            const blink = Date.now() % 1000 < 500;
            this.evStatusLight.material.color.setHex(blink ? 0x00ff00 : 0x004400);
        } else {
            this.evStatusLight.visible = false;
        }

        // 4. Solar Panels Emission
        if (data.solar_w > 100) {
             const intensity = Math.min(1, data.solar_w / 5000);
             this.panels.forEach(p => {
                 p.material.emissive.setHex(0xffff00);
                 p.material.emissiveIntensity = intensity * 0.5;
             });
        } else {
            this.panels.forEach(p => {
                p.material.emissive.setHex(0x000000);
            });
        }

        // 5. Update Labels
        this.updateLabel(this.labels.solar, data.solar_w, 'W');
        this.updateLabel(this.labels.battery, Math.round(data.batt_soc), '%');
        this.updateLabel(this.labels.ev, data.ev_w, 'W');

        // Grid Net: Import (red) - Export (Green, but shown as neg grid usage usually?)
        // Let's show:
        // Import > 0: "Import: 500 W" (Red)
        // Export > 0: "Export: 1200 W" (Green)
        const gridNet = data.grid_import - data.grid_export;
        if (gridNet > 10) {
             this.labels.grid.valueElement.textContent = `Import ${Math.round(gridNet)} W`;
             this.labels.grid.valueElement.style.color = 'var(--color-grid)'; // Red
        } else if (gridNet < -10) {
             this.labels.grid.valueElement.textContent = `Export ${Math.round(-gridNet)} W`;
             this.labels.grid.valueElement.style.color = '#22c55e'; // Green
        } else {
             this.labels.grid.valueElement.textContent = `0 W`;
             this.labels.grid.valueElement.style.color = 'white';
        }

        // House Load (Total consumption excluding EV?)
        // data usually has 'final_load' which includes EV and HP.
        // Let's show total load.
        // Or separation?
        // Let's show total load on house.
        // Calculating total load from available data:
        // In app.js: updateState receives data object.
        // We might need to ensure 'final_load' or similar is passed.
        // Currently app.js passes: hour, solar_w, batt_soc, ev_w, grid_import, grid_export.
        // It does NOT pass load.
        // We can infer load = solar + battery_discharge + grid_import - grid_export - battery_charge.
        // Or better, update app.js to pass load.

        // For now, I'll update app.js to pass 'load_w'.
        if (data.load_w !== undefined) {
             this.updateLabel(this.labels.load, data.load_w, 'W');
        }
    }

    updateLabel(labelObj, value, unit) {
        if (!labelObj) return;
        labelObj.valueElement.textContent = `${Math.round(value)} ${unit}`;
    }
}

// Attach to window
window.Solar3D = new SolarScene();
