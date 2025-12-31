/**
 * 多轮性能测试脚本
 * 运行10次完整测试，收集所有数据用于统计分析
 */

const { execSync } = require('child_process');

const results = {
    'schema-dsl-simple': [],
    'Joi-simple': [],
    'Yup-simple': [],
    'Zod-simple': [],
    'Ajv-simple': [],
    'schema-dsl-complex': [],
    'Joi-complex': [],
    'Yup-complex': [],
    'Zod-complex': [],
    'Ajv-complex': []
};

console.log('\n🚀 开始运行10轮性能对比测试...\n');

for (let round = 1; round <= 10; round++) {
    console.log(`\n========== 第 ${round}/10 轮测试 ==========`);

    try {
        const output = execSync(
            'npx mocha test/performance/library-comparison.test.js --timeout 60000',
            { encoding: 'utf8', stdio: 'pipe' }
        );

        // 解析输出提取吞吐量数据
        const lines = output.split('\n');
        for (const line of lines) {
            // 简单验证
            if (line.includes('schema-dsl:') && line.includes('10000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['schema-dsl-simple'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Joi:') && line.includes('10000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Joi-simple'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Yup:') && line.includes('10000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Yup-simple'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Zod:') && line.includes('10000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Zod-simple'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Ajv:') && line.includes('10000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Ajv-simple'].push(parseInt(match[1].replace(/,/g, '')));
            }

            // 复杂验证
            if (line.includes('schema-dsl:') && line.includes('5000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['schema-dsl-complex'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Joi:') && line.includes('5000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Joi-complex'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Yup:') && line.includes('5000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Yup-complex'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Zod:') && line.includes('5000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Zod-complex'].push(parseInt(match[1].replace(/,/g, '')));
            }
            if (line.includes('Ajv:') && line.includes('5000次')) {
                const match = line.match(/吞吐量([\d,]+)次\/秒/);
                if (match) results['Ajv-complex'].push(parseInt(match[1].replace(/,/g, '')));
            }
        }

        console.log('✅ 完成');
    } catch (error) {
        console.log(`❌ 第${round}轮测试失败:`, error.message);
    }
}

// 计算统计数据
function calculateStats(data) {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, std: 0 };

    const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length;
    const std = Math.round(Math.sqrt(variance));

    return { avg, min, max, std };
}

console.log('\n\n📊 ========== 10轮测试汇总结果 ==========\n');

console.log('【简单验证性能】');
console.log('┌─────────────┬────────────────┬────────────────┬────────────────┬──────────┐');
console.log('│   验证库    │   平均吞吐量   │   最低吞吐量   │   最高吞吐量   │ 标准差   │');
console.log('├─────────────┼────────────────┼────────────────┼────────────────┼──────────┤');

const simpleLibs = ['schema-dsl', 'Joi', 'Yup', 'Zod', 'Ajv'];
simpleLibs.forEach(lib => {
    const stats = calculateStats(results[`${lib}-simple`]);
    console.log(`│ ${lib.padEnd(11)} │ ${stats.avg.toLocaleString().padStart(14)} │ ${stats.min.toLocaleString().padStart(14)} │ ${stats.max.toLocaleString().padStart(14)} │ ${stats.std.toLocaleString().padStart(8)} │`);
});
console.log('└─────────────┴────────────────┴────────────────┴────────────────┴──────────┘');

console.log('\n【复杂验证性能】');
console.log('┌─────────────┬────────────────┬────────────────┬────────────────┬──────────┐');
console.log('│   验证库    │   平均吞吐量   │   最低吞吐量   │   最高吞吐量   │ 标准差   │');
console.log('├─────────────┼────────────────┼────────────────┼────────────────┼──────────┤');

simpleLibs.forEach(lib => {
    const stats = calculateStats(results[`${lib}-complex`]);
    console.log(`│ ${lib.padEnd(11)} │ ${stats.avg.toLocaleString().padStart(14)} │ ${stats.min.toLocaleString().padStart(14)} │ ${stats.max.toLocaleString().padStart(14)} │ ${stats.std.toLocaleString().padStart(8)} │`);
});
console.log('└─────────────┴────────────────┴────────────────┴────────────────┴──────────┘');

// 计算相对性能
const dslSimple = calculateStats(results['schema-dsl-simple']).avg;
const dslComplex = calculateStats(results['schema-dsl-complex']).avg;

console.log('\n【性能对比分析】');
console.log(`schema-dsl 简单验证: ${(dslSimple / 10000).toFixed(1)}万次/秒`);
console.log(`schema-dsl 复杂验证: ${(dslComplex / 10000).toFixed(1)}万次/秒`);
console.log('');

simpleLibs.slice(1).forEach(lib => {
    const libSimple = calculateStats(results[`${lib}-simple`]).avg;
    const libComplex = calculateStats(results[`${lib}-complex`]).avg;
    const ratioSimple = (dslSimple / libSimple).toFixed(2);
    const ratioComplex = (dslComplex / libComplex).toFixed(2);

    console.log(`vs ${lib}:`);
    console.log(`  简单验证: ${libSimple > dslSimple ? '慢' : '快'} ${Math.abs(ratioSimple)}倍 (${(libSimple / 10000).toFixed(1)}万/秒)`);
    console.log(`  复杂验证: ${libComplex > dslComplex ? '慢' : '快'} ${Math.abs(ratioComplex)}倍 (${(libComplex / 10000).toFixed(1)}万/秒)`);
});

console.log('\n✅ 测试完成！\n');
