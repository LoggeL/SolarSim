
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log("Scene module loaded");

class SolarScene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
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

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.target.set(0, 2, 0);

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

        // Handle Resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
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
        // A simple way to make a prism roof is 4-sided Cylinder(cone) with 2 height segments?
        // Or just a scaled Cone.
        // Let's use a group of planes or shapes.
        // Or BufferGeometry.
        // Let's use ConeGeometry(radius, height, 4) rotated 45deg.
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
        // Place on the South side of the roof.
        // Cone geometry side angle?
        // atan(height/radius) -> atan(4/8) roughly.
        // Let's just place a plane at the approximate angle.
        const panelGroup = new THREE.Group();
        // Roof slope angle
        // height 2, radius ~5.6 (8*0.707).
        // Let's eyeball it: ~30 deg?
        // Actually, let's just put it on top of the roof mesh.

        const panelGeo = new THREE.PlaneGeometry(6, 3);
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x1e3a8a,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x000000,
            emissiveIntensity: 0.5
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);

        // Position on the "South" face (Z+)
        // Roof peak is at y=8. Side goes down to y=6 at z=4.
        // Midpoint: y=7, z=2.
        // Rotation: Slopes down towards Z.
        panel.position.set(0, 7.2, 2.2);
        panel.rotation.x = -Math.PI / 4; // 45 deg slope

        panelGroup.add(panel);
        houseGroup.add(panelGroup);
        this.panels.push(panel); // Store for animation

        this.house = houseGroup;
        this.scene.add(this.house);
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
        this.batteryLevelMesh.position.set(0, 0.5, 0.52); // Start at bottom of indicator area
        // We will scale Y and move Y to animate
        group.add(this.batteryLevelMesh);

        group.position.set(6, 0, 2); // Side of house
        this.scene.add(group);
        this.batteryMesh = group;
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
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // API for App
    updateState(data) {
        // data expected:
        // {
        //   hour: number (0-24),
        //   solar_w: number,
        //   batt_soc: number (0-100),
        //   ev_w: number,
        //   grid_import: number,
        //   grid_export: number
        // }

        if (!data) return;

        // 1. Sun Position
        // Zenith at 12:00.
        // 06:00 Rise, 18:00 Set.
        // Map hour to angle.
        // 12 -> 90 deg (Top)
        // 6 -> 0 deg (Horizon East)
        // 18 -> 180 deg (Horizon West)

        // Angle in radians.
        // Let's cycle it: 0h = -90deg (Night), 12h = 90deg (Noon).
        // (hour - 6) * 15 deg?
        // 0h -> -90
        // 6h -> 0
        // 12h -> 90
        // 18h -> 180
        // 24h -> 270 (-90)

        const angle = (data.hour - 6) * (Math.PI / 12); // -PI/2 to 3PI/2
        const radius = 80;
        const sunX = Math.cos(-angle) * radius; // Invert angle for correct East-West motion
        const sunY = Math.sin(-angle) * radius;

        if (sunY > -10) {
            this.sunLight.intensity = Math.max(0, Math.sin(-angle) * 1.5);
            this.scene.background.setHSL(0.6, 0.5, Math.max(0.05, Math.sin(-angle) * 0.5 + 0.1));
        } else {
            this.sunLight.intensity = 0;
            this.scene.background.setHSL(0.6, 0.5, 0.05); // Night
        }

        this.sunLight.position.set(sunX, Math.max(sunY, -10), 0); // Keep from going too low
        this.sunMesh.position.copy(this.sunLight.position);

        // 2. Battery SOC
        // Bar height max 2.5 (bg is 2.5).
        // Start pos y = 0.25 (inside bg).
        const soc = data.batt_soc / 100;
        const maxH = 2.4;
        const h = maxH * soc;
        this.batteryLevelMesh.scale.y = Math.max(0.01, h); // Scale height
        // Since geometry is centered, we need to move it too?
        // BoxGeometry(0.5, 1, 0.1). Height is 1.
        // If scale.y = h, height is h.
        // Position should be base + h/2.
        // Base of container is 1.5 - 1.25 = 0.25.
        // Let's simplify: Set scale and position.
        // Default height 1. Center at 0.5. Base at 0.
        // We want base at (BatteryGroup Y + 0.25).
        // BatteryGroup IndBack center is 1.5. Height 2.5. Base is 1.5 - 1.25 = 0.25.
        // So Bar base should be 0.25.
        this.batteryLevelMesh.position.y = 0.25 + (h / 2 * 1); // 1 is base geometry height
        this.batteryLevelMesh.scale.y = h;

        // Color: Green if high, Red if low
        this.batteryLevelMesh.material.color.setHSL(soc * 0.3, 1, 0.5); // 0=Red, 0.3=Green

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
    }
}

// Attach to window
window.Solar3D = new SolarScene();
