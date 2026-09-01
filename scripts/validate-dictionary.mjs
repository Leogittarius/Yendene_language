import fs from 'node:fs';
import { fileURLToPath } from 'node:url';


const dictionaryPath = fileURLToPath(
    new URL(
        '../src/data/dictionary.json',
        import.meta.url
    )
);


/* ========================================
   Allowed values
   ======================================== */

const ALLOWED_POS = new Set([
    'noun',
    'verb',
    'stative',
    'numeral',
    'pronoun',
    'function',
    'lightverb',
    'particle',
    'affix',
    'converb',
]);

const ALLOWED_ENTRY_TYPES = new Set([
    'word',
    'affix',
    'root',
    'clitic',
    'phrase',
]);

const ALLOWED_FORMATION_TYPES = new Set([
    'root',
    'simple',
    'derived',
    'compound',
    'reduplicated',
    'ideophonic',
    'opaque',
    'borrowed',
]);

const ALLOWED_STATUS = new Set([
    'draft',
    'established',
    'deprecated',
]);

const RELATION_TYPES = [
    'related',
    'synonyms',
    'antonyms',
    'derived',
];


/* ========================================
   Helpers
   ======================================== */

const errors = [];
const warnings = [];

function error(message) {
    errors.push(message);
}

function warning(message) {
    warnings.push(message);
}

function isObject(value) {
    return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
    );
}

function isNonEmptyString(value) {
    return (
        typeof value === 'string' &&
        value.trim().length > 0
    );
}

function entryName(entry, index) {
    if (isNonEmptyString(entry?.id)) {
        return `entries[${index}] (${entry.id})`;
    }

    return `entries[${index}]`;
}

function duplicateValues(values) {
    const seen = new Set();
    const duplicates = new Set();

    for (const value of values) {
        if (seen.has(value)) {
            duplicates.add(value);
        }

        seen.add(value);
    }

    return [...duplicates];
}

function glossPartCount(value) {
    return value
        .split('|')
        .map((part) => part.trim())
        .length;
}


/* ========================================
   Load JSON
   ======================================== */

let dictionary;

try {
    const raw = fs.readFileSync(
        dictionaryPath,
        'utf8'
    );

    dictionary = JSON.parse(raw);
}
catch (err) {
    console.error(
        '\n✗ 无法读取 dictionary.json。\n'
    );

    console.error(err.message);

    process.exit(1);
}


/* ========================================
   Top-level structure
   ======================================== */

if (!isObject(dictionary)) {
    error(
        'dictionary.json 顶层必须是一个对象。'
    );
}

if (!isObject(dictionary.meta)) {
    error(
        '缺少 meta 对象。'
    );
}

if (
    dictionary.meta &&
    dictionary.meta.schemaVersion !== 1
) {
    warning(
        `schemaVersion 当前为 ` +
        `${dictionary.meta.schemaVersion}，` +
        `校验器按 version 1 规则检查。`
    );
}

if (!Array.isArray(dictionary.entries)) {
    error(
        'entries 必须是一个数组。'
    );
}


/* ========================================
   Stop structural validation if entries
   is unavailable
   ======================================== */

if (!Array.isArray(dictionary.entries)) {
    printResult();
    process.exit(1);
}

const entries = dictionary.entries;


/* ========================================
   Collect IDs
   ======================================== */

const ids = [];

entries.forEach((entry, index) => {

    const where =
        entryName(entry, index);

    if (!isObject(entry)) {
        error(
            `${where}: 词条必须是对象。`
        );

        return;
    }

    if (!isNonEmptyString(entry.id)) {
        error(
            `${where}: 缺少有效 id。`
        );
    }
    else {
        ids.push(entry.id);

        if (!/^[a-z0-9-]+$/.test(entry.id)) {
            error(
                `${where}: id "${entry.id}" ` +
                `不是合法 slug。` +
                `只能使用小写 ASCII 字母、数字和短杠。`
            );
        }
    }

});

const duplicateIds =
    duplicateValues(ids);

duplicateIds.forEach((id) => {
    error(
        `存在重复 id: "${id}"。`
    );
});

const idSet =
    new Set(ids);


/* ========================================
   Validate each entry
   ======================================== */

entries.forEach((entry, index) => {

    if (!isObject(entry)) return;

    const where =
        entryName(entry, index);


    /* ---------- headword ---------- */

    if (!isNonEmptyString(entry.headword)) {
        error(
            `${where}: headword 不能为空。`
        );
    }


    /* ---------- entry type ---------- */

    if (!isNonEmptyString(entry.type)) {
        error(
            `${where}: 缺少 type。`
        );
    }
    else if (
        !ALLOWED_ENTRY_TYPES.has(entry.type)
    ) {
        error(
            `${where}: 未知 type ` +
            `"${entry.type}"。`
        );
    }


    /* ---------- POS ---------- */

    if (!Array.isArray(entry.pos)) {
        error(
            `${where}: pos 必须是数组。`
        );
    }
    else {

        const duplicatePos =
            duplicateValues(entry.pos);

        duplicatePos.forEach((pos) => {
            warning(
                `${where}: pos "${pos}" 重复。`
            );
        });

        entry.pos.forEach((pos) => {

            if (!ALLOWED_POS.has(pos)) {
                error(
                    `${where}: 未知词性 ` +
                    `"${pos}"。`
                );
            }

        });

        if (
            entry.type !== 'root' &&
            entry.pos.length === 0
        ) {
            warning(
                `${where}: pos 为空。`
            );
        }

    }


    /* ---------- senses ---------- */

    if (
        !Array.isArray(entry.senses) ||
        entry.senses.length === 0
    ) {
        error(
            `${where}: 至少需要一个 sense。`
        );
    }
    else {

        entry.senses.forEach(
            (sense, senseIndex) => {

                if (!isObject(sense)) {
                    error(
                        `${where}: senses[` +
                        `${senseIndex}] 必须是对象。`
                    );

                    return;
                }

                if (
                    !isNonEmptyString(
                        sense.definition
                    )
                ) {
                    error(
                        `${where}: senses[` +
                        `${senseIndex}].definition ` +
                        `不能为空。`
                    );
                }

            }
        );

    }


    /* ---------- formation ---------- */

    if (!isObject(entry.formation)) {
        error(
            `${where}: formation 必须是对象。`
        );
    }
    else {

        if (
            !ALLOWED_FORMATION_TYPES.has(
                entry.formation.type
            )
        ) {
            error(
                `${where}: 未知 formation.type ` +
                `"${entry.formation.type}"。`
            );
        }

        if (
            !Array.isArray(
                entry.formation.components
            )
        ) {
            error(
                `${where}: formation.components ` +
                `必须是数组。`
            );
        }
        else {

            entry.formation.components.forEach(
                (component, componentIndex) => {

                    const componentWhere =
                        `${where}: ` +
                        `formation.components[` +
                        `${componentIndex}]`;

                    if (!isObject(component)) {
                        error(
                            `${componentWhere} ` +
                            `必须是对象。`
                        );

                        return;
                    }

                    if (
                        !isNonEmptyString(
                            component.form
                        )
                    ) {
                        warning(
                            `${componentWhere}.form ` +
                            `为空。`
                        );
                    }

                    if (
                        isNonEmptyString(
                            component.ref
                        )
                    ) {

                        if (
                            !idSet.has(
                                component.ref
                            )
                        ) {
                            warning(
                                `${componentWhere}: ` +
                                `引用的 id "${component.ref}" ` +
                                `目前不存在，将显示为未解析引用。`
                            );
                        }

                        if (
                            component.ref ===
                            entry.id
                        ) {
                            warning(
                                `${componentWhere}: ` +
                                `构词成分引用了词条自身。`
                            );
                        }

                    }
                    else if (
                        isNonEmptyString(
                            component.form
                        )
                    ) {
                        warning(
                            `${componentWhere}: ` +
                            `"${component.form}" ` +
                            `没有 ref，因此无法生成跳转。`
                        );
                    }

                }
            );

        }

    }


    /* ---------- variants ---------- */

    if (!Array.isArray(entry.variants)) {
        error(
            `${where}: variants 必须是数组。`
        );
    }
    else {

        const variantForms = [];

        entry.variants.forEach(
            (variant, variantIndex) => {

                const variantWhere =
                    `${where}: variants[` +
                    `${variantIndex}]`;

                if (!isObject(variant)) {
                    error(
                        `${variantWhere} ` +
                        `必须是对象。`
                    );

                    return;
                }

                if (
                    !isNonEmptyString(
                        variant.form
                    )
                ) {
                    error(
                        `${variantWhere}.form ` +
                        `不能为空。`
                    );
                }
                else {
                    variantForms.push(
                        variant.form
                    );
                }

            }
        );

        duplicateValues(
            variantForms
        ).forEach((form) => {

            warning(
                `${where}: variant "${form}" ` +
                `重复。`
            );

        });

    }


    /* ---------- relations ---------- */

    if (!isObject(entry.relations)) {
        error(
            `${where}: relations 必须是对象。`
        );
    }
    else {

        RELATION_TYPES.forEach((type) => {

            const refs =
                entry.relations[type];

            if (!Array.isArray(refs)) {
                error(
                    `${where}: relations.${type} ` +
                    `必须是数组。`
                );

                return;
            }

            duplicateValues(refs)
                .forEach((ref) => {

                    warning(
                        `${where}: relations.${type} ` +
                        `重复引用 "${ref}"。`
                    );

                });

            refs.forEach((ref) => {

                if (!isNonEmptyString(ref)) {
                    error(
                        `${where}: relations.${type} ` +
                        `存在空引用。`
                    );

                    return;
                }

                if (!idSet.has(ref)) {
                    warning(
                        `${where}: relations.${type} ` +
                        `引用的 id "${ref}" ` +
                        `目前不存在，将显示为未解析引用。`
                    );
                }

                if (ref === entry.id) {
                    warning(
                        `${where}: relations.${type} ` +
                        `引用了词条自身。`
                    );
                }

            });

        });

    }


    /* ---------- examples ---------- */

    if (!Array.isArray(entry.examples)) {
        error(
            `${where}: examples 必须是数组。`
        );
    }
    else {

        entry.examples.forEach(
            (example, exampleIndex) => {

                const exampleWhere =
                    `${where}: examples[` +
                    `${exampleIndex}]`;

                if (!isObject(example)) {
                    error(
                        `${exampleWhere} ` +
                        `必须是对象。`
                    );

                    return;
                }

                if (
                    !isNonEmptyString(
                        example.source
                    )
                ) {
                    error(
                        `${exampleWhere}.source ` +
                        `不能为空。`
                    );
                }

                if (
                    !isNonEmptyString(
                        example.gloss
                    )
                ) {
                    error(
                        `${exampleWhere}.gloss ` +
                        `不能为空。`
                    );
                }

                if (
                    isNonEmptyString(
                        example.source
                    ) &&
                    isNonEmptyString(
                        example.gloss
                    )
                ) {

                    const sourceParts =
                        glossPartCount(
                            example.source
                        );

                    const glossParts =
                        glossPartCount(
                            example.gloss
                        );

                    if (
                        sourceParts !==
                        glossParts
                    ) {
                        error(
                            `${exampleWhere}: ` +
                            `source 有 ${sourceParts} 段，` +
                            `gloss 有 ${glossParts} 段。`
                        );
                    }

                }

            }
        );

    }


    /* ---------- status ---------- */

    if (!ALLOWED_STATUS.has(entry.status)) {
        error(
            `${where}: 未知 status ` +
            `"${entry.status}"。`
        );
    }


    /* ---------- tags ---------- */

    if (!Array.isArray(entry.tags)) {
        error(
            `${where}: tags 必须是数组。`
        );
    }
    else {

        duplicateValues(entry.tags)
            .forEach((tag) => {

                warning(
                    `${where}: 标签 "${tag}" 重复。`
                );

            });

        entry.tags.forEach((tag) => {

            if (!isNonEmptyString(tag)) {
                error(
                    `${where}: 存在空标签。`
                );

                return;
            }

            if (tag !== tag.trim()) {
                warning(
                    `${where}: 标签 "${tag}" ` +
                    `首尾包含空格。`
                );
            }

        });

    }

});


/* ========================================
   Result
   ======================================== */

printResult();

if (errors.length > 0) {
    process.exitCode = 1;
}


function printResult() {

    console.log(
        '\n=== Dictionary Validation ===\n'
    );

    if (warnings.length > 0) {

        console.log('Warnings:\n');

        warnings.forEach((message) => {
            console.log(`  ⚠ ${message}`);
        });

        console.log('');
    }

    if (errors.length > 0) {

        console.log('Errors:\n');

        errors.forEach((message) => {
            console.log(`  ✗ ${message}`);
        });

        console.log('');

        console.log(
            `Validation failed: ` +
            `${errors.length} error(s), ` +
            `${warnings.length} warning(s).\n`
        );

        return;
    }

    console.log(
        `✓ Validation passed: ` +
        `${entries.length} entries, ` +
        `${warnings.length} warning(s).\n`
    );
}