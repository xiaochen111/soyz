import * as d3 from 'd3';
import * as $ from 'jquery';
import { addToList } from './storage.js';
import { battery, onlyOutputBattery } from '../components/bat';
import { relationData } from '../components/content';

//计算bezier曲线点的位置
export function curveTo(x1, y1, x4, y4) {
    x1 = Number(x1);
    y1 = Number(y1);
    x4 = Number(x4);
    y4 = Number(y4);
    var x2, x3;
    if (x1 < x4) {
        x2 = x3 = (x1 + x4) / 2;
    }
    if (x1 >= x4) {
        x2 = x1 + (x1 + x4) / 5;
        x3 = x4 - (x1 + x4) / 5;
    }
    return `M${x1} ${y1} C${x2} ${y1}, ${x3} ${y4}, ${x4} ${y4}`;
}

//生成路径文字
export function pathText(id, texts) {
    // id = outputId + inputId
    const text = d3.select('#svg svg').append('text')
        .attr('id', id)
        .attr('dy', '-5px');
    text.append('textPath')
        .attr('startOffset', '45%')
        .attr('xlink:href', id)
        .text(texts);
    text.append('textPath')
        .style('fill', 'red')
        .attr('startOffset', '40%')
        .attr('class', 'Cut')
        .attr('xlink:href', id)
        .text('X');
}
/**
 * 生成module bat
 */
export function createModuleBat(data) {
    data.devDependencies.forEach(item => {
        const info = addToList(item.id, '', item.name);
        if ($(`#${info.id}`).length === 0) {
            $('#content .module').append(onlyOutputBattery(info));
        }
    })
}
/**
 * 根据数据生成bat
 */
export function reObject(obj, posArr) {
    for (var key in obj) {
        const o = obj[key];
        if (typeof o === 'object' && !o.id) {
            reObject(o, posArr);
        }
        if (typeof o === 'object' && o.id) {
            var info = addToList(o.id, o.dir, key);
            if ($(`#${info.id}`).length === 0) {
                const x = o.pos.x ? o.pos.x : randomPos().x;
                const y = o.pos.y ? o.pos.y : randomPos().y;
                $(battery(info)).css({ top: y, left: x }).appendTo($('#content'));
                posArr.push({ batteryId: o.id, currX: x, currY: y });
            }
        }
    }
}
/**
 * 生成随机的坐标
 */
function randomPos() {
    return {
        x: Math.ceil(Math.random() * 600) + 50,
        y: Math.ceil(Math.random() * 600)
    }
}
/**
 * 根据数据生成bat的关系
 */
export function reRelations(obj, dev) {
    for (var key in obj) {
        const o = obj[key];
        if (typeof o === 'object' && !o.id) {
            reRelations(o, dev);
        }
        if (typeof o === 'object' && o.id) {
            buildRelations(o, dev);
        }
    }
}
function buildRelations(relation, dev) {
    const inputs = relation.input;
    const inputId = relation.id;
    
    inputs.forEach(input => {
        if (Array.isArray(input)) {
            fileToFileRelation(input, inputId);
        } else if (typeof input === 'string') {
            moduleToFileRelation(dev, input, inputId);
        }
    })
}
function moduleToFileRelation(dev, input,inputId) {
    //引用的为node_modules中的模块
    for (var key in dev) {
        if (dev[key].name === input) {
            const outputId = dev[key].id;
            createRelationPath(outputId, inputId);
        }
    }
}
function fileToFileRelation(input, inputId) {
    const relations = relationData().relations;
    var curr = relations[input[0]];
    for (var i = 1; i < input.length; i++) {
        const elem = input[i];
        curr = curr[elem];
        if (i === input.length - 1) {
            if (curr.id) {
                createRelationPath(curr.id, inputId);
            } else if (curr['index.js']) {
                createRelationPath(curr['index.js'].id, inputId);
            }
            
        }
    }
}

/**
 * outputId, inputId
 */
export function createRelationPath(outputId, inputId) {

    const fromText = $(`#${outputId} p.title`).text();
    const x1 = $(`#${outputId} .output`).offset().left + 6;
    const y1 = $(`#${outputId} .output`).offset().top + 6;

    const toText = $(`#${inputId} p.title`).text();
    const x2 = $(`#${inputId} .input`).offset().left + 6;
    const y2 = $(`#${inputId} .input`).offset().top + 6;

    const path = d3.select('#svg svg').append('path');
    path.attr('output', outputId).attr('start', `${x1},${y1}`);
    const id = outputId + inputId;
    path.attr('input', inputId).attr('end', `${x2},${y2}`).attr('id', id);
    path.attr('d', curveTo(x1, y1, x2, y2));
    pathText(`#${id}`, `${fromText} to ${toText}`);
}
