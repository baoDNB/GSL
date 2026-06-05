export default class ArrowGraphic {
    // Hàm cũ (mũi tên đứng)
    static createArrow(scene, x, y, color = 0xff0000) {
        let graphics = scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillRect(x - 2.5, y, 5, 10);
        graphics.fillTriangle(x - 7.5, y, x + 7.5, y, x, y - 7.5);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 2.5, y, 5, 10);
        graphics.strokeTriangle(x - 7.5, y, x + 7.5, y, x, y - 7.5);
        return graphics;
    }

    // HÀM MỚI: Mũi tên nằm ngang (chỉ sang phải)
    static createArrowRight(scene, x, y, color = 0xff0000) {
        let graphics = scene.add.graphics();
        graphics.fillStyle(color, 1);

        // Thân ngang: x là điểm đầu bên trái
        graphics.fillRect(x, y - 2.5, 15, 5);

        // Đầu mũi tên (tam giác)
        graphics.fillTriangle(x + 15, y - 7.5, x + 15, y + 7.5, x + 25, y);

        // Viền
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x, y - 2.5, 15, 5);
        graphics.strokeTriangle(x + 15, y - 7.5, x + 15, y + 7.5, x + 25, y);

        return graphics;
    }
    static createArrowDown(scene, x, y, color = 0xff0000) {
        let graphics = scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.lineStyle(2, 0x000000, 1);

        // Thân dọc: x, y là điểm đầu phía trên
        graphics.fillRect(x - 2.5, y, 5, 15);
        graphics.strokeRect(x - 2.5, y, 5, 15);

        // Đầu mũi tên (tam giác chỉ xuống)
        graphics.fillTriangle(
            x - 7.5, y + 15, // Đỉnh trái
            x + 7.5, y + 15, // Đỉnh phải
            x, y + 25        // Mũi nhọn dưới cùng
        );
        graphics.strokeTriangle(
            x - 7.5, y + 15,
            x + 7.5, y + 15,
            x, y + 25
        );

        return graphics;
    }
}