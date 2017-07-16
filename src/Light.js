const {SpotLight, Vector2} = require('three');
const {Easing, Events, Trait, Tween} = require('@snakesilk/engine');

class Light extends Trait
{
    constructor()
    {
        super();
        this.NAME = 'light';

        this.EVENT_LAMP_CHANGE = 'lamp_change';

        this.direction = new Vector2();
        this.events = new Events();

        this.lamps = [];
    }
    __timeshift()
    {
        this._updateDirection();
    }
    _updateDirection()
    {
        const host = this._host;

        /* Ensure lights are always in Z front of host no matter rotation. */
        if (host.direction.x !== this.direction.x) {
            this.lamps.forEach(lamp => {
                lamp.setDirection(host.direction.x);
            })
            this.direction.x = host.direction.x;
        }
    }
    _updateScene()
    {
        const host = this._host;
        this.lamps.forEach(lamp => {
            host.model.remove(lamp.light);
            host.model.add(lamp.light);
        });

        if (host.world) {
            host.world.scene.children.forEach(function(mesh) {
                if (mesh.material) {
                    mesh.material.needsUpdate = true;
                }
            });
        }
    }
    _startLamp(lamp)
    {
        if (lamp.state === true) {
            return;
        }
        lamp.state = true;
        const tween = new Tween({intensity: lamp.intensity}, lamp.easeOn);
        tween.addSubject(lamp.light);
        this._host.doFor(lamp.heatUpTime, (elapsed, progress) => {
            tween.update(progress);
        });
    }
    _stopLamp(lamp)
    {
        if (lamp.state === false) {
            return;
        }
        lamp.state = false;
        const tween = new Tween({intensity: 0}, lamp.easeOff);
        tween.addSubject(lamp.light);
        this._host.doFor(lamp.coolDownTime, (elapsed, progress) => {
            tween.update(progress);
        });
    }
    addLamp(light)
    {
        const lamp = new Lamp(light);
        this.lamps.push(lamp);
        return lamp;
    }
    on()
    {
        this._updateScene();
        this.lamps.forEach(lamp => {
            this._startLamp(lamp);
        });
    }
    off()
    {
        this.lamps.forEach(lamp => {
            this._stopLamp(lamp);
        });
    }
}

class Lamp
{
    constructor(light = new SpotLight(0xffffff, 0, 100)) {
        this.light = light;

        this.easeOn = Easing.easeOutElastic();
        this.easeOff = Easing.easeOutQuint();

        this.coolDownTime = 1;
        this.heatUpTime = .8;
        this.intensity = this.light.intensity;

        this.light.intensity = 0;
        this.state = false;
    }
    setDirection(x) {
        const dist = Math.abs(this.light.position.z);
        this.light.position.z = x > 0 ? dist : -dist;
    }
}

Light.Lamp = Lamp;

module.exports = Light;
