import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

// DOM がパースされたことを検出するイベントで App3 クラスをインスタンス化する
window.addEventListener('DOMContentLoaded', () => {
    const app = new App3();
    app.load()
    .then(() => {
        app.init();
        app.render();
    });
}, false);

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
    /**
     * カメラ定義のための定数
     */
    static get CAMERA_PARAM() {
        return {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 100.0,
        x: 0.0,
        y: 4.0,
        z: 44.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
        };
    }

    /**
     * レンダラー定義のための定数
     */
    static get RENDERER_PARAM() {
        return {
        clearColor: 0xffffff,
        width: window.innerWidth,
        height: window.innerHeight,
        };
    }

    /**
     * ディレクショナルライト定義のための定数
     */
    static get DIRECTIONAL_LIGHT_PARAM() {
        return {
        color: 0xffffff,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0,
        };
    }

    /**
     * アンビエントライト定義のための定数
     */
    static get AMBIENT_LIGHT_PARAM() {
        return {
        color: 0xffffff,
        intensity: 0.2,
        };
    }

    /**
     * コンストラクタ
     * @constructor
     */
    constructor() {
        this.renderer;         // レンダラ
        this.scene;            // シーン
        this.camera;           // カメラ
        this.directionalLight; // ディレクショナルライト
        this.ambientLight;     // アンビエントライト
        this.controls;         // オービットコントロール
        this.axesHelper;       // 軸ヘルパー
        this.plane;            // 板ポリゴン
        this.group;            // グループ

        this.startMouseX = 0;

        // 再帰呼び出しのための this 固定
        this.render = this.render.bind(this);

        // リサイズイベント
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }, false);
    }

    /**
     * アセット（素材）のロードを行う Promise
     */
    load() {
        return new Promise((resolve) => {
        // 読み込むファイルのパス
        // const imgPath = '';
        // const loader = new THREE.TextureLoader();
        // loader.load(imgPath, (img) => {
        //     // あとで使えるようにプロパティに代入しておく
        //     this.img = img;
        //     resolve();
        // });
        resolve();
        });
    }

    /**
     * 初期化処理
     */
    init() {
        // レンダラー
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
        this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
        const wrapper = document.querySelector('#webgl');
        wrapper.appendChild(this.renderer.domElement);

        // シーン
        this.scene = new THREE.Scene();

            // カメラ
        this.camera = new THREE.PerspectiveCamera(
            App3.CAMERA_PARAM.fovy,
            App3.CAMERA_PARAM.aspect,
            App3.CAMERA_PARAM.near,
            App3.CAMERA_PARAM.far,
        );

        this.camera.position.set(
            App3.CAMERA_PARAM.x,
            App3.CAMERA_PARAM.y,
            App3.CAMERA_PARAM.z,
        );
        this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

        // ディレクショナルライト（平行光源）
        this.directionalLight = new THREE.DirectionalLight(
            App3.DIRECTIONAL_LIGHT_PARAM.color,
            App3.DIRECTIONAL_LIGHT_PARAM.intensity
        );
        this.directionalLight.position.set(
            App3.DIRECTIONAL_LIGHT_PARAM.x,
            App3.DIRECTIONAL_LIGHT_PARAM.y,
            App3.DIRECTIONAL_LIGHT_PARAM.z,
        );

        // アンビエントライト（環境光）
        this.ambientLight = new THREE.AmbientLight(
            App3.AMBIENT_LIGHT_PARAM.color,
            App3.AMBIENT_LIGHT_PARAM.intensity,
        );

        // コントロール
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // ヘルパー
        const axesBarLength = 5.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        this.scene.add(this.axesHelper);

        // group
        this.group = new THREE.Group();

        // レンダリング結果を可視化するのに、板ポリゴンを使う @@@
        const planeGeometry = new THREE.PlaneGeometry(16.0, 9.0);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        const PLANE_LENGTH = 36;
        const RADIUS = 40; // 円の半径

        for (let i = 0; i < PLANE_LENGTH; i++) {
            const angle = (i / PLANE_LENGTH) * Math.PI * 2; // 角度を計算

            // 新しい板ポリゴンインスタンスを作成
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);

            // 板ポリゴンの位置を計算して設定
            const x = RADIUS * Math.sin(angle);
            const z = RADIUS * Math.cos(angle);
            plane.position.set(x, 0.0, z);
            plane.rotation.set(0.0, angle + Math.PI / 2 ,0.0);

            this.group.add(plane);
        }
        this.group.position.set(38.0, 2.0, 0.0);
        this.scene.add(this.group);

        this.startMouseX = 0;
    }


    drug(group) {

        // マウスのドラッグが開始されたときの処理
        function handleMouseDown(event) {
            this.startMouseX = event.clientX;

            // ドラッグ中のマウスの移動を監視
            window.addEventListener('mousemove', handleMouseMove);

            // ドラッグが終了したときの処理
            window.addEventListener('mouseup', handleMouseUp);
        }

        // マウスの移動ごとに呼ばれる処理
        function handleMouseMove(event) {
            const mouseX = event.clientX;
            const mouseDeltaX = mouseX - startMouseX;

            // groupを回転させる
            const rotationY = mouseDeltaX * 0.01; // 回転量は適宜調整してください
            group.rotation.y += rotationY;

            // ドラッグ開始位置を更新
            startMouseX = mouseX;
        }

        // ドラッグが終了したときの処理
        function handleMouseUp() {
            // ドラッグ中のマウスの移動監視を解除
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        // ドラッグイベントを監視するためにマウスのダウンイベントを追加する
        window.addEventListener('mousedown', handleMouseDown);
    }


    /**
     * 描画処理
     */
    render() {
        requestAnimationFrame(this.render);
        this.drug(this.group);
        this.renderer.render(this.scene, this.camera);
    }
}