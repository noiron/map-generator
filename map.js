// Forked from: http://jsdo.it/zz85/7jWa
// Licensed under MIT License

var Boid = function(x, y, angle) {

    // 使用three.js中的向量来表示
    this.start = new THREE.Vector2(x, y);
    this.end = new THREE.Vector2(x, y);

    // 在初始角度上偏转一个随机角度
    this.angle = Math.pow(Math.random(), 20) + angle;
    this.dx = Math.cos(this.angle);
    this.dy = Math.sin(this.angle);

    // distance指的是当前这条路径的长度
    this.distance = 0;
    this.fillStyle = "#000000";

    this.dead = false;

    var me = this;

    this.update = function() {
        context.strokeStyle = this.fillStyle;
        context.beginPath();
        context.moveTo(x, y);

        this.distance += 2;
        x = this.start.x + this.distance * this.dx;
        y = this.start.y + this.distance * this.dy;
        this.end.set(x, y);

        var deathPoint;

        // 判断在所有的路径中是否出现相交
        all_boids.forEach(function(b) {
            if (me.dead) return;
            if (b == me) return;

            var its = intersection(me, b);
            // 如果出现相交情况
            if (its) {
                if (b.parent && b.parent == me) return;
                else if (me.parent && me.parent == b) return;
                else if (b.collides && b.collides == me) return;
                else {
                    me.collides = b;
                    me.kill();

                    deathPoint = its;
                }
            }
        });

        // 如果me死亡，则画线时应该以me.end为终点，而不是之前赋值的(x,y)，否则可能会画出头
        if (me.dead) {
            me.end = deathPoint;
            context.lineTo( me.end.x, me.end.y );
            context.stroke();
        } else {
            context.lineTo( x, y );
            context.stroke();
        }
    };

    this.kill = function() {
        boids.splice(boids.indexOf(this), 1);
        this.dead = true;
    }
};


function intersection(boid1, boid2) {

    var x1 = boid1.start.x, x2 = boid1.end.x, x3 = boid2.start.x, x4 = boid2.end.x;
    var y1 = boid1.start.y, y2 = boid1.end.y, y3 = boid2.start.y, y4 = boid2.end.y;

    var dem = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (dem == 0 ) return;  // lines are parrallel
    var ua_num = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    var ub_num = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

    var ua = ua_num / dem;
    var ub = ub_num / dem;

    // if ua_num == 0 && ub_num == 0 // lines are the same
    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        var x = x1 + ua * (x2 - x1);
        var y = y1 + ua * (y2 - y1);
        var v = new THREE.Vector2( x, y );
        v.ua = ua;
        v.ub = ub;

        return v;
    }

}

var width = window.innerWidth;
var height = window.innerHeight;

var canvas = document.getElementById( 'city' );
canvas.width = width;
canvas.height = height;

var context = canvas.getContext( '2d' );

// boids中存放当前存活的元素，一个boid代表一条路
var boids = [];
// all_boids存放所有（包括存活和死亡）的元素
var all_boids = [];

// 创建四个元素来表示画面的边框
var b1 = new Boid();
var b2 = new Boid();
var b3 = new Boid();
var b4 = new Boid();

b1.dead = b2.dead = b3.dead = b4.dead = true;

b1.start.set(0, 0);
b2.start.set(width, 0);
b3.start.set(width, height);
b4.start.set(0, height);

b1.end = b2.start;
b2.end = b3.start;
b3.end = b4.start;
b4.end = b1.start;

all_boids.push(b1);
all_boids.push(b2);
all_boids.push(b3);
all_boids.push(b4);

// 创建第一个boid，坐标在画面的中间
var b = new Boid(width/2, height/2, Math.random() * 2 * Math.PI);
boids.push(b);
all_boids.push(b);

// 每隔固定时间间隔进行处理
var run = setInterval(function() {

    var i = boids.length;

    // 如果当前没有存活的boid，则退出循环处理
    if (i == 0) {
        clearInterval(run);

        // 对all_boids数组进行遍历，将所有路径的起点画成绿色，终点画成红色
        //all_boids.forEach(function(b) {
        //    context.fillStyle = 'green';
        //    context.beginPath();
        //    context.arc(b.start.x, b.start.y, 2, 0, 2*Math.PI);
        //    context.fill();
        //    context.closePath();
        //
        //    context.fillStyle = 'red';
        //    context.beginPath();
        //    context.arc(b.end.x, b.end.y, 2, 0, 2*Math.PI);
        //    context.fill();
        //    context.closePath();
        //});
    }

    // 遍历所有存活的boid，更新状态，满足条件的情况下生成子代
    for (i = 0; i < boids.length; i++) {
        var b = boids[i];
        b.update();

        // 产生子代的几个条件：
        // 1. 没有死亡
        // 2. 只有0.1的概率产生子代
        // 3. 当前所有存活元素的数量小于50
        if (!b.dead && Math.random()>0.9 && boids.length < 50) {
            var child = new Boid(b.end.x, b.end.y,
                b.angle + Math.PI * (Math.random() > 0.5 ? 0.5 : -0.5));
            child.parent = b;
           // child.fillStyle = getRndColor();
            boids.push(child);
            all_boids.push(child);
        }
    }

}, 1000/60);

function getRndColor() {
    var r = 255*Math.random()|0,
        g = 255*Math.random()|0,
        b = 255*Math.random()|0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}






















