const TAKEOUTERROR_FULL = new Error("InstanceManager could not find free instance !");

var lut = [];
for (var i = 0; i < 256; i++) {
    lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
}

function e7() {
    var d0 = Math.random() * 0xffffffff | 0;
    var d1 = Math.random() * 0xffffffff | 0;
    var d2 = Math.random() * 0xffffffff | 0;
    var d3 = Math.random() * 0xffffffff | 0;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
        lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
        lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
        lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}
class InstanceManager {
    constructor(geometry, material, count) {
        this.instances = new THREE.InstancedMesh(
            geometry,
            material,
            count
        )
        this.dummy = new THREE.Matrix4()
        let sc = .1
        this.dummy.makeScale(sc, sc, sc)
        this.nil = new THREE.Matrix4();
        this.nil.compose(new THREE.Vector3(9000, 9000, 9000), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
        for (let i = 0; i < this.instances.count; i++) {
            this.instances.setMatrixAt(i, this.nil)
            this.instances.setColorAt(i, new THREE.Color(app.pearlPalette[Math.floor(Math.random() * app.pearlPalette.length)]))
        }
        app.scene.add(this.instances)
        this.ledger = {}
        this.lendees = {}
        this.takeOutErrors = 0;

    }

    register(owner) {
        /* let id = crypto.randomUUID(); */
        let id = e7()
        this.lendees[id] = owner;
        return id;
    }

    get_owned(id) {
        let owned = []
        for (let key of Object.keys(this.ledger)) {
            if (this.ledger[key].owner == id) owned.push(key);
        }
        return owned;
    }

    borrow(id, position, scale, rotation) {
        /* log("borrowing !") */
        try {
            let i = this.find_free();
            let li = new LedgerItem(id, i);
            this.dummy.compose(position, rotation, scale);
            this.instances.setMatrixAt(i, this.dummy);
            this.ledger[i] = li;
            this.instances.instanceMatrix.needsUpdate = true;
            return i;
        } catch (e) {
            if (this.takeOutErrors % 1000 == 0) console.error(e);
            return -1;
        }
    }

    return (id, index) {
        this.setMatrixAt(index, this.nil);
        delete this.ledger(index);
        this.instances.instanceMatrix.needsUpdate = true;
    }

    return_all(id) {
        let owned = []
        for (let key of Object.keys(this.ledger)) {
            if (this.ledger[key].owner == id) owned.push(key);
        }
        owned.forEach(i => {
            this.instances.setMatrixAt(i, this.nil);
            delete this.ledger[i];
        })
        this.instances.instanceMatrix.needsUpdate = true;
        /* log("returned " + owned.length + " items !") */
    }

    purge() {
        for (let owner of Object.keys(this.lendees)) {
            this.return_all(owner);
        }
    }

    find_free() {
        for (let i = 0; i < this.instances.count; i++) {
            if (!this.ledger[i]) {
                return i;
            }
        }
        this.takeOutErrors++;
        if (this.takeOutErrors % 1000 == 0) console.warn("InstanceManager full!")
        /* throw TAKEOUTERROR_FULL; */
    }

    get_count() {
        let count = 0;
        for (let i = 0; i < this.instances.count; i++) {
            if (this.ledger[i]) count++;
        }
        return count;
    }

    set_color_at(index, color) {
        this.instances.setColorAt(index, color);
    }

    debug_display() {
        let side = Math.cbrt(this.instances.count);
        let dummy = new THREE.Matrix4();
        for (let z = 0; z < side; z++) {
            for (let y = 0; y < side; y++) {
                for (let x = 0; x < side; x++) {
                    let i = side ** 2 * z + side * y + x;
                    dummy.compose(
                        new THREE.Vector3(x, y, z),
                        new THREE.Quaternion(),
                        new THREE.Vector3(1, 1, 1)
                    );
                    this.instances.setMatrixAt(i, dummy)
                }
            }

        }
        this.instances.instanceMatrix.needsUpdate = true;
    }

}

class LedgerItem {
    constructor(owner, index) {
        this.index = index;
        this.owner = owner;
    }
}