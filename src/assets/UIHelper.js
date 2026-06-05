export default class UIHelper {
    static createButtonA(scene, x, y) {
        let container = scene.add.container(x, y);
        
        // 1. Thu nhỏ vòng tròn (bán kính 15 thay vì 20)
        let radius = 15; 
        let circle = scene.make.graphics({ x: 0, y: 0 });
        circle.fillStyle(0xff0000, 1);
        circle.fillCircle(0, 0, radius);
        circle.lineStyle(2, 0x000000, 1);
        circle.strokeCircle(0, 0, radius);
        
        // 2. Thu nhỏ chữ (fontSize 18px thay vì 24px)
        let text = scene.add.text(0, 0, 'A', {
            fontSize: '18px', 
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([circle, text]);
        container.setDepth(2000);
        container.setVisible(false);
        
        return container;
    }
}